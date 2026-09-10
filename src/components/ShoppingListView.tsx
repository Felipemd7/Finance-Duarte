import React, { useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  FileText,
  Mic,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Store,
  Pill,
  ShoppingBag,
  Package,
  ChevronDown,
  ChevronUp,
  Wine,
  Cookie,
  Lightbulb,
  Plus,
  Radio,
  X,
  RefreshCw,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface ShoppingListViewProps {
  receipts?: any[];
}

interface Item {
  id: string;
  nome: string;
  quantidade: string;
  origem: string;
  categoria: string;
  classificacao: string;
  preco: number;
  subinfo: string;
  comprado: boolean;
  naoFaturado?: boolean;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = () => {
  // Active establishment selector
  const [activeEstablishment, setActiveEstablishment] = useState<
    'atacadao' | 'drogasil' | 'sams' | 'mercadolivre'
  >('atacadao');

  // Quick filter
  const [activeFilter, setActiveFilter] = useState<
    'todos' | 'essenciais' | 'conforto' | 'pendentes' | 'comprados'
  >('todos');

  // Category dropdown for new item
  const [newCategory, setNewCategory] = useState('Alimentos');
  const [newItemInput, setNewItemInput] = useState('');

  // Voice recording state / simulation
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accordion details
  const [showMoreItems, setShowMoreItems] = useState(false);

  // Category sort state
  const [isSortedByCategory, setIsSortedByCategory] = useState(false);

  // Reconciliation approval state
  const [reconciliationApproved, setReconciliationApproved] = useState(false);

  // Modal for All Reconciliations
  const [showAllReconciliationsModal, setShowAllReconciliationsModal] = useState(false);

  // Trigger Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Main items list matching image
  const [items, setItems] = useState<Item[]>([
    {
      id: 'item-1',
      nome: 'Azeite de Oliva Extra Virgem 500ml',
      quantidade: '2 un',
      origem: 'Guilherme via Alexa às 08:30',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 77.8,
      subinfo: '~R$ 38,90 / un',
      comprado: true,
    },
    {
      id: 'item-2',
      nome: 'Café Especial em Grãos 1kg',
      quantidade: '1 pct',
      origem: 'Mariana via Siri às 14:15',
      categoria: 'Bebidas',
      classificacao: 'Conforto / Gourmet',
      preco: 54.9,
      subinfo: 'Último: R$ 52,00',
      comprado: false,
      naoFaturado: true,
    },
    {
      id: 'item-3',
      nome: 'Detergente Lava-Louças Neutro 5L',
      quantidade: '1 galão',
      origem: 'Guilherme via Alexa às 09:12',
      categoria: 'Limpeza',
      classificacao: 'Invariável (Essencial)',
      preco: 29.9,
      subinfo: 'Est. R$ 29,90',
      comprado: false,
    },
    {
      id: 'item-4',
      nome: 'Filé de Peito de Frango-Sassami',
      quantidade: '3 kg',
      origem: 'Mariana via Siri ontem',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 62.7,
      subinfo: 'R$ 20,90 / kg',
      comprado: true,
    },
    {
      id: 'item-5',
      nome: 'Papel Higiênico Folha Tripla 24-rolos',
      quantidade: '1 fardo',
      origem: 'Guilherme via Alexa',
      categoria: 'Higiene',
      classificacao: 'Invariável (Essencial)',
      preco: 44.9,
      subinfo: 'Est. R$ 42,00',
      comprado: true,
    },
  ]);

  // Additional 7 planned items inside accordion
  const extraItems: Item[] = [
    {
      id: 'item-extra-1',
      nome: 'Arroz Branco Tipo 1 5kg',
      quantidade: '1 pct',
      origem: 'Guilherme via Alexa',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 29.9,
      subinfo: 'R$ 29,90 / un',
      comprado: true,
    },
    {
      id: 'item-extra-2',
      nome: 'Feijão Carioca Especial 1kg',
      quantidade: '2 pct',
      origem: 'Mariana via Siri',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 17.8,
      subinfo: 'R$ 8,90 / un',
      comprado: true,
    },
    {
      id: 'item-extra-3',
      nome: 'Leite Integral UHT 1L',
      quantidade: '12 un',
      origem: 'Guilherme via Alexa',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 58.8,
      subinfo: 'R$ 4,90 / un',
      comprado: true,
    },
    {
      id: 'item-extra-4',
      nome: 'Ovos Vermelhos Grandes 30un',
      quantidade: '1 bandeja',
      origem: 'Mariana via Siri',
      categoria: 'Alimento',
      classificacao: 'Invariável (Essencial)',
      preco: 22.9,
      subinfo: 'R$ 22,90 / un',
      comprado: true,
    },
    {
      id: 'item-extra-5',
      nome: 'Sabão em Pó Ação Total 2,4kg',
      quantidade: '1 cx',
      origem: 'Guilherme via Alexa',
      categoria: 'Limpeza',
      classificacao: 'Invariável (Essencial)',
      preco: 31.9,
      subinfo: 'R$ 31,90 / un',
      comprado: true,
    },
    {
      id: 'item-extra-6',
      nome: 'Desinfetante Floral 2L',
      quantidade: '1 frasco',
      origem: 'Mariana via Siri',
      categoria: 'Limpeza',
      classificacao: 'Invariável (Essencial)',
      preco: 14.5,
      subinfo: 'R$ 14,50 / un',
      comprado: true,
    },
    {
      id: 'item-extra-7',
      nome: 'Esponja Multiuso Pacote c/ 4',
      quantidade: '1 pct',
      origem: 'Guilherme via Alexa',
      categoria: 'Limpeza',
      classificacao: 'Invariável (Essencial)',
      preco: 6.9,
      subinfo: 'R$ 6,90 / un',
      comprado: true,
    },
  ];

  // Toggle item status
  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, comprado: !it.comprado } : it))
    );
  };

  // Add Item via form
  const handleInsertItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemInput.trim()) return;

    const newItem: Item = {
      id: 'item-' + Date.now(),
      nome: newItemInput.trim(),
      quantidade: '1 un',
      origem: 'Guilherme via Digitação Rápida',
      categoria: newCategory,
      classificacao: newCategory === 'Conforto/Lazer' ? 'Conforto / Gourmet' : 'Invariável (Essencial)',
      preco: 19.9,
      subinfo: 'Est. R$ 19,90',
      comprado: false,
    };

    setItems((prev) => [newItem, ...prev]);
    setNewItemInput('');
    triggerToast(`"${newItem.nome}" adicionado com sucesso!`);
  };

  // Voice Simulation
  const handleVoiceWaveClick = () => {
    setIsListening(true);
    triggerToast('Escutando comando de voz: "Alexa, adicionar leite à lista"...');
    setTimeout(() => {
      setIsListening(false);
      const voiceItem: Item = {
        id: 'item-voice-' + Date.now(),
        nome: 'Leite Desnatado 1L (6 un)',
        quantidade: '6 un',
        origem: 'Guilherme via Alexa Echo Dot',
        categoria: 'Alimento',
        classificacao: 'Invariável (Essencial)',
        preco: 29.4,
        subinfo: 'R$ 4,90 / un',
        comprado: false,
      };
      setItems((prev) => [voiceItem, ...prev]);
      triggerToast('Item reconhecido pela Alexa e sincronizado à lista!');
    }, 2000);
  };

  // Filter items
  const displayedItems = items
    .filter((it) => {
      if (activeFilter === 'todos') return true;
      if (activeFilter === 'essenciais') return it.classificacao.includes('Essencial');
      if (activeFilter === 'conforto') return it.classificacao.includes('Conforto');
      if (activeFilter === 'pendentes') return !it.comprado;
      if (activeFilter === 'comprados') return it.comprado;
      return true;
    })
    .sort((a, b) => {
      if (isSortedByCategory) {
        return a.categoria.localeCompare(b.categoria);
      }
      return 0;
    });

  // Approve reconciliation
  const handleApproveReconciliation = () => {
    setReconciliationApproved(true);
    triggerToast(
      'Reconciliação arquivada! R$ 487,90 debitado e rateado 50/50 (R$ 243,95 cada na NuConta).'
    );
  };

  return (
    <div
      id="lista-compras-view"
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 flex flex-col gap-6 font-sans animate-in fade-in duration-300"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0b1c30] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-[#cbd5e1] animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#a7f3d0] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER: Sync Alexa & Siri + Title + Counters                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Titles & Alexa/Siri Badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#006948] font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
              Sync Alexa & Siri Ativo
            </span>
            <span className="text-xs text-[#565e74] font-medium">•</span>
            <span className="text-xs text-[#565e74] font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#006194]" />
              Eco Dot Sala & iPhones Conectados
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Lista de Compras Inteligente & Auditoria de Hábitos
          </h1>

          <p className="text-xs sm:text-sm text-[#565e74] max-w-3xl leading-relaxed">
            Sincronização em tempo real com assistentes de voz, segregação por estabelecimentos e
            reconciliação automática contra comprovantes de notas fiscais via IA.
          </p>
        </div>

        {/* Right: Counter Pill Card (23 itens / Estimativa Total R$ 782,40) */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-2.5 sm:px-4 sm:py-2.5 flex items-center divide-x divide-[#e5eeff] shadow-2xs self-start md:self-auto">
          {/* Left sub-counter */}
          <div className="flex items-center gap-2.5 pr-3.5">
            <div className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#006948]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
                Itens Pendentes
              </span>
              <span className="font-display font-bold text-sm sm:text-base text-[#0b1c30] tnum">
                23 itens
              </span>
            </div>
          </div>

          {/* Right sub-counter */}
          <div className="flex items-center gap-2.5 pl-3.5">
            <div className="w-8 h-8 rounded-full bg-[#eff4ff] text-[#006194] flex items-center justify-center">
              <Receipt className="w-4 h-4 text-[#006194]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
                Estimativa Total
              </span>
              <span className="font-display font-bold text-sm sm:text-base text-[#0b1c30] tnum">
                R$ 782,40
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTABLISHMENT SELECTOR PILLS (Atacadão, Drogasil, Sam's Club, Mercado Livre) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Pill 1: Atacadão / Supermercado (ACTIVE) */}
        <button
          onClick={() => setActiveEstablishment('atacadao')}
          className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
            activeEstablishment === 'atacadao'
              ? 'bg-[#006948] text-white border-[#006948] shadow-sm ring-1 ring-[#006948]'
              : 'bg-white hover:bg-[#f8f9ff] text-[#0b1c30] border-[#e5eeff]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeEstablishment === 'atacadao'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#eff4ff] text-[#006948]'
              }`}
            >
              <Store className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">
                Atacadão / Supermercado
              </span>
              <span
                className={`text-[11px] truncate ${
                  activeEstablishment === 'atacadao' ? 'text-white/80' : 'text-[#565e74]'
                }`}
              >
                12 itens • Est. R$ 487,90
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              activeEstablishment === 'atacadao'
                ? 'bg-white/20 text-white'
                : 'bg-[#eff4ff] text-[#006948]'
            }`}
          >
            12
          </span>
        </button>

        {/* Pill 2: Drogasil / Farmácia */}
        <button
          onClick={() => setActiveEstablishment('drogasil')}
          className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
            activeEstablishment === 'drogasil'
              ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
              : 'bg-white hover:bg-[#f8f9ff] text-[#0b1c30] border-[#e5eeff]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeEstablishment === 'drogasil'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#eff4ff] text-[#006194]'
              }`}
            >
              <Pill className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Drogasil / Farmácia</span>
              <span
                className={`text-[11px] truncate ${
                  activeEstablishment === 'drogasil' ? 'text-white/80' : 'text-[#565e74]'
                }`}
              >
                4 itens • Est. R$ 112,00
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              activeEstablishment === 'drogasil'
                ? 'bg-white/20 text-white'
                : 'bg-[#eff4ff] text-[#006194]'
            }`}
          >
            4
          </span>
        </button>

        {/* Pill 3: Sam's Club */}
        <button
          onClick={() => setActiveEstablishment('sams')}
          className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
            activeEstablishment === 'sams'
              ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
              : 'bg-white hover:bg-[#f8f9ff] text-[#0b1c30] border-[#e5eeff]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeEstablishment === 'sams'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#eff4ff] text-[#006194]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Sam's Club</span>
              <span
                className={`text-[11px] truncate ${
                  activeEstablishment === 'sams' ? 'text-white/80' : 'text-[#565e74]'
                }`}
              >
                5 itens • Est. R$ 238,50
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              activeEstablishment === 'sams'
                ? 'bg-white/20 text-white'
                : 'bg-[#eff4ff] text-[#006194]'
            }`}
          >
            5
          </span>
        </button>

        {/* Pill 4: Mercado Livre / Casa */}
        <button
          onClick={() => setActiveEstablishment('mercadolivre')}
          className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
            activeEstablishment === 'mercadolivre'
              ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
              : 'bg-white hover:bg-[#f8f9ff] text-[#0b1c30] border-[#e5eeff]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeEstablishment === 'mercadolivre'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#eff4ff] text-[#006194]'
              }`}
            >
              <Package className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Mercado Livre / Casa</span>
              <span
                className={`text-[11px] truncate ${
                  activeEstablishment === 'mercadolivre' ? 'text-white/80' : 'text-[#565e74]'
                }`}
              >
                2 itens • Est. R$ 89,00
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              activeEstablishment === 'mercadolivre'
                ? 'bg-white/20 text-white'
                : 'bg-[#eff4ff] text-[#006194]'
            }`}
          >
            2
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TWO COLUMNS: Shopping List (Left) + Reconciliação Pós-Compra (Right)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Input + Filter + Itens no Atacadão (~62% width)           */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Card 1: Adicionar por voz ou digitação */}
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#006948]" />
                <span className="font-display font-bold text-sm text-[#0b1c30]">
                  Adicionar por voz ou digitação
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#565e74]">
                <span className="w-2 h-2 rounded-full bg-[#006948]" />
                <span>Alexa: "Alexa, adicione café à lista"</span>
              </div>
            </div>

            {/* Input Form Row */}
            <form onSubmit={handleInsertItem} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  placeholder="Ex: Azeite Extra Virgem 500ml 2 un, Deterg..."
                  className="w-full pl-3.5 pr-8 py-2 text-xs rounded-xl bg-[#f8f9ff] border border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#565e74] focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Category select */}
                <div className="relative">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-[#0b1c30] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="Alimentos">Alimentos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Conforto/Lazer">Conforto/Lazer</option>
                    <option value="Farmácia">Farmácia</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#565e74] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Voice waveform simulator button */}
                <button
                  type="button"
                  onClick={handleVoiceWaveClick}
                  title="Testar comando de voz"
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] animate-pulse'
                      : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] border-[#dce9ff]'
                  }`}
                >
                  <span className="font-mono text-sm tracking-tighter">|||||</span>
                </button>

                {/* Insert button */}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir</span>
                </button>
              </div>
            </form>

            {/* Quick Filter row */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#f1f5f9] text-xs">
              <span className="text-[11px] text-[#565e74] font-medium mr-1">Filtros rápidos:</span>

              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'todos'
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#f8f9ff] text-[#565e74] hover:bg-[#eff4ff]'
                }`}
              >
                Todos (12)
              </button>

              <button
                onClick={() => setActiveFilter('essenciais')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'essenciais'
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#f8f9ff] text-[#565e74] hover:bg-[#eff4ff]'
                }`}
              >
                Essenciais (8)
              </button>

              <button
                onClick={() => setActiveFilter('conforto')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'conforto'
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#f8f9ff] text-[#565e74] hover:bg-[#eff4ff]'
                }`}
              >
                Conforto/Lazer (4)
              </button>

              <button
                onClick={() => setActiveFilter('pendentes')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'pendentes'
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#f8f9ff] text-[#565e74] hover:bg-[#eff4ff]'
                }`}
              >
                Pendentes (10)
              </button>

              <button
                onClick={() => setActiveFilter('comprados')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'comprados'
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#f8f9ff] text-[#565e74] hover:bg-[#eff4ff]'
                }`}
              >
                Comprados (2)
              </button>
            </div>
          </div>

          {/* Card 2: Itens no Atacadão */}
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base text-[#0b1c30]">
                  Itens no Atacadão
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-[10px] font-medium">
                  Sincronizado há 2 min
                </span>
              </div>

              <button
                onClick={() => setIsSortedByCategory(!isSortedByCategory)}
                className="text-xs text-[#006194] hover:text-[#004e76] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>{isSortedByCategory ? 'Ordem Padrão' : 'Ordenar por Categoria'}</span>
              </button>
            </div>

            {/* List of items */}
            <div className="flex flex-col gap-2.5">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    item.comprado
                      ? 'bg-[#f8f9ff] border-[#e5eeff]'
                      : 'bg-white border-[#cbd5e1]'
                  }`}
                >
                  {/* Left checkbox & text */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        item.comprado
                          ? 'bg-[#006948] text-white'
                          : 'border-2 border-[#cbd5e1] hover:border-[#006948]'
                      }`}
                    >
                      {item.comprado && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold truncate ${
                            item.comprado ? 'text-[#0b1c30]' : 'text-[#0b1c30]'
                          }`}
                        >
                          {item.nome}
                        </span>

                        <span className="px-1.5 py-0.5 rounded-md bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                          {item.quantidade}
                        </span>

                        {item.naoFaturado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[9px] font-bold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Não faturado no cupom
                          </span>
                        )}
                      </div>

                      {/* Sub-badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-[10px] text-[#006948] font-semibold bg-[#ecfdf5] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Mic className="w-2.5 h-2.5" />
                          {item.origem}
                        </span>

                        <span className="text-[10px] text-[#565e74] bg-[#f1f5f9] px-1.5 py-0.5 rounded font-medium">
                          {item.categoria}
                        </span>

                        <span className="text-[10px] text-[#006948] bg-[#ecfdf5] px-1.5 py-0.5 rounded font-medium">
                          {item.classificacao}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Price block */}
                  <div className="flex flex-col items-end text-right shrink-0">
                    <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30] tnum">
                      {formatBRL(item.preco)}
                    </span>
                    <span className="text-[10px] text-[#565e74]">{item.subinfo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Accordion / Expandable banner for the 7 additional items */}
            <div className="mt-1 pt-2 border-t border-[#f1f5f9]">
              <button
                onClick={() => setShowMoreItems(!showMoreItems)}
                className="w-full p-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#006194]" />
                  <span>
                    Mais 7 itens planejados adicionados ao carrinho e validados pela leitura do cupom.
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>{showMoreItems ? 'Ocultar Detalhes' : 'Expandir Detalhes'}</span>
                  {showMoreItems ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {/* Extra Items List */}
              {showMoreItems && (
                <div className="mt-2 flex flex-col gap-2 animate-in fade-in">
                  {extraItems.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#006948] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-[#0b1c30]">{ex.nome}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#eff4ff] text-[10px] text-[#006194] font-bold">
                          {ex.quantidade}
                        </span>
                        <span className="text-[10px] text-[#565e74] bg-[#f1f5f9] px-1.5 py-0.5 rounded">
                          {ex.categoria}
                        </span>
                      </div>
                      <div className="font-bold text-[#0b1c30] tnum">{formatBRL(ex.preco)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Reconciliação Pós-Compra (~38% width)                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col justify-between shadow-2xs gap-4">
            {/* Title Header */}
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#006948]" />
                </div>
                <h2 className="font-display font-bold text-base text-[#0b1c30]">
                  Reconciliação Pós-Compra
                </h2>
              </div>
              <p className="text-xs text-[#565e74] mt-1 leading-relaxed">
                Auditoria autônoma de cupom fiscal com cruzamento preditivo de intenção x realidade.
              </p>

              {/* NFC-e Card (Green IA Badge + Value R$ 487,90) */}
              <div className="mt-3.5 p-3.5 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#dce9ff] text-[#006948] flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#0b1c30]">NFC-e Atacadão #92819</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-[#a7f3d0] text-[#006948] font-bold text-[9px]">
                        Lido via IA
                      </span>
                    </div>
                    <span className="text-[10px] text-[#565e74] mt-0.5">
                      24/03/2026 • 19:42 • Chave 3526...0192
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="font-display font-black text-base sm:text-lg text-[#0b1c30] tnum">
                    R$ 487,90
                  </span>
                  <span className="text-[10px] text-[#565e74]">12 Itens Processados</span>
                </div>
              </div>

              {/* Aderência à Lista (Circular Ring + 3 metrics) */}
              <div className="mt-3.5 p-3.5 bg-[#f8f9ff] border border-[#dce9ff] rounded-xl flex flex-col gap-3">
                {/* Circular ring row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
                      ADERÊNCIA À LISTA
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-display font-black text-2xl sm:text-3xl text-[#006948] tnum">
                        82%
                      </span>
                      <span className="text-xs text-[#565e74] font-medium">de fidelidade</span>
                    </div>
                  </div>

                  {/* SVG Circular Ring Gauge (82%) */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <path
                        className="text-[#dce9ff]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* 82% stroke */}
                      <path
                        className="text-[#006948]"
                        strokeDasharray="82, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-bold text-[11px] text-[#006948]">82%</span>
                  </div>
                </div>

                {/* 3 Metrics sub-grid: Planejadas, Faltantes, Impulso */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#dce9ff]/60 text-center">
                  <div className="flex flex-col bg-white p-2 rounded-lg border border-[#e5eeff]">
                    <span className="text-[9px] uppercase font-bold text-[#565e74]">PLANEJADAS</span>
                    <span className="font-display font-bold text-xs text-[#0b1c30] mt-0.5">
                      10 itens
                    </span>
                    <span className="text-[10px] text-[#565e74]">R$ 375,50</span>
                  </div>

                  <div className="flex flex-col bg-white p-2 rounded-lg border border-[#e5eeff]">
                    <span className="text-[9px] uppercase font-bold text-[#565e74]">FALTANTES</span>
                    <span className="font-display font-bold text-xs text-[#006194] mt-0.5">
                      2 itens
                    </span>
                    <span className="text-[10px] text-[#565e74]">R$ 84,80</span>
                  </div>

                  <div className="flex flex-col bg-[#ffdad6]/40 p-2 rounded-lg border border-[#ffdad6]">
                    <span className="text-[9px] uppercase font-bold text-[#ba1a1a]">IMPULSO</span>
                    <span className="font-display font-bold text-xs text-[#ba1a1a] mt-0.5">
                      2 extras
                    </span>
                    <span className="text-[10px] font-bold text-[#ba1a1a]">R$ 82,90</span>
                  </div>
                </div>
              </div>

              {/* Itens Extras Não Previstos (Compras por Impulso) */}
              <div className="mt-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                    Itens Extras Não Previstos (Compras por Impulso)
                  </span>
                  <span className="text-xs font-bold text-[#ba1a1a]">R$ 82,90</span>
                </div>

                {/* Extra Item 1: Vinho Tinto */}
                <div className="p-2.5 rounded-xl bg-[#ffdad6]/25 border border-[#ffdad6] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                      <Wine className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0b1c30]">
                        Vinho Tinto Chileno Reserva 750ml
                      </span>
                      <span className="text-[10px] text-[#565e74]">
                        Item de Lazer fora da lista de supermercado
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right shrink-0">
                    <span className="font-bold text-xs text-[#ba1a1a]">R$ 68,00</span>
                    <span className="text-[9px] text-[#ba1a1a] font-semibold">Impulso #1</span>
                  </div>
                </div>

                {/* Extra Item 2: Biscoito Recheado */}
                <div className="p-2.5 rounded-xl bg-[#ffdad6]/25 border border-[#ffdad6] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                      <Cookie className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0b1c30]">
                        Biscoito Recheado Importado 200g
                      </span>
                      <span className="text-[10px] text-[#565e74]">Snack adicionado no caixa</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right shrink-0">
                    <span className="font-bold text-xs text-[#ba1a1a]">R$ 14,90</span>
                    <span className="text-[9px] text-[#ba1a1a] font-semibold">Impulso #2</span>
                  </div>
                </div>
              </div>

              {/* Box: Alocação Proativa de Orçamento */}
              <div className="mt-3.5 p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#006194] shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs leading-relaxed text-[#565e74]">
                  <span className="font-bold text-[#0b1c30]">Alocação Proativa de Orçamento</span>
                  <span>
                    Atenção: Os <strong className="text-[#0b1c30]">R$ 68,00</strong> gastos com vinho
                    não constavam na lista de supermercado e foram alocados automaticamente para o
                    teto de <strong className="text-[#0b1c30]">"Lazer & Gastronomia"</strong> para
                    blindar a meta de alimentação essencial do casal.
                  </span>
                </div>
              </div>

              {/* Note: Itens esquecidos no próximo ciclo */}
              <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-[#f8f9ff] text-xs text-[#565e74]">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#006194]" />
                  <span>2 itens esquecidos permanecerão ativos na lista do próximo ciclo:</span>
                </div>
                <span className="font-bold text-[#006194] bg-[#eff4ff] px-2 py-0.5 rounded">
                  Café & Sabão
                </span>
              </div>
            </div>

            {/* Action Button: Aprovar Reconciliação e Arquivar Itens */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleApproveReconciliation}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
                  reconciliationApproved
                    ? 'bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]'
                    : 'bg-[#006948] hover:bg-[#00563b] text-white'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {reconciliationApproved
                    ? '✓ Reconciliação Aprovada & Balanço Atualizado'
                    : 'Aprovar Reconciliação e Arquivar Itens'}
                </span>
              </button>
              <span className="text-[11px] text-center text-[#565e74]">
                Atualiza o balanço compartilhado e o extrato bancário 50/50 em 1 clique.
              </span>
            </div>

            {/* Split Footer: Rateio do Cupom Atacadão R$ 243,95 cada */}
            <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#006948] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                    G
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#006194] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                    M
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-xs text-[#0b1c30]">Rateio do Cupom Atacadão</span>
                  <span className="text-[10px] text-[#565e74]">Divisão Paritária 50/50</span>
                </div>
              </div>

              <div className="flex flex-col items-end text-right">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30] tnum">
                  R$ 243,95 cada
                </span>
                <span className="text-[10px] text-[#006948] font-semibold">Liquidado via NuConta</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOWER SECTION: EVOLUÇÃO COMPORTAMENTAL DO CASAL                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006948] block">
              EVOLUÇÃO COMPORTAMENTAL DO CASAL
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#0b1c30]">
              Histórico de Reconciliações Anteriores & Redução de Impulso
            </h2>
            <p className="text-xs text-[#565e74] mt-0.5">
              Acompanhamento mensal da disciplina de compras. A taxa de impulsividade caiu de 24%
              para apenas 8% nos últimos 6 meses.
            </p>
          </div>

          {/* Green Savings banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-bold text-[#006948] self-start sm:self-auto shadow-2xs">
            <ShoppingBag className="w-4 h-4 text-[#006948]" />
            <span>Economia acumulada com auditoria: R$ 1.420,00</span>
          </div>
        </div>

        {/* Lower Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Card: Taxa de Gastos Não Previstos (Bar Chart 6 months) (~65% width) */}
          <div className="lg:col-span-7 bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col justify-between shadow-2xs gap-4">
            <div>
              {/* Header with Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30]">
                  Taxa de Gastos Não Previstos (% do Total Gasto)
                </span>

                <div className="flex items-center gap-3 text-[11px] text-[#565e74]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dce9ff]" />
                    Compras Planejadas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006948]" />
                    Itens Impulsivos Auditados
                  </span>
                </div>
              </div>

              {/* 6-month visual stacked bars */}
              <div className="grid grid-cols-6 gap-2 sm:gap-4 mt-6 items-end h-44 pb-2 border-b border-[#f1f5f9]">
                {/* Out 25: 24% */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-[#ba1a1a]">24%</span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#dce9ff]/60 flex flex-col justify-end overflow-hidden p-0.5">
                    <div className="w-full h-[24%] bg-[#ba1a1a] rounded" />
                  </div>
                  <span className="text-[10px] text-[#565e74] font-semibold">Out 25</span>
                </div>

                {/* Nov 25: 21% */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-[#ba1a1a]">21%</span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#dce9ff]/60 flex flex-col justify-end overflow-hidden p-0.5">
                    <div className="w-full h-[21%] bg-[#ba1a1a] rounded" />
                  </div>
                  <span className="text-[10px] text-[#565e74] font-semibold">Nov 25</span>
                </div>

                {/* Dez 25: 18% */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-[#006194]">18%</span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#dce9ff]/60 flex flex-col justify-end overflow-hidden p-0.5">
                    <div className="w-full h-[18%] bg-[#006194] rounded" />
                  </div>
                  <span className="text-[10px] text-[#565e74] font-semibold">Dez 25</span>
                </div>

                {/* Jan 26: 14% */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-[#006948]">14%</span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#dce9ff]/60 flex flex-col justify-end overflow-hidden p-0.5">
                    <div className="w-full h-[14%] bg-[#006948] rounded" />
                  </div>
                  <span className="text-[10px] text-[#565e74] font-semibold">Jan 26</span>
                </div>

                {/* Fev 26: 11% */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-[#006948]">11%</span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#dce9ff]/60 flex flex-col justify-end overflow-hidden p-0.5">
                    <div className="w-full h-[11%] bg-[#006948] rounded" />
                  </div>
                  <span className="text-[10px] text-[#565e74] font-semibold">Fev 26</span>
                </div>

                {/* Mar 26: 8% ✨ HIGHLIGHT */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5">
                  <span className="text-[10px] font-black text-[#006948] flex items-center gap-0.5">
                    8% ✨
                  </span>
                  <div className="w-full max-w-[42px] h-32 rounded-lg bg-[#ecfdf5] border-2 border-[#006948] flex flex-col justify-end overflow-hidden p-0.5 shadow-xs">
                    <div className="w-full h-[8%] bg-[#006948] rounded" />
                  </div>
                  <span className="text-[10px] text-[#006948] font-bold">Mar 26</span>
                </div>
              </div>
            </div>

            {/* Bottom Meta info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
              <span className="text-[#565e74]">
                Meta de autocontrole estipulada pelo casal:{' '}
                <strong className="text-[#0b1c30]">menor que 10%</strong>
              </span>

              <span className="text-[#006948] font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#006948]" />
                Meta batida por 2 meses consecutivos!
              </span>
            </div>
          </div>

          {/* Right Card: Últimas Reconciliações (~35% width) */}
          <div className="lg:col-span-5 bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col justify-between shadow-2xs gap-3">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                <span className="font-display font-bold text-sm text-[#0b1c30]">
                  Últimas Reconciliações
                </span>
                <button
                  onClick={() => setShowAllReconciliationsModal(true)}
                  className="text-xs text-[#006194] hover:text-[#004e76] font-semibold cursor-pointer"
                >
                  Ver Todas
                </button>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2.5 mt-3">
                {/* 1. Sam's Club */}
                <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0b1c30]">Sam's Club #8812</span>
                      <span className="text-[10px] text-[#565e74]">18/03 • 91% aderência</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="font-display font-bold text-xs text-[#0b1c30] tnum">
                      R$ 614,20
                    </span>
                    <span className="text-[10px] text-[#006948] font-semibold">0 impulsos</span>
                  </div>
                </div>

                {/* 2. Drogasil Jardins */}
                <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0b1c30]">Drogasil Jardins</span>
                      <span className="text-[10px] text-[#565e74]">12/03 • 100% aderência</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="font-display font-bold text-xs text-[#0b1c30] tnum">
                      R$ 138,40
                    </span>
                    <span className="text-[10px] text-[#006948] font-semibold">100% planejado</span>
                  </div>
                </div>

                {/* 3. Carrefour Bairro */}
                <div className="p-2.5 rounded-xl bg-[#ffdad6]/20 border border-[#ffdad6] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0b1c30]">Carrefour Bairro</span>
                      <span className="text-[10px] text-[#565e74]">04/03 • 68% aderência</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="font-display font-bold text-xs text-[#0b1c30] tnum">
                      R$ 94,10
                    </span>
                    <span className="text-[10px] text-[#ba1a1a] font-bold">+R$ 32 impulso</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lightbulb callout */}
            <div className="p-3 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-start gap-2.5 text-xs text-[#565e74]">
              <Lightbulb className="w-4 h-4 text-[#006194] shrink-0 mt-0.5" />
              <span>
                Ao não ir com fome ao mercado, compras de impulso diminuíram{' '}
                <strong className="text-[#0b1c30]">63%</strong> entre Guilherme e Mariana.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Ver Todas as Reconciliações                                        */}
      {/* ========================================================================= */}
      {showAllReconciliationsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#e5eeff] shadow-xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#006948]" />
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Histórico Completo de Reconciliações
                </h3>
              </div>
              <button
                onClick={() => setShowAllReconciliationsModal(false)}
                className="text-[#565e74] hover:text-[#0b1c30]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">NFC-e Atacadão #92819</span>
                  <div className="text-[10px] text-[#565e74]">24/03/2026 • 82% fidelidade</div>
                </div>
                <span className="font-bold text-[#0b1c30]">R$ 487,90</span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">Sam's Club #8812</span>
                  <div className="text-[10px] text-[#565e74]">18/03/2026 • 91% fidelidade</div>
                </div>
                <span className="font-bold text-[#0b1c30]">R$ 614,20</span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">Drogasil Jardins #4301</span>
                  <div className="text-[10px] text-[#565e74]">12/03/2026 • 100% fidelidade</div>
                </div>
                <span className="font-bold text-[#0b1c30]">R$ 138,40</span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">Carrefour Bairro #1982</span>
                  <div className="text-[10px] text-[#565e74]">04/03/2026 • 68% fidelidade</div>
                </div>
                <span className="font-bold text-[#0b1c30]">R$ 94,10</span>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30]">Pão de Açúcar #7721</span>
                  <div className="text-[10px] text-[#565e74]">26/02/2026 • 89% fidelidade</div>
                </div>
                <span className="font-bold text-[#0b1c30]">R$ 215,80</span>
              </div>
            </div>

            <button
              onClick={() => setShowAllReconciliationsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#006948] text-white text-xs font-bold transition-all hover:bg-[#00563b]"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOOTER BAR: Saúde Financeira do Mês & Copyright                           */}
      {/* ========================================================================= */}
      <footer className="w-full pt-4 mt-2 border-t border-[#e5eeff] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#565e74]">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 text-[#006948] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#006948]" />
            <span>Saúde Financeira do Mês:</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#006948] font-bold text-[11px]">
            Equilibrada (78% da Meta)
          </span>
          <span className="text-[#565e74]">•</span>
          <span className="text-[#565e74]">
            Controle Conjunto 50/50{' '}
            <strong className="text-[#006948]">R$ 14.850 / R$ 18.000</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-[#0b1c30] cursor-pointer">Auditoria Fiscal</span>
          <span className="hover:text-[#0b1c30] cursor-pointer">Regras de Rateio</span>
          <span className="hover:text-[#0b1c30] cursor-pointer">Exportar Relatório Mensal</span>
        </div>
      </footer>

      <div className="text-center text-[10px] text-[#565e74] pb-4">
        © 2026 Duarte Finanças
      </div>
    </div>
  );
};
