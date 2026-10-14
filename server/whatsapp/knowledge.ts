import { supabaseServer, isSupabaseServerConfigured } from '../supabase';
import { mapSubcategoryToId, subcategoryIdToName } from '../../src/shared/taxonomy';
import { normKey, tokens, similarity } from './normalize';

/**
 * Conhecimento aprendido do banco (últimos 90 dias): estabelecimentos
 * canônicos, subcategoria/ticket típicos, contas fixas e dados de
 * combustível. Somente leitura, cache de 30 min, e qualquer falha devolve
 * conhecimento vazio — o bot funciona igual, só sem as dicas aprendidas.
 */

export interface PlaceKnowledge {
  key: string;
  nome: string;
  subcategoriaId: string;
  /** Subcategoria só é "confiável" para sobrescrever a IA com n≥2 e ≥70% de consistência. */
  reliable: boolean;
  n: number;
  median: number;
  min: number;
  max: number;
}

export interface FuelKnowledge {
  lastKm?: number;
  priceMin?: number;
  priceMax?: number;
  commonFuel?: string;
}

export interface Knowledge {
  places: PlaceKnowledge[];
  fuel: FuelKnowledge;
  loadedAt: number;
}

const CACHE_MS = 30 * 60 * 1000;
const FIXED_BILL_SUBS = new Set([
  'sub-aluguel', 'sub-condominio', 'sub-internet', 'sub-rastreador', 'sub-seguro',
  'sub-luz', 'sub-agua', 'sub-gas', 'sub-placa-solar', 'sub-youtube-premium', 'sub-amazon-music',
]);

/** Rótulos genéricos digitados na planilha ("no merkado", "supermercado") — não identificam um lugar. */
const GENERIC_PLACE_KEYS = new Set(['no merkado', 'merkado', 'mercado', 'supermercado', 'restaurante', 'estacionamento', 'lanchonete', 'padaria', 'farmacia', 'combustivel', 'gasolina']);

let cache: Knowledge | null = null;
const EMPTY: Knowledge = { places: [], fuel: {}, loadedAt: 0 };

export function invalidateKnowledge(): void {
  cache = null;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mode<T>(items: T[]): { value: T; count: number } | undefined {
  const counts = new Map<T, number>();
  for (const it of items) counts.set(it, (counts.get(it) || 0) + 1);
  let best: { value: T; count: number } | undefined;
  for (const [value, count] of counts) if (!best || count > best.count) best = { value, count };
  return best;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(ltda|s\/?a|me|epp|eireli)\b\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function pickDisplayName(variants: string[], establishmentNames: Map<string, string>, key: string): string {
  const fromTable = establishmentNames.get(key);
  if (fromTable) return fromTable === fromTable.toUpperCase() ? titleCase(fromTable) : fromTable;
  const best = mode(variants)?.value || variants[0];
  const needsClean = (best === best.toUpperCase() && /[A-Z]/.test(best)) || /ltda|\bs\/?a\b/i.test(best);
  return needsClean ? titleCase(best) : best;
}

export async function getKnowledge(force = false): Promise<Knowledge> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_MS) return cache;
  if (!isSupabaseServerConfigured) return EMPTY;

  try {
    const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

    const [txRes, estRes, fuelRes] = await Promise.all([
      supabaseServer
        .from('transactions')
        .select('valor, estabelecimento_nome, subcategoria_id')
        .gte('data', since)
        .limit(3000),
      supabaseServer.from('establishments').select('nome, tipo').limit(500),
      supabaseServer
        .from('fuel_logs')
        .select('combustivel, preco_litro, km_atual')
        .gte('data', since)
        .limit(500),
    ]);

    const establishmentNames = new Map<string, string>();
    const establishmentTypes = new Map<string, string>();
    for (const e of estRes.data || []) {
      const k = normKey(e.nome);
      if (k && !GENERIC_PLACE_KEYS.has(k)) {
        const current = establishmentNames.get(k);
        const isCaps = (n: string) => n === n.toUpperCase() && /[A-Z]/.test(n);
        if (!current || (isCaps(current) && !isCaps(e.nome))) establishmentNames.set(k, e.nome);
        establishmentTypes.set(k, e.tipo);
      }
    }

    // 1) agrupar transações por chave normalizada
    const groups = new Map<string, { variants: string[]; subs: string[]; values: number[] }>();
    for (const t of txRes.data || []) {
      const key = normKey(t.estabelecimento_nome || '');
      if (!key || GENERIC_PLACE_KEYS.has(key)) continue;
      const g = groups.get(key) || { variants: [], subs: [], values: [] };
      g.variants.push(t.estabelecimento_nome);
      if (t.subcategoria_id) g.subs.push(t.subcategoria_id);
      g.values.push(Number(t.valor) || 0);
      groups.set(key, g);
    }

    // 2) fundir "ferreira" ⊂ "f m ferreira sousa" (nome curto contido no longo)
    const keys = [...groups.keys()].sort((a, b) => tokens(a).length - tokens(b).length || a.length - b.length);
    const merged = new Map<string, { variants: string[]; subs: string[]; values: number[] }>();
    for (const key of keys) {
      const g = groups.get(key)!;
      let target: string | undefined;
      for (const existing of merged.keys()) {
        const et = tokens(existing);
        const kt = tokens(key);
        if (existing.length >= 5 && et.every((tok) => kt.includes(tok))) {
          target = existing;
          break;
        }
      }
      const dest = target ? merged.get(target)! : { variants: [], subs: [], values: [] };
      dest.variants.push(...g.variants);
      dest.subs.push(...g.subs);
      dest.values.push(...g.values);
      merged.set(target || key, dest);
    }

    const places: PlaceKnowledge[] = [];
    for (const [key, g] of merged) {
      const sub = mode(g.subs);
      const n = g.values.length;
      places.push({
        key,
        nome: pickDisplayName(g.variants, establishmentNames, key),
        subcategoriaId: sub?.value || mapSubcategoryToId(establishmentTypes.get(key)),
        reliable: !!sub && n >= 2 && sub.count / g.subs.length >= 0.7,
        n,
        median: median(g.values),
        min: Math.min(...g.values),
        max: Math.max(...g.values),
      });
    }

    // estabelecimentos cadastrados sem transação recente: só servem pra padronizar o nome
    for (const [key, nome] of establishmentNames) {
      const kt = tokens(key);
      if (places.some((p) => p.key === key || (p.key.length >= 5 && tokens(p.key).every((tok) => kt.includes(tok))))) continue;
      places.push({
        key,
        nome,
        subcategoriaId: mapSubcategoryToId(establishmentTypes.get(key)),
        reliable: false,
        n: 0,
        median: 0,
        min: 0,
        max: 0,
      });
    }

    const fuelRows = fuelRes.data || [];
    const prices = fuelRows.map((f) => Number(f.preco_litro)).filter((p) => p > 0);
    const kms = fuelRows.map((f) => Number(f.km_atual)).filter((k) => k > 0);
    const fuel: FuelKnowledge = {
      lastKm: kms.length ? Math.max(...kms) : undefined,
      priceMin: prices.length ? Math.min(...prices) : undefined,
      priceMax: prices.length ? Math.max(...prices) : undefined,
      commonFuel: mode(fuelRows.map((f) => f.combustivel).filter(Boolean))?.value,
    };

    cache = { places, fuel, loadedAt: Date.now() };
    console.log(`[WhatsApp] Conhecimento carregado: ${places.length} lugares, último km ${fuel.lastKm ?? '?'}.`);
    return cache;
  } catch (err: any) {
    console.warn('[WhatsApp] Falha ao carregar conhecimento aprendido (seguindo sem ele):', err?.message || err);
    return EMPTY;
  }
}

/** Bloco injetado nos prompts do Gemini. Vazio se não houver nada aprendido. */
export async function knowledgePromptBlock(): Promise<string> {
  const k = await getKnowledge();
  if (!k.places.length) return '';

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const frequent = k.places
    .filter((p) => p.n > 0 && !FIXED_BILL_SUBS.has(p.subcategoriaId))
    .sort((a, b) => b.n - a.n)
    .slice(0, 40)
    .map((p) => `- "${p.nome}" → ${p.subcategoriaId} (${subcategoryIdToName(p.subcategoriaId)})${p.n >= 2 ? `, ticket típico ${fmt(p.median)}` : ''}`);

  const bestBySub = new Map<string, PlaceKnowledge>();
  for (const p of k.places) {
    if (p.n === 0 || !FIXED_BILL_SUBS.has(p.subcategoriaId)) continue;
    const cur = bestBySub.get(p.subcategoriaId);
    if (!cur || p.n > cur.n) bestBySub.set(p.subcategoriaId, p);
  }
  const fixed = [...bestBySub.values()].map((p) => `- ${subcategoryIdToName(p.subcategoriaId)} (${p.nome}): ${fmt(p.median)}/mês`);

  const fuelLine = [
    k.fuel.lastKm ? `último km registrado ${k.fuel.lastKm.toLocaleString('pt-BR')}` : '',
    k.fuel.priceMin && k.fuel.priceMax ? `preço/L típico ${fmt(k.fuel.priceMin)}–${fmt(k.fuel.priceMax)}` : '',
    k.fuel.commonFuel ? `combustível mais usado: ${k.fuel.commonFuel}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  return `CONHECIMENTO DO CASAL (aprendido dos últimos 90 dias — use SEMPRE o nome exato e a subcategoria destes lugares quando a mensagem se referir a eles, mesmo com grafia diferente):
Lugares frequentes:
${frequent.join('\n')}
${fixed.length ? `Contas fixas mensais:\n${fixed.join('\n')}\n` : ''}${fuelLine ? `Combustível: ${fuelLine}.\n` : ''}Se o lugar não estiver nesta lista, use o nome como foi dito/lido.`;
}

/** Acha o lugar conhecido: chave igual → contida → muito parecida (≥ 0,82). */
export function matchPlace(k: Knowledge, name: string): PlaceKnowledge | undefined {
  const key = normKey(name);
  if (!key || GENERIC_PLACE_KEYS.has(key)) return undefined;
  const exact = k.places.find((p) => p.key === key);
  if (exact) return exact;

  const kt = tokens(key);
  const contained = k.places.find((p) => p.key.length >= 5 && tokens(p.key).every((tok) => kt.includes(tok)));
  if (contained) return contained;

  let best: PlaceKnowledge | undefined;
  let bestScore = 0.82;
  for (const p of k.places) {
    const s = similarity(key, p.key);
    if (s >= bestScore) {
      best = p;
      bestScore = s;
    }
  }
  return best;
}

/**
 * Sugere o lugar mais provável para um comprovante sem nome (maquininha):
 * lugares cujo ticket habitual cobre o valor, com preferência pela
 * subcategoria dada. Só sugere com pelo menos 2 ocorrências aprendidas.
 */
export function suggestPlace(k: Knowledge, valor: number, preferSub?: string): PlaceKnowledge | undefined {
  const candidates = k.places
    .filter((p) => p.n >= 2 && valor >= p.min * 0.9 && valor <= p.max * 1.1 && (!preferSub || p.subcategoriaId === preferSub))
    .sort((a, b) => Math.abs(valor - a.median) - Math.abs(valor - b.median));
  return candidates[0];
}
