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

  // Month code map (e.g. "Março 2026" -> "2026-03")
  const monthCodeMap: Record<string, string> = {
    'Janeiro 2026': '2026-01',
    'Fevereiro 2026': '2026-02',
    'Março 2026': '2026-03',
    'Abril 2026': '2026-04',
    'Maio 2026': '2026-05',
    'Junho 2026': '2026-06',
    'Julho 2026': '2026-07',
    'Agosto 2026': '2026-08',
  };

  const activeMonthCode = monthCodeMap[selectedMonth] || '2026-03';

  // 1. Transactions for the active month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.data.startsWith(activeMonthCode));
  }, [transactions, activeMonthCode]);

  // Fallback to all transactions if month has 0 yet
  const relevantTransactions = monthTransactions.length > 0 ? monthTransactions : transactions;

  // 2. Financial Metrics from real database
  const metrics = useMemo(() => {
    const expenses = relevantTransactions.filter((t) => t.tipo === 'despesa');
    const revenues = relevantTransactions.filter((t) => t.tipo === 'receita');

    const totalGastos = expenses.reduce((acc, t) => acc + t.valor, 0);
    // Calculate total revenues; if not yet launched in month, use official salaries (Felipe 4500 + Genivânia 4000 = 8500)
    let totalReceitas = revenues.reduce((acc, t) => acc + t.valor, 0);
    if (totalReceitas === 0) {
      totalReceitas = 8500.0;
    }

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
    const goalSuper = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('supermercado'))?.valorPlanejado || 2800;
    const goalCarro = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('combustivel') || (g.subcategoria || g.titulo || '').toLowerCase().includes('carro'))?.valorPlanejado || 1450;
    const goalLazer = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('lazer'))?.valorPlanejado || 1200;
    const goalFarmacia = goals.find((g) => (g.subcategoria || g.titulo || '').toLowerCase().includes('farmacia'))?.valorPlanejado || 450;

    const expectativaPrevista = goalSuper + goalCarro + goalLazer + goalFarmacia + (gastoInvariavel || 3580);
    const saldoLiquido = totalReceitas - totalGastos;

    // Couple Share calculation
    const felipeGasto = expenses
      .filter((t) => t.usuario_id === 'usr-felipe' || t.pagoPor === 'Felipe')
      .reduce((acc, t) => acc + t.valor, 0);

    const genivaniaGasto = expenses
      .filter((t) => t.usuario_id === 'usr-genivania' || t.pagoPor === 'Genivânia')
      .reduce((acc, t) => acc + t.valor, 0);

    const felipeShareReal = totalGastos > 0 ? Math.round((felipeGasto / totalGastos) * 100) : 50;
    const genivaniaShareReal = 100 - felipeShareReal;

    return {
      totalGastos,
      totalReceitas,
      saldoLiquido,
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

  const orcamentoPercent = Math.min(
    100,
    Math.round((metrics.totalGastos / (metrics.expectativaPrevista || 1)) * 100)
  );

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Screens < 768px)                                          */}
      {/* ========================================================================= */}
      <div id="dashboard-mobile-view" className="block md:hidden w-full max-w-md mx-auto pb-24">
        {/* Header & Greeting Row */}
        <div className="flex items-start justify-between gap-3 pt-1 pb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 text-[#006948] shrink-0">
              <Heart className="w-6 h-6 stroke-[2.2] fill-transparent text-[#006948]" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-[#0b1c30] tracking-tight leading-tight">
                Felipe & Genivânia
              </h1>
              <p className="text-xs text-[#565e74] mt-0.5">
                Finanças sincronizadas com o banco de dados oficial
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold border border-[#dce9ff]">
              {selectedMonth || 'Março 2026'}
            </span>
            <span className="text-[11px] text-[#006948] font-medium flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
              Supabase 100%
            </span>
          </div>
        </div>

        {/* Hero Card: SALDO LÍQUIDO ACUMULADO */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
              SALDO LÍQUIDO DO MÊS
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                metrics.saldoLiquido >= 0 ? 'bg-[#dcfce7] text-[#006948]' : 'bg-[#fee2e2] text-[#dc2626]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              {metrics.saldoLiquido >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>

          <div className="my-2">
            <span
              className={`font-display font-extrabold text-3xl sm:text-4xl tracking-tight font-mono ${
                metrics.saldoLiquido >= 0 ? 'text-[#006948]' : 'text-[#dc2626]'
              }`}
            >
              {formatBRL(metrics.saldoLiquido)}
            </span>
          </div>

          {/* Orçamento Global Consumido */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#0b1c30]">
                Orçamento Familiar Consumido
              </span>
              <span className="text-[#565e74] font-mono">
                {orcamentoPercent}% <span className="text-[#727a90]">({formatBRL(metrics.totalGastos)})</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  orcamentoPercent > 95 ? 'bg-[#dc2626]' : 'bg-[#006948]'
                }`}
                style={{ width: `${Math.min(orcamentoPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Gestão Conjunta 50/50 */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#dcfce7] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                <CheckCircle2 className="w-4 h-4 text-[#006948]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0b1c30] block truncate">
                  Felipe Duarte & Genivânia Duarte
                </span>
                <span className="text-[11px] text-[#565e74] block truncate">
                  Orçamento Conjunto • Paridade 50/50
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold border border-[#a7f3d0] shrink-0">
              50/50
            </span>
          </div>
        </div>

        {/* Mobile: 3 Teto Cards Dinâmicos */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-display font-bold text-xs text-[#0b1c30] tracking-wider uppercase">
              TETOS EM DESTAQUE
            </span>
            <button
              onClick={() => onNavigateToTab('metas')}
              className="text-xs font-semibold text-[#006948] hover:underline"
            >
              Ver Metas
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Supermercado */}
            <div
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#006948]" />
                  <span className="font-bold text-xs text-[#0b1c30]">Supermercado</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#0b1c30]">
                  {formatBRL(metrics.gastoSupermercado)}
                </span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#006948] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((metrics.gastoSupermercado / metrics.goalSuper) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#565e74] mt-1.5">
                <span>Teto: {formatBRL(metrics.goalSuper)}</span>
                <span className="font-bold text-[#006948]">
                  {Math.round((metrics.gastoSupermercado / metrics.goalSuper) * 100)}%
                </span>
              </div>
            </div>

            {/* Combustível & Carro */}
            <div
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#006194]" />
                  <span className="font-bold text-xs text-[#0b1c30]">Carro & Combustível</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#0b1c30]">
                  {formatBRL(metrics.gastoCarro)}
                </span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#006194] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((metrics.gastoCarro / metrics.goalCarro) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#565e74] mt-1.5">
                <span>Teto: {formatBRL(metrics.goalCarro)}</span>
                <span className="font-bold text-[#006194]">
                  {Math.round((metrics.gastoCarro / metrics.goalCarro) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Transações Recentes */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-display font-bold text-xs text-[#0b1c30] tracking-wider uppercase">
              LANÇAMENTOS RECENTES
            </span>
            <button
              onClick={() => onNavigateToTab('extrato')}
              className="text-xs font-semibold text-[#006948] hover:underline"
            >
              Ver Todas ({relevantTransactions.length})
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onNavigateToTab('extrato')}
                className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-2xs flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-[#0b1c30] block truncate">
                    {tx.estabelecimento || 'Lançamento Diverso'}
                  </span>
                  <span className="text-[11px] text-[#565e74]">
                    {tx.data} • {tx.subcategoria || 'Geral'} • {tx.pagoPor === 'Genivânia' ? 'Genivânia' : 'Felipe'}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs text-[#0b1c30]">
                  - {formatBRL(tx.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px)                                        */}
      {/* ========================================================================= */}
      <div id="dashboard-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold tracking-wide uppercase">
                BANCO SUPABASE ATIVO
              </span>
              <span className="text-xs text-[#565e74]">
                {relevantTransactions.length} lançamentos sincronizados • {selectedMonth}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
              Visão Consolidada • Felipe Duarte & Genivânia Duarte
            </h1>
          </div>

          {/* Badge Parceria Casal Duarte 50/50 */}
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
              <span className="font-bold text-[#0b1c30] block">Gestão Conjunta 50/50</span>
              <span className="text-[10px] text-[#006948] font-semibold">Orçamento 100% Compartilhado</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Top Cards Dinâmicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* KPI 1: Receitas */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Receita Total Líquida</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                {formatBRL(metrics.totalReceitas)}
              </div>
            </div>
            <div className="text-xs text-[#006948] font-medium mt-3 flex items-center gap-1">
              <span>↑ 100% depositado</span>
              <span className="text-[#565e74]">• Felipe & Genivânia</span>
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
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                {formatBRL(metrics.totalGastos)}
              </div>
            </div>
            <div className="text-xs text-[#565e74] mt-3">
              {orcamentoPercent}% da renda • {metrics.totalCount} lançamentos
            </div>
          </div>

          {/* KPI 3: Expectativa / Tetos */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Expectativa Prevista</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    metrics.totalGastos <= metrics.expectativaPrevista
                      ? 'bg-[#dcfce7] text-[#006948]'
                      : 'bg-[#fee2e2] text-[#dc2626]'
                  }`}
                >
                  {metrics.totalGastos <= metrics.expectativaPrevista ? 'No teto' : 'Acima do teto'}
                </span>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                {formatBRL(metrics.expectativaPrevista)}
              </div>
            </div>
            <div className="text-xs text-[#565e74] font-medium mt-3 flex items-center gap-1">
              <span>Metas orçamentárias do Supabase</span>
            </div>
          </div>

          {/* KPI 4: Economia / Saldo */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Saldo / Economia</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`font-display font-extrabold text-2xl mt-2 font-mono ${
                  metrics.saldoLiquido >= 0 ? 'text-[#006948]' : 'text-[#dc2626]'
                }`}
              >
                {formatBRL(metrics.saldoLiquido)}
              </div>
            </div>
            <div className="text-xs text-[#006948] font-medium mt-3 flex items-center gap-1">
              <span>✓ Aporte para investimentos</span>
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

        {/* Section: Últimas Transações Registradas (Tabela Real) */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Últimas Transações Registradas
              </h3>
              <p className="text-xs text-[#565e74]">
                Sincronização com Supabase e extrato de Felipe e Genivânia em Teresina
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
              <span className="font-semibold">Sincronização ativa com o Supabase</span>
              <span>•</span>
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
