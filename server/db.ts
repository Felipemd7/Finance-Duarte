import fs from 'fs';
import path from 'path';
import {
  User,
  Category,
  Subcategory,
  Establishment,
  Transaction,
  PurchaseItem,
  FinancialGoal,
  ShoppingListItem,
  ReceiptData,
  FuelLog,
  SpreadsheetRow,
} from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  subcategories: Subcategory[];
  establishments: Establishment[];
  transactions: Transaction[];
  goals: FinancialGoal[];
  shoppingList: ShoppingListItem[];
  receipts: ReceiptData[];
  spreadsheetImportHistory: {
    importedAt: string;
    rowCount: number;
    filename?: string;
  }[];
  expectativasMensais: Record<string, Record<string, number>>; // mes (2026-01) -> subcategoriaNome -> valor
  vehicles: Array<{
    id: string;
    modelo: string;
    placa: string;
    ano?: number;
    odometroAtual: number;
    motoristaPrincipalId?: string;
    custosFixosRateadosKm?: number;
  }>;
  fuelLogs: FuelLog[];
}

const defaultCategories: Category[] = [
  { id: 'cat-invariavel', nome: 'Invariável', cor: '#3b82f6', icone: 'Lock', descricao: 'Custos fixos e essenciais que ocorrem todos os meses' },
  { id: 'cat-variavel', nome: 'Variável', cor: '#10b981', icone: 'ShoppingBag', descricao: 'Despesas do dia a dia sujeitas a flutuação e controle' },
  { id: 'cat-extra', nome: 'Extra/Eventualidades', cor: '#f59e0b', icone: 'AlertTriangle', descricao: 'Despesas sazonais, emergências, carro e investimentos' },
];

const defaultSubcategories: Subcategory[] = [
  // Invariável
  { id: 'sub-aluguel', categoria_id: 'cat-invariavel', nome: 'Aluguel', limite_padrao: 2400 },
  { id: 'sub-condominio', categoria_id: 'cat-invariavel', nome: 'Condomínio', limite_padrao: 650 },
  { id: 'sub-internet', categoria_id: 'cat-invariavel', nome: 'Internet', limite_padrao: 130 },
  { id: 'sub-rastreador', categoria_id: 'cat-invariavel', nome: 'Rastreador', limite_padrao: 90 },
  { id: 'sub-seguro', categoria_id: 'cat-invariavel', nome: 'Seguro', limite_padrao: 280 },
  { id: 'sub-assinaturas', categoria_id: 'cat-invariavel', nome: 'Assinaturas Extras', limite_padrao: 110 },
  
  // Variável
  { id: 'sub-supermercado', categoria_id: 'cat-variavel', nome: 'Supermercado', limite_padrao: 2500 },
  { id: 'sub-combustivel', categoria_id: 'cat-variavel', nome: 'Combustível', limite_padrao: 800 },
  { id: 'sub-farmacia', categoria_id: 'cat-variavel', nome: 'Farmácia', limite_padrao: 300 },
  { id: 'sub-lazer', categoria_id: 'cat-variavel', nome: 'Lazer', limite_padrao: 1200 },
  { id: 'sub-pedagio', categoria_id: 'cat-variavel', nome: 'Pedágio', limite_padrao: 80 },
  { id: 'sub-estacionamento', categoria_id: 'cat-variavel', nome: 'Estacionamento', limite_padrao: 70 },
  
  // Extra / Eventualidades
  { id: 'sub-manutencao-carro', categoria_id: 'cat-extra', nome: 'Manutenção de carro', limite_padrao: 500 },
  { id: 'sub-ipva', categoria_id: 'cat-extra', nome: 'IPVA', limite_padrao: 350 },
  { id: 'sub-eletro', categoria_id: 'cat-extra', nome: 'Eletrodomésticos', limite_padrao: 200 },
  { id: 'sub-moveis', categoria_id: 'cat-extra', nome: 'Móveis', limite_padrao: 150 },
  { id: 'sub-saude', categoria_id: 'cat-extra', nome: 'Saúde', limite_padrao: 300 },
  { id: 'sub-eventualidades', categoria_id: 'cat-extra', nome: 'Eventualidades', limite_padrao: 600 },
];

const defaultEstablishments: Establishment[] = [
  { id: 'est-atacadao', nome: 'Atacadão', tipo: 'Supermercado', cidade: 'São Paulo' },
  { id: 'est-sams', nome: "Sam's Club", tipo: 'Supermercado', cidade: 'São Paulo' },
  { id: 'est-ferreira', nome: 'Ferreira Supermercados', tipo: 'Supermercado', cidade: 'São Paulo' },
  { id: 'est-comercial-uniao', nome: 'Comercial União', tipo: 'Supermercado', cidade: 'São Paulo' },
  { id: 'est-droga-raia', nome: 'Droga Raia', tipo: 'Farmácia', cidade: 'São Paulo' },
  { id: 'est-drogasil', nome: 'Drogasil', tipo: 'Farmácia', cidade: 'São Paulo' },
  { id: 'est-posto-shell', nome: 'Posto Shell Duarte', tipo: 'Posto de combustível', cidade: 'São Paulo' },
  { id: 'est-posto-ipiranga', nome: 'Posto Ipiranga Express', tipo: 'Posto de combustível', cidade: 'São Paulo' },
  { id: 'est-oficina-duarte', nome: 'Oficina Mecânica Precision Car', tipo: 'Oficina', cidade: 'São Paulo' },
  { id: 'est-sem-parar', nome: 'Sem Parar / Concessionária AutoBan', tipo: 'Serviços', cidade: 'São Paulo' },
  { id: 'est-cinema', nome: 'Cinemark / Restaurantes', tipo: 'Restaurante/Lazer', cidade: 'São Paulo' },
];

const defaultUsers: User[] = [
  { id: 'usr-felipe', nome: 'Felipe Duarte', email: 'felipemd114@gmail.com', avatarColor: '#2563eb', data_criacao: '2026-01-01' },
  { id: 'usr-genivania', nome: 'Genivânia Duarte', email: 'genivaniaduarte@gmail.com', avatarColor: '#ec4899', data_criacao: '2026-01-01' },
];

// Seed initial historical records for Jan-Aug 2026 based on Casal Duarte spreadsheets
function generateInitialData(): DatabaseSchema {
  const transactions: Transaction[] = [];
  const expectativasMensais: Record<string, Record<string, number>> = {};
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];

  // Base monthly expectations (EXPECTATIVA das planilhas)
  const baseExpectativas: Record<string, number> = {
    'Aluguel': 2400,
    'Condomínio': 650,
    'Internet': 130,
    'Rastreador': 90,
    'Seguro': 280,
    'Assinaturas Extras': 110,
    'Supermercado': 2500,
    'Combustível': 800,
    'Farmácia': 300,
    'Lazer': 1200,
    'Pedágio': 80,
    'Estacionamento': 70,
    'Manutenção de carro': 400,
    'IPVA': 350,
    'Eletrodomésticos': 100,
    'Móveis': 0,
    'Saúde': 250,
    'Eventualidades': 600,
  };

  let txIdCounter = 1;

  months.forEach((m, mIdx) => {
    expectativasMensais[m] = { ...baseExpectativas };

    // Monthly incomes for the couple
    transactions.push({
      id: `tx-salario-felipe-${m}`,
      usuario_id: 'usr-felipe',
      data: `${m}-05`,
      mes_ano: m,
      valor: 8500,
      tipo: 'receita',
      forma_pagamento: 'pix',
      status: 'pago',
      categoria_id: 'cat-invariavel',
      subcategoria_id: 'sub-aluguel', // dummy income subcat
      observacoes: 'Salário Felipe Duarte',
      created_at: `${m}-05T08:00:00Z`,
    });

    transactions.push({
      id: `tx-salario-camila-${m}`,
      usuario_id: 'usr-genivania',
      data: `${m}-05`,
      mes_ano: m,
      valor: 7200,
      tipo: 'receita',
      forma_pagamento: 'pix',
      status: 'pago',
      categoria_id: 'cat-invariavel',
      subcategoria_id: 'sub-aluguel',
      observacoes: 'Salário Genivânia Duarte',
      created_at: `${m}-05T08:00:00Z`,
    });

    // Invariável monthly expenses
    const fixedList: { sub: string; val: number; day: number; est?: string }[] = [
      { sub: 'sub-aluguel', val: 2400, day: 10 },
      { sub: 'sub-condominio', val: 650 + (mIdx % 3 === 0 ? 35 : 0), day: 10 },
      { sub: 'sub-internet', val: 130, day: 15 },
      { sub: 'sub-rastreador', val: 90, day: 12 },
      { sub: 'sub-seguro', val: 280, day: 20 },
      { sub: 'sub-assinaturas', val: 119.90, day: 18 },
    ];

    fixedList.forEach(item => {
      transactions.push({
        id: `tx-${txIdCounter++}`,
        usuario_id: 'usr-felipe',
        data: `${m}-${String(item.day).padStart(2, '0')}`,
        mes_ano: m,
        valor: item.val,
        tipo: 'despesa',
        forma_pagamento: 'pix',
        status: 'pago',
        categoria_id: 'cat-invariavel',
        subcategoria_id: item.sub,
        observacoes: `Pagamento mensalidade`,
        created_at: `${m}-${String(item.day).padStart(2, '0')}T10:00:00Z`,
      });
    });

    // Supermercado: 3-4 visits per month (Atacadão, Sam's Club, Ferreira, Comercial União)
    // Month 3 and 7 had an overage in Supermarket to demonstrate alert
    const superMultiplier = m === '2026-03' ? 1.15 : m === '2026-07' ? 1.18 : 0.96 + (mIdx * 0.02);
    const superTxs = [
      { day: 3, est: 'est-atacadao', val: Math.round(950 * superMultiplier) },
      { day: 12, est: 'est-sams', val: Math.round(720 * superMultiplier) },
      { day: 20, est: 'est-ferreira', val: Math.round(480 * superMultiplier) },
      { day: 27, est: 'est-comercial-uniao', val: Math.round(390 * superMultiplier) },
    ];

    superTxs.forEach((stx, i) => {
      const items: PurchaseItem[] = [];
      if (i === 0) {
        items.push(
          { id: `item-${txIdCounter}-1`, transacao_id: `tx-${txIdCounter}`, nome_do_item: 'Arroz Integral 5kg', categoria_item: 'alimento', quantidade: 2, preco_unitario: 32.9, preco_total: 65.8 },
          { id: `item-${txIdCounter}-2`, transacao_id: `tx-${txIdCounter}`, nome_do_item: 'Azeite Extra Virgem 500ml', categoria_item: 'alimento', quantidade: 3, preco_unitario: 44.5, preco_total: 133.5 },
          { id: `item-${txIdCounter}-3`, transacao_id: `tx-${txIdCounter}`, nome_do_item: 'Detergente Líquido 5L', categoria_item: 'limpeza', quantidade: 1, preco_unitario: 28.9, preco_total: 28.9 },
          { id: `item-${txIdCounter}-4`, transacao_id: `tx-${txIdCounter}`, nome_do_item: 'Shampoo & Condicionador', categoria_item: 'higiene', quantidade: 2, preco_unitario: 35.0, preco_total: 70.0 }
        );
      }

      transactions.push({
        id: `tx-${txIdCounter++}`,
        usuario_id: i % 2 === 0 ? 'usr-felipe' : 'usr-genivania',
        data: `${m}-${String(stx.day).padStart(2, '0')}`,
        mes_ano: m,
        valor: stx.val,
        tipo: 'despesa',
        forma_pagamento: 'cartao',
        status: 'pago',
        categoria_id: 'cat-variavel',
        subcategoria_id: 'sub-supermercado',
        estabelecimento_id: stx.est,
        observacoes: `Compras quinzenais de mantimentos e limpeza`,
        itens: items.length ? items : undefined,
        created_at: `${m}-${String(stx.day).padStart(2, '0')}T14:30:00Z`,
      });
    });

    // Combustível: 2 visits per month (Posto Shell, Posto Ipiranga)
    const combVals = [Math.round(360 + (mIdx * 10)), Math.round(390 + (mIdx * 8))];
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-felipe',
      data: `${m}-08`,
      mes_ano: m,
      valor: combVals[0],
      tipo: 'despesa',
      forma_pagamento: 'cartao',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-combustivel',
      estabelecimento_id: 'est-posto-shell',
      observacoes: 'Gasolina aditivada tanque cheio',
      created_at: `${m}-08T17:00:00Z`,
    });
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-genivania',
      data: `${m}-22`,
      mes_ano: m,
      valor: combVals[1],
      tipo: 'despesa',
      forma_pagamento: 'cartao',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-combustivel',
      estabelecimento_id: 'est-posto-ipiranga',
      observacoes: 'Abastecimento semanal',
      created_at: `${m}-22T19:00:00Z`,
    });

    // Farmácia
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-genivania',
      data: `${m}-14`,
      mes_ano: m,
      valor: 180 + (mIdx % 2 === 0 ? 95 : 40),
      tipo: 'despesa',
      forma_pagamento: 'debito',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-farmacia',
      estabelecimento_id: 'est-droga-raia',
      observacoes: 'Medicamentos de uso contínuo e cuidados pessoais',
      created_at: `${m}-14T11:00:00Z`,
    });

    // Lazer (Cinemas, Jantares, Passeios)
    // Over budget in June (m === '2026-06') for Dia dos Namorados / Viagem curta
    const lazerVal = m === '2026-06' ? 1580 : 920 + (mIdx * 35);
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-felipe',
      data: `${m}-12`,
      mes_ano: m,
      valor: Math.round(lazerVal * 0.45),
      tipo: 'despesa',
      forma_pagamento: 'cartao',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-lazer',
      estabelecimento_id: 'est-cinema',
      observacoes: 'Jantar e cinema fim de semana',
      created_at: `${m}-12T21:00:00Z`,
    });
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-genivania',
      data: `${m}-25`,
      mes_ano: m,
      valor: Math.round(lazerVal * 0.55),
      tipo: 'despesa',
      forma_pagamento: 'cartao',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-lazer',
      observacoes: 'Restaurante / Encontro com amigos',
      created_at: `${m}-25T20:30:00Z`,
    });

    // Pedágio & Estacionamento
    transactions.push({
      id: `tx-${txIdCounter++}`,
      usuario_id: 'usr-felipe',
      data: `${m}-18`,
      mes_ano: m,
      valor: 74.5,
      tipo: 'despesa',
      forma_pagamento: 'debito',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id: 'sub-pedagio',
      estabelecimento_id: 'est-sem-parar',
      observacoes: 'Pedágio Viagem Interior',
      created_at: `${m}-18T10:00:00Z`,
    });

    // Extra / Eventualidades (Carro, Saúde, etc.)
    if (m === '2026-01') {
      // IPVA em Janeiro
      transactions.push({
        id: `tx-${txIdCounter++}`,
        usuario_id: 'usr-felipe',
        data: '2026-01-20',
        mes_ano: m,
        valor: 1450,
        tipo: 'despesa',
        forma_pagamento: 'pix',
        status: 'pago',
        categoria_id: 'cat-extra',
        subcategoria_id: 'sub-ipva',
        observacoes: 'IPVA Carro Casal Duarte cota única com desconto',
        created_at: '2026-01-20T10:00:00Z',
      });
    }

    if (m === '2026-04') {
      // Manutenção de carro em Abril (revisão preventiva + pastilhas)
      transactions.push({
        id: `tx-${txIdCounter++}`,
        usuario_id: 'usr-felipe',
        data: '2026-04-16',
        mes_ano: m,
        valor: 1250,
        tipo: 'despesa',
        forma_pagamento: 'cartao',
        status: 'pago',
        categoria_id: 'cat-extra',
        subcategoria_id: 'sub-manutencao-carro',
        estabelecimento_id: 'est-oficina-duarte',
        observacoes: 'Troca de óleo, filtros e pastilhas de freio do carro',
        created_at: '2026-04-16T15:00:00Z',
      });
    }

    if (m === '2026-08') {
      // Eventualidade recente em Agosto
      transactions.push({
        id: `tx-${txIdCounter++}`,
        usuario_id: 'usr-genivania',
        data: '2026-08-11',
        mes_ano: m,
        valor: 480,
        tipo: 'despesa',
        forma_pagamento: 'pix',
        status: 'pago',
        categoria_id: 'cat-extra',
        subcategoria_id: 'sub-eventualidades',
        observacoes: 'Conserto máquina de lavar roupa (técnico)',
        created_at: '2026-08-11T14:00:00Z',
      });
    }
  });

  const goals: FinancialGoal[] = [
    {
      id: 'goal-economia-mensal',
      usuario_id: 'usr-felipe',
      tipo_meta: 'economia',
      periodo: 'mensal',
      valor_planejado: 3500,
      descricao: 'Economia Mensal Conjunta do Casal para Reserva e Investimentos',
    },
    {
      id: 'goal-supermercado',
      usuario_id: 'usr-felipe',
      tipo_meta: 'gasto',
      periodo: 'mensal',
      valor_planejado: 2500,
      subcategoria_id: 'sub-supermercado',
      descricao: 'Teto Mensal de Supermercado e Feira',
    },
    {
      id: 'goal-lazer',
      usuario_id: 'usr-genivania',
      tipo_meta: 'gasto',
      periodo: 'mensal',
      valor_planejado: 1200,
      subcategoria_id: 'sub-lazer',
      descricao: 'Teto Mensal para Lazer, Jantares e Passeios',
    },
    {
      id: 'goal-combustivel',
      usuario_id: 'usr-felipe',
      tipo_meta: 'gasto',
      periodo: 'mensal',
      valor_planejado: 800,
      subcategoria_id: 'sub-combustivel',
      descricao: 'Limite para Combustível do Carro',
    },
    {
      id: 'goal-carro-anual',
      usuario_id: 'usr-felipe',
      tipo_meta: 'gasto',
      periodo: 'anual',
      valor_planejado: 14000,
      descricao: 'Orçamento Total Anual do Carro (Combustível + Seguro + IPVA + Manutenção)',
    },
    {
      id: 'goal-eventualidades',
      usuario_id: 'usr-genivania',
      tipo_meta: 'gasto',
      periodo: 'mensal',
      valor_planejado: 800,
      subcategoria_id: 'sub-eventualidades',
      descricao: 'Teto para Eventualidades e Imprevistos',
    },
  ];

  const shoppingList: ShoppingListItem[] = [
    {
      id: 'shop-1',
      estabelecimento_tipo: 'Supermercado',
      estabelecimento_nome: 'Atacadão',
      nome_do_item: 'Arroz Integral 5kg',
      quantidade: '2 pacotes',
      categoria_item: 'alimento',
      comprado: false,
      origem: 'manual',
      data_adicao: '2026-08-20',
    },
    {
      id: 'shop-2',
      estabelecimento_tipo: 'Supermercado',
      estabelecimento_nome: 'Atacadão',
      nome_do_item: 'Azeite de Oliva Extra Virgem',
      quantidade: '3 garrafas',
      categoria_item: 'alimento',
      comprado: false,
      origem: 'alexa',
      data_adicao: '2026-08-21',
    },
    {
      id: 'shop-3',
      estabelecimento_tipo: 'Supermercado',
      estabelecimento_nome: "Sam's Club",
      nome_do_item: 'Detergente Neutro 5L',
      quantidade: '1 galão',
      categoria_item: 'limpeza',
      comprado: false,
      origem: 'siri',
      data_adicao: '2026-08-22',
    },
    {
      id: 'shop-4',
      estabelecimento_tipo: 'Farmácia',
      estabelecimento_nome: 'Droga Raia',
      nome_do_item: 'Protetor Solar Facial FPS 50',
      quantidade: '1 unidade',
      categoria_item: 'higiene',
      comprado: false,
      origem: 'alexa',
      data_adicao: '2026-08-23',
    },
    {
      id: 'shop-5',
      estabelecimento_tipo: 'Farmácia',
      estabelecimento_nome: 'Droga Raia',
      nome_do_item: 'Vitamina C 1000mg',
      quantidade: '1 frasco',
      categoria_item: 'remedio',
      comprado: false,
      origem: 'manual',
      data_adicao: '2026-08-24',
    },
  ];

  return {
    users: defaultUsers,
    categories: defaultCategories,
    subcategories: defaultSubcategories,
    establishments: defaultEstablishments,
    transactions,
    goals,
    shoppingList,
    receipts: [],
    spreadsheetImportHistory: [
      {
        importedAt: '2026-08-30T10:00:00Z',
        rowCount: 142,
        filename: 'Controle_Financeiro_Casal_Duarte_2026_Jan_Ago.xlsx',
      },
    ],
    expectativasMensais,
    vehicles: [
      {
        id: 'veh-compass',
        modelo: 'Compass Limited 1.3 Turbo',
        placa: 'DUA-2026',
        ano: 2025,
        odometroAtual: 42260,
        motoristaPrincipalId: 'usr-felipe',
        custosFixosRateadosKm: 0.53,
      },
    ],
    fuelLogs: [
      {
        id: 'fuel-1',
        data: '2026-02-14',
        posto: 'Posto Shell Duarte',
        combustivel: 'Gasolina Aditivada',
        valorTotal: 275.50,
        precoLitro: 5.89,
        litros: 46.77,
        kmAtual: 40850,
        kmRodados: 0,
        consumoKmPorLitro: 0,
        custoPorKm: 0,
        pagoPor: 'Felipe',
        formaPagamento: 'Cartão de Crédito NuBank',
        observacoes: 'Tanque cheio viagem fim de semana',
      },
      {
        id: 'fuel-2',
        data: '2026-02-28',
        posto: 'Posto Ipiranga Express',
        combustivel: 'Gasolina Comum',
        valorTotal: 260.00,
        precoLitro: 5.79,
        litros: 44.90,
        kmAtual: 41380,
        kmRodados: 530,
        consumoKmPorLitro: 11.80,
        custoPorKm: 0.49,
        pagoPor: 'Genivânia',
        formaPagamento: 'PIX NuBank',
        observacoes: 'Abastecimento urbano Genivânia',
      },
      {
        id: 'fuel-3',
        data: '2026-03-05',
        posto: 'Posto Shell Duarte',
        combustivel: 'Gasolina Aditivada',
        valorTotal: 282.40,
        precoLitro: 5.92,
        litros: 47.70,
        kmAtual: 41920,
        kmRodados: 540,
        consumoKmPorLitro: 11.32,
        custoPorKm: 0.52,
        pagoPor: 'Felipe',
        formaPagamento: 'Cartão de Crédito NuBank',
        observacoes: 'Shell V-Power • Bico 04',
      },
      {
        id: 'fuel-4',
        data: '2026-03-11',
        posto: 'Auto Posto Shell Portal da Barra',
        combustivel: 'Gasolina Aditivada',
        valorTotal: 279.80,
        precoLitro: 5.95,
        litros: 47.03,
        kmAtual: 42260,
        kmRodados: 340,
        consumoKmPorLitro: 11.75,
        custoPorKm: 0.51,
        pagoPor: 'Felipe',
        formaPagamento: 'Cartão de Crédito NuBank',
        observacoes: 'Leitura IA NFC-e #284102',
      },
    ],
  };
}

function enrichSupermarketTransactions(data: DatabaseSchema): boolean {
  let modified = false;
  data.transactions.forEach((tx, idx) => {
    if (tx.subcategoria_id === 'sub-supermercado' && (!tx.itens || tx.itens.length === 0)) {
      modified = true;
      const totalVal = tx.valor || 600;
      const mIdx = parseInt(tx.mes_ano.split('-')[1] || '1', 10);
      const estId = tx.estabelecimento_id || '';

      const items: PurchaseItem[] = [];
      let itemCounter = 1;
      const makeItem = (nome: string, cat: any, qtd: number, pu: number): PurchaseItem => ({
        id: `item-${tx.id}-${itemCounter++}`,
        transacao_id: tx.id,
        nome_do_item: nome,
        categoria_item: cat,
        quantidade: Math.round(qtd * 100) / 100,
        preco_unitario: Math.round(pu * 100) / 100,
        preco_total: Math.round(qtd * pu * 100) / 100,
      });

      // Price inflation factor across Jan (0.94) to Aug (1.06)
      const inf = 0.94 + (mIdx * 0.015);

      if (estId.includes('atacadao') || idx % 4 === 0) {
        // Large grocery & meat haul
        items.push(makeItem('Patinho Bovino Moído', 'alimento', 3.2, 37.90 * inf));
        items.push(makeItem('Filé de Peito de Frango', 'alimento', 4.5, 21.90 * inf));
        items.push(makeItem('Alcatra Bovina Especial', 'alimento', 2.8, 47.90 * inf));
        items.push(makeItem('Arroz Branco Tipo 1 5kg', 'alimento', 2, 29.90 * inf));
        items.push(makeItem('Feijão Carioca Nobre 1kg', 'alimento', 3, 8.50 * inf));
        items.push(makeItem('Azeite Extra Virgem 500ml', 'alimento', 2, 42.90 * inf));
        items.push(makeItem('Café Torrado e Moído 500g', 'alimento', 3, 22.90 * inf));
        items.push(makeItem('Leite Integral UHT 1L', 'alimento', 12, 4.89 * inf));
        items.push(makeItem('Sabão em Pó Concentrado 2kg', 'limpeza', 1, 35.90 * inf));
        items.push(makeItem('Detergente Líquido 500ml', 'limpeza', 6, 2.89 * inf));
        items.push(makeItem('Papel Higiênico Folha Dupla 12un', 'higiene', 2, 22.90 * inf));
      } else if (estId.includes('sams') || idx % 4 === 1) {
        // Prime cuts & specialty
        items.push(makeItem('Picanha Bovina Nobre', 'alimento', 2.4, 78.90 * inf));
        items.push(makeItem('Contrafilé Bovino Prime', 'alimento', 2.6, 54.90 * inf));
        items.push(makeItem('Queijo Mussarela Peça', 'alimento', 1.2, 41.50 * inf));
        items.push(makeItem('Peito de Peru Defumado Fatiado', 'alimento', 0.8, 48.00 * inf));
        items.push(makeItem('Iogurte Grego 6un', 'alimento', 2, 24.90 * inf));
        items.push(makeItem('Suco de Uva Integral 1.5L', 'bebida', 3, 18.90 * inf));
        items.push(makeItem('Manteiga com Sal 200g', 'alimento', 2, 14.50 * inf));
      } else if (estId.includes('ferreira') || idx % 4 === 2) {
        // Poultry, pork, produce, dairy
        items.push(makeItem('Sobrecoxa de Frango Desossada', 'alimento', 3.2, 23.90 * inf));
        items.push(makeItem('Linguiça de Pernil Artesanal', 'alimento', 2.2, 28.50 * inf));
        items.push(makeItem('Banana Prata Climatizada', 'alimento', 2.5, 7.90 * inf));
        items.push(makeItem('Maçã Gala Selecionada', 'alimento', 2.0, 11.90 * inf));
        items.push(makeItem('Tomate Italiano', 'alimento', 2.4, 9.50 * inf));
        items.push(makeItem('Batata Inglesa Lavada', 'alimento', 3.0, 6.90 * inf));
        items.push(makeItem('Ovos Brancos Extra 30un', 'alimento', 1, 24.90 * inf));
        items.push(makeItem('Amaciante Concentrado 1.5L', 'limpeza', 1, 26.90 * inf));
      } else {
        // Mid-week replenishment
        items.push(makeItem('Patinho Bovino Moído', 'alimento', 2.2, 38.90 * inf));
        items.push(makeItem('Filé de Peito de Frango', 'alimento', 2.5, 22.50 * inf));
        items.push(makeItem('Kit Feira e Frutas Frescas', 'alimento', 1, 58.00 * inf));
        items.push(makeItem('Queijo Minas Frescal', 'alimento', 0.8, 38.00 * inf));
        items.push(makeItem('Pão Francês & Padaria', 'alimento', 1, 25.00 * inf));
        items.push(makeItem('Artigos de Limpeza Reposição', 'limpeza', 1, 32.00 * inf));
      }

      // Normalize items sum to match totalVal
      const currentSum = items.reduce((s, it) => s + it.preco_total, 0);
      if (currentSum > 0 && Math.abs(currentSum - totalVal) > 1) {
        const ratio = totalVal / currentSum;
        items.forEach(it => {
          it.preco_unitario = Math.round(it.preco_unitario * ratio * 100) / 100;
          it.preco_total = Math.round(it.quantidade * it.preco_unitario * 100) / 100;
        });
      }

      tx.itens = items;
    }
  });
  return modified;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    let data: DatabaseSchema;
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        data = JSON.parse(content);
        if (enrichSupermarketTransactions(data)) {
          this.saveDirect(data);
        }
        return data;
      }
    } catch (e) {
      console.error('Error reading database file, regenerating default data:', e);
    }
    const DEFAULT_BACKUP = path.join(DATA_DIR, 'database.default.json');
    if (fs.existsSync(DEFAULT_BACKUP)) {
      try {
        const defaultContent = fs.readFileSync(DEFAULT_BACKUP, 'utf-8');
        const parsed = JSON.parse(defaultContent);
        this.saveDirect(parsed);
        return parsed;
      } catch (err) {
        console.error('Error loading default backup:', err);
      }
    }
    const initial = generateInitialData();
    enrichSupermarketTransactions(initial);
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing database file:', e);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  public resetToDefault(): DatabaseSchema {
    const DEFAULT_BACKUP = path.join(DATA_DIR, 'database.default.json');
    if (fs.existsSync(DEFAULT_BACKUP)) {
      try {
        const defaultContent = fs.readFileSync(DEFAULT_BACKUP, 'utf-8');
        this.data = JSON.parse(defaultContent);
        this.save();
        return this.data;
      } catch (err) {
        console.error('Error restoring default backup:', err);
      }
    }
    this.data = generateInitialData();
    this.save();
    return this.data;
  }

  
  // Fuel Logs & Vehicles
  public getVehicles() {
    return this.data.vehicles || [];
  }

  public getFuelLogs(): FuelLog[] {
    return this.data.fuelLogs || [];
  }

  public addFuelLog(log: FuelLog): FuelLog {
    if (!this.data.fuelLogs) this.data.fuelLogs = [];
    this.data.fuelLogs.push(log);
    
    // Update vehicle odometer if higher
    if (this.data.vehicles && this.data.vehicles.length > 0) {
      if (log.kmAtual > this.data.vehicles[0].odometroAtual) {
        this.data.vehicles[0].odometroAtual = log.kmAtual;
      }
    }

    this.save();
    return log;
  }

  public deleteFuelLog(id: string): boolean {
    if (!this.data.fuelLogs) return false;
    const initialLen = this.data.fuelLogs.length;
    this.data.fuelLogs = this.data.fuelLogs.filter(f => f.id !== id);
    if (this.data.fuelLogs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  // Categories & Subcategories
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getSubcategories(): Subcategory[] {
    return this.data.subcategories;
  }

  public addSubcategory(sub: Omit<Subcategory, 'id'>): Subcategory {
    const id = `sub-${Date.now()}`;
    const newSub: Subcategory = { ...sub, id };
    this.data.subcategories.push(newSub);
    this.save();
    return newSub;
  }

  // Establishments
  public getEstablishments(): Establishment[] {
    return this.data.establishments;
  }

  public findOrCreateEstablishment(nome: string, tipo: any = 'Supermercado'): Establishment {
    const trimmed = nome.trim();
    const existing = this.data.establishments.find(
      e => e.nome.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;
    const newEst: Establishment = {
      id: `est-${Date.now()}`,
      nome: trimmed,
      tipo: tipo || 'Outros',
    };
    this.data.establishments.push(newEst);
    this.save();
    return newEst;
  }

  // Transactions
  public getTransactions(filters?: {
    mes_ano?: string;
    categoria_id?: string;
    subcategoria_id?: string;
    tipo?: string;
    estabelecimento_id?: string;
  }): Transaction[] {
    let list = [...this.data.transactions];
    if (filters?.mes_ano) {
      list = list.filter(t => t.mes_ano === filters.mes_ano);
    }
    if (filters?.categoria_id) {
      list = list.filter(t => t.categoria_id === filters.categoria_id);
    }
    if (filters?.subcategoria_id) {
      list = list.filter(t => t.subcategoria_id === filters.subcategoria_id);
    }
    if (filters?.tipo) {
      list = list.filter(t => t.tipo === filters.tipo);
    }
    if (filters?.estabelecimento_id) {
      list = list.filter(t => t.estabelecimento_id === filters.estabelecimento_id);
    }
    return list.sort((a, b) => b.data.localeCompare(a.data));
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'mes_ano'> & { id?: string; mes_ano?: string }): Transaction {
    const mes_ano = tx.data.substring(0, 7);
    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mes_ano: tx.mes_ano || mes_ano,
      created_at: new Date().toISOString(),
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;
    const updated: Transaction = {
      ...this.data.transactions[index],
      ...updates,
    };
    if (updates.data) {
      updated.mes_ano = updates.data.substring(0, 7);
    }
    this.data.transactions[index] = updated;
    this.save();
    return updated;
  }

  public deleteTransaction(id: string): boolean {
    const initialLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    if (this.data.transactions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Goals
  public getGoals(): FinancialGoal[] {
    return this.data.goals;
  }

  public addGoal(goal: Omit<FinancialGoal, 'id'>): FinancialGoal {
    const newGoal: FinancialGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };
    this.data.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<FinancialGoal>): FinancialGoal | null {
    const index = this.data.goals.findIndex(g => g.id === id);
    if (index === -1) return null;
    this.data.goals[index] = { ...this.data.goals[index], ...updates };
    this.save();
    return this.data.goals[index];
  }

  public deleteGoal(id: string): boolean {
    const initialLen = this.data.goals.length;
    this.data.goals = this.data.goals.filter(g => g.id !== id);
    if (this.data.goals.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Shopping List
  public getShoppingList(): ShoppingListItem[] {
    return this.data.shoppingList;
  }

  public addShoppingListItem(item: Omit<ShoppingListItem, 'id' | 'data_adicao'>): ShoppingListItem {
    const newItem: ShoppingListItem = {
      ...item,
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data_adicao: new Date().toISOString().split('T')[0],
    };
    this.data.shoppingList.unshift(newItem);
    this.save();
    return newItem;
  }

  public toggleShoppingItem(id: string, comprado?: boolean): ShoppingListItem | null {
    const item = this.data.shoppingList.find(i => i.id === id);
    if (!item) return null;
    item.comprado = comprado !== undefined ? comprado : !item.comprado;
    this.save();
    return item;
  }

  public deleteShoppingItem(id: string): boolean {
    const initialLen = this.data.shoppingList.length;
    this.data.shoppingList = this.data.shoppingList.filter(i => i.id !== id);
    if (this.data.shoppingList.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Receipts
  public addReceipt(receipt: Omit<ReceiptData, 'id'>): ReceiptData {
    const newReceipt: ReceiptData = {
      ...receipt,
      id: `rec-${Date.now()}`,
    };
    this.data.receipts.unshift(newReceipt);
    this.save();
    return newReceipt;
  }

  // Spreadsheet Ingestion
  public ingestSpreadsheetRows(rows: SpreadsheetRow[], filename?: string): { count: number; updated: number } {
    let count = 0;
    const mesMap: Record<string, string> = {
      'janeiro': '2026-01', 'jan': '2026-01', '1': '2026-01', '01': '2026-01',
      'fevereiro': '2026-02', 'fev': '2026-02', '2': '2026-02', '02': '2026-02',
      'marco': '2026-03', 'março': '2026-03', 'mar': '2026-03', '3': '2026-03', '03': '2026-03',
      'abril': '2026-04', 'abr': '2026-04', '4': '2026-04', '04': '2026-04',
      'maio': '2026-05', 'mai': '2026-05', '5': '2026-05', '05': '2026-05',
      'junho': '2026-06', 'jun': '2026-06', '6': '2026-06', '06': '2026-06',
      'julho': '2026-07', 'jul': '2026-07', '7': '2026-07', '07': '2026-07',
      'agosto': '2026-08', 'ago': '2026-08', '8': '2026-08', '08': '2026-08',
    };

    rows.forEach(row => {
      let rawMes = (row.mes || '2026-08').toLowerCase().trim();
      let mes_ano = mesMap[rawMes] || (rawMes.includes('2026') ? rawMes : `2026-${rawMes.padStart(2, '0')}`);
      if (!mes_ano.startsWith('2026-')) mes_ano = '2026-08';

      // Find or create subcategory matching DESCRICAO or CATEGORIA
      const subName = row.DESCRICAO || row.CATEGORIA || 'Diversos';
      let sub = this.data.subcategories.find(
        s => s.nome.toLowerCase() === subName.toLowerCase()
      );

      let catId = 'cat-variavel';
      if (row.CATEGORIA) {
        const catLower = row.CATEGORIA.toLowerCase();
        if (catLower.includes('invari') || catLower.includes('fix')) catId = 'cat-invariavel';
        else if (catLower.includes('extra') || catLower.includes('event')) catId = 'cat-extra';
      }

      if (!sub) {
        sub = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          categoria_id: catId,
          nome: subName,
          limite_padrao: Number(row.EXPECTATIVA) || 0,
        };
        this.data.subcategories.push(sub);
      }

      // Record Expectativa in expectations map
      if (!this.data.expectativasMensais[mes_ano]) {
        this.data.expectativasMensais[mes_ano] = {};
      }
      if (row.EXPECTATIVA !== undefined && !isNaN(Number(row.EXPECTATIVA))) {
        this.data.expectativasMensais[mes_ano][sub.nome] = Number(row.EXPECTATIVA);
      }

      // Record Realidade as transaction
      const valor = Number(row.REALIDADE);
      if (valor > 0) {
        this.addTransaction({
          usuario_id: 'usr-felipe',
          data: `${mes_ano}-15`,
          valor,
          tipo: 'despesa',
          forma_pagamento: 'cartao',
          status: (row.SITUACAO || '').toLowerCase().includes('prev') ? 'previsto' : 'pago',
          categoria_id: sub.categoria_id,
          subcategoria_id: sub.id,
          observacoes: `Importado da planilha: ${row.OBSERVACOES || row.DESCRICAO || ''}`,
        });
        count++;
      }
    });

    this.data.spreadsheetImportHistory.unshift({
      importedAt: new Date().toISOString(),
      rowCount: rows.length,
      filename: filename || 'Importacao_Manual.csv',
    });

    this.save();
    return { count, updated: rows.length };
  }
}

export const db = new Database();
