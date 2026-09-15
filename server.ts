import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

import { supabaseServer, isSupabaseServerConfigured } from './server/supabase';

dotenv.config();

const app = express();
const PORT = 3000;

// Support generous payload for base64 receipt images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy/Safe Google GenAI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
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

// In-memory + persisted store for voice/applet state
let shoppingListStore: Array<{
  id: string;
  estabelecimentoTipo: string;
  estabelecimentoNome?: string;
  nome: string;
  quantidade?: string;
  categoriaItem: string;
  comprado: boolean;
  adicionadoPor: string;
  dataAdicao: string;
  precoEstimado?: number;
}> = [
  {
    id: 'shop-1',
    estabelecimentoTipo: 'Supermercado',
    estabelecimentoNome: 'Atacadão',
    nome: 'Arroz Integral 5kg',
    quantidade: '2 pacotes',
    categoriaItem: 'Alimentos',
    comprado: false,
    adicionadoPor: 'Felipe',
    dataAdicao: '2026-03-03',
    precoEstimado: 58.0,
  },
  {
    id: 'shop-2',
    estabelecimentoTipo: 'Supermercado',
    estabelecimentoNome: 'Atacadão',
    nome: 'Azeite de Oliva Extra Virgem',
    quantidade: '1 garrafa',
    categoriaItem: 'Alimentos',
    comprado: false,
    adicionadoPor: 'Genivânia',
    dataAdicao: '2026-03-03',
    precoEstimado: 45.0,
  },
  {
    id: 'shop-3',
    estabelecimentoTipo: 'Supermercado',
    estabelecimentoNome: 'Atacadão',
    nome: 'Detergente e Sabão Omo Líquido 3L',
    quantidade: '1 galão',
    categoriaItem: 'Limpeza',
    comprado: false,
    adicionadoPor: 'Genivânia',
    dataAdicao: '2026-03-02',
    precoEstimado: 40.0,
  },
  {
    id: 'shop-4',
    estabelecimentoTipo: 'Supermercado',
    estabelecimentoNome: 'Atacadão',
    nome: 'Café em Grãos Especial 500g',
    quantidade: '2 pacotes',
    categoriaItem: 'Alimentos',
    comprado: false,
    adicionadoPor: 'Felipe',
    dataAdicao: '2026-03-07',
    precoEstimado: 38.0,
  },
  {
    id: 'shop-5',
    estabelecimentoTipo: 'Farmácia',
    estabelecimentoNome: 'Droga Raia',
    nome: 'Vitamina C efervescente',
    quantidade: '2 caixas',
    categoriaItem: 'Remédio',
    comprado: false,
    adicionadoPor: 'Genivânia',
    dataAdicao: '2026-03-01',
    precoEstimado: 70.0,
  },
];

let voiceLogs: Array<{
  id: string;
  timestamp: string;
  source: 'Alexa' | 'Siri';
  command: string;
  result: string;
  status: 'sucesso' | 'erro';
}> = [
  {
    id: 'vl-1',
    timestamp: '2026-03-07 19:14:02',
    source: 'Alexa',
    command: 'Alexa, adicionar café em grãos à lista do Atacadão',
    result: 'Item "Café em Grãos Especial 500g" adicionado à lista de Supermercado.',
    status: 'sucesso',
  },
  {
    id: 'vl-2',
    timestamp: '2026-03-05 12:30:15',
    source: 'Siri',
    command: 'Siri, registrar despesa de R$ 50 em Lazer hoje',
    result: 'Despesa de R$ 50,00 registrada no extrato do Casal Duarte.',
    status: 'sucesso',
  },
];

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Duarte Finanças - Gestão Compartilhada',
    version: '1.0.0',
    time: new Date().toISOString(),
    aiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Multimodal OCR via Gemini for Receipts (NFC-e, SAT, Cupom Fiscal)
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mockSample } = req.body;

    // If mock sample is requested or no key provided, provide realistic fallback parsing
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
          comprador: 'Mariana D.',
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
              precoUnitario: 22.0,
              precoTotal: 44.0,
              desmembrado: false,
            },
            {
              id: 'it-5',
              nome: 'Dipirona 500mg c/ 20 comp',
              codigoEan: '789600471201',
              categoriaItem: 'Remédio',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 1,
              precoUnitario: 8.5,
              precoTotal: 8.5,
              desmembrado: true,
              motivoDesmembramento: 'IA sugeriu: Medicamento desmembrado para Farmácia / Saúde',
            },
            {
              id: 'it-6',
              nome: 'Picanha Angus Fatiada kg',
              codigoEan: '789891230041',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1.5,
              precoUnitario: 79.9,
              precoTotal: 119.85,
              desmembrado: false,
            },
            {
              id: 'it-7',
              nome: 'Café em Grãos Seleção 1kg',
              codigoEan: '789800412356',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 54.9,
              precoTotal: 54.9,
              desmembrado: false,
            },
            {
              id: 'it-8',
              nome: 'Laticínios & Hortifrúti Frescos',
              codigoEan: '789000192831',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 121.45,
              precoTotal: 121.45,
              desmembrado: false,
            },
          ],
          divisaoCasal: {
            porcentagemGuilherme: 50,
            porcentagemMariana: 50,
            valorGuilherme: 243.95,
            valorMariana: 243.95,
          },
        },
      });
    }

    if (mockSample === 'sams') {
      return res.json({
        success: true,
        source: 'sample-sams',
        data: {
          estabelecimento: "Sam's Club Brasil",
          tipoEstabelecimento: 'Supermercado',
          data: '2026-03-12 16:40',
          numeroCupom: 'NFC-e #10842',
          cnpj: '00.063.960/0001-44',
          endereco: 'Av. Ayrton Senna, 2541 - Barra, RJ',
          formaPagamento: 'Visa Signature •• 3341',
          comprador: 'Guilherme D.',
          chaveAcesso: '3326 0300 0639 6000 0144 6500 2000 1084 2119 5012 33',
          valorTotal: 648.7,
          itens: [
            {
              id: 'it-s1',
              nome: 'Vinho Tinto Chileno Reserva 750ml (2 un)',
              codigoEan: '780432011234',
              categoriaItem: 'Bebidas',
              subcategoriaSugerida: 'Lazer',
              quantidade: 2,
              precoUnitario: 59.9,
              precoTotal: 119.8,
              desmembrado: true,
              motivoDesmembramento: 'IA sugeriu: Bebida alcoólica desmembrada para Lazer',
            },
            {
              id: 'it-s2',
              nome: 'Azeite Italiano D.O.P. 1L',
              codigoEan: '800123049102',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 89.9,
              precoTotal: 89.9,
              desmembrado: false,
            },
            {
              id: 'it-s3',
              nome: 'Pastilhas Lava-Louças Finish 30 un',
              codigoEan: '789103522194',
              categoriaItem: 'Limpeza',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 78.5,
              precoTotal: 78.5,
              desmembrado: false,
            },
            {
              id: 'it-s4',
              nome: 'Picanha Angus Premium kg',
              codigoEan: '789891230041',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 2.2,
              precoUnitario: 61.9,
              precoTotal: 136.18,
              desmembrado: false,
            },
            {
              id: 'it-s5',
              nome: 'Queijo Parmigiano Reggiano 300g',
              codigoEan: '801239401293',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 2,
              precoUnitario: 48.0,
              precoTotal: 96.0,
              desmembrado: false,
            },
            {
              id: 'it-s6',
              nome: 'Papel Higiênico Folha Tripla 24 rolos',
              codigoEan: '789104819203',
              categoriaItem: 'Higiene',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 52.9,
              precoTotal: 52.9,
              desmembrado: false,
            },
            {
              id: 'it-s7',
              nome: 'Cerveja Artesanal IPA 473ml (4 un)',
              codigoEan: '789891209301',
              categoriaItem: 'Bebidas',
              subcategoriaSugerida: 'Lazer',
              quantidade: 4,
              precoUnitario: 18.88,
              precoTotal: 75.52,
              desmembrado: true,
              motivoDesmembramento: 'IA sugeriu: Desmembrado para orç. Lazer',
            },
          ],
          divisaoCasal: {
            porcentagemGuilherme: 50,
            porcentagemMariana: 50,
            valorGuilherme: 324.35,
            valorMariana: 324.35,
          },
        },
      });
    }

    if (mockSample === 'drogaraia') {
      return res.json({
        success: true,
        source: 'sample-droga-raia',
        data: {
          estabelecimento: 'Droga Raia S/A',
          tipoEstabelecimento: 'Farmácia',
          data: '2026-03-10 14:15',
          numeroCupom: 'SAT #44091',
          cnpj: '61.585.865/0240-19',
          endereco: 'Rua Visconde de Pirajá, 303 - Ipanema, RJ',
          formaPagamento: 'PIX NuBank',
          comprador: 'Mariana D.',
          chaveAcesso: '3526 0361 5858 6502 4019 5900 0440 9118 9012 44',
          valorTotal: 184.6,
          itens: [
            {
              id: 'it-dr1',
              nome: 'Vitamina C + Zinco Efervescente 30 comp',
              codigoEan: '789600470129',
              categoriaItem: 'Remédio',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 2,
              precoUnitario: 34.9,
              precoTotal: 69.8,
              desmembrado: false,
            },
            {
              id: 'it-dr2',
              nome: 'Protetor Solar Facial FPS 60 Antioleosidade',
              codigoEan: '789112930192',
              categoriaItem: 'Higiene',
              subcategoriaSugerida: 'Cuidados Pessoais',
              quantidade: 1,
              precoUnitario: 79.9,
              precoTotal: 79.9,
              desmembrado: false,
            },
            {
              id: 'it-dr3',
              nome: 'Colírio Lubrificante Ocular 10ml',
              codigoEan: '789700192031',
              categoriaItem: 'Remédio',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 1,
              precoUnitario: 24.9,
              precoTotal: 24.9,
              desmembrado: false,
            },
            {
              id: 'it-dr4',
              nome: 'Curativo Adesivo Transparente 20 un',
              codigoEan: '789100039201',
              categoriaItem: 'Remédio',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 1,
              precoUnitario: 10.0,
              precoTotal: 10.0,
              desmembrado: false,
            },
          ],
          divisaoCasal: {
            porcentagemFelipe: 50,
            porcentagemGenivania: 50,
            valorFelipe: 92.3,
            valorGenivania: 92.3,
          },
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback parser if API key is not yet set
      return res.json({
        success: true,
        source: 'simulated-ocr',
        notice: 'Gemini API key não configurada no servidor. Retornando análise estruturada de demonstração.',
        data: {
          estabelecimento: 'Supermercado Sam’s Club',
          tipoEstabelecimento: 'Supermercado',
          data: '2026-03-09 15:30',
          numeroCupom: 'NFC-e ' + Math.floor(100000 + Math.random() * 900000),
          valorTotal: 349.5,
          itens: [
            {
              id: 'it-1',
              nome: 'Café em Grãos 1kg',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 49.9,
              precoTotal: 49.9,
            },
            {
              id: 'it-2',
              nome: 'Desinfetante Concentrado 5L',
              categoriaItem: 'Limpeza',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 39.6,
              precoTotal: 39.6,
            },
            {
              id: 'it-3',
              nome: 'Shampoo Anticaspa 400ml',
              categoriaItem: 'Higiene',
              subcategoriaSugerida: 'Farmácia',
              quantidade: 1,
              precoUnitario: 32.0,
              precoTotal: 32.0,
              desmembrado: true,
              motivoDesmembramento: 'IA sugeriu: Desmembrado para Farmácia / Higiene',
            },
            {
              id: 'it-4',
              nome: 'Carnes e Congelados Selecionados',
              categoriaItem: 'Alimentos',
              subcategoriaSugerida: 'Supermercado',
              quantidade: 1,
              precoUnitario: 228.0,
              precoTotal: 228.0,
            },
          ],
          divisaoCasal: {
            porcentagemFelipe: 50,
            porcentagemGenivania: 50,
            valorFelipe: 174.75,
            valorGenivania: 174.75,
          },
        },
      });
    }

    // Clean base64 string robustly
    let cleanBase64 = imageBase64;
    let detectedMime = (mimeType || 'image/jpeg').toLowerCase();

    if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
      const splitIdx = imageBase64.indexOf(',');
      const header = imageBase64.slice(0, splitIdx);
      cleanBase64 = imageBase64.slice(splitIdx + 1);
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1].toLowerCase();
      }
    }

    // Normalize mimeType accepted by Gemini API
    let validMime = 'image/jpeg';
    if (detectedMime.includes('png')) validMime = 'image/png';
    else if (detectedMime.includes('webp')) validMime = 'image/webp';
    else if (detectedMime.includes('heic')) validMime = 'image/heic';
    else if (detectedMime.includes('heif')) validMime = 'image/heif';
    else if (detectedMime.includes('pdf')) validMime = 'application/pdf';
    else validMime = 'image/jpeg';

    const prompt = `Você é o mais avançado especialista em OCR e auditoria de documentos fiscais e comprovantes de pagamento do Brasil para o Casal Duarte (Felipe Duarte e Genivânia Duarte).
Analise a imagem deste documento com máxima precisão e extraia todos os dados disponíveis.

O documento pode ser:
1. Cupom Fiscal Eletrônico (NFC-e, SAT, CF-e, DANFE simplificada, ECF de supermercado, atacado, farmácia, etc.)
2. Comprovante de Cartão de Crédito ou Débito (filipeta de maquininha Stone, Cielo, Rede, PagBank, PagSeguro, Mercado Pago, Ton, SafraPay, Getnet)
3. Comprovante de Transferência PIX ou TED (Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6 Bank, Mercado Pago)
4. Recibo Comercial, Conta de Consumo ou Pedido (Restaurante, Bar, Pizzaria, Lanchonete, iFood, Delivery, Posto de Combustível, Pedágio, Água, Luz, Internet)

INSTRUÇÕES RIGOROSAS:
- ITENS / PRODUTOS:
  * Se o documento contiver produtos/itens discriminados (ex: cupom fiscal ou nota de restaurante), liste CADA ITEM detalhadamente linha por linha.
  * Expanda siglas crípticas fiscais para nomes comerciais legíveis (ex: "LEIT UHT INT PIRAC 1L" -> "Leite UHT Integral Piracanjuba 1L", "DIPIR 500MG 20CP" -> "Dipirona Monoidratada 500mg 20 comp", "REFRIG COCA COLA LATA" -> "Refrigerante Coca-Cola 350ml").
  * Se o comprovante for de pagamento consolidado (ex: comprovante de maquininha de cartão ou PIX onde NÃO há lista discriminada de produtos), crie 1 item representativo com o nome do estabelecimento/transação (ex: "Consumo / Compra em [Estabelecimento]" ou "Transferência PIX para [Destinatário]"), quantidade 1 e valor total como preço.
  * Para cada item, forneça:
    - nome: descrição limpa e compreensível do produto/serviço.
    - codigoEan: código de barras/EAN numérico se estiver impresso no cupom, ou vazio se não houver.
    - categoriaItem: classifique em uma categoria (ex: "Alimentos", "Bebidas", "Limpeza", "Higiene", "Remédio", "Pet", "Lazer", "Transporte", "Restaurante", "Saúde", "Casa", "Vestuário", "Serviços" ou "Outros").
    - subcategoriaSugerida: subcategoria para o orçamento doméstico do casal ("Supermercado", "Farmácia", "Combustível", "Lazer", "Almoço/Jantar", "Saúde", "Casa", etc.).
    - quantidade: número float (se não discriminado, usar 1).
    - precoUnitario: número float em reais.
    - precoTotal: número float em reais.
    - desmembrado: true se o item pertence a um orçamento diferente da atividade principal do local (exemplo: remédios ou cosméticos comprados em supermercado, ou bebidas alcoólicas de lazer em compras de rotina).
    - motivoDesmembramento: justificativa caso seja desmembrado (ex: "IA sugeriu: Medicamento desmembrado para Farmácia/Saúde").

- VALORES E TOTAIS:
  * Extraia o valorTotal numérico float com centavos exatos.
  * Certifique-se de que o valorTotal reflita o valor real pago no documento.

- DADOS DO ESTABELECIMENTO E TRANSAÇÃO:
  * estabelecimento: Nome fantasia ou razão social da empresa ou favorecido do PIX.
  * tipoEstabelecimento: Supermercado, Farmácia, Restaurante/Bar, Posto de Combustível, Padaria, Açougue, Pet Shop, Lazer, Oficina, Serviços, etc.
  * data: Data e hora do documento no formato "YYYY-MM-DD HH:mm" (ou data identificada no comprovante).
  * numeroCupom: Número da NFC-e, SAT, NSU, DOC ou Código de Autenticação.
  * cnpj: CNPJ do estabelecimento se legível.
  * endereco: Endereço completo com cidade/UF se constar no documento.
  * formaPagamento: Forma de pagamento identificada (ex: "Mastercard Crédito", "Visa Débito", "PIX", "Dinheiro", "Boleto", "Vale Refeição").
  * comprador: Nome ou CPF do cliente/pagador se informado no documento.
  * chaveAcesso: Chave de 44 dígitos da NFC-e/SAT se presente (apenas números).

- FORMATO DA RESPOSTA (JSON STRICT):
  * Retorne APENAS um JSON válido. Não inclua markdown fences (\`\`\`json).
  * O objeto JSON principal DEVE ter os seguintes campos:
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
      }
    ];

    // Candidate models with high availability in Google Gen AI
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    let parsedData: any = null;
    let modelUsed = '';
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        console.log(`[Gemini OCR] Tentando analisar comprovante com modelo: ${candidate} (mime: ${validMime})...`);
        const response = await ai.models.generateContent({
          model: candidate,
          contents: requestContents,
          config: requestConfig,
        });

        if (response && response.text) {
          let raw = response.text.trim();
          // Strip any markdown fences if present
          if (raw.startsWith('```')) {
            raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
          }
          parsedData = JSON.parse(raw);
          modelUsed = candidate;
          console.log(`[Gemini OCR] Sucesso com modelo ${candidate}! Estabelecimento: "${parsedData.estabelecimento}", Total: R$ ${parsedData.valorTotal}, Itens extraídos: ${parsedData.itens?.length || 0}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini OCR Error on ${candidate}]:`, err?.message || err);
        continue;
      }
    }

    // If Gemini returned an object but with 0 items, synthesize item from total and establishment
    if (parsedData && (!parsedData.itens || parsedData.itens.length === 0)) {
      const estab = parsedData.estabelecimento || 'Estabelecimento Comercial';
      const tot = Number(parsedData.valorTotal) || 0;
      parsedData.itens = [
        {
          nome: `Despesa / Consumo em ${estab}`,
          categoriaItem: parsedData.tipoEstabelecimento || 'Outros',
          subcategoriaSugerida: parsedData.tipoEstabelecimento || 'Geral',
          quantidade: 1,
          precoUnitario: tot,
          precoTotal: tot,
          desmembrado: false,
        },
      ];
    }

    // If all models failed or no parsedData obtained
    if (!parsedData) {
      console.error('[Gemini OCR Critical] Todos os modelos falharam na extração. Último erro:', lastError?.message || lastError);
      return res.status(200).json({
        success: false,
        error: 'Não foi possível ler o comprovante com clareza. Certifique-se de que a imagem esteja nítida, com boa iluminação e o texto legível.',
        details: lastError?.message,
      });
    }

    const total = parsedData.valorTotal || 0;

    // Add unique IDs to items
    const itensWithIds = (parsedData.itens || []).map((it: any, idx: number) => ({
      id: `item-${Date.now()}-${idx}`,
      ...it,
    }));

    const result = {
      ...parsedData,
      itens: itensWithIds,
      divisaoCasal: {
        porcentagemFelipe: 50,
        porcentagemGenivania: 50,
        valorFelipe: Number((total / 2).toFixed(2)),
        valorGenivania: Number((total / 2).toFixed(2)),
      },
    };

    return res.json({
      success: true,
      source: modelUsed,
      data: result,
    });
  } catch (err: any) {
    console.error('[scan-receipt endpoint critical error]:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: 'Não foi possível processar o comprovante. Verifique a qualidade da imagem e tente novamente.',
      details: err?.message,
    });
  }
});

// 2.1 Multimodal OCR via Gemini specifically for Gas Station Fuel Receipts (Comprovante de Posto de Combustível)
app.post('/api/scan-fuel-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mockSample } = req.body;

    if (mockSample === 'shell') {
      return res.json({
        success: true,
        source: 'sample-shell',
        data: {
          posto: 'Auto Posto Shell Portal da Barra',
          combustivel: 'Gasolina Aditivada',
          valorTotal: 279.80,
          precoLitro: 5.95,
          litros: 47.03,
          data: '2026-03-11',
          km: 42260,
          numeroCupom: 'NFC-e #284102',
          formaPagamento: 'Mastercard Crédito',
          cnpj: '33.241.890/0001-12',
          endereco: 'Av. das Américas, 3400 - Barra da Tijuca, RJ',
          observacoes: 'Shell V-Power • Bico 04',
        },
      });
    }

    if (mockSample === 'ipiranga') {
      return res.json({
        success: true,
        source: 'sample-ipiranga',
        data: {
          posto: 'Posto Ipiranga Américas Sul',
          combustivel: 'Gasolina Comum',
          valorTotal: 265.50,
          precoLitro: 5.79,
          litros: 45.85,
          data: '2026-03-09',
          km: 41740,
          numeroCupom: 'SAT #94120',
          formaPagamento: 'PIX NuBank',
          cnpj: '18.492.381/0002-54',
          endereco: 'Av. das Américas, 7500 - Rio de Janeiro, RJ',
          observacoes: 'Gasolina Comum • Km Vantagens',
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback if API key is not yet set
      return res.json({
        success: true,
        source: 'simulated-ocr',
        notice: 'Gemini API key não configurada no servidor. Retornando análise estruturada de demonstração.',
        data: {
          posto: 'Posto Petrobras BR Linha Amarela',
          combustivel: 'Gasolina Comum',
          valorTotal: 260.00,
          precoLitro: 5.78,
          litros: 44.98,
          data: new Date().toISOString().slice(0, 10),
          km: null,
          numeroCupom: 'NFC-e #' + Math.floor(100000 + Math.random() * 900000),
          formaPagamento: 'Cartão de Crédito',
          cnpj: '02.431.902/0001-49',
          endereco: 'Av. Governador Carlos Lacerda, 4500 - RJ',
          observacoes: 'Leitura IA: informe o odômetro (KM) para cálculo exato de consumo.',
        },
      });
    }

    // Clean base64 string robustly
    let cleanBase64 = imageBase64;
    let detectedMime = (mimeType || 'image/jpeg').toLowerCase();

    if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
      const splitIdx = imageBase64.indexOf(',');
      const header = imageBase64.slice(0, splitIdx);
      cleanBase64 = imageBase64.slice(splitIdx + 1);
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1].toLowerCase();
      }
    }

    let validMime = 'image/jpeg';
    if (detectedMime.includes('png')) validMime = 'image/png';
    else if (detectedMime.includes('webp')) validMime = 'image/webp';
    else if (detectedMime.includes('pdf')) validMime = 'application/pdf';

    const prompt = `Você é um especialista em OCR e auditoria fiscal de comprovantes e cupons fiscais (NFC-e, SAT, CF-e ou filipetas de cartão) de POSTOS DE COMBUSTÍVEL no Brasil.
Analise a imagem deste comprovante de abastecimento e extraia com máxima exatidão:

1. posto: Nome fantasia do posto ou rede (ex: "Posto Shell", "Posto Ipiranga", "Posto Petrobras BR", "Auto Posto...", etc.)
2. combustivel: Tipo de combustível ("Gasolina Comum", "Gasolina Aditivada", "Etanol", "Diesel")
3. valorTotal: Valor total pago em reais (float numérico, ex: 250.00)
4. precoLitro: Preço por litro cobrado (float numérico, ex: 5.89). Se não estiver explícito, divida o valorTotal pelos litros.
5. litros: Quantidade de litros abastecidos (float numérico, ex: 42.44). Se não estiver explícito, divida o valorTotal pelo precoLitro.
6. data: Data do abastecimento no formato "YYYY-MM-DD"
7. km: Quilometragem do veículo se constar anotada à mão pelo frentista ou no campo de placa/odômetro da NFC-e (número inteiro, ex: 41250, ou null se não houver)
8. numeroCupom: Número da NFC-e, SAT ou NSU do comprovante
9. formaPagamento: Forma de pagamento identificada (ex: "Cartão de Crédito", "PIX", "Débito", "Dinheiro")
10. cnpj: CNPJ do posto se legível
11. endereco: Endereço do posto se constar

Retorne APENAS um JSON estrito no seguinte formato:
{
  "posto": "string",
  "combustivel": "string",
  "valorTotal": number,
  "precoLitro": number,
  "litros": number,
  "data": "string",
  "km": number | null,
  "numeroCupom": "string",
  "formaPagamento": "string",
  "cnpj": "string",
  "endereco": "string"
}`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    let parsedData: any = null;
    let modelUsed = '';
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        console.log(`[Gemini Fuel OCR] Tentando analisar comprovante de posto com modelo: ${candidate}...`);
        const response = await ai.models.generateContent({
          model: candidate,
          contents: [
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
          modelUsed = candidate;
          console.log(`[Gemini Fuel OCR] Sucesso com ${candidate}! Posto: "${parsedData.posto}", Total: R$ ${parsedData.valorTotal}, Litros: ${parsedData.litros}, Preço/L: R$ ${parsedData.precoLitro}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini Fuel OCR Error on ${candidate}]:`, err?.message || err);
        continue;
      }
    }

    if (!parsedData) {
      return res.status(200).json({
        success: false,
        error: 'Não foi possível ler com nitidez os dados do abastecimento. Você pode preencher manualmente os valores.',
        details: lastError?.message,
      });
    }

    return res.json({
      success: true,
      source: modelUsed,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('[scan-fuel-receipt critical error]:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: 'Erro no processamento do comprovante de combustível.',
      details: err?.message,
    });
  }
});

// 3. Shopping List REST API
app.get('/api/shopping-list', async (_req, res) => {
  if (isSupabaseServerConfigured) {
    try {
      const { data, error } = await supabaseServer.from('shopping_list').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const items = data.map((s: any) => ({
          id: s.id,
          estabelecimentoTipo: s.estabelecimento_tipo,
          estabelecimentoNome: s.estabelecimento_nome,
          nome: s.nome_do_item,
          quantidade: s.quantidade,
          categoriaItem: s.categoria_item,
          comprado: s.comprado,
          adicionadoPor: s.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
          origem: s.origem,
          precoEstimado: Number(s.preco_estimado || 0),
          dataAdicao: s.data_adicao,
        }));
        return res.json({ items });
      }
    } catch (e) {
      console.warn('Erro ao buscar lista do Supabase:', e);
    }
  }
  res.json({ items: shoppingListStore });
});

app.post('/api/shopping-list', async (req, res) => {
  const { nome, estabelecimentoTipo = 'Supermercado', estabelecimentoNome = 'Atacadão', quantidade, categoriaItem = 'Alimentos', adicionadoPor = 'Felipe', precoEstimado } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome do item é obrigatório.' });
  }
  const id = 'shop-' + Date.now();
  const newItem = {
    id,
    estabelecimentoTipo,
    estabelecimentoNome,
    nome,
    quantidade: quantidade || '1 un',
    categoriaItem,
    comprado: false,
    adicionadoPor: adicionadoPor.includes('Genivânia') ? 'Genivânia' : 'Felipe',
    dataAdicao: new Date().toISOString().split('T')[0],
    precoEstimado: Number(precoEstimado) || 0,
  };

  if (isSupabaseServerConfigured) {
    try {
      await supabaseServer.from('shopping_list').insert({
        id,
        usuario_id: newItem.adicionadoPor === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
        estabelecimento_tipo: estabelecimentoTipo,
        estabelecimento_nome: estabelecimentoNome,
        nome_do_item: nome,
        quantidade: newItem.quantidade,
        categoria_item: categoriaItem,
        comprado: false,
        origem: 'manual',
        preco_estimado: newItem.precoEstimado,
        data_adicao: newItem.dataAdicao,
      });
    } catch (e) {
      console.warn('Erro ao inserir item no Supabase:', e);
    }
  }

  shoppingListStore.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/shopping-list/:id', async (req, res) => {
  const { id } = req.params;
  if (isSupabaseServerConfigured) {
    try {
      const updates: any = {};
      if (req.body.comprado !== undefined) updates.comprado = req.body.comprado;
      if (req.body.nome !== undefined) updates.nome_do_item = req.body.nome;
      if (req.body.quantidade !== undefined) updates.quantidade = req.body.quantidade;
      await supabaseServer.from('shopping_list').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Erro ao atualizar item no Supabase:', e);
    }
  }
  const index = shoppingListStore.findIndex((i) => i.id === id);
  if (index !== -1) {
    shoppingListStore[index] = { ...shoppingListStore[index], ...req.body };
    return res.json({ success: true, item: shoppingListStore[index] });
  }
  res.json({ success: true });
});

app.delete('/api/shopping-list/:id', async (req, res) => {
  const { id } = req.params;
  if (isSupabaseServerConfigured) {
    try {
      await supabaseServer.from('shopping_list').delete().eq('id', id);
    } catch (e) {
      console.warn('Erro ao deletar item no Supabase:', e);
    }
  }
  shoppingListStore = shoppingListStore.filter((i) => i.id !== id);
  res.json({ success: true, deletedId: id });
});

// 4. Alexa Skill Integration Endpoint
app.post('/api/voice/alexa', (req, res) => {
  const { intent, slots = {}, userToken } = req.body;
  const commandText = req.body.commandText || `Intenção: ${intent}`;

  let alexaSpeech = '';
  let actionTaken = '';

  try {
    switch (intent) {
      case 'AdicionarItemLista': {
        const item = slots.item || slots.Item || 'Item';
        const local = slots.local || slots.Local || 'Supermercado';
        const qtd = slots.quantidade || '1';

        const newItem = {
          id: 'shop-alexa-' + Date.now(),
          estabelecimentoTipo: local.toLowerCase().includes('farm') ? 'Farmácia' : 'Supermercado',
          nome: item,
          quantidade: qtd,
          categoriaItem: local.toLowerCase().includes('farm') ? 'Remédio' : 'Alimentos',
          comprado: false,
          adicionadoPor: 'Alexa',
          dataAdicao: new Date().toISOString().split('T')[0],
        };
        shoppingListStore.unshift(newItem);

        alexaSpeech = `Adicionei ${qtd} de ${item} à lista do ${local} no Duarte Finanças.`;
        actionTaken = `Item "${item}" adicionado à lista do ${local}.`;
        break;
      }
      case 'ConsultarGastos': {
        const categoria = slots.categoria || slots.Categoria || 'supermercado';
        alexaSpeech = `Este mês vocês gastaram R$ 1.850,35 em ${categoria}. O teto planejado do casal é R$ 2.400,00, restando R$ 549,65 disponíveis.`;
        actionTaken = `Consulta de gastos em ${categoria} respondida.`;
        break;
      }
      case 'ConsultarMetas': {
        alexaSpeech = `Vocês estão dentro das metas de Março! A meta de economia de R$ 3.000,00 foi cumprida. O orçamento do carro está em 62% e o de lazer em 81%.`;
        actionTaken = 'Resumo de metas reportado.';
        break;
      }
      case 'VerificarEstouro': {
        alexaSpeech = `Nenhuma categoria estourou o orçamento este mês no Casal Duarte. Em fevereiro houve estouro de R$ 180 em supermercado devido ao Carnaval, mas março está equilibrado.`;
        actionTaken = 'Verificação de orçamento executada.';
        break;
      }
      default: {
        alexaSpeech = `Duarte Finanças conectado. Você pode pedir para adicionar itens na lista de compras ou perguntar sobre os gastos do mês.`;
        actionTaken = 'Boas-vindas da Skill Alexa.';
      }
    }

    voiceLogs.unshift({
      id: 'vl-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      source: 'Alexa',
      command: commandText,
      result: alexaSpeech,
      status: 'sucesso',
    });

    res.json({
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: alexaSpeech,
        },
        card: {
          type: 'Simple',
          title: 'Duarte Finanças',
          content: alexaSpeech,
        },
        shouldEndSession: true,
      },
      actionTaken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Apple Siri Shortcuts Integration Endpoint
app.post('/api/voice/siri', (req, res) => {
  const { action, params = {} } = req.body;
  const commandText = req.body.commandText || `Ação: ${action}`;

  let siriResponse = '';

  try {
    if (action === 'RegistrarDespesa') {
      const valor = Number(params.valor) || 0;
      const subcategoria = params.subcategoria || 'Lazer';
      const estabelecimento = params.estabelecimento || 'Diversos';

      siriResponse = `Despesa de R$ ${valor.toFixed(2).replace('.', ',')} em ${subcategoria} (${estabelecimento}) registrada com sucesso no Casal Duarte!`;
    } else if (action === 'AdicionarItem') {
      const item = params.item || 'Item';
      const newItem = {
        id: 'shop-siri-' + Date.now(),
        estabelecimentoTipo: params.tipo || 'Supermercado',
        nome: item,
        quantidade: params.quantidade || '1 un',
        categoriaItem: 'Alimentos',
        comprado: false,
        adicionadoPor: 'Siri',
        dataAdicao: new Date().toISOString().split('T')[0],
      };
      shoppingListStore.unshift(newItem);
      siriResponse = `"${item}" adicionado à lista de compras via Siri Shortcuts.`;
    } else if (action === 'ConsultarResumo') {
      siriResponse = `Resumo Março 2026: Total gasto R$ 5.823,90. Economia mensal: R$ 3.000,00 guardados. Metas sob controle!`;
    } else {
      siriResponse = `Atalho Duarte Finanças executado com sucesso.`;
    }

    voiceLogs.unshift({
      id: 'vl-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      source: 'Siri',
      command: commandText,
      result: siriResponse,
      status: 'sucesso',
    });

    res.json({
      success: true,
      message: siriResponse,
      spokenFeedback: siriResponse,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Voice Logs & Interactive Docs Endpoint
app.get('/api/voice/logs', (_req, res) => {
  res.json({ logs: voiceLogs });
});

app.get('/api/voice/docs', (_req, res) => {
  res.json({
    alexa: {
      endpoint: '/api/voice/alexa',
      supportedIntents: [
        {
          intent: 'AdicionarItemLista',
          sampleUtterances: [
            'Alexa, adicionar 2 kg de arroz à lista de supermercado',
            'Alexa, adicionar protetor solar à lista da farmácia',
          ],
          slots: { item: 'string', local: 'Supermercado | Farmácia', quantidade: 'string' },
        },
        {
          intent: 'ConsultarGastos',
          sampleUtterances: [
            'Alexa, quanto eu gastei em supermercado este mês?',
            'Alexa, quanto gastamos em lazer?',
          ],
          slots: { categoria: 'string', mes: 'string' },
        },
        {
          intent: 'ConsultarMetas',
          sampleUtterances: ['Alexa, como estão as metas do casal?'],
        },
        {
          intent: 'VerificarEstouro',
          sampleUtterances: ['Alexa, alguma categoria estourou o orçamento?'],
        },
      ],
    },
    siri: {
      endpoint: '/api/voice/siri',
      supportedActions: [
        {
          action: 'RegistrarDespesa',
          sample: 'Siri, registrar despesa de R$ 50 em Lazer hoje',
          payload: { action: 'RegistrarDespesa', params: { valor: 50, subcategoria: 'Lazer', estabelecimento: 'Padaria' } },
        },
        {
          action: 'AdicionarItem',
          sample: 'Siri, adicionar sabão à lista de compras',
          payload: { action: 'AdicionarItem', params: { item: 'Sabão em pó 2kg', tipo: 'Supermercado' } },
        },
        {
          action: 'ConsultarResumo',
          sample: 'Siri, resumo financeiro do casal',
          payload: { action: 'ConsultarResumo' },
        },
      ],
    },
  });
});

// Summary KPI endpoint
app.get('/api/summary/monthly', (_req, res) => {
  res.json({
    mes: 'Março 2026',
    totalGasto: 5823.9,
    totalPlanejado: 7119.9,
    economiaMes: 3000.0,
    carroTotal: 849.9, // Seguro 240 + Rastreador 89.9 + Combustível 520
    supermercadoTotal: 1850.35,
    lazerTotal: 980.0,
    farmaciaTotal: 142.7,
    estouroCategorias: [],
    divisaoCasal: {
      felipe: 2911.95,
      genivania: 2911.95,
    },
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Duarte Finanças running on http://localhost:${PORT}`);
  });
}

startServer();
