import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface MonthlySheetConfig {
  expectativas: Record<string, number>;
  situacoes: Record<string, 'Paga' | 'Pendente'>;
  vencimentos: Record<string, number>;
}

const EMPTY: MonthlySheetConfig = { expectativas: {}, situacoes: {}, vencimentos: {} };

// Cache em memória (fonte da verdade é a tabela monthly_sheet_config no Supabase)
const cache = new Map<string, MonthlySheetConfig>();
const listeners = new Set<() => void>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

const notify = () => listeners.forEach((l) => l());

export function subscribeSheetConfig(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getMonthSheetConfig(month: string): MonthlySheetConfig {
  return cache.get(month) || EMPTY;
}

export async function loadAllMonthlySheetConfigs(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data, error } = await supabase.from('monthly_sheet_config').select('*');
    if (error) throw error;
    (data || []).forEach((row: any) => {
      cache.set(row.mes_ano, {
        expectativas: row.expectativas || {},
        situacoes: row.situacoes || {},
        vencimentos: row.vencimentos || {},
      });
    });
    notify();
    await migrateLegacyLocalStorage();
  } catch (err: any) {
    console.warn('[MonthlySheetConfig] Erro ao carregar configurações do mês:', err?.message || err);
  }
}

// Migração única: envia ao Supabase o que estava salvo no navegador (chaves duarte_*) e limpa as chaves
async function migrateLegacyLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  const read = (key: string): any => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const globalVenc = read('duarte_vencimentos_config');
  let usedGlobal = false;

  for (let m = 1; m <= 12; m++) {
    const month = `2026-${String(m).padStart(2, '0')}`;
    const keys = [`duarte_expectativas_${month}`, `duarte_situacoes_${month}`, `duarte_vencimentos_${month}`];
    const exp = read(keys[0]);
    const sit = read(keys[1]);
    const venc = read(keys[2]);
    const hasLegacy = [exp, sit, venc].some((o) => o && Object.keys(o).length > 0);
    const existing = cache.get(month);
    const alreadyHas =
      existing && (Object.keys(existing.situacoes).length > 0 || Object.keys(existing.expectativas).length > 0);

    if (!hasLegacy || alreadyHas) {
      // nada a migrar ou já existe no Supabase: apenas limpa chaves antigas se o mês já está salvo
      if (alreadyHas) keys.forEach((k) => localStorage.removeItem(k));
      continue;
    }

    const cfg: MonthlySheetConfig = {
      expectativas: exp || {},
      situacoes: sit || {},
      vencimentos: venc && Object.keys(venc).length > 0 ? venc : globalVenc || {},
    };
    if (!venc && globalVenc) usedGlobal = true;

    const { error } = await supabase.from('monthly_sheet_config').upsert(
      {
        mes_ano: month,
        expectativas: cfg.expectativas,
        situacoes: cfg.situacoes,
        vencimentos: cfg.vencimentos,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'mes_ano' }
    );
    if (error) {
      console.warn('[MonthlySheetConfig] Migração falhou (dados antigos preservados no navegador):', error.message);
      return;
    }
    cache.set(month, cfg);
    keys.forEach((k) => localStorage.removeItem(k));
  }
  if (usedGlobal) localStorage.removeItem('duarte_vencimentos_config');
  notify();
}

// Atualiza o cache imediatamente e grava no Supabase com debounce
export function saveMonthSheetConfig(month: string, patch: Partial<MonthlySheetConfig>): void {
  const next: MonthlySheetConfig = { ...getMonthSheetConfig(month), ...patch };
  cache.set(month, next);
  notify();

  if (!isSupabaseConfigured) return;
  const prev = saveTimers.get(month);
  if (prev) clearTimeout(prev);
  saveTimers.set(
    month,
    setTimeout(async () => {
      saveTimers.delete(month);
      const cfg = getMonthSheetConfig(month);
      const { error } = await supabase.from('monthly_sheet_config').upsert(
        {
          mes_ano: month,
          expectativas: cfg.expectativas,
          situacoes: cfg.situacoes,
          vencimentos: cfg.vencimentos,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'mes_ano' }
      );
      if (error) console.warn('[MonthlySheetConfig] Erro ao salvar no Supabase:', error.message);
    }, 400)
  );
}
