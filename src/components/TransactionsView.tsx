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
} from 'lucide-react';
import { Transaction, Receipt } from '../types';
import { formatBRL } from '../utils/formatters';
import { deleteTransactionFromCloud } from '../services/supabaseService';

interface TransactionsViewProps {
  transactions: Transaction[];
  receipts: Receipt[];
  selectedMonth: string;
  onOpenNewTx: () => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  receipts,
  selectedMonth,
  onOpenNewTx,
  onUpdateTransaction,
  onDeleteTransaction,
  onViewReceipt,
}) => {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('todos');
  const [filterMonthMode, setFilterMonthMode] = useState<'selected' | 'all'>('selected');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [visibleCount, setVisibleCount] = useState(30);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<Transaction | null>(null);
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
    if (s.includes('aluguel') || s.includes('condominio') || s.includes('condomínio') || s.includes('moradia')) {
      return { icon: Building2, bg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]', label: 'Moradia' };
    }
    if (s.includes('carro') || s.includes('manuten') || s.includes('seguro') || s.includes('rastreador') || s.includes('ipva')) {
      return { icon: Car, bg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]', label: 'Carro' };
    }
    if (s.includes('farm') || s.includes('saude') || s.includes('saúde') || s.includes('medic')) {
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
        if (!tx.data.startsWith(activeMonthCode)) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const est = (tx.estabelecimento || '').toLowerCase();
        const sub = (tx.subcategoria || '').toLowerCase();
        const obs = (tx.observacoes || '').toLowerCase();
        const pag = (tx.pagoPor || '').toLowerCase();
        const val = Math.abs(tx.valor).toString();
        if (!est.includes(query) && !sub.includes(query) && !obs.includes(query) && !pag.includes(query) && !val.includes(query)) {
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
      showToast('Lançamento removido do Supabase com sucesso.');
    } else {
      showToast('Erro ao remover do Supabase. Tente novamente.');
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
            Dados autênticos sincronizados em tempo real com o banco de dados Supabase do casal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month toggle: Selected Month vs All 2026 */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-[#e5eeff] text-xs shadow-2xs">
            <button
              onClick={() => setFilterMonthMode('selected')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterMonthMode === 'selected' ? 'bg-[#006948] text-white' : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              {selectedMonth}
            </button>
            <button
              onClick={() => setFilterMonthMode('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filterMonthMode === 'all' ? 'bg-[#006948] text-white' : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Ano Todo 2026 ({transactions.length})
            </button>
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
                            <span className="font-bold text-[#0b1c30] block truncate max-w-xs">
                              {tx.estabelecimento || 'Diversos'}
                            </span>
                            {tx.observacoes && (
                              <span className="text-[11px] text-[#565e74] block truncate max-w-xs">
                                {tx.observacoes}
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
                        <span className="text-[10px] text-[#565e74]">
                          {tx.categoria || 'Variável'}
                        </span>
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
                        <span className="text-[#0b1c30] font-medium block">
                          {tx.formaPagamento || 'PIX'}
                        </span>
                        {tx.itens && tx.itens.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#bbf7d0]">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransactionDetail(tx);
                          }}
                          className="p-1.5 rounded-lg text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
                          title="Ver detalhes"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0b1c30] text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
