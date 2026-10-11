import { GoogleGenAI } from '@google/genai';
import { normalizeReceiptData } from '../src/services/receiptNormalizer.js';
import { buildTaxonomyPromptBlock, mapCategoryToId } from '../src/shared/taxonomy.js';
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

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-3.6-flash';
const TIMEOUT_MS = 12_000;

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

/**
 * Chama um único modelo Gemini com timeout, tentando no máximo 1 fallback
 * em caso de erro real (nunca executa os 2 modelos "por garantia").
 */
async function callGeminiVision(
  ai: GoogleGenAI,
  parts: any[],
  systemInstruction?: string
): Promise<string> {
  let lastError: any = null;
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);
      if (response.text && response.text.trim()) return response.text;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[ReceiptAnalyzer] Modelo ${model} falhou, tentando próximo se houver:`, err?.message || err);
      continue;
    }
  }
  throw lastError || new Error('Nenhum modelo Gemini retornou resultado.');
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
}

export async function analyzeReceiptImage(base64Data: string, mimeType: string): Promise<AnalyzedReceipt> {
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

Retorne ESTRITAMENTE um JSON com este formato:
{
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
  "itens": [
    { "nome": "string", "codigoEan": "string", "quantidade": number, "precoUnitario": number, "precoTotal": number, "desmembrado": boolean, "motivoDesmembramento": "string" }
  ]
}`;

  const parts: any[] = [
    { inlineData: { mimeType: validMime, data } },
    { text: 'Analise este comprovante e retorne o JSON estruturado conforme instruções.' },
  ];

  const rawText = await callGeminiVision(ai, parts, systemInstruction);
  const parsed = JSON.parse(stripJsonFences(rawText));

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
  const rawText = await callGeminiVision(ai, parts);
  return JSON.parse(stripJsonFences(rawText));
}
