import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Edit2,
  Check,
  X,
  User,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Banknote,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Transaction, SpreadsheetRow } from '../types';
import { formatBRL } from '../utils/formatters';

interface MonthlyBudgetSpreadsheetPanelProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSelectMonth?: (month: string) => void;
  spreadsheets?: SpreadsheetRow[];
  onUpdateSpreadsheetRow?: (row: SpreadsheetRow) => void;
  onOpenNewTx?: () => void;
}

// Configuração padrão dos itens da planilha oficial do Casal Duarte
export interface BudgetItemConfig {
  categoria: 'Invariável' | 'Variável' | 'Extra';
  descricao: string;
  expectativaPadrao: number;
  situacaoPadrao: 'Paga' | 'Pendente';
  diaVencimentoPadrao?: number; // Dia fixo do mês para vencer
  matcher: (tx: Transaction) => boolean;
}

export const DEFAULT_BUDGET_ITEMS: BudgetItemConfig[] = [
  // Invariáveis (Custos Fixos da Casa)
  {
    categoria: 'Invariável',
    descricao: 'Aluguel',
    expectativaPadrao: 1020.58,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 10,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return subId === 'sub-aluguel' || s === 'aluguel' || s.includes('aluguel') || e.includes('aluguel') || e.includes('proprietário');
    },
  },
  {
    categoria: 'Invariável',
    descricao: 'Condomínio',
    expectativaPadrao: 400.60,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 10,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-condominio' ||
        s.includes('condomínio') ||
        s.includes('condominio') ||
        e.includes('condominio') ||
        e.includes('condomínio')
      );
    },
  },
  {
    categoria: 'Invariável',
    descricao: 'Internet',
    expectativaPadrao: 89.99,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 15,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-internet' ||
        s.includes('internet') ||
        e.includes('internet') ||
        e.includes('fibra') ||
        e.includes('claro') ||
        e.includes('vivo')
      );
    },
  },
  {
    categoria: 'Invariável',
    descricao: 'Rastreador',
    expectativaPadrao: 59.90,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 15,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return subId === 'sub-rastreador' || s.includes('rastreador') || e.includes('rastreador') || e.includes('veicular');
    },
  },
  {
    categoria: 'Invariável',
    descricao: 'Amazon music unlimited',
    expectativaPadrao: 25.90,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 18,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return subId === 'sub-amazon-music' || s.includes('amazon') || e.includes('amazon music') || (e.includes('amazon') && !e.includes('mercado'));
    },
  },
  {
    categoria: 'Invariável',
    descricao: 'Youtube premium',
    expectativaPadrao: 53.90,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 20,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return subId === 'sub-youtube' || s.includes('youtube') || e.includes('youtube') || e.includes('google youtube');
    },
  },

  // Variáveis (Consumo & Estilo de Vida)
  {
    categoria: 'Variável',
    descricao: 'Água',
    expectativaPadrao: 85.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 18,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-agua' ||
        s === 'água' ||
        s === 'agua' ||
        s.includes('água') ||
        s.includes('agua') ||
        e.includes('água') ||
        e.includes('saae') ||
        e.includes('cosanpa')
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Combustível',
    expectativaPadrao: 600.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: undefined, // Consumo contínuo
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-combustivel' ||
        s.includes('combust') ||
        s.includes('gasolina') ||
        s.includes('etanol') ||
        s.includes('diesel') ||
        e.includes('posto') ||
        e.includes('cacique') ||
        e.includes('ipiranga') ||
        e.includes('shell')
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Gás',
    expectativaPadrao: 70.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 20,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      // Remover palavra 'gasto' para evitar falso positivo com 'gás'
      const o = (t.observacoes || '').toLowerCase().replace(/gasto\s*registrado:?/gi, '');
      return (
        subId === 'sub-gas' ||
        s === 'gás' ||
        s === 'gas' ||
        s.includes('botijão') ||
        s.includes('botijao') ||
        e.includes('ultragaz') ||
        e.includes('liquigas') ||
        e.includes('nacional gas') ||
        e.includes('botijão') ||
        o.includes('botijão') ||
        o.includes('gás de cozinha') ||
        /\bg[aá]s\b/i.test(s) ||
        /\bg[aá]s\b/i.test(e) ||
        /\bg[aá]s\b/i.test(o)
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Lazer',
    expectativaPadrao: 400.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: undefined, // Consumo contínuo
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-lazer' ||
        s.includes('lazer') ||
        s.includes('restaurante') ||
        s.includes('jantar') ||
        e.includes('spoleto') ||
        e.includes('pizza') ||
        e.includes('bar') ||
        e.includes('cinema') ||
        e.includes('hamburgueria') ||
        e.includes('espetiscos') ||
        e.includes('joy')
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Luz',
    expectativaPadrao: 220.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 22,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-luz' ||
        s.includes('luz') ||
        s.includes('energia') ||
        e.includes('equatorial') ||
        e.includes('enel') ||
        e.includes('cemig')
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Placa solar',
    expectativaPadrao: 477.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: 25,
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-placa-solar' ||
        subId === 'sub-solar' ||
        s.includes('solar') ||
        e.includes('solar') ||
        e.includes('placa solar')
      );
    },
  },
  {
    categoria: 'Variável',
    descricao: 'Supermercado',
    expectativaPadrao: 1200.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: undefined, // Consumo contínuo
    matcher: (t) => {
      const subId = (t.subcategoria_id || '').toLowerCase();
      const s = (t.subcategoria || '').toLowerCase();
      const e = (t.estabelecimento || '').toLowerCase();
      return (
        subId === 'sub-supermercado' ||
        subId === 'sub-alimentacao' ||
        s.includes('supermercado') ||
        s.includes('alimento') ||
        s.includes('feira') ||
        s.includes('açougue') ||
        s.includes('acougue') ||
        e.includes('mateus') ||
        e.includes('atacadão') ||
        e.includes('atacadao') ||
        e.includes('mercado') ||
        e.includes('ifood') ||
        e.includes('ferreira') ||
        e.includes('carvalho') ||
        e.includes('frigorífico') ||
        e.includes('frigorifico') ||
        e.includes('pão da hora') ||
        e.includes('pao da hora') ||
        e.includes('geramercantil')
      );
    },
  },

  // Extra (Eventualidades)
  {
    categoria: 'Extra',
    descricao: 'Eventualidades',
    expectativaPadrao: 300.00,
    situacaoPadrao: 'Pendente',
    diaVencimentoPadrao: undefined,
    matcher: () => false, // Captura por exclusão dos itens acima
  },
];

// Retorna o valor total previsto oficial da planilha para o mês (R$ 5.002,87 por padrão)
export function getMonthlyExpectedBudget(monthCode: string): number {
  if (monthCode === '2026-all' || monthCode === 'all') {
    const base = DEFAULT_BUDGET_ITEMS.reduce((sum, item) => sum + item.expectativaPadrao, 0);
    return Math.round(base * 12 * 100) / 100;
  }

  let custom: Record<string, number> = {};
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`duarte_expectativas_${monthCode}`) : null;
    if (saved) custom = JSON.parse(saved);
  } catch {}

  const regularSum = DEFAULT_BUDGET_ITEMS.filter((i) => i.categoria !== 'Extra').reduce((acc, item) => {
    const exp = custom[item.descricao] !== undefined ? custom[item.descricao] : item.expectativaPadrao;
    return acc + exp;
  }, 0);

  const extraExp = custom['Eventualidades'] !== undefined ? custom['Eventualidades'] : 300.00;
  return Math.round((regularSum + extraExp) * 100) / 100;
}

const MONTHS_LIST = [
  { code: '2026-01', name: 'Janeiro 2026' },
  { code: '2026-02', name: 'Fevereiro 2026' },
  { code: '2026-03', name: 'Março 2026' },
  { code: '2026-04', name: 'Abril 2026' },
  { code: '2026-05', name: 'Maio 2026' },
  { code: '2026-06', name: 'Junho 2026' },
  { code: '2026-07', name: 'Julho 2026' },
  { code: '2026-08', name: 'Agosto 2026' },
  { code: '2026-09', name: 'Setembro 2026' },
  { code: '2026-10', name: 'Outubro 2026' },
  { code: '2026-11', name: 'Novembro 2026' },
  { code: '2026-12', name: 'Dezembro 2026' },
];

// Identifica se uma forma de pagamento é cartão de crédito
export const isCreditCardPayment = (forma?: string, obs?: string): boolean => {
  const str = `${forma || ''} ${obs || ''}`.toLowerCase();
  if (str.includes('credito') || str.includes('crédito')) return true;
  if (str.includes('cartao') && !str.includes('debito') && !str.includes('débito')) return true;
  if (str.includes('fatura') || str.includes('nubank')) return true;
  return false;
};

// Identifica se foi pago à vista (PIX, Débito ou Dinheiro)
export const isImmediatePayment = (forma?: string, obs?: string): boolean => {
  const str = `${forma || ''} ${obs || ''}`.toLowerCase();
  if (str.includes('pix')) return true;
  if (str.includes('debito') || str.includes('débito')) return true;
  if (str.includes('dinheiro') || str.includes('especie') || str.includes('espécie')) return true;
  if (str.includes('transferencia') || str.includes('transferência') || str.includes('ted') || str.includes('doc')) return true;
  return false;
};

export const MonthlyBudgetSpreadsheetPanel: React.FC<MonthlyBudgetSpreadsheetPanelProps> = ({
  transactions,
  selectedMonth,
  onSelectMonth,
  spreadsheets = [],
  onUpdateSpreadsheetRow,
  onOpenNewTx,
}) => {
  // 1. Identificar o código YYYY-MM do mês
  const activeMonthCode = useMemo(() => {
    if (!selectedMonth) return '2026-09';
    if (/^\d{4}-\d{2}/.test(selectedMonth)) return selectedMonth.slice(0, 7);
    const map: Record<string, string> = {
      janeiro: '2026-01',
      fevereiro: '2026-02',
      março: '2026-03',
      marco: '2026-03',
      abril: '2026-04',
      maio: '2026-05',
      junho: '2026-06',
      julho: '2026-07',
      agosto: '2026-08',
      setembro: '2026-09',
      outubro: '2026-10',
      novembro: '2026-11',
      dezembro: '2026-12',
    };
    const lower = selectedMonth.toLowerCase();
    for (const [name, code] of Object.entries(map)) {
      if (lower.includes(name)) return code;
    }
    return '2026-09';
  }, [selectedMonth]);

  // Nome formatado do mês ativo
  const activeMonthName = useMemo(() => {
    const found = MONTHS_LIST.find((m) => m.code === activeMonthCode);
    return found ? found.name : selectedMonth;
  }, [activeMonthCode, selectedMonth]);

  // Estados locais para expectativas editáveis e status de pagamento manual
  const [customExpectativas, setCustomExpectativas] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`duarte_expectativas_${activeMonthCode}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [customSituacoes, setCustomSituacoes] = useState<Record<string, 'Paga' | 'Pendente'>>(() => {
    const saved = localStorage.getItem(`duarte_situacoes_${activeMonthCode}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [customVencimentos, setCustomVencimentos] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('duarte_vencimentos_config');
    return saved ? JSON.parse(saved) : {};
  });

  const [editingItemDesc, setEditingItemDesc] = useState<string | null>(null);
  const [tempExpectativa, setTempExpectativa] = useState<string>('');
  const [expandedItemDesc, setExpandedItemDesc] = useState<string | null>(null);
  const [showVencimentoConfig, setShowVencimentoConfig] = useState(false);

  // Salvar no localStorage quando houver alteração de status ou expectativa
  useEffect(() => {
    localStorage.setItem(`duarte_expectativas_${activeMonthCode}`, JSON.stringify(customExpectativas));
  }, [customExpectativas, activeMonthCode]);

  useEffect(() => {
    localStorage.setItem(`duarte_situacoes_${activeMonthCode}`, JSON.stringify(customSituacoes));
  }, [customSituacoes, activeMonthCode]);

  useEffect(() => {
    localStorage.setItem('duarte_vencimentos_config', JSON.stringify(customVencimentos));
  }, [customVencimentos]);

  // 2. Filtro Estrito: Apenas despesas que pertencem EXATAMENTE a este mês
  const monthExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.tipo !== 'despesa') return false;
      const txData = t.data || '';
      const txMesRef = t.mesReferencia || (t as any).mes_referencia || '';
      return txData.startsWith(activeMonthCode) || txMesRef === activeMonthCode;
    });
  }, [transactions, activeMonthCode]);

  // 3. Mapeamento de Linhas e Lançamentos por Categoria
  const calculatedRows = useMemo(() => {
    const matchedTxIds = new Set<string>();

    const rows = DEFAULT_BUDGET_ITEMS.map((config) => {
      let matchingTxs: Transaction[] = [];

      if (config.categoria !== 'Extra') {
        matchingTxs = monthExpenses.filter((t) => {
          if (matchedTxIds.has(t.id)) return false;
          const isMatch = config.matcher(t);
          if (isMatch) matchedTxIds.add(t.id);
          return isMatch;
        });
      }

      const realidade = matchingTxs.reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

      // 1. Expectativa do Item
      let expectativa = config.expectativaPadrao;
      if (customExpectativas[config.descricao] !== undefined) {
        expectativa = customExpectativas[config.descricao];
      } else if (config.descricao === 'Youtube premium' && activeMonthCode < '2026-06') {
        // Youtube Premium só começou a ser assinado a partir de Junho de 2026
        expectativa = 0;
      }

      const diferenca = realidade - expectativa;

      // Dia de Vencimento configurado ou padrão
      const diaVenc =
        customVencimentos[config.descricao] !== undefined
          ? customVencimentos[config.descricao]
          : config.diaVencimentoPadrao;

      // Tem pagamento à vista conciliado (PIX ou Débito)?
      const hasImmediatePayment = matchingTxs.some((t) =>
        isImmediatePayment(t.formaPagamento, t.observacoes)
      );

      // Determinar Situação
      let situacao: 'Paga' | 'Pendente' = 'Pendente';
      if (customSituacoes[config.descricao] !== undefined) {
        situacao = customSituacoes[config.descricao];
      } else if (activeMonthCode <= '2026-08') {
        // Para meses anteriores já encerrados e consolidados (Janeiro a Agosto de 2026):
        // Se houve gasto apurado ou transações vinculadas -> Paga
        // Se é Youtube Premium antes de Junho/2026 -> Paga (sem pendência, não era assinado)
        if (realidade > 0 || matchingTxs.length > 0 || (config.descricao === 'Youtube premium' && activeMonthCode < '2026-06')) {
          situacao = 'Paga';
        } else {
          situacao = 'Pendente';
        }
      } else {
        // Mês atual / futuro (Setembro/2026 em diante):
        if (hasImmediatePayment && matchingTxs.length > 0) {
          situacao = 'Paga';
        } else if (
          config.categoria === 'Invariável' &&
          matchingTxs.length > 0 &&
          !matchingTxs.every((t) => isCreditCardPayment(t.formaPagamento, t.observacoes))
        ) {
          situacao = 'Paga';
        } else if (realidade > 0 && matchingTxs.some((t) => t.status === 'pago')) {
          situacao = 'Paga';
        } else {
          situacao = config.situacaoPadrao;
        }
      }

      return {
        categoria: config.categoria,
        descricao: config.descricao,
        situacao,
        expectativa: Math.round(expectativa * 100) / 100,
        realidade: Math.round(realidade * 100) / 100,
        diferenca: Math.round(diferenca * 100) / 100,
        diaVencimento: diaVenc,
        txCount: matchingTxs.length,
        matchingTxs,
      };
    });

    // Tratar 'Extra / Eventualidades': tudo que sobrou de despesa do mês
    const extraTxs = monthExpenses.filter((t) => !matchedTxIds.has(t.id));
    const extraRealidade = extraTxs.reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
    const extraExpectativa =
      customExpectativas['Eventualidades'] !== undefined
        ? customExpectativas['Eventualidades']
        : 300.00;
    const extraDiferenca = extraRealidade - extraExpectativa;

    const extraRowIndex = rows.findIndex((r) => r.categoria === 'Extra');
    if (extraRowIndex !== -1) {
      let extraSituacao: 'Paga' | 'Pendente' = 'Pendente';
      if (customSituacoes['Eventualidades']) {
        extraSituacao = customSituacoes['Eventualidades'];
      } else if (activeMonthCode <= '2026-08') {
        extraSituacao = 'Paga';
      } else {
        extraSituacao = extraTxs.length > 0 ? 'Paga' : 'Pendente';
      }
      rows[extraRowIndex] = {
        categoria: 'Extra',
        descricao: 'Eventualidades',
        situacao: extraSituacao,
        expectativa: Math.round(extraExpectativa * 100) / 100,
        realidade: Math.round(extraRealidade * 100) / 100,
        diferenca: Math.round(extraDiferenca * 100) / 100,
        diaVencimento: undefined,
        txCount: extraTxs.length,
        matchingTxs: extraTxs,
      };
    }

    return rows;
  }, [monthExpenses, customExpectativas, customSituacoes, customVencimentos]);

  // 4. Totalizadores Gerais
  const totals = useMemo(() => {
    const regularRows = calculatedRows.filter((r) => r.categoria !== 'Extra');
    const subtotalExp = regularRows.reduce((acc, r) => acc + r.expectativa, 0);
    const subtotalReal = regularRows.reduce((acc, r) => acc + r.realidade, 0);
    const subtotalDif = subtotalReal - subtotalExp;

    const extraRow = calculatedRows.find((r) => r.categoria === 'Extra');
    const extraExp = extraRow?.expectativa || 0;
    const extraReal = extraRow?.realidade || 0;
    const extraDif = extraReal - extraExp;

    const totalMesExp = subtotalExp + extraExp;
    const totalMesReal = subtotalReal + extraReal;
    const totalMesDif = totalMesReal - totalMesExp;

    return {
      subtotalExp,
      subtotalReal,
      subtotalDif,
      extraExp,
      extraReal,
      extraDif,
      totalMesExp,
      totalMesReal,
      totalMesDif,
    };
  }, [calculatedRows]);

  // 5. Apuração do Rateio 50/50 com a Regra de Cartão de Crédito
  const splitCalculations = useMemo(() => {
    let pagoFelipeVista = 0;
    let pagoGenivaniaVista = 0;
    let pagoConjuntaVista = 0;

    let totalCartaoCredito = 0;
    let cartaoFelipe = 0;
    let cartaoGenivania = 0;
    let cartaoConjunto = 0;

    monthExpenses.forEach((t) => {
      const pag = (t.pagoPor || '').toLowerCase();
      const usr = (t.usuario_id || (t as any).usuarioId || '').toLowerCase();
      const val = Number(t.valor) || 0;
      const isCredit = isCreditCardPayment(t.formaPagamento, t.observacoes);

      if (isCredit) {
        totalCartaoCredito += val;
        if (pag.includes('felipe') || usr === 'usr-felipe') {
          cartaoFelipe += val;
        } else if (pag.includes('genivânia') || pag.includes('genivania') || usr === 'usr-genivania') {
          cartaoGenivania += val;
        } else {
          cartaoConjunto += val;
        }
      } else {
        if (pag.includes('felipe') || usr === 'usr-felipe') {
          pagoFelipeVista += val;
        } else if (pag.includes('genivânia') || pag.includes('genivania') || usr === 'usr-genivania') {
          pagoGenivaniaVista += val;
        } else {
          pagoConjuntaVista += val;
        }
      }
    });

    const totalDesembolsadoVista = pagoFelipeVista + pagoGenivaniaVista + pagoConjuntaVista;
    const cotaVista50 = totalDesembolsadoVista / 2;

    const diferencaAportes = pagoFelipeVista - pagoGenivaniaVista;
    const valorReembolsoPix = Math.abs(diferencaAportes) / 2;

    let vereditoPix = 'Equilibrado';
    let devedor = '';
    let credor = '';

    if (Math.abs(diferencaAportes) > 0.05) {
      if (diferencaAportes > 0) {
        vereditoPix = 'Genivânia deve fazer PIX para Felipe';
        devedor = 'Genivânia';
        credor = 'Felipe';
      } else {
        vereditoPix = 'Felipe deve fazer PIX para Genivânia';
        devedor = 'Felipe';
        credor = 'Genivânia';
      }
    }

    return {
      pagoFelipeVista,
      pagoGenivaniaVista,
      pagoConjuntaVista,
      totalDesembolsadoVista,
      cotaVista50,
      diferencaAportes,
      valorReembolsoPix,
      vereditoPix,
      devedor,
      credor,
      totalCartaoCredito,
      cartaoFelipe,
      cartaoGenivania,
      cartaoConjunto,
    };
  }, [monthExpenses]);

  // 6. Alertas de Vencimento de Contas Invariáveis e Fixas (Regra do Casal: Vencimento no MÊS SEGUINTE Mês+1)
  const alertsData = useMemo(() => {
    const now = new Date();

    // Competência do mês visualizado
    const [compYearStr, compMonthStr] = activeMonthCode.split('-');
    const compYear = parseInt(compYearStr, 10) || 2026;
    const compMonth = parseInt(compMonthStr, 10) || 9;

    // Vencimento ocorre no MÊS SEGUINTE à competência (ex: despesas de Setembro vencem em Outubro)
    const dueMonth = compMonth === 12 ? 1 : compMonth + 1;
    const dueYear = compMonth === 12 ? compYear + 1 : compYear;
    const dueMonthStr = String(dueMonth).padStart(2, '0');

    const vencidas: Array<{ descricao: string; dia: number; mes: number; valor: number }> = [];
    const prestesAVencer: Array<{ descricao: string; dia: number; mes: number; valor: number; diasRestantes: number }> = [];
    const pagas: Array<{ descricao: string; dia?: number; valor: number }> = [];

    calculatedRows.forEach((row) => {
      if (row.situacao === 'Paga') {
        pagas.push({ descricao: row.descricao, dia: row.diaVencimento, valor: row.realidade });
      } else if (row.diaVencimento !== undefined) {
        // Data exata de vencimento: diaVencimento no mês seguinte (dueMonth / dueYear)
        const dueDate = new Date(dueYear, dueMonth - 1, row.diaVencimento, 23, 59, 59);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDias < 0) {
          // Passou da data de vencimento no mês seguinte e ainda consta Pendente
          vencidas.push({
            descricao: row.descricao,
            dia: row.diaVencimento,
            mes: dueMonth,
            valor: row.expectativa,
          });
        } else if (diffDias <= 5) {
          // Faltam até 5 dias para o vencimento
          prestesAVencer.push({
            descricao: row.descricao,
            dia: row.diaVencimento,
            mes: dueMonth,
            valor: row.expectativa,
            diasRestantes: diffDias,
          });
        }
      }
    });

    return {
      vencidas,
      prestesAVencer,
      pagas,
      dueMonth,
      dueMonthStr,
      dueYear,
      compMonth,
      compYear,
    };
  }, [calculatedRows, activeMonthCode]);

  // Alternar situação manualmente
  const handleToggleSituacao = (descricao: string, atual: 'Paga' | 'Pendente') => {
    const nova = atual === 'Paga' ? 'Pendente' : 'Paga';
    setCustomSituacoes((prev) => ({ ...prev, [descricao]: nova }));
  };

  const handleSaveExpectativa = (descricao: string) => {
    const val = parseFloat(tempExpectativa.replace(/[R$\s.]/g, '').replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      setCustomExpectativas((prev) => ({ ...prev, [descricao]: val }));
    }
    setEditingItemDesc(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header do Painel com Seletor Rápido de Mês */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-display font-black text-lg sm:text-xl text-[#0b1c30]">
              Planilha de Fechamento • {activeMonthName}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-xs font-bold border border-[#a7f3d0]">
              {monthExpenses.length} {monthExpenses.length === 1 ? 'despesa apurada' : 'despesas apuradas'}
            </span>
            {activeMonthCode <= '2026-08' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[11px] font-bold border border-[#dce9ff] flex items-center gap-1">
                📁 Histórico Consolidado das Planilhas (Jan a Ago/2026)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[11px] font-bold border border-[#fde68a] flex items-center gap-1">
                ⚡ Mês em Aberto (Comprovantes IA & Datas Reais)
              </span>
            )}
          </div>
          <p className="text-xs text-[#565e74] mt-1 max-w-2xl">
            {activeMonthCode <= '2026-08' 
              ? 'Valores sincronizados e auditados diretamente das planilhas mensais do Casal Duarte. Supermercado, Lazer e despesas fixas batem exatamente com a aba de Fechamento.'
              : 'Painel em tempo real: alimentado por comprovantes lidos por IA e novos lançamentos diários com datas e horários autênticos.'}
          </p>
        </div>

        {/* Seletor Dinâmico de Mês */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#f8faff] p-1.5 rounded-2xl border border-[#e5eeff]">
            <Calendar className="w-4 h-4 text-[#006948] ml-2 shrink-0" />
            <select
              id="select-mes-planilha"
              value={activeMonthCode}
              onChange={(e) => {
                const targetCode = e.target.value;
                const found = MONTHS_LIST.find((m) => m.code === targetCode);
                if (found && onSelectMonth) {
                  onSelectMonth(found.name);
                }
              }}
              className="bg-transparent text-xs font-bold text-[#0b1c30] px-2 py-1.5 focus:outline-none cursor-pointer pr-4"
            >
              {MONTHS_LIST.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowVencimentoConfig(!showVencimentoConfig)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showVencimentoConfig
                ? 'bg-[#006948] text-white border-[#006948]'
                : 'bg-white text-[#565e74] border-[#e5eeff] hover:bg-[#f8faff] hover:text-[#0b1c30]'
            }`}
            title="Configurar datas de vencimento das contas"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Datas Venc.</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Alertas Inteligentes de Vencimento de Contas */}
      {(alertsData.prestesAVencer.length > 0 || alertsData.vencidas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Contas Prestes a Vencer */}
          {alertsData.prestesAVencer.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <span>Vencendo nos Próximos Dias!</span>
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded text-[10px]">
                    {alertsData.prestesAVencer.length}
                  </span>
                </h5>
                <div className="mt-2 space-y-1">
                  {alertsData.prestesAVencer.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-amber-800">
                      <span>
                        • <strong>{c.descricao}</strong> (vence dia {c.dia}
                        {c.diasRestantes === 0 ? ' - HOJE!' : ` - em ${c.diasRestantes} dias`})
                      </span>
                      <span className="font-mono font-bold">{formatBRL(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contas Vencidas / Pendentes */}
          {alertsData.vencidas.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <span>Atenção: Contas Fixas com Vencimento Ultrapassado</span>
                  <span className="px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded text-[10px]">
                    {alertsData.vencidas.length}
                  </span>
                </h5>
                <div className="mt-2 space-y-1">
                  {alertsData.vencidas.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-rose-800">
                      <span>
                        • <strong>{c.descricao}</strong> (vencimento dia {c.dia})
                      </span>
                      <span className="font-mono font-bold">{formatBRL(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Painel Expansível de Configuração de Vencimentos */}
      {showVencimentoConfig && (
        <div className="bg-white rounded-2xl p-5 border border-[#9c4d79]/30 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h5 className="font-bold text-xs text-[#0b1c30] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9c4d79]" />
              <span>Configurar Dia Fixo de Vencimento das Contas (Todo Mês)</span>
            </h5>
            <button
              onClick={() => setShowVencimentoConfig(false)}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
            {DEFAULT_BUDGET_ITEMS.filter((i) => i.diaVencimentoPadrao !== undefined).map((item) => {
              const currentVal =
                customVencimentos[item.descricao] !== undefined
                  ? customVencimentos[item.descricao]
                  : item.diaVencimentoPadrao;

              return (
                <div key={item.descricao} className="bg-[#f8faff] p-2.5 rounded-xl border border-[#e5eeff]">
                  <span className="text-[11px] font-bold text-[#0b1c30] block truncate">
                    {item.descricao}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-[#565e74]">Dia:</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={currentVal}
                      onChange={(e) => {
                        const num = parseInt(e.target.value, 10);
                        if (!isNaN(num) && num >= 1 && num <= 31) {
                          setCustomVencimentos((prev) => ({ ...prev, [item.descricao]: num }));
                        }
                      }}
                      className="w-14 px-2 py-0.5 text-xs text-center font-bold bg-white border border-gray-200 rounded focus:border-[#9c4d79] focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Tabela de Fechamento Consolidada do Casal */}
      <div className="bg-white rounded-3xl border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Cabeçalho Elegante do Sistema */}
            <thead className="bg-[#0b1c30] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">CATEGORIA</th>
                <th className="py-3.5 px-4 font-bold">DESCRIÇÃO</th>
                <th className="py-3.5 px-3 font-bold text-center">VENC.</th>
                <th className="py-3.5 px-4 font-bold text-center">SITUAÇÃO</th>
                <th className="py-3.5 px-4 font-bold text-right">EXPECTATIVA</th>
                <th className="py-3.5 px-4 font-bold text-right">REALIDADE</th>
                <th className="py-3.5 px-4 font-bold text-right">DIFERENÇA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calculatedRows.map((row, idx) => {
                const isExtra = row.categoria === 'Extra';
                const isEditing = editingItemDesc === row.descricao;
                const isExpanded = expandedItemDesc === row.descricao;

                const difPositive = row.diferenca > 0;
                const difNegative = row.diferenca < 0;

                const pctConsumo = row.expectativa > 0 ? Math.round((row.realidade / row.expectativa) * 100) : 0;

                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`hover:bg-[#f8faff] transition-colors ${
                        isExtra ? 'bg-[#fcfdfa] font-medium' : ''
                      }`}
                    >
                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            row.categoria === 'Invariável'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : row.categoria === 'Variável'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {row.categoria}
                        </span>
                      </td>

                      {/* Descrição com Botão de Expandir Lançamentos */}
                      <td className="py-3 px-4 font-medium text-[#0b1c30]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedItemDesc(isExpanded ? null : row.descricao)}
                            className="font-bold text-xs text-[#0b1c30] hover:text-[#006948] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                            title="Clique para auditar os lançamentos que compõem este valor"
                          >
                            <span>{row.descricao}</span>
                            {row.txCount > 0 ? (
                              <span className="text-[10px] text-[#565e74] bg-[#f1f5f9] px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-0.5">
                                {row.txCount} {row.txCount === 1 ? 'lanç.' : 'lançs.'}
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </span>
                            ) : null}
                          </button>
                        </div>
                      </td>

                      {/* Vencimento (Dia no Mês Seguinte) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap text-[#565e74] font-mono">
                        {row.diaVencimento ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#f1f5f9] text-[#0b1c30]"
                              title={`Vence no dia ${String(row.diaVencimento).padStart(2, '0')}/${alertsData.dueMonthStr}/${alertsData.dueYear} (Mês seguinte à competência de ${activeMonthName})`}
                            >
                              Dia {String(row.diaVencimento).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] text-[#565e74] font-semibold mt-0.5">
                              {String(row.diaVencimento).padStart(2, '0')}/{alertsData.dueMonthStr}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Situação Interativa (Paga vs Pendente) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSituacao(row.descricao, row.situacao)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                            row.situacao === 'Paga'
                              ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0] hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Clique para alternar a situação (Paga ↔ Pendente)"
                        >
                          {row.situacao === 'Paga' ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Paga</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 stroke-[2]" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Expectativa (Editável) */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#565e74] whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              value={tempExpectativa}
                              onChange={(e) => setTempExpectativa(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveExpectativa(row.descricao);
                                if (e.key === 'Escape') setEditingItemDesc(null);
                              }}
                              className="w-24 px-2 py-1 text-xs text-right border border-[#006948] rounded font-mono focus:outline-none bg-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveExpectativa(row.descricao)}
                              className="p-1 text-[#006948] hover:bg-gray-100 rounded cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItemDesc(null)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingItemDesc(row.descricao);
                              setTempExpectativa(row.expectativa.toFixed(2));
                            }}
                            className="inline-flex items-center gap-1.5 group cursor-pointer hover:text-[#0b1c30]"
                            title="Clique para editar a expectativa"
                          >
                            <span>{formatBRL(row.expectativa)}</span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-[#565e74]" />
                          </div>
                        )}
                      </td>

                      {/* Realidade com Barra de Progresso do Teto */}
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <div className="font-bold text-xs text-[#0b1c30]">
                          {formatBRL(row.realidade)}
                        </div>
                        {row.expectativa > 0 && (
                          <div className="w-20 ml-auto mt-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pctConsumo <= 80
                                  ? 'bg-[#10b981]'
                                  : pctConsumo <= 100
                                  ? 'bg-[#f59e0b]'
                                  : 'bg-[#ef4444]'
                              }`}
                              style={{ width: `${Math.min(100, pctConsumo)}%` }}
                              title={`${pctConsumo}% consumido`}
                            />
                          </div>
                        )}
                      </td>

                      {/* Diferença */}
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {row.diferenca === 0 ? (
                          <span className="text-[#565e74]">0,00</span>
                        ) : difPositive ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px]">
                            +{formatBRL(row.diferenca).replace('R$', '').trim()}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                            -{formatBRL(Math.abs(row.diferenca)).replace('R$', '').trim()}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Gaveta de Auditoria de Lançamentos */}
                    {isExpanded && (
                      <tr className="bg-[#f8faff] border-y border-[#e5eeff]">
                        <td colSpan={7} className="py-3 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#0b1c30]">
                                Lançamentos reais vinculados a {row.descricao} em {activeMonthName}:
                              </span>
                              <span className="text-[11px] font-mono text-[#565e74]">
                                Total: <strong>{formatBRL(row.realidade)}</strong>
                              </span>
                            </div>
                            {row.matchingTxs.length === 0 ? (
                              <p className="text-xs text-gray-400 italic py-1">
                                Nenhum lançamento registrado para este item neste mês.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                {row.matchingTxs.map((t) => {
                                  const isCred = isCreditCardPayment(t.formaPagamento, t.observacoes);
                                  return (
                                    <div
                                      key={t.id}
                                      className="bg-white p-2.5 rounded-xl border border-[#e5eeff] flex items-center justify-between text-xs shadow-2xs"
                                    >
                                      <div>
                                        <div className="font-bold text-[#0b1c30]">{t.estabelecimento}</div>
                                        <div className="text-[10px] text-[#565e74] flex items-center gap-1.5 mt-0.5">
                                          <span>{t.data}</span>
                                          <span>•</span>
                                          <span>{t.pagoPor || 'Casal'}</span>
                                          <span>•</span>
                                          <span
                                            className={`font-semibold ${
                                              isCred ? 'text-amber-600' : 'text-emerald-700'
                                            }`}
                                          >
                                            {isCred ? 'Cartão de Crédito' : 'À Vista / Débito'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-mono font-bold text-[#0b1c30]">
                                          {formatBRL(t.valor)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* LINHA DE SUB-TOTAL (Invariável + Variável) */}
              <tr className="bg-[#f8faff] font-bold text-[#0b1c30] border-t-2 border-[#cbd5e1]">
                <td colSpan={4} className="py-3 px-4 uppercase text-[11px] font-black tracking-wider text-[#0b1c30]">
                  SUBTOTAL (Invariáveis & Variáveis)
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#565e74]">
                  {formatBRL(totals.subtotalExp)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-[#0b1c30]">
                  {formatBRL(totals.subtotalReal)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] ${
                      totals.subtotalDif > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {totals.subtotalDif > 0 ? '+' : ''}
                    {formatBRL(totals.subtotalDif).replace('R$', '').trim()}
                  </span>
                </td>
              </tr>

              {/* LINHA DE TOTAL DO MÊS (Incluindo Eventualidades) - Verde Esmeralda do Sistema */}
              <tr className="bg-gradient-to-r from-[#006948] to-[#005036] text-white font-black text-xs sm:text-sm shadow-md">
                <td colSpan={3} className="py-4 px-4 uppercase tracking-wider font-extrabold text-white">
                  TOTAL DO MÊS
                </td>
                <td className="py-4 px-4 text-center uppercase tracking-wider text-[10px] font-bold text-white/80">
                  TOTAL GERAL
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-white/90">
                  {formatBRL(totals.totalMesExp)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-black text-white text-sm sm:text-base">
                  {formatBRL(totals.totalMesReal)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-black text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg bg-white text-[#006948] font-black shadow-xs">
                    {totals.totalMesDif > 0 ? '+' : ''}
                    {formatBRL(totals.totalMesDif).replace('R$', '').trim()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bloco de Rateio & Acerto Paritário 50/50 entre Felipe e Genivânia */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#2563eb] flex items-center justify-center font-bold border border-[#dbeafe]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[#0b1c30]">
                Acerto Paritário 50/50 • Divisão do Casal ({activeMonthName})
              </h4>
              <p className="text-xs text-[#565e74]">
                Compensação justa em dinheiro: despesas pagas no cartão de crédito não geram acerto imediato e são liquidadas na fatura futura.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#ecfdf5] px-3.5 py-1.5 rounded-full border border-[#a7f3d0]">
            <ShieldCheck className="w-4 h-4 text-[#006948]" />
            <span className="text-xs font-bold text-[#006948]">Orçamento 100% Compartilhado</span>
          </div>
        </div>

        {/* Três Cards de Desembolso À Vista & PIX de Acerto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* Card Desembolso Felipe */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center">
                  F
                </div>
                <span className="font-bold text-xs text-[#0b1c30]">Felipe Duarte</span>
              </div>
              <span className="text-[10px] font-bold text-[#2563eb] bg-[#eff4ff] px-2 py-0.5 rounded-full">
                À Vista / PIX / Débito
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] uppercase font-bold text-[#565e74] block">
                Desembolsado por Felipe
              </span>
              <span className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-0.5 block">
                {formatBRL(splitCalculations.pagoFelipeVista)}
              </span>
            </div>
            <div className="text-[11px] text-[#565e74] mt-2 pt-2 border-t border-[#e5eeff] flex justify-between">
              <span>Cota Justa (50% do à vista):</span>
              <strong className="font-mono text-[#0b1c30]">{formatBRL(splitCalculations.cotaVista50)}</strong>
            </div>
          </div>

          {/* Card Desembolso Genivânia */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ec4899] text-white text-xs font-bold flex items-center justify-center">
                  G
                </div>
                <span className="font-bold text-xs text-[#0b1c30]">Genivânia Duarte</span>
              </div>
              <span className="text-[10px] font-bold text-[#ec4899] bg-[#fdf2f8] px-2 py-0.5 rounded-full">
                À Vista / PIX / Débito
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] uppercase font-bold text-[#565e74] block">
                Desembolsado por Genivânia
              </span>
              <span className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-0.5 block">
                {formatBRL(splitCalculations.pagoGenivaniaVista)}
              </span>
            </div>
            <div className="text-[11px] text-[#565e74] mt-2 pt-2 border-t border-[#e5eeff] flex justify-between">
              <span>Cota Justa (50% do à vista):</span>
              <strong className="font-mono text-[#0b1c30]">{formatBRL(splitCalculations.cotaVista50)}</strong>
            </div>
          </div>

          {/* Card Veredito de Reembolso / PIX de Acerto */}
          <div className="bg-gradient-to-br from-[#0b1c30] to-[#1e293b] text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  PIX DE ACERTO IMEDIATO
                </span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              {splitCalculations.valorReembolsoPix > 0.05 ? (
                <div>
                  <span className="text-xs text-white/80 block">
                    {splitCalculations.devedor} deve transferir para {splitCalculations.credor}:
                  </span>
                  <span className="font-display font-black text-2xl text-emerald-400 font-mono mt-1 block">
                    {formatBRL(splitCalculations.valorReembolsoPix)}
                  </span>
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-base font-bold text-emerald-400 block">Contas Equilibradas!</span>
                  <span className="text-xs text-white/70">Nenhum acerto PIX pendente para despesas à vista.</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-white/70 flex items-center justify-between">
              <span>Total À Vista:</span>
              <strong className="font-mono text-white">{formatBRL(splitCalculations.totalDesembolsadoVista)}</strong>
            </div>
          </div>
        </div>

        {/* 5. Card Especial: Despesas em Cartão de Crédito (A Liquidar na Fatura) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-amber-950 flex items-center gap-2">
                <span>Compras no Cartão de Crédito em {activeMonthName}</span>
                <span className="px-2 py-0.2 bg-amber-200 text-amber-900 rounded font-mono text-[11px] font-bold">
                  {formatBRL(splitCalculations.totalCartaoCredito)}
                </span>
              </h5>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Não exigem transferência PIX imediata. O valor total será dividido e quitado quando a fatura conjunta do cartão fechar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-amber-900 shrink-0">
            <div>
              <span className="text-[10px] text-amber-700 block">Total Geral Real</span>
              <span className="font-mono font-bold text-sm text-[#0b1c30]">{formatBRL(totals.totalMesReal)}</span>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-4 bg-[#eff4ff]/60 rounded-2xl p-3 border border-[#bfdbfe] text-xs text-[#006194] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-[#2563eb]" />
            <span>
              Clique no nome de qualquer item para auditar os lançamentos vinculados, ou no botão de <strong>Situação</strong> para alternar entre <em>Paga</em> e <em>Pendente</em>.
            </span>
          </div>
          {onOpenNewTx && (
            <button
              onClick={onOpenNewTx}
              className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
            >
              + Adicionar Despesa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
