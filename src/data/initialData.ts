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

export const INITIAL_FUEL_LOGS: FuelLog[] = [];
