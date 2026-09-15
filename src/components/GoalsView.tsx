import { GoalsDesktopView } from "./GoalsDesktopView";
import React, { useState } from 'react';
import {
  ShoppingCart,
  Car,
  RefreshCw,
  Mic,
  Plus,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  ArrowLeftRight,
  Volume2,
  Star,
  Check,
  X,
  PiggyBank,
  TrendingUp,
  Fuel,
  Pill,
  Utensils,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  Copy,
  Radio,
  ArrowUpRight,
  Code2,
  Terminal,
} from 'lucide-react';
import { FinancialGoal, Transaction, FuelLog } from '../types';
import { formatBRL } from '../utils/formatters';

interface GoalsViewProps {
  goals?: FinancialGoal[];
  transactions?: Transaction[];
  selectedMonth?: string;
  onAddGoal?: (goal: FinancialGoal) => void;
  onUpdateGoal?: (goal: FinancialGoal) => void;
  fuelLogs?: FuelLog[];
  onAddFuelLog?: (log: FuelLog) => void;
  onUpdateFuelLog?: (log: FuelLog) => void;
  onDeleteFuelLog?: (id: string) => void;
}

interface ShoppingListItem {
  id: string;
  nome: string;
  preco: number;
  comprado: boolean;
  store: 'atacadao' | 'drogasil' | 'sams';
  origem: {
    tipo: 'alexa' | 'siri' | 'fixo' | 'manual';
    label: string;
    subtag?: string;
  };
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals = [],
  transactions = [],
  selectedMonth = 'Março 2026',
  onAddGoal,
  onUpdateGoal,
  fuelLogs,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog,
}) => {
  // Mobile Top Switcher: 'compras' (Lista de Compras) vs 'carro' (Metas & Carro)
  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'carro'>('compras');

  // Active Store Filter Pill (shared between mobile & desktop)
  const [activeStore, setActiveStore] = useState<'atacadao' | 'drogasil' | 'sams'>('atacadao');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Voice recording simulation
  const [isListening, setIsListening] = useState(false);

  // New item text input
  const [newItemText, setNewItemText] = useState('');

  // Shopping Items state matching image.png exactly
  const [items, setItems] = useState<ShoppingListItem[]>([
    {
      id: 'item-1',
      nome: 'Azeite Extra Virgem 500ml',
      preco: 38.9,
      comprado: true,
      store: 'atacadao',
      origem: {
        tipo: 'alexa',
        label: 'Felipe via Alexa 08:30',
      },
    },
    {
      id: 'item-2',
      nome: 'Café Especial em Grãos 1kg',
      preco: 54.9,
      comprado: false,
      store: 'atacadao',
      origem: {
        tipo: 'siri',
        label: 'Genivânia via Siri 14:15',
        subtag: 'Item Gourmet',
      },
    },
    {
      id: 'item-3',
      nome: 'Detergente Líquido Neutro 5L',
      preco: 29.9,
      comprado: false,
      store: 'atacadao',
      origem: {
        tipo: 'fixo',
        label: 'Invariável / Limpeza',
      },
    },
    {
      id: 'item-4',
      nome: 'Filé de Frango Sassami 3kg',
      preco: 62.7,
      comprado: true,
      store: 'atacadao',
      origem: {
        tipo: 'fixo',
        label: 'Essencial Proteína',
      },
    },
    {
      id: 'item-5',
      nome: 'Papel Higiênico 24 rolos',
      preco: 44.9,
      comprado: true,
      store: 'atacadao',
      origem: {
        tipo: 'fixo',
        label: 'Básico Casa',
      },
    },
  ]);

  // Reclassification state
  const [isReclassified, setIsReclassified] = useState(true);

  // Budget Limits
  const [supermercadoGasto, setSupermercadoGasto] = useState(3280);
  const supermercadoTeto = 2800;
  const [lazerGasto, setLazerGasto] = useState(1120);
  const lazerTeto = 1200;
  const carroGasto = 2150;
  const carroTeto = 2200;

  // Modals
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');

  // Calculations for active list
  const currentStoreItems = items.filter((it) => it.store === activeStore);
  const totalItemsCount = currentStoreItems.length;
  const boughtItemsCount = currentStoreItems.filter((it) => it.comprado).length;
  const subtotalBought = currentStoreItems
    .filter((it) => it.comprado)
    .reduce((acc, curr) => acc + curr.preco, 0);

  // Toggle item check
  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, comprado: !it.comprado } : it))
    );
  };

  // Add Item via input or voice
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ShoppingListItem = {
      id: 'item-' + Date.now(),
      nome: newItemText.trim(),
      preco: 19.9,
      comprado: false,
      store: activeStore,
      origem: {
        tipo: 'manual',
        label: 'Adicionado pelo Casal',
      },
    };

    setItems((prev) => [newItem, ...prev]);
    setNewItemText('');
    showToast(`"${newItem.nome}" adicionado à lista do Casal!`);
  };

  // Trigger Voice Input
  const handleTriggerVoice = () => {
    setIsListening(true);
    showToast('Ouvindo comando de voz Alexa/Siri...');
    setTimeout(() => {
      setIsListening(false);
      const voiceItem: ShoppingListItem = {
        id: 'item-' + Date.now(),
        nome: 'Leite Integral 1L (Pack 12)',
        preco: 58.8,
        comprado: false,
        store: activeStore,
        origem: {
          tipo: 'alexa',
          label: 'Felipe via Alexa agora',
        },
      };
      setItems((prev) => [voiceItem, ...prev]);
      showToast('Adicionado via Alexa: "Leite Integral 1L (Pack 12)"');
    }, 1800);
  };

  // Toggle reclassification
  const handleToggleReclassification = () => {
    if (isReclassified) {
      setSupermercadoGasto((prev) => prev + 68);
      setLazerGasto((prev) => prev - 68);
      setIsReclassified(false);
      showToast('Reclassificação desfeita. Vinho mantido em Alimentação.');
    } else {
      setSupermercadoGasto((prev) => prev - 68);
      setLazerGasto((prev) => prev + 68);
      setIsReclassified(true);
      showToast('R$ 68,00 do Vinho transferido para Lazer com sucesso!');
    }
  };

  // Save new goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalTarget) return;

    const targetVal = parseFloat(newGoalTarget.replace(',', '.')) || 1000;
    const currentVal = parseFloat(newGoalCurrent.replace(',', '.')) || 0;

    const newGoal: FinancialGoal = {
      id: 'goal-' + Date.now(),
      titulo: newGoalTitle.trim(),
      valorAlvo: targetVal,
      valorPlanejado: targetVal,
      valorAtual: currentVal,
      periodo: 'mensal',
      tipoMeta: 'economia',
      descricao: 'Reserva & Patrimônio Casal Duarte',
    };

    if (onAddGoal) {
      onAddGoal(newGoal);
    }
    setShowAddGoalModal(false);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
    showToast(`Meta "${newGoal.titulo}" criada com sucesso!`);
  };

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0b1c30] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-[#cbd5e1] animate-in slide-in-from-top-4 w-11/12 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-[#a7f3d0] shrink-0" />
          <span className="flex-1 truncate">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Screens < 768px): UX matching Image 5                     */}
      {/* ========================================================================= */}
      <div id="metas-mobile-view" className="block md:hidden w-full max-w-md mx-auto px-1 pb-24">
        {/* Segmented Top Switcher: Lista de Compras vs Metas & Carro */}
        <div className="flex items-center p-1 bg-[#eff4ff] rounded-2xl mb-4 border border-[#dce9ff]">
          <button
            onClick={() => setActiveSubTab('compras')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'compras'
                ? 'bg-white text-[#006948] shadow-xs'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Lista de Compras</span>
          </button>
          <button
            onClick={() => setActiveSubTab('carro')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'carro'
                ? 'bg-white text-[#006948] shadow-xs'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Metas & Carro</span>
          </button>
        </div>

        {activeSubTab === 'compras' ? (
          <div className="space-y-4">
            {/* Banner Sincronização Ativa */}
            <div className="bg-white rounded-2xl p-3 border border-[#e5eeff] shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] flex items-center gap-1.5">
                    Sincronização Ativa
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                  </span>
                  <span className="text-[10px] text-[#565e74] block truncate">
                    Alexa & Siri conectados em tempo real
                  </span>
                </div>
              </div>
              <div className="flex -space-x-1.5 shrink-0">
                <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                  A
                </span>
                <span className="w-6 h-6 rounded-full bg-[#0284c7] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                  S
                </span>
              </div>
            </div>

            {/* Input por voz ou texto */}
            <form onSubmit={handleAddItem} className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerVoice}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer ${
                  isListening
                    ? 'bg-[#dc2626] text-white animate-pulse'
                    : 'bg-[#eff4ff] text-[#006194] hover:bg-[#dce9ff] border border-[#dce9ff]'
                }`}
                title="Falar comando de voz"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Adicionar por voz ou texto... (ex: 'café')"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-2xl bg-white border border-[#cbd5e1] text-xs text-[#0b1c30] focus:outline-hidden focus:border-[#006948] shadow-2xs placeholder:text-[#94a3b8]"
              />

              <button
                type="submit"
                className="w-11 h-11 rounded-2xl bg-[#006948] hover:bg-[#00563b] text-white flex items-center justify-center shrink-0 shadow-2xs cursor-pointer transition-colors"
                title="Adicionar item"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* Chips de Estabelecimentos */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => setActiveStore('atacadao')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeStore === 'atacadao'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#eff4ff] text-[#006194] border border-[#dce9ff]'
                }`}
              >
                <span>Atacadão</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeStore === 'atacadao' ? 'bg-white/20 text-white' : 'bg-white text-[#006194]'
                }`}>
                  12
                </span>
              </button>

              <button
                onClick={() => setActiveStore('drogasil')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeStore === 'drogasil'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#eff4ff] text-[#006194] border border-[#dce9ff]'
                }`}
              >
                <span>Drogasil</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeStore === 'drogasil' ? 'bg-white/20 text-white' : 'bg-white text-[#006194]'
                }`}>
                  4
                </span>
              </button>

              <button
                onClick={() => setActiveStore('sams')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeStore === 'sams'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#eff4ff] text-[#006194] border border-[#dce9ff]'
                }`}
              >
                <span>Sam's Club</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeStore === 'sams' ? 'bg-white/20 text-white' : 'bg-white text-[#006194]'
                }`}>
                  5
                </span>
              </button>
            </div>

            {/* Seção Itens Selecionados */}
            <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                <div>
                  <h3 className="font-display font-black text-sm text-[#0b1c30]">
                    Itens Selecionados
                  </h3>
                  <span className="text-[10px] text-[#565e74]">
                    Lista compartilhada do casal
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold inline-block mb-0.5">
                    {boughtItemsCount}/{totalItemsCount} comprados
                  </span>
                  <span className="font-mono font-bold text-xs text-[#006948] block">
                    Subtotal: {formatBRL(subtotalBought)}
                  </span>
                </div>
              </div>

              {/* Lista de Itens */}
              <div className="space-y-2">
                {currentStoreItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      item.comprado
                        ? 'bg-[#f8faff] border-[#e5eeff] opacity-80'
                        : 'bg-white border-[#cbd5e1] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          item.comprado
                            ? 'bg-[#006948] text-white'
                            : 'border-2 border-[#94a3b8] bg-white'
                        }`}
                      >
                        {item.comprado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <span className={`text-xs font-bold block truncate ${
                          item.comprado ? 'text-[#565e74] line-through' : 'text-[#0b1c30]'
                        }`}>
                          {item.nome}
                        </span>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-[#eff4ff] text-[#006194] text-[9px] font-medium flex items-center gap-1">
                            <span>✨</span>
                            {item.origem.label}
                          </span>
                          {item.origem.subtag && (
                            <span className="px-1.5 py-0.2 rounded bg-[#fef3c7] text-[#92400e] text-[9px] font-bold">
                              ★ {item.origem.subtag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs text-[#0b1c30] shrink-0">
                      {formatBRL(item.preco)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Auditoria & IA */}
            <div className="bg-[#eff4ff] rounded-3xl p-4 border border-[#dce9ff] shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#dce9ff]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#006194] text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-[#0b1c30]">Auditoria & IA</h4>
                    <p className="text-[10px] text-[#565e74]">Reconciliação do último cupom</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] text-[10px] font-bold border border-[#86efac]">
                  Cupom Lido
                </span>
              </div>

              <div className="pt-3 pb-2 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-[#565e74] font-medium block">Aderência à Lista</span>
                  <span className="font-display font-black text-2xl text-[#006948] font-mono">82%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#0b1c30] block">10 planejados</span>
                  <span className="text-[10px] font-bold text-[#dc2626]">2 impulsos detectados</span>
                </div>
              </div>

              <div
                onClick={handleToggleReclassification}
                className="mt-2 p-3 rounded-2xl bg-white border border-[#dce9ff] flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#0b1c30] truncate">Vinho Chileno Tinto</span>
                      <span className="font-mono font-bold text-xs text-[#dc2626]">R$ 68,00</span>
                    </div>
                    <p className="text-[10px] text-[#565e74] truncate mt-0.5">
                      {isReclassified
                        ? 'Reclassificado de Alimentação para Lazer para proteger o teto.'
                        : 'Toque para mover de Alimentação para Lazer.'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 ${
                  isReclassified ? 'bg-[#ecfdf5] text-[#006948]' : 'bg-[#eff4ff] text-[#006194]'
                }`}>
                  {isReclassified ? 'Ajustado' : 'Reclassificar'}
                </span>
              </div>
            </div>

            {/* Tetos do Mês */}
            <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#006948]" />
                  <h4 className="font-display font-bold text-xs text-[#0b1c30]">Tetos do Mês</h4>
                </div>
                <span className="text-[10px] text-[#565e74] font-medium">{selectedMonth}</span>
              </div>

              <div className="space-y-3.5">
                {/* Supermercado */}
                <div>
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="font-bold text-[#0b1c30]">Supermercado</span>
                    <span className="font-mono text-[11px]">
                      <strong className="text-[#dc2626]">{formatBRL(supermercadoGasto)}</strong>
                      <span className="text-[#565e74]"> / {formatBRL(supermercadoTeto)}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#fee2e2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#dc2626] rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] mt-1 text-[#dc2626] font-bold">
                    <span>⚠ Excedido em {formatBRL(supermercadoGasto - supermercadoTeto)}</span>
                    <span>117% utilizado</span>
                  </div>
                </div>

                {/* Carro Jeep Compass */}
                <div>
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="font-bold text-[#0b1c30]">Carro (Combustível + Seguro)</span>
                    <span className="font-mono text-[11px]">
                      <strong className="text-[#0b1c30]">{formatBRL(carroGasto)}</strong>
                      <span className="text-[#565e74]"> / {formatBRL(carroTeto)}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006948] rounded-full"
                      style={{ width: `${Math.min(100, (carroGasto / carroTeto) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="text-[#006948] font-bold">✓ Dentro do teto planejado</span>
                    <span className="text-[#565e74] font-medium">R$ 50,00 livres</span>
                  </div>
                </div>

                {/* Lazer & Saídas */}
                <div>
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="font-bold text-[#0b1c30]">Lazer & Saídas</span>
                    <span className="font-mono text-[11px]">
                      <strong className="text-[#0b1c30]">{formatBRL(lazerGasto)}</strong>
                      <span className="text-[#565e74]"> / {formatBRL(lazerTeto)}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0b1c30] rounded-full"
                      style={{ width: `${Math.min(100, (lazerGasto / lazerTeto) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="text-[#565e74] font-medium">🔄 {formatBRL(lazerTeto - lazerGasto)} disponíveis</span>
                    <span className="text-[#565e74] font-bold">
                      {Math.round((lazerGasto / lazerTeto) * 100)}% utilizado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* activeSubTab === 'carro' */
          <div className="space-y-4">
            {/* Card Jeep Compass */}
            <div className="bg-gradient-to-br from-[#0b1c30] to-[#1e3a5f] rounded-3xl p-5 text-white shadow-md border border-[#234567]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm">Jeep Compass Longitude Turbo</h3>
                    <p className="text-[10px] text-white/70">Placa DUA-2026 • Flex / Gasolina</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#16a34a]/20 text-[#4ade80] text-[10px] font-bold border border-[#16a34a]/40">
                  Em Dia
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] text-white/60 block">Odômetro</span>
                  <span className="font-mono font-bold text-xs text-white">42.850 km</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] text-white/60 block">Autonomia</span>
                  <span className="font-mono font-bold text-xs text-white">520 km</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] text-white/60 block">Consumo Médio</span>
                  <span className="font-mono font-bold text-xs text-[#4ade80]">9.8 km/L</span>
                </div>
              </div>
            </div>

            {/* Metas de Economia do Casal */}
            <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-[#006948]" />
                  <h4 className="font-display font-bold text-xs text-[#0b1c30]">
                    Metas & Sonhos do Casal ({goals.length})
                  </h4>
                </div>
                <button
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-[#006948] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova Meta</span>
                </button>
              </div>

              <div className="space-y-3">
                {goals.map((g) => {
                  const pct = Math.min(100, Math.round(((g.valorAtual || 0) / (g.valorAlvo || 1)) * 100));
                  return (
                    <div key={g.id} className="p-3 rounded-2xl bg-[#f8faff] border border-[#e5eeff]">
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="font-bold text-[#0b1c30]">{g.titulo}</span>
                        <span className="font-mono text-[11px] font-bold text-[#006948]">
                          {formatBRL(g.valorAtual || 0)} / {formatBRL(g.valorAlvo || 0)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#e5eeff] rounded-full overflow-hidden">
                        <div className="h-full bg-[#006948] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#565e74] mt-1">
                        <span>{pct}% conquistado</span>
                        <span>Faltam {formatBRL((g.valorAlvo || 0) - (g.valorAtual || 0))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Abastecimentos Recentes do Jeep */}
            <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-[#006194]" />
                  <h4 className="font-display font-bold text-xs text-[#0b1c30]">
                    Abastecimentos Recentes
                  </h4>
                </div>
                <span className="text-[10px] text-[#006194] font-bold">
                  {(fuelLogs || []).length} registros
                </span>
              </div>

              <div className="space-y-2">
                {(fuelLogs || []).slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-2xl bg-[#f8faff] border border-[#e5eeff] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#0b1c30] block truncate">
                        {log.posto || 'Posto de Combustível'}
                      </span>
                      <span className="text-[10px] text-[#565e74]">
                        {log.data} • {log.litros}L ({log.tipoCombustivel})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#0b1c30] shrink-0">
                      {formatBRL(log.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Exact matches image.png               */}
      {/* ========================================================================= */}
      <div id="metas-desktop-view" className="hidden md:block">
        <GoalsDesktopView
          isReclassified={isReclassified}
          onToggleReclassification={handleToggleReclassification}
          onShowToast={showToast}
          onOpenAddGoal={() => setShowAddGoalModal(true)}
          goals={goals}
          transactions={transactions}
          selectedMonth={selectedMonth}
          onAddGoal={onAddGoal}
          onUpdateGoal={onUpdateGoal}
          fuelLogs={fuelLogs}
          onAddFuelLog={onAddFuelLog}
          onUpdateFuelLog={onUpdateFuelLog}
          onDeleteFuelLog={onDeleteFuelLog}
        />
      </div>
      {/* ========================================================================= */}
      {/* MODAL: Nova Meta Financeira do Casal                                      */}
      {/* ========================================================================= */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Nova Meta do Casal
              </h3>
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="flex flex-col gap-3.5 pt-3">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reforma da Cozinha"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Valor Alvo (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 15000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Valor Já Acumulado (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 3000"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#005a3c] text-white hover:bg-[#00472f]"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
