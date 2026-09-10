import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  Scale,
  QrCode,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Fuel,
  Building2,
  Car,
  Utensils,
  Pill,
  Sparkles,
  CheckCircle2,
  Lock,
  Tag,
  FileSpreadsheet,
  RefreshCw,
  X,
  Upload,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowRight,
  Clock,
  Check,
  CreditCard,
  Percent,
  Layers,
  Wrench,
  DollarSign,
  Download,
} from 'lucide-react';
import { Transaction, Receipt } from '../types';
import { formatBRL } from '../utils/formatters';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('todos');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingOneDrive, setIsSyncingOneDrive] = useState(false);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<any | null>(null);

  // Initial prioritized transactions matching unified couple finances
  const [ledgerItems, setLedgerItems] = useState([
    {
      id: 'tx-1',
      titulo: 'Compras do Mês',
      estabelecimento: 'Atacadão S/A',
      data: '03 Mar',
      valor: -487.9,
      metodoPagamento: 'Crédito NuBank',
      categoria: 'Supermercado',
      tipoGasto: 'Variável',
      icone: 'mercado',
      tags: [
        { label: 'Cupom IA', tipo: 'cupom' },
        { label: 'Comprovante OK', tipo: 'check' },
      ],
    },
    {
      id: 'tx-2',
      titulo: 'Abastecimento Gasolina',
      estabelecimento: 'Posto Shell',
      data: '02 Mar',
      valor: -240.0,
      metodoPagamento: 'Débito',
      categoria: 'Carro',
      tipoGasto: 'Variável',
      icone: 'combustivel',
      tags: [{ label: 'Transporte', tipo: 'transporte' }],
    },
    {
      id: 'tx-3',
      titulo: 'Aluguel + Condomínio',
      estabelecimento: 'Imobiliária União',
      data: '01 Mar',
      valor: -4250.0,
      metodoPagamento: 'PIX Inter',
      categoria: 'Moradia',
      tipoGasto: 'Moradia',
      icone: 'moradia',
      tags: [
        { label: 'Invariável Fixo', tipo: 'lock' },
        { label: 'Conta Central', tipo: 'check' },
      ],
    },
    {
      id: 'tx-4',
      titulo: 'Revisão e Peças do Ca...',
      tituloCompleto: 'Revisão e Peças do Carro',
      estabelecimento: 'Auto Mecânica',
      data: '28 Fev',
      valor: -650.0,
      metodoPagamento: '3x Cartão',
      categoria: 'Carro',
      tipoGasto: 'Manutenção',
      icone: 'carro',
      tags: [
        { label: 'Carro 2026', tipo: 'tag' },
        { label: 'Parcela 1/3', tipo: 'parcela' },
      ],
    },
    {
      id: 'tx-5',
      titulo: 'Jantar Restaurante Janga...',
      tituloCompleto: 'Jantar Restaurante Jangada',
      estabelecimento: 'Gastronomia',
      data: '27 Fev',
      valor: -340.0,
      metodoPagamento: 'Crédito',
      categoria: 'Lazer',
      tipoGasto: 'Variável',
      icone: 'restaurante',
      tags: [{ label: 'Lazer a Dois', tipo: 'lazer' }],
    },
    {
      id: 'tx-6',
      titulo: 'Farmácia & Cuidados',
      estabelecimento: 'Droga Raia Paulista',
      data: '26 Fev',
      valor: -134.2,
      metodoPagamento: 'Débito',
      categoria: 'Saúde',
      tipoGasto: 'Variável',
      icone: 'saude',
      tags: [{ label: 'Saúde & Remédios', tipo: 'check' }],
    },
    {
      id: 'tx-7',
      titulo: 'Compras da Semana',
      estabelecimento: 'Pão de Açúcar Jardins',
      data: '24 Fev',
      valor: -312.45,
      metodoPagamento: 'Crédito',
      categoria: 'Supermercado',
      tipoGasto: 'Variável',
      icone: 'mercado',
      tags: [{ label: 'Alimentação', tipo: 'check' }],
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logic
  const filteredLedger = useMemo(() => {
    return ledgerItems.filter((item) => {
      // Search
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.titulo.toLowerCase().includes(query);
        const matchEst = item.estabelecimento.toLowerCase().includes(query);
        const matchCat = item.categoria.toLowerCase().includes(query);
        const matchValor = Math.abs(item.valor).toString().includes(query);
        if (!matchTitle && !matchEst && !matchCat && !matchValor) return false;
      }

      // Category Chips
      if (selectedCategoryChip !== 'todos') {
        if (selectedCategoryChip === 'supermercado' && item.categoria !== 'Supermercado') return false;
        if (selectedCategoryChip === 'carro' && item.categoria !== 'Carro') return false;
        if (selectedCategoryChip === 'lazer' && item.categoria !== 'Lazer') return false;
        if (selectedCategoryChip === 'moradia' && item.categoria !== 'Moradia') return false;
      }

      return true;
    });
  }, [ledgerItems, searchTerm, selectedCategoryChip]);

  // Sync with OneDrive
  const handleSyncOneDrive = () => {
    setIsSyncingOneDrive(true);
    showToast('Sincronizando com Controle_Financeiro_Duarte_2026.xlsx no OneDrive...');
    setTimeout(() => {
      setIsSyncingOneDrive(false);
      showToast('342 registros atualizados com sucesso via OneDrive!');
    }, 1800);
  };

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* Hidden File Input for XLSX import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            showToast(`Importando "${f.name}" com mapeamento heurístico Duarte IA...`);
            setTimeout(() => {
              showToast('342 linhas conciliadas e mapeadas com sucesso!');
            }, 1500);
          }
        }}
        className="hidden"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          id="toast-transacoes"
          className="fixed top-20 inset-x-4 max-w-sm mx-auto z-50 bg-[#0b1c30] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-top-4"
        >
          <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Screens < 768px): Exact matches requested mobile design   */}
      {/* ========================================================================= */}
      <div id="extrato-mobile-view" className="block md:hidden w-full max-w-md mx-auto pb-24">
        {/* Top Card: Saldo Líquido do Casal */}
        <div
          id="card-saldo-casal-mob"
          className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#0b1c30]">
              <Calendar className="w-4 h-4 text-[#006948]" />
              <span className="font-display font-bold text-sm sm:text-base">
                {selectedMonth || 'Março 2026'}
              </span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#006948] text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse" />
              <span>FECHAMENTO ATIVO</span>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-[#565e74] block font-medium">
              Saldo Líquido do Casal
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display font-extrabold text-3xl text-[#006948] tracking-tight font-mono">
                +R$ 4.329,60
              </span>
              <TrendingUp className="w-5 h-5 text-[#006948] stroke-[2.5]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 border border-[#bbf7d0]">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-medium text-[#565e74]">
                  Total Entradas
                </span>
              </div>
              <span className="font-display font-bold text-sm text-[#0b1c30] font-mono">
                R$ 18.450,00
              </span>
            </div>

            <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0 border border-[#fca5a5]">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-medium text-[#565e74]">
                  Total Saídas
                </span>
              </div>
              <span className="font-display font-bold text-sm text-[#0b1c30] font-mono">
                R$ 14.120,40
              </span>
            </div>
          </div>
        </div>

        {/* Card: Conta Única */}
        <div
          id="card-conta-unica-mob"
          className="bg-[#f8faff] rounded-3xl p-4 border border-[#dce9ff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] mb-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center border border-[#a7f3d0] shrink-0">
              <Building2 className="w-5 h-5 text-[#006948]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xs text-[#0b1c30] truncate">
                  Conta Única Casal Duarte
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold border border-[#a7f3d0] shrink-0">
                  100% Unificado
                </span>
              </div>
              <p className="text-[11px] text-[#565e74] truncate mt-0.5">
                Todas as contas saem do mesmo lugar • Gestão sem divisão
              </p>
            </div>
          </div>
        </div>

        {/* Search & Category Chips */}
        <div className="mb-4 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565e74]" />
            <input
              id="input-busca-transacoes-mob"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por estabelecimento, categoria ou valor..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5eeff] rounded-2xl text-xs text-[#0b1c30] placeholder-[#565e74] shadow-xs focus:outline-none focus:border-[#006948] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategoryChip('todos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryChip === 'todos'
                  ? 'bg-[#005a3c] text-white shadow-2xs'
                  : 'bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              Todos ({ledgerItems.length})
            </button>

            <button
              onClick={() => setSelectedCategoryChip('supermercado')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryChip === 'supermercado'
                  ? 'bg-[#005a3c] text-white font-bold shadow-2xs'
                  : 'bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <span>🛒</span>
              <span>Supermercado</span>
            </button>

            <button
              onClick={() => setSelectedCategoryChip('carro')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryChip === 'carro'
                  ? 'bg-[#005a3c] text-white font-bold shadow-2xs'
                  : 'bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <span>🚗</span>
              <span>Carro</span>
            </button>

            <button
              onClick={() => setSelectedCategoryChip('lazer')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryChip === 'lazer'
                  ? 'bg-[#005a3c] text-white font-bold shadow-2xs'
                  : 'bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <span>🍷</span>
              <span>Lazer</span>
            </button>

            <button
              onClick={() => setSelectedCategoryChip('moradia')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryChip === 'moradia'
                  ? 'bg-[#005a3c] text-white font-bold shadow-2xs'
                  : 'bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <span>🏠</span>
              <span>Moradia</span>
            </button>
          </div>
        </div>

        {/* Section Title & Sort */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="font-display font-bold text-xs text-[#0b1c30] tracking-wider uppercase">
            TRANSAÇÕES RECENTES
          </span>

          <button
            onClick={() => {
              setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
              showToast(sortOrder === 'desc' ? 'Ordenado: Mais antigas primeiro' : 'Ordenado: Mais recentes primeiro');
            }}
            className="text-xs font-semibold text-[#006948] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Data {sortOrder === 'desc' ? '↓' : '↑'}</span>
          </button>
        </div>

        {/* Transactions Feed (Cards) */}
        <div className="flex flex-col gap-2.5 mb-5">
          {filteredLedger.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedTransactionDetail(tx)}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.02)] hover:border-[#cbd5e1] transition-all cursor-pointer active:scale-99"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      tx.icone === 'mercado'
                        ? 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]'
                        : tx.icone === 'combustivel'
                        ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                        : tx.icone === 'moradia'
                        ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                        : tx.icone === 'carro'
                        ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                        : 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]'
                    }`}
                  >
                    {tx.icone === 'mercado' ? (
                      <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                    ) : tx.icone === 'combustivel' ? (
                      <Fuel className="w-5 h-5 stroke-[2.2]" />
                    ) : tx.icone === 'moradia' ? (
                      <Building2 className="w-5 h-5 stroke-[2.2]" />
                    ) : tx.icone === 'carro' ? (
                      <Car className="w-5 h-5 stroke-[2.2]" />
                    ) : tx.icone === 'saude' ? (
                      <Pill className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <Utensils className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-[#0b1c30] truncate leading-tight">
                      {tx.titulo}
                    </h4>
                    <p className="text-[11px] text-[#565e74] mt-0.5 truncate">
                      {tx.estabelecimento} • {tx.data}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {tx.tags.map((tg, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#eff4ff] text-[#006194] border border-[#dce9ff]"
                        >
                          {tg.tipo === 'cupom' && <Sparkles className="w-3 h-3 text-[#006948]" />}
                          {tg.tipo === 'check' && <CheckCircle2 className="w-3 h-3 text-[#006948]" />}
                          {tg.tipo === 'lock' && <Lock className="w-3 h-3 text-[#565e74]" />}
                          {tg.tipo === 'tag' && <Tag className="w-3 h-3 text-[#565e74]" />}
                          <span>{tg.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="block font-bold text-xs sm:text-sm text-[#0b1c30] font-mono">
                    {formatBRL(tx.valor)}
                  </span>
                  <span className="block text-[11px] text-[#565e74] mt-0.5">
                    {tx.metodoPagamento}
                  </span>
                  <span className="inline-block text-[10px] font-medium text-[#565e74] mt-1">
                    {tx.tipoGasto}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Card OneDrive & Import */}
        <div
          id="card-onedrive-planilha-mob"
          className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#006948] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-[#006948]" />
              </div>
              <div className="min-w-0">
                <span className="block font-mono font-bold text-xs text-[#0b1c30] truncate">
                  Controle_Financeiro_Duarte_2026.xlsx
                </span>
                <span className="block text-[11px] text-[#565e74] mt-0.5 truncate">
                  342 registros sincronizados via OneDrive
                </span>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#006948] shrink-0 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#006948]" />
              <span>Importar XLSX</span>
            </button>

            <button
              onClick={handleSyncOneDrive}
              disabled={isSyncingOneDrive}
              className="w-10 h-10 rounded-2xl bg-white border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
              title="Sincronizar OneDrive"
            >
              <RefreshCw className={`w-4 h-4 text-[#006948] ${isSyncingOneDrive ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Full-Width Data Table & Dashboard     */}
      {/* ========================================================================= */}
      <div id="extrato-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
        {/* Desktop Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5eeff]">
          <div>
            <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
              Transações & Extrato Bancário
            </h1>
            <p className="text-sm text-[#565e74] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006948]" />
              <span>Sincronizado com Controle_Financeiro_Duarte_2026.xlsx • Conta Central Unificada</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncOneDrive}
              disabled={isSyncingOneDrive}
              className="px-3.5 py-2 rounded-xl border border-[#dce9ff] bg-white text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#006948] ${isSyncingOneDrive ? 'animate-spin' : ''}`} />
              <span>Sincronizar OneDrive</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-[#dce9ff] bg-white text-[#0b1c30] hover:bg-[#eff4ff] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#006948]" />
              <span>Importar XLSX</span>
            </button>

            <button
              onClick={onOpenNewTx}
              className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Transação / PIX</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
                Saldo Líquido do Casal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold">
                Superávit
              </span>
            </div>
            <div className="font-display font-extrabold text-2xl lg:text-3xl text-[#006948] font-mono">
              +R$ 4.329,60
            </div>
            <p className="text-xs text-[#565e74] mt-1.5">
              Fechamento Março 2026 • 100% conciliado
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
                Total Entradas
              </span>
              <div className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="font-display font-bold text-2xl text-[#0b1c30] font-mono">
              R$ 18.450,00
            </div>
            <p className="text-xs text-[#565e74] mt-1.5">
              Salários e receitas conjuntas
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
                Total Saídas
              </span>
              <div className="w-6 h-6 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="font-display font-bold text-2xl text-[#0b1c30] font-mono">
              R$ 14.120,40
            </div>
            <p className="text-xs text-[#565e74] mt-1.5">
              Fixas R$ 7.700 • Variáveis R$ 6.420
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
                Taxa de Poupança
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                Objetivo OK
              </span>
            </div>
            <div className="font-display font-bold text-2xl text-[#006194] font-mono">
              23.5%
            </div>
            <p className="text-xs text-[#565e74] mt-1.5">
              R$ 4.329,60 direcionados para Metas
            </p>
          </div>
        </div>

        {/* Filter & Action Row Desktop */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] mb-6 flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565e74]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, estabelecimento ou valor..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-[#e5eeff] rounded-xl text-xs text-[#0b1c30] placeholder-[#565e74] focus:outline-none focus:border-[#006948]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategoryChip('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryChip === 'todos'
                  ? 'bg-[#005a3c] text-white'
                  : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              Todos ({ledgerItems.length})
            </button>
            <button
              onClick={() => setSelectedCategoryChip('supermercado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryChip === 'supermercado'
                  ? 'bg-[#005a3c] text-white font-bold'
                  : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              🛒 Supermercado
            </button>
            <button
              onClick={() => setSelectedCategoryChip('carro')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryChip === 'carro'
                  ? 'bg-[#005a3c] text-white font-bold'
                  : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              🚗 Carro
            </button>
            <button
              onClick={() => setSelectedCategoryChip('lazer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryChip === 'lazer'
                  ? 'bg-[#005a3c] text-white font-bold'
                  : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              🍷 Lazer
            </button>
            <button
              onClick={() => setSelectedCategoryChip('moradia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryChip === 'moradia'
                  ? 'bg-[#005a3c] text-white font-bold'
                  : 'bg-[#f8faff] border border-[#e5eeff] text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              🏠 Moradia
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Data</th>
                  <th className="py-3.5 px-4">Estabelecimento / Descrição</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Forma de Pagamento</th>
                  <th className="py-3.5 px-4">Comprovante / Auditoria</th>
                  <th className="py-3.5 px-4 text-right">Valor Líquido</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredLedger.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransactionDetail(tx)}
                    className="hover:bg-[#f8faff] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-medium text-[#565e74] whitespace-nowrap">
                      {tx.data}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            tx.icone === 'mercado'
                              ? 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]'
                              : tx.icone === 'combustivel'
                              ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                              : tx.icone === 'moradia'
                              ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                              : tx.icone === 'carro'
                              ? 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]'
                              : 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]'
                          }`}
                        >
                          {tx.icone === 'mercado' ? (
                            <ShoppingCart className="w-4 h-4" />
                          ) : tx.icone === 'combustivel' ? (
                            <Fuel className="w-4 h-4" />
                          ) : tx.icone === 'moradia' ? (
                            <Building2 className="w-4 h-4" />
                          ) : tx.icone === 'carro' ? (
                            <Car className="w-4 h-4" />
                          ) : tx.icone === 'saude' ? (
                            <Pill className="w-4 h-4" />
                          ) : (
                            <Utensils className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-[#0b1c30] block">
                            {tx.tituloCompleto || tx.titulo}
                          </span>
                          <span className="text-[11px] text-[#565e74]">
                            {tx.estabelecimento}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#0b1c30] block">
                        {tx.categoria}
                      </span>
                      <span className="text-[10px] text-[#565e74]">
                        {tx.tipoGasto}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[#0b1c30] font-medium block">
                        {tx.metodoPagamento}
                      </span>
                      <span className="text-[10px] text-[#006948] font-bold">
                        Conta Central do Casal
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.tags.map((tg, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#eff4ff] text-[#006194] border border-[#dce9ff]"
                          >
                            {tg.tipo === 'cupom' && <Sparkles className="w-3 h-3 text-[#006948]" />}
                            {tg.tipo === 'check' && <CheckCircle2 className="w-3 h-3 text-[#006948]" />}
                            {tg.tipo === 'lock' && <Lock className="w-3 h-3 text-[#565e74]" />}
                            <span>{tg.label}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold font-mono text-sm text-[#0b1c30]">
                      {formatBRL(tx.valor)}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransactionDetail(tx);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="py-3 px-5 bg-[#f8faff] border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#565e74]">
            <span>Exibindo {filteredLedger.length} lançamentos</span>
            <span className="font-semibold">
              Total exibido: {formatBRL(filteredLedger.reduce((acc, curr) => acc + curr.valor, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DA TRANSAÇÃO (Shared Mobile & Desktop)                     */}
      {/* ========================================================================= */}
      {selectedTransactionDetail && (
        <div
          id="modal-tx-detail-backdrop"
          onClick={() => setSelectedTransactionDetail(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-tx-detail-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedTransactionDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#f1f5f9]">
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#0b1c30]">
                  {selectedTransactionDetail.tituloCompleto || selectedTransactionDetail.titulo}
                </h4>
                <p className="text-xs text-[#565e74]">
                  {selectedTransactionDetail.estabelecimento} • {selectedTransactionDetail.data} 2026
                </p>
              </div>
            </div>

            <div className="py-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Valor Líquido:</span>
                <span className="font-bold font-mono text-[#0b1c30]">
                  {formatBRL(selectedTransactionDetail.valor)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Origem da Conta:</span>
                <span className="font-semibold text-[#006948]">
                  Conta Conjunta Casal
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Forma de Pagamento:</span>
                <span className="font-medium text-[#0b1c30]">
                  {selectedTransactionDetail.metodoPagamento}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
                <span className="text-[#565e74]">Classificação:</span>
                <span className="font-medium text-[#0b1c30]">
                  {selectedTransactionDetail.categoria} ({selectedTransactionDetail.tipoGasto})
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedTransactionDetail(null);
                  onViewReceipt({
                    id: 'rec-1',
                    data: '2026-03-03',
                    estabelecimento: selectedTransactionDetail.estabelecimento,
                    tipoEstabelecimento: 'Supermercado',
                    numeroCupom: 'NFC-e 049.201',
                    valorTotal: Math.abs(selectedTransactionDetail.valor),
                    status: 'Conciliado',
                    itens: [],
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver Cupom IA</span>
              </button>

              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="py-2.5 px-4 rounded-xl border border-[#cbd5e1] text-[#0b1c30] text-xs font-semibold hover:bg-[#f8f9ff] cursor-pointer"
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
