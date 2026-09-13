import {
  User,
  Transaction,
  Receipt,
  FinancialGoal,
  ShoppingListItem,
  SpreadsheetRow,
  CategoryBudget,
  FuelLog,
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-felipe',
    nome: 'Felipe Duarte',
    email: 'felipemd114@gmail.com',
    avatar: 'F',
    cor: '#2563eb',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'usr-genivania',
    nome: 'Genivânia Duarte',
    email: 'genivaniaduarte@gmail.com',
    avatar: 'G',
    cor: '#ec4899',
    dataCriacao: '2026-01-01',
  },
];

export const CATEGORIES_CONFIG: CategoryBudget[] = [
  // Invariáveis
  { nome: 'Aluguel', categoria: 'Invariável', orcamentoPadrao: 2800, icone: 'home' },
  { nome: 'Condomínio', categoria: 'Invariável', orcamentoPadrao: 650, icone: 'building' },
  { nome: 'Internet', categoria: 'Invariável', orcamentoPadrao: 130, icone: 'wifi' },
  { nome: 'Rastreador', categoria: 'Invariável', orcamentoPadrao: 89.9, icone: 'shield', isCarro: true },
  { nome: 'Seguro (Carro)', categoria: 'Invariável', orcamentoPadrao: 240, icone: 'car', isCarro: true },
  { nome: 'Assinaturas Extras', categoria: 'Invariável', orcamentoPadrao: 110, icone: 'tv' },

  // Variáveis
  { nome: 'Supermercado', categoria: 'Variável', orcamentoPadrao: 2400, icone: 'shopping-cart' },
  { nome: 'Combustível', categoria: 'Variável', orcamentoPadrao: 650, icone: 'fuel', isCarro: true },
  { nome: 'Farmácia', categoria: 'Variável', orcamentoPadrao: 350, icone: 'pill' },
  { nome: 'Lazer', categoria: 'Variável', orcamentoPadrao: 1200, icone: 'party-popper' },
  { nome: 'Estacionamento', categoria: 'Variável', orcamentoPadrao: 120, icone: 'square-parking', isCarro: true },
  { nome: 'Pedágio', categoria: 'Variável', orcamentoPadrao: 80, icone: 'milestone', isCarro: true },

  // Extra/Eventualidades
  { nome: 'Manutenção de carro', categoria: 'Extra/Eventualidades', orcamentoPadrao: 400, icone: 'wrench', isCarro: true },
  { nome: 'IPVA', categoria: 'Extra/Eventualidades', orcamentoPadrao: 550, icone: 'file-badge', isCarro: true },
  { nome: 'Eletrodomésticos', categoria: 'Extra/Eventualidades', orcamentoPadrao: 300, icone: 'plug' },
  { nome: 'Móveis', categoria: 'Extra/Eventualidades', orcamentoPadrao: 250, icone: 'armchair' },
  { nome: 'Saúde', categoria: 'Extra/Eventualidades', orcamentoPadrao: 400, icone: 'heart-pulse' },
  { nome: 'Eventualidades Gerais', categoria: 'Extra/Eventualidades', orcamentoPadrao: 500, icone: 'alert-circle' },
];

export const INITIAL_RECEIPTS: Receipt[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_GOALS: FinancialGoal[] = [];

export const INITIAL_SHOPPING_LIST: ShoppingListItem[] = [];

export const INITIAL_SPREADSHEETS: SpreadsheetRow[] = [];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: 'fuel-1',
    data: '2026-02-14',
    posto: 'Posto Cacique',
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
    origem: 'manual',
    veiculoId: 'veh-compass',
  },
  {
    id: 'fuel-2',
    data: '2026-02-28',
    posto: 'Posto Cristo Rei',
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
    origem: 'manual',
    veiculoId: 'veh-compass',
  },
  {
    id: 'fuel-3',
    data: '2026-03-05',
    posto: 'Posto Cacique 44',
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
    observacoes: 'Gasolina Aditivada',
    origem: 'manual',
    veiculoId: 'veh-compass',
  },
  {
    id: 'fuel-4',
    data: '2026-03-11',
    posto: 'Auto Posto Shell',
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
    origem: 'comprovante_ia',
    veiculoId: 'veh-compass',
  },
];
