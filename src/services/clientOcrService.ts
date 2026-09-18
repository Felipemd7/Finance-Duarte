// Serviço de OCR com Google Gemini com suporte a chamada direta pela REST API
// Garante que o aplicativo consiga analisar comprovantes mesmo se as rotas da Vercel ou do Express estiverem indisponíveis.

import { normalizeReceiptData } from './receiptNormalizer';

const GEMINI_API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.GEMINI_API_KEY ||
  '';

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash'];

export interface ScannedReceiptResult {
  estabelecimento: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  tipoEstabelecimento: string;
  subcategoriaSugerida?: string;
  data: string;
  numeroCupom: string;
  cnpj?: string;
  endereco?: string;
  formaPagamento?: string;
  comprador?: string;
  chaveAcesso?: string;
  valorTotal: number;
  itens: Array<{
    id?: string;
    nome: string;
    codigoEan?: string;
    categoriaItem?: string;
    subcategoriaSugerida?: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    desmembrado?: boolean;
    motivoDesmembramento?: string;
  }>;
}

export async function analyzeReceiptDirect(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<ScannedReceiptResult> {
  let cleanBase64 = base64Data;
  let validMime = mimeType || 'image/jpeg';

  if (cleanBase64.includes('base64,')) {
    const parts = cleanBase64.split('base64,');
    cleanBase64 = parts[1];
    const matchMime = parts[0].match(/data:([^;]+);/);
    if (matchMime) {
      validMime = matchMime[1];
    }
  }

  const prompt = `Você é um auditor fiscal de despesas domésticas para o casal Felipe Duarte & Genivânia Duarte.
Analise com extrema precisão a imagem anexada deste comprovante (pode ser cupom NFC-e, nota fiscal SAT, comprovante de maquininha de cartão / POS / TEF / via cliente, ou ticket).

REGRAS CRÍTICAS DE AUDITORIA:
1. REGRA ANTI-MAQUININHA: NUNCA use a marca da maquininha de cartão ou da adquirente (como "laranjinha", "itau", "itaú", "rede", "cielo", "stone", "pagbank", "pagseguro", "getnet", "safrapay", "vero", "moderninha", "bin", "ticket") como o nome do estabelecimento!
   - Procure SEMPRE pelo nome do estabelecimento comercial real (ex: "POSTO MARTINES", "DROGARIA PAGUE MENOS", "TERESINA ADM DE SHOPPING", "PINHEIRO E REGADAS").
   - Dica: Em filipetas de cartão, o nome do posto/loja e o CNPJ geralmente ficam logo abaixo dos dados de pagamento ou no rodapé.
2. NOME FANTASIA vs RAZÃO SOCIAL: Priorize o Nome Fantasia comercial amigável (ex: "Shopping Rio Poty", "Posto Martines", "Pague Menos").
3. CLASSIFICAÇÃO RIGOROSA DO TIPO DO ESTABELECIMENTO ("tipoEstabelecimento"):
   - "Posto de combustível": se for posto de gasolina, diesel, etanol, abastecimento (ex: Posto Martines, Shell, Petrobras, Ipiranga).
   - "Farmácia": se for drogaria, farmácia de manipulação ou compra de medicamentos/higiene.
   - "Estacionamento": se for ticket de estacionamento de shopping, rotativo, valet ou pedágio (ex: "ROT. EXTERN", Teresina Shopping, Estapar, Indigo).
   - "Restaurante/Lazer": se for lanchonete, restaurante, hamburgueria, cafeteria, bar, cinema, entretenimento.
   - "Supermercado": se for supermercado, atacado, hipermercado, padaria, hortifrúti.
   - "Oficina": oficina mecânica, autopeças, pneus, lava-jato.
   - "Serviços" ou "Outros".
4. SUGESTÃO DE SUBCATEGORIA ("subcategoriaSugerida"):
   - Para Posto de combustível: "Combustível"
   - Para Farmácia: "Farmácia"
   - Para Estacionamento: "Estacionamento"
   - Para Restaurante/Lazer: "Lazer"
   - Para Supermercado: "Supermercado"
5. SE FOR COMPROVANTE DE CARTÃO (sem lista detalhada de produtos):
   - Crie 1 item sintético com o valor total (ex: nome: "Abastecimento de Combustível" se for posto, "Estacionamento Rotativo" se for shopping, "Consumo / Refeição" se for lanchonete).
6. REGRA DE DESMEMBRAMENTO: Se encontrar produtos de saúde/remédios (ex: dorflex, dipirona, luftal) em compras de supermercado, marque "desmembrado: true" e preencha "motivoDesmembramento".

Retorne ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "estabelecimento": "string",
  "razaoSocial": "string",
  "nomeFantasia": "string",
  "tipoEstabelecimento": "string",
  "subcategoriaSugerida": "string",
  "data": "string",
  "numeroCupom": "string",
  "cnpj": "string",
  "endereco": "string",
  "formaPagamento": "string",
  "comprador": "string",
  "chaveAcesso": "string",
  "valorTotal": number,
  "itens": [
    {
      "nome": "string",
      "codigoEan": "string",
      "categoriaItem": "string",
      "subcategoriaSugerida": "string",
      "quantidade": number,
      "precoUnitario": number,
      "precoTotal": number,
      "desmembrado": boolean,
      "motivoDesmembramento": "string"
    }
  ]
}`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: validMime,
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[ClientOcrService] Modelo ${model} falhou com status ${response.status}:`, errText);
        try {
          const errJson = JSON.parse(errText);
          lastError = new Error(errJson.error?.message || `Erro ${response.status} na API Gemini`);
        } catch {
          lastError = new Error(`Erro ${response.status} na API Gemini: ${errText.slice(0, 100)}`);
        }
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }
        const parsed = JSON.parse(clean);

        // Higienizar e normalizar com receiptNormalizer (elimina 'laranjinha', detecta CNPJ, corrige tipo)
        const normalized = normalizeReceiptData(parsed);

        return {
          ...parsed,
          estabelecimento: normalized.estabelecimento,
          razaoSocial: normalized.razaoSocial || parsed.razaoSocial,
          nomeFantasia: normalized.nomeFantasia || parsed.nomeFantasia,
          tipoEstabelecimento: normalized.tipoEstabelecimento,
          subcategoriaSugerida: normalized.subcategoriaSugerida,
          cnpj: normalized.cnpj || parsed.cnpj,
          endereco: normalized.cidade || parsed.endereco,
          itens: normalized.itens.length > 0 ? normalized.itens : parsed.itens || [],
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[ClientOcrService] Erro ao chamar modelo ${model}:`, err);
    }
  }

  throw lastError || new Error('Não foi possível ler o comprovante com a IA.');
}

export async function analyzeFuelReceiptDirect(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<any> {
  let cleanBase64 = base64Data;
  let validMime = mimeType || 'image/jpeg';

  if (cleanBase64.includes('base64,')) {
    const parts = cleanBase64.split('base64,');
    cleanBase64 = parts[1];
    const matchMime = parts[0].match(/data:([^;]+);/);
    if (matchMime) {
      validMime = matchMime[1];
    }
  }

  const prompt = `Analise a imagem deste comprovante de posto de combustível.
Extraia com exatidão:
- postoNome (Ex: "Posto Shell", "Posto Ipiranga", "Posto BR Petrobras")
- tipoCombustivel (Ex: "Gasolina Comum", "Gasolina Aditivada", "Etanol", "Diesel S10")
- litros (número de litros abastecidos)
- precoPorLitro (preço unitário do litro)
- valorTotal (valor final em R$)
- data (YYYY-MM-DD)
- km (quilometragem se anotada no cupom ou null)
- numeroCupom
- formaPagamento
- cnpj
- endereco

Retorne ESTRITAMENTE em formato JSON:
{
  "postoNome": "string",
  "tipoCombustivel": "string",
  "litros": number,
  "precoPorLitro": number,
  "valorTotal": number,
  "data": "string",
  "km": number | null,
  "numeroCupom": "string",
  "formaPagamento": "string",
  "cnpj": "string",
  "endereco": "string"
}`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: validMime,
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        try {
          const errJson = JSON.parse(errText);
          lastError = new Error(errJson.error?.message || `Erro ${response.status} na API Gemini`);
        } catch {
          lastError = new Error(`Erro ${response.status} na API Gemini: ${errText.slice(0, 100)}`);
        }
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }
        return JSON.parse(clean);
      }
    } catch {
      continue;
    }
  }

  throw new Error('Não foi possível extrair dados do comprovante de combustível.');
}
