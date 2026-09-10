import React from 'react';
import {
  ShoppingCart,
  Car,
  RefreshCw,
  Mic,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  AlertTriangle,
  ArrowLeftRight,
  Volume2,
  Check,
  PiggyBank,
  TrendingUp,
  Fuel,
  Pill,
  Utensils,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  Copy,
  ArrowUpRight,
  Code2,
  MessageSquare,
} from 'lucide-react';

interface GoalsDesktopViewProps {
  isReclassified: boolean;
  onToggleReclassification: () => void;
  onShowToast: (msg: string) => void;
  onOpenAddGoal: () => void;
}

export const GoalsDesktopView: React.FC<GoalsDesktopViewProps> = ({
  isReclassified,
  onToggleReclassification,
  onShowToast,
  onOpenAddGoal,
}) => {
  return (
    <div id="metas-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e5eeff]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-xs font-bold border border-[#a7f3d0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              Sync Cloud 24/7 Ativo
            </span>
            <span className="text-xs text-[#565e74]">|</span>
            <span className="text-xs text-[#565e74] font-medium">Exercício Financeiro Março 2026</span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
            Metas, Veículo & Automações
          </h1>
          <p className="text-xs lg:text-sm text-[#565e74] mt-1.5 max-w-2xl leading-relaxed">
            Controle tático compartilhado do casal Duarte. Monitore limites orçamentários dinâmicos, o provisionamento do veículo e os disparos por comando de voz via Alexa & Siri.
          </p>
        </div>

        {/* Couple Rateio Card on right */}
        <div className="bg-white rounded-2xl p-3 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center gap-3 shrink-0">
          <div className="flex items-center -space-x-2">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
              alt="Guilherme"
              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
              referrerPolicy="no-referrer"
            />
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
              alt="Mariana"
              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left pr-2">
            <span className="text-xs font-bold text-[#0b1c30] block">
              Rateio Ativo: 50% / 50%
            </span>
            <span className="text-[10px] text-[#006948] font-medium block">
              Ambos com Acesso Master
            </span>
          </div>
          <button
            onClick={() => onShowToast('Paridade 50/50 bloqueada para a gestão de metas.')}
            className="p-1.5 rounded-lg text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
            title="Ajustar Paridade"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CAPACIDADE & TETOS MENSAIS -> Orçamento Compartilhado por Categoria */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              CAPACIDADE & TETOS MENSAIS
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Orçamento Compartilhado por Categoria
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold border border-[#dce9ff]">
            <TrendingUp className="w-3.5 h-3.5 text-[#006194]" />
            <span>Previsão Fechamento: R$ 9.469,60</span>
          </div>
        </div>

        {/* 5 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Supermercado & Feira (117% Excedido) */}
          <div className="bg-white rounded-2xl p-4 border border-[#fee2e2] shadow-[0_2px_12px_rgba(220,38,38,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] text-[10px] font-bold">
                  117% Excedido
                </span>
              </div>

              <span className="text-xs font-semibold text-[#565e74] block">
                Supermercado & Feira
              </span>
              <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
                R$ 3.280,00
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                <span>Meta: R$ 2.800,00</span>
                <span className="font-bold text-[#dc2626]">+R$ 480,00</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
              <div className="w-full bg-[#fee2e2] h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#dc2626] h-full rounded-full w-full" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#dc2626] font-medium">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Alerta: 3 compras não essenciais</span>
              </div>
            </div>
          </div>

          {/* Card 2: Lazer & Gastronomia (93% Atenção) */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#7c3aed] text-[10px] font-bold">
                  93% Atenção
                </span>
              </div>

              <span className="text-xs font-semibold text-[#565e74] block">
                Lazer & Gastronomia
              </span>
              <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
                R$ 1.120,00
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                <span>Meta: R$ 1.200,00</span>
                <span className="text-[#565e74]">| R$ 80,00 livre</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
              <div className="w-full bg-[#ede9fe] h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#7c3aed] h-full rounded-full w-[93%]" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#565e74]">
                <Clock className="w-3 h-3 text-[#7c3aed] shrink-0" />
                <span>Restam 12 dias no ciclo</span>
              </div>
            </div>
          </div>

          {/* Card 3: Combustível Mensal (85% Seguro) */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Fuel className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                  85% Seguro
                </span>
              </div>

              <span className="text-xs font-semibold text-[#565e74] block">
                Combustível Mensal
              </span>
              <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
                R$ 680,00
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                <span>Meta: R$ 800,00</span>
                <span className="text-[#006948] font-semibold">R$ 120,00 livre</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
              <div className="w-full bg-[#e5eeff] h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#006948] h-full rounded-full w-[85%]" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#006948] font-medium">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Consumo regular e controlado</span>
              </div>
            </div>
          </div>

          {/* Card 4: Farmácia & Cuidados (84% Equilibrado) */}
          <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d9488] text-[10px] font-bold">
                  84% Equilibrado
                </span>
              </div>

              <span className="text-xs font-semibold text-[#565e74] block">
                Farmácia & Cuidados
              </span>
              <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
                R$ 380,00
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                <span>Meta: R$ 450,00</span>
                <span className="text-[#0d9488] font-semibold">R$ 70,00 livre</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
              <div className="w-full bg-[#e5eeff] h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#0d9488] h-full rounded-full w-[84%]" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#0d9488] font-medium">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Sem imprevistos médicos</span>
              </div>
            </div>
          </div>

          {/* Card 5: Reserva & Investimentos (108% Superado) */}
          <div className="bg-white rounded-2xl p-4 border border-[#bbf7d0] shadow-[0_2px_12px_rgba(0,105,72,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#006948] flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#005a3c] text-white text-[10px] font-bold">
                  108% Superado
                </span>
              </div>

              <span className="text-xs font-semibold text-[#565e74] block">
                Reserva & Investimentos
              </span>
              <div className="font-display font-extrabold text-xl text-[#006948] font-mono mt-1">
                R$ 4.329,60
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                <span>Meta: R$ 4.000,00</span>
                <span className="text-[#006948] font-bold">+R$ 329,60</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
              <div className="w-full bg-[#dcfce7] h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#005a3c] h-full rounded-full w-full" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#006948] font-semibold">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>Meta de poupança atingida!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PATRIMÔNIO & MOBILIDADE -> Gestão Anual do Carro • 2026        */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006194] block">
              PATRIMÔNIO & MOBILIDADE
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Gestão Anual do Carro • 2026
            </h2>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-xs font-semibold border border-[#e2e8f0]">
            Veículo: Compass Limited 1.3 Turbo • Placa: DUA-2026
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Planejamento & Custos Fixos */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-4">
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Planejamento & Custos Fixos
                </h3>
                <span className="text-xs text-[#565e74]">
                  Rateio 50% Guilherme / 50% Mariana
                </span>
              </div>

              {/* 2x2 Subcards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* IPVA */}
                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">IPVA 2026 (SP)</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                      3 de 5 Quitadas
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-lg text-[#0b1c30] font-mono mt-1.5">
                    R$ 3.200,00
                  </div>
                  <span className="text-[10px] text-[#565e74] block mt-0.5">
                    Parcelas de R$ 640,00/mês
                  </span>
                </div>

                {/* Seguro */}
                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">Seguro Cobertura Total</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-[10px] font-bold">
                      Renovação Nov/26
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-lg text-[#0b1c30] font-mono mt-1.5">
                    R$ 2.800,00
                  </div>
                  <span className="text-[10px] text-[#565e74] block mt-0.5">
                    Provisionado R$ 233,33/mês
                  </span>
                </div>

                {/* Manutenção */}
                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">Manutenção Preventiva</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                      Teto R$ 3.000
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-lg text-[#0b1c30] font-mono mt-1.5">
                    R$ 650,00 <span className="text-xs font-normal text-[#565e74]">gastos</span>
                  </div>
                  <span className="text-[10px] text-[#006948] font-medium block mt-0.5">
                    Revisão 40.000km em dia
                  </span>
                </div>

                {/* Telemetria */}
                <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30]">Telemetria & Rastreador</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                      Assinatura Débito
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-lg text-[#0b1c30] font-mono mt-1.5">
                    R$ 99,00<span className="text-xs font-normal text-[#565e74]">/mês</span>
                  </div>
                  <span className="text-[10px] text-[#565e74] block mt-0.5">
                    Total Anual R$ 1.188,00
                  </span>
                </div>
              </div>
            </div>

            {/* Wide bottom bar: Combustível Acumulado no Ano */}
            <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0b1c30] block">
                    Combustível Acumulado no Ano
                  </span>
                  <span className="text-[11px] text-[#565e74]">
                    Janeiro a Março de 2026: 2.140 km percorridos
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono">
                  R$ 1.890,00
                </div>
                <span className="text-[10px] text-[#565e74] block">
                  Média: 10,8 km/litro
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Custo Real por Quilômetro & Gráfico */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Custo Real por Quilômetro
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                  Eficiência Alta
                </span>
              </div>
              <p className="text-xs text-[#565e74] leading-relaxed">
                Considera depreciação, seguros, IPVA, manutenção e consumo.
              </p>

              {/* Big Display Rate */}
              <div className="my-4 flex items-baseline gap-2">
                <span className="font-display font-extrabold text-4xl text-[#005a3c] font-mono">
                  R$ 1,18
                </span>
                <span className="text-xs font-bold text-[#565e74]">/ km rodado</span>
              </div>

              {/* Chart Box */}
              <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] mt-4">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-[#0b1c30]">Projeção Acumulada 2026</span>
                  <span className="text-[11px] text-[#565e74]">Teto Máx: R$ 14.500</span>
                </div>

                {/* SVG Line Chart Graphic */}
                <div className="relative h-28 w-full">
                  <svg viewBox="0 0 320 90" className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="320" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="320" y2="50" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="320" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />

                    {/* Area Fill */}
                    <defs>
                      <linearGradient id="carChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#006948" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#006948" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 75 Q 80 65, 160 48 T 300 15 L 300 85 L 10 85 Z"
                      fill="url(#carChartGrad)"
                    />

                    {/* Line */}
                    <path
                      d="M 10 75 Q 80 65, 160 48 T 300 15"
                      fill="none"
                      stroke="#005a3c"
                      strokeWidth="2.5"
                    />

                    {/* Point 1: Jan */}
                    <circle cx="10" cy="75" r="3.5" fill="#005a3c" />

                    {/* Point 2: Ago */}
                    <circle cx="160" cy="48" r="3.5" fill="#006194" />

                    {/* Point 3: Dez */}
                    <circle cx="300" cy="15" r="4" fill="#005a3c" />
                  </svg>

                  {/* Milestone Labels */}
                  <div className="flex justify-between items-center text-[10px] text-[#565e74] font-medium mt-1">
                    <span className="font-bold text-[#006948]">Jan (Atual: R$ 3,1k)</span>
                    <span className="text-[#006194]">Ago/26 Proj: R$ 8,9k</span>
                    <span className="font-bold text-[#005a3c]">Dez/26 Proj: R$ 13,2k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note below chart */}
            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center gap-2 text-xs text-[#565e74]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006948] shrink-0" />
              <span>IPVA totalmente quitado em Maio/2026 alivia R$ 640/mês para as férias.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SUPERMERCADO & FECHAMENTO -> Lista Ativa com Reconciliação IA */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              SUPERMERCADO & FECHAMENTO
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Lista Ativa com Reconciliação IA
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold flex items-center gap-1.5 border border-[#dce9ff]">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sincronizado via Voz em tempo real</span>
            </span>

            <button
              onClick={() => onShowToast('Abrindo formulário de item...')}
              className="px-4 py-1.5 rounded-full bg-[#005a3c] hover:bg-[#00472f] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Item</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): ITENS DA SESSÃO ATUAL */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-4">
              <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">
                ITENS DA SESSÃO ATUAL (ATACADÃO & HORTIFRUTI)
              </span>
              <span className="text-xs font-semibold text-[#006948]">
                3 de 4 itens concluídos
              </span>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {/* Item 1: Arroz */}
              <div className="p-3 bg-[#f8faff] rounded-2xl border border-[#e5eeff] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#005a3c] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Arroz Tipo 1 - 5kg
                    </span>
                    <span className="text-[11px] text-[#565e74] flex items-center gap-1">
                      <span>Adicionado por <strong>Guilherme</strong> via Alexa: "Alexa, adicionar arroz à lista"</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-xs text-[#0b1c30]">
                    R$ 29,90
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                    No Carrinho
                  </span>
                </div>
              </div>

              {/* Item 2: Azeite */}
              <div className="p-3 bg-[#f8faff] rounded-2xl border border-[#e5eeff] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#005a3c] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Azeite de Oliva Extra-Virgem 500ml
                    </span>
                    <span className="text-[11px] text-[#565e74] flex items-center gap-1">
                      <span>Adicionado por <strong>Mariana</strong> via Siri Shortcuts</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-xs text-[#0b1c30]">
                    R$ 44,50
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                    No Carrinho
                  </span>
                </div>
              </div>

              {/* Item 3: Café */}
              <div className="p-3 bg-[#f8faff] rounded-2xl border border-[#e5eeff] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-[#cbd5e1] flex items-center justify-center shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Café Especial em Grãos 1kg
                    </span>
                    <span className="text-[11px] text-[#565e74]">
                      Pendente no Atacadão • Estimado R$ 58,00
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-xs text-[#565e74]">
                    R$ 58,00 est.
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-[10px] font-bold">
                    Pendente
                  </span>
                </div>
              </div>

              {/* Item 4: Vinho (Impulse Alert) */}
              <div className="p-3 bg-[#fff7ed] rounded-2xl border border-[#fed7aa] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0b1c30]">
                        Vinho Chileno Reserva Carmenère
                      </span>
                      <span className="px-2 py-0.2 rounded bg-[#fed7aa] text-[#c2410c] text-[9px] font-bold uppercase">
                        Impulso / Cupom IA
                      </span>
                    </div>
                    <span className="text-[11px] text-[#565e74] block mt-0.5">
                      Não constava na lista de compras • Identificado pelo OCR do comprovante fiscal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-xs text-[#dc2626]">
                    R$ 68,00
                  </span>
                  <button
                    onClick={() => onShowToast('Rateio aprovado para o Vinho Reserva!')}
                    className="px-2.5 py-1 rounded-lg border border-[#cbd5e1] bg-white hover:bg-[#eff4ff] text-[10px] font-bold text-[#0b1c30] transition-colors cursor-pointer"
                  >
                    Aprovar Rateio
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): RECONCILIAÇÃO PÓS-COMPRAS -> Auditoria de Hábitos */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#006194] text-xs font-bold uppercase tracking-wider mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>RECONCILIAÇÃO PÓS-COMPRAS</span>
              </div>
              <h3 className="font-display font-bold text-base text-[#0b1c30]">
                Auditoria de Hábitos
              </h3>
              <p className="text-xs text-[#565e74] mt-1 leading-relaxed">
                A inteligência compara os itens falados pelo casal no microfone com o cupom fiscal emitido pelo caixa.
              </p>

              {/* Summary Box */}
              <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#565e74]">
                  <span>Total Planejado (Lista):</span>
                  <span className="font-mono font-bold text-[#0b1c30]">R$ 132,40</span>
                </div>

                <div className="flex justify-between items-center text-[#565e74]">
                  <span>Total Efetivado no Caixa:</span>
                  <span className="font-mono font-bold text-[#0b1c30]">R$ 142,40</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#f1f5f9]">
                  <span className="font-bold text-[#006194]">Itens de Impulso / Desvio:</span>
                  <span className="font-mono font-bold text-[#006194]">+R$ 68,00 (Vinho)</span>
                </div>
              </div>

              {/* Suggestion Box */}
              <div className="mt-4 p-3.5 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] text-xs text-[#166534]">
                <span className="font-bold block mb-1">Sugestão de Alocação:</span>
                <p className="text-[11px] leading-relaxed">
                  Transferir R$ 68,00 da categoria <strong>Supermercado</strong> para o teto de <strong>Lazer & Gastronomia</strong> para não estourar o orçamento doméstico.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onToggleReclassification}
              className="w-full mt-4 py-3 rounded-xl bg-[#005a3c] hover:bg-[#00472f] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#a7f3d0]" />
              <span>Aplicar Reclassificação Sugerida</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: ECOSSISTEMA CONECTADO -> Hub de Assistentes de Voz & API       */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006194] block">
              ECOSSISTEMA CONECTADO
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Hub de Assistentes de Voz & API
            </h2>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[#ecfdf5] text-[#006948] text-xs font-semibold flex items-center gap-1.5 border border-[#a7f3d0]">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
            <span>Webhooks Online (Latência 42ms)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Amazon Alexa */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#dce9ff]">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Amazon Alexa
                    </h3>
                    <span className="text-[11px] text-[#565e74]">
                      Skill: "Duarte Finanças"
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                  Conectado
                </span>
              </div>

              {/* Content */}
              <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] mb-4">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider block mb-2">
                  Comandos Suportados Ativos:
                </span>
                <div className="space-y-1.5 text-xs text-[#0b1c30]">
                  <p className="flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#006194] shrink-0 mt-0.5" />
                    <span>"Alexa, quanto sobrou no teto de Lazer?"</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#006194] shrink-0 mt-0.5" />
                    <span>"Alexa, adicione leite à lista do Atacadão."</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#006194] shrink-0 mt-0.5" />
                    <span>"Alexa, registrei R$ 120 no posto Ipiranga."</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#f1f5f9]">
              <span className="text-[#565e74]">OAuth 2.0: <strong>casal.duarte@fin.br</strong></span>
              <button
                onClick={() => onShowToast('Testando conexão com a Skill Alexa... Conexão OK!')}
                className="font-bold text-[#006948] hover:underline cursor-pointer"
              >
                Testar Skill
              </button>
            </div>
          </div>

          {/* Card 2: Apple Siri Shortcuts */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#dce9ff]">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Apple Siri Shortcuts
                    </h3>
                    <span className="text-[11px] text-[#565e74]">
                      iCloud Shortcuts Sync
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                  Configurado
                </span>
              </div>

              {/* Content */}
              <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] mb-4">
                <span className="text-[10px] font-bold text-[#565e74] uppercase tracking-wider block mb-2">
                  Atalhos Instalados (iPhone Mari & Gui):
                </span>
                <div className="space-y-1.5 text-xs text-[#0b1c30]">
                  <p className="flex items-start gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#006948] shrink-0 mt-0.5" />
                    <span>"E aí Siri, registrar despesa de R$ 45 no posto."</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#006948] shrink-0 mt-0.5" />
                    <span>"E aí Siri, quanto temos na reserva de emergência?"</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#006948] shrink-0 mt-0.5" />
                    <span>"E aí Siri, abrir lista de compras Duarte."</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#f1f5f9]">
              <span className="text-[#565e74]">2 Dispositivos Vinculados</span>
              <button
                onClick={() => onShowToast('Baixando atalho Duarte Finanças para o iOS...')}
                className="font-bold text-[#006948] hover:underline cursor-pointer"
              >
                Baixar Atalho .shortcut
              </button>
            </div>
          </div>

          {/* Card 3: Rotas da API REST */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center shrink-0 border border-[#dce9ff]">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                      Rotas da API REST
                    </h3>
                    <span className="text-[11px] text-[#565e74]">
                      Documentação v2.4
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onShowToast('Abrindo documentação Swagger da API...')}
                  className="text-xs font-semibold text-[#006194] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Swagger</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* API Endpoints Container */}
              <div className="bg-[#0b1c30] text-[#e2e8f0] rounded-2xl p-3 font-mono text-[11px] space-y-1 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#4ade80] font-bold">POST</span>
                  <span className="text-gray-300">/api/v1/listas-compras</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#38bdf8] font-bold">GET</span>
                  <span className="text-gray-300">/api/v1/resumo-mensal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4ade80] font-bold">POST</span>
                  <span className="text-gray-300">/api/v1/transacoes/rapida</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-[#f8faff] rounded-xl border border-[#e5eeff]">
              <code className="text-[10px] text-[#565e74] truncate">
                duarte_live_sec_99a8b7...
              </code>
              <button
                onClick={() => onShowToast('Chave de API copiada para a área de transferência!')}
                className="text-xs font-bold text-[#0b1c30] hover:text-[#006948] flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar Chave</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Health Bar */}
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
            Regras de Rateio
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
  );
};
