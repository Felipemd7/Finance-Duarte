import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Receipt as ReceiptIcon,
  FileText,
  Mic,
  MicOff,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
  Store,
  Pill,
  ShoppingBag,
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  Radio,
  X,
  RefreshCw,
  ListFilter,
  CheckCheck,
  Share2,
  Trash2,
  ExternalLink,
  Search,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Info,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';
import {
  fetchShoppingListFromCloud,
  addShoppingItemToCloud,
  toggleShoppingItemInCloud,
  batchToggleShoppingItemsInCloud,
  deleteShoppingItemInCloud,
} from '../services/supabaseService';
import { Receipt, Transaction } from '../types';

interface ShoppingListViewProps {
  receipts?: Receipt[];
  transactions?: Transaction[];
  onNavigateTab?: (tab: string) => void;
  onSaveReceiptDraft?: (receipt: Receipt) => Promise<boolean> | void;
}

export interface ShoppingItemUI {
  id: string;
  nome: string;
  quantidade: string;
  origem: string;
  categoria: string;
  classificacao: string;
  preco: number;
  subinfo: string;
  comprado: boolean;
  adicionadoPor: 'Felipe' | 'Genivânia';
  estabelecimentoTipo?: string;
  estabelecimentoNome?: string;
}

// Helper: Text normalization for fuzzy matching
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean stop-words & measurement tokens
const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'com', 'sem', 'para', 'tipo',
  'un', 'und', 'unidade', 'unidades', 'kg', 'g', 'gr', 'gramas', 'kilo', 'quilo',
  'l', 'lt', 'litro', 'litros', 'ml', 'pct', 'pcte', 'pacote', 'pacotes',
  'cx', 'caixa', 'caixas', 'lata', 'latas', 'garrafa', 'garrafas', 'bd', 'bandeja'
]);

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Semantic matching between list item and receipt item
function matchListItemToReceipt(shoppingName: string, receiptItems: any[]): { item: any; score: number } | null {
  const normShop = normalizeText(shoppingName);
  const shopTokens = tokenize(shoppingName);
  if (shopTokens.length === 0 && normShop.length === 0) return null;

  let bestMatch: any = null;
  let bestScore = 0;

  for (const rItem of receiptItems) {
    const rawName = rItem.nome || rItem.nome_do_item || rItem.descricao || rItem.descricao_item || '';
    const normReceipt = normalizeText(rawName);
    const receiptTokens = tokenize(rawName);

    // 1. Direct substring match
    if (normReceipt.includes(normShop) || (normShop.length >= 4 && normReceipt.includes(normShop))) {
      return { item: rItem, score: 1.0 };
    }

    // 2. Token overlap score
    if (shopTokens.length > 0) {
      let matchedCount = 0;
      for (const t of shopTokens) {
        if (normReceipt.includes(t) || receiptTokens.some((rt) => rt.includes(t) || t.includes(rt))) {
          matchedCount++;
        }
      }
      const score = matchedCount / shopTokens.length;
      if (score >= 0.5 && score > bestScore) {
        bestScore = score;
        bestMatch = rItem;
      }
    }
  }

  return bestScore >= 0.5 ? { item: bestMatch, score: bestScore } : null;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  receipts = [],
  transactions = [],
  onNavigateTab,
}) => {
  // 1. List Items State
  const [items, setItems] = useState<ShoppingItemUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Form Inputs
  const [newItemInput, setNewItemInput] = useState('');
  const [newQuantityInput, setNewQuantityInput] = useState('1 un');
  const [newCategory, setNewCategory] = useState('Alimentos');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [userAuthor, setUserAuthor] = useState<'Felipe' | 'Genivânia'>('Felipe');

  // 3. Filters & Search
  const [activeStatusFilter, setActiveStatusFilter] = useState<'todos' | 'pendentes' | 'comprados'>('pendentes');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortedByCategory, setIsSortedByCategory] = useState(false);

  // 4. Voice Recognition (Real Web Speech API + simulation fallback)
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // 5. Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'warn' } | null>(null);

  // 6. Selected Receipt for Reconciliation
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [reconciliationApproved, setReconciliationApproved] = useState(false);

  const triggerToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load Shopping List from Supabase on Mount
  const loadList = async () => {
    setIsLoading(true);
    const cloud = await fetchShoppingListFromCloud();
    if (cloud && cloud.length > 0) {
      setItems(
        cloud.map((s) => ({
          id: s.id,
          nome: s.nome || 'Item sem nome',
          quantidade: s.quantidade || '1 un',
          origem: s.origem === 'alexa' ? `${s.adicionadoPor} via Alexa` : s.origem === 'siri' ? `${s.adicionadoPor} via Siri` : `${s.adicionadoPor} (manual)`,
          categoria: s.categoriaItem || 'Alimentos',
          classificacao: s.categoriaItem === 'Limpeza' || s.categoriaItem === 'Alimentos' ? 'Invariável (Essencial)' : 'Conforto / Rotina',
          preco: s.precoEstimado || 0,
          subinfo: s.precoEstimado ? `Est. ${formatBRL(s.precoEstimado)}` : 'Planejado',
          comprado: Boolean(s.comprado),
          adicionadoPor: (s.adicionadoPor as any) === 'Genivânia' ? 'Genivânia' : 'Felipe',
          estabelecimentoTipo: s.estabelecimentoTipo,
          estabelecimentoNome: s.estabelecimentoNome,
        }))
      );
    } else {
      setItems([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  // Filter available supermarket receipts with items
  const availableSupermarketReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const isSuper = (r.tipoEstabelecimento || '').toLowerCase().includes('super') ||
        (r.estabelecimento || '').toLowerCase().includes('mateus') ||
        (r.estabelecimento || '').toLowerCase().includes('atacadao') ||
        (r.estabelecimento || '').toLowerCase().includes('carvalho') ||
        (r.estabelecimento || '').toLowerCase().includes('frigorifico') ||
        (r.estabelecimento || '').toLowerCase().includes('ferreira');
      return isSuper || (r.itens && r.itens.length > 0);
    });
  }, [receipts]);

  // Set default selected receipt to the most recent one with items
  useEffect(() => {
    if (!selectedReceiptId && availableSupermarketReceipts.length > 0) {
      setSelectedReceiptId(availableSupermarketReceipts[0].id);
    }
  }, [availableSupermarketReceipts, selectedReceiptId]);

  const activeReceipt = useMemo(() => {
    return availableSupermarketReceipts.find((r) => r.id === selectedReceiptId) || availableSupermarketReceipts[0] || null;
  }, [availableSupermarketReceipts, selectedReceiptId]);

  // Reconciliation / Comparison Algorithm: List Items vs Active Receipt
  const reconciliationAudit = useMemo(() => {
    if (!activeReceipt || !activeReceipt.itens || activeReceipt.itens.length === 0) {
      return null;
    }

    const receiptItems = activeReceipt.itens;
    const pairedReceiptItemIds = new Set<string>();

    // Analyze list items
    const matchedListItems: {
      listItem: ShoppingItemUI;
      receiptItem: any;
      precoReal: number;
      precoEstimado: number;
      economia: number;
    }[] = [];

    const missingListItems: ShoppingItemUI[] = [];

    items.forEach((it) => {
      const match = matchListItemToReceipt(it.nome, receiptItems);
      if (match) {
        const rItem = match.item;
        const itemId = rItem.id || rItem.nome || rItem.descricao;
        pairedReceiptItemIds.add(itemId);

        const precoReal = Number(rItem.precoTotal || rItem.preco_total || rItem.valorTotal || rItem.precoUnitario || 0);
        const precoEstimado = it.preco || 0;
        const economia = precoEstimado > 0 ? precoEstimado - precoReal : 0;

        matchedListItems.push({
          listItem: it,
          receiptItem: rItem,
          precoReal,
          precoEstimado,
          economia,
        });
      } else {
        // Not found in this receipt
        missingListItems.push(it);
      }
    });

    // Unmatched receipt items -> Extras / Impulso
    const extraReceiptItems = receiptItems.filter((r) => {
      const id = r.id || r.nome || r.descricao;
      return !pairedReceiptItemIds.has(id);
    });

    const totalReceiptVal = Number(activeReceipt.valorTotal) || receiptItems.reduce((acc, i) => acc + Number(i.precoTotal || i.preco_total || 0), 0);
    const totalMatchedVal = matchedListItems.reduce((acc, m) => acc + m.precoReal, 0);
    const totalExtraVal = extraReceiptItems.reduce((acc, i) => acc + Number(i.precoTotal || i.preco_total || 0), 0);

    const totalPlannedEvaluated = items.length;
    const adherenceRate = totalPlannedEvaluated > 0 ? Math.round((matchedListItems.length / totalPlannedEvaluated) * 100) : 0;

    return {
      receipt: activeReceipt,
      matchedListItems,
      missingListItems,
      extraReceiptItems,
      totalReceiptVal,
      totalMatchedVal,
      totalExtraVal,
      adherenceRate,
    };
  }, [items, activeReceipt]);

  // Insert Item
  const handleInsertItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemInput.trim()) return;

    const nome = newItemInput.trim();
    const quantidade = newQuantityInput.trim() || '1 un';
    const precoEstimado = parseFloat(newPriceInput.replace(',', '.')) || 0;

    const cloudItem = await addShoppingItemToCloud({
      nome,
      quantidade,
      categoriaItem: newCategory,
      adicionadoPor: userAuthor,
      origem: 'manual',
      precoEstimado: precoEstimado > 0 ? precoEstimado : undefined,
    });

    const newItem: ShoppingItemUI = {
      id: cloudItem?.id || ('item-' + Date.now()),
      nome,
      quantidade,
      origem: `${userAuthor} (manual)`,
      categoria: newCategory,
      classificacao: newCategory === 'Conforto/Lazer' ? 'Conforto / Rotina' : 'Invariável (Essencial)',
      preco: precoEstimado,
      subinfo: precoEstimado > 0 ? `Est. ${formatBRL(precoEstimado)}` : 'Planejado',
      comprado: false,
      adicionadoPor: userAuthor,
    };

    setItems((prev) => [newItem, ...prev]);
    setNewItemInput('');
    setNewPriceInput('');
    triggerToast(`"${newItem.nome}" adicionado à lista do Casal Duarte!`);
  };

  // Toggle item status
  const handleToggleItem = async (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const nextState = !target.comprado;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, comprado: nextState } : it))
    );
    await toggleShoppingItemInCloud(id, nextState);
  };

  // Delete item
  const handleDeleteItem = async (id: string, nome: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await deleteShoppingItemInCloud(id);
    triggerToast(`"${nome}" removido da lista.`);
  };

  // Batch mark matched items as bought
  const handleApproveReconciliation = async () => {
    if (!reconciliationAudit || reconciliationAudit.matchedListItems.length === 0) {
      triggerToast('Nenhum item da lista encontrado neste comprovante.', 'warn');
      return;
    }

    const matchedIds = reconciliationAudit.matchedListItems.map((m) => m.listItem.id);
    
    // Update local state
    setItems((prev) =>
      prev.map((it) => (matchedIds.includes(it.id) ? { ...it, comprado: true } : it))
    );

    // Update cloud Supabase
    await batchToggleShoppingItemsInCloud(matchedIds, true);
    setReconciliationApproved(true);

    triggerToast(
      `✓ Sucesso! ${matchedIds.length} itens encontrados no cupom foram marcados como comprados na lista!`,
      'success'
    );
  };

  // Web Speech API: Real Voice Recognition
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation
      setIsListening(true);
      triggerToast('Simulando comando de voz: "Adicionar 2 pacotes de arroz"...', 'info');
      setTimeout(async () => {
        setIsListening(false);
        setNewItemInput('Arroz Branco Tipo 1 5kg');
        setNewQuantityInput('2 pct');
        setNewCategory('Alimentos');
        triggerToast('Comando de voz transcrito!', 'success');
      }, 1400);
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        triggerToast('Escutando... Fale o produto (ex: "Adicionar café especial")', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);

        // Clean up common prefixes
        const cleaned = transcript
          .replace(/^(adicionar|adicione|adiciona|comprar|colocar|coloque|bote)\s+(à|a|na|no)?\s*(lista\s*(de\s*compras)?)?/i, '')
          .trim();

        if (cleaned) {
          setNewItemInput(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
          triggerToast(`Voz reconhecida: "${cleaned}"`, 'success');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        triggerToast('Não consegui ouvir o comando. Tente novamente ou digite.', 'warn');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      triggerToast('Microfone indisponível no navegador.', 'warn');
    }
  };

  // WhatsApp Share Formatter
  const handleShareWhatsApp = () => {
    const pending = items.filter((it) => !it.comprado);
    if (pending.length === 0) {
      triggerToast('A lista de compras está sem itens pendentes.', 'info');
      return;
    }

    const dateStr = new Date().toLocaleDateString('pt-BR');
    let message = `🛒 *Lista de Compras do Casal Duarte*\n📅 ${dateStr}\n\n`;

    // Group by category
    const byCategory: Record<string, ShoppingItemUI[]> = {};
    pending.forEach((it) => {
      byCategory[it.categoria] = byCategory[it.categoria] || [];
      byCategory[it.categoria].push(it);
    });

    Object.entries(byCategory).forEach(([cat, catItems]) => {
      message += `*${cat.toUpperCase()}:*\n`;
      catItems.forEach((it) => {
        const precoStr = it.preco > 0 ? ` (Est. ${formatBRL(it.preco)})` : '';
        message += `◻️ ${it.nome} - ${it.quantidade}${precoStr}\n`;
      });
      message += '\n';
    });

    const totalEst = pending.reduce((acc, it) => acc + (it.preco || 0), 0);
    if (totalEst > 0) {
      message += `💰 *Estimativa Total:* ${formatBRL(totalEst)}\n`;
    }
    message += `_Criado no Duarte Finanças por Felipe & Genivânia_`;

    navigator.clipboard.writeText(message).then(() => {
      triggerToast('✓ Lista copiada para a área de transferência! Pronta para colar no WhatsApp.', 'success');
    });

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Dynamic Metrics & Aggregations
  const totalItemsCount = items.length;
  const pendingItems = useMemo(() => items.filter((it) => !it.comprado), [items]);
  const boughtItems = useMemo(() => items.filter((it) => it.comprado), [items]);
  const pendingTotalEstimated = useMemo(() => pendingItems.reduce((s, i) => s + (i.preco || 0), 0), [pendingItems]);
  const boughtTotalEstimated = useMemo(() => boughtItems.reduce((s, i) => s + (i.preco || 0), 0), [boughtItems]);

  // Unique categories in list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((it) => {
      if (it.categoria) cats.add(it.categoria);
    });
    return Array.from(cats);
  }, [items]);

  // Filtered & Sorted Displayed Items
  const displayedItems = useMemo(() => {
    return items
      .filter((it) => {
        // Status filter
        if (activeStatusFilter === 'pendentes' && it.comprado) return false;
        if (activeStatusFilter === 'comprados' && !it.comprado) return false;

        // Category filter
        if (activeCategoryFilter !== 'todas' && it.categoria !== activeCategoryFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = normalizeText(searchQuery);
          const matchName = normalizeText(it.nome).includes(q);
          const matchCat = normalizeText(it.categoria).includes(q);
          const matchAuthor = normalizeText(it.adicionadoPor).includes(q);
          if (!matchName && !matchCat && !matchAuthor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (isSortedByCategory) {
          return a.categoria.localeCompare(b.categoria);
        }
        // Default: pendentes first, then creation order
        if (a.comprado !== b.comprado) {
          return a.comprado ? 1 : -1;
        }
        return 0;
      });
  }, [items, activeStatusFilter, activeCategoryFilter, searchQuery, isSortedByCategory]);

  return (
    <div
      id="lista-compras-view"
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 flex flex-col gap-6 font-sans animate-in fade-in duration-300"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border animate-in slide-in-from-top-4 ${
            toastMessage.type === 'warn'
              ? 'bg-amber-950 text-amber-100 border-amber-800'
              : toastMessage.type === 'info'
              ? 'bg-sky-950 text-sky-100 border-sky-800'
              : 'bg-[#0b1c30] text-white border-emerald-500/40'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              toastMessage.type === 'warn'
                ? 'text-amber-400'
                : toastMessage.type === 'info'
                ? 'text-sky-400'
                : 'text-emerald-400'
            }`}
          />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER EXECUTIVO COM MÉTRICAS DINÂMICAS & AÇÕES RÁPIDAS                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#006194]" />
              Felipe & Genivânia Duarte
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Lista de Compras & Auditoria de Comprovantes
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            Planeje o que precisa comprar e cruze automaticamente contra o cupom fiscal do supermercado para conferir itens presentes, esquecidos e compras por impulso.
          </p>
        </div>

        {/* Action Pills & Counters */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Share WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Copiar lista e abrir WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar no WhatsApp</span>
          </button>

          {/* Quick Metrics Badge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:px-3.5 sm:py-2 flex items-center divide-x divide-slate-100 shadow-2xs">
            <div className="flex items-center gap-2 pr-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006948] flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Pendentes
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-slate-900 tnum">
                  {pendingItems.length} itens
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#006194] flex items-center justify-center">
                <ReceiptIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Est. Pendente
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-slate-900 tnum">
                  {formatBRL(pendingTotalEstimated)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID PRINCIPAL: LISTA (Esquerda) + AUDITORIA DE COMPROVANTE (Direita)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ======================================================================= */}
        {/* COLUNA ESQUERDA: Form de Adição + Lista de Itens (~58% largura)         */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Card: Adicionar Item (Digitação + Voz Real + Autor) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#006948] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[#006948]" />
                </div>
                <span className="font-display font-bold text-sm text-slate-900">
                  Adicionar Item à Lista
                </span>
              </div>

              {/* Author Switcher: Felipe vs Genivânia */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setUserAuthor('Felipe')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    userAuthor === 'Felipe'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Felipe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserAuthor('Genivânia')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    userAuthor === 'Genivânia'
                      ? 'bg-white text-pink-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Genivânia</span>
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleInsertItem} className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Item Name Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    placeholder="Ex: Azeite Extra Virgem, Arroz 5kg, Detergente Omo..."
                    className="w-full pl-3.5 pr-9 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white transition-all"
                  />
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={isListening ? 'Parar de ouvir' : 'Falar por voz'}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-400 hover:text-[#006948] hover:bg-slate-200/60'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Quantity Input */}
                <input
                  type="text"
                  value={newQuantityInput}
                  onChange={(e) => setNewQuantityInput(e.target.value)}
                  placeholder="Qtd (ex: 2 un, 1kg)"
                  className="w-full sm:w-28 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white transition-all"
                />
              </div>

              {/* Second Row: Category + Estimated Price + Submit Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Dropdown */}
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    >
                      <option value="Alimentos">🥩 Alimentos / Carnes</option>
                      <option value="Hortifruti">🥬 Hortifruti</option>
                      <option value="Limpeza">🧹 Limpeza</option>
                      <option value="Higiene">🧴 Higiene & Beleza</option>
                      <option value="Bebidas">☕ Bebidas / Café</option>
                      <option value="Conforto/Lazer">🍷 Conforto & Lazer</option>
                      <option value="Farmácia">💊 Farmácia</option>
                      <option value="Outros">📦 Outros</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Estimated Price Input (Optional) */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      value={newPriceInput}
                      onChange={(e) => setNewPriceInput(e.target.value)}
                      placeholder="Preço Est. (opcional)"
                      className="w-36 pl-7 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#005238] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar à Lista</span>
                </button>
              </div>
            </form>

            {/* Quick Status Filters */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveStatusFilter('pendentes')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeStatusFilter === 'pendentes'
                      ? 'bg-emerald-50 text-[#006948] border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pendentes ({pendingItems.length})
                </button>

                <button
                  onClick={() => setActiveStatusFilter('comprados')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeStatusFilter === 'comprados'
                      ? 'bg-emerald-50 text-[#006948] border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Comprados ({boughtItems.length})
                </button>

                <button
                  onClick={() => setActiveStatusFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeStatusFilter === 'todos'
                      ? 'bg-emerald-50 text-[#006948] border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({totalItemsCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produto..."
                  className="pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#006948] w-36 sm:w-44"
                />
              </div>
            </div>

            {/* Category Filter Pills (if more than 1 category) */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Categoria:</span>
                <button
                  onClick={() => setActiveCategoryFilter('todas')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    activeCategoryFilter === 'todas'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                {availableCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategoryFilter(c)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                      activeCategoryFilter === c
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c} ({items.filter((i) => i.categoria === c).length})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List of Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900">
                  {activeStatusFilter === 'pendentes'
                    ? 'Itens para Comprar'
                    : activeStatusFilter === 'comprados'
                    ? 'Itens Já Comprados'
                    : 'Todos os Itens'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {displayedItems.length}
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

            {/* Empty State */}
            {displayedItems.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <ShoppingCart className="w-8 h-8 stroke-1 text-slate-300" />
                <p className="text-xs font-medium">
                  {items.length === 0
                    ? 'Nenhum produto cadastrado na lista de compras.'
                    : 'Nenhum item corresponde ao filtro selecionado.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Adicione novos itens digitando ou falando pelo microfone acima.
                </p>
              </div>
            )}

            {/* Items Render */}
            <div className="flex flex-col gap-2.5">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    item.comprado
                      ? 'bg-slate-50/70 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left Checkbox & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      title={item.comprado ? 'Desmarcar' : 'Marcar como comprado'}
                      className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        item.comprado
                          ? 'bg-[#006948] text-white'
                          : 'border-2 border-slate-300 hover:border-[#006948]'
                      }`}
                    >
                      {item.comprado && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
                    </button>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold truncate ${
                            item.comprado ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
                          {item.nome}
                        </span>

                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {item.quantidade}
                        </span>

                        {item.comprado && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            <Check className="w-2.5 h-2.5" /> Comprado
                          </span>
                        )}
                      </div>

                      {/* Badges: Author + Category + Class */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            item.adicionadoPor === 'Felipe'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                              : 'bg-pink-50 text-pink-700 border border-pink-200/50'
                          }`}
                        >
                          {item.adicionadoPor}
                        </span>

                        <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {item.categoria}
                        </span>

                        <span className="text-[9px] text-slate-400">
                          {item.origem}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Price & Delete Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end text-right">
                      {item.preco > 0 ? (
                        <>
                          <span className="font-display font-bold text-xs text-slate-900 tnum">
                            {formatBRL(item.preco)}
                          </span>
                          <span className="text-[9px] text-slate-400">Est.</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sem valor</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.nome)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* COLUNA DIREITA: AUDITORIA & CONFERÊNCIA DE COMPROVANTE (~42% largura)    */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs gap-4">
            {/* Header da Auditoria */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006948] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#006948]" />
                  </div>
                  <h2 className="font-display font-bold text-base text-slate-900">
                    Auditoria de Comprovante
                  </h2>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('scanner')}
                    className="text-xs text-[#006194] hover:text-[#004e76] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Escanear Novo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cruze os itens que você planejou comprar com as linhas do cupom fiscal emitido pelo supermercado.
              </p>

              {/* Seletor do Comprovante do Casal */}
              {availableSupermarketReceipts.length > 0 ? (
                <div className="mt-3.5 flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Comprovante para Conferência:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedReceiptId}
                      onChange={(e) => setSelectedReceiptId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    >
                      {availableSupermarketReceipts.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.estabelecimento || 'Supermercado'} • {formatBRL(r.valorTotal)} (
                          {r.itens?.length || 0} itens lidos)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Nenhum comprovante de supermercado com itens detalhados encontrado. Anexe ou escaneie uma nota fiscal para auditar.
                  </span>
                </div>
              )}

              {/* CARD DE RESULTADOS DA AUDITORIA */}
              {reconciliationAudit && (
                <div className="mt-3.5 flex flex-col gap-3.5 animate-in fade-in duration-200">
                  {/* Scorecard de Cumprimento da Lista */}
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        ADERÊNCIA À LISTA
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-display font-black text-2xl text-[#006948] tnum">
                          {reconciliationAudit.adherenceRate}%
                        </span>
                        <span className="text-xs text-slate-500 font-medium">da lista atendida</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {reconciliationAudit.matchedListItems.length} de {items.length} itens planejados estavam no cupom
                      </span>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        TOTAL DO CUPOM
                      </span>
                      <span className="font-display font-black text-lg text-slate-900 tnum">
                        {formatBRL(reconciliationAudit.totalReceiptVal)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {reconciliationAudit.receipt.itens?.length || 0} itens processados
                      </span>
                    </div>
                  </div>

                  {/* 1. ITENS ENCONTRADOS / PRESENTES NO CUPOM */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Itens Encontrados no Cupom ({reconciliationAudit.matchedListItems.length})</span>
                      </span>
                      <span className="font-bold text-slate-900 tnum text-[11px]">
                        {formatBRL(reconciliationAudit.totalMatchedVal)}
                      </span>
                    </div>

                    {reconciliationAudit.matchedListItems.length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {reconciliationAudit.matchedListItems.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-emerald-50/40 border border-emerald-200/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-bold text-slate-900 truncate">
                                {m.listItem.nome}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                Cupom: {m.receiptItem.nome || m.receiptItem.descricao}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="font-bold text-slate-900 tnum">
                                {formatBRL(m.precoReal)}
                              </span>
                              {m.economia !== 0 && (
                                <span
                                  className={`text-[9px] font-bold ${
                                    m.economia > 0 ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  {m.economia > 0
                                    ? `- ${formatBRL(m.economia)} vs est.`
                                    : `+ ${formatBRL(Math.abs(m.economia))} vs est.`}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                        Nenhum item da lista coincidiu com as linhas deste comprovante.
                      </div>
                    )}
                  </div>

                  {/* 2. ITENS FALTANTES / NÃO ENCONTRADOS (ESQUECIDOS) */}
                  {reconciliationAudit.missingListItems.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#006194] flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-[#006194]" />
                          <span>Faltaram Comprar / Não Faturados ({reconciliationAudit.missingListItems.length})</span>
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {reconciliationAudit.missingListItems.map((it) => (
                          <div
                            key={it.id}
                            className="p-2 rounded-lg bg-blue-50/40 border border-blue-200/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-slate-800 truncate">
                                {it.nome}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({it.quantidade})
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded shrink-0">
                              Permanece na lista
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. ITENS EXTRAS / FORA DA LISTA (COMPRAS DE IMPULSO) */}
                  {reconciliationAudit.extraReceiptItems.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Itens Fora da Lista ({reconciliationAudit.extraReceiptItems.length})</span>
                        </span>
                        <span className="font-bold text-amber-900 tnum text-[11px]">
                          {formatBRL(reconciliationAudit.totalExtraVal)}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        Produtos faturados no supermercado que não constavam no planejamento do casal:
                      </p>

                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {reconciliationAudit.extraReceiptItems.slice(0, 6).map((rItem, rIdx) => {
                          const val = Number(rItem.precoTotal || rItem.preco_total || rItem.valorTotal || 0);
                          return (
                            <div
                              key={rIdx}
                              className="p-2 rounded-lg bg-amber-50/30 border border-amber-200/60 flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-800 truncate font-medium">
                                {rItem.nome || rItem.descricao || rItem.nome_do_item}
                              </span>
                              <span className="font-bold text-amber-900 tnum shrink-0 ml-2">
                                {formatBRL(val)}
                              </span>
                            </div>
                          );
                        })}
                        {reconciliationAudit.extraReceiptItems.length > 6 && (
                          <span className="text-[10px] text-slate-400 italic text-center">
                            + {reconciliationAudit.extraReceiptItems.length - 6} outros itens fora da lista
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button: Dar Baixa Automática */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={handleApproveReconciliation}
                      disabled={reconciliationAudit.matchedListItems.length === 0}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
                        reconciliationApproved
                          ? 'bg-emerald-50 text-[#006948] border border-emerald-300'
                          : reconciliationAudit.matchedListItems.length > 0
                          ? 'bg-[#006948] hover:bg-[#005238] text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>
                        {reconciliationApproved
                          ? '✓ Baixa Efetuada nos Itens da Lista!'
                          : `Dar Baixa Automática nos ${reconciliationAudit.matchedListItems.length} Itens Comprados`}
                      </span>
                    </button>
                    <span className="text-[10px] text-center text-slate-400">
                      Marca os produtos encontrados como comprados e preserva os itens faltantes para a próxima ida às compras.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RODAPÉ INFORMATIVO TRANSPARENTE                                        */}
      {/* ========================================================================= */}
      <footer className="w-full pt-4 mt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 text-[#006948] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#006948]" />
            <span>Auditoria Fiscal Casal Duarte:</span>
          </div>
          <span className="text-slate-600">
            {pendingItems.length} pendentes • {boughtItems.length} comprados
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">
            {availableSupermarketReceipts.length} comprovante(s) de supermercado conectado(s)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>© 2026 Duarte Finanças</span>
        </div>
      </footer>
    </div>
  );
};
