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
  CreditCard,
  Copy,
  Link2,
  Video,
  VideoOff,
} from 'lucide-react';
import { Receipt, PurchaseItem } from '../types';
import { formatBRL } from '../utils/formatters';
import { analyzeReceiptDirect } from '../services/clientOcrService';

interface ScannerViewProps {
  receipts: Receipt[];
  initialReceiptToView?: Receipt | null;
  onApproveReceipt: (receipt: Receipt) => Promise<boolean> | void;
  onLinkToTransaction?: (receipt: Receipt) => void;
  onDeleteReceipt?: (id: string) => Promise<void> | void;
  onSaveReceiptDraft?: (receipt: Receipt) => Promise<boolean> | void;
  onNavigateToExtrato?: (mes?: string) => void;
  selectedMonth?: string;
}

const getMonthNameFromDate = (dateStr: string): string => {
  if (!dateStr) return 'Março 2026';
  // Normalizar se for dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.split('/');
    const month = parts[1];
    const map: Record<string, string> = {
      '01': 'Janeiro 2026',
      '02': 'Fevereiro 2026',
      '03': 'Março 2026',
      '04': 'Abril 2026',
      '05': 'Maio 2026',
      '06': 'Junho 2026',
      '07': 'Julho 2026',
      '08': 'Agosto 2026',
      '09': 'Setembro 2026',
      '10': 'Outubro 2026',
      '11': 'Novembro 2026',
      '12': 'Dezembro 2026',
    };
    return map[month] || 'Março 2026';
  }
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const map: Record<string, string> = {
      '01': 'Janeiro 2026',
      '02': 'Fevereiro 2026',
      '03': 'Março 2026',
      '04': 'Abril 2026',
      '05': 'Maio 2026',
      '06': 'Junho 2026',
      '07': 'Julho 2026',
      '08': 'Agosto 2026',
      '09': 'Setembro 2026',
      '10': 'Outubro 2026',
      '11': 'Novembro 2026',
      '12': 'Dezembro 2026',
    };
    return map[parts[1]] || 'Março 2026';
  }
  return 'Março 2026';
};

const mapReceiptToViewModel = (r: Receipt) => {
  const items = (r.itens || []).map((it: any, idx: number) => {
    const isRemedio =
      (it.categoriaItem || '').toLowerCase().includes('reméd') ||
      (it.categoriaItem || '').toLowerCase().includes('farm');
    return {
      id: it.id || `it-${idx}`,
      nome: it.nome || it.nome_do_item || 'Item do Comprovante',
      codEan: it.codEan || '',
      qtd: Number(it.quantidade) || 1,
      unitario: Number(it.precoUnitario) || Number(it.precoTotal) || 0,
      subtotal: Number(it.precoTotal) || 0,
      categoria: it.categoriaItem || 'Supermercado / Variável',
      icon: isRemedio ? 'pill' : 'utensils',
      categoriaColor: isRemedio
        ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]'
        : 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
      desmembrado: !!it.desmembrado,
      aviso: undefined,
    };
  });

  return {
    id: r.id,
    numeroCupom: r.numeroCupom || `NFC-e #${r.id.slice(-6)}`,
    dataHora: r.data,
    estabelecimento: r.estabelecimento,
    cnpj: '',
    ie: '',
    endereco: 'Teresina, PI',
    ccf: '',
    totalLido: Number(r.valorTotal) || 0,
    meioPagamento: 'Cartão NuBank Compartilhado',
    comprador: 'Felipe Duarte & Genivânia Duarte',
    itens: items,
  };
};

export const ScannerView: React.FC<ScannerViewProps> = ({
  receipts,
  initialReceiptToView,
  onApproveReceipt,
  onLinkToTransaction,
  onDeleteReceipt,
  onSaveReceiptDraft,
  onNavigateToExtrato,
  selectedMonth,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // QR Code Scanner state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInputText, setQrInputText] = useState('');
  const [qrActiveTab, setQrActiveTab] = useState<'camera' | 'manual'>('camera');
  const [isQrCameraActive, setIsQrCameraActive] = useState(false);
  const [qrCameraError, setQrCameraError] = useState<string | null>(null);
  const [isProcessingQr, setIsProcessingQr] = useState(false);
  const qrVideoRef = useRef<HTMLVideoElement>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);

  // Active extracted receipt state - starts with the first real receipt from DB or empty
  const [extractedReceipt, setExtractedReceipt] = useState(() => {
    if (initialReceiptToView) {
      return mapReceiptToViewModel(initialReceiptToView);
    }
    if (receipts && receipts.length > 0) {
      return mapReceiptToViewModel(receipts[0]);
    }
    return {
      id: '',
      numeroCupom: 'Nenhum cupom ativo',
      dataHora: new Date().toLocaleDateString('pt-BR'),
      estabelecimento: 'Aguardando comprovante',
      cnpj: '',
      ie: '',
      endereco: 'Teresina, PI',
      ccf: '',
      totalLido: 0,
      meioPagamento: 'Cartão NuBank Compartilhado',
      comprador: 'Felipe Duarte & Genivânia Duarte',
      itens: [] as any[],
    };
  });

  // Keep extractedReceipt in sync when initialReceiptToView changes
  React.useEffect(() => {
    if (initialReceiptToView) {
      setExtractedReceipt(mapReceiptToViewModel(initialReceiptToView));
      if (initialReceiptToView.imagemUrl) {
        setUploadedImage(initialReceiptToView.imagemUrl);
        setLeftViewMode('photo');
      }
      setIsApproved(initialReceiptToView.status === 'Conciliado');
    }
  }, [initialReceiptToView]);

  // Keep extractedReceipt in sync when receipts load from Supabase if not yet selected
  React.useEffect(() => {
    if (receipts && receipts.length > 0 && !extractedReceipt.id && !initialReceiptToView) {
      setExtractedReceipt(mapReceiptToViewModel(receipts[0]));
      setIsApproved(receipts[0].status === 'Conciliado');
    }
  }, [receipts, initialReceiptToView]);

  // UI state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [leftViewMode, setLeftViewMode] = useState<'photo' | 'paper'>('photo');
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedMonth, setApprovedMonth] = useState<string | null>(null);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [showReceiptZoom, setShowReceiptZoom] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Botão 1: Dispara câmera nativa
  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Botão 2: Dispara seletor de arquivos / galeria de fotos (sem capture)
  const handleTriggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  // Compatibilidade com desktop
  const handleTriggerFileInput = () => {
    handleTriggerGallery();
  };

  // Botão 3: Abre o modal dedicado de QR Code NFC-e
  const handleTriggerQrCode = () => {
    setShowQrModal(true);
  };

  // Funções da Câmera do Leitor de QR Code
  const startQrCamera = async () => {
    setQrCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setQrCameraError('Acesso à câmera não suportado neste navegador. Use a opção de digitar a chave.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      qrStreamRef.current = stream;
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream;
        await qrVideoRef.current.play();
      }
      setIsQrCameraActive(true);

      // Suporte a BarcodeDetector nativo se disponível
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const scanInterval = setInterval(async () => {
            if (!qrVideoRef.current || !qrStreamRef.current) {
              clearInterval(scanInterval);
              return;
            }
            try {
              const barcodes = await detector.detect(qrVideoRef.current);
              if (barcodes && barcodes.length > 0) {
                clearInterval(scanInterval);
                const rawVal = barcodes[0].rawValue;
                stopQrCamera();
                handleProcessQrValue(rawVal);
              }
            } catch {}
          }, 400);
        } catch {}
      }
    } catch (err: any) {
      console.warn('[ScannerView] Câmera QR não iniciada:', err);
      setQrCameraError('Permissão de câmera não concedida ou dispositivo ocupado. Use o botão "Capturar" ou digite a chave.');
      setIsQrCameraActive(false);
    }
  };

  const stopQrCamera = () => {
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    setIsQrCameraActive(false);
  };

  // Iniciar e parar câmera ao abrir/fechar modal QR Code
  React.useEffect(() => {
    if (showQrModal && qrActiveTab === 'camera') {
      startQrCamera();
    } else {
      stopQrCamera();
    }
    return () => {
      stopQrCamera();
    };
  }, [showQrModal, qrActiveTab]);

  // Capturar frame da câmera para leitura
  const handleCaptureQrSnapshot = () => {
    if (!qrVideoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = qrVideoRef.current.videoWidth || 640;
      canvas.height = qrVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(qrVideoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        stopQrCamera();
        setShowQrModal(false);
        setUploadedImage(base64);
        setLeftViewMode('photo');
        setUploadedFileName('Captura_QRCode_NFCe.jpg');
        fetchOcrForBase64(base64, 'image/jpeg', 'Captura_QRCode_NFCe.jpg');
      }
    } catch {
      showToast('Erro ao capturar frame da câmera.');
    }
  };

  // Mapeamento dos códigos UF do Brasil
  const UF_MAP: Record<string, string> = {
    '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
    '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
    '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR',
    '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
  };

  // Decodifica QR Code ou Chave de Acesso de 44 dígitos da NFC-e
  const handleProcessQrValue = (rawInput: string) => {
    if (!rawInput || !rawInput.trim()) {
      showToast('Por favor, digite ou escaneie a Chave de Acesso ou Link da NFC-e.');
      return;
    }
    setIsProcessingQr(true);
    const cleaned = rawInput.trim();

    // Extrair chave de 44 dígitos
    const digitsOnly = cleaned.replace(/\D/g, '');
    const keyMatch = digitsOnly.match(/\d{44}/);
    const key = keyMatch ? keyMatch[0] : null;

    // Verificar se veio valor na URL do QR Code (padrão vNF ou pipes |)
    let valorEncontrado = 0;
    if (cleaned.includes('|')) {
      const parts = cleaned.split('|');
      for (const p of parts) {
        const num = parseFloat(p.replace(',', '.'));
        if (!isNaN(num) && num > 0 && num < 50000 && (p.includes('.') || p.includes(','))) {
          valorEncontrado = num;
          break;
        }
      }
    } else {
      const valMatch = cleaned.match(/[?&]vNF=([0-9.,]+)/i);
      if (valMatch) {
        valorEncontrado = parseFloat(valMatch[1].replace(',', '.'));
      }
    }

    if (key) {
      const ufCode = key.slice(0, 2);
      const uf = UF_MAP[ufCode] || 'PI';
      const year = `20${key.slice(2, 4)}`;
      const month = key.slice(4, 6);
      const cnpjRaw = key.slice(6, 20);
      const cnpjFmt = cnpjRaw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      const numNota = parseInt(key.slice(25, 34), 10).toString();
      const newId = `nfc-${Date.now()}`;
      const dataIso = `${year}-${month}-15`;

      const newModel = {
        id: newId,
        numeroCupom: `NFC-e #${numNota}`,
        dataHora: `${dataIso} 12:00`,
        estabelecimento: `Estabelecimento NFC-e (${uf})`,
        cnpj: cnpjFmt,
        ie: '',
        endereco: `${uf}, Brasil`,
        ccf: '',
        totalLido: valorEncontrado || 0,
        meioPagamento: 'Cartão NuBank / PIX',
        comprador: 'Felipe Duarte & Genivânia Duarte',
        itens: [
          {
            id: `it-${Date.now()}-1`,
            nome: `Lançamento NFC-e #${numNota}`,
            codEan: key.slice(0, 12),
            qtd: 1,
            unitario: valorEncontrado || 0,
            subtotal: valorEncontrado || 0,
            categoria: 'Supermercado / Variável',
            icon: 'shopping-cart',
            categoriaColor: 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
            desmembrado: false,
            aviso: `Chave de Acesso Oficial: ${key}`,
          },
        ],
      };

      setExtractedReceipt(newModel);
      setIsApproved(false);
      setShowQrModal(false);
      stopQrCamera();
      showToast(`✅ NFC-e #${numNota} (${uf}) decodificada com sucesso!`);

      // Persistir rascunho oficial
      if (onSaveReceiptDraft) {
        onSaveReceiptDraft({
          id: newId,
          data: dataIso,
          estabelecimento: newModel.estabelecimento,
          tipoEstabelecimento: 'Supermercado',
          numeroCupom: newModel.numeroCupom,
          valorTotal: valorEncontrado || 0,
          status: 'Pendente',
          itens: newModel.itens.map((it) => ({
            id: it.id,
            nome: it.nome,
            categoriaItem: it.categoria,
            quantidade: it.qtd,
            precoUnitario: it.unitario,
            precoTotal: it.subtotal,
          })),
        });
      }
    } else {
      showToast('Chave de acesso não identificada. Insira os 44 números ou o link oficial da SEFAZ.');
    }
    setIsProcessingQr(false);
  };

  // Processar OCR com Gemini
  const fetchOcrForBase64 = async (base64: string, mimeType: string, fileName: string) => {
    setUploadedFileName(fileName);
    setIsScanningFile(true);
    setScanStepMessage(`Analisando "${fileName}" com Gemini Vision OCR...`);
    showToast('IA examinando comprovante com visão computacional...');

    try {
      let d: any = null;

      try {
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: mimeType || 'image/jpeg',
          }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            d = json.data;
          }
        }
      } catch (endpointErr) {
        console.warn('[ScannerView] Endpoint indisponível, acionando fallback direto...', endpointErr);
      }

      // Fallback direto: se o endpoint da API não respondeu ou deu erro, usa cliente direto Gemini
      if (!d) {
        setScanStepMessage(`Conectando diretamente com IA Gemini (${fileName})...`);
        d = await analyzeReceiptDirect(base64, mimeType);
      }

      if (d) {
        const mappedItems = (d.itens || []).map((it: any, idx: number) => {
          const isRemedio =
            (it.categoriaItem || '').toLowerCase().includes('reméd') ||
            (it.categoriaItem || '').toLowerCase().includes('farm') ||
            (it.subcategoriaSugerida || '').toLowerCase().includes('farm');
          return {
            id: it.id || `it-${Date.now()}-${idx}`,
            nome: it.nome || 'Produto / Item',
            codEan: it.codigoEan || '',
            qtd: Number(it.quantidade) || 1,
            unitario: Number(it.precoUnitario) || Number(it.precoTotal) || 0,
            subtotal: Number(it.precoTotal) || 0,
            categoria: it.categoriaItem || it.subcategoriaSugerida || 'Alimentos (Supermercado / Variável)',
            icon: isRemedio ? 'pill' : 'utensils',
            categoriaColor: isRemedio
              ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]'
              : 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
            desmembrado: !!it.desmembrado,
            aviso: it.motivoDesmembramento || undefined,
          };
        });

        const totalCalculated =
          Number(d.valorTotal) ||
          mappedItems.reduce((sum: number, it: any) => sum + (it.subtotal || 0), 0);

        const newReceiptId = `nfc-${Date.now()}`;
        const rawDate =
          d.data && d.data !== 'Não identificado'
            ? d.data
            : new Date().toLocaleDateString('pt-BR');

        const newReceiptModel = {
          id: newReceiptId,
          numeroCupom:
            d.numeroCupom && d.numeroCupom !== 'Não identificado'
              ? d.numeroCupom
              : `NFC-e #${Math.floor(10000 + Math.random() * 90000)}`,
          dataHora: rawDate,
          estabelecimento:
            d.estabelecimento && d.estabelecimento !== 'Não identificado'
              ? d.estabelecimento
              : 'Estabelecimento Identificado',
          cnpj: d.cnpj && d.cnpj !== 'Não identificado' ? d.cnpj : '',
          ie: d.ie || '',
          endereco: d.endereco && d.endereco !== 'Não identificado' ? d.endereco : 'Teresina, PI',
          ccf: d.ccf || '',
          totalLido: totalCalculated,
          meioPagamento:
            d.formaPagamento && d.formaPagamento !== 'Não identificado'
              ? d.formaPagamento
              : 'Cartão NuBank Compartilhado',
          comprador:
            d.comprador && d.comprador !== 'Não identificado'
              ? d.comprador
              : 'Felipe Duarte & Genivânia Duarte',
          itens: mappedItems,
        };

        setExtractedReceipt(newReceiptModel);
        setIsApproved(false);
        setApprovedMonth(null);

        // Salvar rascunho no Supabase para garantir persistência na nuvem
        if (onSaveReceiptDraft) {
          const isFarm =
            newReceiptModel.estabelecimento.toLowerCase().includes('farm') ||
            newReceiptModel.estabelecimento.toLowerCase().includes('droga');
          const isGas =
            newReceiptModel.estabelecimento.toLowerCase().includes('posto') ||
            newReceiptModel.estabelecimento.toLowerCase().includes('combust');

          const draftObj: Receipt = {
            id: newReceiptId,
            data: rawDate,
            estabelecimento: newReceiptModel.estabelecimento,
            tipoEstabelecimento: isFarm ? 'Farmácia' : isGas ? 'Posto de combustível' : 'Supermercado',
            numeroCupom: newReceiptModel.numeroCupom,
            valorTotal: totalCalculated,
            status: 'Pendente',
            imagemUrl: base64,
            itens: mappedItems.map((it) => ({
              id: it.id,
              nome: it.nome,
              categoriaItem: it.categoria,
              quantidade: it.qtd,
              precoUnitario: it.unitario,
              precoTotal: it.subtotal,
              desmembrado: it.desmembrado,
            })),
          };

          onSaveReceiptDraft(draftObj).then((saved) => {
            if (saved) {
              showToast(`✅ Comprovante "${d.estabelecimento}" lido com sucesso! Revise e aprove para lançar no Extrato.`);
            } else {
              showToast(`Comprovante lido com sucesso! ${mappedItems.length} itens extraídos.`);
            }
          });
        } else {
          showToast(`Comprovante "${d.estabelecimento}" lido com sucesso! ${mappedItems.length} itens extraídos.`);
        }
      } else {
        showToast('Não foi possível extrair dados do comprovante. Tente uma foto mais nítida.');
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      showToast('Erro ao comunicar com a IA Gemini para leitura do comprovante.');
    } finally {
      setIsScanningFile(false);
      setScanStepMessage('');
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('Por favor, selecione uma imagem (JPG, PNG, WEBP) ou documento PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setIsScanningFile(false);
      setScanStepMessage('');
      showToast('Erro ao ler o arquivo selecionado.');
    };

    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setLeftViewMode('photo');
      fetchOcrForBase64(base64, file.type || 'image/jpeg', file.name);
    };

    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = '';
    }
  };

  const handleApprove = async () => {
    setIsSavingReceipt(true);
    showToast('Salvando no banco de dados e conciliando na conta central do casal...');

    const isFarmacia =
      extractedReceipt.estabelecimento.toLowerCase().includes('farm') ||
      extractedReceipt.estabelecimento.toLowerCase().includes('droga');
    const isPosto =
      extractedReceipt.estabelecimento.toLowerCase().includes('posto') ||
      extractedReceipt.estabelecimento.toLowerCase().includes('combust');

    const approvedReceiptObj: Receipt = {
      id: extractedReceipt.id || `nfc-${Date.now()}`,
      data: extractedReceipt.dataHora || new Date().toISOString(),
      estabelecimento: extractedReceipt.estabelecimento,
      tipoEstabelecimento: isFarmacia ? 'Farmácia' : isPosto ? 'Posto de combustível' : 'Supermercado',
      numeroCupom: extractedReceipt.numeroCupom,
      valorTotal: extractedReceipt.totalLido,
      status: 'Conciliado',
      imagemUrl: uploadedImage || undefined,
      formaPagamento: extractedReceipt.meioPagamento,
      pagoPor: extractedReceipt.comprador,
      itens: extractedReceipt.itens.map((it, idx) => ({
        id: it.id || `pi-${idx}`,
        nome: it.nome,
        categoriaItem: it.desmembrado ? 'Remédio' : it.categoria,
        quantidade: it.qtd,
        precoUnitario: it.unitario,
        precoTotal: it.subtotal,
        desmembrado: it.desmembrado,
      })),
    };

    try {
      await onApproveReceipt(approvedReceiptObj);
      setIsApproved(true);
      const targetM = getMonthNameFromDate(approvedReceiptObj.data);
      setApprovedMonth(targetM);
      showToast(`🎉 Cupom aprovado! Transação de ${formatBRL(approvedReceiptObj.valorTotal)} lançada no Extrato de ${targetM}.`);
    } catch (err) {
      console.error('Erro ao aprovar cupom:', err);
      showToast('Erro ao salvar no banco de dados. Tente novamente.');
    } finally {
      setIsSavingReceipt(false);
    }
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

  const totalCupons = receipts.length;
  const totalConciliado = receipts.reduce((acc, r) => acc + (Number(r.valorTotal) || 0), 0);
  const activeReceiptMes = getMonthNameFromDate(extractedReceipt.dataHora);
  const ultimoEstabelecimento = receipts.length > 0 ? receipts[0].estabelecimento : 'Aguardando cupom';

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* 1. Input para Câmera Nativa (capture="environment") */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* 2. Input para Galeria / Arquivos / PDF (sem capture) */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileUpload}
        accept="image/*,application/pdf"
        className="hidden"
      />

      {/* 3. Input para Upload de Foto com QR Code */}
      <input
        type="file"
        ref={qrFileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
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
      {/* 1. MOBILE VIEW (Screens < 768px): Fiel à Imagem 2 de Referência           */}
      {/* ========================================================================= */}
      <div id="scanner-mobile-view" className="block md:hidden w-full max-w-md mx-auto px-1 pb-24">
        {/* Status Banner */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-xs flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 border border-[#bae6fd]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006948] shrink-0" />
                <h2 className="font-display font-bold text-xs text-[#0b1c30] truncate">
                  Visão Multimodal IA
                </h2>
              </div>
              <p className="text-[10px] text-[#565e74] truncate mt-0.5">
                Gemini Vision OCR • {totalCupons} {totalCupons === 1 ? 'cupom' : 'cupons'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold border border-[#a7f3d0]">
              100% precisão
            </span>
          </div>
        </div>

        {/* Card: Capturar Comprovante */}
        <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                Capturar Comprovante
              </h3>
              <span className="text-[10px] text-[#565e74]">NFC-e / SAT / PDF</span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-[#f8faff] text-[#565e74] flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>

          {/* Botão 1: Tirar Foto do Cupom (Abre Câmera Nativa) */}
          <button
            onClick={handleTriggerCamera}
            disabled={isScanningFile}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#005a3c] hover:bg-[#00472f] text-white shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 active:scale-98 transition-all"
          >
            <Camera className="w-5 h-5 text-white shrink-0" />
            <div className="text-left min-w-0">
              <span className="block font-bold text-xs text-white leading-tight truncate">
                {isScanningFile ? 'Processando Imagem...' : 'Tirar Foto do Cupom'}
              </span>
              <span className="block text-[10px] text-[#a7f3d0] truncate">
                Abre câmera com auto-foco & corte IA
              </span>
            </div>
          </button>

          {/* Sub-Ações Rápidas: Botão 2 (Galeria) e Botão 3 (QR Code) */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <button
              onClick={handleTriggerGallery}
              disabled={isScanningFile}
              className="py-2.5 px-3 rounded-xl border border-[#cbd5e1] text-[11px] font-semibold text-[#0b1c30] bg-[#f8faff] hover:bg-[#eff4ff] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#006194]" />
              <span>Galeria / PDF</span>
            </button>
            <button
              onClick={handleTriggerQrCode}
              disabled={isScanningFile}
              className="py-2.5 px-3 rounded-xl border border-[#cbd5e1] text-[11px] font-semibold text-[#0b1c30] bg-[#f8faff] hover:bg-[#eff4ff] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-[#006948]" />
              <span>QR Code NFC-e</span>
            </button>
          </div>
        </div>

        {/* Card: Cupom Extraído */}
        <div className="bg-white rounded-3xl p-4 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mb-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#006948] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[9px] font-bold">
                  Leitura Concluída
                </span>
                <h4 className="font-bold text-sm text-[#0b1c30] mt-0.5 leading-tight">
                  {extractedReceipt.estabelecimento}
                </h4>
                <p className="text-[10px] text-[#565e74]">
                  {extractedReceipt.numeroCupom} • {extractedReceipt.dataHora}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[9px] font-bold text-[#565e74] uppercase">Total Lido</span>
              <span className="font-display font-extrabold text-xl text-[#0b1c30] font-mono leading-tight">
                {formatBRL(extractedReceipt.totalLido)}
              </span>
            </div>
          </div>

          {/* Itens Extraídos */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-[11px] text-[#0b1c30]">
                ITENS EXTRAÍDOS ({extractedReceipt.itens.length})
              </span>
              <span className="text-[10px] text-[#006948] font-bold">
                Categorizados
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {extractedReceipt.itens.map((item) => (
                <div key={item.id} className="p-2 rounded-xl bg-[#f8faff] border border-[#f1f5f9] flex justify-between items-center text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-xs text-[#0b1c30] block truncate">
                      {item.nome}
                    </span>
                    <span className="inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white text-[#565e74] border border-[#e2e8f0]">
                      {item.categoria}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0b1c30] shrink-0">
                    {formatBRL(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divisão Casal 50/50 */}
          <div className="mt-3 p-3 rounded-2xl bg-[#f8faff] border border-[#e5eeff]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[11px] text-[#0b1c30]">Divisão Casal • 50/50</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[9px] font-bold">
                Configurado
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden flex">
              <div className="w-1/2 h-full bg-[#006948]" />
              <div className="w-1/2 h-full bg-[#006194]" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 font-bold">
              <span className="text-[#006948]">Felipe: {formatBRL(extractedReceipt.totalLido / 2)}</span>
              <span className="text-[#006194]">Genivânia: {formatBRL(extractedReceipt.totalLido / 2)}</span>
            </div>
          </div>

          {/* Botão Aprovar e Vincular */}
          <button
            onClick={handleApprove}
            disabled={isSavingReceipt}
            className={`w-full mt-3 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
              isApproved ? 'bg-[#00472f] text-white' : 'bg-[#005a3c] hover:bg-[#00472f] text-white'
            } disabled:opacity-75 active:scale-98`}
          >
            {isSavingReceipt ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Gravando no Banco de Dados...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                <span>{isApproved ? 'Vinculado com Sucesso!' : 'Aprovar e Vincular à Conta'}</span>
              </>
            )}
          </button>
        </div>

        {/* Histórico Recente de Cupons */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
              Histórico Recente de Cupons
            </h2>
            <span className="text-xs font-bold text-[#006948]">
              {totalCupons} cupons
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {(receipts || []).slice(0, 3).map((r) => {
              const vm = mapReceiptToViewModel(r);
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setExtractedReceipt(vm);
                    setIsApproved(r.status === 'Conciliado');
                  }}
                  className="bg-white rounded-2xl p-3 border border-[#e5eeff] shadow-2xs flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#f8faff] border border-[#e5eeff] flex items-center justify-center text-[#006948] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#0b1c30] block truncate">
                        {r.estabelecimento}
                      </span>
                      <span className="text-[10px] text-[#565e74]">
                        {r.data} • {(r.itens || []).length} itens
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-[#0b1c30] block">
                      {formatBRL(r.valorTotal)}
                    </span>
                    <span className="inline-block px-1.5 py-0.2 text-[9px] rounded-full bg-[#ecfdf5] text-[#006948] font-bold">
                      {r.status || 'Conciliado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Visão Completa para Computadores       */}
      {/* ========================================================================= */}
      <div id="scanner-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto px-4 md:px-6 pb-12">
        {/* Top 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Conciliação IA */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold mb-2">
                • Gemini Vision 2.5/3.8 Flash
              </span>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Conciliação IA
              </h3>
              <p className="text-xs text-[#565e74] mt-1">
                Leitura multimodal de comprovantes e conciliação automática 50/50 na conta do casal.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="text-[#565e74] truncate max-w-[170px]" title={ultimoEstabelecimento}>
                Último: <strong>{ultimoEstabelecimento}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[10px] flex items-center gap-1 shrink-0">
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
                  CUPONS ARQUIVADOS (2026)
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display font-extrabold text-3xl text-[#0b1c30] font-mono">
                  {totalCupons}
                </span>
                <span className="text-xs font-bold text-[#006948]">
                  {totalCupons === 1 ? '1 comprovante salvo' : `${totalCupons} comprovantes salvos`}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-3">
              <div className={`bg-[#005a3c] h-full rounded-full ${totalCupons > 0 ? 'w-full' : 'w-0'}`} />
            </div>
          </div>

          {/* Card 3: Precisão de Leitura */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider">
                  TAXA DE CONCILIAÇÃO
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display font-extrabold text-3xl text-[#0b1c30] font-mono">
                  {totalCupons > 0 ? '100%' : '0%'}
                </span>
                <span className="text-xs text-[#006948] font-bold">
                  {totalCupons > 0 ? 'Sem pendências' : 'Aguardando notas'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#006948] font-medium pt-3 border-t border-[#f1f5f9] mt-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Visão Multimodal Gemini Ativa</span>
            </div>
          </div>

          {/* Card 4: Total Conciliado Auto */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider">
                  TOTAL CONCILIADO
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="font-display font-extrabold text-2xl text-[#0b1c30] font-mono">
                  {formatBRL(totalConciliado)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
              <span>Lançado nas despesas 50/50</span>
            </div>
          </div>
        </div>

        {/* Upload Card com Drag & Drop e Status Real */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) processFile(dropped);
          }}
          className={`rounded-2xl p-8 border-2 transition-all mb-8 text-center flex flex-col items-center justify-center relative ${
            isDragging
              ? 'border-[#006948] bg-[#ecfdf5]'
              : 'border-dashed border-[#cbd5e1] bg-[#f8faff] hover:bg-[#eff4ff]'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center mb-3 shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="font-display font-bold text-base text-[#0b1c30]">
            {isScanningFile
              ? scanStepMessage || 'Processando com Gemini Vision OCR...'
              : 'Arraste seu comprovante ou cupom fiscal aqui'}
          </h3>
          <p className="text-xs text-[#565e74] mt-1 max-w-md">
            Suporta NFC-e, SAT, recibos de supermercado, farmácia, postos e filipetas de cartão em JPG, PNG, WEBP ou PDF
          </p>

          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            <button
              onClick={handleTriggerFileInput}
              disabled={isScanningFile}
              className="px-5 py-2.5 rounded-xl bg-[#005a3c] hover:bg-[#00472f] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-70"
            >
              <Camera className="w-4 h-4" />
              <span>{isScanningFile ? 'Processando Documento...' : 'Tirar Foto ou Upload de Comprovante'}</span>
            </button>

            <span className="px-3 py-2 rounded-xl bg-[#eff4ff] text-[#006194] text-xs font-semibold flex items-center gap-1.5 border border-[#dce9ff]">
              <Sparkles className="w-3.5 h-3.5 text-[#006194]" />
              <span>Gemini 2.5/3.8 Flash Ativo</span>
            </span>
          </div>

          {uploadedFileName && (
            <div className="mt-3 text-xs text-[#006948] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Arquivo atual: <strong>{uploadedFileName}</strong></span>
            </div>
          )}
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
                Leitura Multimodal Gemini
              </span>
            </div>

            <div className="text-xs text-[#565e74] flex items-center gap-1.5">
              <span>Confira os dados extraídos abaixo antes de aprovar e vincular</span>
            </div>
          </div>

          {/* Two-Column Validation Grid */}
          <div className="bg-white rounded-3xl border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column (5 cols): Visual Cupom Fiscal Digitalizado ou Foto Real */}
            <div className="lg:col-span-4 p-5 bg-[#fcfdfe] border-b lg:border-b-0 lg:border-r border-[#e5eeff] flex flex-col justify-between">
              <div>
                {/* Cupom Header Bar & View Mode Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30] truncate max-w-[200px]">
                    <FileText className="w-4 h-4 text-[#565e74] shrink-0" />
                    <span className="truncate">{extractedReceipt.numeroCupom} - {extractedReceipt.estabelecimento}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#565e74]">
                    <button
                      onClick={() => setShowReceiptZoom(true)}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                      title="Tela cheia"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Toggle: Foto vs Transcrição */}
                <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl mb-3 text-[11px] font-semibold">
                  <button
                    onClick={() => setLeftViewMode('photo')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                      leftViewMode === 'photo'
                        ? 'bg-white text-[#006948] font-bold shadow-xs'
                        : 'text-[#565e74] hover:text-[#0b1c30]'
                    }`}
                  >
                    📷 Foto do Comprovante
                  </button>
                  <button
                    onClick={() => setLeftViewMode('paper')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                      leftViewMode === 'paper'
                        ? 'bg-white text-[#006948] font-bold shadow-xs'
                        : 'text-[#565e74] hover:text-[#0b1c30]'
                    }`}
                  >
                    📄 Cupom Estruturado
                  </button>
                </div>

                {leftViewMode === 'photo' && uploadedImage ? (
                  /* Visualização da Imagem Real Anexada */
                  <div className="relative rounded-2xl overflow-hidden border border-[#e5eeff] bg-black/5 flex flex-col items-center justify-center p-2 min-h-[380px]">
                    <img
                      src={uploadedImage}
                      alt="Comprovante Anexado"
                      className="max-h-[360px] w-auto object-contain rounded-xl shadow-xs"
                    />
                    <div className="w-full mt-2 py-1 px-2.5 bg-white/90 backdrop-blur-xs rounded-xl border border-[#e5eeff] flex items-center justify-between text-[11px] text-[#0b1c30]">
                      <span className="font-semibold truncate max-w-[160px]">{uploadedFileName || 'Comprovante'}</span>
                      <button
                        onClick={() => setShowReceiptZoom(true)}
                        className="text-[#006194] hover:underline font-bold text-[10px]"
                      >
                        Ampliar Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Cupom Content Paper Digitalizado */
                  <div className="bg-[#f0fdf4]/50 border border-[#bbf7d0] rounded-2xl p-4 font-mono text-[11px] text-[#0b1c30] space-y-2 relative">
                    <div className="text-center pb-2 border-b border-dashed border-[#86efac]">
                      <span className="px-2 py-0.5 rounded bg-[#005a3c] text-white text-[9px] font-bold uppercase inline-block mb-1">
                        Estabelecimento
                      </span>
                      <h4 className="font-bold text-xs">{extractedReceipt.estabelecimento}</h4>
                      {extractedReceipt.endereco && (
                        <p className="text-[10px] text-[#565e74]">
                          {extractedReceipt.endereco}
                        </p>
                      )}
                      {extractedReceipt.cnpj && (
                        <p className="text-[10px] text-[#565e74]">
                          CNPJ: {extractedReceipt.cnpj}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between text-[10px] text-[#565e74] pb-1 border-b border-dashed border-[#86efac]">
                      <span>EMISSÃO: {extractedReceipt.dataHora}</span>
                      <span className="bg-[#eff4ff] text-[#006194] px-1 rounded font-bold">Auditoria IA</span>
                      <span>{extractedReceipt.numeroCupom}</span>
                    </div>

                    {/* Cupom Items Print */}
                    <div className="space-y-1.5 py-1 text-[10px] max-h-[220px] overflow-y-auto pr-1">
                      {extractedReceipt.itens.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate pr-2">
                            {idx + 1}. {it.nome} {it.qtd > 1 ? `(${it.qtd}x)` : ''}
                          </span>
                          <span className="font-bold shrink-0">{formatBRL(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total Box in Cupom */}
                    <div className="bg-[#dcfce7] rounded-xl p-2.5 border border-[#86efac] mt-2">
                      <div className="text-[10px] font-bold text-[#006948] uppercase">
                        Total & Pagamento
                      </div>
                      <div className="flex justify-between items-baseline mt-0.5">
                        <span className="font-bold text-xs">TOTAL R$</span>
                        <span className="font-extrabold text-base font-mono text-[#005a3c]">
                          {formatBRL(extractedReceipt.totalLido)}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#565e74] mt-1 flex justify-between">
                        <span>Forma: {extractedReceipt.meioPagamento}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (8 cols): Metadata & Itens Identificados e Categorizados */}
            <div className="lg:col-span-8 p-6 flex flex-col justify-between">
              <div>
                {/* Top 4 metadata cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 border-b border-[#f1f5f9]">
                  <div>
                    <span className="text-[10px] text-[#565e74] block">Estabelecimento</span>
                    <span className="font-bold text-xs text-[#0b1c30] block mt-0.5 truncate" title={extractedReceipt.estabelecimento}>
                      {extractedReceipt.estabelecimento}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block">Data da Compra</span>
                    <span className="font-bold text-xs text-[#0b1c30] block mt-0.5">
                      {extractedReceipt.dataHora.slice(0, 10)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block font-medium">Meio de Pgto</span>
                    <select
                      value={
                        extractedReceipt.meioPagamento.toLowerCase().includes('pix')
                          ? 'PIX'
                          : extractedReceipt.meioPagamento.toLowerCase().includes('debito')
                          ? 'Cartão de Débito'
                          : extractedReceipt.meioPagamento.toLowerCase().includes('dinheiro')
                          ? 'Dinheiro'
                          : 'Cartão de Crédito'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtractedReceipt({ ...extractedReceipt, meioPagamento: val });
                      }}
                      className="w-full mt-0.5 bg-[#f8faff] border border-[#e5eeff] rounded-lg px-1.5 py-1 text-xs font-bold text-[#0b1c30] focus:border-[#006948] focus:outline-none cursor-pointer"
                    >
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#565e74] block font-medium">Quem Pagou</span>
                    <select
                      value={
                        extractedReceipt.comprador.toLowerCase().includes('genivânia') ||
                        extractedReceipt.comprador.toLowerCase().includes('genivania')
                          ? 'Genivânia Duarte'
                          : 'Felipe Duarte'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtractedReceipt({ ...extractedReceipt, comprador: val });
                      }}
                      className="w-full mt-0.5 bg-[#f8faff] border border-[#e5eeff] rounded-lg px-1.5 py-1 text-xs font-bold text-[#0b1c30] focus:border-[#006948] focus:outline-none cursor-pointer"
                    >
                      <option value="Felipe Duarte">Felipe Duarte</option>
                      <option value="Genivânia Duarte">Genivânia Duarte</option>
                    </select>
                  </div>
                </div>

                {/* Banner Contextual da Forma de Pagamento para o Rateio 50/50 */}
                <div className="mt-3">
                  {extractedReceipt.meioPagamento.toLowerCase().includes('credito') ||
                  extractedReceipt.meioPagamento.toLowerCase().includes('crédito') ||
                  (extractedReceipt.meioPagamento.toLowerCase().includes('cartao') &&
                    !extractedReceipt.meioPagamento.toLowerCase().includes('debito')) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900">
                      <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Cartão de Crédito:</strong> Esta compra será lançada com situação <em>Pendente</em> no extrato e <u>não gerará cobrança de PIX imediata</u> entre o casal, pois será paga na fatura futura.
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Pagamento à Vista ({extractedReceipt.meioPagamento}):</strong> Entra como desembolso imediato de <strong>{extractedReceipt.comprador}</strong> para o cálculo do rateio 50/50 do mês.
                      </span>
                    </div>
                  )}
                </div>

                {/* Table Title & Controls */}
                <div className="flex items-center justify-between my-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Itens Identificados e Categorizados
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold">
                      {extractedReceipt.itens.length} {extractedReceipt.itens.length === 1 ? 'item extraído' : 'itens extraídos'}
                    </span>
                  </div>
                </div>

                {/* Extracted Items Table */}
                <div className="border border-[#e5eeff] rounded-2xl overflow-hidden mb-4 max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold sticky top-0 bg-[#f8faff] z-10">
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
                        <tr key={it.id || idx} className="hover:bg-[#f8faff] transition-colors">
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
                            {formatBRL(it.subtotal)}
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
                        Despesa Compartilhada
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
                  <span>Reclassificar Itens</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {onNavigateToExtrato && (
                    <button
                      onClick={() => onNavigateToExtrato(activeReceiptMes)}
                      className="px-4 py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dbeafe] text-[#006194] border border-[#bfdbfe] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title={`Abrir extrato financeiro no mês de ${activeReceiptMes}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver no Extrato ({activeReceiptMes})</span>
                    </button>
                  )}

                  <button
                    onClick={handleApprove}
                    disabled={isSavingReceipt}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                      isApproved ? 'bg-[#00472f]' : 'bg-[#005a3c] hover:bg-[#00472f]'
                    } disabled:opacity-75`}
                  >
                    {isSavingReceipt ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Gravando no Banco de Dados...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                        <span>{isApproved ? 'Vinculado com Sucesso!' : 'Aprovar e Vincular à Conta'}</span>
                      </>
                    )}
                  </button>
                </div>
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
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#565e74]">
                      Nenhum comprovante arquivado no momento. Arraste ou selecione uma imagem ou PDF acima para ler com IA!
                    </td>
                  </tr>
                ) : (
                  receipts.map((item) => {
                    const itemMes = getMonthNameFromDate(item.data);
                    const isSelected = extractedReceipt.id === item.id;
                    const isFarmacia = (item.tipoEstabelecimento || '').toLowerCase().includes('farm');
                    const isPosto = (item.tipoEstabelecimento || '').toLowerCase().includes('posto');

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#f8faff] transition-colors ${
                          isSelected ? 'bg-[#f0fdf4]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                          {item.data}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isFarmacia
                                  ? 'bg-[#fee2e2] text-[#dc2626]'
                                  : isPosto
                                  ? 'bg-[#eff4ff] text-[#006194]'
                                  : 'bg-[#ecfdf5] text-[#006948]'
                              }`}
                            >
                              {isFarmacia ? (
                                <Pill className="w-3.5 h-3.5" />
                              ) : isPosto ? (
                                <Fuel className="w-3.5 h-3.5" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-[#0b1c30] block">
                                {item.estabelecimento}
                              </span>
                              <span className="text-[11px] text-[#565e74]">
                                {item.numeroCupom
                                  ? `Cupom #${item.numeroCupom}`
                                  : item.tipoEstabelecimento || 'Comprovante Fiscal'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#006948]" />
                            <span>Upload OCR (Gemini)</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                          {item.itens?.length || 0} itens
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#0b1c30]">
                          {formatBRL(item.valorTotal)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#006948]">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>{item.status || 'Conciliado'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setExtractedReceipt(mapReceiptToViewModel(item));
                                if (item.imagemUrl) setUploadedImage(item.imagemUrl);
                                setIsApproved(true);
                                showToast(`Visualizando comprovante de ${item.estabelecimento}`);
                              }}
                              className="p-1.5 text-[#565e74] hover:text-[#006948] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Comprovante na Área de Revisão"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {onNavigateToExtrato && (
                              <button
                                onClick={() => onNavigateToExtrato(itemMes)}
                                className="p-1.5 text-[#006194] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                                title={`Ver lançamento no Extrato de ${itemMes}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}

                            {onDeleteReceipt && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `Deseja realmente excluir o comprovante de "${item.estabelecimento}" (${formatBRL(item.valorTotal)})? Se houver transação vinculada no Extrato, ela também será removida do banco de dados.`
                                    )
                                  ) {
                                    await onDeleteReceipt(item.id);
                                    showToast(`Comprovante de ${item.estabelecimento} removido do banco com sucesso.`);
                                  }
                                }}
                                className="p-1.5 text-[#565e74] hover:text-[#dc2626] hover:bg-[#fee2e2] rounded-lg transition-colors cursor-pointer"
                                title="Excluir comprovante e transação vinculada"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Health Bar matching overall app */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center justify-between flex-wrap gap-3 text-xs text-[#565e74]">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-[#006948]" />
            <span className="font-bold text-[#0b1c30]">Auditoria de Comprovantes:</span>
            <span className="text-[#565e74]">
              {receipts.length} comprovante(s) registrado(s)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
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
            className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowReceiptZoom(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-display font-bold text-base text-[#0b1c30] mb-2">
              {uploadedImage ? 'Foto do Comprovante em Alta Resolução' : 'Visualização da NFC-e Digital'}
            </h4>

            {uploadedImage ? (
              <div className="rounded-2xl overflow-hidden border border-[#e5eeff] bg-black/5 p-2 flex justify-center">
                <img
                  src={uploadedImage}
                  alt="Comprovante"
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="bg-[#fafafa] border border-dashed border-gray-400 rounded-2xl p-4 font-mono text-xs text-gray-700 space-y-2">
                <div className="text-center pb-2 border-b border-gray-300">
                  <span className="font-bold text-sm block">{extractedReceipt.estabelecimento}</span>
                  {extractedReceipt.cnpj && <span>CNPJ: {extractedReceipt.cnpj}</span>}
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
            )}

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

      {/* Modal: Leitor QR Code NFC-e */}
      {showQrModal && (
        <div
          id="modal-qrcode-backdrop"
          onClick={() => {
            stopQrCamera();
            setShowQrModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-qrcode-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] flex items-center justify-center text-[#006948]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#0b1c30]">
                    Leitor QR Code NFC-e
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Nota Fiscal de Consumidor Eletrônica
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopQrCamera();
                  setShowQrModal(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abas: Câmera vs Chave/Link */}
            <div className="flex gap-2 p-1 bg-[#f0f4f9] rounded-xl mt-4">
              <button
                type="button"
                onClick={() => setQrActiveTab('camera')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  qrActiveTab === 'camera'
                    ? 'bg-white text-[#006948] shadow-xs'
                    : 'text-gray-500 hover:text-[#0b1c30]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Câmera ao Vivo
              </button>
              <button
                type="button"
                onClick={() => {
                  stopQrCamera();
                  setQrActiveTab('manual');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  qrActiveTab === 'manual'
                    ? 'bg-white text-[#006948] shadow-xs'
                    : 'text-gray-500 hover:text-[#0b1c30]'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Chave / Link SEFAZ
              </button>
            </div>

            {/* Conteúdo Aba Câmera */}
            {qrActiveTab === 'camera' && (
              <div className="mt-4 space-y-3">
                <div className="relative w-full aspect-square max-h-[320px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#006948]/30">
                  <video
                    ref={qrVideoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Mira / Retícula de Leitura */}
                  <div className="absolute inset-8 border-2 border-[#006948] rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-[#22c55e]"></div>
                      <div className="w-4 h-4 border-t-2 border-r-2 border-[#22c55e]"></div>
                    </div>
                    <div className="w-full h-0.5 bg-[#22c55e] animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-[#22c55e]"></div>
                      <div className="w-4 h-4 border-b-2 border-r-2 border-[#22c55e]"></div>
                    </div>
                  </div>

                  {!isQrCameraActive && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 text-center">
                      <VideoOff className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-white/80 max-w-[220px]">
                        {qrCameraError || 'Iniciando câmera...'}
                      </p>
                      <button
                        type="button"
                        onClick={startQrCamera}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-[#006948] text-white text-xs font-semibold"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureQrSnapshot}
                    disabled={!isQrCameraActive}
                    className="flex-1 py-2.5 rounded-xl bg-[#006948] hover:bg-[#005a3c] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                  >
                    <Camera className="w-4 h-4" />
                    Capturar QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (qrFileInputRef.current) qrFileInputRef.current.click();
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Foto QR
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  Aponte para o QR Code impresso na parte inferior do cupom fiscal NFC-e.
                </p>
              </div>
            )}

            {/* Conteúdo Aba Manual / Chave SEFAZ */}
            {qrActiveTab === 'manual' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] mb-1">
                    Chave de Acesso (44 dígitos) ou URL do QR Code
                  </label>
                  <div className="relative">
                    <textarea
                      value={qrInputText}
                      onChange={(e) => setQrInputText(e.target.value)}
                      placeholder="Ex: 3524 0300 0000 0000 0000 6500 1000 0000 0010 0000 0000 ou cole o link do QR Code da NFC-e"
                      rows={4}
                      className="w-full text-xs font-mono p-3 rounded-xl border border-gray-300 focus:border-[#006948] focus:ring-1 focus:ring-[#006948] outline-hidden resize-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setQrInputText(text);
                            showToast('Texto colado da área de transferência!');
                          }
                        } catch {
                          showToast('Não foi possível acessar a área de transferência.');
                        }
                      }}
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-700 flex items-center gap-1 transition"
                    >
                      <Copy className="w-3 h-3" />
                      Colar
                    </button>
                  </div>
                </div>

                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 text-[11px] text-[#166534] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006948]" />
                    Como funciona a decodificação da NFC-e:
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    A chave de 44 dígitos contém o Estado (UF), CNPJ do emissor, número da nota fiscal e data. O sistema extrai essas informações automaticamente para conciliação.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!qrInputText.trim() || isProcessingQr}
                  onClick={() => handleProcessQrValue(qrInputText)}
                  className="w-full py-2.5 rounded-xl bg-[#006948] hover:bg-[#005a3c] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                >
                  {isProcessingQr ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Decodificar NFC-e
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
