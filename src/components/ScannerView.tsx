import React, { useState, useRef } from 'react';
import {
  Camera,
  FileText,
  QrCode,
  CheckCircle2,
  Edit3,
  Split,
  Landmark,
  RefreshCw,
  ScanLine,
  ShoppingCart,
  Clock,
  X,
  Plus,
  Trash2,
  Search,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Fuel,
  Pill,
  Upload,
  Receipt as ReceiptIcon,
  ZoomIn,
  AlertTriangle,
  SlidersHorizontal,
  Download,
  Filter,
  Eye,
  Check,
  Smartphone,
  Mail,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';
import { Receipt, PurchaseItem } from '../types';
import { formatBRL } from '../utils/formatters';

interface ScannerViewProps {
  receipts: Receipt[];
  onApproveReceipt: (receipt: Receipt) => void;
  onLinkToTransaction?: (receipt: Receipt) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  receipts,
  onApproveReceipt,
  onLinkToTransaction,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active extracted receipt state matching reference image
  const [extractedReceipt, setExtractedReceipt] = useState({
    id: 'nfc-92819',
    numeroCupom: 'NFC-e #92819',
    dataHora: '14/03/2026 11:28',
    estabelecimento: 'Atacadão S/A',
    cnpj: '75.315.333/0045-89',
    ie: '86.492.110',
    endereco: 'Av. Duque de Caxias, 2800 - Teresina, PI',
    ccf: '039841',
    totalLido: 487.9,
    meioPagamento: 'Cartão de Crédito NuBank •• 8821',
    comprador: 'Felipe D.',
    itens: [
      {
        id: 'it-1',
        nome: 'Arroz Tipo 1 5kg',
        codEan: '789100014231',
        qtd: 2,
        unitario: 28.9,
        subtotal: 57.8,
        categoria: 'Alimentos (Supermercado / Variável)',
        icon: 'utensils',
        categoriaColor: 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
        desmembrado: false,
      },
      {
        id: 'it-2',
        nome: 'Azeite Extra Virgem 500ml',
        codEan: '789600120194',
        qtd: 1,
        unitario: 42.5,
        subtotal: 42.5,
        categoria: 'Alimentos (Despensa)',
        icon: 'utensils',
        categoriaColor: 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
        desmembrado: false,
      },
      {
        id: 'it-3',
        nome: 'Sabão Líquido Omo 3L',
        codEan: '789103829402',
        qtd: 1,
        unitario: 38.9,
        subtotal: 38.9,
        categoria: 'Limpeza (Supermercado / Variável)',
        icon: 'clean',
        categoriaColor: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]',
        desmembrado: false,
      },
      {
        id: 'it-4',
        nome: 'Shampoo Dove 400ml',
        codEan: '789115002931',
        qtd: 2,
        unitario: 22.0,
        subtotal: 44.0,
        categoria: 'Higiene Pessoal (Supermercado)',
        icon: 'soap',
        categoriaColor: 'bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]',
        desmembrado: false,
      },
      {
        id: 'it-5',
        nome: 'Dipirona 500mg c/ 20 comp',
        codEan: '789105820192',
        qtd: 1,
        unitario: 8.5,
        subtotal: 8.5,
        categoria: 'Remédio (Farmácia / Variável)',
        icon: 'pill',
        categoriaColor: 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]',
        desmembrado: true,
        aviso: 'Medicamento comprado em hipermercado. Sugestão: Desmembrar para orç. Saúde',
      },
    ],
  });

  // Recent history table matching reference image
  const [historyDocs, setHistoryDocs] = useState([
    {
      id: 'doc-1',
      dataHora: '14/03/2026 11:28',
      estabelecimento: 'Atacadão S/A',
      subtitulo: 'Supermercado Quinzenal',
      tipo: 'mercado',
      canal: 'App Mobile (Foto)',
      canalIcon: 'mobile',
      itensLidos: 16,
      valorTotal: 487.9,
      status: 'Conciliado c/ Lista de Compras',
      statusColor: 'bg-[#ecfdf5] text-[#006948]',
      hasAlert: false,
    },
    {
      id: 'doc-2',
      dataHora: '12/03/2026 19:40',
      estabelecimento: 'Posto Ipiranga Rota 101',
      subtitulo: 'Gasolina Aditivada 42L',
      tipo: 'posto',
      canal: 'NFC-e por E-mail',
      canalIcon: 'email',
      itensLidos: 1,
      valorTotal: 268.4,
      status: 'Processado',
      statusColor: 'bg-[#eff4ff] text-[#006194]',
      hasAlert: false,
    },
    {
      id: 'doc-3',
      dataHora: '10/03/2026 14:15',
      estabelecimento: 'Droga Raia S/A',
      subtitulo: 'Vitaminas e Cuidados',
      tipo: 'farmacia',
      canal: 'WhatsApp Bot',
      canalIcon: 'whatsapp',
      itensLidos: 4,
      valorTotal: 139.2,
      status: 'Processado',
      statusColor: 'bg-[#eff4ff] text-[#006194]',
      hasAlert: false,
    },
    {
      id: 'doc-4',
      dataHora: '08/03/2026 21:04',
      estabelecimento: "Empório & Panificadora Pão D'Ouro",
      subtitulo: 'Cupom SAT manchado',
      tipo: 'padaria',
      canal: 'Upload Manual',
      canalIcon: 'upload',
      itensLidos: 2,
      valorTotal: 64.1,
      status: 'Aguardando Revisão',
      statusColor: 'bg-[#fee2e2] text-[#dc2626]',
      hasAlert: true,
    },
  ]);

  // UI state
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [showReceiptZoom, setShowReceiptZoom] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    showToast(`Processando "${file.name}" com OCR Engine v4.2...`);

    setTimeout(() => {
      setIsScanningFile(false);
      setIsApproved(false);
      showToast('Leitura concluída com 99.2% de precisão! 16 itens identificados.');
    }, 1600);
  };

  const handleApprove = () => {
    setIsApproved(true);
    showToast('Cupom aprovado e conciliado com a Conta Central do Casal!');

    const approvedReceiptObj: Receipt = {
      id: `rec-${Date.now()}`,
      data: '2026-03-14',
      estabelecimento: extractedReceipt.estabelecimento,
      tipoEstabelecimento: 'Supermercado',
      numeroCupom: extractedReceipt.numeroCupom,
      valorTotal: extractedReceipt.totalLido,
      status: 'Conciliado',
      itens: extractedReceipt.itens.map((it, idx) => ({
        id: `pi-${idx}`,
        nome: it.nome,
        categoriaItem: it.desmembrado ? 'Remédio' : 'Alimentos',
        quantidade: it.qtd,
        precoUnitario: it.unitario,
        precoTotal: it.subtotal,
        desmembrado: it.desmembrado,
      })),
    };

    onApproveReceipt(approvedReceiptObj);
  };

  const handleToggleSplit = (index: number) => {
    const newItems = [...extractedReceipt.itens];
    newItems[index].desmembrado = !newItems[index].desmembrado;
    setExtractedReceipt({ ...extractedReceipt, itens: newItems });
    showToast(
      newItems[index].desmembrado
        ? `Item desmembrado para orçamento de Farmácia & Saúde!`
        : `Desmembramento removido para ${newItems[index].nome}`
    );
  };

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
      />

      {/* Floating Toast notification */}
      {toastMessage && (
        <div
          id="toast-scanner"
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
      {/* 1. MOBILE VIEW (Screens < 768px): Kept clean and mobile-friendly          */}
      {/* ========================================================================= */}
      <div id="scanner-mobile-view" className="block md:hidden w-full max-w-md mx-auto pb-24">
        {/* Status Banner */}
        <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 border border-[#bae6fd]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006948] shrink-0" />
                <h2 className="font-display font-bold text-sm text-[#0b1c30] truncate leading-tight">
                  Conciliação IA
                </h2>
              </div>
              <p className="text-[11px] text-[#565e74] mt-0.5 truncate">
                NFC-e & OCR Engine v4.2 • 84 cupons
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <span className="px-2.5 py-0.5 rounded-full bg-[#006948] text-white text-xs font-bold">
              99.2%
            </span>
            <span className="text-[10px] text-[#565e74] mt-0.5 font-medium">precisão</span>
          </div>
        </div>

        {/* Card: Capturar Comprovante */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
          <button
            onClick={handleTriggerFileInput}
            disabled={isScanningFile}
            className="w-full py-4 px-5 rounded-2xl bg-[#005a3c] hover:bg-[#00472f] text-white shadow-md flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-75"
          >
            <Camera className="w-6 h-6 text-white" />
            <div className="text-left">
              <span className="block font-bold text-sm text-white">
                {isScanningFile ? 'Processando Imagem...' : 'Tirar Foto ou Upload'}
              </span>
              <span className="block text-[11px] text-[#a7f3d0]">
                Auto-foco & corte automático com IA
              </span>
            </div>
          </button>
        </div>

        {/* Card: Cupom Extraído */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#f1f5f9]">
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold">
                Leitura Concluída
              </span>
              <h3 className="font-bold text-base text-[#0b1c30] mt-1">
                {extractedReceipt.estabelecimento}
              </h3>
              <p className="text-xs text-[#565e74]">
                {extractedReceipt.numeroCupom} • {extractedReceipt.dataHora}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-[#565e74]">Total Lido</span>
              <span className="font-display font-extrabold text-2xl text-[#0b1c30] font-mono">
                {formatBRL(extractedReceipt.totalLido)}
              </span>
            </div>
          </div>

          {/* Extracted items */}
          <div className="mt-4 space-y-2">
            {extractedReceipt.itens.map((item) => (
              <div key={item.id} className="py-2 border-b border-gray-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-[#0b1c30] block">{item.nome}</span>
                  <span className="text-[10px] text-[#565e74]">{item.categoria}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-[#0b1c30] block">{formatBRL(item.subtotal)}</span>
                  {item.desmembrado && (
                    <span className="text-[9px] text-[#dc2626] font-bold">Desmembrado</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleApprove}
            className="w-full mt-4 py-3.5 rounded-2xl bg-[#005a3c] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
            <span>Aprovar e Vincular à Conta</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Matches uploaded image.png 1:1         */}
      {/* ========================================================================= */}
      <div id="scanner-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
        {/* Top 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Conciliação IA */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold mb-2">
                • NFC-e & OCR Engine v4.2
              </span>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Conciliação IA
              </h3>
              <p className="text-xs text-[#565e74] mt-1">
                Elimine a digitação manual de notas fiscais com extração de itens ponta a ponta.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="text-[#565e74]">Último sync: <strong>Hoje, 14:32</strong></span>
              <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[10px] flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Ativo
              </span>
            </div>
          </div>

          {/* Card 2: Lidos por IA */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider">
                  LIDOS POR IA (2026)
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display font-extrabold text-3xl text-[#0b1c30] font-mono">
                  84
                </span>
                <span className="text-xs font-bold text-[#006948]">+18 este mês</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-[#005a3c] h-full rounded-full w-[82%]" />
            </div>
          </div>

          {/* Card 3: Precisão de Leitura */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider">
                  PRECISÃO DE LEITURA
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display font-extrabold text-3xl text-[#0b1c30] font-mono">
                  99.2%
                </span>
                <span className="text-xs text-[#565e74]">0.8% revisado</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#006948] font-medium pt-3 border-t border-[#f1f5f9] mt-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Visão Multimodal Ativa</span>
            </div>
          </div>

          {/* Card 4: Total Conciliado Auto */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider">
                  TOTAL CONCILIADO AUTO
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-bold text-[#565e74]">R$</span>
                <span className="font-display font-extrabold text-3xl text-[#0b1c30] font-mono">
                  11.450
                </span>
                <span className="text-sm font-bold text-[#565e74]">,00</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
              <span>Economia de ~6h de digitação</span>
            </div>
          </div>
        </div>

        {/* Upload Card (Full width because user specified "não precisa da captura rapida via celular") */}
        <div className="bg-[#f8faff] rounded-2xl p-8 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.02)] mb-8 text-center flex flex-col items-center justify-center relative">
          <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center mb-3">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="font-display font-bold text-base text-[#0b1c30]">
            Arraste seu cupom fiscal eletrônico
          </h3>
          <p className="text-xs text-[#565e74] mt-1 max-w-md">
            Suporta NFC-e, SAT, DANFE e recibos em PDF, JPG ou PNG (até 25MB)
          </p>

          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            <button
              onClick={handleTriggerFileInput}
              disabled={isScanningFile}
              className="px-5 py-2.5 rounded-xl bg-[#005a3c] hover:bg-[#00472f] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-70"
            >
              <FileText className="w-4 h-4" />
              <span>{isScanningFile ? 'Processando Documento...' : 'Selecionar arquivo do computador'}</span>
            </button>

            <span className="px-3 py-2 rounded-xl bg-[#eff4ff] text-[#006194] text-xs font-semibold flex items-center gap-1.5 border border-[#dce9ff]">
              <Sparkles className="w-3.5 h-3.5 text-[#006194]" />
              <span>Processamento em &lt; 2 segundos</span>
            </span>
          </div>
        </div>

        {/* Section: Revisão e Validação da IA */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006948]" />
              <h2 className="font-display font-bold text-base text-[#0b1c30]">
                Revisão e Validação da IA
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                Confiança Geral: 99.4%
              </span>
            </div>

            <div className="text-xs text-[#565e74] flex items-center gap-1.5">
              <span>Clique nos campos à direita para ajustar qualquer categoria ou valor</span>
            </div>
          </div>

          {/* Two-Column Validation Grid */}
          <div className="bg-white rounded-3xl border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column (5 cols): Visual Cupom Fiscal Digitalizado */}
            <div className="lg:col-span-4 p-5 bg-[#fcfdfe] border-b lg:border-b-0 lg:border-r border-[#e5eeff] flex flex-col justify-between">
              <div>
                {/* Cupom Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30]">
                    <FileText className="w-4 h-4 text-[#565e74]" />
                    <span>NFC-e #92819 - Atacadão S/A</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#565e74]">
                    <button
                      onClick={() => setShowReceiptZoom(true)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                      title="Ampliar"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowReceiptZoom(true)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                      title="Tela cheia"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => showToast('Abrindo link oficial da SEFAZ...')}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                      title="Link SEFAZ"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cupom Content Paper */}
                <div className="bg-[#f0fdf4]/50 border border-[#bbf7d0] rounded-2xl p-4 font-mono text-[11px] text-[#0b1c30] space-y-2 relative">
                  <div className="text-center pb-2 border-b border-dashed border-[#86efac]">
                    <span className="px-2 py-0.5 rounded bg-[#005a3c] text-white text-[9px] font-bold uppercase inline-block mb-1">
                      Estabelecimento Detectado
                    </span>
                    <h4 className="font-bold text-xs">ATACADÃO DISTRIBUIÇÃO S/A</h4>
                    <p className="text-[10px] text-[#565e74]">
                      Av. Duque de Caxias, 2800 - Teresina, PI
                    </p>
                    <p className="text-[10px] text-[#565e74]">
                      CNPJ: 75.315.333/0045-89 • IE: 86.492.110
                    </p>
                  </div>

                  <div className="flex justify-between text-[10px] text-[#565e74] pb-1 border-b border-dashed border-[#86efac]">
                    <span>EMISSÃO: 14/03/2026 11:28</span>
                    <span className="bg-[#eff4ff] text-[#006194] px-1 rounded font-bold">Data Fiscal</span>
                    <span>CCF: 039841</span>
                  </div>

                  {/* Cupom Items Print */}
                  <div className="space-y-1.5 py-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="truncate pr-2">001 ARROZ TIPO 1 5KG (2x 28.90)</span>
                      <span className="font-bold">57,80</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate pr-2">002 AZEITE EXTRA VIRGEM 500ML</span>
                      <span className="font-bold">42,50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate pr-2">003 SABAO LIQUIDO OMO 3L</span>
                      <span className="font-bold">38,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate pr-2">004 SHAMPOO DOVE 400ML (2x 22.00)</span>
                      <span className="font-bold">44,00</span>
                    </div>
                    <div className="flex justify-between text-[#dc2626] font-bold bg-[#fee2e2]/60 px-1 py-0.5 rounded">
                      <span className="truncate pr-2">005 DIPIRONA 500MG C/20 COMP</span>
                      <span>8,50</span>
                    </div>
                    <div className="text-center text-[9px] text-[#565e74] italic pt-1">
                      + 12 outros itens alimentícios e mercearia processados
                    </div>
                  </div>

                  {/* Total Box in Cupom */}
                  <div className="bg-[#dcfce7] rounded-xl p-2.5 border border-[#86efac] mt-2">
                    <div className="text-[10px] font-bold text-[#006948] uppercase">
                      Total & Pagamento
                    </div>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <span className="font-bold text-xs">TOTAL R$</span>
                      <span className="font-extrabold text-base font-mono text-[#005a3c]">
                        487,90
                      </span>
                    </div>
                    <div className="text-[9px] text-[#565e74] mt-1 flex justify-between">
                      <span>Forma: Cartão de Crédito</span>
                      <span>Mastercard Final 8821</span>
                    </div>
                  </div>

                  {/* Barcode Mock */}
                  <div className="pt-2 text-center">
                    <div className="h-6 w-full flex items-center justify-center gap-1 opacity-70">
                      {[12, 24, 8, 16, 20, 10, 14, 22, 18, 12, 16, 24, 10].map((h, i) => (
                        <div key={i} style={{ height: `${h}px` }} className="w-1 bg-black" />
                      ))}
                    </div>
                    <span className="text-[8px] tracking-wider text-gray-500 block mt-1">
                      3326 0375 3153 3380 4589 6500 1800 9281 9118 4879 01
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (8 cols): Metadata & Itens Identificados e Categorizados */}
            <div className="lg:col-span-8 p-6 flex flex-col justify-between">
              <div>
                {/* Top 4 metadata cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 border-b border-[#f1f5f9]">
                  <div>
                    <span className="text-[10px] text-[#565e74] block">Estabelecimento</span>
                    <span className="font-bold text-xs text-[#0b1c30] block mt-0.5">
                      {extractedReceipt.estabelecimento}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block">Data da Compra</span>
                    <span className="font-bold text-xs text-[#0b1c30] block mt-0.5">
                      14/03/2026
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block">Meio de Pgto</span>
                    <span className="font-bold text-xs text-[#0b1c30] block mt-0.5">
                      {extractedReceipt.meioPagamento}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block">Comprador</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-[#006194] text-white font-bold text-[9px] flex items-center justify-center">
                        M
                      </div>
                      <span className="font-bold text-xs text-[#0b1c30]">
                        {extractedReceipt.comprador}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Title & Controls */}
                <div className="flex items-center justify-between my-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Itens Identificados e Categorizados
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold">
                      5 de 16 exibidos
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#006948] bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
                    ✓ Despesa 50/50 do Casal
                  </span>
                </div>

                {/* Extracted Items Table */}
                <div className="border border-[#e5eeff] rounded-2xl overflow-hidden mb-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">DESCRIÇÃO DO ITEM</th>
                        <th className="py-2.5 px-2 text-center">QTD</th>
                        <th className="py-2.5 px-2">UNITÁRIO</th>
                        <th className="py-2.5 px-2">SUBTOTAL</th>
                        <th className="py-2.5 px-3">CLASSIFICAÇÃO SUGERIDA</th>
                        <th className="py-2.5 px-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {extractedReceipt.itens.map((it, idx) => (
                        <tr key={idx} className="hover:bg-[#f8faff] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#0b1c30]">
                            {it.nome}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#565e74]">
                            {it.qtd}
                          </td>
                          <td className="py-2.5 px-2 text-[#565e74]">
                            {formatBRL(it.unitario)}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-[#0b1c30]">
                            {formatBRL(it.total)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#006194]">
                              {it.categoria}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006948]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#006948]" />
                              Identificado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Split & Total Summary Row */}
                <div className="bg-[#f8faff] rounded-2xl p-3 border border-[#e5eeff] flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1">
                      <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                        F
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#ec4899] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                        G
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0b1c30] block">
                        Despesa Compartilhada do Casal (50/50)
                      </span>
                      <span className="text-[11px] text-[#565e74]">
                        Lançamento integrado ao orçamento conjunto de Felipe e Genivânia
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#565e74] block uppercase font-bold">
                      Total Extraído
                    </span>
                    <span className="font-display font-extrabold text-lg text-[#0b1c30] font-mono">
                      {formatBRL(extractedReceipt.totalLido)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#f1f5f9] flex-wrap">
                <button
                  onClick={() => setShowEditItemsModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#cbd5e1] hover:bg-[#eff4ff] text-xs font-bold text-[#0b1c30] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#565e74]" />
                  <span>Rejeitar / Reclassificar Itens Manuais</span>
                </button>

                <button
                  onClick={handleApprove}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                    isApproved ? 'bg-[#00472f]' : 'bg-[#005a3c] hover:bg-[#00472f]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                  <span>{isApproved ? 'Vinculado com Sucesso!' : 'Aprovar e Vincular à Transação Bancária'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Histórico Recente de Comprovantes & Notas Fiscais */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Histórico Recente de Comprovantes & Notas Fiscais
              </h3>
              <p className="text-xs text-[#565e74]">
                Últimos documentos capturados via app, WhatsApp, e-mail ou escaneamento direto
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Filtrando por categoria...')}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-[#565e74]" />
                <span>Filtrar por Categoria</span>
              </button>

              <button
                onClick={() => showToast('Exportando relatório CSV...')}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#565e74]" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">DATA / HORA</th>
                  <th className="py-3 px-4">ESTABELECIMENTO</th>
                  <th className="py-3 px-4">CANAL / ORIGEM</th>
                  <th className="py-3 px-4">ITENS LIDOS</th>
                  <th className="py-3 px-4">VALOR TOTAL</th>
                  <th className="py-3 px-4">STATUS DA CONCILIAÇÃO</th>
                  <th className="py-3 px-4 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {historyDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                      {item.dataHora}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            item.tipo === 'mercado'
                              ? 'bg-[#ecfdf5] text-[#006948]'
                              : item.tipo === 'posto'
                              ? 'bg-[#eff4ff] text-[#006194]'
                              : item.tipo === 'farmacia'
                              ? 'bg-[#ecfdf5] text-[#006948]'
                              : 'bg-[#fff7ed] text-[#ea580c]'
                          }`}
                        >
                          {item.tipo === 'mercado' ? (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          ) : item.tipo === 'posto' ? (
                            <Fuel className="w-3.5 h-3.5" />
                          ) : item.tipo === 'farmacia' ? (
                            <Pill className="w-3.5 h-3.5" />
                          ) : (
                            <ReceiptIcon className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[#0b1c30] block">
                            {item.estabelecimento}
                          </span>
                          <span className="text-[11px] text-[#565e74]">{item.subtitulo}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                      <div className="flex items-center gap-1.5">
                        {item.canalIcon === 'mobile' ? (
                          <Smartphone className="w-3.5 h-3.5 text-[#006948]" />
                        ) : item.canalIcon === 'email' ? (
                          <Mail className="w-3.5 h-3.5 text-[#006194]" />
                        ) : item.canalIcon === 'whatsapp' ? (
                          <MessageSquare className="w-3.5 h-3.5 text-[#16a34a]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-[#565e74]" />
                        )}
                        <span>{item.canal}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                      {item.itensLidos} itens
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#0b1c30]">
                      {formatBRL(item.valorTotal)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.statusColor}`}
                      >
                        {item.hasAlert ? (
                          <AlertTriangle className="w-3 h-3 text-[#dc2626]" />
                        ) : (
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => showToast(`Visualizando comprovante de ${item.estabelecimento}`)}
                        className="p-1.5 text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        title="Ver Comprovante"
                      >
                        {item.hasAlert ? (
                          <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Health Bar matching overall app */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center justify-between flex-wrap gap-3 text-xs text-[#565e74]">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-[#006948]" />
            <span className="font-bold text-[#0b1c30]">Saúde Financeira do Mês:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] font-bold text-[11px]">
              Equilibrada (78% da Meta)
            </span>
            <span className="text-[#565e74] ml-2">
              Controle Conjunto 50/50: <strong className="text-[#0b1c30]">R$ 14.850 / R$ 18.000</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button className="hover:text-[#006948] hover:underline cursor-pointer">
              Auditoria Fiscal
            </button>
            <span>•</span>
            <button className="hover:text-[#006948] hover:underline cursor-pointer">
              Orçamento Paritário 50/50
            </button>
            <span>•</span>
            <button className="hover:text-[#006948] hover:underline cursor-pointer">
              Exportar Relatório Mensal
            </button>
            <span>•</span>
            <span>© 2026 Duarte Finanças</span>
          </div>
        </div>
      </div>

      {/* Modal: Receipt Zoom */}
      {showReceiptZoom && (
        <div
          id="modal-receipt-zoom-backdrop"
          onClick={() => setShowReceiptZoom(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-receipt-zoom-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setShowReceiptZoom(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-display font-bold text-base text-[#0b1c30] mb-2">
              Visualização da NFC-e Digital
            </h4>

            <div className="bg-[#fafafa] border border-dashed border-gray-400 rounded-2xl p-4 font-mono text-xs text-gray-700 space-y-2">
              <div className="text-center pb-2 border-b border-gray-300">
                <span className="font-bold text-sm block">ATACADÃO DISTRIBUIÇÃO S/A</span>
                <span>CNPJ: 75.315.333/0045-89</span>
                <span className="block text-[10px] text-gray-500">
                  {extractedReceipt.numeroCupom} • {extractedReceipt.dataHora}
                </span>
              </div>

              <div className="space-y-1 py-2 border-b border-gray-300 text-[11px]">
                {extractedReceipt.itens.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span className="truncate pr-2">{it.nome}</span>
                    <span className="font-bold shrink-0">{formatBRL(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL R$</span>
                <span>{formatBRL(extractedReceipt.totalLido)}</span>
              </div>

              <div className="pt-2 text-center text-[10px] text-gray-500">
                FORMA: {extractedReceipt.meioPagamento}
              </div>
            </div>

            <button
              onClick={() => setShowReceiptZoom(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#0b1c30] text-white text-xs font-bold hover:bg-[#1f2937]"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* Modal: Editar Itens */}
      {showEditItemsModal && (
        <div
          id="modal-editar-itens-backdrop"
          onClick={() => setShowEditItemsModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-editar-itens-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div>
                <h4 className="font-display font-bold text-base text-[#0b1c30]">
                  Reclassificar Itens do Cupom
                </h4>
                <p className="text-xs text-[#565e74]">
                  Ajuste valores, descrições ou desmembramentos
                </p>
              </div>
              <button
                onClick={() => setShowEditItemsModal(false)}
                className="p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {extractedReceipt.itens.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-[#e5eeff] bg-[#f8faff] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#0b1c30]">
                      {item.nome}
                    </span>
                    <button
                      onClick={() => handleToggleSplit(idx)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        item.desmembrado
                          ? 'bg-[#fee2e2] text-[#dc2626]'
                          : 'bg-white border border-[#cbd5e1] text-[#565e74]'
                      }`}
                    >
                      {item.desmembrado ? 'Desmembrado' : 'Desmembrar'}
                    </button>
                  </div>
                  <div className="text-xs text-[#565e74]">
                    Subtotal: <strong>{formatBRL(item.subtotal)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowEditItemsModal(false);
                showToast('Alterações salvas!');
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#005a3c] text-white text-xs font-bold"
            >
              Concluir Reclassificação
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
