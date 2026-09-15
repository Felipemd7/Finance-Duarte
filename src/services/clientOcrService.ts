// Serviço de OCR com Google Gemini com suporte a chamada direta pela REST API
// Garante que o aplicativo consiga analisar comprovantes mesmo se as rotas da Vercel ou do Express estiverem indisponíveis.

const GEMINI_API_KEY =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.GEMINI_API_KEY ||
  'AIzaSyCoQOy42UyZYpT8idP-P69ki5XIQXYAgfg';

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash'];

export interface ScannedReceiptResult {
  estabelecimento: string;
  tipoEstabelecimento: string;
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

  const prompt = `Você é um auditor fiscal de despesas domésticas para um casal (Felipe Duarte & Genivânia Duarte).
Analise com atenção máxima a imagem anexada deste comprovante, cupom fiscal NFC-e, nota fiscal SAT ou cupom tradicional.

Instruções fundamentais:
1. Extraia o nome amigável do estabelecimento comercial (Ex: "Atacadão", "Pão de Açúcar", "Drogaria Pacheco", "Supermercado Carvalho").
2. Identifique o tipo do estabelecimento: "Supermercado", "Farmácia", "Posto de combustível", "Restaurante", "Loja" ou "Outros".
3. Extraia a data no formato "AAAA-MM-DD" ou "DD/MM/AAAA".
4. Extraia o valor total pago no cupom fiscal (valorTotal).
5. Extraia TODOS os itens com preço e quantidade.
6. REGRA DE DESMEMBRAMENTO PARA FARMÁCIA/SAÚDE: Se encontrar produtos de saúde/medicamentos (ex: dorflex, dipirona, vitaminas) comprados em supermercado, marque "desmembrado: true" e preencha "motivoDesmembramento".

Retorne ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "estabelecimento": "string",
  "tipoEstabelecimento": "string",
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
        return parsed;
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

      if (!response.ok) continue;

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
