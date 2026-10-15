import { GoogleGenAI } from '@google/genai';
import { normalizeReceiptData } from '../src/services/receiptNormalizer.js';
import { buildTaxonomyPromptBlock, mapCategoryToId, subcategoryIdToName } from '../src/shared/taxonomy.js';
import { supabaseServer, isSupabaseServerConfigured } from './supabase.js';

/**
 * Substitui o diretório KNOWN_CNPJS hardcoded: consulta a tabela
 * `establishments` do Supabase por CNPJ e, se o estabelecimento for novo,
 * grava-o automaticamente para já vir mapeado na próxima leitura.
 */
async function lookupOrRegisterEstablishment(
  cnpj: string | undefined,
  fallbackNome: string,
  fallbackTipo: string
): Promise<{ nome: string; tipo: string } | null> {
  if (!cnpj || !isSupabaseServerConfigured) return null;
  const numericCnpj = cnpj.replace(/\D/g, '');
  if (!numericCnpj) return null;

  try {
    const { data } = await supabaseServer
      .from('establishments')
      .select('nome, tipo')
      .eq('cnpj', numericCnpj)
      .maybeSingle();

    if (data) return { nome: data.nome, tipo: data.tipo };

    // Estabelecimento novo: registra para a próxima leitura já vir direto do banco
    const id = `est-${numericCnpj}`;
    await supabaseServer.from('establishments').upsert(
      { id, nome: fallbackNome, tipo: fallbackTipo, cnpj: numericCnpj },
      { onConflict: 'id' }
    );
    return null;
  } catch (err: any) {
    console.warn('[ReceiptAnalyzer] Erro ao consultar/registrar estabelecimento:', err?.message || err);
    return null;
  }
}

// =====================================================================
// Módulo ÚNICO de OCR fiscal (substitui as implementações duplicadas que
// existiam em server.ts, api/scan-receipt.ts, api/scan-fuel-receipt.ts
// e server/gemini.ts). Usado pelos endpoints /api/scan-receipt e
// /api/scan-fuel-receipt, tanto em dev (server.ts) quanto em produção
// (Vercel serverless em api/*.ts).
//
// Estratégia de velocidade: 1 modelo primário com timeout curto; só
// tenta um 2º modelo se o 1º efetivamente falhar (nunca os dois "por
// garantia"). Isso evita as 4 chamadas sequenciais de visão computacional
// que tornavam o scanner lento.
// =====================================================================

/**
 * Cadeia de modelos, do mais rápido/barato ao mais pesado. A cota do Gemini é
 * contada POR PROJETO E POR MODELO (RPM/TPM/RPD) — alternar entre modelos
 * multiplica a capacidade, principalmente no plano gratuito, onde a cota
 * diária de um modelo costuma acabar (erro 429 "GenerateRequestsPerDayPerProject
 * PerModel-FreeTier"). Medido na prática com comprovante real: flash-lite
 * responde em ~2s (imagem e áudio) com os mesmos dados corretos; já o
 * gemini-2.5-flash/3.6-flash com "thinking" padrão gastavam 2.000+ tokens de
 * raciocínio (≈13s) e estouravam o timeout. Dá pra trocar a lista sem mexer no
 * código: GEMINI_MODELS="modelo1,modelo2,...".
 */
const DEFAULT_MODEL_CHAIN = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.6-flash'];

function modelChain(): string[] {
  const fromEnv = (process.env.GEMINI_MODELS || '').split(',').map((m) => m.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_MODEL_CHAIN;
}

const TIMEOUT_MS = 20_000;
/** Orçamento total por análise (todas as tentativas/modelos somados). */
const DEADLINE_MS = 45_000;

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiInstance;
}

export function cleanBase64Payload(raw: string, fallbackMime = 'image/jpeg'): { data: string; mimeType: string } {
  let data = raw;
  let mimeType = fallbackMime;
  if (raw.includes('base64,')) {
    const [header, body] = raw.split('base64,');
    data = body;
    const match = header.match(/data:([^;]+);/);
    if (match) mimeType = match[1];
  }
  return { data, mimeType };
}

function stripJsonFences(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return cleaned;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ParsedGeminiError {
  code?: number;
  message: string;
  retryAfterMs?: number;
  quotaId?: string;
}

/** O SDK devolve o corpo do erro da API como JSON dentro de `err.message`. */
function parseGeminiError(err: any): ParsedGeminiError {
  const raw = String(err?.message || err || '');
  let body: any;
  try {
    body = JSON.parse(raw)?.error;
  } catch {}
  const details: any[] = body?.details || [];
  const retryDelay = details.find((d) => String(d?.['@type']).includes('RetryInfo'))?.retryDelay;
  const quotaId = details.find((d) => String(d?.['@type']).includes('QuotaFailure'))?.violations?.[0]?.quotaId;
  return {
    code: body?.code ?? err?.status,
    message: body?.message || raw,
    retryAfterMs: retryDelay ? Math.round(parseFloat(String(retryDelay)) * 1000) : undefined,
    quotaId,
  };
}

/** Cota esgotada (429): por minuto (volta logo) ou DIÁRIA (volta só à meia-noite do Pacífico). */
export class GeminiQuotaError extends Error {
  constructor(public daily: boolean, public retryAfterMs: number, public model: string) {
    super(`Cota do Gemini esgotada (${daily ? 'diária' : 'por minuto'}) em ${model}; libera em ~${Math.ceil(retryAfterMs / 60000)} min.`);
    this.name = 'GeminiQuotaError';
  }
}

export function isGeminiQuotaError(err: any): boolean {
  return err instanceof GeminiQuotaError || parseGeminiError(err).code === 429 || /RESOURCE_EXHAUSTED/.test(String(err?.message || ''));
}

/**
 * Instabilidade TEMPORÁRIA do lado do Gemini (503 "high demand", ou nosso
 * próprio timeout/abort) — não é problema do conteúdo enviado e não é cota
 * (429 é tratado à parte: ver isGeminiQuotaError).
 */
export function isGeminiBusyError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return !isGeminiQuotaError(err) && (msg.includes('"code":503') || msg.includes('UNAVAILABLE') || msg.includes('aborted') || err?.status === 503);
}

/** Estado em memória: modelo indisponível até quando, e por quê. */
const unavailable = new Map<string, { until: number; kind: 'quota' | 'busy' | 'hard' }>();
/** Nível de "thinking" que cada modelo aceita (3.x usa nível; 2.5 usa orçamento 0). */
const thinkingOverride = new Map<string, 'LOW' | 'NONE'>();

function thinkingConfigFor(model: string): any {
  const override = thinkingOverride.get(model);
  if (override === 'NONE') return undefined;
  if (/gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  // Extração estruturada não precisa de raciocínio longo; o padrão gastava milhares de tokens/segundos.
  return { thinkingLevel: override ?? 'MINIMAL' };
}

async function callOnce(ai: GoogleGenAI, model: string, parts: any[], systemInstruction: string | undefined, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
        thinkingConfig: thinkingConfigFor(model),
        abortSignal: controller.signal,
      },
    });
    return response.text && response.text.trim() ? response.text : null;
  } finally {
    clearTimeout(timer);
  }
}

/** Alguns modelos recusam certos níveis de thinking (400) — rebaixa o nível e tenta o mesmo modelo de novo. */
async function callWithThinkingFallback(ai: GoogleGenAI, model: string, parts: any[], systemInstruction: string | undefined, timeoutMs: number) {
  for (let i = 0; i < 3; i++) {
    try {
      return await callOnce(ai, model, parts, systemInstruction, timeoutMs);
    } catch (err: any) {
      const info = parseGeminiError(err);
      if (info.code === 400 && /thinking/i.test(info.message)) {
        const current = thinkingOverride.get(model);
        if (!current) thinkingOverride.set(model, 'LOW');
        else if (current === 'LOW') thinkingOverride.set(model, 'NONE');
        else throw err;
        console.warn(`[Gemini] ${model} não aceita esse nível de thinking — ajustando e tentando de novo.`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`${model}: não foi possível configurar o thinking.`);
}

/**
 * Chama o Gemini percorrendo a cadeia de modelos. Caminho feliz: 1 chamada,
 * sem espera. Regras:
 * - 429 (cota): NÃO tenta de novo o mesmo modelo (só gastaria mais cota) —
 *   marca o modelo como indisponível pelo tempo informado pela API (lembra
 *   entre chamadas, então os próximos pedidos já pulam direto) e passa pro
 *   próximo, que tem cota própria.
 * - 503/timeout: passa pro próximo e, se a rodada inteira falhou por
 *   instabilidade, faz UMA segunda rodada depois de ~2s.
 * - Nunca passa do orçamento total (DEADLINE_MS).
 * Se só houve cota esgotada, lança GeminiQuotaError (o bot explica o motivo).
 *
 * Genérico para qualquer `parts` multimodal (imagem, áudio ou só texto).
 */
async function callGeminiMultimodal(
  ai: GoogleGenAI,
  parts: any[],
  systemInstruction?: string,
  timeoutMs: number = TIMEOUT_MS,
  deadlineMs: number = DEADLINE_MS
): Promise<string> {
  const started = Date.now();
  const chain = modelChain();
  let lastError: any = null;
  let quotaError: GeminiQuotaError | null = null;
  let sawBusy = false;

  for (let pass = 0; pass < 2; pass++) {
    for (const model of chain) {
      const u = unavailable.get(model);
      if (u && u.until > Date.now() && !(pass === 1 && u.kind === 'busy')) continue;
      if (Date.now() - started > deadlineMs) break;

      try {
        const text = await callWithThinkingFallback(ai, model, parts, systemInstruction, timeoutMs);
        if (text) {
          unavailable.delete(model);
          return text;
        }
        lastError = new Error(`${model} devolveu resposta vazia.`);
      } catch (err: any) {
        lastError = err;
        const info = parseGeminiError(err);

        if (info.code === 429) {
          const retryMs = info.retryAfterMs ?? 60_000;
          const daily = /PerDay/i.test(info.quotaId || '') || retryMs > 10 * 60_000;
          unavailable.set(model, { until: Date.now() + Math.min(retryMs, 24 * 3600_000), kind: 'quota' });
          quotaError = new GeminiQuotaError(daily, retryMs, model);
          console.warn(`[Gemini] ${model}: cota ${daily ? 'DIÁRIA' : 'por minuto'} esgotada (${info.quotaId || '429'}) — pulando por ~${Math.ceil(retryMs / 60000)} min.`);
        } else if (isGeminiBusyError(err)) {
          sawBusy = true;
          unavailable.set(model, { until: Date.now() + 15_000, kind: 'busy' });
          console.warn(`[Gemini] ${model} instável/lento (${info.message.slice(0, 90)}) — tentando o próximo modelo.`);
        } else {
          // 404 (modelo inexistente p/ esta chave), 400 etc.: não adianta insistir por um bom tempo.
          unavailable.set(model, { until: Date.now() + 30 * 60_000, kind: 'hard' });
          console.warn(`[Gemini] ${model} indisponível (${info.code ?? ''} ${info.message.slice(0, 90)}) — pulando por 30 min.`);
        }
      }
    }

    if (pass === 0) {
      if (!sawBusy || Date.now() - started > deadlineMs) break;
      await sleep(1500 + Math.floor(Math.random() * 700));
    }
  }

  // Nenhum modelo foi tentado porque todos estavam em "cooldown" de cota?
  if (!lastError) {
    const quotaEntries = [...unavailable.entries()].filter(([, v]) => v.kind === 'quota' && v.until > Date.now());
    if (quotaEntries.length) {
      const [model, v] = quotaEntries.sort((a, b) => a[1].until - b[1].until)[0];
      const retryMs = v.until - Date.now();
      throw new GeminiQuotaError(retryMs > 10 * 60_000, retryMs, model);
    }
  }
  if (quotaError && !sawBusy) throw quotaError;
  throw lastError || new Error('Nenhum modelo Gemini retornou resultado.');
}

/**
 * Chama o Gemini e faz o parse do JSON. Resposta que não é JSON válido
 * (acontece, raramente) ganha 1 nova chamada; se falhar de novo, vira erro de
 * instabilidade (marcador "UNAVAILABLE") para o bot avisar que foi o Gemini
 * e não o conteúdo da mensagem.
 */
async function callAndParse(ai: GoogleGenAI, parts: any[], systemInstruction?: string, timeoutMs?: number): Promise<any> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const rawText = await callGeminiMultimodal(ai, parts, systemInstruction, timeoutMs);
    try {
      return JSON.parse(stripJsonFences(rawText));
    } catch {
      console.warn(`[ReceiptAnalyzer] Resposta do Gemini não era JSON válido (tentativa ${attempt}/2).`);
    }
  }
  throw new Error('UNAVAILABLE: o Gemini devolveu uma resposta inválida duas vezes.');
}

export interface AnalyzedReceiptItem {
  nome: string;
  codigoEan?: string;
  categoriaItem?: string;
  subcategoria_id?: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  desmembrado?: boolean;
  motivoDesmembramento?: string;
}

export interface AnalyzedReceipt {
  estabelecimento: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  tipoEstabelecimento: string;
  categoria_id: string;
  subcategoria_id: string;
  data: string;
  numeroCupom?: string;
  cnpj?: string;
  endereco?: string;
  formaPagamento?: string;
  chaveAcesso?: string;
  valorTotal: number;
  itens: AnalyzedReceiptItem[];
  // Campos preenchidos só pelo canal WhatsApp (analyzeAudioExpense /
  // analyzeTextExpense) — ver EXPENSE_JSON_FORMAT mais abaixo.
  confianca?: 'alta' | 'media' | 'baixa';
  tipoDespesa?: 'geral' | 'combustivel';
  tipoCombustivel?: string;
  litros?: number;
  precoPorLitro?: number;
  kmAtual?: number;
  // Preenchidos por analyzeReceiptImage (ausentes/verdadeiros = comportamento antigo do scanner).
  ehComprovante?: boolean;
  legivel?: boolean;
}

/**
 * `knowledgeBlock`: texto "CONHECIMENTO DO CASAL" aprendido do banco, passado
 * pelo canal WhatsApp (server/whatsapp/knowledge.ts). Fica como parâmetro —
 * e não import — pra este arquivo continuar sem dependências do bot, já que
 * também roda nas funções serverless da Vercel (api/*.ts).
 */
export interface AnalyzeOptions {
  knowledgeBlock?: string;
}

export async function analyzeReceiptImage(base64Data: string, mimeType: string, opts: AnalyzeOptions = {}): Promise<AnalyzedReceipt> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Chave do Google Gemini (GEMINI_API_KEY) não configurada no servidor.');

  const { data, mimeType: validMime } = cleanBase64Payload(base64Data, mimeType);

  const systemInstruction = `Você é um auditor fiscal de despesas domésticas para o casal Felipe Duarte & Genivânia Duarte.
Analise com extrema precisão a imagem anexada deste comprovante (cupom NFC-e, nota SAT, comprovante de maquininha POS/TEF, ou ticket).

REGRAS CRÍTICAS:
1. ANTI-MAQUININHA: NUNCA use a marca da adquirente (laranjinha, itaú, rede, cielo, stone, pagbank, pagseguro, getnet, safrapay, vero, moderninha, bin, ticket) como nome do estabelecimento. Procure o nome do comércio real.
2. Priorize o Nome Fantasia comercial amigável sobre a Razão Social.
3. ${buildTaxonomyPromptBlock()}
4. Se for comprovante de cartão sem lista de produtos, crie 1 item sintético com o valor total descrevendo o serviço/compra.
5. Se encontrar produtos de saúde/remédio dentro de uma compra de supermercado, marque "desmembrado": true nesse item e preencha "motivoDesmembramento", mas mantenha a subcategoria_id geral da compra como "sub-supermercado".
6. "ehComprovante" = false se a imagem NÃO for um comprovante/cupom/nota/recibo de pagamento (meme, selfie, print de conversa, paisagem...). "legivel" = false se estiver tão borrada/cortada/escura que não dá para ler o valor total com segurança. Nesses casos não invente valores.
7. Se for um comprovante de verdade (ehComprovante=true) mas o nome do estabelecimento não aparece de forma legível em lugar nenhum (cabeçalho cortado, só mostra dados da maquininha, papel térmico desbotado etc.), deixe "estabelecimento": "" (string vazia) e "tipoEstabelecimento": "Outros". NUNCA escreva algo como "Não identificado" ou qualquer frase genérica nesse campo — isso será tratado como se fosse um nome real de comércio.
8. Se for comprovante de POSTO DE COMBUSTÍVEL, preencha tipoCombustivel, litros, precoPorLitro e kmAtual quando constarem; não invente (use null).
${opts.knowledgeBlock ? `9. ${opts.knowledgeBlock}\n` : ''}
Retorne ESTRITAMENTE um JSON com este formato:
{
  "ehComprovante": boolean,
  "legivel": boolean,
  "estabelecimento": "string",
  "razaoSocial": "string",
  "nomeFantasia": "string",
  "tipoEstabelecimento": "Supermercado | Farmácia | Posto de combustível | Estacionamento | Restaurante/Lazer | Oficina | Serviços | Outros",
  "subcategoria_id": "um dos ids da lista acima",
  "data": "YYYY-MM-DD",
  "numeroCupom": "string",
  "cnpj": "string",
  "endereco": "string",
  "formaPagamento": "cartao | debito | pix | dinheiro",
  "chaveAcesso": "string",
  "valorTotal": number,
  "tipoCombustivel": "Gasolina Comum | Gasolina Aditivada | Etanol | Diesel | null (só se for posto de combustível)",
  "litros": "number | null (só posto: litros abastecidos)",
  "precoPorLitro": "number | null (só posto; se faltar, valorTotal/litros)",
  "kmAtual": "number | null (só posto: km do carro SE estiver escrito/anotado no comprovante; senão null)",
  "itens": [
    { "nome": "string", "codigoEan": "string", "quantidade": number, "precoUnitario": number, "precoTotal": number, "desmembrado": boolean, "motivoDesmembramento": "string" }
  ]
}`;

  const parts: any[] = [
    { inlineData: { mimeType: validMime, data } },
    { text: 'Analise este comprovante e retorne o JSON estruturado conforme instruções.' },
  ];

  const parsed = await callAndParse(ai, parts, systemInstruction);

  const normalized = normalizeReceiptData({
    estabelecimento: parsed.estabelecimento,
    razaoSocial: parsed.razaoSocial,
    nomeFantasia: parsed.nomeFantasia,
    tipoEstabelecimento: parsed.tipoEstabelecimento,
    subcategoriaSugerida: parsed.subcategoria_id,
    cnpj: parsed.cnpj,
    endereco: parsed.endereco,
    valorTotal: parsed.valorTotal,
    itens: parsed.itens,
  });

  // Enriquecer com estabelecimento conhecido do Supabase (substitui KNOWN_CNPJS hardcoded)
  const known = await lookupOrRegisterEstablishment(
    normalized.cnpj,
    normalized.estabelecimento,
    normalized.tipoEstabelecimento
  );
  const finalEstabelecimento = known?.nome || normalized.estabelecimento;
  const finalTipoEstabelecimento = known?.tipo || normalized.tipoEstabelecimento;

  const subcategoriaId = /^sub-/.test(parsed.subcategoria_id || '') ? parsed.subcategoria_id : normalized.subcategoriaSugerida;
  const categoriaId = mapCategoryToId(
    subcategoriaId === 'sub-manutencao-carro' || subcategoriaId === 'sub-ipva' || subcategoriaId === 'sub-eventualidades'
      ? 'Extra/Eventualidades'
      : subcategoriaId === 'sub-aluguel' || subcategoriaId === 'sub-condominio' || subcategoriaId === 'sub-internet'
      ? 'Invariável'
      : 'Variável'
  );

  return {
    estabelecimento: finalEstabelecimento,
    razaoSocial: normalized.razaoSocial,
    nomeFantasia: normalized.nomeFantasia,
    tipoEstabelecimento: finalTipoEstabelecimento,
    categoria_id: categoriaId,
    subcategoria_id: subcategoriaId,
    data: parsed.data,
    numeroCupom: parsed.numeroCupom,
    cnpj: normalized.cnpj || parsed.cnpj,
    endereco: normalized.cidade || parsed.endereco,
    formaPagamento: parsed.formaPagamento,
    chaveAcesso: parsed.chaveAcesso,
    valorTotal: Number(parsed.valorTotal) || 0,
    itens: normalized.itens.length > 0
      ? normalized.itens.map((it) => ({
          nome: it.nome,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitario,
          precoTotal: it.precoTotal,
          categoriaItem: it.categoriaItem,
          subcategoria_id: it.subcategoriaSugerida,
          desmembrado: it.desmembrado,
          motivoDesmembramento: it.motivoDesmembramento,
        }))
      : (parsed.itens || []),
    ehComprovante: parsed.ehComprovante !== false,
    legivel: parsed.legivel !== false,
    tipoCombustivel: parsed.tipoCombustivel || undefined,
    litros: Number(parsed.litros) || undefined,
    precoPorLitro: Number(parsed.precoPorLitro) || undefined,
    kmAtual: Number(parsed.kmAtual) || undefined,
  };
}

export interface AnalyzedFuelReceipt {
  postoNome: string;
  tipoCombustivel: string;
  litros: number;
  precoPorLitro: number;
  valorTotal: number;
  data: string;
  km: number | null;
  numeroCupom?: string;
  formaPagamento?: string;
  cnpj?: string;
  endereco?: string;
}

export async function analyzeFuelReceiptImage(base64Data: string, mimeType: string): Promise<AnalyzedFuelReceipt> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Chave do Google Gemini (GEMINI_API_KEY) não configurada no servidor.');

  const { data, mimeType: validMime } = cleanBase64Payload(base64Data, mimeType);

  const prompt = `Você é um especialista em OCR de comprovantes de POSTOS DE COMBUSTÍVEL no Brasil.
Analise a imagem e extraia com exatidão: postoNome, tipoCombustivel ("Gasolina Comum" | "Gasolina Aditivada" | "Etanol" | "Diesel"), litros, precoPorLitro (calcule por divisão se faltar), valorTotal, data (YYYY-MM-DD), km (se anotado manualmente, senão null), numeroCupom, formaPagamento, cnpj, endereco.

Retorne ESTRITAMENTE um JSON:
{
  "postoNome": "string", "tipoCombustivel": "string", "litros": number, "precoPorLitro": number,
  "valorTotal": number, "data": "string", "km": number | null, "numeroCupom": "string",
  "formaPagamento": "string", "cnpj": "string", "endereco": "string"
}`;

  const parts: any[] = [{ inlineData: { mimeType: validMime, data } }, { text: prompt }];
  return callAndParse(ai, parts);
}

// =====================================================================
// Canal WhatsApp (grupo autorizado) — áudio e texto livre descrevendo
// uma despesa, ex.: "gastei 45 no mercado hoje" ou um áudio equivalente.
// Reusa o mesmo formato de saída de analyzeReceiptImage (AnalyzedReceipt)
// para que o lado de ingestão trate os três canais (foto/áudio/texto) de
// forma uniforme.
// =====================================================================

const EXPENSE_JSON_FORMAT = `Retorne ESTRITAMENTE um JSON com este formato (sem nenhum texto fora do JSON):
{
  "ehDespesa": boolean,
  "entendiAudio": "boolean (SÓ para áudio: false se estiver inaudível, vazio, só ruído ou ininteligível; para texto sempre true)",
  "multiplasDespesas": "boolean (true se a mensagem descreve DUAS OU MAIS despesas diferentes de uma vez, ex.: 'gastei 30 no mercado e 20 no posto')",
  "confianca": "alta" | "media" | "baixa",
  "motivoRecusa": "string (preencha SÓ quando ehDespesa=false, explicando por que não é uma despesa)",
  "precisaPergunta": boolean,
  "pergunta": "string (curta e direta, preencha SÓ quando precisaPergunta=true)",
  "contextoParcial": "string (preencha SÓ quando precisaPergunta=true: resumo em 1 frase do que você já entendeu, pra reaproveitar depois da resposta)",
  "tipoDespesa": "geral" | "combustivel",
  "estabelecimento": "string (nome do posto quando tipoDespesa=combustivel)",
  "tipoEstabelecimento": "Supermercado | Farmácia | Posto de combustível | Estacionamento | Restaurante/Lazer | Oficina | Serviços | Outros",
  "subcategoria_id": "um dos ids da lista acima",
  "data": "YYYY-MM-DD",
  "formaPagamento": "debito | pix | dinheiro | null (SOMENTE se a pessoa disse explicitamente a forma; senão null — nunca chute; o padrão é o cartão conjunto)",
  "valorTotal": number,
  "tipoCombustivel": "Gasolina Comum | Gasolina Aditivada | Etanol | Diesel (só quando tipoDespesa=combustivel)",
  "litros": "number ou null (só quando tipoDespesa=combustivel)",
  "precoPorLitro": "number ou null (calcule valorTotal/litros se a pessoa não disser o preço por litro)",
  "kmAtual": "number ou null (quilometragem do carro, se mencionada)",
  "itens": [
    { "nome": "string", "quantidade": number, "precoUnitario": number, "precoTotal": number }
  ]
}

REGRAS IMPORTANTES:
1. "ehDespesa" deve ser false para mensagens sociais, perguntas, ou qualquer coisa que não descreva claramente um gasto de dinheiro (ex.: "bom dia", "vamos ao cinema?", "oi amor"). Nesse caso, não preencha os outros campos de despesa, só "motivoRecusa", e deixe "precisaPergunta" como false.
2. "confianca" = "baixa" quando o valor, o estabelecimento ou a data foram adivinhados/aproximados por falta de detalhe na mensagem. "alta" quando a mensagem é clara e completa.
3. Se for um abastecimento de combustível (ex.: "abasteci", "coloquei gasolina", "enchi o tanque"), use tipoDespesa="combustivel", tipoEstabelecimento="Posto de combustível" e preencha litros/precoPorLitro/kmAtual quando mencionados.
4. Se não houver informação suficiente para "data", use a data de hoje. Se não houver detalhamento de itens (e não for combustível), crie 1 item sintético com o valor total descrevendo a despesa.
5. "precisaPergunta"=true SOMENTE quando a mensagem claramente descreve uma despesa real (ehDespesa seria true) mas falta um dado importante o suficiente pra valer interromper e perguntar, em vez de só marcar "confianca":"baixa". Nunca marque mais de uma pergunta — escolha a lacuna MAIS crítica nesta ordem de prioridade:
   a) "valorTotal" não foi mencionado nem é possível inferir;
   b) é abastecimento (tipoDespesa=combustivel) e "litros" não foi mencionado;
   c) é abastecimento e "kmAtual" não foi mencionado;
   d) não foi dito o NOME do lugar/estabelecimento específico (ex.: "Pastelaria Cristo Rei", "Supermercado Carrefour") — mesmo que o TIPO já esteja claro pelo item comprado (ver REGRA 8), ainda falta o nome específico e isso justifica perguntar;
   e) a mensagem menciona itens de forma vaga sem dizer o quê, de um jeito que nem o valor nem a categoria dão pra inferir (ex.: "comprei umas coisas", "paguei uma conta").
   Imprecisões menores (valor arredondado, data aproximada) NÃO justificam pergunta — use "confianca":"baixa" pra isso.
6. Se for áudio e não der pra entender nada útil, devolva "entendiAudio": false e "ehDespesa": false (não invente).
7. Se houver mais de uma despesa na mesma mensagem, devolva "multiplasDespesas": true e NÃO tente registrar só uma delas.
8. Use seu conhecimento geral sobre o(s) ITEM(NS) comprado(s) pra preencher "tipoEstabelecimento" e "subcategoria_id" CORRETAMENTE mesmo que a pessoa não tenha dito o nome do lugar — isso evita classificar errado (ex.: nunca tratar uma compra de comida como combustível) e enquadra a pergunta da REGRA 5d/9 no tipo certo. Exemplos: "coxinha", "salgados", "pastel", "esfiha", "sanduíche", "lanche", "pizza", "açaí" → comida de lanchonete/lazer (tipoEstabelecimento="Restaurante/Lazer", subcategoria_id="sub-lazer"); "pilha", "detergente", "sabão", "papel higiênico", "sabonete", "torneira", "lâmpada" → item doméstico comprado em mercado/bazar (tipoEstabelecimento="Supermercado", subcategoria_id="sub-supermercado"); remédio/exame → "Farmácia"/"sub-farmacia". Isso NÃO substitui o nome específico do lugar (REGRA 5d) — deixe "estabelecimento" vazio quando a pessoa não disser o nome, mesmo sabendo o tipo.
9. Quando for perguntar o nome do lugar (REGRA 5d) e você já souber o tipo pela REGRA 8, deixe a pergunta específica pro tipo em vez de genérica, ex.: "Qual foi a lanchonete/açaiteria desse açaí?" ou "Qual mercado você comprou a pilha e o detergente?" em vez de "onde foi essa despesa?".`;

/** Data de hoje no fuso do casal (Teresina, UTC-3) — `toISOString()` usa UTC e já vira o dia às 21h. */
function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
}

/**
 * O Gemini não sabe a data real "de fábrica" — mesmo informando HOJE no
 * prompt, ele já chegou a devolver anos completamente errados (ex.:
 * "2023-10-27" num teste feito em outubro de 2026), o que faz a despesa
 * nunca aparecer no app por cair fora do mês/ano visível no dashboard.
 * Trava de segurança: se o ano vier diferente do ano atual, descarta e
 * usa a data de hoje.
 */
export function sanitizeDate(rawDate: string | undefined): string {
  const today = todayISO();
  if (!rawDate || !/^\d{4}-\d{2}-\d{2}/.test(rawDate)) return today;
  const date = rawDate.slice(0, 10);
  if (Number(date.slice(0, 4)) !== Number(today.slice(0, 4))) return today;
  return date > today ? today : date; // data futura nunca vale
}

/**
 * Resultado de analisar uma mensagem de texto/áudio do WhatsApp como
 * possível despesa — 3 formas possíveis (ver REGRAS 1 e 5 do
 * EXPENSE_JSON_FORMAT):
 * - 'expense': despesa reconhecida, pronta pra virar rascunho.
 * - 'question': falta um dado importante — `expenseIngest.ts` pergunta
 *   no grupo em vez de criar rascunho, e reaproveita `contextoParcial`
 *   quando a pessoa responder.
 * - 'not_expense': mensagem social/irrelevante, nada é feito.
 */
export type ExpenseAnalysisResult =
  | { kind: 'expense'; receipt: AnalyzedReceipt }
  | { kind: 'question'; pergunta: string; contextoParcial: string }
  | { kind: 'unclear' } // áudio inaudível/ininteligível
  | { kind: 'multiple' } // várias despesas numa mensagem só
  | { kind: 'not_expense' };

function buildExpenseResult(parsed: any): ExpenseAnalysisResult {
  if (parsed.entendiAudio === false) return { kind: 'unclear' };
  if (parsed.multiplasDespesas === true) return { kind: 'multiple' };
  if (parsed.ehDespesa === false) return { kind: 'not_expense' };

  if (parsed.precisaPergunta === true && parsed.pergunta) {
    return { kind: 'question', pergunta: parsed.pergunta, contextoParcial: parsed.contextoParcial || '' };
  }

  // Trava de segurança (REGRA 5-d): não depender só do Gemini lembrar de
  // perguntar — se não for combustível e a pessoa não disse o NOME
  // específico do estabelecimento, força a pergunta em vez de deixar cair
  // num rótulo genérico de rascunho. O tipo/categoria (REGRA 8, ex.:
  // "coxinha" → sub-lazer) já pode estar preenchido nesse ponto — isso evita
  // classificar errado (ex.: pedir litros/km de uma despesa de lanche), mas
  // não substitui o nome do lugar em si, que o casal quer manter nos
  // relatórios.
  const isFuelCheck = parsed.tipoDespesa === 'combustivel';
  if (!isFuelCheck && !parsed.estabelecimento?.trim()) {
    const valorParcial = parsed.valorTotal ? ` de R$ ${Number(parsed.valorTotal).toFixed(2)}` : '';
    const tipoHint = parsed.tipoEstabelecimento?.trim();
    return {
      kind: 'question',
      pergunta: tipoHint
        ? `Qual foi o nome do lugar (${tipoHint}) dessa despesa${valorParcial}?`
        : 'Onde foi essa despesa (nome do lugar ou tipo, ex.: mercado, farmácia, restaurante)?',
      contextoParcial: `Despesa${valorParcial}${tipoHint ? ` (${tipoHint})` : ''} sem nome do estabelecimento.`,
    };
  }

  const subcategoriaId = /^sub-/.test(parsed.subcategoria_id || '') ? parsed.subcategoria_id : 'sub-eventualidades';
  const categoriaId = mapCategoryToId(
    subcategoriaId === 'sub-manutencao-carro' || subcategoriaId === 'sub-ipva' || subcategoriaId === 'sub-eventualidades'
      ? 'Extra/Eventualidades'
      : subcategoriaId === 'sub-aluguel' || subcategoriaId === 'sub-condominio' || subcategoriaId === 'sub-internet'
      ? 'Invariável'
      : 'Variável'
  );

  const isFuel = parsed.tipoDespesa === 'combustivel';
  const litros = isFuel ? Number(parsed.litros) || undefined : undefined;
  const valorTotal = Number(parsed.valorTotal) || 0;
  const precoPorLitro = isFuel
    ? Number(parsed.precoPorLitro) || (litros ? Number((valorTotal / litros).toFixed(2)) : undefined)
    : undefined;

  return {
    kind: 'expense',
    receipt: {
      // Se não veio um nome específico, usa o tipo de estabelecimento já
      // informado (ex.: "Supermercado") ou, na falta dele, o nome da própria
      // subcategoria inferida pelo item (REGRA 8 — ex.: "Lazer" pra
      // "coxinha") em vez de um rótulo genérico tipo "Despesa via WhatsApp".
      // "WPP" é só o último recurso, nunca deveria ocorrer de fato.
      estabelecimento:
        parsed.estabelecimento || parsed.tipoEstabelecimento || (isFuel ? 'Posto de Combustível' : subcategoryIdToName(subcategoriaId)) || 'WPP',
      tipoEstabelecimento: parsed.tipoEstabelecimento || (isFuel ? 'Posto de combustível' : subcategoryIdToName(subcategoriaId)),
      categoria_id: categoriaId,
      subcategoria_id: isFuel ? 'sub-combustivel' : subcategoriaId,
      data: sanitizeDate(parsed.data),
      formaPagamento: parsed.formaPagamento,
      valorTotal,
      itens: Array.isArray(parsed.itens) ? parsed.itens : [],
      confianca: parsed.confianca === 'alta' || parsed.confianca === 'baixa' ? parsed.confianca : 'media',
      tipoDespesa: isFuel ? 'combustivel' : 'geral',
      tipoCombustivel: isFuel ? parsed.tipoCombustivel : undefined,
      litros,
      precoPorLitro,
      kmAtual: parsed.kmAtual != null ? Number(parsed.kmAtual) || undefined : undefined,
    },
  };
}

/**
 * Lê um áudio (ex.: mensagem de voz do WhatsApp) e extrai uma despesa
 * estruturada, ou `null` se a mensagem não descrever uma despesa. O
 * Gemini 2.5/3.6 Flash entendem áudio nativamente — não é necessário um
 * serviço de transcrição (speech-to-text) separado.
 */
export async function analyzeAudioExpense(base64Audio: string, mimeType: string, opts: AnalyzeOptions = {}): Promise<ExpenseAnalysisResult> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Chave do Google Gemini (GEMINI_API_KEY) não configurada no servidor.');

  const { data, mimeType: validMime } = cleanBase64Payload(base64Audio, mimeType);

  const systemInstruction = `Você é um assistente que transcreve áudios do casal Felipe & Camila Duarte, que pode descrever um gasto doméstico (ex.: "gastei 50 reais no mercado hoje", "abasteci 40 litros no posto Cristo Rei por 280 reais, km 126950") ou simplesmente conversar sobre outra coisa.
A data de HOJE é ${todayISO()}. Use isso como referência para "hoje", "ontem", "essa semana" etc. — nunca invente um ano diferente do atual.
${buildTaxonomyPromptBlock()}
${opts.knowledgeBlock ? opts.knowledgeBlock + '\n' : ''}${EXPENSE_JSON_FORMAT}`;

  const parts: any[] = [
    { inlineData: { mimeType: validMime, data } },
    { text: 'Transcreva este áudio e decida se descreve uma despesa, retornando o JSON estruturado conforme instruções.' },
  ];

  // Transcrever + analisar áudio demora mais que OCR de imagem — timeout
  // maior que o padrão (20s) pra não abortar o modelo principal antes de
  // ele terminar (visto na prática: "This operation was aborted").
  return buildExpenseResult(await callAndParse(ai, parts, systemInstruction, 35_000));
}

/**
 * Extrai uma despesa estruturada de uma mensagem de texto livre (ex.:
 * mensagem de texto do WhatsApp: "gastei 45 no mercado hoje"), ou
 * `null` se a mensagem não descrever uma despesa.
 */
export async function analyzeTextExpense(texto: string, opts: AnalyzeOptions = {}): Promise<ExpenseAnalysisResult> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Chave do Google Gemini (GEMINI_API_KEY) não configurada no servidor.');

  const systemInstruction = `Você é um assistente que lê mensagens de texto do casal Felipe & Camila Duarte, que podem descrever um gasto doméstico (incluindo abastecimento de combustível) ou simplesmente ser uma conversa qualquer do grupo.
A data de HOJE é ${todayISO()}. Use isso como referência para "hoje", "ontem", "essa semana" etc. — nunca invente um ano diferente do atual.
${buildTaxonomyPromptBlock()}
${opts.knowledgeBlock ? opts.knowledgeBlock + '\n' : ''}${EXPENSE_JSON_FORMAT}`;

  const parts: any[] = [{ text: `Mensagem: "${texto}"\n\nDecida se descreve uma despesa e extraia os dados, retornando o JSON estruturado conforme instruções.` }];

  return buildExpenseResult(await callAndParse(ai, parts, systemInstruction));
}
