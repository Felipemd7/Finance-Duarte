import { GoogleGenAI } from '@google/genai';
import { normalizeReceiptData } from '../src/services/receiptNormalizer';

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
  // CORS support
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

    if (mockSample === 'atacadao' || (!imageBase64 && !mockSample)) {
      return res.json({
        success: true,
        source: 'sample-atacadao',
        data: {
          estabelecimento: 'Atacadão Distribuição S/A',
          tipoEstabelecimento: 'Supermercado',
          data: '2026-03-14 11:28',
          numeroCupom: 'NFC-e #92819',
          cnpj: '75.315.333/0045-89',
          endereco: 'Av. das Américas, 4200 - Barra da Tijuca, RJ',
          formaPagamento: 'Mastercard •• 8821',
          comprador: 'Felipe Duarte & Genivânia Duarte',
          chaveAcesso: '3326 0375 3153 3300 4589 6500 1000 9281 9118 4879 01',
          valorTotal: 487.9,
          itens: [
            {
              id: 'it-1',
              nome: 'Arroz Tipo 1 5kg',
              codigoEan: '789100014231',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 2,
              precoUnitario: 28.9,
              precoTotal: 57.8,
              desmembrado: false,
            },
            {
              id: 'it-2',
              nome: 'Azeite Extra Virgem 500ml',
              codigoEan: '789600120194',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Despensa',
              quantidade: 1,
              precoUnitario: 42.5,
              precoTotal: 42.5,
              desmembrado: false,
            },
            {
              id: 'it-3',
              nome: 'Sabão Líquido Omo 3L',
              codigoEan: '789103829402',
              categoriaItem: 'Limpeza',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 38.9,
              precoTotal: 38.9,
              desmembrado: false,
            },
            {
              id: 'it-4',
              nome: 'Shampoo Dove Nutritivo 400ml',
              codigoEan: '789115002931',
              categoriaItem: 'Higiene',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 2,
              precoUnitario: 24.9,
              precoTotal: 49.8,
              desmembrado: false,
            },
            {
              id: 'it-5',
              nome: 'Dipirona Monoidratada 500mg (Remédio Farmácia)',
              codigoEan: '789671420188',
              categoriaItem: 'Remédios & Farmácia',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 1,
              precoUnitario: 14.5,
              precoTotal: 14.5,
              desmembrado: true,
              motivoDesmembramento: 'Medicamento comprado no mercado separado para orçamento de Saúde & Farmácia.',
            },
          ],
          divisaoCasal: {
            porcentagemFelipe: 50,
            porcentagemGenivania: 50,
            valorFelipe: 243.95,
            valorGenivania: 243.95,
          },
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Chave do Google Gemini (GEMINI_API_KEY) não encontrada no servidor.',
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

    const requestConfig = {
      responseMimeType: 'application/json',
      temperature: 0.1,
    };

    const requestContents = [
      {
        role: 'user',
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
    ];

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    let parsedData: any = null;
    let modelUsed = '';
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: candidate,
          contents: requestContents,
          config: requestConfig,
        });

        if (response && response.text) {
          let raw = response.text.trim();
          if (raw.startsWith('```')) {
            raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
          }
          parsedData = JSON.parse(raw);
          modelUsed = candidate;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.error(`[api/scan-receipt on ${candidate}]:`, err?.message || err);
        continue;
      }
    }

    if (!parsedData) {
      return res.status(200).json({
        success: false,
        error: 'Não foi possível extrair dados do comprovante. Certifique-se de que a imagem esteja nítida.',
        details: lastError?.message,
      });
    }

    const normalized = normalizeReceiptData(parsedData);
    const resolvedData = {
      ...parsedData,
      estabelecimento: normalized.estabelecimento,
      razaoSocial: normalized.razaoSocial || parsedData.razaoSocial,
      nomeFantasia: normalized.nomeFantasia || parsedData.nomeFantasia,
      tipoEstabelecimento: normalized.tipoEstabelecimento,
      subcategoriaSugerida: normalized.subcategoriaSugerida,
      cnpj: normalized.cnpj || parsedData.cnpj,
      endereco: normalized.cidade || parsedData.endereco,
      itens: normalized.itens.length > 0 ? normalized.itens : parsedData.itens || [],
    };

    const total = Number(resolvedData.valorTotal) || 0;
    const itensWithIds = (resolvedData.itens || []).map((it: any, idx: number) => ({
      id: `item-${Date.now()}-${idx}`,
      ...it,
    }));

    return res.json({
      success: true,
      source: modelUsed,
      data: {
        ...resolvedData,
        itens: itensWithIds,
        divisaoCasal: {
          porcentagemFelipe: 50,
          porcentagemGenivania: 50,
          valorFelipe: Number((total / 2).toFixed(2)),
          valorGenivania: Number((total / 2).toFixed(2)),
        },
      },
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: 'Erro interno ao processar o comprovante.',
      details: err?.message,
    });
  }
}
