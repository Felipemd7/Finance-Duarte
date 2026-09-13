import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Receipt,
  Scale,
  ScanLine,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  ShieldCheck,
  RefreshCw,
  Wine,
  Package,
  ShoppingCart,
  ChevronRight,
  Printer,
  X,
  Store,
  Layers,
  Check,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface MarketAnalyticsReportsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const MarketAnalyticsReportsView: React.FC<MarketAnalyticsReportsViewProps> = ({
  onNavigateTab,
}) => {
  // State for period selector
  const [selectedPeriod, setSelectedPeriod] = useState<'marco' | 'bimestral' | 'acumulado'>(
    'marco'
  );

  // State for volume financeiro unit toggle: Absolute (R$) vs Percentage (%)
  const [volumeUnit, setVolumeUnit] = useState<'reais' | 'percent'>('reais');

  // State for sorting subcategories: by amount or by name
  const [sortByAmount, setSortByAmount] = useState(true);

  // Modals state
  const [showInflationModal, setShowInflationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 6 Categories with their breakdown and bar width
  const categoriesData = [
    {
      id: 'carnes',
      name: 'Carnes, Aves & Peixes',
      icon: '🥩',
      amount: 1120.0,
      percent: 34.1,
      color: '#006948',
      barClass: 'bg-[#006948]',
    },
    {
      id: 'laticinios',
      name: 'Laticínios, Frios & Matinais',
      icon: '🥛',
      amount: 542.0,
      percent: 16.5,
      color: '#006194',
      barClass: 'bg-[#006194]',
    },
    {
      id: 'graos',
      name: 'Grãos, Mercearia & Básicos',
      icon: '🌾',
      amount: 462.8,
      percent: 14.1,
      color: '#1e293b',
      barClass: 'bg-[#1e293b]',
    },
    {
      id: 'snacks',
      name: 'Bebidas, Snacks & Extras (Conforto)',
      icon: '🍷',
      amount: 441.8,
      percent: 13.5,
      color: '#d97706',
      barClass: 'bg-[#d97706]',
    },
    {
      id: 'limpeza',
      name: 'Produtos de Limpeza & Sabão',
      icon: '🧼',
      amount: 394.5,
      percent: 12.0,
      color: '#0284c7',
      barClass: 'bg-[#0284c7]',
    },
    {
      id: 'higiene',
      name: 'Higiene Pessoal & Perfumaria',
      icon: '🧴',
      amount: 318.9,
      percent: 9.7,
      color: '#8b5cf6',
      barClass: 'bg-[#8b5cf6]',
    },
  ];

  // Detailed Subcategory Cards (Raio-X de Consumo por Cesta)
  const subcategoryCards = [
    {
      id: 'carnes-card',
      title: 'Carnes, Aves & Peixes',
      amount: 1120.0,
      share: '34,1% do dispêndio total',
      iconBg: 'bg-[#ffebee] text-[#ba1a1a]',
      iconEmoji: '🥩',
      metric1Label: 'Volume Mensal',
      metric1Value: '24,5 kg consumidos',
      metric2Label: 'Preço Médio Ponderado',
      metric2Value: 'R$ 45,71 / kg',
      items: [
        { label: 'Frango Sassami (12 kg @ R$ 20,90)', store: 'Atacadão' },
        { label: 'Picanha / Alcatra Angus (4,2 kg @ R$ 61,90)', store: "Sam's Club" },
        { label: 'Carne Moída Patinho (5,5 kg @ R$ 38,00)', store: 'Atacadão' },
        { label: 'Salmão / Filé de Peixe (2,8 kg @ R$ 68,00)', store: 'Carvalho Super' },
      ],
      alertText: 'Atenção: Cortes nobres excederam em R$ 190',
      alertType: 'danger',
    },
    {
      id: 'limpeza-card',
      title: 'Limpeza & Sabão',
      amount: 394.5,
      share: '12,0% do dispêndio total',
      iconBg: 'bg-[#ecfdf5] text-[#006948]',
      iconEmoji: '🧼',
      metric1Label: 'Volume Mensal',
      metric1Value: '14 Litros + 30 Pastilhas',
      metric2Label: 'Custo Equivalente',
      metric2Value: 'R$ 7,80 / 1 L líq.',
      items: [
        { label: 'Sabão OMO 5L (2 un = 10L @ R$ 38,90)', store: 'Atacadão' },
        { label: 'Amaciante Conc. 1,5L (2 un @ R$ 24,90)', store: 'Geramercantil' },
        { label: 'Finish Lava-louças (1 pct 30un @ R$ 59,90)', store: 'Carvalho Super' },
        { label: 'Detergente Neutro (6 un 500ml @ R$ 2,89)', store: 'Atacadão' },
      ],
      alertText: 'Economia de 22% comprando galão 5L',
      alertType: 'success',
    },
    {
      id: 'graos-card',
      title: 'Grãos & Mercearia',
      amount: 462.8,
      share: '14,1% do dispêndio total',
      iconBg: 'bg-[#eff4ff] text-[#006194]',
      iconEmoji: '🌾',
      metric1Label: 'Volume Mensal',
      metric1Value: '28 kg alimentos secos',
      metric2Label: 'Preço Médio Ponderado',
      metric2Value: 'R$ 8,20 / kg',
      items: [
        { label: 'Arroz Tipo 1 Camil (4x 5kg = 20kg @ R$ 28,90)', store: 'R$ 5,78/kg' },
        { label: 'Feijão Carioca Premium (5 kg @ R$ 8,90)', store: 'Atacadão' },
        { label: 'Azeite Extra Virgem (4 vidros 500ml @ R$ 41,20)', store: 'Carvalho Super' },
        { label: 'Macarrão Grano Duro (4 pct 500g @ R$ 9,50)', store: 'Geramercantil' },
      ],
      alertText: 'Azeite subiu +14% vs Fevereiro',
      alertType: 'warning',
    },
    {
      id: 'laticinios-card',
      title: 'Laticínios & Frios',
      amount: 542.0,
      share: '16,5% do dispêndio total',
      iconBg: 'bg-[#eff4ff] text-[#006194]',
      iconEmoji: '🥛',
      metric1Label: 'Volume Mensal',
      metric1Value: '18 L + 2,4 kg queijos',
      metric2Label: 'Leite Integral',
      metric2Value: 'R$ 4,89 / L',
      items: [
        { label: 'Leite Integral UHT (18 caixas @ R$ 4,89/L)', store: 'R$ 88,02' },
        { label: 'Queijo Muçarela fatiada (1,2 kg @ R$ 49,90)', store: 'Atacadão' },
        { label: 'Parmesão / Gorgonzola (800g @ R$ 118,10/kg)', store: "Sam's Club" },
        { label: 'Café em Grãos Gourmet (2 kg @ R$ 54,90/kg)', store: "Sam's Club" },
      ],
      alertText: 'Preço do café estável há 90 dias',
      alertType: 'info',
    },
    {
      id: 'snacks-card',
      title: 'Snacks & Extras',
      amount: 441.8,
      share: '13,5% do dispêndio total',
      iconBg: 'bg-[#eff4ff] text-[#006194]',
      iconEmoji: '🍷',
      metric1Label: 'Natureza',
      metric1Value: 'Conforto / Lazer',
      metric2Label: 'Planejado vs Real',
      metric2Value: '+R$ 141,80',
      metric2Alert: true,
      items: [
        { label: 'Vinhos Jantar Casal (2 garrafas @ R$ 68,00)', store: 'R$ 136,00' },
        { label: 'Chocolates Lindt / Snacks Importados', store: 'R$ 118,00' },
        { label: 'Cervejas Artesanais IPA (Pack 6)', store: 'R$ 99,80' },
        { label: 'Sucos Integrais Uva & Água com Gás', store: 'R$ 88,00' },
      ],
      alertText: 'R$ 235,80 reclassificado para Lazer',
      alertType: 'action',
    },
    {
      id: 'higiene-card',
      title: 'Higiene & Cuidados',
      amount: 318.9,
      share: '9,7% do dispêndio total',
      iconBg: 'bg-[#f3e8ff] text-[#8b5cf6]',
      iconEmoji: '🧴',
      metric1Label: 'Papel Higiênico',
      metric1Value: '36 Rolos (Tripla)',
      metric2Label: 'Cuidado Pessoal',
      metric2Value: '8 Itens adquiridos',
      items: [
        { label: 'Papel Folha Tripla 24 rolos (2 pct @ R$ 44,90)', store: 'R$ 89,80' },
        { label: 'Creme Dental 3-pack (2 caixas @ R$ 22,50)', store: 'R$ 45,00' },
        { label: 'Sabonete Barra hidratante (Kit 12 un)', store: 'R$ 28,00' },
        { label: 'Shampoo / Condicionador Dermocosmético', store: 'R$ 68,00' },
      ],
      alertText: 'Estoque de higiene garantido até Maio',
      alertType: 'success',
    },
  ];

  const sortedCards = [...subcategoryCards].sort((a, b) =>
    sortByAmount ? b.amount - a.amount : a.title.localeCompare(b.title)
  );

  return (
    <div
      id="dashboard-analitico-view"
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
      {/* BREADCRUMB & TIMESTAMP                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#565e74]">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 font-medium">
          <button
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="hover:text-[#006948] transition-colors cursor-pointer"
          >
            Início
          </button>
          <span>/</span>
          <span className="hover:text-[#006948] transition-colors cursor-pointer">
            Auditoria & Analytics
          </span>
          <span>/</span>
          <span className="text-[#0b1c30] font-semibold">Cestas de Mercado</span>
        </div>

        {/* Right: Last OCR Reading Pill */}
        <div className="flex items-center gap-1.5 font-semibold text-[11px] text-[#006948] self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
          <span>ÚLTIMA LEITURA DE CUPOM: HOJE ÀS 14:32 (ATACADÃO)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO TITLE AREA & ACTIONS                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Tag */}
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#006948] font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
              INTELIGÊNCIA DE SUPRIMENTOS DOMÉSTICOS
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Dashboard Analítico de Supermercado & Cestas de Consumo
          </h1>

          <p className="text-xs sm:text-sm text-[#565e74] leading-relaxed">
            Visão granular de volumes (kg, L, un), preços médios praticados, índice de inflação da
            cesta básica e comparativo de estabelecimentos (Atacadão vs. Sam's Club vs. Pão de
            Açúcar) em Março de 2026.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Period selector pill buttons */}
          <div className="bg-[#eff4ff] p-1 rounded-xl border border-[#dce9ff] flex items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedPeriod('marco')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPeriod === 'marco'
                  ? 'bg-white text-[#006948] shadow-xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Março 2026
            </button>
            <button
              onClick={() => setSelectedPeriod('bimestral')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedPeriod === 'bimestral'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Bimestral
            </button>
            <button
              onClick={() => setSelectedPeriod('acumulado')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedPeriod === 'acumulado'
                  ? 'bg-white text-[#006948] shadow-xs font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Acumulado 2026
            </button>
          </div>

          {/* Comparativo de Inflação Button */}
          <button
            onClick={() => setShowInflationModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#e5eeff] hover:bg-[#f8f9ff] text-xs font-bold text-[#006194] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#006194]" />
            <span>Comparativo de Inflação</span>
          </button>

          {/* Exportar Relatório (PDF) Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Relatório (PDF)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 TOP METRIC KPI CARDS                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gasto em Supermercado */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              GASTO EM SUPERMERCADO
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ffebee] text-[#ba1a1a] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl sm:text-3xl text-[#0b1c30] tnum">
              R$ 3.280,00
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#565e74] mt-1">
              <span>Teto: R$ 2.800,00</span>
              <span className="font-bold text-[#ba1a1a]">+R$ 480,00 (17,1%)</span>
            </div>
          </div>

          {/* Dual tone progress bar */}
          <div className="mt-3.5 w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden flex">
            <div className="bg-[#006948] h-full" style={{ width: '85%' }} />
            <div className="bg-[#ba1a1a] h-full" style={{ width: '15%' }} />
          </div>
        </div>

        {/* Card 2: Peso & Curagem Mensal */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              PESO & CURAGEM MENSAL
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl sm:text-3xl text-[#0b1c30] tnum">
              64,8 kg <span className="text-xs sm:text-sm font-normal text-[#565e74]">sólidos</span>
            </div>
            <div className="text-xs text-[#565e74] mt-1">
              22,5 Litros em líquidos de limpeza & consumo
            </div>
          </div>

          <div className="mt-3.5">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#006948] text-[11px] font-bold">
              3 Viagens de Abastecimento
            </span>
          </div>
        </div>

        {/* Card 3: Auditoria de Cupons (OCR) */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              AUDITORIA DE CUPONS (OCR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#f3e8ff] text-[#8b5cf6] flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl sm:text-3xl text-[#0b1c30] tnum">
              68 Itens <span className="text-xs sm:text-sm font-normal text-[#565e74]">conciliados</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#565e74] mt-1">
              <span>Taxa de Leitura: 100%</span>
              <span className="font-bold text-[#006948]">0 Divergências</span>
            </div>
          </div>

          <div className="mt-3.5">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#f3e8ff] text-[#8b5cf6] text-[11px] font-bold">
              4 Cupons Fiscais (NFC-e)
            </span>
          </div>
        </div>

        {/* Card 4: IPCA Pessoal Duarte */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              IPCA PESSOAL DUARTE
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-[#006194] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl sm:text-3xl text-[#0b1c30] tnum">
              +3,8% <span className="text-xs sm:text-sm font-normal text-[#565e74]">vs Fev 2026</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#565e74] mt-1">
              <span>IPCA Geral Oficial: +0,62%</span>
              <span className="font-bold text-[#ba1a1a]">Impacto: Azeite & Carnes</span>
            </div>
          </div>

          <div className="mt-3.5">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-[#ffebee] text-[#ba1a1a] text-[11px] font-bold">
              Descolamento de +3,18 p.p.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: Volume Financeiro & Peso (Left) + Rateio Casal Duarte (Right)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Volume Financeiro & Peso de Cestas (~65% width) */}
        <div className="lg:col-span-7 bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col justify-between shadow-2xs gap-4">
          <div>
            {/* Header with Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
                  DISTRIBUIÇÃO ORÇAMENTÁRIA
                </span>
                <h2 className="font-display font-bold text-base text-[#0b1c30] mt-0.5">
                  Volume Financeiro & Peso de Cestas em Março
                </h2>
              </div>

              {/* Unit Toggle: Valores Absolutos vs % */}
              <button
                onClick={() => setVolumeUnit(volumeUnit === 'reais' ? 'percent' : 'reais')}
                className="flex items-center gap-2 text-xs text-[#006948] font-bold bg-[#ecfdf5] px-2.5 py-1 rounded-lg border border-[#a7f3d0] cursor-pointer hover:bg-[#d1fae5] transition-colors self-start sm:self-auto"
              >
                <span className="w-2 h-2 rounded-full bg-[#006948]" />
                <span>{volumeUnit === 'reais' ? 'Valores Absolutos (R$)' : 'Percentual Relativo (%)'}</span>
              </button>
            </div>

            {/* List of 6 categories with horizontal progress bars */}
            <div className="flex flex-col gap-3.5 mt-3.5">
              {categoriesData.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-1.5">
                  {/* Label row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0b1c30] flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-display font-bold text-[#0b1c30] tnum">
                      {volumeUnit === 'reais'
                        ? `${formatBRL(cat.amount)} (${cat.percent.toString().replace('.', ',')}%)`
                        : `${cat.percent.toString().replace('.', ',')}% (${formatBRL(cat.amount)})`}
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.barClass} transition-all duration-500 rounded-full`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Footnote */}
          <div className="pt-3 border-t border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#565e74]">
            <span>* Despesas divididas em proporção paritária (50% Felipe / 50% Genivânia)</span>
            <span className="font-semibold text-[#006948] flex items-center gap-1">
              <span>🍃</span>
              <span>Economia acumulada estimada em compras planejadas: R$ 398,40</span>
            </span>
          </div>
        </div>

        {/* Right: Rateio Casal Duarte (~35% width) */}
        <div className="lg:col-span-5 bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col justify-between shadow-2xs gap-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
                  ORÇAMENTO FAMILIAR CONJUNTO
                </span>
                <h2 className="font-display font-bold text-base text-[#0b1c30] mt-0.5">
                  Gestão Unificada 50/50
                </h2>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-[#565e74] mt-2">
              Lançamentos integrados diretamente na Conta Central do Casal Duarte.
            </p>

            {/* Felipe & Genivânia 50/50 Split Box */}
            <div className="mt-3.5 flex flex-col gap-2.5">
              {/* Member 1: Felipe Duarte */}
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white font-bold text-xs flex items-center justify-center">
                    FD
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-[#0b1c30]">Felipe Duarte</span>
                    <span className="text-[10px] text-[#565e74]">Responsável 1</span>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-[#0b1c30] tnum">
                  50%
                </span>
              </div>

              {/* Member 2: Genivânia Duarte */}
              <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ec4899] text-white font-bold text-xs flex items-center justify-center">
                    GD
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-[#0b1c30]">Genivânia Duarte</span>
                    <span className="text-[10px] text-[#565e74]">Responsável 2</span>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-[#0b1c30] tnum">
                  50%
                </span>
              </div>
            </div>

            {/* Callout: Reclassificação Sugerida */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-[#006194] shrink-0 mt-0.5" />
              <div className="flex flex-col text-xs leading-relaxed text-[#565e74]">
                <span className="font-bold text-[#0b1c30]">Reclassificação Sugerida</span>
                <span>
                  Dos <strong className="text-[#0b1c30]">R$ 441,80</strong> gastos em{' '}
                  <em>Bebidas & Snacks</em>, <strong className="text-[#0b1c30]">R$ 235,80</strong>{' '}
                  (vinhos e cervejas artesanais) foram remanejados para a verba{' '}
                  <strong className="text-[#0b1c30]">"Lazer/Jantares de Fim de Semana"</strong>,
                  ajustando o déficit real de mantimentos essenciais para{' '}
                  <strong className="text-[#ba1a1a]">+R$ 244,20</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Stamp */}
          <div className="pt-2 text-center">
            <span className="text-[10px] font-bold tracking-widest text-[#565e74] uppercase">
              CONTA CONJUNTA VERIFICADA E AUDITADA
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: RAIO-X DE CONSUMO POR CESTA (6 Subcategories in 3x2 Grid)           */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#f1f5f9]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              MÉTRICAS POR SUBCATEGORIA
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#0b1c30] mt-0.5">
              Raio-X de Consumo por Cesta
            </h2>
          </div>

          <button
            onClick={() => setSortByAmount(!sortByAmount)}
            className="text-xs text-[#006194] hover:text-[#004e76] font-semibold flex items-center gap-1.5 cursor-pointer bg-[#eff4ff] px-3 py-1.5 rounded-lg border border-[#dce9ff]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{sortByAmount ? 'Ordenado por Volume Financeiro' : 'Ordenado por Nome'}</span>
          </button>
        </div>

        {/* 6 Subcategory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCards.map((card) => (
            <div
              key={card.id}
              className="bg-white border border-[#e5eeff] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs gap-3.5 hover:border-[#cbd5e1] transition-all"
            >
              {/* Card Top: Title & Value */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-[#006948] flex items-center justify-center text-base">
                      {card.iconEmoji}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm text-[#0b1c30]">
                        {card.title}
                      </span>
                      <span className="text-[10px] text-[#565e74]">{card.share}</span>
                    </div>
                  </div>

                  <div className="font-display font-black text-base sm:text-lg text-[#0b1c30] tnum">
                    {formatBRL(card.amount)}
                  </div>
                </div>

                {/* Sub-metrics bar */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#565e74] uppercase font-bold">
                      {card.metric1Label}
                    </span>
                    <span className="font-bold text-[#0b1c30]">{card.metric1Value}</span>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] text-[#565e74] uppercase font-bold">
                      {card.metric2Label}
                    </span>
                    <span
                      className={`font-bold ${
                        card.metric2Alert ? 'text-[#ba1a1a]' : 'text-[#006948]'
                      }`}
                    >
                      {card.metric2Value}
                    </span>
                  </div>
                </div>

                {/* Items breakdown list */}
                <div className="mt-3 flex flex-col gap-1.5 text-xs">
                  {card.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-0.5 text-[#0b1c30]"
                    >
                      <span className="truncate text-[11px] text-[#565e74]">{it.label}</span>
                      <span className="shrink-0 text-[10px] font-bold text-[#006194] bg-[#eff4ff] px-1.5 py-0.5 rounded">
                        {it.store}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Footer Pill */}
              <div className="pt-2 border-t border-[#f1f5f9]">
                {card.alertType === 'danger' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ba1a1a] bg-[#ffebee] px-2.5 py-1 rounded-lg w-full">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{card.alertText}</span>
                  </span>
                )}
                {card.alertType === 'success' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006948] bg-[#ecfdf5] px-2.5 py-1 rounded-lg w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{card.alertText}</span>
                  </span>
                )}
                {card.alertType === 'warning' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ba1a1a] bg-[#ffebee] px-2.5 py-1 rounded-lg w-full">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{card.alertText}</span>
                  </span>
                )}
                {card.alertType === 'info' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006194] bg-[#eff4ff] px-2.5 py-1 rounded-lg w-full">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{card.alertText}</span>
                  </span>
                )}
                {card.alertType === 'action' && (
                  <button
                    onClick={() =>
                      triggerToast('R$ 235,80 realocado da cesta de mercado para o teto de Lazer!')
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006194] bg-[#eff4ff] hover:bg-[#dce9ff] px-2.5 py-1 rounded-lg w-full cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{card.alertText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: MATRIZ DE ARBITRAGEM DE COMPRAS                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col gap-4 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              <Store className="w-3.5 h-3.5 text-[#006948]" />
              <span>MATRIZ DE ARBITRAGEM DE COMPRAS</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#0b1c30] mt-0.5">
              Comparativo de Preços Médios: Atacadão vs. Sam's Club vs. Carvalho Super
            </h2>
            <p className="text-xs text-[#565e74]">
              Mapeamento de onde compensa abastecer cada tipo de insumo doméstico para maximizar o
              orçamento mensal do casal.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-bold text-[#006948] self-start sm:self-auto shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
            <span>Arbitragem Ativa: ~18,4% Economia Média</span>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5eeff] text-[#565e74] text-[10px] font-bold uppercase tracking-wider bg-[#f8f9ff]">
                <th className="py-2.5 px-3">PRODUTO / INSUMO</th>
                <th className="py-2.5 px-3">ATACADÃO (ATACADO)</th>
                <th className="py-2.5 px-3">SAM'S CLUB (CLUBE)</th>
                <th className="py-2.5 px-3">CARVALHO SUPER (VAREJO)</th>
                <th className="py-2.5 px-3">DIFERENCIAL / DISPERSÃO</th>
                <th className="py-2.5 px-3 text-right">DECISÃO DO CASAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {/* Row 1: Arroz Tipo 1 */}
              <tr className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#0b1c30] flex items-center gap-2">
                  <span className="text-base">🌾</span>
                  <span>Arroz Tipo 1 Camil (Pacote 5kg)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#006948] bg-[#ecfdf5]/40">
                  R$ 28,90 <span className="text-[10px] font-normal text-[#565e74]">(R$ 5,78/kg)</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  R$ 31,90 <span className="text-[10px]">(R$ 6,38/kg)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-[#ba1a1a]">
                  R$ 34,90 <span className="text-[10px]">(R$ 6,98/kg)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#ba1a1a]">
                  +20,7% <span className="font-normal text-[#565e74]">no Carvalho Super</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]">
                    COMPRAR NO ATACADÃO
                  </span>
                </td>
              </tr>

              {/* Row 2: Sabão Líquido OMO 5L */}
              <tr className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#0b1c30] flex items-center gap-2">
                  <span className="text-base">🧼</span>
                  <span>Sabão Líquido OMO Lavagem Perfeita 5L</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#006948] bg-[#ecfdf5]/40">
                  R$ 38,90 <span className="text-[10px] font-normal text-[#565e74]">(R$ 7,78/L)</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  R$ 44,90 <span className="text-[10px]">(R$ 8,98/L)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-[#ba1a1a]">
                  R$ 52,00 <span className="text-[10px]">(R$ 10,40/L)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#ba1a1a]">
                  +33,6% <span className="font-normal text-[#565e74]">vs Varejo comum</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]">
                    COMPRAR NO ATACADÃO
                  </span>
                </td>
              </tr>

              {/* Row 3: Picanha Bovina / kg */}
              <tr className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#0b1c30] flex items-center gap-2">
                  <span className="text-base">🥩</span>
                  <span>Picanha Bovina / kg (Peça Resfriada)</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  R$ 54,90 <span className="text-[10px]">(Corte Standard)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#006194] bg-[#eff4ff]/60">
                  R$ 61,90 <span className="text-[10px] font-normal text-[#565e74]">(Angus Certificado)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-[#ba1a1a]">
                  R$ 89,90 <span className="text-[10px]">(Prime Selection)</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  Diferencial de acabamento & maciez
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#006194] border border-[#dce9ff]">
                    SAM'S CLUB (MELHOR CUSTO/BENEFÍCIO)
                  </span>
                </td>
              </tr>

              {/* Row 4: Café Especial em Grãos */}
              <tr className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#0b1c30] flex items-center gap-2">
                  <span className="text-base">☕</span>
                  <span>Café Especial em Grãos 100% Arábica / kg</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  R$ 59,90 <span className="text-[10px]">(Marcas Tradicionais)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#006194] bg-[#eff4ff]/60">
                  R$ 54,90 <span className="text-[10px] font-normal text-[#565e74]">(Member's Mark 1kg)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-[#ba1a1a]">
                  R$ 69,90 <span className="text-[10px]">(Marcas Gourmet)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#ba1a1a]">
                  +27,3% <span className="font-normal text-[#565e74]">no Carvalho Super</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#006194] border border-[#dce9ff]">
                    COMPRAR NO SAM'S CLUB
                  </span>
                </td>
              </tr>

              {/* Row 5: Leite UHT Integral */}
              <tr className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#0b1c30] flex items-center gap-2">
                  <span className="text-base">🥛</span>
                  <span>Leite UHT Integral (Caixa 1L em fardos)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#006948] bg-[#ecfdf5]/40">
                  R$ 4,69 <span className="text-[10px] font-normal text-[#565e74]">(Fardo 12 un)</span>
                </td>
                <td className="py-3 px-3 text-[#565e74]">
                  R$ 4,95 <span className="text-[10px]">(Pack com 12)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-[#ba1a1a]">
                  R$ 5,49 <span className="text-[10px]">(Unidade Avulsa)</span>
                </td>
                <td className="py-3 px-3 font-bold text-[#ba1a1a]">
                  +17,0% <span className="font-normal text-[#565e74]">comprando avulso</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]">
                    COMPRAR NO ATACADÃO
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Golden Rule Footer Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#565e74] bg-[#f8f9ff] p-3 rounded-xl border border-[#e5eeff]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#d97706] shrink-0" />
            <span>
              <strong>Regra de Ouro Duarte:</strong> Limpeza e Secos no Atacadão; Carnes nobres e
              Café no Sam's Club; Frescos imediatos no Carvalho Super.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#565e74] shrink-0">
            Base de Cálculo: 4 Coletas Simultâneas
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 5: GESTÃO DE DESPENSA & SUPRIMENTOS                                   */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e5eeff] rounded-2xl p-5 flex flex-col gap-4 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#565e74] tracking-wider">
              GESTÃO DE DESPENSA & SUPRIMENTOS
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#0b1c30] mt-0.5">
              Projeção de Estoque Doméstico & Previsão de Recompra
            </h2>
            <p className="text-xs text-[#565e74]">
              Cálculo automatizado do ritmo de queima (burn-rate) dos mantimentos estocados para
              evitar compras duplicadas em Abril de 2026.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-bold text-[#006948] self-start sm:self-auto shrink-0">
            <Package className="w-3.5 h-3.5 text-[#006948]" />
            <span>Despensa Operando em 88% da Capacidade</span>
          </div>
        </div>

        {/* 4 Inventory Stock Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Item 1: Arroz Branco / Grãos */}
          <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30]">
                  Arroz Branco / Grãos
                </span>
                <span className="text-base">🌾</span>
              </div>
              <span className="text-[11px] text-[#565e74] block mt-0.5">
                20 kg adquiridos no Atacadão
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#006948]">Autonomia: 60 Dias</span>
                <span className="font-semibold text-[#565e74]">100% Seguro</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#006948] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
              <span className="text-[#565e74]">Próxima compra:</span>
              <span className="font-bold text-[#0b1c30]">Maio de 2026</span>
            </div>
          </div>

          {/* Item 2: Sabão Líquido OMO */}
          <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30]">
                  Sabão Líquido OMO
                </span>
                <span className="text-base">🧼</span>
              </div>
              <span className="text-[11px] text-[#565e74] block mt-0.5">
                10 Litros (2 galões de 5L)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#006194]">Autonomia: 75 Dias</span>
                <span className="font-semibold text-[#565e74]">~100 Lavagens</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#006194] h-full rounded-full" style={{ width: '90%' }} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
              <span className="text-[#565e74]">Próxima compra:</span>
              <span className="font-bold text-[#0b1c30]">Junho de 2026</span>
            </div>
          </div>

          {/* Item 3: Azeite Extra Virgem */}
          <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30]">
                  Azeite Extra Virgem
                </span>
                <span className="text-base">🫒</span>
              </div>
              <span className="text-[11px] text-[#565e74] block mt-0.5">
                4 garrafas de 500ml (2 Litros)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#006948]">Autonomia: 60 Dias</span>
                <span className="font-semibold text-[#565e74]">1 vd / 15 dias</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#006948] h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
              <span className="text-[#565e74]">Cobertura total:</span>
              <span className="font-bold text-[#0b1c30]">Março & Abril</span>
            </div>
          </div>

          {/* Item 4: Carnes & Frango */}
          <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs sm:text-sm text-[#0b1c30]">
                  Carnes & Frango
                </span>
                <span className="text-base">🥩</span>
              </div>
              <span className="text-[11px] text-[#565e74] block mt-0.5">
                24,5 kg fracionados a vácuo
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#ba1a1a]">Autonomia: 22 Dias</span>
                <span className="font-semibold text-[#565e74]">32 refeições</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
              <span className="text-[#565e74]">Reabastecer:</span>
              <span className="font-bold text-[#ba1a1a]">24 de Março</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner: Impacto Orçamentário em Abril */}
        <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#565e74]">
            <CheckCircle2 className="w-4 h-4 text-[#006194] shrink-0" />
            <span>
              <strong className="text-[#0b1c30]">Impacto Orçamentário em Abril:</strong> A
              antecipação de secos e sabão reduz o teto necessário de compras em Abril para
              aproximadamente <strong className="text-[#006948]">R$ 1.950,00</strong>.
            </span>
          </div>

          <button
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('lista');
              } else {
                triggerToast('Sincronizado com a Lista de Compras!');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#dce9ff] hover:bg-[#dce9ff] text-xs font-bold text-[#006194] transition-all shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            Sincronizar com Lista de Compras
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INFLATION COMPARISON MODAL                                                */}
      {/* ========================================================================= */}
      {showInflationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#e5eeff] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#006194]" />
                <h3 className="font-display font-bold text-base text-[#0b1c30]">
                  Comparativo de Inflação (IPCA Pessoal vs Oficial)
                </h3>
              </div>
              <button
                onClick={() => setShowInflationModal(false)}
                className="p-1 rounded-lg text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#565e74] leading-relaxed">
              <div className="p-3 bg-[#ffebee] border border-[#ffdad6] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#ba1a1a]">
                    IPCA PESSOAL DUARTE
                  </span>
                  <div className="font-display font-bold text-lg text-[#ba1a1a]">+3,80%</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#565e74]">
                    IPCA OFICIAL (IBGE)
                  </span>
                  <div className="font-display font-bold text-lg text-[#0b1c30]">+0,62%</div>
                </div>
              </div>

              <span className="font-bold text-[#0b1c30]">Principais Vilões da Cesta Familiar:</span>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between p-2 rounded-lg bg-[#f8f9ff]">
                  <span>Azeite de Oliva Extra Virgem</span>
                  <span className="font-bold text-[#ba1a1a]">+14,2%</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#f8f9ff]">
                  <span>Carnes Nobres (Picanha/Alcatra)</span>
                  <span className="font-bold text-[#ba1a1a]">+9,2%</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#f8f9ff]">
                  <span>Leite UHT Integral</span>
                  <span className="font-bold text-[#006948]">+1,8% (Controlado)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#f8f9ff]">
                  <span>Produtos de Limpeza (Atacadão)</span>
                  <span className="font-bold text-[#006948]">-3,5% (Deflação)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInflationModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#006948] text-white font-bold text-xs hover:bg-[#00563b] cursor-pointer transition-colors"
            >
              Fechar Análise
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPORT PDF MODAL                                                          */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#e5eeff] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-[#006948]" />
                <h3 className="font-display font-bold text-base text-[#0b1c30]">
                  Exportar Relatório Mensal
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#565e74]">
              <p>
                O relatório analítico de <strong>Março de 2026</strong> consolida os volumes de 64,8
                kg de alimentos e produtos, a divisão paritária de R$ 1.640,00 por cônjuge e o índice
                de inflação da cesta.
              </p>

              <div className="p-3 bg-[#f8f9ff] border border-[#e5eeff] rounded-xl flex flex-col gap-1 text-[11px]">
                <span className="font-bold text-[#0b1c30]">Conteúdo incluído no documento:</span>
                <span>• Resumo executivo de despesas e excedente</span>
                <span>• Matriz completa de arbitragem entre 3 redes varejistas</span>
                <span>• Projeção de estoque de despensa para Abril/26</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#eff4ff] text-[#006194] font-bold text-xs hover:bg-[#dce9ff] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Relatório em PDF gerado e baixado com sucesso!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#006948] text-white font-bold text-xs hover:bg-[#00563b] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="pt-4 pb-2 border-t border-[#e5eeff] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#565e74]">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#006948]" />
          <span>
            Criptografia Bancária de Ponta a Ponta (256-bit) • Open Finance & Sincronização
            Automática
          </span>
        </div>

        <div>© 2026 DuarteFinanças. Gestão de Patrimônio & Finanças Compartilhadas.</div>

        <div className="flex items-center gap-1 font-semibold text-[#006948]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006948]" />
          <span>Conexão Segura</span>
        </div>
      </footer>
    </div>
  );
};
