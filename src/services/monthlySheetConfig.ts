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
  } catch (err: any) {
    console.warn('[MonthlySheetConfig] Erro ao carregar configurações do mês:', err?.message || err);
  }
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
