import React, { useState } from 'react';
import {
  Heart,
  TrendingUp,
  ScanLine,
  PlusCircle,
  Mic,
  ShoppingCart,
  Car,
  Utensils,
  Pill,
  Fuel,
  Volume2,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Send,
  Building2,
  ArrowDown,
  ArrowUp,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Layers,
  Check,
  Plus,
  Bell,
  ArrowLeftRight,
  Info,
  DollarSign,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Transaction, FinancialGoal, SpreadsheetRow } from '../types';
import { formatBRL } from '../utils/formatters';

interface DashboardViewProps {
  selectedMonth: string;
  transactions: Transaction[];
  goals: FinancialGoal[];
  spreadsheets: SpreadsheetRow[];
  onNavigateToTab: (tab: string) => void;
  onOpenNewTx?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMonth,
  transactions,
  goals,
  spreadsheets,
  onNavigateToTab,
  onOpenNewTx,
}) => {
  // Voice Assistant Modal State
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Filter Person state for table
  const [filterPerson, setFilterPerson] = useState<'todos' | 'guilherme' | 'mariana'>('todos');
  const [showRateioModal, setShowRateioModal] = useState(false);
  const [guilhermeShare, setGuilhermeShare] = useState(52);
  const [marianaShare, setMarianaShare] = useState(48);

  const handleStartVoice = () => {
    setIsVoiceAssistantOpen(true);
    setIsListening(true);
    setVoiceResponse(null);
    setTimeout(() => {
      setIsListening(false);
      setVoiceResponse('Entendido! Despesa de R$ 35,00 no Atacadão registrada na Conta Central do Casal em Alimentação.');
    }, 2200);
  };

  const handleSendVoiceQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceQuery.trim()) return;
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setVoiceResponse(`Processado: "${voiceQuery}" adicionado com sucesso ao orçamento do Casal Duarte.`);
      setVoiceQuery('');
    }, 1200);
  };

  // 5 Highlighted Transactions matching image.png exactly
  const tableTransactions = [
    {
      id: 'tx-desk-1',
      responsavel: 'Guilherme',
      avatar: 'G',
      avatarBg: 'bg-[#005a3c]',
      estabelecimento: 'Atacadão S/A',
      descricao: 'Compra do mês (Alimentos & Limpeza)',
      categoriaMacro: 'Variável • Supermercado',
      categoriaColor: 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]',
      pagamento: 'Cartão XP Visa',
      pagamentoIcon: 'card',
      status: 'Pago',
      valor: -1940.0,
    },
    {
      id: 'tx-desk-2',
      responsavel: 'Mariana',
      avatar: 'M',
      avatarBg: 'bg-[#006194]',
      estabelecimento: 'Centro Automotivo Diniz',
      descricao: 'Pastilhas de freio dianteiras',
      categoriaMacro: 'Eventualidades • Carro',
      categoriaColor: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]',
      pagamento: 'PIX Banco Inter',
      pagamentoIcon: 'pix',
      status: 'Pago',
      valor: -650.0,
    },
    {
      id: 'tx-desk-3',
      responsavel: 'Mariana',
      avatar: 'M',
      avatarBg: 'bg-[#006194]',
      estabelecimento: "Sam's Club Tamboré",
      descricao: 'Itens importados & despensa',
      categoriaMacro: 'Variável • Supermercado',
      categoriaColor: 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]',
      pagamento: 'Nubank Mastercard',
      pagamentoIcon: 'card',
      status: 'Pago',
      valor: -850.0,
    },
    {
      id: 'tx-desk-4',
      responsavel: 'Guilherme',
      avatar: 'G',
      avatarBg: 'bg-[#005a3c]',
      estabelecimento: 'Imobiliária Morada Nobre',
      descricao: 'Aluguel + Condomínio Apto 82',
      categoriaMacro: 'Invariável • Moradia',
      categoriaColor: 'bg-[#eff4ff] text-[#475569] border-[#dce9ff]',
      pagamento: 'Débito Automático',
      pagamentoIcon: 'bank',
      status: 'Pago',
      valor: -5400.0,
    },
    {
      id: 'tx-desk-5',
      responsavel: 'Guilherme',
      avatar: 'G',
      avatarBg: 'bg-[#005a3c]',
      estabelecimento: 'Posto Shell Marginal',
      descricao: 'Abastecimento V-Power',
      categoriaMacro: 'Variável • Combustível',
      categoriaColor: 'bg-[#fee2e2] text-[#dc2626] border-[#fecdd3]',
      pagamento: 'Cartão XP Visa',
      pagamentoIcon: 'card',
      status: 'Pago',
      valor: -340.0,
    },
  ];

  const filteredTransactions = tableTransactions.filter((tx) => {
    if (filterPerson === 'guilherme') return tx.responsavel === 'Guilherme';
    if (filterPerson === 'mariana') return tx.responsavel === 'Mariana';
    return true;
  });

  return (
    <div className="w-full font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Screens < 768px): Exact matches requested mobile design   */}
      {/* ========================================================================= */}
      <div id="dashboard-mobile-view" className="block md:hidden w-full max-w-md mx-auto pb-24">
        {/* Header & Greeting Row */}
        <div className="flex items-start justify-between gap-3 pt-1 pb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 text-[#006948] shrink-0">
              <Heart className="w-6 h-6 stroke-[2.2] fill-transparent text-[#006948]" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-[#0b1c30] tracking-tight leading-tight">
                Bom dia, Gui & Mari
              </h1>
              <p className="text-xs text-[#565e74] mt-0.5">
                Vocês estão construindo o futuro juntos.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold border border-[#dce9ff]">
              {selectedMonth || 'Março 2026'}
            </span>
            <span className="text-[11px] text-[#006948] font-medium flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
              Nuvem sync
            </span>
          </div>
        </div>

        {/* Hero Card: SALDO LÍQUIDO ACUMULADO */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_4px_20px_rgba(11,28,48,0.04)] mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
              SALDO LÍQUIDO ACUMULADO
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#006948] font-bold text-xs">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              Superávit
            </span>
          </div>

          <div className="my-2">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#006948] tracking-tight font-mono">
              R$ +4.329,60
            </span>
          </div>

          {/* Orçamento Global Consumido */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#0b1c30]">
                Orçamento Global Consumido
              </span>
              <span className="text-[#565e74]">
                76.5% <span className="text-[#727a90]">(Faltam 7 dias)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006948] rounded-full transition-all duration-500"
                style={{ width: '76.5%' }}
              />
            </div>
          </div>

          {/* Gestão Unificada do Casal */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#dcfce7] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                <CheckCircle2 className="w-4 h-4 text-[#006948]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0b1c30] block truncate">
                  Conta Única do Casal
                </span>
                <span className="text-[11px] text-[#565e74] block truncate">
                  100% das saídas centralizadas • Sem rateio
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold border border-[#a7f3d0] shrink-0">
              Unificado
            </span>
          </div>
        </div>

        {/* Section: Ações Rápidas */}
        <div className="mt-6">
          <h2 className="font-display font-bold text-sm sm:text-base text-[#0b1c30] mb-3">
            Ações Rápidas
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="quick-action-scanner"
              onClick={() => onNavigateToTab('scanner')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] hover:border-[#006948]/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]/60">
                <ScanLine className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-[#0b1c30] leading-tight truncate">
                  Escanear Nota
                </span>
                <span className="block text-[11px] text-[#565e74] mt-0.5 truncate">
                  OCR Inteligente
                </span>
              </div>
            </button>

            <button
              id="quick-action-new-tx"
              onClick={onOpenNewTx}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] hover:border-[#006194]/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#cbe1ff]">
                <PlusCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-[#0b1c30] leading-tight truncate">
                  Lançar Gasto
                </span>
                <span className="block text-[11px] text-[#565e74] mt-0.5 truncate">
                  PIX ou Cartão
                </span>
              </div>
            </button>

            <button
              id="quick-action-voice"
              onClick={handleStartVoice}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] hover:border-[#006194]/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#cbe1ff]">
                <Mic className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-[#0b1c30] leading-tight truncate">
                  Comando Voz
                </span>
                <span className="block text-[11px] text-[#565e74] mt-0.5 truncate">
                  Alexa & Siri
                </span>
              </div>
            </button>

            <button
              id="quick-action-shopping-list"
              onClick={() => onNavigateToTab('lista')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] hover:border-[#006948]/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#cbe1ff]">
                <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-[#0b1c30] leading-tight truncate">
                  Lista Mercado
                </span>
                <span className="block text-[11px] text-[#565e74] mt-0.5 truncate">
                  12 pendentes
                </span>
              </div>
            </button>
          </div>

          {/* Full-width Assistant Banner */}
          <div
            id="assistant-voice-banner"
            onClick={handleStartVoice}
            className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-3.5 mt-3 flex items-center gap-3 cursor-pointer hover:bg-[#e4eeff] transition-colors active:scale-99 shadow-2xs group"
          >
            <div className="w-10 h-10 rounded-full bg-[#006194] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[11px] text-[#006194] uppercase tracking-wide">
                  ASSISTENTE DUARTE FINANÇAS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#006194]" />
              </div>
              <p className="text-xs text-[#565e74] truncate mt-0.5">
                “Toque para falar ou diga: &apos;Registrei R$ 35 na ...&apos;”
              </p>
            </div>
          </div>
        </div>

        {/* Section: Tetos do Mês em Foco */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm sm:text-base text-[#0b1c30]">
              Tetos do Mês em Foco
            </h2>
            <button
              id="btn-ver-todos-tetos"
              onClick={() => onNavigateToTab('metas')}
              className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Card 1: Supermercado */}
            <div
              id="teto-card-supermercado"
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] cursor-pointer hover:border-[#dc2626]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-[#dc2626]">
                    <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="font-bold text-xs text-[#0b1c30]">
                    Supermercado
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] text-[10px] font-bold">
                  Atenção
                </span>
              </div>

              <div className="text-xs font-semibold text-[#dc2626] mt-1 ml-7.5">
                Excedido em R$ 480,00
              </div>

              <div className="w-full h-2 bg-[#fee2e2] rounded-full overflow-hidden mt-2 ml-7.5 pr-7.5">
                <div className="h-full bg-[#dc2626] rounded-full w-full" />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 ml-7.5">
                <span className="font-bold text-[#dc2626] font-mono">
                  R$ 3.280,00
                </span>
                <span className="text-[#565e74] font-medium">
                  Teto: R$ 2.800,00
                </span>
              </div>
            </div>

            {/* Card 2: Carro & Mobilidade */}
            <div
              id="teto-card-carro"
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] cursor-pointer hover:border-[#006948]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-[#006948]">
                    <Car className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="font-bold text-xs text-[#0b1c30]">
                    Carro & Mobilidade
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold border border-[#dce9ff]">
                  Consolidado
                </span>
              </div>

              <div className="text-xs text-[#565e74] mt-1 ml-7.5">
                Combustível + Seguro
              </div>

              <div className="w-full h-2 bg-[#e5eeff] rounded-full overflow-hidden mt-2 ml-7.5 pr-7.5">
                <div
                  className="h-full bg-[#006948] rounded-full"
                  style={{ width: '97.7%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 ml-7.5">
                <span className="font-bold text-[#0b1c30] font-mono">
                  R$ 2.150,00
                </span>
                <span className="text-[#565e74] font-medium">
                  Teto: R$ 2.200,00 (R$ 50 livres)
                </span>
              </div>
            </div>

            {/* Card 3: Lazer & Jantares */}
            <div
              id="teto-card-lazer"
              onClick={() => onNavigateToTab('metas')}
              className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] cursor-pointer hover:border-[#006194]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-[#006194]">
                    <Utensils className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="font-bold text-xs text-[#0b1c30]">
                    Lazer & Jantares
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold border border-[#dce9ff]">
                  Final de Semana
                </span>
              </div>

              <div className="text-xs font-medium text-[#006194] mt-1 ml-7.5">
                93% consumido (Restam R$ 80)
              </div>

              <div className="w-full h-2 bg-[#e5eeff] rounded-full overflow-hidden mt-2 ml-7.5 pr-7.5">
                <div
                  className="h-full bg-[#006194] rounded-full"
                  style={{ width: '93.3%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 ml-7.5">
                <span className="font-bold text-[#0b1c30] font-mono">
                  R$ 1.120,00
                </span>
                <span className="text-[#565e74] font-medium">
                  Teto: R$ 1.200,00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Movimentações Recentes */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm sm:text-base text-[#0b1c30]">
              Movimentações Recentes
            </h2>
            <button
              id="btn-ver-extrato-recentes"
              onClick={() => onNavigateToTab('extrato')}
              className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
            >
              Ver extrato
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div
              id="recent-item-atacadao"
              onClick={() => onNavigateToTab('extrato')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.02)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#006948]/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0 border border-[#a7f3d0]/60">
                  <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-[#0b1c30] truncate">
                      Atacadão S/A
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#ecfdf5] text-[#006948] text-[9px] font-bold border border-[#a7f3d0] flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      NFC-e
                    </span>
                  </div>
                  <div className="text-[11px] text-[#565e74] mt-0.5 truncate">
                    • NuBank • Hoje, 10:42
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-xs text-[#0b1c30] font-mono">
                  -R$ 487,90
                </div>
                <div className="text-[10px] text-[#565e74] mt-0.5">
                  Supermercado
                </div>
              </div>
            </div>

            <div
              id="recent-item-drogasil"
              onClick={() => onNavigateToTab('extrato')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.02)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#006194]/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#cbe1ff]">
                  <Pill className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] block truncate">
                    Droga Raia Paulista
                  </span>
                  <div className="text-[11px] text-[#565e74] mt-0.5 truncate">
                    • Débito Casal • Ontem
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-xs text-[#0b1c30] font-mono">
                  -R$ 134,20
                </div>
                <div className="text-[10px] text-[#565e74] mt-0.5">
                  Farmácia
                </div>
              </div>
            </div>

            <div
              id="recent-item-posto"
              onClick={() => onNavigateToTab('extrato')}
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.02)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#006194]/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#cbe1ff]">
                  <Fuel className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] block truncate">
                    Posto Shell
                  </span>
                  <div className="text-[11px] text-[#565e74] mt-0.5 truncate">
                    • PIX Casal • 24 Mar
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-xs text-[#0b1c30] font-mono">
                  -R$ 240,00
                </div>
                <div className="text-[10px] text-[#565e74] mt-0.5">
                  Combustível
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Screens >= 768px): Exact matches image.png 1:1           */}
      {/* ========================================================================= */}
      <div id="dashboard-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
        {/* Top Header: Visão Consolidada do Casal */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold tracking-wide uppercase">
                FECHAMENTO PARCIAL
              </span>
              <span className="text-xs text-[#565e74]">
                Atualizado em tempo real • 24 de Março, 2026
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
              Visão Consolidada do Casal
            </h1>
          </div>

          {/* Rateio Split Widget */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)]">
            <div className="flex items-center -space-x-1.5">
              <div className="w-7 h-7 rounded-full bg-[#005a3c] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                G
              </div>
              <div className="w-7 h-7 rounded-full bg-[#006194] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                M
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-[#005a3c]">Guilherme ({guilhermeShare}%)</span>
                <span className="text-[#006194]">Mariana ({marianaShare}%)</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-gray-200 overflow-hidden flex mt-1">
                <div style={{ width: `${guilhermeShare}%` }} className="bg-[#005a3c] h-full" />
                <div style={{ width: `${marianaShare}%` }} className="bg-[#006194] h-full" />
              </div>
            </div>

            <button
              onClick={() => setShowRateioModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-[#cbd5e1] text-[#0b1c30] hover:bg-[#eff4ff] text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
            >
              Ajustar Rateio
            </button>
          </div>
        </div>

        {/* 4 KPI Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* KPI 1 */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Receita Total Líquida</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                R$ 18.450,00
              </div>
            </div>
            <div className="text-xs text-[#006948] font-medium mt-3 flex items-center gap-1">
              <span>↑ 100% depositado</span>
              <span className="text-[#565e74]">• Ambos os salários</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Total Gasto (Realidade)</span>
                <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                R$ 14.120,40
              </div>
            </div>
            <div className="text-xs text-[#565e74] mt-3">
              76,5% da renda familiar • 82 transações
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Expectativa Prevista</span>
                <span className="px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] font-bold text-[10px]">
                  +R$ 620,40 desvio
                </span>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] mt-2 font-mono">
                R$ 13.500,00
              </div>
            </div>
            <div className="text-xs text-[#dc2626] font-medium mt-3 flex items-center gap-1">
              <span>! 4,6% acima do teto</span>
              <span className="text-[#565e74]">no mês</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#565e74] font-medium">Economia & Aporte</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[#006948] mt-2 font-mono">
                R$ 4.329,60
              </div>
            </div>
            <div className="text-xs text-[#006948] font-medium mt-3 flex items-center gap-1">
              <span>✓ 86% da Meta</span>
              <span className="text-[#565e74]">• Alvo R$ 5.000</span>
            </div>
          </div>
        </div>

        {/* Operational Alert Banner: Avisos Operacionais de Março */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#0b1c30]">
                  Avisos Operacionais de Março
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] text-[10px] font-bold">
                  2 Atenções
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                <strong>Supermercado</strong> ultrapassou a Expectativa em{' '}
                <strong className="text-[#dc2626]">R$ 480,00</strong> (compras volumosas no Atacadão e Sam&apos;s Club). Em paralelo,{' '}
                <strong>Eventualidades</strong> registrou{' '}
                <strong className="text-[#dc2626]">R$ 650,00</strong> não previstos com a manutenção emergencial do carro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('extrato')}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:bg-[#f8faff] text-xs font-bold text-[#0b1c30] cursor-pointer transition-colors shadow-2xs"
            >
              Ver Faturas
            </button>
            <button
              onClick={() => onNavigateToTab('metas')}
              className="px-3.5 py-2 rounded-xl bg-[#005a3c] hover:bg-[#00472f] text-xs font-bold text-white cursor-pointer transition-colors shadow-xs"
            >
              Reclassificar & Compensar
            </button>
          </div>
        </div>

        {/* Section: Expectativa vs. Realidade por Macro-Grupo */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-base text-[#0b1c30]">
                Expectativa vs. Realidade por Macro-Grupo
              </h2>
              <p className="text-xs text-[#565e74]">
                Classificação estrutural das despesas conforme acordado no planejamento anual
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#565e74]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                <span>Previsto</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#005a3c] inline-block" />
                <span>Realizado</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Macro-Grupo 1 */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[11px] font-bold">
                    Invariável (Custos Fixos)
                  </span>
                  <span className="text-xs font-bold text-[#006948]">
                    ✓ 100% Sob Controle
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] truncate mb-3">
                  Aluguel, Condomínio, Fibra Óptica, Rastreador, Seguro...
                </p>

                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-[#565e74]">Realizado:</span>
                  <span className="font-display font-bold text-base text-[#0b1c30] font-mono">
                    R$ 6.200,00
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs mb-2">
                  <span className="text-[#565e74]">Expectativa Prevista:</span>
                  <span className="text-xs text-[#565e74] font-mono">R$ 6.200,00</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#005a3c] h-full rounded-full w-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Teto Mensal: R$ 6.200,00</span>
                <span className="font-bold text-[#006948]">0% desvio</span>
              </div>
            </div>

            {/* Macro-Grupo 2 */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#ea580c] text-[11px] font-bold">
                    Variável (Rotina & Estilo)
                  </span>
                  <span className="text-xs font-bold text-[#dc2626]">
                    ↗ +13.3% Atenção
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] truncate mb-3">
                  Supermercado, Restaurantes & Delivery, Combustível,...
                </p>

                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-[#565e74]">Realizado:</span>
                  <span className="font-display font-bold text-base text-[#dc2626] font-mono">
                    R$ 5.780,40
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs mb-2">
                  <span className="text-[#565e74]">Expectativa Prevista:</span>
                  <span className="text-xs text-[#565e74] font-mono">R$ 5.100,00</span>
                </div>

                <div className="w-full bg-[#fee2e2] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#dc2626] h-full rounded-full w-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Teto Mensal: R$ 5.100,00</span>
                <span className="font-bold text-[#dc2626]">+R$ 680,40</span>
              </div>
            </div>

            {/* Macro-Grupo 3 */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ecfeff] text-[#0891b2] text-[11px] font-bold">
                    Extra & Eventualidades
                  </span>
                  <span className="text-xs font-bold text-[#006948]">
                    ✓ Dentro do Teto
                  </span>
                </div>
                <p className="text-[11px] text-[#565e74] truncate mb-3">
                  Mecânica Carro, IPVA parcela 3, Pequenos consertos e...
                </p>

                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-[#565e74]">Realizado:</span>
                  <span className="font-display font-bold text-base text-[#0b1c30] font-mono">
                    R$ 2.140,00
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs mb-2">
                  <span className="text-[#565e74]">Expectativa Prevista:</span>
                  <span className="text-xs text-[#565e74] font-mono">R$ 2.200,00</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#005a3c] h-full rounded-full w-[97%]" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Margem restante: R$ 60,00</span>
                <span className="font-bold text-[#006948]">97.2% gasto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Centros de Custo em Destaque */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-[#0b1c30]">
              Centros de Custo em Destaque
            </h2>
            <button
              onClick={() => onNavigateToTab('relatorios')}
              className="text-xs font-bold text-[#006948] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas as 28 subcategorias</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Supermercado */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Supermercado</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] font-bold text-[9px]">
                    EXCEDIDO
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  R$ 3.280,00
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Meta: R$ 2.800,00 (+R$ 480)
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Atacadão Atacado</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 1.940,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Sam&apos;s Club Brasil</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 850,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Supermercado Ferreira</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 490,00</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Uso: 117%</span>
                <span className="font-bold text-[#dc2626]">Requer atenção em Abril</span>
              </div>
            </div>

            {/* Card 2: Carro Total */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Carro Total</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] font-bold text-[9px]">
                    CONSOLIDADO
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  R$ 2.150,00
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Previsto Médio: R$ 1.650,00
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  <div className="flex justify-between">
                    <span className="text-[#565e74] truncate pr-1">Combustível (Shell / Ipiranga)</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 1.180,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Oficina (Freios & Óleo)</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 650,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Rastreador + Sem Parar</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 320,00</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Impacto: 15,2% do total</span>
                <span className="font-bold text-[#006948]">Revisão semestral ok</span>
              </div>
            </div>

            {/* Card 3: Lazer do Casal */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Lazer do Casal</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[9px]">
                    EQUILIBRADO
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  R$ 1.120,00
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Orçamento reservado: R$ 1.200,00
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Jantar Sexta (Bistrô 45)</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 420,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Cinema & Eventos Culturais</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 280,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Cafés & Delivery Fim de Semana</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 420,00</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Resta no cofre: R$ 80,00</span>
                <span className="font-bold text-[#006948]">93.3% consumido</span>
              </div>
            </div>

            {/* Card 4: Farmácia & Saúde */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0b1c30]">Farmácia & Saúde</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] font-bold text-[9px]">
                    EXCELENTE
                  </span>
                </div>

                <div className="font-display font-bold text-xl text-[#0b1c30] mt-2 font-mono">
                  R$ 380,00
                </div>
                <div className="text-[11px] text-[#565e74] mb-3">
                  Expectativa média: R$ 500,00
                </div>

                <div className="bg-[#f8faff] rounded-xl p-2.5 space-y-1.5 text-[11px] border border-[#e5eeff]">
                  <div className="flex justify-between">
                    <span className="text-[#565e74] truncate pr-1">Drogasil (Vitaminas & Uso Contínuo)</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 240,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Raia (Higiene e Skincare)</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 140,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565e74]">Consultas Particulares</span>
                    <span className="font-bold text-[#0b1c30] font-mono">R$ 0,00</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
                <span>Economia de R$ 120,00</span>
                <span className="font-bold text-[#006948]">76% do teto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: 2 Gráficos Lado a Lado (Planejado vs Realizado + Distribuição) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Gráfico 1: Planejado vs. Realizado (2026) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Planejado vs. Realizado (2026)
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#565e74]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#dbeafe] inline-block" />
                    <span>Planejado</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#005a3c] inline-block" />
                    <span>Realizado</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#565e74] mb-4">
                Consolidado dos primeiros 8 meses do ano
              </p>

              {/* SVG Bar Chart */}
              <div className="h-44 w-full flex items-end justify-between px-2 pt-4 relative">
                {/* Background horizontal guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">16k</div>
                  <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">12k</div>
                  <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">8k</div>
                  <div className="border-b border-gray-200 w-full flex justify-end text-[9px] text-gray-400 pr-1">0k</div>
                </div>

                {/* Bars per Month */}
                {[
                  { mes: 'Jan', plan: 88, real: 95 },
                  { mes: 'Fev', plan: 88, real: 90 },
                  { mes: 'Mar*', plan: 88, real: 100, isAlert: true },
                  { mes: 'Abr', plan: 88, real: 75 },
                  { mes: 'Mai', plan: 88, real: 68 },
                  { mes: 'Jun', plan: 88, real: 60 },
                  { mes: 'Jul', plan: 88, real: 55 },
                  { mes: 'Ago', plan: 88, real: 48 },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 z-10 flex-1">
                    <div className="flex items-end gap-1.5 h-32">
                      <div
                        style={{ height: `${item.plan}%` }}
                        className="w-3.5 bg-[#dbeafe] rounded-t-sm"
                        title={`Planejado: R$ 13.500`}
                      />
                      <div
                        style={{ height: `${item.real}%` }}
                        className={`w-3.5 rounded-t-sm ${
                          item.isAlert ? 'bg-[#005a3c]' : 'bg-[#005a3c]'
                        }`}
                        title={`Realizado: ${item.real}%`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-1 ${
                        item.isAlert ? 'text-[#dc2626] font-bold' : 'text-[#565e74]'
                      }`}
                    >
                      {item.mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#565e74] pt-3 border-t border-[#f1f5f9] mt-3">
              <span className="flex items-center gap-1 text-[#dc2626]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                <span>* Março reflete o desvio extraordinário de Supermercado e Mecânica</span>
              </span>
              <span className="font-bold text-[#006948]">Previsão Q2 sob controle</span>
            </div>
          </div>

          {/* Gráfico 2: Distribuição por Estabelecimento */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                Distribuição por Estabelecimento
              </h3>
              <p className="text-xs text-[#565e74] mb-3">
                Onde o dinheiro circulou com mais intensidade no mês
              </p>

              {/* Donut Chart SVG Container */}
              <div className="flex items-center justify-center my-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-gray-100"
                      strokeWidth="5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 1: Supermercado 45% */}
                    <path
                      className="text-[#005a3c]"
                      strokeDasharray="45, 100"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 2: Outros & Lazer 29% */}
                    <path
                      className="text-[#94a3b8]"
                      strokeDasharray="29, 100"
                      strokeDashoffset="-45"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 3: Posto / Comb. 18% */}
                    <path
                      className="text-[#006194]"
                      strokeDasharray="18, 100"
                      strokeDashoffset="-74"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 4: Farmácia 8% */}
                    <path
                      className="text-[#10b981]"
                      strokeDasharray="8, 100"
                      strokeDashoffset="-92"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>

                  {/* Donut Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                    <span className="font-display font-extrabold text-sm text-[#0b1c30] font-mono leading-none">
                      R$ 14,1k
                    </span>
                    <span className="text-[10px] text-[#565e74] mt-0.5">Total</span>
                  </div>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#565e74]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005a3c]" />
                    <span>Supermercado</span>
                  </span>
                  <span className="font-bold text-[#0b1c30]">45%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#565e74]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006194]" />
                    <span>Posto / Comb.</span>
                  </span>
                  <span className="font-bold text-[#0b1c30]">18%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#565e74]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span>Farmácia</span>
                  </span>
                  <span className="font-bold text-[#0b1c30]">8%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#565e74]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                    <span>Outros & Lazer</span>
                  </span>
                  <span className="font-bold text-[#0b1c30]">29%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Últimas Transações Registradas */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] overflow-hidden mb-6">
          <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Últimas Transações Registradas
              </h3>
              <p className="text-xs text-[#565e74]">
                Sincronização bancária Open Finance e recibos de Guilherme e Mariana
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterPerson((prev) =>
                    prev === 'todos' ? 'guilherme' : prev === 'guilherme' ? 'mariana' : 'todos'
                  );
                }}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                {filterPerson === 'todos'
                  ? 'Filtrar por Pessoa'
                  : filterPerson === 'guilherme'
                  ? 'Filtrado: Guilherme'
                  : 'Filtrado: Mariana'}
              </button>

              <button
                onClick={() => onNavigateToTab('extrato')}
                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Ver Extrato Completo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faff] border-b border-[#e5eeff] text-[#565e74] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">RESPONSÁVEL</th>
                  <th className="py-3 px-4">ESTABELECIMENTO / DESCRIÇÃO</th>
                  <th className="py-3 px-4">CATEGORIA MACRO</th>
                  <th className="py-3 px-4">PAGAMENTO</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center ${item.avatarBg}`}
                        >
                          {item.avatar}
                        </div>
                        <span className="font-semibold text-[#0b1c30]">{item.responsavel}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-[#0b1c30] block">{item.estabelecimento}</span>
                        <span className="text-[11px] text-[#565e74]">{item.descricao}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.categoriaColor}`}
                      >
                        {item.categoriaMacro}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-[#565e74]">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#565e74]" />
                        <span>{item.pagamento}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[#006948] font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-[#0b1c30] whitespace-nowrap">
                      - R$ {Math.abs(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#f8faff] border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#565e74] flex-wrap gap-2">
            <span>Exibindo 5 de 82 transações de Março/2026</span>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Rateio automático 50/50 em vigência</span>
              <span>•</span>
              <button
                onClick={() => onNavigateToTab('scanner')}
                className="text-[#006948] font-bold hover:underline"
              >
                Auditar Conciliação
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Health Bar matching image.png */}
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
            <button
              onClick={() => onNavigateToTab('scanner')}
              className="hover:text-[#006948] hover:underline"
            >
              Auditoria Fiscal
            </button>
            <span>•</span>
            <button
              onClick={() => setShowRateioModal(true)}
              className="hover:text-[#006948] hover:underline"
            >
              Regras de Rateio
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigateToTab('relatorios')}
              className="hover:text-[#006948] hover:underline"
            >
              Exportar Relatório Mensal
            </button>
            <span>•</span>
            <span>© 2026 Duarte Finanças</span>
          </div>
        </div>
      </div>

      {/* Modal: Ajustar Rateio */}
      {showRateioModal && (
        <div
          id="modal-rateio-backdrop"
          onClick={() => setShowRateioModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-rateio-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <h4 className="font-display font-bold text-base text-[#0b1c30]">
                Ajustar Proporção de Rateio
              </h4>
              <button
                onClick={() => setShowRateioModal(false)}
                className="p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#005a3c]">Guilherme: {guilhermeShare}%</span>
                  <span className="text-[#006194]">Mariana: {marianaShare}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guilhermeShare}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setGuilhermeShare(val);
                    setMarianaShare(100 - val);
                  }}
                  className="w-full accent-[#005a3c] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#f8faff] rounded-xl border border-[#e5eeff] text-xs text-[#565e74]">
                <p>
                  Por padrão, as despesas da Conta Única são divididas proporcionalmente aos rendimentos líquidos acordados (52% / 48%).
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGuilhermeShare(50);
                    setMarianaShare(50);
                  }}
                  className="flex-1 py-2 rounded-xl border border-[#cbd5e1] text-xs font-semibold hover:bg-[#eff4ff]"
                >
                  Definir 50/50
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuilhermeShare(52);
                    setMarianaShare(48);
                  }}
                  className="flex-1 py-2 rounded-xl border border-[#cbd5e1] text-xs font-semibold hover:bg-[#eff4ff]"
                >
                  Proporcional (52/48)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRateioModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#005a3c] text-white text-xs font-bold hover:bg-[#00472f]"
            >
              Confirmar Rateio
            </button>
          </div>
        </div>
      )}

      {/* Voice Assistant Interactive Modal (Shared Mobile & Desktop) */}
      {isVoiceAssistantOpen && (
        <div
          id="modal-voice-assistant-backdrop"
          onClick={() => setIsVoiceAssistantOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="modal-voice-assistant-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-5 border border-[#dce9ff] shadow-2xl relative"
          >
            <button
              onClick={() => setIsVoiceAssistantOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#eff4ff] text-[#565e74] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-[#006194] text-white flex items-center justify-center shadow-lg relative mb-4">
                <Mic className="w-8 h-8" />
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-2 border-[#006194] animate-ping opacity-75" />
                )}
              </div>

              <span className="font-bold text-[11px] text-[#006194] uppercase tracking-wider">
                ASSISTENTE DUARTE FINANÇAS
              </span>
              <h3 className="font-display font-bold text-lg text-[#0b1c30] mt-1">
                {isListening ? 'Ouvindo lançamento...' : 'Comando por Voz ou Texto'}
              </h3>
              <p className="text-xs text-[#565e74] mt-1 px-4">
                Fale despesas como: &ldquo;Registrei R$ 35,00 na padaria pelo PIX&rdquo;
              </p>
            </div>

            {voiceResponse && (
              <div className="mt-4 p-3 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#006948] flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{voiceResponse}</span>
              </div>
            )}

            <form onSubmit={handleSendVoiceQuery} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={voiceQuery}
                onChange={(e) => setVoiceQuery(e.target.value)}
                placeholder="Ou digite o comando aqui..."
                className="flex-1 px-3.5 py-2.5 text-xs bg-[#f8f9ff] border border-[#dce9ff] rounded-xl text-[#0b1c30] focus:outline-none focus:border-[#006194]"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#006194] hover:bg-[#004d77] text-white transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex justify-between items-center text-[11px] text-[#565e74]">
              <span>Compatível com Alexa & Siri</span>
              <button
                type="button"
                onClick={handleStartVoice}
                className="text-[#006194] font-bold hover:underline"
              >
                Falar novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
