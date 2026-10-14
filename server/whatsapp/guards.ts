import { supabaseServer, isSupabaseServerConfigured } from '../supabase';
import { SUBCATEGORY_TAXONOMY } from '../../src/shared/taxonomy';
import type { AnalyzedReceipt } from '../receiptAnalyzer';
import type { Knowledge, PlaceKnowledge } from './knowledge';
import { normKey } from './normalize';

export interface DuplicateInfo {
  estabelecimento: string;
  data: string;
}

/** Já existe transação com mesmo valor e lugar parecido, no dia ±1? (consulta direta, sem cache) */
export async function findDuplicate(valor: number, data: string, nome: string): Promise<DuplicateInfo | undefined> {
  if (!isSupabaseServerConfigured || !(valor > 0)) return undefined;
  try {
    const d = new Date(`${data}T12:00:00Z`);
    const from = new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
    const to = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
    const { data: rows } = await supabaseServer
      .from('transactions')
      .select('estabelecimento_nome, data')
      .eq('valor', valor)
      .gte('data', from)
      .lte('data', to)
      .limit(10);
    const key = normKey(nome);
    const hit = (rows || []).find((r) => {
      const rk = normKey(r.estabelecimento_nome || '');
      return rk && key && (rk === key || rk.includes(key) || key.includes(rk));
    });
    return hit ? { estabelecimento: hit.estabelecimento_nome, data: hit.data } : undefined;
  } catch {
    return undefined;
  }
}

/** Garante campos válidos antes de salvar (Gemini às vezes devolve null/ids inexistentes). */
export function sanitizeAnalyzed(a: AnalyzedReceipt): AnalyzedReceipt {
  const validSub = SUBCATEGORY_TAXONOMY.some((s) => s.id === a.subcategoria_id);
  return {
    ...a,
    subcategoria_id: validSub ? a.subcategoria_id : 'sub-eventualidades',
    valorTotal: Number.isFinite(a.valorTotal) ? Math.round(a.valorTotal * 100) / 100 : 0,
  };
}

export type KmIssue = { kind: 'lower' | 'jump'; lastKm: number };

export function kmIssue(km: number | undefined, lastKm: number | undefined): KmIssue | undefined {
  if (!km || !lastKm) return undefined;
  if (km < lastKm) return { kind: 'lower', lastKm };
  if (km - lastKm > 2000) return { kind: 'jump', lastKm };
  return undefined;
}

/** Avisos exibidos na confirmação (não bloqueiam; auto-confirmação em 10 min continua valendo). */
export function buildWarnings(a: AnalyzedReceipt, place: PlaceKnowledge | undefined, k: Knowledge, duplicate?: DuplicateInfo): string[] {
  const out: string[] = [];
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  if (place && place.n >= 3 && a.valorTotal > place.median * 3) {
    out.push(`⚠️ Valor bem acima do normal em ${place.nome} (típico ${fmt(place.median)}). Confere?`);
  } else if (a.valorTotal > 1500 && !(place && place.n >= 2)) {
    out.push('⚠️ Valor alto (acima de R$ 1.500). Confere?');
  }

  if (a.tipoDespesa === 'combustivel' && a.precoPorLitro && (a.precoPorLitro < 5 || a.precoPorLitro > 9)) {
    out.push(`⚠️ Preço por litro estranho (${fmt(a.precoPorLitro)}/L). Confere litros e valor?`);
  }

  if (duplicate) {
    out.push(`🔁 Parece já registrada: ${duplicate.estabelecimento} em ${duplicate.data.split('-').reverse().join('/')} com o mesmo valor.`);
  }

  void k;
  return out;
}
