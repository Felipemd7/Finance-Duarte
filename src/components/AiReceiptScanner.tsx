import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Store,
  Calendar,
  DollarSign,
  Tag,
  ArrowRight,
  ListTodo,
  Check,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
  CreditCard,
  Hash,
  MapPin,
  Receipt,
  ShieldCheck,
  HelpCircle,
  Edit3,
  X,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { Category, Subcategory, Establishment, ShoppingListItem } from '../types.ts';
import { formatBRL, formatDateBR } from '../utils/formatters.ts';

interface ExtractedItem {
  id?: string;
  codigo?: string;
  nome: string;
  quantidade: number;
  unidade?: string;
  preco_unitario: number;
  preco_total: number;
  desconto_item?: number;
  categoria_item:
    | 'alimento'
    | 'bebida'
    | 'limpeza'
    | 'higiene'
    | 'hortifruti'
    | 'acougue'
    | 'remedio'
    | 'combustivel'
    | 'pet'
    | 'lazer'
    | 'utilidade'
    | 'outro';
}

interface AiReceiptScannerProps {
  categories: Category[];
  subcategories: Subcategory[];
  establishments: Establishment[];
  shoppingList: ShoppingListItem[];
  onSaveExtractedTransaction: (txData: any, reconcileItems?: any[]) => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const AiReceiptScanner: React.FC<AiReceiptScannerProps> = ({
  categories,
  subcategories,
  establishments,
  shoppingList,
  onSaveExtractedTransaction,
  onNavigateTab,
}) => {
  // Mode: 'file' (photo/PDF) or 'text' (manual/pasted transcript or NFC-e chave)
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Text/Chave state
  const [textInput, setTextInput] = useState('');

  // Processing & Feedback state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Raw extraction & Reconciliation
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<any | null>(null);
  const [autoCheckShoppingList, setAutoCheckShoppingList] = useState(true);

  // Editable Review Form
  const [editStore, setEditStore] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editStoreType, setEditStoreType] = useState('Supermercado');
  const [editDate, setEditDate] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cartao' | 'debito' | 'dinheiro' | 'pix'>('cartao');
  const [editSubcatId, setEditSubcatId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<ExtractedItem[]>([]);

  // Modal or inline add new item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQtd, setNewItemQtd] = useState('1');
  const [newItemUn, setNewItemUn] = useState('un');
  const [newItemPrecoUn, setNewItemPrecoUn] = useState('');
  const [newItemCat, setNewItemCat] = useState<any>('alimento');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Paste handler for screenshots directly (Ctrl+V anywhere in window or zone)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/')) {
          handleFileChange(pastedFile);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle file select
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setSuccessToast(null);
    setExtractedData(null);
    setReconciliationResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Preset Samples for Instant Testing
  const handleLoadSample = (sampleType: 'atacadao' | 'drogaraia' | 'shell') => {
    setErrorMsg(null);
    setSuccessToast(null);
    setIsProcessing(true);

    setTimeout(() => {
      let sampleResult: any = null;

      if (sampleType === 'atacadao') {
        sampleResult = {
          estabelecimento: {
            nome: 'Atacadão S/A Centro',
            razao_social: 'Atacadão Distribuição Comércio e Indústria Ltda',
            cnpj: '75.315.333/0001-09',
            tipo: 'Supermercado',
            cidade_uf: 'São Paulo - SP',
          },
          data: '2026-08-28',
          hora: '15:42:10',
          numero_cupom: '048291',
          chave_acesso: '35260875315333000109650010000482911000123456',
          valor_total: 318.45,
          subtotal_bruto: 332.95,
          desconto: 14.5,
          tributos: 38.2,
          forma_pagamento: 'cartao',
          categoria_sugerida: 'Variável',
          subcategoria_sugerida: 'Supermercado',
          observacoes: 'Cupom Fiscal NFC-e Atacadão. 5 itens extraídos com sucesso.',
          confianca_leitura: 'alta',
          itens: [
            { codigo: '7891000', nome: 'Arroz Integral Tipo 1 5kg', quantidade: 2, unidade: 'pct', preco_unitario: 32.9, preco_total: 65.8, categoria_item: 'alimento' },
            { codigo: '7892000', nome: 'Azeite de Oliva Extra Virgem 500ml', quantidade: 3, unidade: 'un', preco_unitario: 44.5, preco_total: 133.5, categoria_item: 'alimento' },
            { codigo: '7893000', nome: 'Detergente Neutro Concentrado 5L', quantidade: 1, unidade: 'un', preco_unitario: 28.9, preco_total: 28.9, categoria_item: 'limpeza' },
            { codigo: '7894000', nome: 'Sabão em Pó Ação Profunda 2kg', quantidade: 1, unidade: 'cx', preco_unitario: 34.25, preco_total: 34.25, categoria_item: 'limpeza' },
            { codigo: '7895000', nome: 'Biscoito Integral Aveia e Cacau', quantidade: 4, unidade: 'pct', preco_unitario: 14.0, preco_total: 56.0, categoria_item: 'alimento' },
          ],
        };
      } else if (sampleType === 'drogaraia') {
        sampleResult = {
          estabelecimento: {
            nome: 'Droga Raia Farmácias',
            cnpj: '61.585.865/0240-93',
            tipo: 'Farmácia',
          },
          data: '2026-08-25',
          hora: '10:15:00',
          numero_cupom: '012948',
          valor_total: 164.8,
          desconto: 8.0,
          forma_pagamento: 'debito',
          categoria_sugerida: 'Variável',
          subcategoria_sugerida: 'Farmácia',
          observacoes: 'NFC-e Droga Raia. Medicamentos e dermocosméticos.',
          confianca_leitura: 'alta',
          itens: [
            { nome: 'Protetor Solar Facial FPS 50 50g', quantidade: 1, unidade: 'un', preco_unitario: 89.9, preco_total: 89.9, categoria_item: 'higiene' },
            { nome: 'Vitamina C 1000mg Efervescente 30 comp', quantidade: 1, unidade: 'cx', preco_unitario: 48.9, preco_total: 48.9, categoria_item: 'remedio' },
            { nome: 'Pastilha para Garganta Mentol', quantidade: 2, unidade: 'cx', preco_unitario: 13.0, preco_total: 26.0, categoria_item: 'remedio' },
          ],
        };
      } else {
        sampleResult = {
          estabelecimento: {
            nome: 'Posto Shell Duarte Express',
            cnpj: '02.456.789/0001-44',
            tipo: 'Posto de combustível',
          },
          data: '2026-08-26',
          hora: '18:30:22',
          valor_total: 375.0,
          forma_pagamento: 'cartao',
          categoria_sugerida: 'Variável',
          subcategoria_sugerida: 'Combustível',
          observacoes: 'Abastecimento tanque cheio Gasolina Shell V-Power',
          confianca_leitura: 'alta',
          itens: [
            { nome: 'Gasolina Aditivada V-Power 58L', quantidade: 58, unidade: 'lt', preco_unitario: 6.46, preco_total: 375.0, categoria_item: 'combustivel' },
          ],
        };
      }

      applyExtractedData(sampleResult);
      setIsProcessing(false);
    }, 600);
  };

  // Call Server Gemini API
  const handleAnalyzeWithGemini = async () => {
    if (inputMode === 'file' && !previewUrl) {
      setErrorMsg('Selecione ou arraste uma foto do comprovante para análise.');
      return;
    }
    if (inputMode === 'text' && !textInput.trim()) {
      setErrorMsg('Cole o texto ou a chave de 44 dígitos da NFC-e para análise.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessToast(null);

    try {
      const payload: any = {};
      if (inputMode === 'file' && previewUrl) {
        payload.imageBase64 = previewUrl;
        payload.mimeType = file?.type || 'image/jpeg';
      }
      if (inputMode === 'text' || textInput.trim()) {
        payload.textContent = textInput.trim();
      }

      const res = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao analisar o comprovante com Gemini.');
      }

      applyExtractedData(data.analysis);
    } catch (err: any) {
      console.error('Error analyzing receipt:', err);
      let msg = err.message || 'Erro ao processar comprovante com IA.';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        msg = 'Os servidores do Gemini estão com alta demanda temporária no momento (código 503). Por favor, clique em "Tentar Novamente" em alguns instantes ou use um dos exemplos prontos.';
      }
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyExtractedData = (result: any) => {
    setExtractedData(result);
    setEditStore(result.estabelecimento?.nome || result.estabelecimento?.nome_fantasia || 'Supermercado');
    setEditCnpj(result.estabelecimento?.cnpj || '');
    setEditStoreType(result.estabelecimento?.tipo || 'Supermercado');
    setEditDate(result.data || new Date().toISOString().split('T')[0]);
    setEditTotal(result.valor_total ? Number(result.valor_total).toFixed(2) : '0.00');
    setEditPaymentMethod(result.forma_pagamento || 'cartao');
    setEditNotes(result.observacoes || '');

    const processedItens: ExtractedItem[] = (result.itens || []).map((i: any, idx: number) => ({
      id: `item-${Date.now()}-${idx}`,
      codigo: i.codigo,
      nome: i.nome,
      quantidade: Number(i.quantidade) || 1,
      unidade: i.unidade || 'un',
      preco_unitario: Number(i.preco_unitario) || 0,
      preco_total: Number(i.preco_total) || 0,
      categoria_item: i.categoria_item || 'alimento',
    }));
    setEditItems(processedItens);

    // Suggest matched subcategory
    const suggestedSubName = (result.subcategoria_sugerida || '').toLowerCase();
    const matchedSub =
      subcategories.find(s => s.nome.toLowerCase() === suggestedSubName) ||
      subcategories.find(s => s.nome.toLowerCase().includes('supermercado')) ||
      subcategories[0];
    setEditSubcatId(matchedSub?.id || '');

    // Trigger reconciliation with shopping list
    reconcileWithShoppingList(processedItens);
  };

  // Reconcile items against shopping list
  const reconcileWithShoppingList = async (items: ExtractedItem[]) => {
    try {
      const res = await fetch('/api/receipts/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_items: items }),
      });
      const data = await res.json();
      if (res.ok) {
        setReconciliationResult(data);
      }
    } catch (e) {
      console.error('Reconciliation error:', e);
    }
  };

  // Item modifications
  const handleUpdateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    setEditItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Auto recalculate total if qtd or unit price changes
      if (field === 'quantidade' || field === 'preco_unitario') {
        const q = field === 'quantidade' ? Number(value) : item.quantidade;
        const p = field === 'preco_unitario' ? Number(value) : item.preco_unitario;
        item.preco_total = Math.round(q * p * 100) / 100;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    const qtd = parseFloat(newItemQtd.replace(',', '.')) || 1;
    const precoUn = parseFloat(newItemPrecoUn.replace(',', '.')) || 0;
    const precoTot = Math.round(qtd * precoUn * 100) / 100;

    const newItem: ExtractedItem = {
      id: `custom-${Date.now()}`,
      nome: newItemName.trim(),
      quantidade: qtd,
      unidade: newItemUn,
      preco_unitario: precoUn,
      preco_total: precoTot,
      categoria_item: newItemCat,
    };

    setEditItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrecoUn('');
    setNewItemQtd('1');
    setIsAddingItem(false);
  };

  // Math sum of current items
  const itemsSum = Math.round(editItems.reduce((acc, i) => acc + (i.preco_total || 0), 0) * 100) / 100;
  const parsedTotal = parseFloat(editTotal.replace(',', '.')) || 0;
  const sumDiff = Math.abs(parsedTotal - itemsSum);
  const isSumMatching = sumDiff < 0.05;

  const handleSyncTotalWithItems = () => {
    setEditTotal(itemsSum.toFixed(2));
  };

  // Save the reviewed transaction to DB
  const handleConfirmAndSave = async () => {
    if (!editTotal || !editSubcatId) {
      setErrorMsg('Preencha o valor total e selecione a subcategoria antes de salvar.');
      return;
    }

    const sub = subcategories.find(s => s.id === editSubcatId);
    const totalVal = parseFloat(editTotal.replace(',', '.'));

    try {
      await onSaveExtractedTransaction(
        {
          data: editDate,
          valor: totalVal,
          tipo: 'despesa',
          forma_pagamento: editPaymentMethod,
          status: 'pago',
          categoria_id: sub?.categoria_id || categories[0]?.id,
          subcategoria_id: editSubcatId,
          estabelecimento_nome: editStore,
          observacoes: `[IA Fiscal NFC-e] ${editNotes}${editCnpj ? ` | CNPJ: ${editCnpj}` : ''}`,
          itens: editItems.map(item => ({
            nome_do_item: item.nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            preco_total: item.preco_total,
            categoria_item: item.categoria_item,
          })),
        },
        autoCheckShoppingList ? reconciliationResult?.items : undefined
      );

      setSuccessToast(`Transação de ${formatBRL(totalVal)} em "${editStore}" com ${editItems.length} itens salva com sucesso!`);
      // Reset inputs after 1.5s
      setTimeout(() => {
        onNavigateTab('transactions');
      }, 1400);
    } catch (e: any) {
      setErrorMsg('Erro ao salvar no banco de dados: ' + (e.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Leitor Inteligente de Cupons Fiscais (Gemini 3.8 Flash)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Extração precisa linha a linha de comprovantes de supermercado (NFC-e, SAT), farmácias e postos. Lê produtos, pesos, preços unitários e cruza com a lista de compras do Casal Duarte.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              OCR Fiscal Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Preset Samples Quick Bar */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-xs text-indigo-950">
          <span className="font-bold block sm:inline">Exemplos Prontos para Teste Instantâneo:</span>
          <span className="text-indigo-700 sm:ml-1">
            Teste como a IA extrai itens, alimentos, higiene e reconcilia com o orçamento.
          </span>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => handleLoadSample('atacadao')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-100/50 border border-indigo-200 text-indigo-900 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Atacadão (Supermercado)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('drogaraia')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-100/50 border border-indigo-200 text-indigo-900 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
          >
            <span>💊 Droga Raia (Farmácia)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('shell')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-100/50 border border-indigo-200 text-indigo-900 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
          >
            <span>⛽ Posto Shell (Combustível)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center space-x-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Aviso na leitura:</p>
            <p className="mt-0.5">{errorMsg}</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('atacadao')}
                className="inline-flex items-center px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 font-semibold rounded-lg text-xs transition"
              >
                Carregar Exemplo de Teste
              </button>
            </div>
            <p className="mt-2 text-[11px] text-rose-600">
              Dica: Se preferir, você também pode alternar para a aba &quot;Chave NFC-e / Texto&quot; e colar o extrato ou a chave de 44 dígitos da nota.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload / Input Zone */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Tab switch for Input Mode */}
            <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-50/50">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-2 ${
                  inputMode === 'file'
                    ? 'border-indigo-600 text-indigo-600 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Foto / PDF do Cupom</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center gap-2 ${
                  inputMode === 'text'
                    ? 'border-indigo-600 text-indigo-600 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Chave NFC-e / Texto</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {inputMode === 'file' ? (
                <>
                  <div
                    ref={dropZoneRef}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center min-h-[220px]"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                      }}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {file ? file.name : 'Arraste ou clique para anexar o comprovante'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Suporta fotos (JPG, PNG, WEBP) e PDF. Dica: você também pode pressionar Ctrl+V para colar um print diretamente!
                    </p>
                  </div>

                  {/* Image Preview if available */}
                  {previewUrl && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <span>Arquivo selecionado:</span>
                        <span className="text-indigo-600 font-bold truncate max-w-[180px]">
                          {file?.name || 'Imagem colada'}
                        </span>
                      </div>
                      <div className="max-h-56 overflow-hidden rounded-lg bg-slate-200 flex items-center justify-center border border-slate-300">
                        <img
                          src={previewUrl}
                          alt="Pré-visualização do Comprovante"
                          className="max-h-56 w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Chave de Acesso (44 dígitos) ou Transcrição de Produtos:
                  </label>
                  <textarea
                    rows={7}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Exemplo de transcrição ou chave NFC-e:
3526 0875 3153 3300 0109 6500 1000 0482 9110 0012 3456

Ou cole o extrato:
001 ARROZ INTEGRAL 5KG 2 UN X 32,90 = 65,80
002 AZEITE EXTRA VIRGEM 3 UN X 44,50 = 133,50
003 DETERGENTE NEUTRO 5L 1 UN X 28,90 = 28,90
TOTAL: R$ 228,20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400">
                    A IA reconhece chaves de cupom fiscal, links da SEFAZ ou listas de compras copiadas.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={isProcessing || (inputMode === 'file' && !previewUrl && !file) || (inputMode === 'text' && !textInput.trim())}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center shadow-xs transition"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Extraindo com IA Gemini 3.8 Flash...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Processar e Auditar Cupom Fiscal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Como obter 100% de precisão:</span>
            </h3>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
              <li>Mantenha o cupom esticado e fotografe com boa iluminação.</li>
              <li>Certifique-se de que a data e o total no rodapé estejam visíveis.</li>
              <li>A IA converterá abreviações térmicas (ex: ARR T1 -&gt; Arroz Tipo 1).</li>
              <li>Você pode editar qualquer item na tabela antes de salvar.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Review & Audit Panel */}
        <div className="lg:col-span-7">
          {isProcessing ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  Auditoria Fiscal em Andamento...
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  A IA Gemini 3.8 Flash está examinando o cabeçalho fiscal, identificando o CNPJ, extraindo linha a linha cada produto, quantidade e valor unitário, e mapeando para o plano financeiro do Casal Duarte.
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="w-2/3 h-full bg-indigo-600 rounded-full animate-progress" />
              </div>
            </div>
          ) : extractedData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
              {/* Header Bar of Result */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                      Cupom Fiscal Auditado com Sucesso
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Revise os campos abaixo. Tudo é editável antes de ser gravado no sistema.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {editItems.length} Itens Identificados
                </span>
              </div>

              {/* Informational banner when Gemini API was under high demand */}
              {extractedData?.isTemporaryHighDemand && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Pico temporário de alta demanda na IA (Código 503)</span>
                    <p className="mt-0.5 text-amber-800 text-[11px]">
                      Os servidores do Google Gemini estão com alta demanda temporária neste momento. Os dados abaixo servem como base editável. Você pode clicar no botão para reprocessar a imagem diretamente com a IA assim que o tráfego normalizar.
                    </p>
                    <button
                      type="button"
                      onClick={handleAnalyzeWithGemini}
                      disabled={isProcessing}
                      className="mt-2 inline-flex items-center px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition shadow-2xs"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                      Repetir Análise com IA
                    </button>
                  </div>
                </div>
              )}

              {/* Fiscal Header Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nome do Estabelecimento / Fantasia
                  </label>
                  <div className="relative">
                    <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editStore}
                      onChange={e => setEditStore(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    CNPJ / Documento Fiscal
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editCnpj}
                      onChange={e => setEditCnpj(e.target.value)}
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tipo de Estabelecimento
                  </label>
                  <select
                    value={editStoreType}
                    onChange={e => setEditStoreType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Supermercado">Supermercado / Atacado</option>
                    <option value="Farmácia">Farmácia / Drogaria</option>
                    <option value="Posto de combustível">Posto de Combustível</option>
                    <option value="Oficina">Oficina Mecânica / Peças</option>
                    <option value="Restaurante/Lazer">Restaurante / Bar / Lazer</option>
                    <option value="Serviços">Serviços Gerais</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Data da Compra
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Forma de Pagamento
                  </label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={editPaymentMethod}
                      onChange={e => setEditPaymentMethod(e.target.value as any)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="cartao">Cartão de Crédito</option>
                      <option value="debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro em Espécie</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Valor Total da Nota (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editTotal}
                      onChange={e => setEditTotal(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Suggested Subcategory for Casal Duarte */}
              <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-indigo-950 block">
                      Subcategoria das Planilhas do Casal Duarte:
                    </span>
                    <span className="text-[11px] text-indigo-700">
                      Classificação contábil automática baseada no histórico.
                    </span>
                  </div>
                </div>
                <select
                  value={editSubcatId}
                  onChange={e => setEditSubcatId(e.target.value)}
                  className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {subcategories.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({categories.find(c => c.id === s.categoria_id)?.nome})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Itens do Cupom Fiscal ({editItems.length} produtos):
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(!isAddingItem)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                {/* Inline Add Item Form */}
                {isAddingItem && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <span className="text-xs font-bold text-slate-700 block">Novo Produto:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Nome do produto"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="Qtd"
                          value={newItemQtd}
                          onChange={e => setNewItemQtd(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-center"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Preço R$"
                          value={newItemPrecoUn}
                          onChange={e => setNewItemPrecoUn(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-right"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddNewItem}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                        >
                          Inserir
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingItem(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-2">Tipo</th>
                        <th className="py-2.5 px-2 text-center w-16">Qtd</th>
                        <th className="py-2.5 px-2 text-right w-20">Unit. (R$)</th>
                        <th className="py-2.5 px-2 text-right w-20">Total</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 group">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.nome}
                              onChange={e => handleUpdateItem(idx, 'nome', e.target.value)}
                              className="w-full bg-transparent font-medium text-slate-800 text-xs border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.categoria_item}
                              onChange={e => handleUpdateItem(idx, 'categoria_item', e.target.value)}
                              className="text-[10px] py-0.5 px-1 rounded-md bg-slate-100 text-slate-700 border-none capitalize font-medium"
                            >
                              <option value="alimento">Alimento</option>
                              <option value="bebida">Bebida</option>
                              <option value="limpeza">Limpeza</option>
                              <option value="higiene">Higiene</option>
                              <option value="hortifruti">Hortifrúti</option>
                              <option value="acougue">Açougue</option>
                              <option value="remedio">Remédio</option>
                              <option value="combustivel">Combustível</option>
                              <option value="pet">Pet</option>
                              <option value="lazer">Lazer</option>
                              <option value="utilidade">Utilidade</option>
                              <option value="outro">Outro</option>
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              step="0.001"
                              value={item.quantidade}
                              onChange={e => handleUpdateItem(idx, 'quantidade', e.target.value)}
                              className="w-14 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden text-slate-700"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.preco_unitario}
                              onChange={e => handleUpdateItem(idx, 'preco_unitario', e.target.value)}
                              className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden text-slate-600"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">
                            {formatBRL(item.preco_total)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Remover produto"
                              className="p-1 text-slate-300 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical Check & Balance Banner */}
                <div className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 border-slate-200">
                  <div className="flex items-center space-x-2">
                    {isSumMatching ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800">
                        Soma dos Itens: {formatBRL(itemsSum)}
                      </span>
                      <span className="text-slate-500 ml-1.5">
                        (Total da Nota: {formatBRL(parsedTotal)})
                      </span>
                    </div>
                  </div>

                  {!isSumMatching && (
                    <button
                      type="button"
                      onClick={handleSyncTotalWithItems}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] transition self-start sm:self-auto"
                    >
                      Ajustar Total da Nota para {formatBRL(itemsSum)}
                    </button>
                  )}
                </div>
              </div>

              {/* Shopping List Auto-Reconciliation */}
              {reconciliationResult && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-950">
                      <ListTodo className="w-4 h-4 text-emerald-600" />
                      <span>Reconciliação com a Lista de Compras do Casal:</span>
                    </div>
                    <label className="flex items-center space-x-1.5 text-xs text-emerald-900 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCheckShoppingList}
                        onChange={e => setAutoCheckShoppingList(e.target.checked)}
                        className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Dar baixa automática na lista</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Comprados da Lista</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700">
                        {reconciliationResult.summary.compradosDaLista} itens
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Extras / Impulso</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-700">
                        {reconciliationResult.summary.extrasImpulso} itens
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Faltando na Compra</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-600">
                        {reconciliationResult.summary.faltandoNaCompra} itens
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Confirmation Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(null);
                    setPreviewUrl(null);
                    setFile(null);
                    setTextInput('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  Descartar e Digitalizar Outro
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Gravar Transação e {editItems.length} Itens no Sistema</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="font-bold text-slate-700 text-sm sm:text-base">
                Nenhum comprovante analisado ainda
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Anexe uma foto de cupom de supermercado ou farmácia à esquerda, ou utilize os botões de exemplo no topo para ver a IA em ação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
