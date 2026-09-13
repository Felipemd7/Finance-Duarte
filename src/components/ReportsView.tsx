import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Store,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Users,
  Car,
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Percent,
  Receipt,
  Info,
  ShoppingCart,
  Beef,
  Package,
} from 'lucide-react';
import { SupermarketAnalyticsView } from './SupermarketAnalyticsView.tsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  DashboardMetrics,
  Category,
  Subcategory,
  Transaction,
  Establishment,
  User,
  FinancialGoal,
} from '../types.ts';
import { formatBRL, formatDateBR, getMonthName } from '../utils/formatters.ts';

interface ReportsViewProps {
  metrics: DashboardMetrics | null;
  selectedMonth: string;
  categories: Category[];
  subcategories: Subcategory[];
  transactions: Transaction[];
  establishments: Establishment[];
  users: User[];
  goals: FinancialGoal[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  selectedMonth,
  categories,
  subcategories,
  transactions,
  establishments,
  users,
  goals,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Sub-tabs inside the reports view
  const [activeReportSection, setActiveReportSection] = useState<
    'visao_geral' | 'supermercado' | 'comparativo_meses' | 'subcategorias' | 'estabelecimentos' | 'membros' | 'pagamentos' | 'desvios' | 'maiores_despesas'
  >('visao_geral');

  // Filter & Search states
  const [subSearch, setSubSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'maior_gasto' | 'maior_desvio' | 'alfabetico'>('maior_gasto');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Safe checks
  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
        Calculando auditoria e relatórios completos de despesas...
      </div>
    );
  }

  const {
    totalReceitas,
    totalDespesas,
    saldo,
    totalExpectativa,
    porCategoria,
    porSubcategoria,
    principaisEstabelecimentos,
    evolucaoMeses,
    categoriasEstouradas,
  } = metrics;

  // 1. Metric calculations
  const diferencaOrcamento = totalExpectativa - totalDespesas;
  const isEstouradoGeral = totalDespesas > totalExpectativa;
  const diasNoPeriodo = selectedMonth === '2026-all' ? 243 : 31;
  const mediaDiaria = totalDespesas / diasNoPeriodo;
  const taxaPoupanca = (totalReceitas && totalReceitas > 0) ? Math.round((saldo / totalReceitas) * 100) : 0;

  // 2. Car Expenses deep-dive
  const carKeywords = ['combustível', 'rastreador', 'seguro', 'ipva', 'manutenção de carro', 'pedágio', 'estacionamento'];
  const carSubcategories = porSubcategoria.filter(s =>
    carKeywords.includes(s.subcategoriaNome.toLowerCase())
  );
  const totalCarroRealizado = carSubcategories.reduce((acc, curr) => acc + curr.total, 0);
  const totalCarroPlanejado = carSubcategories.reduce((acc, curr) => acc + curr.expectativa, 0);
  const percentualCarroNasDespesas = totalDespesas > 0 ? Math.round((totalCarroRealizado / totalDespesas) * 100) : 0;

  // 3. Transactions filtered for expense analysis
  const expenseTransactions = useMemo(() => {
    return transactions.filter(t => t.tipo === 'despesa');
  }, [transactions]);

  // 4. Breakdown by Couple Member (Felipe vs Genivânia)
  const memberBreakdown = useMemo(() => {
    const felipeId = 'usr-felipe';
    const genivaniaId = 'usr-genivania';

    let felipeTotal = 0;
    let genivaniaTotal = 0;
    let felipeCount = 0;
    let genivaniaCount = 0;

    expenseTransactions.forEach(tx => {
      if (tx.usuario_id === felipeId || tx.pagoPor === 'Felipe') {
        felipeTotal += tx.valor;
        felipeCount++;
      } else {
        genivaniaTotal += tx.valor;
        genivaniaCount++;
      }
    });

    const total = felipeTotal + genivaniaTotal || 1;
    return {
      felipe: {
        nome: 'Felipe Duarte',
        total: felipeTotal,
        count: felipeCount,
        percent: Math.round((felipeTotal / total) * 100),
      },
      genivania: {
        nome: 'Genivânia Duarte',
        total: genivaniaTotal,
        count: genivaniaCount,
        percent: Math.round((genivaniaTotal / total) * 100),
      },
    };
  }, [expenseTransactions]);

  // 5. Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; count: number }> = {
      cartao: { total: 0, count: 0 },
      debito: { total: 0, count: 0 },
      pix: { total: 0, count: 0 },
      dinheiro: { total: 0, count: 0 },
    };

    expenseTransactions.forEach(tx => {
      const method = tx.forma_pagamento || 'cartao';
      if (!counts[method]) counts[method] = { total: 0, count: 0 };
      counts[method].total += tx.valor;
      counts[method].count += 1;
    });

    const labels: Record<string, string> = {
      cartao: 'Cartão de Crédito',
      debito: 'Cartão de Débito',
      pix: 'PIX Direto',
      dinheiro: 'Dinheiro em Espécie',
    };

    return Object.entries(counts).map(([k, v]) => ({
      key: k,
      label: labels[k] || k,
      total: v.total,
      count: v.count,
      percent: totalDespesas > 0 ? Math.round((v.total / totalDespesas) * 100) : 0,
    }));
  }, [expenseTransactions, totalDespesas]);

  // 6. Top 10 Single Biggest Individual Expenses
  const topSingleExpenses = useMemo(() => {
    return [...expenseTransactions]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [expenseTransactions]);

  // 7. Filtered and Sorted Subcategories for the Audit Table
  const filteredSubcategories = useMemo(() => {
    return porSubcategoria
      .filter(s => {
        if (selectedCatFilter !== 'all' && s.categoriaNome !== selectedCatFilter) {
          return false;
        }
        if (subSearch.trim()) {
          const q = subSearch.toLowerCase();
          return (
            s.subcategoriaNome.toLowerCase().includes(q) ||
            s.categoriaNome.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'maior_gasto') return b.total - a.total;
        if (sortOrder === 'maior_desvio') return (b.total - b.expectativa) - (a.total - a.expectativa);
        return a.subcategoriaNome.localeCompare(b.subcategoriaNome);
      });
  }, [porSubcategoria, selectedCatFilter, subSearch, sortOrder]);

  // 8. Month-over-Month (MoM) Growth calculations for evolution chart
  const momCalculations = useMemo(() => {
    return evolucaoMeses.map((item, idx, arr) => {
      if (idx === 0) {
        return { ...item, variacaoMoM: 0 };
      }
      const prevTotal = arr[idx - 1].Total;
      const diff = item.Total - prevTotal;
      const pct = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : 0;
      return {
        ...item,
        variacaoMoM: pct,
      };
    });
  }, [evolucaoMeses]);

  // Top 10 subcategories for Bar chart
  const top10SubcategoriesData = useMemo(() => {
    return [...porSubcategoria]
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map(s => ({
        nome: s.subcategoriaNome,
        Gasto: s.total,
        Meta: s.expectativa,
      }));
  }, [porSubcategoria]);

  // Handle Export Full Detailed CSV
  const handleExportFullCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM for Excel in Portuguese
    csv += 'RELATORIO DETALHADO DE DESPESAS - CASAL DUARTE\n';
    csv += `Periodo: ${selectedMonth === '2026-all' ? 'Jan a Ago 2026' : getMonthName(selectedMonth)}\n`;
    csv += `Total de Despesas: ${formatBRL(totalDespesas)}\n`;
    csv += `Expectativa Planejada: ${formatBRL(totalExpectativa)}\n`;
    csv += `Saldo / Economia: ${formatBRL(saldo)}\n\n`;

    csv += 'SUBCATEGORIAS DE DESPESA\n';
    csv += 'Subcategoria;Categoria;Expectativa Planejada (R$);Realizado (R$);Diferenca (R$);Aderencia (%);Status\n';
    porSubcategoria.forEach(s => {
      const pct = s.expectativa > 0 ? Math.round((s.total / s.expectativa) * 100) : 0;
      const status = s.estourou ? 'Estourou' : pct > 85 ? 'Alerta' : 'Dentro da Meta';
      csv += `"${s.subcategoriaNome}";"${s.categoriaNome}";${s.expectativa.toFixed(2)};${s.total.toFixed(2)};${s.diferenca.toFixed(2)};${pct}%;"${status}"\n`;
    });

    csv += '\nESTABELECIMENTOS E LOJAS\n';
    csv += 'Estabelecimento;Tipo;Total Gasto (R$);Quantidade Transacoes;Ticket Medio (R$)\n';
    principaisEstabelecimentos.forEach(est => {
      const ticket = est.transacoesCount > 0 ? est.total / est.transacoesCount : 0;
      csv += `"${est.nome}";"${est.tipo}";${est.total.toFixed(2)};${est.transacoesCount};${ticket.toFixed(2)}\n`;
    });

    csv += '\nTRANSACOES INDIVIDUAIS\n';
    csv += 'Data;Estabelecimento;Subcategoria;Valor (R$);Forma Pagamento;Cadastrado Por;Observacoes\n';
    expenseTransactions.forEach(tx => {
      const sub = subcategories.find(s => s.id === tx.subcategoria_id)?.nome || '-';
      const est = establishments.find(e => e.id === tx.estabelecimento_id)?.nome || '-';
      const usr = users.find(u => u.id === tx.usuario_id)?.nome || '-';
      csv += `"${tx.data}";"${est}";"${sub}";${tx.valor.toFixed(2)};"${tx.forma_pagamento}";"${usr}";"${tx.observacoes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_despesas_completo_${selectedMonth}_casal_duarte.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Relatório Completo de Despesas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Casal Duarte
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Análise aprofundada de gastos, desvios orçamentários, hábitos de consumo e custos consolidados
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportFullCSV}
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition"
            title="Exportar todas as tabelas e transações em formato CSV compatível com Excel"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-600" />
            Exportar CSV Completo
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
            title="Imprimir relatório executivo para a reunião financeira do casal"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir Balanço
          </button>
        </div>
      </div>

      {/* Top 5 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Realizado vs Meta */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Despesas Realizadas
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {formatBRL(totalDespesas)}
          </div>
          <div className="text-[11px] font-medium mt-1 flex items-center">
            {isEstouradoGeral ? (
              <span className="text-rose-600 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{formatBRL(totalDespesas - totalExpectativa)} (+{totalExpectativa > 0 ? Math.round(((totalDespesas - totalExpectativa) / totalExpectativa) * 100) : 0}%)
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                Sob controle (-{formatBRL(diferencaOrcamento)})
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Expectativa Planejada */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Teto Planejado (Meta)
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {formatBRL(totalExpectativa)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Orçamento base previsto nas planilhas
          </p>
        </div>

        {/* Card 3: Custo Total do Carro */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Custos do Carro
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {formatBRL(totalCarroRealizado)}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            Representa {percentualCarroNasDespesas}% dos gastos totais
          </p>
        </div>

        {/* Card 4: Média Diária de Gasto */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Média de Gasto Diário
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {formatBRL(mediaDiaria)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Por dia no período selecionado
          </p>
        </div>

        {/* Card 5: Taxa de Poupança / Saldo */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Taxa de Poupança
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1.5">
            {taxaPoupanca}%
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Economia de {formatBRL(saldo)} no período
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs within Reports */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-slate-200 print:hidden">
        {[
          { id: 'visao_geral', label: 'Visão Geral & Gráficos', icon: BarChart3 },
          { id: 'supermercado', label: '🛒 Consumo de Todos os Itens', icon: Package },
          { id: 'comparativo_meses', label: '📈 Comparativo Mês a Mês', icon: TrendingUp },
          { id: 'subcategorias', label: 'Auditoria por Subcategoria', icon: Layers },
          { id: 'estabelecimentos', label: 'Por Estabelecimento & Loja', icon: Store },
          { id: 'membros', label: 'Divisão por Membro (Felipe vs Genivânia)', icon: Users },
          { id: 'pagamentos', label: 'Formas de Pagamento', icon: CreditCard },
          { id: 'desvios', label: 'Desvios & Estouros de Orçamento', icon: AlertTriangle },
          { id: 'maiores_despesas', label: 'Top 10 Maiores Despesas', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportSection(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: VISÃO GERAL & GRÁFICOS */}
      {activeReportSection === 'visao_geral' && (
        <div className="space-y-6">
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Top 8 Subcategorias de Despesas (Bar Chart) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Maiores Subcategorias de Despesa (Realizado vs Meta)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparativo das contas que mais demandam recursos no período
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10SubcategoriesData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="nome"
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [formatBRL(Number(val)), '']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Meta Planejada" />
                    <Bar dataKey="Gasto" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gasto Realizado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Distribuição por Grande Categoria (Invariável, Variável, Extra) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Composição das Despesas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fixas (Invariáveis) vs Variáveis vs Eventualidades
                  </p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porCategoria}
                        dataKey="total"
                        nameKey="categoriaNome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {porCategoria.map((entry, index) => (
                          <Cell key={`cat-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatBRL(Number(val)), '']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {porCategoria.map((c, idx) => {
                  const pct = totalDespesas > 0 ? Math.round((c.total / totalDespesas) * 100) : 0;
                  return (
                    <div key={c.categoriaId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-semibold text-slate-700">{c.categoriaNome}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatBRL(c.total)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Evolution Month-over-Month Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evolução Histórica das Despesas (Janeiro a Agosto de 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Acompanhamento da curva de gastos totais contra o orçamento previsto
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={momCalculations} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mesNome" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: any) => [formatBRL(Number(val)), '']}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="Expectativa"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                    name="Expectativa Orçada"
                  />
                  <Area
                    type="monotone"
                    dataKey="Total"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#expenseGradient)"
                    name="Despesa Total Realizada"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Jump Callout to Supermarket Analytics */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Relatório de Consumo de Todos os Itens & Mercado
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Auditoria completa de todos os produtos comprados (quantidades em kg, L, pacotes e unidades), preços médios e histórico mês a mês.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveReportSection('supermercado')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl whitespace-nowrap transition shadow-xs"
            >
              Abrir Relatório de Consumo ➔
            </button>
          </div>
        </div>
      )}

      {/* SECTION: CONSUMO DE TODOS OS ITENS & SUPERMERCADO */}
      {activeReportSection === 'supermercado' && (
        <SupermarketAnalyticsView selectedMonth={selectedMonth} defaultSubTab="todos_itens" />
      )}

      {/* SECTION: COMPARATIVO MÊS A MÊS */}
      {activeReportSection === 'comparativo_meses' && (
        <SupermarketAnalyticsView selectedMonth={selectedMonth} defaultSubTab="comparativo_itens" />
      )}

      {/* SECTION 2: AUDITORIA DETALHADA POR SUBCATEGORIA */}
      {activeReportSection === 'subcategorias' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Auditoria Completa por Subcategoria
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento detalhado de despesas orçadas vs reais com desvios e percentual de aderência
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar subcategoria..."
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedCatFilter}
                onChange={e => setSelectedCatFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Invariável">Invariável (Fixas)</option>
                <option value="Variável">Variável</option>
                <option value="Extra">Extra / Eventualidades</option>
              </select>

              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="maior_gasto">Maior Gasto</option>
                <option value="maior_desvio">Maior Desvio (Estouro)</option>
                <option value="alfabetico">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Subcategoria</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Planejado (Meta)</th>
                  <th className="py-2.5 px-3 text-right">Realizado (Gasto)</th>
                  <th className="py-2.5 px-3 text-right">Diferença</th>
                  <th className="py-2.5 px-3 text-center w-36">% Aderência</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubcategories.map(sub => {
                  const percent = sub.expectativa > 0 ? (sub.total / sub.expectativa) * 100 : 0;
                  const isOver = sub.estourou;
                  return (
                    <tr key={sub.subcategoriaId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {sub.subcategoriaNome}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {sub.categoriaNome}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {formatBRL(sub.expectativa)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatBRL(sub.total)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">
                        {sub.diferenca < 0 ? (
                          <span className="text-rose-600">
                            -{formatBRL(Math.abs(sub.diferenca))}
                          </span>
                        ) : (
                          <span className="text-emerald-600">
                            +{formatBRL(sub.diferenca)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-500'
                                : percent > 85
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                          {Math.round(percent)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                            Estourou (+{Math.round(percent - 100)}%)
                          </span>
                        ) : percent > 85 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                            No Limite
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            Dentro da Meta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: DESPESAS POR ESTABELECIMENTO E LOJA */}
      {activeReportSection === 'estabelecimentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Despesas por Estabelecimentos e Lojas
            </h2>
            <p className="text-xs text-slate-500">
              Onde o Casal Duarte mais gasta, quantidade de compras efetuadas e ticket médio
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Posição</th>
                  <th className="py-2.5 px-3">Estabelecimento / Loja</th>
                  <th className="py-2.5 px-3">Ramo / Tipo</th>
                  <th className="py-2.5 px-3 text-center">Transações</th>
                  <th className="py-2.5 px-3 text-right">Ticket Médio</th>
                  <th className="py-2.5 px-3 text-right">Total Gasto</th>
                  <th className="py-2.5 px-3 text-center">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {principaisEstabelecimentos.map((est, idx) => {
                  const ticket = est.transacoesCount > 0 ? est.total / est.transacoesCount : 0;
                  const pct = totalDespesas > 0 ? Math.round((est.total / totalDespesas) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {est.nome}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {est.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {est.transacoesCount} compras
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {formatBRL(ticket)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatBRL(est.total)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: DIVISÃO POR MEMBRO (FELIPE VS GENIVÂNIA) */}
      {activeReportSection === 'membros' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Felipe Duarte Card */}
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    F
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Felipe Duarte</h3>
                    <span className="text-xs text-slate-400">Despesas Registradas</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  {memberBreakdown.felipe.percent}% dos gastos
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Gasto</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatBRL(memberBreakdown.felipe.total)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Lançamentos</span>
                  <span className="text-sm font-bold text-slate-700">
                    {memberBreakdown.felipe.count} transações
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${memberBreakdown.felipe.percent}%` }}
                />
              </div>
            </div>

            {/* Genivânia Duarte Card */}
            <div className="bg-white p-5 rounded-2xl border border-pink-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Genivânia Duarte</h3>
                    <span className="text-xs text-slate-400">Despesas Registradas</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700">
                  {memberBreakdown.genivania.percent}% dos gastos
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Gasto</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatBRL(memberBreakdown.genivania.total)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Lançamentos</span>
                  <span className="text-sm font-bold text-slate-700">
                    {memberBreakdown.genivania.count} transações
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-pink-600 h-full rounded-full"
                  style={{ width: `${memberBreakdown.genivania.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Ambos os cônjuges compartilham os dados em tempo real no app. Despesas de supermercado, farmácia e carro são rateadas conforme a renda combinada do casal.
            </span>
          </div>
        </div>
      )}

      {/* SECTION 5: FORMAS DE PAGAMENTO */}
      {activeReportSection === 'pagamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Despesas por Forma de Pagamento
            </h2>
            <p className="text-xs text-slate-500">
              Concentração de gastos em Cartão de Crédito, Débito, PIX e Dinheiro
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentBreakdown.map(p => (
              <div key={p.key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">{p.label}</span>
                <span className="text-xl font-black text-slate-900 block mt-1">
                  {formatBRL(p.total)}
                </span>
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-200">
                  <span>{p.count} transações</span>
                  <span className="font-bold text-slate-700">{p.percent}% do total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: DESVIOS & ESTOUROS DE ORÇAMENTO */}
      {activeReportSection === 'desvios' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-rose-600 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">
                Diagnóstico de Desvios & Contas Estouradas
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Subcategorias onde os gastos reais superaram o teto estipulado nas planilhas do Casal Duarte
            </p>
          </div>

          {categoriasEstouradas.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-emerald-800">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold text-sm">Parabéns ao Casal Duarte!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Nenhuma categoria estourou o orçamento no período selecionado. Todas as metas foram respeitadas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoriasEstouradas.map((cat, idx) => {
                const sub = porSubcategoria.find(s => s.subcategoriaNome === cat.nome);
                const percent = cat.limite > 0 ? Math.round((cat.gasto / cat.limite) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-rose-200 ring-1 ring-rose-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{cat.nome}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {sub?.categoriaNome || 'Despesa'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        +{Math.round(percent - 100)}% acima
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Teto Planejado</span>
                        <span className="font-semibold text-slate-700">{formatBRL(cat.limite)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gasto Real</span>
                        <span className="font-bold text-rose-600">{formatBRL(cat.gasto)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Excesso</span>
                        <span className="font-black text-rose-700">+{formatBRL(cat.excesso)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      💡 Recomendação: Para o próximo mês, revisar a meta de {cat.nome} ou ajustar os gastos discricionários para compensar o excesso de {formatBRL(cat.excesso)}.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: TOP 10 MAIORES DESPESAS INDIVIDUAIS */}
      {activeReportSection === 'maiores_despesas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Top 10 Maiores Despesas Pontuais do Período
            </h2>
            <p className="text-xs text-slate-500">
              Lançamentos individuais de maior valor registrados nas finanças do casal
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Estabelecimento / Loja</th>
                  <th className="py-2.5 px-3">Subcategoria</th>
                  <th className="py-2.5 px-3">Forma Pagto</th>
                  <th className="py-2.5 px-3">Membro</th>
                  <th className="py-2.5 px-3 text-right">Valor da Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topSingleExpenses.map((tx, idx) => {
                  const est = establishments.find(e => e.id === tx.estabelecimento_id)?.nome || '-';
                  const sub = subcategories.find(s => s.id === tx.subcategoria_id)?.nome || '-';
                  const usr = users.find(u => u.id === tx.usuario_id)?.nome || '-';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{formatDateBR(tx.data)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{est}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                          {sub}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-600">{tx.forma_pagamento}</td>
                      <td className="py-2.5 px-3 text-slate-500">{usr.split(' ')[0]}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600 text-sm">
                        {formatBRL(tx.valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT SHEET (Hidden on screen, optimized for print) */}
      <div
        ref={printRef}
        className="hidden print:block bg-white p-8 space-y-6 text-slate-900"
      >
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              CASAL DUARTE • RELATÓRIO MENSAL DE DESPESAS
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Felipe Duarte & Genivânia Duarte • Período: {selectedMonth === '2026-all' ? 'Janeiro a Agosto 2026' : getMonthName(selectedMonth)}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Print KPI row */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span className="text-slate-500 block">Orçamento Total</span>
            <span className="text-base font-bold">{formatBRL(totalExpectativa)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Expectativa Planejada</span>
            <span className="text-base font-bold">{formatBRL(totalExpectativa)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Despesas Realizadas</span>
            <span className="text-base font-bold text-rose-700">{formatBRL(totalDespesas)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Poupança do Casal</span>
            <span className="text-base font-bold text-emerald-700">{formatBRL(saldo)}</span>
          </div>
        </div>

        {/* Print Subcategory Table */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">
            Detalhamento Completo das Subcategorias
          </h2>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-800 text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-2">Subcategoria</th>
                <th className="p-2">Categoria</th>
                <th className="p-2 text-right">Planejado</th>
                <th className="p-2 text-right">Realizado</th>
                <th className="p-2 text-right">Diferença</th>
                <th className="p-2 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {porSubcategoria.map(s => (
                <tr key={s.subcategoriaId}>
                  <td className="p-2 font-semibold">{s.subcategoriaNome}</td>
                  <td className="p-2 text-slate-600">{s.categoriaNome}</td>
                  <td className="p-2 text-right">{formatBRL(s.expectativa)}</td>
                  <td className="p-2 text-right font-bold">{formatBRL(s.total)}</td>
                  <td className="p-2 text-right">
                    {s.diferenca < 0 ? `-${formatBRL(Math.abs(s.diferenca))}` : `+${formatBRL(s.diferenca)}`}
                  </td>
                  <td className="p-2 text-center">
                    {s.estourou ? 'Estourou' : 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
