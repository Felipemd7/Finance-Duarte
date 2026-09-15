import { GoogleGenAI } from '@google/genai';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', mockSample } = req.body || {};

    if (mockSample === 'shell' || mockSample === 'ipiranga') {
      const isShell = mockSample === 'shell';
      return res.json({
        success: true,
        source: `sample-${mockSample}`,
        data: {
          postoNome: isShell ? 'Posto Shell Select' : 'Posto Ipiranga AmPm',
          tipoCombustivel: isShell ? 'Gasolina V-Power' : 'Gasolina Comum',
          litros: isShell ? 42.5 : 38.0,
          precoPorLitro: isShell ? 5.89 : 5.79,
          valorTotal: isShell ? 250.32 : 220.02,
          data: '2026-03-12',
          km: isShell ? 45280 : 44850,
          numeroCupom: isShell ? 'NFC-e #88492' : 'NFC-e #10394',
          formaPagamento: 'Cartão de Crédito',
          cnpj: isShell ? '02.451.890/0001-22' : '33.000.167/0001-01',
          endereco: isShell ? 'Av. Homero Castelo Branco, 1200 - Teresina, PI' : 'Av. Frei Serafim, 2300 - Teresina, PI',
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Chave do Google Gemini (GEMINI_API_KEY) não configurada.',
      });
    }

    let cleanBase64 = imageBase64;
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
- postoNome (Ex: "Posto Shell", "Posto Ipiranga", "Posto BR Petrobras", "Posto Ipiranga Jockey")
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

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    let parsedData: any = null;

    for (const candidate of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: candidate,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: validMime, data: cleanBase64 } },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        if (response && response.text) {
          let raw = response.text.trim();
          if (raw.startsWith('```')) {
            raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
          }
          parsedData = JSON.parse(raw);
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!parsedData) {
      return res.status(200).json({
        success: false,
        error: 'Não foi possível extrair os dados do comprovante de combustível.',
      });
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: 'Erro ao processar comprovante de combustível.',
      details: err?.message,
    });
  }
}
