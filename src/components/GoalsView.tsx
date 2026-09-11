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
import { FinancialGoal } from '../types';
import { formatBRL } from '../utils/formatters';

interface GoalsViewProps {
  goals?: FinancialGoal[];
  onAddGoal?: (goal: FinancialGoal) => void;
  onUpdateGoal?: (goal: FinancialGoal) => void;
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
  onAddGoal,
  onUpdateGoal,
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
        label: 'Guilherme via Alexa 08:30',
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
        label: 'Mariana via Siri 14:15',
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
          label: 'Guilherme via Alexa agora',
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
      {/* 1. MOBILE VIEW (Screens < 768px): Exact matches image.png                 */}
      {/* ========================================================================= */}
      <div id="metas-mobile-view" className="block md:hidden w-full max-w-md mx-auto pb-24">
        {/* TOP SEGMENTED SWITCHER: Lista de Compras vs Metas & Carro */}
        <div className="bg-[#eff4ff] p-1 rounded-2xl flex items-center gap-1 border border-[#dce9ff] mb-4">
          <button
            id="mobile-tab-switcher-compras"
            onClick={() => setActiveSubTab('compras')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'compras'
                ? 'bg-white text-[#006948] shadow-xs border border-[#dce9ff]'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-[#006948]" />
            <span>Lista de Compras</span>
          </button>

          <button
            id="mobile-tab-switcher-metas-carro"
            onClick={() => setActiveSubTab('carro')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'carro'
                ? 'bg-white text-[#006948] shadow-xs border border-[#dce9ff]'
                : 'text-[#565e74] hover:text-[#0b1c30]'
            }`}
          >
            <Car className="w-4 h-4 text-[#565e74]" />
            <span>Metas & Carro</span>
          </button>
        </div>

        {/* SUBTAB 1: LISTA DE COMPRAS (image.png 1:1) */}
        {activeSubTab === 'compras' && (
          <div className="flex flex-col gap-4">
            {/* Card: Sincronização Ativa */}
            <div className="bg-white rounded-3xl p-3.5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center border border-[#a7f3d0] shrink-0">
                  <RefreshCw className="w-5 h-5 text-[#006948]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-display font-bold text-xs text-[#0b1c30]">
                    <span>Sincronização Ativa</span>
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] inline-block animate-pulse shrink-0" />
                  </div>
                  <span className="text-[11px] text-[#565e74] block truncate mt-0.5">
                    Alexa & Siri conectados em tempo real
                  </span>
                </div>
              </div>

              <div className="flex items-center -space-x-2 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#dae2fd] text-[#006194] font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs">
                  A
                </div>
                <div className="w-7 h-7 rounded-full bg-[#006194] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs">
                  S
                </div>
              </div>
            </div>

            {/* Input Bar: Mic + Input + Green Button */}
            <form onSubmit={handleAddItem} className="flex items-center gap-2">
              <button
                type="button"
                id="btn-voice-shopping-mob"
                onClick={handleTriggerVoice}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-[#fee2e2] text-[#dc2626] animate-pulse border border-[#fca5a5]'
                    : 'bg-[#e0f2fe] text-[#0284c7] hover:bg-[#bae6fd]'
                }`}
                title="Adicionar por voz"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Adicionar por voz ou texto... (ex: 'ca..."
                className="flex-1 px-4 py-3 bg-white border border-[#e5eeff] rounded-2xl text-xs text-[#0b1c30] placeholder-[#565e74] shadow-2xs focus:outline-none focus:border-[#006948] transition-colors"
              />

              <button
                type="submit"
                id="btn-add-shopping-plus-mob"
                className="w-11 h-11 rounded-2xl bg-[#005a3c] text-white hover:bg-[#00472f] flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Adicionar"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

            {/* Store Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveStore('atacadao')}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                  activeStore === 'atacadao'
                    ? 'bg-[#005a3c] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#006194] hover:bg-[#e2edff]'
                }`}
              >
                <span>Atacadão</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeStore === 'atacadao' ? 'bg-white/20 text-white' : 'bg-[#dce9ff] text-[#006194]'}`}>
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStore('drogasil')}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                  activeStore === 'drogasil'
                    ? 'bg-[#005a3c] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#006194] hover:bg-[#e2edff]'
                }`}
              >
                <span>Drogasil</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeStore === 'drogasil' ? 'bg-white/20 text-white' : 'bg-[#dce9ff] text-[#006194]'}`}>
                  4
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStore('sams')}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                  activeStore === 'sams'
                    ? 'bg-[#005a3c] text-white shadow-xs'
                    : 'bg-[#eff4ff] text-[#006194] hover:bg-[#e2edff]'
                }`}
              >
                <span>Sam's Club</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeStore === 'sams' ? 'bg-white/20 text-white' : 'bg-[#dce9ff] text-[#006194]'}`}>
                  5
                </span>
              </button>
            </div>

            {/* Section: Itens Selecionados */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pt-1">
                <h2 className="font-display font-bold text-base text-[#0b1c30]">
                  Itens Selecionados
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0b1c30] text-[11px] font-semibold">
                    {boughtItemsCount}/{totalItemsCount} comprados
                  </span>
                  <span className="text-xs font-bold text-[#006948] font-mono">
                    Subtotal: {formatBRL(subtotalBought || 231.3)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {currentStoreItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.02)] flex items-start justify-between gap-3 cursor-pointer hover:border-[#cbd5e1] transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleItem(item.id);
                        }}
                        className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                      >
                        {item.comprado ? (
                          <div className="w-5 h-5 rounded-full bg-[#006948] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#e0f2fe] border border-[#bae6fd]" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold block truncate text-[#0b1c30]">
                          {item.nome}
                        </span>

                        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                          {item.origem.tipo === 'alexa' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#eef2ff] text-[#4338ca] text-[10px] font-semibold flex items-center gap-1 border border-[#e0e7ff]">
                              <Volume2 className="w-3 h-3" />
                              <span>{item.origem.label}</span>
                            </span>
                          )}

                          {item.origem.tipo === 'siri' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[10px] font-semibold flex items-center gap-1 border border-[#bae6fd]">
                              <Mic className="w-3 h-3" />
                              <span>{item.origem.label}</span>
                            </span>
                          )}

                          {item.origem.tipo === 'fixo' && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                                item.origem.label.includes('Proteína')
                                  ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                                  : item.origem.label.includes('Casa')
                                  ? 'bg-[#eff4ff] text-[#2563eb] border-[#dce9ff]'
                                  : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]'
                              }`}
                            >
                              <span>{item.origem.label}</span>
                            </span>
                          )}

                          {item.origem.tipo === 'manual' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-semibold border border-[#a7f3d0]">
                              <span>{item.origem.label}</span>
                            </span>
                          )}

                          {item.origem.subtag && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#4f46e5] text-[10px] font-semibold flex items-center gap-1 border border-[#dce9ff]">
                              <Star className="w-3 h-3 text-[#4f46e5]" />
                              <span>{item.origem.subtag}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-bold text-xs sm:text-sm text-[#0b1c30] font-mono shrink-0">
                      {formatBRL(item.preco)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Auditoria & IA */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006194] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Auditoria & IA
                    </h3>
                    <p className="text-[11px] text-[#565e74]">
                      Reconciliação do último cupom
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold border border-[#a7f3d0]">
                  Cupom Lido
                </span>
              </div>

              <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] mt-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#565e74] font-medium block">
                    Aderência à Lista
                  </span>
                  <span className="font-display font-extrabold text-3xl text-[#006948] font-mono leading-tight mt-0.5 block">
                    82%
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#565e74] font-medium block">
                    10 planejados
                  </span>
                  <span className="text-xs text-[#dc2626] font-bold block mt-0.5">
                    2 impulsos detectados
                  </span>
                </div>
              </div>

              <div
                onClick={handleToggleReclassification}
                className="bg-white rounded-2xl p-3 border border-[#e5eeff] mt-3 cursor-pointer hover:border-[#cbd5e1] transition-all"
                title="Clique para alternar reclassificação"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-[#565e74] shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">
                      Vinho Chileno Tinto
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#0b1c30] font-mono">
                    R$ 68,00
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] mt-1 pl-6 leading-relaxed">
                  Reclassificado de Alimentação para Lazer para proteger o teto de mercado.
                </p>
              </div>
            </div>

            {/* Card: Tetos do Mês */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#006948]" />
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    Tetos do Mês
                  </h3>
                </div>
                <span className="text-xs text-[#565e74] font-medium">
                  Março 2026
                </span>
              </div>

              {/* Supermercado */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#0b1c30]">Supermercado</span>
                  <span className="font-mono">
                    <span className="font-bold text-[#dc2626]">
                      {formatBRL(supermercadoGasto).replace(',00', '')}
                    </span>{' '}
                    <span className="text-[#565e74]">
                      / {formatBRL(supermercadoTeto).replace(',00', '')}
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-1.5">
                  <div className="h-full bg-[#dc2626] rounded-full w-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className="text-[#dc2626] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Excedido em {formatBRL(supermercadoGasto - supermercadoTeto)}</span>
                  </span>
                  <span className="text-[#565e74] font-medium">
                    {Math.round((supermercadoGasto / supermercadoTeto) * 100)}% utilizado
                  </span>
                </div>
              </div>

              {/* Carro */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#0b1c30] truncate pr-2">
                    Carro (Combustível + Seguro + Manutenção)
                  </span>
                  <span className="font-mono font-semibold text-[#0b1c30] shrink-0">
                    {formatBRL(carroGasto).replace(',00', '')} / {formatBRL(carroTeto).replace(',00', '')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-1.5">
                  <div className="h-full bg-[#005a3c] rounded-full w-[97%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className="text-[#006948] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Dentro do teto planejado</span>
                  </span>
                  <span className="text-[#565e74] font-semibold">
                    {formatBRL(carroTeto - carroGasto)} livres
                  </span>
                </div>
              </div>

              {/* Lazer */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#0b1c30]">Lazer & Saídas</span>
                  <span className="font-mono font-semibold text-[#0b1c30]">
                    {formatBRL(lazerGasto).replace(',00', '')} / {formatBRL(lazerTeto).replace(',00', '')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-1.5">
                  <div className="h-full bg-[#475569] rounded-full w-[93%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1.5">
                  <span className="text-[#565e74] font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 shrink-0" />
                    <span>{formatBRL(lazerTeto - lazerGasto)} disponíveis</span>
                  </span>
                  <span className="text-[#565e74] font-medium">
                    {Math.round((lazerGasto / lazerTeto) * 100)}% utilizado
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: METAS & CARRO (Mobile) */}
        {activeSubTab === 'carro' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Card: Veículo */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006948] text-white flex items-center justify-center">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Gestão Anual do Carro
                    </h3>
                    <span className="text-[11px] text-[#565e74]">Compass Limited • DUA-2026</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold border border-[#a7f3d0]">
                  Conta Única Casal
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-3.5">
                <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">IPVA 2026 (SP)</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[10px]">
                      3 de 5 Quitadas
                    </span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-display font-bold text-base text-[#0b1c30] font-mono">R$ 3.200,00</span>
                    <span className="text-[11px] text-[#565e74]">R$ 640,00/mês</span>
                  </div>
                  <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#006948] h-full rounded-full w-[60%]" />
                  </div>
                </div>

                <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">Seguro Cobertura Total</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#dae2fd] text-[#006194] font-bold text-[10px]">
                      Renovação Nov/26
                    </span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-display font-bold text-base text-[#0b1c30] font-mono">R$ 2.800,00</span>
                    <span className="text-[11px] text-[#565e74]">Provisionado R$ 233,33/mês</span>
                  </div>
                  <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#006194] h-full rounded-full w-[40%]" />
                  </div>
                </div>

                <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">Manutenção Preventiva</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[10px]">
                      Teto R$ 3.000
                    </span>
                  </div>
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="font-display font-bold text-base text-[#0b1c30] font-mono">R$ 650,00</span>
                    <span className="text-[11px] text-[#006948] font-semibold">Revisão 40k em dia</span>
                  </div>
                  <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#006948] h-full rounded-full w-[22%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Metas */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006948] text-white flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Metas Conjuntas do Casal
                    </h3>
                    <span className="text-[11px] text-[#565e74]">Patrimônio e Conquistas</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-2.5 py-1 rounded-full bg-[#005a3c] text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#00472f] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Meta</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-3.5">
                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">Reserva de Emergência</span>
                    <span className="text-xs font-bold text-[#006948]">83% atingido</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-xs">
                    <span className="font-bold text-[#006948] font-mono">R$ 41.500,00</span>
                    <span className="text-[#565e74] font-mono">Alvo: R$ 50.000,00</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-2">
                    <div className="h-full bg-[#006948] rounded-full w-[83%]" />
                  </div>
                </div>

                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">Viagem Europa 2026</span>
                    <span className="text-xs font-bold text-[#006194]">72% atingido</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-xs">
                    <span className="font-bold text-[#006194] font-mono">R$ 18.200,00</span>
                    <span className="text-[#565e74] font-mono">Alvo: R$ 25.000,00</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-2">
                    <div className="h-full bg-[#006194] rounded-full w-[72%]" />
                  </div>
                </div>

                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">Troca de Veículo Casal</span>
                    <span className="text-xs font-bold text-[#565e74]">46% atingido</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-xs">
                    <span className="font-bold text-[#565e74] font-mono">R$ 28.000,00</span>
                    <span className="text-[#565e74] font-mono">Alvo: R$ 60.000,00</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-2">
                    <div className="h-full bg-[#565e74] rounded-full w-[46%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Exact matches image.png               */}
      {/* ========================================================================= */}
      <GoalsDesktopView
        isReclassified={isReclassified}
        onToggleReclassification={handleToggleReclassification}
        onShowToast={showToast}
        onOpenAddGoal={() => setShowAddGoalModal(true)}
        goals={goals}
        onAddGoal={onAddGoal}
        onUpdateGoal={onUpdateGoal}
      />
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
