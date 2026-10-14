import { randomUUID } from 'node:crypto';

/** Fuso do casal (Teresina): UTC-3 sem horário de verão. */
export const LOCAL_TZ = 'America/Fortaleza';

/** Data de hoje (YYYY-MM-DD) no fuso local — `toISOString()` usa UTC e vira o dia às 21h. */
export function localToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: LOCAL_TZ });
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export const DEFAULT_PAYMENT = 'Cartão conjunto Inter';

/**
 * Forma de pagamento padrão do grupo = cartão conjunto (crédito). Só muda
 * quando a pessoa disse explicitamente outra forma (Gemini devolve
 * `null`/`cartao` quando nada foi dito — ver EXPENSE_JSON_FORMAT).
 */
export function canonicalPayment(explicit?: string | null): string {
  const v = (explicit || '').toLowerCase();
  if (/d[eé]bito|debito/.test(v)) return 'Cartão conjunto Inter - Débito';
  if (/pix/.test(v)) return 'PIX';
  if (/dinheiro|esp[eé]cie/.test(v)) return 'Dinheiro';
  return DEFAULT_PAYMENT;
}

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Chave de comparação de estabelecimento: sem acento/caixa/sufixos societários/"posto". */
export function normKey(name: string): string {
  return stripAccents(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(ltda|sa|s a|me|epp|eireli|cia|comercio|de|da|do|dos|das|e)\b/g, ' ')
    .replace(/\bposto\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(key: string): string[] {
  return key.split(' ').filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / max;
}

/**
 * Nome que não identifica um lugar de verdade: marca de maquininha/adquirente
 * (ver REGRA ANTI-MAQUININHA do prompt) OU um dos placeholders que o próprio
 * código devolve quando não consegue extrair nada — ex.: "Estabelecimento
 * Identificado" em src/services/receiptNormalizer.ts:91/325 (nome irônico:
 * na prática significa "NÃO identificado", é o fallback de falha).
 */
export function isGenericAcquirerName(name?: string): boolean {
  const k = stripAccents(name || '').toLowerCase().trim();
  if (!k || k === 'wpp' || k.length <= 3) return true;
  if (/^(pos|tef|cartao|credito|debito|maquininha|comprovante|despesa|stone|cielo|rede|getnet|pagseguro|pagbank|sumup|safra|vero|ton|infinitepay|moderninha|mercado pago)\b/.test(k)) return true;
  return /n[ãa]o identificad|desconhecid|indefinid|sem (identifica|nome)|estabelecimento identificad|ilegivel|ilegível/.test(k);
}

/** Todos os números de um texto pt-BR: "1.234,56", "126.950", "33,90", "40". */
export function parseNumbers(text: string): number[] {
  const out: number[] = [];
  for (const raw of text.match(/\d[\d.,]*/g) || []) {
    let t = raw.replace(/[.,]+$/, '');
    if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (t.includes(',')) t = t.replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const n = Number(t);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export function parseFirstNumber(text: string): number | undefined {
  return parseNumbers(text)[0];
}

/** "40 litros e km 126.950" → { litros: 40, km: 126950 }. */
export function parseLitrosKm(text: string): { litros?: number; km?: number } {
  const t = text.toLowerCase();
  const litrosM = t.match(/(\d[\d.,]*)\s*(?:l\b|lt|litros?)/);
  const kmM = t.match(/km\s*[:=]?\s*(\d[\d.,]*)/) || t.match(/(\d[\d.,]*)\s*km/);
  let litros = litrosM ? parseNumbers(litrosM[1])[0] : undefined;
  let km = kmM ? parseNumbers(kmM[1])[0] : undefined;

  if (litros === undefined || km === undefined) {
    const nums = parseNumbers(t).filter((n) => n !== litros && n !== km);
    for (const n of nums) {
      if (km === undefined && n >= 1000) km = n;
      else if (litros === undefined && n > 0 && n < 150) litros = n;
    }
  }
  return { litros, km };
}

export function isYes(text: string): boolean {
  return /^\s*(sim|s|ok(ay)?|isso|certo|confirmo|confirmado|exato|correto|👍)\b/i.test(text) || /^\s*👍/.test(text);
}

export function isNo(text: string): boolean {
  return /^\s*(n[ãa]o|nao|cancela|cancelar|errado|apaga)\b/i.test(text);
}
