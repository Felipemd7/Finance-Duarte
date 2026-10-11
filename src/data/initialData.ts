import {
  User,
  Transaction,
  Receipt,
  FinancialGoal,
  ShoppingListItem,
  SpreadsheetRow,
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

export const INITIAL_RECEIPTS: Receipt[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_GOALS: FinancialGoal[] = [];

export const INITIAL_SHOPPING_LIST: ShoppingListItem[] = [];

export const INITIAL_SPREADSHEETS: SpreadsheetRow[] = [];

export const INITIAL_FUEL_LOGS: FuelLog[] = [];
