import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Package,
  Beef,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  Calendar,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Utensils,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Download,
  Info,
  X,
  Eye,
  BarChart3,
  Store,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SupermarketAnalytics, ConsumedItemDetail, TrackedItemEvolution } from '../types.ts';
import { formatBRL } from '../utils/formatters.ts';

interface SupermarketAnalyticsViewProps {
  selectedMonth: string;
  defaultSubTab?: 'todos_itens' | 'categorias' | 'comparativo_itens' | 'despesas_gerais' | 'carnes';
}

export const SupermarketAnalyticsView: React.FC<SupermarketAnalyticsViewProps> = ({
  selectedMonth,
  defaultSubTab = 'todos_itens',
}) => {
  const [data, setData] = useState<SupermarketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'todos_itens' | 'categorias' | 'comparativo_itens' | 'despesas_gerais' | 'carnes'>(defaultSubTab);
  const [monthFilter, setMonthFilter] = useState<string>(selectedMonth);

  // Search, Category filter and Sorting for ALL ITEMS
  const [searchItem, setSearchItem] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'valor_desc' | 'valor_asc' | 'qtd_desc' | 'preco_desc' | 'freq_desc' | 'nome_asc'>('valor_desc');
  const [inspectedItem, setInspectedItem] = useState<ConsumedItemDetail | null>(null);

  // Month-to-Month comparison selected item key
  const [selectedTrackedItemKey, setSelectedTrackedItemKey] = useState<string>('arroz_branco_tipo_1_5kg');

  // Fetch data when monthFilter changes
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reports/supermarket-analytics?mes=${monthFilter}`);
        if (!res.ok) throw new Error('Falha ao carregar métricas de consumo de itens');
        const json = await res.json();
        if (isMounted) {
          setData(json);
          // Default selected tracked item to first item if not set or invalid
          if (json.todosItensConsumidos && json.todosItensConsumidos.length > 0) {
            const exists = json.todosItensConsumidos.find((i: ConsumedItemDetail) => i.id === selectedTrackedItemKey);
            if (!exists) {
              setSelectedTrackedItemKey(json.todosItensConsumidos[0].id);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar dados');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [monthFilter]);

  // Keep monthFilter in sync if parent selectedMonth changes
  useEffect(() => {
    setMonthFilter(selectedMonth);
  }, [selectedMonth]);

  // Tracked item for month-to-month tab
  const selectedTrackedItem = useMemo(() => {
    if (!data?.comparativoItensMesAMes || data.comparativoItensMesAMes.length === 0) return null;
    return (
      data.comparativoItensMesAMes.find(i => i.itemKey === selectedTrackedItemKey) ||
      data.comparativoItensMesAMes[0]
    );
  }, [data, selectedTrackedItemKey]);

  // Filter and sort ALL items
  const filteredAndSortedItems = useMemo(() => {
    if (!data?.todosItensConsumidos) return [];
    let items = [...data.todosItensConsumidos];

    // Filter by search
    if (searchItem.trim()) {
      const s = searchItem.toLowerCase().trim();
      items = items.filter(
        it =>
          it.nome.toLowerCase().includes(s) ||
          it.categoriaNome.toLowerCase().includes(s) ||
          it.estabelecimentos.some(e => e.toLowerCase().includes(s))
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      items = items.filter(it => it.categoriaKey === categoryFilter);
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'valor_desc':
          return b.valorTotal - a.valorTotal;
        case 'valor_asc':
          return a.valorTotal - b.valorTotal;
        case 'qtd_desc':
          return b.quantidadeTotal - a.quantidadeTotal;
        case 'preco_desc':
          return b.precoMedio - a.precoMedio;
        case 'freq_desc':
          return b.frequenciaCompras - a.frequenciaCompras;
        case 'nome_asc':
          return a.nome.localeCompare(b.nome);
        default:
          return b.valorTotal - a.valorTotal;
      }
    });

    return items;
  }, [data, searchItem, categoryFilter, sortBy]);

  // CSV Export function
  const handleExportCSV = () => {
    if (!data?.todosItensConsumidos) return;
    const headers = [
      'Produto',
      'Categoria',
      'Quantidade Total',
      'Unidade',
      'Preco Medio (R$)',
      'Gasto Total (R$)',
      'Frequencia de Compras',
      'Participacao no Total (%)',
      'Estabelecimentos',
      'Variacao Preco Jan-Ago (%)',
    ];

    const rows = data.todosItensConsumidos.map(it => [
      `"${it.nome.replace(/"/g, '""')}"`,
      `"${it.categoriaNome}"`,
      it.quantidadeTotal,
      `"${it.unidade}"`,
      it.precoMedio.toFixed(2),
      it.valorTotal.toFixed(2),
      it.frequenciaCompras,
      `${it.percentualDoTotal}%`,
      `"${it.estabelecimentos.join(', ')}"`,
      `${it.variacaoPrecoMoM}%`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_consumo_itens_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Calculando relatório de consumo de todos os itens...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error || 'Não foi possível carregar os dados de consumo de itens.'}</span>
        </div>
        <button
          onClick={() => setMonthFilter(monthFilter)}
          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { summary, todosItensConsumidos, categoriasConsumo, comparativoItensMesAMes, comparativoDespesasGerais, carnesAnalysis } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Package className="w-4 h-4" />
              <span>Auditoria Completa de Produtos • Casal Duarte</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Relatório de Consumo de Todos os Itens
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Auditoria de todos os produtos comprados: volume consumido em quilos (kg), litros (L), pacotes e unidades, gastos totais, preços médios unitários e evolução mês a mês.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Month Filter */}
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10 text-xs">
              <Calendar className="w-3.5 h-3.5 ml-2 text-emerald-400 mr-1.5" />
              <select
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden pr-2 cursor-pointer"
              >
                {data.availableMonths.map(m => (
                  <option key={m.mes} value={m.mes} className="text-slate-900">
                    {m.mesNome} / 2026
                  </option>
                ))}
                <option value="all" className="text-slate-900">
                  Ano Todo (Jan a Ago 2026)
                </option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition shadow-xs"
              title="Baixar planilha CSV com todos os itens consumidos"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Gasto Total no Mercado</span>
            <div className="text-xl font-black text-white mt-0.5">{formatBRL(summary.totalGastoSupermercado)}</div>
            <span className="text-[11px] text-emerald-400 font-medium">{summary.totalComprasCount} idas registradas</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-sky-300 block uppercase flex items-center">
              <Package className="w-3 h-3 mr-1 text-sky-400" /> Volume / Quantidade
            </span>
            <div className="text-xl font-black text-sky-300 mt-0.5">{summary.totalItensComprados}</div>
            <span className="text-[11px] text-slate-300 font-medium">unidades, kg, litros e pct</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-emerald-300 block uppercase flex items-center">
              <Layers className="w-3 h-3 mr-1 text-emerald-400" /> Produtos Distintos
            </span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{summary.totalProdutosDistintos || todosItensConsumidos.length}</div>
            <span className="text-[11px] text-slate-300 font-medium">itens diferentes no carrinho</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-amber-300 block uppercase">Ticket Médio / Compra</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">{formatBRL(summary.ticketMedio)}</div>
            <span className="text-[11px] text-slate-300 font-medium">por ida ao supermercado</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-rose-300 block uppercase">Maior Despesa Individual</span>
            <div className="text-sm font-black text-rose-300 mt-0.5 truncate" title={summary.maiorDespesaItem?.nome}>
              {summary.maiorDespesaItem?.nome || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-300 font-medium">{formatBRL(summary.maiorDespesaItem?.valor || 0)} no período</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'todos_itens', label: '📋 Todos os Itens Consumidos', count: `${todosItensConsumidos.length} produtos` },
          { id: 'categorias', label: '🛒 Categorias de Supermercado', count: `${categoriasConsumo.length} grupos` },
          { id: 'comparativo_itens', label: '📈 Comparativo Mês a Mês de Itens', count: `${comparativoItensMesAMes.length} itens` },
          { id: 'despesas_gerais', label: '📊 Despesas Gerais Mês a Mês', count: 'Jan a Ago' },
          { id: 'carnes', label: '🥩 Açougue & Carnes (kg)', count: `${summary.totalKgCarne} kg` },
        ].map(tab => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TODOS OS ITENS CONSUMIDOS (PRIMARY REPORT)                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'todos_itens' && (
        <div className="space-y-6">
          {/* Quick Inspector Modal / Card if an item is inspected */}
          {inspectedItem && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md relative">
              <button
                onClick={() => setInspectedItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: inspectedItem.categoriaCor + '30', color: inspectedItem.categoriaCor }}
                    >
                      {inspectedItem.categoriaNome}
                    </span>
                    <h3 className="text-lg font-black text-white">{inspectedItem.nome}</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    Volume Total: <strong className="text-white">{inspectedItem.quantidadeTotal} {inspectedItem.unidade}</strong> • Gasto Total: <strong className="text-emerald-400">{formatBRL(inspectedItem.valorTotal)}</strong> • Preço Médio: <strong className="text-amber-300">{formatBRL(inspectedItem.precoMedio)} / {inspectedItem.unidade}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                    <span>Comprado em:</span>
                    {inspectedItem.estabelecimentos.map(est => (
                      <span key={est} className="px-2 py-0.5 bg-white/10 rounded-md text-white font-medium">
                        {est}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-right">
                    <span className="text-[10px] font-bold text-slate-300 uppercase block">Variação de Preço (Jan a Ago)</span>
                    <span
                      className={`text-sm font-black flex items-center justify-end ${
                        inspectedItem.variacaoPrecoMoM > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {inspectedItem.variacaoPrecoMoM > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 mr-1" />
                      )}
                      {inspectedItem.variacaoPrecoMoM > 0 ? `+${inspectedItem.variacaoPrecoMoM}%` : `${inspectedItem.variacaoPrecoMoM}%`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTrackedItemKey(inspectedItem.id);
                      setActiveSubTab('comparativo_itens');
                    }}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    Ver Gráfico Mês a Mês ➔
                  </button>
                </div>
              </div>

              {/* Monthly breakdown mini-strip */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                {inspectedItem.historicoMeses.map(m => (
                  <div key={m.mes} className="bg-white/5 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block">{m.mesNome}</span>
                    <div className="text-xs font-bold text-white mt-0.5">{m.quantidade > 0 ? `${m.quantidade} ${inspectedItem.unidade}` : '-'}</div>
                    <div className="text-[10px] text-slate-300 mt-0.5">{m.precoMedio > 0 ? formatBRL(m.precoMedio) : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls: Search, Category Filter & Sorting */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar qualquer produto por nome ou categoria (ex: arroz, patinho, azeite, sabão)..."
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                {searchItem && (
                  <button
                    onClick={() => setSearchItem('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center space-x-2 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="valor_desc">Maior Gasto (R$)</option>
                  <option value="valor_asc">Menor Gasto (R$)</option>
                  <option value="qtd_desc">Maior Quantidade / Volume</option>
                  <option value="preco_desc">Maior Preço Médio</option>
                  <option value="freq_desc">Mais Frequente no Carrinho</option>
                  <option value="nome_asc">Nome (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Categorias:
              </span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todas ({todosItensConsumidos.length})
              </button>
              {categoriasConsumo.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
                    categoryFilter === cat.key
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                  <span>{cat.nome}</span>
                  <span className="text-[10px] opacity-75">({cat.itensCount})</span>
                </button>
              ))}
            </div>
          </div>

          {/* ALL CONSUMED ITEMS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Catálogo Completo de Itens Consumidos</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                    {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'itens'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clique em qualquer item para ver o histórico detalhado e evolução de preços
                </p>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Total acumulado listado: <strong className="text-slate-900 font-bold">{formatBRL(filteredAndSortedItems.reduce((s, i) => s + i.valorTotal, 0))}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Produto / Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Volume Consumido</th>
                    <th className="py-3 px-4 text-right">Preço Médio Unitário</th>
                    <th className="py-3 px-4 text-right">Total Gasto (R$)</th>
                    <th className="py-3 px-4 text-right">% do Mercado</th>
                    <th className="py-3 px-4 text-center">Variação Preço</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        inspectedItem?.id === item.id ? 'bg-emerald-50/60' : ''
                      }`}
                      onClick={() => setInspectedItem(item)}
                    >
                      <td className="py-3 px-4 text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center">
                          {item.nome}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <Store className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-xs">{item.estabelecimentos.join(', ')}</span>
                          <span>•</span>
                          <span>{item.frequenciaCompras}x comprado</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap inline-flex items-center space-x-1"
                          style={{
                            backgroundColor: item.categoriaCor + '15',
                            color: item.categoriaCor,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.categoriaCor }} />
                          <span>{item.categoriaNome}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-slate-800">
                        {item.quantidadeTotal} <span className="text-[11px] font-semibold text-slate-500">{item.unidade}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {formatBRL(item.precoMedio)} <span className="text-[10px] text-slate-400 font-normal">/{item.unidade}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-xs">
                        {formatBRL(item.valorTotal)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-600">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span>{item.percentualDoTotal}%</span>
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, item.percentualDoTotal * 7)}%`, backgroundColor: item.categoriaCor }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.variacaoPrecoMoM !== 0 ? (
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              item.variacaoPrecoMoM > 0
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.variacaoPrecoMoM > 0 ? (
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                            )}
                            {item.variacaoPrecoMoM > 0 ? `+${item.variacaoPrecoMoM}%` : `${item.variacaoPrecoMoM}%`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Estável</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTrackedItemKey(item.id);
                            setActiveSubTab('comparativo_itens');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 mx-auto"
                          title="Ver evolução histórica"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Evolução</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAndSortedItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        Nenhum produto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CONSUMO POR CATEGORIAS DE MERCADO                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'categorias' && (
        <div className="space-y-6">
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriasConsumo.map(cat => (
              <div key={cat.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                  <span className="truncate">{cat.nome}</span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.cor }}
                  />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {formatBRL(cat.total)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>Volume consumido:</span>
                  <span className="font-bold text-slate-800">{cat.quantidadeTotal} {cat.unidadePredominante}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Fatia do mercado:</span>
                  <span className="font-bold text-slate-700">{cat.percentual}% ({cat.itensCount} itens)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentual}%`, backgroundColor: cat.cor }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown chart & categories table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Comparativo de Gastos por Categoria de Supermercado
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Distribuição financeira entre departamentos no período selecionado
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoriasConsumo} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={val => `R$ ${val}`} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="nome" type="category" tickLine={false} tick={{ fill: '#334155', fontSize: 11 }} width={140} />
                    <Tooltip
                      formatter={(val: any) => [formatBRL(Number(val)), 'Total Gasto']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {categoriasConsumo.map(entry => (
                        <Cell key={entry.key} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Divisão Percentual
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Peso de cada setor no carrinho
                </p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriasConsumo}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoriasConsumo.map(entry => (
                          <Cell key={entry.key} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [formatBRL(Number(val)), 'Gasto']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
                {categoriasConsumo.slice(0, 4).map(c => (
                  <div key={c.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: c.cor }} />
                      {c.nome}
                    </span>
                    <span className="font-bold text-slate-900">{c.percentual}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: COMPARATIVO MÊS A MÊS DE ITENS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'comparativo_itens' && (
        <div className="space-y-6">
          {/* Tracked Item Selector Pills */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Selecione o produto para analisar o consumo e inflação mês a mês (Jan a Ago 2026):
            </label>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {comparativoItensMesAMes.map(item => {
                const isSelected = item.itemKey === selectedTrackedItemKey;
                return (
                  <button
                    key={item.itemKey}
                    onClick={() => setSelectedTrackedItemKey(item.itemKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{item.nome}</span>
                    {item.variacaoPrecoMoM !== 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                          item.variacaoPrecoMoM > 0
                            ? isSelected ? 'bg-rose-500 text-white' : 'text-rose-600 bg-rose-50'
                            : isSelected ? 'bg-emerald-500 text-white' : 'text-emerald-600 bg-emerald-50'
                        }`}
                      >
                        {item.variacaoPrecoMoM > 0 ? `+${item.variacaoPrecoMoM}%` : `${item.variacaoPrecoMoM}%`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Item Deep-Dive Card */}
          {selectedTrackedItem && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedTrackedItem.nome}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {selectedTrackedItem.categoria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Histórico de volume adquirido e preço unitário ({selectedTrackedItem.unidade}) de Janeiro a Agosto de 2026
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Variação Acumulada</span>
                    <span
                      className={`text-sm font-black flex items-center ${
                        selectedTrackedItem.variacaoPrecoMoM > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {selectedTrackedItem.variacaoPrecoMoM > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 mr-1" />
                      )}
                      {selectedTrackedItem.variacaoPrecoMoM > 0 ? `+${selectedTrackedItem.variacaoPrecoMoM}%` : `${selectedTrackedItem.variacaoPrecoMoM}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual Chart: Price per Unit and Quantity Purchased */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrackedItem.historico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mesNome" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="preco" orientation="left" tickLine={false} tick={{ fill: '#10b981', fontSize: 11 }} />
                    <YAxis yAxisId="qtd" orientation="right" tickLine={false} tick={{ fill: '#3b82f6', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        name === 'Preço Médio Unitário' ? formatBRL(Number(val)) : `${val} ${selectedTrackedItem.unidade}`,
                        name,
                      ]}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line
                      yAxisId="preco"
                      type="monotone"
                      dataKey="precoMedio"
                      name="Preço Médio Unitário"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                    />
                    <Line
                      yAxisId="qtd"
                      type="monotone"
                      dataKey="quantidade"
                      name={`Volume Comprado (${selectedTrackedItem.unidade})`}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly breakdown table */}
              <div className="mt-6 overflow-x-auto border-t border-slate-100 pt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Mês</th>
                      {selectedTrackedItem.historico.map(h => (
                        <th key={h.mes} className="py-2 px-3 text-right">{h.mesNome}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700">Volume ({selectedTrackedItem.unidade})</td>
                      {selectedTrackedItem.historico.map(h => (
                        <td key={h.mes} className="py-2.5 px-3 text-right font-black text-slate-900">
                          {h.quantidade > 0 ? `${h.quantidade} ${selectedTrackedItem.unidade}` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700">Preço Médio (R$)</td>
                      {selectedTrackedItem.historico.map(h => (
                        <td key={h.mes} className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                          {h.precoMedio > 0 ? formatBRL(h.precoMedio) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700">Gasto Total (R$)</td>
                      {selectedTrackedItem.historico.map(h => (
                        <td key={h.mes} className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {h.gastoTotal > 0 ? formatBRL(h.gastoTotal) : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: COMPARATIVO GERAL DE DESPESAS MÊS A MÊS                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'despesas_gerais' && (
        <div className="space-y-6">
          {/* Main Month-to-Month stacked area / bar chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evolução das Despesas do Casal Duarte Mês a Mês
                </h3>
                <p className="text-xs text-slate-500">
                  Despesas Invariáveis (Fixas), Variáveis (Mercado, Combustível, Lazer) e Eventualidades vs Orçamento
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativoDespesasGerais} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mesNome" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickFormatter={val => `R$ ${val}`} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any, name: string) => [formatBRL(Number(val)), name]}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="invariavel" stackId="a" fill="#0284c7" name="Invariáveis (Fixas)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="variavel" stackId="a" fill="#f59e0b" name="Variáveis (Mercado, Lazer)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="eventualidades" stackId="a" fill="#ef4444" name="Eventualidades" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="expectativa" name="Orçamento Planejado" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-to-Month Full Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Matriz Comparativa de Despesas (Jan a Ago 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Detalhamento mensal com variação percentual mês a mês (MoM) e taxa de poupança
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Mês</th>
                    <th className="py-3 px-4 text-right">Receitas</th>
                    <th className="py-3 px-4 text-right">Invariáveis</th>
                    <th className="py-3 px-4 text-right">Variáveis</th>
                    <th className="py-3 px-4 text-right">Eventualidades</th>
                    <th className="py-3 px-4 text-right">Total Despesas</th>
                    <th className="py-3 px-4 text-right">Variação MoM</th>
                    <th className="py-3 px-4 text-right">Saldo Poupança</th>
                    <th className="py-3 px-4 text-right">Taxa Poupança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparativoDespesasGerais.map((m, idx) => (
                    <tr key={m.mes} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-black text-slate-900">
                        {m.mesNome} / 2026
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">
                        {formatBRL(m.receitas)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-sky-700">
                        {formatBRL(m.invariavel)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">
                        {formatBRL(m.variavel)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-700">
                        {formatBRL(m.eventualidades)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatBRL(m.despesas)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {idx > 0 ? (
                          <span
                            className={`inline-flex items-center text-[11px] font-bold ${
                              m.variacaoMoMPct > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {m.variacaoMoMPct > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            {m.variacaoMoMPct > 0 ? `+${m.variacaoMoMPct}%` : `${m.variacaoMoMPct}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        {formatBRL(m.saldoPoupanca)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-700">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${
                            m.taxaPoupanca >= 30
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.taxaPoupanca >= 20
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.taxaPoupanca}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: CONSUMO DE CARNES & AÇOUGUE (DETALHE POR CORTE)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'carnes' && (
        <div className="space-y-6">
          {/* Meat KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Consumo Total em Quilos</span>
                <Scale className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {summary.totalKgCarne} <span className="text-base font-semibold text-slate-500">kg</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Média semanal estimada:</span>
                <span className="font-bold text-slate-700">~{Math.round((summary.totalKgCarne / 4) * 10) / 10} kg / semana</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Gasto Total em Carnes</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {formatBRL(summary.totalGastoCarne)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Fatia do orçamento do mercado:</span>
                <span className="font-bold text-rose-600">{summary.percentualCarne}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Preço Médio por Kg</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {formatBRL(summary.precoMedioKgCarne)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Considera cortes nobres e dia a dia:</span>
                <span className="font-bold text-slate-700">{carnesAnalysis.cortesMaisConsumidos.length} cortes</span>
              </div>
            </div>
          </div>

          {/* Evolution Chart & Animal Types */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Evolução do Consumo de Carnes Mês a Mês (kg e R$)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhamento histórico da quantidade de carne adquirida vs valor gasto
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={carnesAnalysis.evolucaoCarneMeses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mesNome" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="kg" orientation="left" tickLine={false} tick={{ fill: '#ef4444', fontSize: 11 }} />
                    <YAxis yAxisId="reais" orientation="right" tickLine={false} tick={{ fill: '#10b981', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        name === 'Quilos (kg)' ? `${val} kg` : formatBRL(Number(val)),
                        name,
                      ]}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="kg" dataKey="kgCarne" fill="#ef4444" name="Quilos (kg)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="reais" dataKey="gastoCarne" fill="#10b981" name="Gasto Total (R$)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Animal Type Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Distribuição por Tipo de Carne
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Bovina, Frango/Aves e Cortes Suínos
                </p>

                <div className="space-y-4">
                  {carnesAnalysis.consumoPorTipoAnimal.map(t => (
                    <div key={t.tipo} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center">
                          <span
                            className="w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: t.cor }}
                          />
                          {t.tipo}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{t.kg} kg</span>
                          <span className="text-slate-400 ml-1.5">({t.percentual}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${t.percentual}%`, backgroundColor: t.cor }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Total Gasto:</span>
                        <span className="font-semibold text-slate-700">{formatBRL(t.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mt-4 flex items-start space-x-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  As carnes bovinas representam a maior fatia do investimento, com destaque para o patinho moído nas refeições diárias e cortes nobres aos fins de semana.
                </p>
              </div>
            </div>
          </div>

          {/* Meat Cuts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Detalhamento de Cortes Comprados
                </h3>
                <p className="text-xs text-slate-500">
                  Ranking dos cortes de açougue por valor total e quilos consumidos no período
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg">
                {carnesAnalysis.cortesMaisConsumidos.length} cortes registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Corte de Açougue</th>
                    <th className="py-3 px-4">Classificação</th>
                    <th className="py-3 px-4 text-right">Volume (Kg)</th>
                    <th className="py-3 px-4 text-right">Preço Médio / Kg</th>
                    <th className="py-3 px-4 text-right">Total Gasto</th>
                    <th className="py-3 px-4 text-right">% do Açougue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carnesAnalysis.cortesMaisConsumidos.map((c, idx) => (
                    <tr key={c.corte} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center">
                        <span className="w-5 text-slate-400 font-normal mr-2">#{idx + 1}</span>
                        {c.corte}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            c.tipoAnimal === 'Bovina'
                              ? 'bg-rose-50 text-rose-700'
                              : c.tipoAnimal === 'Aves'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {c.tipoAnimal}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-800">
                        {c.kgTotal} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {formatBRL(c.precoMedioKg)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatBRL(c.valorTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">
                        {c.percentualDosCortes}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
