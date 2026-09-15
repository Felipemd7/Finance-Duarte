import React, { useState, useMemo } from 'react';
import {
  Heart,
  TrendingUp,
  ScanLine,
  PlusCircle,
  Mic,
  ShoppingCart,
  Car,
  Utensils,
  Pill,
  Fuel,
  Volume2,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Send,
  Building2,
  ArrowDown,
  ArrowUp,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Layers,
  Check,
  Plus,
  Bell,
  ArrowLeftRight,
  Info,
  DollarSign,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Transaction, FinancialGoal, SpreadsheetRow } from '../types';
import { formatBRL } from '../utils/formatters';
import { getMonthlyExpectedBudget } from './MonthlyBudgetSpreadsheetPanel';

interface DashboardViewProps {
  selectedMonth: string;
  transactions: Transaction[];
  goals: FinancialGoal[];
  spreadsheets: SpreadsheetRow[];
  onNavigateToTab: (tab: string) => void;
  onOpenNewTx?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMonth,
  transactions,
  goals,
  spreadsheets,
  onNavigateToTab,
  onOpenNewTx,
}) => {
  // Filter Person state for table and summary
  const [filterPerson, setFilterPerson] = useState<'todos' | 'felipe' | 'genivania'>('todos');

  // Month code map completo com todos os 12 meses de 2026
  const getMonthCode = (monthName: string): string => {
    if (!monthName) return '2026-09';
    if (/^\d{4}-\d{2}/.test(monthName)) return monthName.slice(0, 7);
    const monthsMap: Record<string, string> = {
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
    const lower = monthName.toLowerCase();
    for (const [name, code] of Object.entries(monthsMap)) {
      if (lower.includes(name)) return code;
    }
    return '2026-09';
  };

  const activeMonthCode = getMonthCode(selectedMonth);

  // 1. Transactions for the active month (estritamente do mês selecionado, sem fallback para outros meses!)
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.mesReferencia === activeMonthCode || (t.data && t.data.startsWith(activeMonthCode))
    );
  }, [transactions, activeMonthCode]);

  // Transações estritamente do mês selecionado
  const relevantTransactions = monthTransactions;

  // 2. Financial Metrics from real database
  const metrics = useMemo(() => {
    const expenses = relevantTransactions.filter((t) => t.tipo === 'despesa');
    const totalGastos = expenses.reduce((acc, t) => acc + t.valor, 0);

    // Macro Categories
    const gastoInvariavel = expenses
      .filter((t) => (t.categoria || '').toLowerCase().includes('invariável') || (t.categoria || '').toLowerCase().includes('invariavel'))
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoVariavel = expenses
      .filter((t) => (t.categoria || '').toLowerCase() === 'variável' || (t.categoria || '').toLowerCase() === 'variavel')
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoExtra = expenses
      .filter((t) => (t.categoria || '').toLowerCase().includes('extra') || (t.categoria || '').toLowerCase().includes('eventual'))
      .reduce((acc, t) => acc + t.valor, 0);

    // Subcategories for Teto Cards
    const gastoSupermercado = expenses
      .filter((t) => (t.subcategoria || '').toLowerCase().includes('supermercado') || (t.subcategoria || '').toLowerCase().includes('alimento') || (t.subcategoria || '').toLowerCase().includes('feira'))
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoCarro = expenses
      .filter((t) => (t.subcategoria || '').toLowerCase().includes('combust') || (t.subcategoria || '').toLowerCase().includes('carro') || (t.subcategoria || '').toLowerCase().includes('seguro') || (t.subcategoria || '').toLowerCase().includes('manuten'))
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoLazer = expenses
      .filter((t) => (t.subcategoria || '').toLowerCase().includes('lazer') || (t.subcategoria || '').toLowerCase().includes('restaurante') || (t.subcategoria || '').toLowerCase().includes('jantar'))
      .reduce((acc, t) => acc + t.valor, 0);

    const gastoFarmacia = expenses
      .filter((t) => (t.subcategoria || '').toLowerCase().includes('farm') || (t.subcategoria || '').toLowerCase().includes('saude') || (t.subcategoria || '').toLowerCase().includes('saúde'))
      .reduce((acc, t) => acc + t.valor, 0);

    // Planned Goals from Supabase
    const goalSuper = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('supermercado'))?.valorPlanejado || 2500;
    const goalCarro = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('combustivel') || (g.subcategoria || g.titulo || '').toLowerCase().includes('carro'))?.valorPlanejado || 800;
    const goalLazer = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('lazer'))?.valorPlanejado || 1200;
    const goalFarmacia = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('farmacia'))?.valorPlanejado || 450;
    const goalEconomia = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('economia'))?.valorPlanejado || 3500;

    // Orçamento Mensal Previsto Oficial (Sincronizado com a Planilha Oficial de Fechamento)
    const expectativaPrevista = getMonthlyExpectedBudget(activeMonthCode);
    const saldoOrcamento = expectativaPrevista - totalGastos;

    // Couple Share calculation
    const felipeGasto = expenses
      .filter((t) => t.usuario_id === 'usr-felipe' || t.pagoPor === 'Felipe')
      .reduce((acc, t) => acc + t.valor, 0);

    const genivaniaGasto = expenses
      .filter((t) => t.usuario_id === 'usr-genivania' || t.pagoPor === 'Genivânia')
      .reduce((acc, t) => acc + t.valor, 0);

    const totalParitario = (felipeGasto + genivaniaGasto) || 1;
    const felipeShareReal = ((felipeGasto / totalParitario) * 100).toFixed(1);
    const genivaniaShareReal = ((genivaniaGasto / totalParitario) * 100).toFixed(1);

    // Incomes and Net Balance calculation
    const incomes = relevantTransactions.filter((t) => t.tipo === 'receita');
    const totalReceitas = incomes.length > 0
      ? incomes.reduce((acc, t) => acc + t.valor, 0)
      : 18450; // Renda familiar de referência
    const saldoLiquido = totalReceitas - totalGastos;

    return {
      totalGastos,
      totalReceitas,
      saldoLiquido,
      orcamentoTotal: expectativaPrevista,
      saldoOrcamento,
      goalEconomia,
      expectativaPrevista,
      gastoInvariavel,
      gastoVariavel,
      gastoExtra,
      gastoSupermercado,
      gastoCarro,
      gastoLazer,
      gastoFarmacia,
      goalSuper,
      goalCarro,
      goalLazer,
      goalFarmacia,
      felipeGasto,
      genivaniaGasto,
      felipeShareReal,
      genivaniaShareReal,
      totalCount: expenses.length,
    };
  }, [relevantTransactions, goals]);

  // 3. Highlighted recent transactions from real database
  const recentTransactions = useMemo(() => {
    let list = [...relevantTransactions].filter((t) => t.tipo === 'despesa');
    if (filterPerson === 'felipe') {
      list = list.filter((t) => t.usuario_id === 'usr-felipe' || t.pagoPor === 'Felipe');
    } else if (filterPerson === 'genivania') {
      list = list.filter((t) => t.usuario_id === 'usr-genivania' || t.pagoPor === 'Genivânia');
    }
    return list
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 6);
  }, [relevantTransactions, filterPerson]);

  // 4. Evolução Mensal Real de 2026 (Todos os 12 meses) baseada no Supabase
  const monthlyEvolution = useMemo(() => {
    const months = [
      { key: '2026-01', label: 'Jan', name: 'Janeiro 2026' },
      { key: '2026-02', label: 'Fev', name: 'Fevereiro 2026' },
      { key: '2026-03', label: 'Mar', name: 'Março 2026' },
      { key: '2026-04', label: 'Abr', name: 'Abril 2026' },
      { key: '2026-05', label: 'Mai', name: 'Maio 2026' },
      { key: '2026-06', label: 'Jun', name: 'Junho 2026' },
      { key: '2026-07', label: 'Jul', name: 'Julho 2026' },
      { key: '2026-08', label: 'Ago', name: 'Agosto 2026' },
      { key: '2026-09', label: 'Set', name: 'Setembro 2026' },
      { key: '2026-10', label: 'Out', name: 'Outubro 2026' },
      { key: '2026-11', label: 'Nov', name: 'Novembro 2026' },
      { key: '2026-12', label: 'Dez', name: 'Dezembro 2026' },
    ];

    const data = months.map((m) => {
      const txs = transactions.filter(
        (t) => (t.mesReferencia === m.key || (t.data && t.data.startsWith(m.key))) && t.tipo === 'despesa'
      );
      const real = txs.reduce((acc, t) => acc + Number(t.valor || 0), 0);
      const isCurrent = m.name === selectedMonth || m.key === activeMonthCode;
      const plan = getMonthlyExpectedBudget(m.key);
      return {
        mes: m.label,
        nomeMes: m.name,
        real: Math.round(real * 100) / 100,
        plan,
        isCurrent,
        isAlert: real > plan && real > 0,
        count: txs.length,
      };
    });

    const maxVal = Math.max(...data.map((d) => Math.max(d.real, d.plan)), 8500);
    return { data, maxVal };
  }, [transactions, goals, selectedMonth, activeMonthCode]);

  // 5. Distribuição Real por Centro de Custo no Mês Selecionado
  const categoryDistribution = useMemo(() => {
    const exp = relevantTransactions.filter((t) => t.tipo === 'despesa');
    const total = exp.reduce((acc, t) => acc + Number(t.valor || 0), 0);

    const catTotals: Record<string, { total: number; count: number; color: string; label: string }> = {
      supermercado: { total: 0, count: 0, color: '#006948', label: 'Supermercado' },
      carro: { total: 0, count: 0, color: '#006194', label: 'Carro & Mobilidade' },
      moradia: { total: 0, count: 0, color: '#6366f1', label: 'Moradia / Invariável' },
      lazer: { total: 0, count: 0, color: '#f59e0b', label: 'Lazer & Alimentação' },
      farmacia: { total: 0, count: 0, color: '#ec4899', label: 'Farmácia & Saúde' },
      outros: { total: 0, count: 0, color: '#94a3b8', label: 'Outros / Eventuais' },
    };

    exp.forEach((t) => {
      const sub = (t.subcategoria || '').toLowerCase();
      const cat = (t.categoria || '').toLowerCase();
      if (sub.includes('supermercado') || sub.includes('alimento') || sub.includes('feira')) {
        catTotals.supermercado.total += t.valor;
        catTotals.supermercado.count++;
      } else if (sub.includes('combust') || sub.includes('carro') || sub.includes('seguro') || sub.includes('rastreador') || sub.includes('manuten')) {
        catTotals.carro.total += t.valor;
        catTotals.carro.count++;
      } else if (sub.includes('aluguel') || sub.includes('condom') || sub.includes('internet') || sub.includes('agua') || sub.includes('água') || sub.includes('luz') || sub.includes('gas') || sub.includes('gás') || cat.includes('invari')) {
        catTotals.moradia.total += t.valor;
        catTotals.moradia.count++;
      } else if (sub.includes('lazer') || sub.includes('restaurante') || sub.includes('jantar') || sub.includes('pizza') || sub.includes('comida')) {
        catTotals.lazer.total += t.valor;
        catTotals.lazer.count++;
      } else if (sub.includes('farm') || sub.includes('saude') || sub.includes('saúde') || sub.includes('remedio') || sub.includes('remédio')) {
        catTotals.farmacia.total += t.valor;
        catTotals.farmacia.count++;
      } else {
        catTotals.outros.total += t.valor;
        catTotals.outros.count++;
      }
    });

    const list = Object.entries(catTotals)
      .map(([k, v]) => {
        const pct = total > 0 ? Math.round((v.total / total) * 100) : 0;
        return {
          key: k,
          label: v.label,
          total: Math.round(v.total * 100) / 100,
          count: v.count,
          color: v.color,
          pct,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    let currentOffset = 0;
    const slices = list.map((item) => {
      const slice = {
        ...item,
        strokeDasharray: `${item.pct} ${100 - item.pct}`,
        strokeDashoffset: -currentOffset,
      };
      currentOffset += item.pct;
      return slice;
    });

    return { list, slices, total };
  }, [relevantTransactions]);

  // 6. Maiores Estabelecimentos Reais do Mês por Centro de Custo
  const topEstByCenter = useMemo(() => {
    const exp = relevantTransactions.filter((t) => t.tipo === 'despesa');
    const getTop = (filterFn: (t: Transaction) => boolean) => {
      const estMap: Record<string, number> = {};
      exp.filter(filterFn).forEach((t) => {
        const name = t.estabelecimento || 'Diversos';
        estMap[name] = (estMap[name] || 0) + t.valor;
      });
      return Object.entries(estMap)
        .map(([nome, val]) => ({ nome, val: Math.round(val * 100) / 100 }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 3);
    };

    return {
      supermercado: getTop((t) => (t.subcategoria || '').toLowerCase().includes('supermercado') || (t.subcategoria || '').toLowerCase().includes('alimento')),
      carro: getTop((t) => (t.subcategoria || '').toLowerCase().includes('combust') || (t.subcategoria || '').toLowerCase().includes('carro') || (t.subcategoria || '').toLowerCase().includes('posto')),
      lazer: getTop((t) => (t.subcategoria || '').toLowerCase().includes('lazer') || (t.subcategoria || '').toLowerCase().includes('restaurante') || (t.subcategoria || '').toLowerCase().includes('pizza')),
      farmacia: getTop((t) => (t.subcategoria || '').toLowerCase().includes('farm') || (t.subcategoria || '').toLowerCase().includes('saude') || (t.subcategoria || '').toLowerCase().includes('saúde')),
    };
  }, [relevantTransactions]);

  const orcamentoRealPercent = Math.round(
    (metrics.totalGastos / (metrics.expectativaPrevista || 1)) * 100
  );
  const orcamentoBarWidth = Math.min(100, orcamentoRealPercent);

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Screens < 768px): UX limpa e proporcional ao celular     */}
      {/* ========================================================================= */}
      <div id="dashboard-mobile-view" className="block md:hidden w-full max-w-md mx-auto px-1 pb-24">
        {/* Header: Saudação do Casal */}
        <div className="flex items-start justify-between gap-2 pt-1 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-5 h-5 fill-[#006948]/20 text-[#006948]" />
              <h1 className="font-display font-bold text-lg text-[#0b1c30] tracking-tight leading-tight">
                Bom dia, Felipe & Genivânia
              </h1>
            </div>
            <p className="text-xs text-[#565e74] mt-0.5">
              Vocês estão construindo o futuro juntos.
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#006194] text-[11px] font-bold border border-[#dce9ff]">
              {selectedMonth}
            </span>
            <span className="text-[10px] text-[#006948] font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
              Sincronizado
            </span>
          </div>
        </div>

        {/* Hero Card: SALDO LÍQUIDO ACUMULADO */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
              SALDO LÍQUIDO ACUMULADO
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                metrics.saldoLiquido >= 0 ? 'bg-[#dcfce7] text-[#006948]' : 'bg-[#fee2e2] text-[#dc2626]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              {metrics.saldoLiquido >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>

          <div className="my-2">
            <span
              className={`font-display font-black text-3xl sm:text-4xl tracking-tight font-mono ${
                metrics.saldoLiquido >= 0 ? 'text-[#006948]' : 'text-[#dc2626]'
              }`}
            >
              {metrics.saldoLiquido >= 0 ? '+' : ''}{formatBRL(metrics.saldoLiquido)}
            </span>
          </div>

          {/* Orçamento Global Consumido */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#0b1c30]">
                Orçamento Global Consumido
              </span>
              <span className="text-[#565e74] font-mono">
                {orcamentoRealPercent}% <span className="text-[#727a90]">({formatBRL(metrics.totalGastos)} / {formatBRL(metrics.expectativaPrevista)})</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  orcamentoRealPercent > 100 ? 'bg-[#dc2626]' : orcamentoRealPercent > 85 ? 'bg-[#f59e0b]' : 'bg-[#006948]'
                }`}
                style={{ width: `${orcamentoBarWidth}%` }}
              />
            </div>
          </div>

          {/* Divisão Paritária do Mês */}
          <div className="mt-4 p-3 rounded-2xl bg-[#f8faff] border border-[#e5eeff]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-[#0b1c30] font-bold">
                <span>⚖️</span>
                <span>Divisão Paritária do Mês</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                Equilíbrio Ativo
              </span>
            </div>
            <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${metrics.felipeShareReal}%` }}
                className="h-full bg-[#006948]"
                title={`Felipe: ${metrics.felipeShareReal}%`}
              />
              <div
                style={{ width: `${metrics.genivaniaShareReal}%` }}
                className="h-full bg-[#006194]"
                title={`Genivânia: ${metrics.genivaniaShareReal}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-[#565e74] mt-1.5">
              <span className="flex items-center gap-1 text-[#006948] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#006948]" />
                Felipe {metrics.felipeShareReal}% ({formatBRL(metrics.felipeGasto)})
              </span>
              <span className="flex items-center gap-1 text-[#006194] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#006194]" />
                Genivânia {metrics.genivaniaShareReal}% ({formatBRL(metrics.genivaniaGasto)})
              </span>
            </div>
          </div>
        </div>

        {/* Ações Rápidas (Grid 2x2) */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-[#565e74] uppercase tracking-wider mb-2.5 px-1">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Escanear Nota */}
            <button
              onClick={() => onNavigateToTab('scanner')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center gap-3 text-left hover:border-[#006948] transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#0b1c30] block truncate">
                  Escanear Nota
                </span>
                <span className="text-[10px] text-[#006948] font-medium block truncate">
                  OCR Inteligente
                </span>
              </div>
            </button>

            {/* 2. Lançar Gasto */}
            <button
              onClick={onOpenNewTx}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center gap-3 text-left hover:border-[#006194] transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#0b1c30] block truncate">
                  Lançar Gasto
                </span>
                <span className="text-[10px] text-[#006194] font-medium block truncate">
                  PIX ou Cartão
                </span>
              </div>
            </button>

            {/* 3. Comando Voz */}
            <button
              onClick={() => onNavigateToTab('voz')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center gap-3 text-left hover:border-purple-300 transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#0b1c30] block truncate">
                  Comando Voz
                </span>
                <span className="text-[10px] text-[#7c3aed] font-medium block truncate">
                  Alexa & Siri
                </span>
              </div>
            </button>

            {/* 4. Lista Mercado */}
            <button
              onClick={() => onNavigateToTab('lista')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center gap-3 text-left hover:border-emerald-300 transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ecfeff] text-[#0891b2] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#0b1c30] block truncate">
                  Lista Mercado
                </span>
                <span className="text-[10px] text-[#0891b2] font-medium block truncate">
                  Auditoria IA
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Assistente Duarte Finanças */}
        <div
          onClick={() => onNavigateToTab('voz')}
          className="bg-linear-to-r from-[#eff4ff] to-[#ecfdf5] border border-[#dce9ff] rounded-2xl p-3.5 flex items-center gap-3 shadow-xs mb-5 cursor-pointer active:scale-98 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-[#0b1c30]">ASSISTENTE DUARTE FINANÇAS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
            </div>
            <p className="text-[11px] text-[#565e74] truncate mt-0.5">
              "Toque para falar ou diga: 'Registrei R$ 35 no supermercado...'"
            </p>
          </div>
        </div>

        {/* Tetos do Mês em Foco */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
              Tetos do Mês em Foco
            </h2>
            <button
              onClick={() => onNavigateToTab('metas')}
              className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Supermercado */}
            <div
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0b1c30] block">Supermercado</span>
                    <span className="text-[10px] text-[#565e74]">
                      {metrics.gastoSupermercado > metrics.goalSuper
                        ? `Excedido em ${formatBRL(metrics.gastoSupermercado - metrics.goalSuper)}`
                        : `Restam ${formatBRL(metrics.goalSuper - metrics.gastoSupermercado)} livres`}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  metrics.gastoSupermercado > metrics.goalSuper
                    ? 'bg-[#fee2e2] text-[#dc2626]'
                    : 'bg-[#ecfdf5] text-[#006948]'
                }`}>
                  {metrics.gastoSupermercado > metrics.goalSuper ? 'Atenção' : 'No Teto'}
                </span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    metrics.gastoSupermercado > metrics.goalSuper ? 'bg-[#dc2626]' : 'bg-[#006948]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((metrics.gastoSupermercado / (metrics.goalSuper || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 font-mono">
                <span className={`font-bold ${metrics.gastoSupermercado > metrics.goalSuper ? 'text-[#dc2626]' : 'text-[#0b1c30]'}`}>
                  {formatBRL(metrics.gastoSupermercado)}
                </span>
                <span className="text-[#727a90] text-[11px]">
                  Teto: {formatBRL(metrics.goalSuper)}
                </span>
              </div>
            </div>

            {/* Carro & Mobilidade */}
            <div
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0b1c30] block">Carro & Mobilidade</span>
                    <span className="text-[10px] text-[#565e74]">
                      Jeep Compass • Combustível + Seguro
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                  Consolidado
                </span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    metrics.gastoCarro > metrics.goalCarro ? 'bg-[#dc2626]' : 'bg-[#006194]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((metrics.gastoCarro / (metrics.goalCarro || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 font-mono">
                <span className={`font-bold ${metrics.gastoCarro > metrics.goalCarro ? 'text-[#dc2626]' : 'text-[#0b1c30]'}`}>
                  {formatBRL(metrics.gastoCarro)}
                </span>
                <span className="text-[#727a90] text-[11px]">
                  Teto: {formatBRL(metrics.goalCarro)} ({formatBRL(Math.max(0, metrics.goalCarro - metrics.gastoCarro))} livres)
                </span>
              </div>
            </div>

            {/* Lazer & Jantares */}
            <div
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0b1c30] block">Lazer & Jantares</span>
                    <span className="text-[10px] text-[#565e74]">
                      {Math.round((metrics.gastoLazer / (metrics.goalLazer || 1)) * 100)}% consumido (Restam {formatBRL(Math.max(0, metrics.goalLazer - metrics.gastoLazer))})
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#ea580c] text-[10px] font-bold">
                  Final de Semana
                </span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-[#ea580c] rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((metrics.gastoLazer / (metrics.goalLazer || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 font-mono">
                <span className="font-bold text-[#0b1c30]">
                  {formatBRL(metrics.gastoLazer)}
                </span>
                <span className="text-[#727a90] text-[11px]">
                  Teto: {formatBRL(metrics.goalLazer)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Movimentações Recentes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
              Movimentações Recentes
            </h2>
            <button
              onClick={() => onNavigateToTab('extrato')}
              className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
            >
              Ver extrato
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recentTransactions.slice(0, 4).map((tx) => {
              const isFelipe = tx.usuario_id === 'usr-felipe' || tx.pagoPor === 'Felipe';
              return (
                <div
                  key={tx.id}
                  onClick={() => onNavigateToTab('extrato')}
                  className="bg-white rounded-2xl p-3 border border-[#e5eeff] shadow-2xs flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#f8faff] border border-[#e5eeff] flex items-center justify-center text-base shrink-0">
                      {tx.subcategoria?.toLowerCase().includes('super') ? '🛒' :
                       tx.subcategoria?.toLowerCase().includes('combust') || tx.subcategoria?.toLowerCase().includes('carro') ? '⛽' :
                       tx.subcategoria?.toLowerCase().includes('farm') ? '💊' :
                       tx.subcategoria?.toLowerCase().includes('lazer') ? '🍽️' : '💳'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#0b1c30] block truncate">
                        {tx.estabelecimento || 'Lançamento Diverso'}
                      </span>
                      <span className="text-[10px] text-[#565e74] flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isFelipe ? 'bg-[#2563eb]' : 'bg-[#ec4899]'}`} />
                        {isFelipe ? 'Felipe' : 'Genivânia'} • {tx.data}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-[#0b1c30] block">
                      - {formatBRL(tx.valor)}
                    </span>
                    <span className="text-[9px] text-[#565e74]">
                      {tx.subcategoria || tx.categoria}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card discreto para ver Análise BI Completa */}
        <div
          onClick={() => onNavigateToTab('relatorios')}
          className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between text-xs text-[#006194] font-bold cursor-pointer hover:bg-[#dce9ff] transition-colors shadow-2xs"
        >
          <span>📊 Ver Gráficos de Evolução 2026 & Relatórios BI</span>
          <span>→</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Visão completa BI e painéis amplos     */}
      {/* ========================================================================= */}
      <div id="dashboard-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto px-4 md:px-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#565e74]">
                {relevantTransactions.length} lançamentos • {selectedMonth}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
              Visão Consolidada • Felipe Duarte & Genivânia Duarte
            </h1>
          </div>

          {/* Usuários Ativos */}
          <div className="flex items-center gap-2.5 bg-white py-2 px-3.5 rounded-2xl border border-[#e5eeff] shadow-xs">
            <div className="flex items-center -space-x-1.5">
              <div
                className="w-7 h-7 rounded-full bg-[#2563eb] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title="Felipe Duarte"
              >
                F
              </div>
              <div
                className="w-7 h-7 rounded-full bg-[#ec4899] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title="Genivânia Duarte"
              >
                G
              </div>
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#0b1c30] block">Casal Duarte</span>
              <span className="text-[10px] text-[#006948] font-semibold">Orçamento Compartilhado</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Top Cards Dinâmicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* KPI 1: Orçamento Previsto */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Orçamento Mensal Previsto</span>
                <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                {formatBRL(metrics.expectativaPrevista)}
              </div>
            </div>
            <div className="text-xs text-[#006194] font-medium mt-3 flex items-center gap-1">
              <span>Planilha Oficial de Fechamento</span>
            </div>
          </div>

          {/* KPI 2: Gastos */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Total Gasto (Realidade)</span>
                <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#ba1a1a] mt-2 font-mono">
                {formatBRL(metrics.totalGastos)}
              </div>
            </div>
            <div className="text-xs text-[#565e74] mt-3">
              {orcamentoRealPercent}% do orçamento consumido • {metrics.totalCount} compras
            </div>
          </div>

          {/* KPI 3: Saldo do Orçamento (Folga Restante) */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Saldo Restante do Teto</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    metrics.saldoOrcamento >= 0
                      ? 'bg-[#dcfce7] text-[#006948]'
                      : 'bg-[#fee2e2] text-[#dc2626]'
                  }`}
                >
                  {metrics.saldoOrcamento >= 0 ? 'Dentro do teto' : 'Acima do teto'}
                </span>
              </div>
              <div
                className={`font-display font-extrabold text-2xl mt-2 font-mono ${
                  metrics.saldoOrcamento >= 0 ? 'text-[#006948]' : 'text-[#dc2626]'
                }`}
              >
                {formatBRL(metrics.saldoOrcamento)}
              </div>
            </div>
            <div className="text-xs text-[#565e74] font-medium mt-3 flex items-center gap-1">
              <span>{metrics.saldoOrcamento >= 0 ? '✓ Disponível para gastos' : '⚠️ Atenção aos limites'}</span>
            </div>
          </div>

          {/* KPI 4: Meta de Economia Conjunta */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Meta de Economia Mensal</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#006948] mt-2 font-mono">
                {formatBRL(metrics.goalEconomia)}
              </div>
            </div>
            <div className="text-xs text-[#006948] font-medium mt-3 flex items-center gap-1">
              <span>✓ Reserva e investimentos do casal</span>
            </div>
          </div>
        </div>

        {/* 3 Macro Groups Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Invariável */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[11px] font-bold">
                  Invariável (Essenciais Fixos)
                </span>
                <span className="text-xs font-bold text-[#006948]">✓ Em dia</span>
              </div>
              <p className="text-[11px] text-[#565e74] truncate mb-3">
                Aluguel, Condomínio, Internet, Seguro, Rastreador...
              </p>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-[#565e74]">Realizado:</span>
                <span className="font-display font-bold text-base text-[#0b1c30] font-mono">
                  {formatBRL(metrics.gastoInvariavel)}
                </span>
              </div>
            </div>
          </div>

          {/* Variável */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#ea580c] text-[11px] font-bold">
                  Variável (Rotina & Estilo)
                </span>
                <span className="text-xs font-bold text-[#006948]">✓ Sob controle</span>
              </div>
              <p className="text-[11px] text-[#565e74] truncate mb-3">
                Supermercado, Combustível, Farmácia, Lazer...
              </p>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-[#565e74]">Realizado:</span>
                <span className="font-display font-bold text-base text-[#0b1c30] font-mono">
                  {formatBRL(metrics.gastoVariavel)}
                </span>
              </div>
            </div>
          </div>

          {/* Extra / Eventualidades */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ecfeff] text-[#0891b2] text-[11px] font-bold">
                  Extra & Eventualidades
                </span>
                <span className="text-xs font-bold text-[#006948]">✓ Monitorado</span>
              </div>
              <p className="text-[11px] text-[#565e74] truncate mb-3">
                Manutenção Jeep Compass, Saúde e imprevistos...
              </p>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-[#565e74]">Realizado:</span>
                <span className="font-display font-bold text-base text-[#0b1c30] font-mono">
                  {formatBRL(metrics.gastoExtra)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Operacional & Saúde Financeira de 2026 */}
        <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              orcamentoRealPercent > 100 ? 'bg-[#ffdad6] text-[#ba1a1a]' : orcamentoRealPercent > 85 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#ecfdf5] text-[#006948]'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#0b1c30]">Saúde Financeira de {selectedMonth}:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  orcamentoRealPercent > 100 ? 'bg-[#ffdad6] text-[#ba1a1a]' : orcamentoRealPercent > 85 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#ecfdf5] text-[#006948]'
                }`}>
                  {orcamentoRealPercent}% do Orçamento
                </span>
              </div>
              <p className="text-[11px] text-[#565e74] mt-0.5">
                Total realizado: <strong className="text-[#0b1c30]">{formatBRL(metrics.totalGastos)}</strong> de{' '}
                <strong>{formatBRL(metrics.expectativaPrevista)}</strong> planejados para o casal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('relatorios')}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#cbd5e1] text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-semibold cursor-pointer transition-colors"
            >
              Relatório Completo
            </button>
            <button
              onClick={() => onNavigateToTab('metas')}
              className="px-3 py-1.5 rounded-xl bg-[#006948] text-white hover:bg-[#00563b] text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Ver Metas
            </button>
          </div>
        </div>

        {/* Section: Centros de Custo em Destaque */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Centros de Custo em Destaque • {selectedMonth}
              </h3>
              <p className="text-xs text-[#565e74]">
                Acompanhamento com tetos reais das metas e maiores gastos identificados
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('metas')}
              className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
            >
              Gerenciar Tetos →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Supermercado */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Supermercado</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    metrics.gastoSupermercado > metrics.goalSuper ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#ecfdf5] text-[#006948]'
                  }`}>
                    {metrics.gastoSupermercado > metrics.goalSuper ? 'ACIMA' : 'NO TETO'}
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  {formatBRL(metrics.gastoSupermercado)}
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Teto Planejado: {formatBRL(metrics.goalSuper)}
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  {topEstByCenter.supermercado.length > 0 ? (
                    topEstByCenter.supermercado.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#565e74] truncate pr-1">{item.nome}</span>
                        <span className="font-bold text-[#0b1c30] font-mono shrink-0">{formatBRL(item.val)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[#565e74] text-[10px]">Sem despesas no mês</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Consumo: {Math.round((metrics.gastoSupermercado / (metrics.goalSuper || 1)) * 100)}%</span>
                <span className={`font-bold ${metrics.gastoSupermercado > metrics.goalSuper ? 'text-[#ba1a1a]' : 'text-[#006948]'}`}>
                  {metrics.gastoSupermercado > metrics.goalSuper ? 'Ajustar ritmo' : 'Dentro da meta'}
                </span>
              </div>
            </div>

            {/* Card 2: Carro Total (Compass) */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Carro Total</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    metrics.gastoCarro > metrics.goalCarro ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#eff4ff] text-[#006194]'
                  }`}>
                    COMPASS
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  {formatBRL(metrics.gastoCarro)}
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Teto Planejado: {formatBRL(metrics.goalCarro)}
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  {topEstByCenter.carro.length > 0 ? (
                    topEstByCenter.carro.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#565e74] truncate pr-1">{item.nome}</span>
                        <span className="font-bold text-[#0b1c30] font-mono shrink-0">{formatBRL(item.val)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[#565e74] text-[10px]">Sem despesas no mês</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Consumo: {Math.round((metrics.gastoCarro / (metrics.goalCarro || 1)) * 100)}%</span>
                <span className={`font-bold ${metrics.gastoCarro > metrics.goalCarro ? 'text-[#ba1a1a]' : 'text-[#006194]'}`}>
                  {metrics.gastoCarro > metrics.goalCarro ? 'Acima do orçado' : 'Sob controle'}
                </span>
              </div>
            </div>

            {/* Card 3: Lazer & Jantares */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Lazer & Experiências</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    metrics.gastoLazer > metrics.goalLazer ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#ecfdf5] text-[#006948]'
                  }`}>
                    CASAL
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  {formatBRL(metrics.gastoLazer)}
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Teto Planejado: {formatBRL(metrics.goalLazer)}
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  {topEstByCenter.lazer.length > 0 ? (
                    topEstByCenter.lazer.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#565e74] truncate pr-1">{item.nome}</span>
                        <span className="font-bold text-[#0b1c30] font-mono shrink-0">{formatBRL(item.val)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[#565e74] text-[10px]">Sem despesas no mês</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Consumo: {Math.round((metrics.gastoLazer / (metrics.goalLazer || 1)) * 100)}%</span>
                <span className={`font-bold ${metrics.gastoLazer > metrics.goalLazer ? 'text-[#ba1a1a]' : 'text-[#006948]'}`}>
                  {metrics.gastoLazer > metrics.goalLazer ? 'Atenção' : 'Equilibrado'}
                </span>
              </div>
            </div>

            {/* Card 4: Farmácia & Saúde */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#fdf2f8] text-[#db2777] flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Farmácia & Saúde</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    metrics.gastoFarmacia > metrics.goalFarmacia ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#ecfdf5] text-[#006948]'
                  }`}>
                    ESSENCIAL
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  {formatBRL(metrics.gastoFarmacia)}
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Teto Planejado: {formatBRL(metrics.goalFarmacia)}
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  {topEstByCenter.farmacia.length > 0 ? (
                    topEstByCenter.farmacia.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#565e74] truncate pr-1">{item.nome}</span>
                        <span className="font-bold text-[#0b1c30] font-mono shrink-0">{formatBRL(item.val)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[#565e74] text-[10px]">Sem despesas no mês</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Consumo: {Math.round((metrics.gastoFarmacia / (metrics.goalFarmacia || 1)) * 100)}%</span>
                <span className={`font-bold ${metrics.gastoFarmacia > metrics.goalFarmacia ? 'text-[#ba1a1a]' : 'text-[#006948]'}`}>
                  {metrics.gastoFarmacia > metrics.goalFarmacia ? 'Excedeu teto' : 'Dentro do limite'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: 2 Gráficos Lado a Lado (Planejado vs Realizado + Distribuição) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Gráfico 1: Planejado vs. Realizado (2026) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                    Planejado vs. Realizado (Ano Todo 2026)
                  </h3>
                  <p className="text-xs text-[#565e74]">
                    Consolidado mensal de lançamentos do casal
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#565e74]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#dbeafe] inline-block" />
                    <span>Meta Planejada</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#006948] inline-block" />
                    <span>Gasto Real</span>
                  </span>
                </div>
              </div>

              {/* SVG Bar Chart Dinâmico Responsivo */}
              <div className="overflow-x-auto pb-1">
                <div className="h-48 min-w-[400px] sm:min-w-full w-full flex items-end justify-between px-2 pt-6 relative mt-2">
                  {/* Background horizontal guide lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">
                      {formatBRL(monthlyEvolution.maxVal)}
                    </div>
                    <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">
                      {formatBRL(monthlyEvolution.maxVal * 0.66)}
                    </div>
                    <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">
                      {formatBRL(monthlyEvolution.maxVal * 0.33)}
                    </div>
                    <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">
                      R$ 0,00
                    </div>
                  </div>

                  {/* Bars per Month */}
                  {monthlyEvolution.data.map((item, idx) => {
                    const planHeight = Math.min(100, Math.round((item.plan / monthlyEvolution.maxVal) * 100));
                    const realHeight = Math.min(100, Math.round((item.real / monthlyEvolution.maxVal) * 100));

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 z-10 flex-1 group">
                        <div className="flex items-end gap-1.5 h-36">
                          {/* Planned Bar */}
                          <div
                            style={{ height: `${planHeight}%` }}
                            className="w-3.5 sm:w-4 bg-[#dbeafe] rounded-t-sm transition-all group-hover:bg-[#bfdbfe]"
                            title={`Meta ${item.nomeMes}: ${formatBRL(item.plan)}`}
                          />
                          {/* Real Bar */}
                          <div
                            style={{ height: `${realHeight}%` }}
                            className={`w-3.5 sm:w-4 rounded-t-sm transition-all ${
                              item.isAlert
                                ? 'bg-[#ba1a1a] group-hover:bg-[#991b1b]'
                                : item.isCurrent
                                ? 'bg-[#006948] ring-2 ring-[#006948]/30 group-hover:bg-[#00563b]'
                                : 'bg-[#006948] group-hover:bg-[#00563b]'
                            }`}
                            title={`Real ${item.nomeMes}: ${formatBRL(item.real)} (${item.count} compras)`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1 transition-colors ${
                            item.isCurrent
                              ? 'text-[#006948] font-bold bg-[#ecfdf5] px-1.5 py-0.5 rounded-md'
                              : 'text-[#565e74]'
                          }`}
                        >
                          {item.mes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006948]" />
                <span>Mês ativo em destaque: <strong>{selectedMonth}</strong></span>
              </span>
              <span className="font-bold text-[#006948]">Consolidado 100% Sincronizado</span>
            </div>
          </div>

          {/* Gráfico 2: Distribuição por Centro de Custo (Donut Real) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Distribuição por Categoria
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f8faff] border border-[#e5eeff] text-[#565e74]">
                  {selectedMonth}
                </span>
              </div>
              <p className="text-xs text-[#565e74] mb-3">
                Composição real das despesas no mês selecionado
              </p>

              {/* Donut Chart SVG Container */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-2">
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="4"
                    />
                    {/* Slices dinâmicos reais */}
                    {categoryDistribution.slices.map((slice, sIdx) => (
                      <circle
                        key={sIdx}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="4"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    ))}
                  </svg>

                  {/* Donut Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[9px] text-[#565e74] uppercase font-bold tracking-wider">
                      Gasto Total
                    </span>
                    <span className="font-display font-extrabold text-xs text-[#0b1c30] font-mono leading-tight">
                      {formatBRL(categoryDistribution.total)}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 space-y-1.5 w-full">
                  {categoryDistribution.list.slice(0, 5).map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[#565e74] truncate text-[11px]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-bold text-[#0b1c30] text-[11px]">{formatBRL(item.total)}</span>
                        <span className="text-[10px] text-[#565e74] w-7 text-right">{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
              <span>Total de {categoryDistribution.list.reduce((acc, i) => acc + i.count, 0)} compras categorizadas</span>
              <span className="font-bold text-[#006948]">Atualizado</span>
            </div>
          </div>
        </div>

        {/* Section: Últimas Transações Registradas (Tabela Real) */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Últimas Transações Registradas
              </h3>
              <p className="text-xs text-[#565e74]">
                Extrato e histórico recente de despesas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterPerson((prev) =>
                    prev === 'todos' ? 'felipe' : prev === 'felipe' ? 'genivania' : 'todos'
                  );
                }}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                {filterPerson === 'todos'
                  ? 'Filtrar por Pessoa'
                  : filterPerson === 'felipe'
                  ? 'Filtrado: Felipe Duarte'
                  : 'Filtrado: Genivânia Duarte'}
              </button>

              <button
                onClick={() => onNavigateToTab('extrato')}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Ver Extrato Completo ({relevantTransactions.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">RESPONSÁVEL</th>
                  <th className="py-3 px-4">DATA</th>
                  <th className="py-3 px-4">ESTABELECIMENTO / DESCRIÇÃO</th>
                  <th className="py-3 px-4">CATEGORIA</th>
                  <th className="py-3 px-4">PAGAMENTO</th>
                  <th className="py-3 px-4 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {recentTransactions.map((item) => {
                  const isFelipe = item.usuario_id === 'usr-felipe' || item.pagoPor === 'Felipe';
                  return (
                    <tr key={item.id} className="hover:bg-[#f8faff] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center ${
                              isFelipe ? 'bg-[#2563eb]' : 'bg-[#ec4899]'
                            }`}
                          >
                            {isFelipe ? 'F' : 'G'}
                          </div>
                          <span className="font-semibold text-[#0b1c30]">
                            {isFelipe ? 'Felipe' : 'Genivânia'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                        {item.data}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-[#0b1c30] block">
                            {item.estabelecimento || 'Diversos'}
                          </span>
                          {item.observacoes && (
                            <span className="text-[11px] text-[#565e74] truncate block max-w-xs">
                              {item.observacoes}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#006194] border border-[#dce9ff]">
                          {item.subcategoria || item.categoria || 'Geral'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#565e74]" />
                          <span>{item.formaPagamento || 'PIX'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-[#0b1c30] whitespace-nowrap">
                        - {formatBRL(item.valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#f8faff] border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#565e74] flex-wrap gap-2">
            <span>
              Exibindo {recentTransactions.length} lançamentos recentes de {relevantTransactions.length} de {selectedMonth}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateToTab('extrato')}
                className="text-[#006948] font-bold hover:underline"
              >
                Abrir Extrato Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
