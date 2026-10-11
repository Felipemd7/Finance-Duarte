import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { supabaseServer, isSupabaseServerConfigured } from './server/supabase';
import { analyzeReceiptImage, analyzeFuelReceiptImage } from './server/receiptAnalyzer';

dotenv.config();

const app = express();
const PORT = 3000;

// Support generous payload for base64 receipt images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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
// Implementação única e compartilhada em server/receiptAnalyzer.ts (também usada pelos
// serverless functions em api/scan-receipt.ts e api/scan-fuel-receipt.ts em produção).
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
    }

    const result = await analyzeReceiptImage(imageBase64, mimeType);
    const total = result.valorTotal || 0;

    return res.json({
      success: true,
      data: {
        ...result,
        itens: (result.itens || []).map((it, idx) => ({ id: `item-${Date.now()}-${idx}`, ...it })),
        divisaoCasal: {
          porcentagemFelipe: 50,
          porcentagemGenivania: 50,
          valorFelipe: Number((total / 2).toFixed(2)),
          valorGenivania: Number((total / 2).toFixed(2)),
        },
      },
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

// 2.1 Multimodal OCR via Gemini specifically for Gas Station Fuel Receipts
app.post('/api/scan-fuel-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
    }

    const data = await analyzeFuelReceiptImage(imageBase64, mimeType);
    return res.json({ success: true, data });
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
