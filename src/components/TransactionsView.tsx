import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ShoppingCart,
  Fuel,
  Building2,
  Car,
  Pill,
  Utensils,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Tag,
  X,
  FileSpreadsheet,
  Check,
  CreditCard,
  Percent,
  Layers,
  Wrench,
  DollarSign,
  Trash2,
  Calendar,
  User as UserIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Edit3,
} from 'lucide-react';
import { Transaction, Receipt, SpreadsheetRow } from '../types';
import { formatBRL } from '../utils/formatters';
import { deleteTransactionFromCloud } from '../services/supabaseService';
import { MonthlyBudgetSpreadsheetPanel } from './MonthlyBudgetSpreadsheetPanel';
import { NewTransactionModal } from './NewTransactionModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  receipts: Receipt[];
  selectedMonth: string;
  onSelectMonth?: (month: string) => void;
  spreadsheets?: SpreadsheetRow[];
  onOpenNewTx: () => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  receipts,
  selectedMonth,
  onSelectMonth,
  spreadsheets = [],
  onOpenNewTx,
  onUpdateTransaction,
  onDeleteTransaction,
  onViewReceipt,
}) => {
  // Navigation View Tab: 'extrato' (lista tradicional) ou 'planilha' (espelho da planilha e rateio 50/50)
  const [viewTab, setViewTab] = useState<'extrato' | 'planilha'>('extrato');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('todos');
  const [filterMonthMode, setFilterMonthMode] = useState<'selected' | 'all'>('selected');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [visibleCount, setVisibleCount] = useState(30);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get month code (e.g. "Março 2026" -> "2026-03")
  const getMonthCode = (mesNome: string) => {
    const map: Record<string, string> = {
      'Janeiro 2026': '2026-01',
      'Fevereiro 2026': '2026-02',
      'Março 2026': '2026-03',
      'Abril 2026': '2026-04',
      'Maio 2026': '2026-05',
      'Junho 2026': '2026-06',
      'Julho 2026': '2026-07',
      'Agosto 2026': '2026-08',
      'Setembro 2026': '2026-09',
      'Outubro 2026': '2026-10',
      'Novembro 2026': '2026-11',
      'Dezembro 2026': '2026-12',
    };
    return map[mesNome] || '';
  };

  const activeMonthCode = getMonthCode(selectedMonth);

  // Helper to assign icon and style based on subcategory
  const getCategoryMeta = (subcategoria: string = '', categoria: string = '') => {
    const s = subcategoria.toLowerCase();
    const c = categoria.toLowerCase();
    if (s.includes('supermercado') || s.includes('alimento') || s.includes('feira')) {
      return { icon: ShoppingCart, bg: 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]', label: 'Supermercado' };
    }
    if (s.includes('combustivel') || s.includes('combustível') || s.includes('gasolina') || s.includes('posto')) {
      return { icon: Fuel, bg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]', label: 'Combustível' };
    }
    if (s.includes('estacionamento') || s.includes('estac') || s.includes('pedagio') || s.includes('pedágio')) {
      return { icon: Car, bg: 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]', label: 'Estacionamento & Transporte' };
    }
    if (s.includes('aluguel') || s.includes('condominio') || s.includes('condomínio') || s.includes('moradia')) {
      return { icon: Building2, bg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]', label: 'Moradia' };
    }
    if (s.includes('carro') || s.includes('manuten') || s.includes('seguro') || s.includes('rastreador') || s.includes('ipva')) {
      return { icon: Car, bg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]', label: 'Carro' };
    }
    if (s.includes('farm') || s.includes('saude') || s.includes('saúde') || s.includes('medic') || s.includes('exame')) {
      return { icon: Pill, bg: 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]', label: 'Farmácia & Saúde' };
    }
    if (s.includes('lazer') || s.includes('restaurante') || s.includes('jantar')) {
      return { icon: Utensils, bg: 'bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]', label: 'Lazer' };
    }
    return { icon: Layers, bg: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]', label: subcategoria || 'Geral' };
  };

  // Filtered transactions derived directly from Supabase
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (filterMonthMode === 'selected' && activeMonthCode) {
        const txData = tx.data || '';
        const txMesRef = tx.mesReferencia || (tx as any).mes_ano || '';
        if (!txData.startsWith(activeMonthCode) && txMesRef !== activeMonthCode) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const est = (tx.estabelecimento || '').toLowerCase();
        const sub = (tx.subcategoria || '').toLowerCase();
        const cat = (tx.categoria || '').toLowerCase();
        const obs = (tx.observacoes || '').toLowerCase();
        const pag = (tx.pagoPor || '').toLowerCase();
        const val = Math.abs(tx.valor).toString();
        const formattedVal = formatBRL(tx.valor).toLowerCase();
        if (
          !est.includes(query) &&
          !sub.includes(query) &&
          !cat.includes(query) &&
          !obs.includes(query) &&
          !pag.includes(query) &&
          !val.includes(query) &&
          !formattedVal.includes(query)
        ) {
          return false;
        }
      }

      // Category chip filter
      if (selectedCategoryChip !== 'todos') {
        const sub = (tx.subcategoria || '').toLowerCase();
        const cat = (tx.categoria || '').toLowerCase();
        if (selectedCategoryChip === 'supermercado' && !sub.includes('supermercado') && !sub.includes('feira')) return false;
        if (selectedCategoryChip === 'combustivel' && !sub.includes('combustivel') && !sub.includes('combustível')) return false;
        if (selectedCategoryChip === 'carro' && !sub.includes('carro') && !sub.includes('manuten') && !sub.includes('seguro') && !sub.includes('rastreador')) return false;
        if (selectedCategoryChip === 'lazer' && !sub.includes('lazer') && !sub.includes('restaurante')) return false;
        if (selectedCategoryChip === 'moradia' && !sub.includes('aluguel') && !sub.includes('condominio') && !sub.includes('condomínio')) return false;
        if (selectedCategoryChip === 'farmacia' && !sub.includes('farm') && !sub.includes('saude') && !sub.includes('saúde')) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      }
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });
  }, [transactions, activeMonthCode, filterMonthMode, searchTerm, selectedCategoryChip, sortOrder]);

  // Counts for category chips
  const categoryCounts = useMemo(() => {
    const counts = {
      todos: 0,
      supermercado: 0,
      combustivel: 0,
      carro: 0,
      lazer: 0,
      moradia: 0,
      farmacia: 0,
    };
    transactions.forEach((tx) => {
      if (filterMonthMode === 'selected' && activeMonthCode && !tx.data.startsWith(activeMonthCode)) return;
      counts.todos++;
      const sub = (tx.subcategoria || '').toLowerCase();
      if (sub.includes('supermercado') || sub.includes('feira')) counts.supermercado++;
      if (sub.includes('combustivel') || sub.includes('combustível')) counts.combustivel++;
      if (sub.includes('carro') || sub.includes('manuten') || sub.includes('seguro') || sub.includes('rastreador')) counts.carro++;
      if (sub.includes('lazer') || sub.includes('restaurante')) counts.lazer++;
      if (sub.includes('aluguel') || sub.includes('condominio') || sub.includes('condomínio')) counts.moradia++;
      if (sub.includes('farm') || sub.includes('saude') || sub.includes('saúde')) counts.farmacia++;
    });
    return counts;
  }, [transactions, activeMonthCode, filterMonthMode]);

  // Métricas e Gráficos Analíticos de Despesas do Extrato
  const analyticsData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.tipo === 'despesa');
    const totalGasto = expenses.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const count = expenses.length;
    const ticketMedio = count > 0 ? totalGasto / count : 0;

    let totalVista = 0;
    let totalCartao = 0;

    const categoryMap: Record<
      string,
      { id: string; nome: string; valor: number; count: number; color: string; barBg: string; textColor: string; icon: any }
    > = {
      supermercado: {
        id: 'supermercado',
        nome: 'Supermercado & Alimentação',
        valor: 0,
        count: 0,
        color: '#10b981',
        barBg: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        icon: ShoppingCart,
      },
      combustivel: {
        id: 'combustivel',
        nome: 'Combustível & Posto',
        valor: 0,
        count: 0,
        color: '#3b82f6',
        barBg: 'bg-blue-500',
        textColor: 'text-blue-700',
        icon: Fuel,
      },
      moradia: {
        id: 'moradia',
        nome: 'Moradia (Aluguel, Luz & Contas)',
        valor: 0,
        count: 0,
        color: '#6366f1',
        barBg: 'bg-indigo-500',
        textColor: 'text-indigo-700',
        icon: Building2,
      },
      lazer: {
        id: 'lazer',
        nome: 'Lazer & Restaurantes',
        valor: 0,
        count: 0,
        color: '#f59e0b',
        barBg: 'bg-amber-500',
        textColor: 'text-amber-700',
        icon: Utensils,
      },
      carro: {
        id: 'carro',
        nome: 'Veículo (Compass, Rastreador & Seguro)',
        valor: 0,
        count: 0,
        color: '#06b6d4',
        barBg: 'bg-cyan-500',
        textColor: 'text-cyan-700',
        icon: Car,
      },
      farmacia: {
        id: 'farmacia',
        nome: 'Farmácia & Saúde',
        valor: 0,
        count: 0,
        color: '#f43f5e',
        barBg: 'bg-rose-500',
        textColor: 'text-rose-700',
        icon: Pill,
      },
      outros: {
        id: 'outros',
        nome: 'Eventualidades & Outros',
        valor: 0,
        count: 0,
        color: '#64748b',
        barBg: 'bg-slate-500',
        textColor: 'text-slate-700',
        icon: Layers,
      },
    };

    expenses.forEach((t) => {
      const val = Number(t.valor) || 0;
      const sub = (t.subcategoria || '').toLowerCase();
      const est = (t.estabelecimento || '').toLowerCase();
      const forma = (t.formaPagamento || '').toLowerCase();
      const obs = (t.observacoes || '').toLowerCase();

      const isCredit =
        forma.includes('credito') ||
        forma.includes('crédito') ||
        (forma.includes('cartao') && !forma.includes('debito')) ||
        obs.includes('crédito') ||
        obs.includes('credito');

      if (isCredit) {
        totalCartao += val;
      } else {
        totalVista += val;
      }

      if (
        sub.includes('supermercado') ||
        sub.includes('feira') ||
        sub.includes('alimento') ||
        est.includes('mateus') ||
        est.includes('atacadão') ||
        est.includes('atacadao') ||
        est.includes('ifood') ||
        est.includes('ferreira')
      ) {
        categoryMap.supermercado.valor += val;
        categoryMap.supermercado.count++;
      } else if (
        sub.includes('combustivel') ||
        sub.includes('combustível') ||
        sub.includes('gasolina') ||
        est.includes('posto') ||
        est.includes('cacique') ||
        est.includes('shell') ||
        est.includes('ipiranga')
      ) {
        categoryMap.combustivel.valor += val;
        categoryMap.combustivel.count++;
      } else if (
        sub.includes('aluguel') ||
        sub.includes('condominio') ||
        sub.includes('condomínio') ||
        sub.includes('luz') ||
        sub.includes('água') ||
        sub.includes('agua') ||
        sub.includes('internet') ||
        sub.includes('gás') ||
        sub.includes('gas') ||
        sub.includes('solar')
      ) {
        categoryMap.moradia.valor += val;
        categoryMap.moradia.count++;
      } else if (
        sub.includes('lazer') ||
        sub.includes('restaurante') ||
        sub.includes('spoleto') ||
        sub.includes('pizza') ||
        sub.includes('bar') ||
        sub.includes('cinema')
      ) {
        categoryMap.lazer.valor += val;
        categoryMap.lazer.count++;
      } else if (
        sub.includes('carro') ||
        sub.includes('manuten') ||
        sub.includes('rastreador') ||
        sub.includes('seguro')
      ) {
        categoryMap.carro.valor += val;
        categoryMap.carro.count++;
      } else if (
        sub.includes('farm') ||
        sub.includes('saude') ||
        sub.includes('saúde') ||
        sub.includes('medic') ||
        sub.includes('droga')
      ) {
        categoryMap.farmacia.valor += val;
        categoryMap.farmacia.count++;
      } else {
        categoryMap.outros.valor += val;
        categoryMap.outros.count++;
      }
    });

    const categoryList = Object.values(categoryMap).sort((a, b) => b.valor - a.valor);
    const topCategory = categoryList[0] || null;

    const felipeGasto = expenses
      .filter((t) => t.usuario_id === 'usr-felipe' || t.pagoPor === 'Felipe')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const genivaniaGasto = expenses
      .filter((t) => t.usuario_id === 'usr-genivania' || t.pagoPor === 'Genivânia')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const felipePct = totalGasto > 0 ? Math.round((felipeGasto / totalGasto) * 100) : 50;
    const genivaniaPct = 100 - felipePct;
    const diffRateio = Math.abs(felipeGasto - genivaniaGasto) / 2;
    const devedor = felipeGasto > genivaniaGasto ? 'Genivânia' : 'Felipe';
    const credor = felipeGasto > genivaniaGasto ? 'Felipe' : 'Genivânia';

    const incomes = filteredTransactions.filter((t) => t.tipo === 'receita');
    const totalEntradas = incomes.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const saldoLiquido = totalEntradas > 0 ? totalEntradas - totalGasto : -totalGasto;

    return {
      totalGasto,
      count,
      ticketMedio,
      totalVista,
      totalCartao,
      categoryList,
      topCategory,
      felipeGasto,
      genivaniaGasto,
      felipePct,
      genivaniaPct,
      diffRateio,
      devedor,
      credor,
      totalEntradas,
      saldoLiquido,
    };
  }, [filteredTransactions]);

  const handleDelete = async (tx: Transaction) => {
    if (!window.confirm(`Tem certeza que deseja excluir o lançamento de ${formatBRL(tx.valor)} em ${tx.estabelecimento}?`)) {
      return;
    }
    setIsDeleting(true);
    const success = await deleteTransactionFromCloud(tx.id);
    setIsDeleting(false);
    if (success) {
      onDeleteTransaction(tx.id);
      setSelectedTransactionDetail(null);
      showToast('Lançamento removido com sucesso.');
    } else {
      showToast('Erro ao remover lançamento. Tente novamente.');
    }
  };

  const paginatedList = filteredTransactions.slice(0, visibleCount);

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-transacoes"
          className="fixed top-20 inset-x-4 max-w-sm mx-auto z-50 bg-[#0b1c30] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-top-4"
        >
          <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation View Mode: Extrato Detalhado vs Planilha & Divisão 50/50 */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#e5eeff] shadow-xs mb-5 flex-wrap">
        <button
          onClick={() => setViewTab('extrato')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'extrato'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'text-[#565e74] hover:text-[#0b1c30] hover:bg-[#f8faff]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Extrato de Lançamentos ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setViewTab('planilha')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            viewTab === 'planilha'
              ? 'bg-[#0b1c30] text-white shadow-xs'
              : 'text-[#565e74] hover:text-[#0b1c30] hover:bg-[#f8faff]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Planilha de Fechamento & Divisão 50/50</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
            viewTab === 'planilha' ? 'bg-white/20 text-white' : 'bg-[#006948]/15 text-[#006948]'
          }`}>
            OFICIAL
          </span>
        </button>
      </div>

      {viewTab === 'planilha' ? (
        <MonthlyBudgetSpreadsheetPanel
          transactions={transactions}
          selectedMonth={selectedMonth}
          onSelectMonth={onSelectMonth}
          spreadsheets={spreadsheets}
          onOpenNewTx={onOpenNewTx}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. MOBILE VIEW (Screens < 768px): UX Limpa e Intuitiva (Imagem 3)         */}
          {/* ========================================================================= */}
          <div id="extrato-mobile-view" className="block md:hidden w-full max-w-md mx-auto px-1 pb-24">
            {/* Header: Mês e Saldo Líquido do Casal */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#006948]" />
                  <span className="font-display font-bold text-sm text-[#0b1c30]">{selectedMonth}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold border border-[#a7f3d0] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
                  FECHAMENTO ATIVO
                </span>
              </div>

              <div className="pt-3 pb-2">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block">
                  {analyticsData.totalEntradas > 0 ? 'Saldo Líquido do Casal' : 'Total de Despesas Registradas'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`font-display font-black text-3xl font-mono ${
                    analyticsData.totalEntradas > 0
                      ? analyticsData.saldoLiquido >= 0 ? 'text-[#006948]' : 'text-[#dc2626]'
                      : 'text-[#0b1c30]'
                  }`}>
                    {analyticsData.totalEntradas > 0
                      ? `${analyticsData.saldoLiquido >= 0 ? '+' : ''}${formatBRL(analyticsData.saldoLiquido)}`
                      : formatBRL(analyticsData.totalGasto)}
                  </span>
                  {analyticsData.totalEntradas > 0 && <TrendingUp className="w-4 h-4 text-[#006948]" />}
                </div>
              </div>

              {/* Se houver entradas registradas, exibe comparação de Entradas x Saídas; senão exibe resumo de despesas */}
              {analyticsData.totalEntradas > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#006194] flex items-center justify-center shrink-0 shadow-2xs">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#565e74] font-medium block">Total Entradas</span>
                      <span className="font-mono font-bold text-xs text-[#0b1c30] block truncate">
                        {formatBRL(analyticsData.totalEntradas)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#e11d48] flex items-center justify-center shrink-0 shadow-2xs">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#565e74] font-medium block">Total Saídas</span>
                      <span className="font-mono font-bold text-xs text-[#ba1a1a] block truncate">
                        {formatBRL(analyticsData.totalGasto)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-[#565e74] pt-2 pb-1 border-t border-[#f1f5f9] mt-1">
                  <span>Total de {analyticsData.count} despesas no mês</span>
                  <span className="font-semibold text-[#006194]">Média: {formatBRL(analyticsData.ticketMedio)}/compra</span>
                </div>
              )}

              {/* Divisão & Rateio Paritário */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#f8faff] border border-[#e5eeff]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
                    <span>⚖️</span>
                    <span>Divisão & Rateio Paritário</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#565e74] text-[10px] font-bold border border-[#e2e8f0]">
                    Meta 50 / 50
                  </span>
                </div>

                <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${analyticsData.felipePct}%` }}
                    className="h-full bg-[#006948]"
                  />
                  <div
                    style={{ width: `${analyticsData.genivaniaPct}%` }}
                    className="h-full bg-[#006194]"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono mt-2 font-bold">
                  <span className="text-[#006948]">
                    Felipe ({analyticsData.felipePct}%): {formatBRL(analyticsData.felipeGasto)}
                  </span>
                  <span className="text-[#006194]">
                    Genivânia ({analyticsData.genivaniaPct}%): {formatBRL(analyticsData.genivaniaGasto)}
                  </span>
                </div>

                {analyticsData.diffRateio > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs">
                    <span className="text-[#565e74] text-[11px]">
                      {analyticsData.devedor} deve <strong>{formatBRL(analyticsData.diffRateio)}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#006948] text-white font-bold text-[10px] flex items-center gap-1">
                      Compensar {formatBRL(analyticsData.diffRateio)} 📲
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#565e74] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estabelecimento, pessoa, valor..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e5eeff] rounded-2xl text-xs text-[#0b1c30] shadow-xs focus:outline-none focus:border-[#006948]"
              />
            </div>

            {/* Pílulas de Categorias (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
              <button
                onClick={() => setSelectedCategoryChip('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryChip === 'todos' ? 'bg-[#006948] text-white' : 'bg-white text-[#565e74] border border-[#e5eeff]'
                }`}
              >
                Todos ({categoryCounts.todos})
              </button>
              <button
                onClick={() => setSelectedCategoryChip('supermercado')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryChip === 'supermercado' ? 'bg-[#006948] text-white' : 'bg-white text-[#565e74] border border-[#e5eeff]'
                }`}
              >
                🛒 Supermercado
              </button>
              <button
                onClick={() => setSelectedCategoryChip('combustivel')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryChip === 'combustivel' ? 'bg-[#006948] text-white' : 'bg-white text-[#565e74] border border-[#e5eeff]'
                }`}
              >
                🚗 Carro
              </button>
              <button
                onClick={() => setSelectedCategoryChip('lazer')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryChip === 'lazer' ? 'bg-[#006948] text-white' : 'bg-white text-[#565e74] border border-[#e5eeff]'
                }`}
              >
                🍷 Lazer
              </button>
              <button
                onClick={() => setSelectedCategoryChip('farmacia')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryChip === 'farmacia' ? 'bg-[#006948] text-white' : 'bg-white text-[#565e74] border border-[#e5eeff]'
                }`}
              >
                💊 Farmácia
              </button>
            </div>

            {/* Lista de Transações Recentes Mobile */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-bold text-xs text-[#565e74] uppercase tracking-wider">
                  TRANSAÇÕES ({filteredTransactions.length})
                </span>
                <span className="text-[11px] text-[#006948] font-bold">
                  Filtrado por data
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {paginatedList.map((tx) => {
                  const meta = getCategoryMeta(tx.subcategoria, tx.categoria);
                  const IconComp = meta.icon;
                  const isFelipe = tx.usuario_id === 'usr-felipe' || tx.pagoPor === 'Felipe';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransactionDetail(tx)}
                      className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-transform"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-[#0b1c30] block truncate">
                            {tx.estabelecimento || 'Lançamento Diverso'}
                          </span>
                          <span className="text-[10px] text-[#565e74] flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFelipe ? 'bg-[#2563eb]' : 'bg-[#ec4899]'}`} />
                            {isFelipe ? 'Felipe' : 'Genivânia'} • {tx.data}
                          </span>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {tx.status === 'pendente' || tx.status === 'previsto' ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200">
                                Pendente
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[9px] font-semibold border border-emerald-200">
                                Pago
                              </span>
                            )}
                            {tx.itens && tx.itens.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-[#ecfdf5] text-[#006948] text-[9px] font-bold border border-[#bbf7d0]">
                                Cupom IA
                              </span>
                            )}
                            {(tx.kmAtual || tx.litros) && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 text-[9px] font-bold border border-amber-200">
                                ⛽ {tx.litros ? `${tx.litros}L` : ''} {tx.kmAtual ? `• ${tx.kmAtual.toLocaleString('pt-BR')} km` : ''}
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-[#f1f5f9] text-[#565e74] text-[9px] font-medium">
                              {tx.subcategoria || tx.categoria}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end justify-center">
                        <span className="font-mono font-bold text-xs text-[#0b1c30] block">
                          - {formatBRL(tx.valor)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#565e74]">
                            {tx.formaPagamento || 'Cartão'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(tx);
                            }}
                            className="p-1 rounded-md text-[#006194] hover:bg-[#eff4ff] active:scale-95 transition-transform"
                            title="Editar lançamento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Ver Mais Transações */}
              {visibleCount < filteredTransactions.length && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-white border border-[#cbd5e1] text-xs font-bold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer shadow-2xs"
                >
                  Carregar mais transações ({filteredTransactions.length - visibleCount} restantes)
                </button>
              )}
            </div>

            {/* Card de Fechamento Oficial */}
            <div
              onClick={() => setViewTab('planilha')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] block truncate">
                    Planilha de Fechamento Oficial
                  </span>
                  <span className="text-[10px] text-[#565e74] block truncate">
                    {filteredTransactions.length} lançamentos consolidados 50/50
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-[#006948] text-white text-[10px] font-bold shrink-0">
                Abrir Planilha →
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DESKTOP VIEW (Screens >= 768px): Tabela Analítica Ampla                */}
          {/* ========================================================================= */}
          <div id="extrato-desktop-view" className="hidden md:block">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-[#0b1c30]">
                  Extrato Financeiro Oficial
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-xs font-bold border border-[#a7f3d0]">
                  {filteredTransactions.length} registros
                </span>
              </div>
              <p className="text-xs text-[#565e74] mt-0.5">
                Extrato e lançamentos sincronizados em tempo real
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Seletor Estrito de Mês */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#e5eeff] text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#006948]" />
                <span className="text-[#565e74] font-medium hidden sm:inline">Mês:</span>
                <select
                  id="select-mes-extrato"
                  value={selectedMonth}
                  onChange={(e) => onSelectMonth && onSelectMonth(e.target.value)}
                  className="bg-transparent font-bold text-[#0b1c30] focus:outline-none cursor-pointer pr-1"
                >
                  {[
                    'Janeiro 2026',
                    'Fevereiro 2026',
                    'Março 2026',
                    'Abril 2026',
                    'Maio 2026',
                    'Junho 2026',
                    'Julho 2026',
                    'Agosto 2026',
                    'Setembro 2026',
                    'Outubro 2026',
                    'Novembro 2026',
                    'Dezembro 2026',
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onOpenNewTx}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lançamento</span>
              </button>
            </div>
          </div>

          {/* Banner de Contexto do Mês Selecionado */}
          {activeMonthCode <= '2026-08' ? (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📁</span>
                <div>
                  <strong className="text-[#006194]">Histórico Oficial das Planilhas ({selectedMonth}):</strong>
                  <span className="text-[#475569] ml-1">
                    Compras de Supermercado e Lazer identificadas pelo local real de compra ({filteredTransactions.length} lançamentos). Total fechado e auditado com precisão de R$ 0,00.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewTab('planilha')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-[#cbd5e1] text-[#006194] font-bold text-xs hover:bg-[#eff4ff] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                Ver Planilha de Fechamento →
              </button>
            </div>
          ) : (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#fefce8] border border-[#fef08a] flex items-center gap-2.5 text-xs">
              <span className="text-base">⚡</span>
              <div>
                <strong className="text-[#854d0e]">Mês Corrente em Aberto ({selectedMonth}):</strong>
                <span className="text-[#713f12] ml-1">
                  Novos lançamentos entram em tempo real com comprovantes IA ou registros manuais, todos com datas e horários exatos.
                </span>
              </div>
            </div>
          )}

          {/* Cards de KPI Analíticos no Topo do Extrato */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
            {/* Card 1: Total Gasto até o Momento */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Total Gasto até o Momento
                </span>
                <div className="w-7 h-7 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="font-display font-black text-2xl text-[#0b1c30] font-mono block">
                  {formatBRL(analyticsData.totalGasto)}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#565e74]">
                  <span className="font-semibold text-[#006948] bg-[#ecfdf5] px-1.5 py-0.2 rounded font-mono">
                    {analyticsData.count} despesas
                  </span>
                  <span>• Média: {formatBRL(analyticsData.ticketMedio)}/compra</span>
                </div>
              </div>
            </div>

            {/* Card 2: Modalidades de Pagamento (À Vista vs Cartão de Crédito) */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Modalidade de Pagamento
                </span>
                <div className="w-7 h-7 rounded-xl bg-[#eff4ff] text-[#2563eb] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#565e74] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    À Vista (PIX/Débito):
                  </span>
                  <strong className="font-mono text-[#0b1c30]">{formatBRL(analyticsData.totalVista)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#565e74] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Crédito (A Pagar):
                  </span>
                  <strong className="font-mono text-amber-700">{formatBRL(analyticsData.totalCartao)}</strong>
                </div>
              </div>
              {analyticsData.totalGasto > 0 && (
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex mt-2">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${(analyticsData.totalVista / analyticsData.totalGasto) * 100}%`,
                    }}
                    title="À Vista"
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${(analyticsData.totalCartao / analyticsData.totalGasto) * 100}%`,
                    }}
                    title="Crédito"
                  />
                </div>
              )}
            </div>

            {/* Card 3: Top Categoria de Maior Concentração */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Maior Foco de Gastos
                </span>
                <div className="w-7 h-7 rounded-xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                {analyticsData.topCategory ? (
                  <>
                    <span className="font-bold text-sm text-[#0b1c30] truncate block">
                      {analyticsData.topCategory.nome}
                    </span>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="font-mono font-extrabold text-[#ea580c]">
                        {formatBRL(analyticsData.topCategory.valor)}
                      </span>
                      <span className="text-[11px] text-[#565e74] font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                        {analyticsData.totalGasto > 0
                          ? `${Math.round((analyticsData.topCategory.valor / analyticsData.totalGasto) * 100)}% do total`
                          : '0%'}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sem lançamentos no período</span>
                )}
              </div>
            </div>
          </div>

          {/* Gráficos Analíticos de Gastos por Categoria */}
          {analyticsData.categoryList.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] mb-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#eff4ff] text-[#2563eb] flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider">
                    Distribuição de Gastos por Categoria • {filterMonthMode === 'selected' ? selectedMonth : 'Ano 2026'}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#565e74]">
                  Total: <strong className="text-[#0b1c30]">{formatBRL(analyticsData.totalGasto)}</strong>
                </span>
              </div>

              {/* Barras Horizontais Analíticas de Cada Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3.5">
                {analyticsData.categoryList.map((cat) => {
                  const Icon = cat.icon;
                  const pct =
                    analyticsData.totalGasto > 0
                      ? Math.round((cat.valor / analyticsData.totalGasto) * 100)
                      : 0;

                  return (
                    <div key={cat.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${cat.textColor}`} />
                          <span className="font-semibold text-[#0b1c30]">{cat.nome}</span>
                          <span className="text-[10px] text-[#565e74]">({cat.count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0b1c30]">{formatBRL(cat.valor)}</span>
                          <span className="text-[10px] font-bold text-[#565e74] bg-gray-100 px-1.5 py-0.2 rounded w-8 text-right font-mono">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      {/* Barra de Progresso Colorida */}
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cat.barBg}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Search & Category Chips */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] mb-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#565e74] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por estabelecimento, subcategoria, observação, valor..."
              className="w-full pl-9.5 pr-4 py-2 bg-[#f8faff] border border-[#e5eeff] rounded-xl text-xs text-[#0b1c30] placeholder-[#565e74] focus:outline-none focus:border-[#006948] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565e74] hover:text-[#0b1c30]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#e5eeff] bg-[#f8faff] hover:bg-[#eff4ff] text-xs font-semibold text-[#0b1c30] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#565e74]" />
            <span>Data: {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}</span>
          </button>
        </div>

        {/* Category Chips Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-[#f1f5f9] mt-3 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryChip('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'todos'
                ? 'bg-[#006948] text-white shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            Todos ({categoryCounts.todos})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('supermercado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'supermercado'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            🛒 Supermercado ({categoryCounts.supermercado})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('combustivel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'combustivel'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            ⛽ Combustível ({categoryCounts.combustivel})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('carro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'carro'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            🚗 Carro ({categoryCounts.carro})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('moradia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'moradia'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            🏠 Moradia ({categoryCounts.moradia})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('farmacia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'farmacia'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            💊 Farmácia ({categoryCounts.farmacia})
          </button>
          <button
            onClick={() => setSelectedCategoryChip('lazer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryChip === 'lazer'
                ? 'bg-[#006948] text-white font-bold shadow-2xs'
                : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
          >
            🍷 Lazer ({categoryCounts.lazer})
          </button>
        </div>
      </div>

      {/* Transactions Table (Desktop & Tablet) */}
      <div className="bg-white rounded-3xl border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden">
        {paginatedList.length === 0 ? (
          <div className="p-12 text-center text-[#565e74]">
            <Layers className="w-10 h-10 mx-auto text-[#cbd5e1] mb-2" />
            <p className="font-semibold text-sm text-[#0b1c30]">Nenhuma transação encontrada</p>
            <p className="text-xs mt-1">Ajuste os filtros de busca ou selecione &ldquo;Ano Todo 2026&rdquo; acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Data</th>
                  <th className="py-3.5 px-4">Estabelecimento / Descrição</th>
                  <th className="py-3.5 px-4">Categoria / Subcategoria</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4">Pagamento & Detalhes</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paginatedList.map((tx) => {
                  const meta = getCategoryMeta(tx.subcategoria, tx.categoria);
                  const IconComp = meta.icon;
                  const isExpense = tx.tipo === 'despesa';
                  const isFelipe = tx.usuario_id === 'usr-felipe' || tx.pagoPor === 'Felipe';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransactionDetail(tx)}
                      className="hover:bg-[#f8faff] transition-colors cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-5 font-medium text-[#565e74] whitespace-nowrap">
                        {tx.data}
                      </td>

                      {/* Establishment & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-[#0b1c30] block truncate max-w-xs text-xs sm:text-sm">
                              {tx.estabelecimento || 'Local Diverso'}
                            </span>
                            {tx.observacoes && !tx.observacoes.startsWith('Gasto registrado:') ? (
                              <span className="text-[11px] text-[#565e74] block truncate max-w-xs">
                                {tx.observacoes}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#006948] font-semibold flex items-center gap-1">
                                <span>📍</span>
                                <span>Local de compra registrado</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0b1c30] block capitalize">
                          {tx.subcategoria || 'Geral'}
                        </span>
                        <span className="text-[10px] text-[#565e74] block">
                          {tx.categoria || 'Variável'}
                        </span>
                        {(tx.kmAtual || tx.litros) && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                            ⛽ {tx.litros ? `${tx.litros}L` : ''} {tx.kmAtual ? `• ${tx.kmAtual.toLocaleString('pt-BR')} km` : ''}
                          </span>
                        )}
                      </td>

                      {/* Person / Member */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isFelipe ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#fdf2f8] text-[#db2777]'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isFelipe ? 'bg-[#2563eb]' : 'bg-[#ec4899]'}`}
                          />
                          <span>{isFelipe ? 'Felipe' : 'Genivânia'}</span>
                        </span>
                      </td>

                      {/* Payment Method & Items Tag */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#0b1c30] font-medium block">
                            {tx.formaPagamento || 'PIX'}
                          </span>
                          {tx.status === 'pendente' || tx.status === 'previsto' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Pago
                            </span>
                          )}
                        </div>
                        {tx.itens && tx.itens.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#bbf7d0] mt-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{tx.itens.length} produtos</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <span
                          className={`font-extrabold text-sm ${
                            isExpense ? 'text-[#0b1c30]' : 'text-[#16a34a]'
                          }`}
                        >
                          {isExpense ? `- ${formatBRL(tx.valor)}` : `+ ${formatBRL(tx.valor)}`}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(tx);
                            }}
                            className="p-1.5 rounded-lg text-[#006194] hover:text-[#004770] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransactionDetail(tx);
                            }}
                            className="p-1.5 rounded-lg text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                            title="Ver detalhes"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Pagination */}
        {filteredTransactions.length > visibleCount && (
          <div className="p-4 bg-[#f8faff] border-t border-[#e5eeff] text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="px-5 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:bg-[#eff4ff] text-xs font-bold text-[#0b1c30] transition-colors cursor-pointer shadow-2xs"
            >
              Carregar mais transações ({filteredTransactions.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
    </>
    )}

      {/* Transaction Detail Modal */}
      {selectedTransactionDetail && (
        <div
          id="modal-tx-detail-backdrop"
          onClick={() => setSelectedTransactionDetail(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-tx-detail-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative max-h-[90vh] flex flex-col"
          >
            <button
              onClick={() => setSelectedTransactionDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#f1f5f9]">
              <div className="w-11 h-11 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center font-bold font-mono">
                -
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-base text-[#0b1c30] truncate">
                  {selectedTransactionDetail.estabelecimento || 'Lançamento Diverso'}
                </h4>
                <p className="text-xs text-[#565e74]">
                  {selectedTransactionDetail.data} • {selectedTransactionDetail.subcategoria}
                </p>
              </div>
            </div>

            <div className="py-3 space-y-2.5 text-xs overflow-y-auto flex-1">
              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Valor:</span>
                <span className="font-bold font-mono text-sm text-[#0b1c30]">
                  {formatBRL(selectedTransactionDetail.valor)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Local de Compra:</span>
                <span className="font-bold text-[#006948] flex items-center gap-1">
                  <span>📍</span>
                  <span>{selectedTransactionDetail.estabelecimento || 'Local Diverso'}</span>
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Responsável:</span>
                <span className="font-bold text-[#0b1c30]">
                  {selectedTransactionDetail.usuario_id === 'usr-felipe' || selectedTransactionDetail.pagoPor === 'Felipe'
                    ? 'Felipe Duarte'
                    : 'Genivânia Duarte'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Forma de Pagamento:</span>
                <span className="font-medium text-[#0b1c30]">
                  {selectedTransactionDetail.formaPagamento || 'PIX / Débito'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Status:</span>
                <span>
                  {selectedTransactionDetail.status === 'pendente' || selectedTransactionDetail.status === 'previsto' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Pendente (Cartão de Crédito)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Pago
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Categoria Macro:</span>
                <span className="font-medium text-[#0b1c30]">
                  {selectedTransactionDetail.categoria || 'Variável'}
                </span>
              </div>

              {selectedTransactionDetail.observacoes && (
                <div className="py-2 px-3 bg-[#f8faff] rounded-xl border border-[#e5eeff] text-xs">
                  <span className="font-bold text-[#0b1c30] block mb-0.5">Observações:</span>
                  <p className="text-[#475569]">{selectedTransactionDetail.observacoes}</p>
                </div>
              )}

              {/* Items Breakdown if available */}
              {selectedTransactionDetail.itens && selectedTransactionDetail.itens.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-bold text-xs text-[#0b1c30] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
                    <span>Itens do Cupom Fiscal ({selectedTransactionDetail.itens.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedTransactionDetail.itens.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#f8faff] border border-[#e5eeff] text-[11px]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-[#0b1c30] block truncate">
                            {it.nome || it.nome_do_item}
                          </span>
                          <span className="text-[#565e74] text-[10px]">
                            {it.quantidade} {it.unidade || 'un'} × {formatBRL(it.precoUnitario || it.preco_unitario || 0)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#0b1c30] whitespace-nowrap">
                          {formatBRL(it.precoTotal || it.preco_total || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedTransactionDetail;
                  setSelectedTransactionDetail(null);
                  setEditingTransaction(toEdit);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Lançamento</span>
              </button>

              <button
                onClick={() => handleDelete(selectedTransactionDetail)}
                disabled={isDeleting}
                className="py-2.5 px-3 rounded-xl bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecdd3] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Excluir lançamento"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="py-2.5 px-4 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0b1c30] text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Lançamento */}
      {editingTransaction && (
        <NewTransactionModal
          isOpen={!!editingTransaction}
          transactionToEdit={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={(updatedTx) => {
            onUpdateTransaction(updatedTx);
            setEditingTransaction(null);
            showToast(`✅ Lançamento "${updatedTx.estabelecimento}" atualizado com sucesso!`);
          }}
          defaultMonth={selectedMonth}
        />
      )}
    </div>
  );
};
