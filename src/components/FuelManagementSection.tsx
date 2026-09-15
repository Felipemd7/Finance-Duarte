import React, { useState, useMemo, useRef } from 'react';
import {
  Fuel,
  Car,
  Gauge,
  Calendar,
  DollarSign,
  TrendingUp,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  Plus,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend,
} from 'recharts';
import { FuelLog } from '../types';
import { formatBRL } from '../utils/formatters';

interface FuelManagementSectionProps {
  fuelLogs: FuelLog[];
  onAddFuelLog: (log: FuelLog) => void;
  onUpdateFuelLog: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
  onShowToast: (msg: string) => void;
  veiculoInfo?: string;
  custosFixosRateadosKm?: number; // default ~0.53 (IPVA + Seguro + Manutenção anual rateados)
}

export const FuelManagementSection: React.FC<FuelManagementSectionProps> = ({
  fuelLogs,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog,
  onShowToast,
  veiculoInfo = 'Jeep Compass Longitude Turbo • Placa DUA-2026',
  custosFixosRateadosKm = 0.53,
}) => {
  // Active period filter for analytics: 'diario' | 'semanal' | 'mensal'
  const [periodView, setPeriodView] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  const [activeTab, setActiveTab] = useState<'analise' | 'historico'>('analise');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<FuelLog | null>(null);

  // Modal sub-tab: 'upload' (Comprovante IA) vs 'manual' (Inserção Manual)
  const [modalMethod, setModalMethod] = useState<'upload' | 'manual'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formPosto, setFormPosto] = useState('');
  const [formCombustivel, setFormCombustivel] = useState('Gasolina Comum');
  const [formValorTotal, setFormValorTotal] = useState('');
  const [formPrecoLitro, setFormPrecoLitro] = useState('');
  const [formLitros, setFormLitros] = useState('');
  const [formKmAtual, setFormKmAtual] = useState('');
  const [formPagoPor, setFormPagoPor] = useState<'Felipe' | 'Genivânia' | 'Casal'>('Felipe');
  const [formFormaPagamento, setFormFormaPagamento] = useState('Cartão de Crédito');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formReceiptName, setFormReceiptName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Sort logs chronologically and calculate deltas dynamically
  const sortedLogs = useMemo(() => {
    const list = [...fuelLogs].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    return list.map((item, index) => {
      if (index === 0 || !item.kmAtual || item.kmAtual === 0) {
        return {
          ...item,
          kmRodados: 0,
          consumoKmPorLitro: 0,
          custoPorKm: 0,
        };
      }

      const prev = list[index - 1];
      const deltaKm = prev.kmAtual > 0 && item.kmAtual > prev.kmAtual ? item.kmAtual - prev.kmAtual : 0;
      const litros = item.litros > 0 ? item.litros : item.valorTotal / (item.precoLitro || 5.8);
      const kmPorLitro = litros > 0 && deltaKm > 0 ? Number((deltaKm / litros).toFixed(2)) : 0;
      const custoKm = deltaKm > 0 ? Number((item.valorTotal / deltaKm).toFixed(2)) : 0;

      const d1 = new Date(prev.data).getTime();
      const d2 = new Date(item.data).getTime();
      const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        kmRodados: deltaKm,
        consumoKmPorLitro: kmPorLitro,
        custoPorKm: custoKm,
        diffDays,
        kmPorDia: Number((deltaKm / diffDays).toFixed(1)),
        gastoPorDia: Number((item.valorTotal / diffDays).toFixed(2)),
      };
    });
  }, [fuelLogs]);

  // Reverse list for chronological descending view in the table
  const logsDescending = useMemo(() => [...sortedLogs].reverse(), [sortedLogs]);

  // Verifica se há odômetro registrado nos abastecimentos
  const hasOdometer = useMemo(() => {
    return sortedLogs.some((item) => (item.kmAtual || 0) > 0);
  }, [sortedLogs]);

  // 2. Aggregate Key Metrics
  const metrics = useMemo(() => {
    if (sortedLogs.length === 0) {
      return {
        totalKmRodados: 0,
        totalGasto: 0,
        totalLitros: 0,
        custoCombustivelKm: 0,
        custoRealTotalKm: 0,
        kmPorLitroMedio: 0,
        precoLitroMedio: 0,
        consumoDiarioKm: 0,
        consumoDiarioValor: 0,
        consumoSemanalKm: 0,
        consumoSemanalValor: 0,
        consumoMensalKm: 0,
        consumoMensalValor: 0,
        ultimoKm: 0,
        ultimoPrecoLitro: 0,
      };
    }

    const first = sortedLogs[0];
    const last = sortedLogs[sortedLogs.length - 1];

    const totalKmRodados = hasOdometer && last.kmAtual > first.kmAtual ? last.kmAtual - first.kmAtual : 0;
    const totalGasto = sortedLogs.reduce((sum, item) => sum + item.valorTotal, 0);
    const totalLitros = sortedLogs.reduce((sum, item) => sum + item.litros, 0);

    // Days elapsed between first and last log
    const dStart = new Date(first.data).getTime();
    const dEnd = new Date(last.data).getTime();
    const totalDays = Math.max(1, Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24)));

    // Cost per km of fuel
    const custoCombustivelKm =
      totalKmRodados > 0 ? Number((totalGasto / totalKmRodados).toFixed(2)) : 0;

    // Real Total Cost per KM = Fuel + Fixed costs share
    const custoRealTotalKm = totalKmRodados > 0 ? Number((custoCombustivelKm + custosFixosRateadosKm).toFixed(2)) : 0;

    // Average km/L
    const measuredLogs = sortedLogs.slice(1);
    const measuredLitros = measuredLogs.reduce((sum, item) => sum + item.litros, 0);
    const kmPorLitroMedio =
      measuredLitros > 0 && totalKmRodados > 0
        ? Number((totalKmRodados / measuredLitros).toFixed(2))
        : 0;

    // Average price per litre
    const precoLitroMedio =
      totalLitros > 0 ? Number((totalGasto / totalLitros).toFixed(2)) : 5.86;

    // Daily consumption
    const consumoDiarioKm = totalKmRodados > 0 ? Number((totalKmRodados / totalDays).toFixed(1)) : 0;
    const consumoDiarioValor = Number((totalGasto / totalDays).toFixed(2));

    // Weekly consumption (7 days)
    const consumoSemanalKm = Number((consumoDiarioKm * 7).toFixed(1));
    const consumoSemanalValor = Number((consumoDiarioValor * 7).toFixed(2));

    // Monthly consumption (~30.5 days)
    const consumoMensalKm = Number((consumoDiarioKm * 30.5).toFixed(0));
    const consumoMensalValor = Number((consumoDiarioValor * 30.5).toFixed(2));

    return {
      totalKmRodados,
      totalGasto,
      totalLitros,
      custoCombustivelKm,
      custoRealTotalKm,
      kmPorLitroMedio,
      precoLitroMedio,
      consumoDiarioKm,
      consumoDiarioValor,
      consumoSemanalKm,
      consumoSemanalValor,
      consumoMensalKm,
      consumoMensalValor,
      ultimoKm: last.kmAtual,
      ultimoPrecoLitro: last.precoLitro,
      ultimoPosto: last.posto,
    };
  }, [sortedLogs, custosFixosRateadosKm]);

  // 3. Chart Data Generation based on selected periodView
  const chartData = useMemo(() => {
    if (sortedLogs.length === 0) return [];

    if (periodView === 'diario') {
      return sortedLogs.map((log) => ({
        label: log.data.slice(5),
        kmDia: (log as any).kmRodados || 0,
        gastoDia: log.valorTotal,
        litros: log.litros,
        precoLitro: log.precoLitro,
        posto: log.posto,
      }));
    }

    if (periodView === 'semanal') {
      return sortedLogs.map((log) => ({
        label: log.data.slice(5),
        kmSemana: (log as any).kmRodados || 0,
        gastoSemana: log.valorTotal,
        litros: log.litros,
        precoLitro: log.precoLitro,
        posto: log.posto,
      }));
    }

    // Monthly View: Aggregate by Year-Month (e.g. '2026-01', '2026-02', '2026-03')
    const monthlyGroups: {
      [key: string]: {
        month: string;
        gasto: number;
        km: number;
        litros: number;
        count: number;
      };
    } = {};

    sortedLogs.forEach((log) => {
      const monthKey = log.data.slice(0, 7); // '2026-01'
      const [year, m] = monthKey.split('-');
      const monthNames = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];
      const label = `${monthNames[parseInt(m, 10) - 1]}/${year.slice(2)}`;

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          month: label,
          gasto: 0,
          km: 0,
          litros: 0,
          count: 0,
        };
      }
      monthlyGroups[monthKey].gasto += log.valorTotal;
      monthlyGroups[monthKey].litros += log.litros;
      monthlyGroups[monthKey].km += (log as any).kmRodados || 0;
      monthlyGroups[monthKey].count += 1;
    });

    return Object.values(monthlyGroups).map((g) => ({
      label: g.month,
      gastoMes: Number(g.gasto.toFixed(2)),
      litrosMes: Number(g.litros.toFixed(1)),
      kmMes: g.km,
      count: g.count,
    }));
  }, [sortedLogs, periodView]);

  // Handle Open Create / Edit Modal
  const handleOpenAddModal = () => {
    setEditingLog(null);
    setModalMethod('upload');
    setPreviewImage(null);
    setScanStepMessage('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormPosto('');
    setFormCombustivel('Gasolina Comum');
    setFormValorTotal('');
    setFormPrecoLitro('5.85');
    setFormLitros('');
    // Suggest the next estimated KM based on last registered KM
    const nextKm = metrics.ultimoKm > 0 ? (metrics.ultimoKm + 500).toString() : '41800';
    setFormKmAtual(nextKm);
    setFormPagoPor('Felipe');
    setFormFormaPagamento('Cartão de Crédito');
    setFormObservacoes('');
    setFormReceiptName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: FuelLog) => {
    setEditingLog(log);
    setModalMethod('manual');
    setPreviewImage(log.comprovanteUrl || null);
    setFormDate(log.data.slice(0, 10));
    setFormPosto(log.posto);
    setFormCombustivel(log.combustivel);
    setFormValorTotal(log.valorTotal.toString());
    setFormPrecoLitro(log.precoLitro.toString());
    setFormLitros(log.litros.toString());
    setFormKmAtual(log.kmAtual.toString());
    setFormPagoPor(log.pagoPor || 'Felipe');
    setFormFormaPagamento(log.formaPagamento || 'Cartão de Crédito');
    setFormObservacoes(log.observacoes || '');
    setFormReceiptName(log.comprovanteNome || '');
    setIsModalOpen(true);
  };

  // Synchronize liters when Total or Price/L changes
  const handleTotalChange = (val: string) => {
    setFormValorTotal(val);
    const numTotal = parseFloat(val.replace(',', '.')) || 0;
    const numPreco = parseFloat(formPrecoLitro.replace(',', '.')) || 0;
    if (numTotal > 0 && numPreco > 0) {
      setFormLitros((numTotal / numPreco).toFixed(2));
    }
  };

  const handlePrecoChange = (val: string) => {
    setFormPrecoLitro(val);
    const numPreco = parseFloat(val.replace(',', '.')) || 0;
    const numTotal = parseFloat(formValorTotal.replace(',', '.')) || 0;
    if (numTotal > 0 && numPreco > 0) {
      setFormLitros((numTotal / numPreco).toFixed(2));
    }
  };

  const handleLitrosChange = (val: string) => {
    setFormLitros(val);
    const numLitros = parseFloat(val.replace(',', '.')) || 0;
    const numPreco = parseFloat(formPrecoLitro.replace(',', '.')) || 0;
    if (numLitros > 0 && numPreco > 0 && !formValorTotal) {
      setFormValorTotal((numLitros * numPreco).toFixed(2));
    }
  };

  // Upload or Sample Receipt OCR Handling
  const handleScanReceipt = async (fileOrSample: File | 'shell' | 'ipiranga') => {
    setIsScanning(true);
    setScanStepMessage('Iniciando análise com Gemini Vision...');

    try {
      let body: any = {};

      if (typeof fileOrSample === 'string') {
        body = { mockSample: fileOrSample };
        setScanStepMessage(`Carregando cupom fiscal do ${fileOrSample === 'shell' ? 'Posto Shell' : 'Posto Ipiranga'}...`);
      } else {
        // Read file as base64
        setScanStepMessage('Lendo imagem do comprovante...');
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrSample);
        });
        setPreviewImage(base64);
        body = { imageBase64: base64, mimeType: fileOrSample.type };
        setFormReceiptName(fileOrSample.name);
        setScanStepMessage('Gemini extraindo posto, data, litros, preço e KM...');
      }

      const res = await fetch('/api/scan-fuel-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setFormPosto(d.posto || 'Posto de Combustível');
        setFormCombustivel(d.combustivel || 'Gasolina Comum');
        if (d.valorTotal) setFormValorTotal(Number(d.valorTotal).toFixed(2));
        if (d.precoLitro) setFormPrecoLitro(Number(d.precoLitro).toFixed(2));
        if (d.litros) setFormLitros(Number(d.litros).toFixed(2));
        if (d.data) setFormDate(d.data.slice(0, 10));
        if (d.km) setFormKmAtual(d.km.toString());
        if (d.formaPagamento) setFormFormaPagamento(d.formaPagamento);
        if (d.numeroCupom) setFormReceiptName(d.numeroCupom);
        if (d.observacoes) setFormObservacoes(d.observacoes);

        onShowToast('Comprovante lido com sucesso! Confira os dados antes de salvar.');
        setModalMethod('manual'); // Switch to form so user can review and adjust KM
      } else {
        onShowToast(json.error || 'Não foi possível ler o comprovante. Preencha manualmente.');
      }
    } catch (err: any) {
      console.error('Scan fuel error:', err);
      onShowToast('Erro ao processar comprovante. Preencha os dados manualmente.');
    } finally {
      setIsScanning(false);
      setScanStepMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScanReceipt(file);
    }
  };

  // Save Abastecimento
  const handleSaveFuelLog = (e: React.FormEvent) => {
    e.preventDefault();

    const numTotal = parseFloat(formValorTotal.replace(',', '.')) || 0;
    const numPreco = parseFloat(formPrecoLitro.replace(',', '.')) || 5.85;
    const numLitros =
      parseFloat(formLitros.replace(',', '.')) || (numTotal > 0 ? numTotal / numPreco : 0);
    const numKm = parseInt(formKmAtual.replace(/\D/g, ''), 10) || 0;

    if (numTotal <= 0) {
      alert('Por favor, informe o valor total do abastecimento.');
      return;
    }

    const newLog: FuelLog = {
      id: editingLog ? editingLog.id : `fuel-${Date.now()}`,
      data: formDate,
      posto: formPosto.trim() || 'Posto de Combustível',
      combustivel: formCombustivel,
      valorTotal: Number(numTotal.toFixed(2)),
      precoLitro: Number(numPreco.toFixed(2)),
      litros: Number(numLitros.toFixed(2)),
      kmAtual: numKm,
      pagoPor: formPagoPor,
      formaPagamento: formFormaPagamento,
      comprovanteUrl: previewImage || undefined,
      comprovanteNome: formReceiptName || undefined,
      observacoes: formObservacoes.trim() || undefined,
      origem: previewImage ? 'comprovante_ia' : 'manual',
    };

    if (editingLog) {
      onUpdateFuelLog(newLog);
      onShowToast(`Abastecimento em "${newLog.posto}" atualizado com sucesso!`);
    } else {
      onAddFuelLog(newLog);
      onShowToast(`Abastecimento de ${formatBRL(newLog.valorTotal)} registrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  // Delete Log
  const handleDeleteLog = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de abastecimento?')) {
      onDeleteFuelLog(id);
      onShowToast('Abastecimento removido.');
    }
  };

  // Delta preview in form
  const lastKnownKm = metrics.ultimoKm;
  const currentFormKm = parseInt(formKmAtual.replace(/\D/g, ''), 10) || 0;
  const computedDeltaKm =
    lastKnownKm > 0 && currentFormKm > lastKnownKm ? currentFormKm - lastKnownKm : 0;
  const currentFormLitros = parseFloat(formLitros.replace(',', '.')) || 0;
  const currentFormTotal = parseFloat(formValorTotal.replace(',', '.')) || 0;
  const computedFormKmL =
    computedDeltaKm > 0 && currentFormLitros > 0
      ? (computedDeltaKm / currentFormLitros).toFixed(2)
      : null;
  const computedFormCustoKm =
    computedDeltaKm > 0 && currentFormTotal > 0
      ? (currentFormTotal / computedDeltaKm).toFixed(2)
      : null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER SECTION                                                        */}
      {/* --------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-5 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold uppercase tracking-wider">
                Consumo Real & Odômetro
              </span>
              <span className="text-xs text-[#565e74] font-medium">• {veiculoInfo}</span>
            </div>
            <h3 className="font-display font-bold text-base text-[#0b1c30] mt-1">
              Custo Real por Quilômetro & Telemetria
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              id="btn-add-fuel-entry"
              className="px-4 py-2 rounded-2xl bg-[#006948] hover:bg-[#005a3c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Abastecimento</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo quando Odômetro não foi anotado */}
        {!hasOdometer && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white text-[#006194] shadow-2xs border border-[#dce9ff]">
                <Car className="w-4 h-4" />
              </span>
              <div>
                <div className="font-bold text-[#0b1c30] flex items-center gap-2">
                  <span>Jeep Compass Longitude Turbo</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-[10px] font-semibold border border-[#e2e8f0]">
                    Odômetro nos abastecimentos não registrado
                  </span>
                </div>
                <p className="text-[#565e74] text-[11px] mt-0.5">
                  As métricas de KM/L e Custo por KM estão desativadas para preservar a precisão dos dados. Ao registrar futuros abastecimentos informando o Odômetro (KM), o cálculo automático de consumo será ativado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* KPI CARDS ROW: Custo Real / KM, Consumo Diário, Semanal, Mensal      */}
        {/* --------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Card 1: Custo Real por KM */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] flex flex-col justify-between hover:border-[#006948]/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#565e74]">Custo Real / KM</span>
              <span className="p-1.5 rounded-xl bg-[#ecfdf5] text-[#006948]">
                <Gauge className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="my-1.5">
              <div className="font-display font-extrabold text-2xl text-[#005a3c] font-mono leading-none">
                {hasOdometer && metrics.custoRealTotalKm > 0 ? formatBRL(metrics.custoRealTotalKm) : '—'}
              </div>
              <span className="text-[10px] font-semibold text-[#565e74] block mt-1">
                {hasOdometer ? `${formatBRL(metrics.custoCombustivelKm)} comb. + ${formatBRL(custosFixosRateadosKm)} fixo` : 'Aguardando registro de Odômetro'}
              </span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-[10px]">
              <span className="text-[#006948] font-bold">
                {hasOdometer && metrics.kmPorLitroMedio > 0 ? `${metrics.kmPorLitroMedio} km/L médio` : 'Métrica pausada'}
              </span>
              <span className="text-[#565e74] font-mono">
                {hasOdometer ? `${metrics.totalKmRodados.toLocaleString('pt-BR')} km total` : '0 km anotados'}
              </span>
            </div>
          </div>

          {/* Card 2: Total Gasto */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] flex flex-col justify-between hover:border-[#006194]/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#565e74]">Total em Combustível</span>
              <span className="p-1.5 rounded-xl bg-[#eff4ff] text-[#006194]">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="my-1.5">
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] font-mono leading-none">
                {formatBRL(metrics.totalGasto)}
              </div>
              <span className="text-[10px] font-semibold text-[#006194] block mt-1 font-mono">
                {sortedLogs.length} abastecimentos registrados
              </span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-[10px] text-[#565e74]">
              <span>Média por parada</span>
              <span className="text-[#006194] font-bold font-mono">
                {formatBRL(sortedLogs.length > 0 ? metrics.totalGasto / sortedLogs.length : 0)}
              </span>
            </div>
          </div>

          {/* Card 3: Volume Total Abastecido */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] flex flex-col justify-between hover:border-[#006194]/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#565e74]">Volume Abastecido</span>
              <span className="p-1.5 rounded-xl bg-[#eff4ff] text-[#006194]">
                <Fuel className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="my-1.5">
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] font-mono leading-none">
                {metrics.totalLitros.toFixed(1)}{' '}
                <span className="text-xs font-normal text-[#565e74]">Litros</span>
              </div>
              <span className="text-[10px] font-semibold text-[#006194] block mt-1 font-mono">
                Média de {(sortedLogs.length > 0 ? metrics.totalLitros / sortedLogs.length : 0).toFixed(1)} L / abastecimento
              </span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-[10px] text-[#565e74]">
              <span>Jeep Compass</span>
              <span className="text-[#006948] font-bold">Turbo Flex</span>
            </div>
          </div>

          {/* Card 4: Preço Médio do Litro */}
          <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] flex flex-col justify-between hover:border-[#006948]/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#565e74]">Preço Médio / Litro</span>
              <span className="p-1.5 rounded-xl bg-[#ecfdf5] text-[#006948]">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="my-1.5">
              <div className="font-display font-extrabold text-2xl text-[#0b1c30] font-mono leading-none">
                {formatBRL(metrics.precoLitroMedio)}
              </div>
              <span className="text-[10px] font-semibold text-[#006948] block mt-1 font-mono">
                Postos de Teresina - PI
              </span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-[10px] text-[#565e74]">
              <span>Teto Mensal: R$ 800,00</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#dcfce7] text-[#006948] font-bold text-[9px]">
                Monitorado
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* SUB-TABS: Gráfico de Consumo vs Histórico dos Abastecimentos          */}
        {/* --------------------------------------------------------------------- */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-[#dce9ff]">
            <button
              type="button"
              onClick={() => setActiveTab('analise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analise'
                  ? 'bg-white text-[#006948] shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Gráfico & Evolução
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-white text-[#006948] shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Histórico de Abastecimentos ({sortedLogs.length})
            </button>
          </div>

          {activeTab === 'analise' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-[#565e74] font-medium mr-1">Agrupar por:</span>
              {(['diario', 'semanal', 'mensal'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPeriodView(mode)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition-all cursor-pointer ${
                    periodView === mode
                      ? 'bg-[#006948] text-white shadow-2xs'
                      : 'bg-[#f1f5f9] text-[#565e74] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {mode === 'diario' ? 'Diário' : mode === 'semanal' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 1: RECHARTS CONSUMPTION & COST CHART                             */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'analise' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-[#565e74] mb-2 px-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006948]" />
                  <span>Valor Gasto em Combustível (R$)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006194]" />
                  <span>
                    {hasOdometer
                      ? periodView === 'diario'
                        ? 'KM/dia rodados'
                        : periodView === 'semanal'
                        ? 'KM/semana rodados'
                        : 'KM no mês'
                      : periodView === 'mensal'
                      ? 'Litros no mês'
                      : 'Litros abastecidos'}
                  </span>
                </span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#0b1c30]">
                Último abastecimento: {metrics.ultimoPosto || 'Posto Cacique'} • {formatBRL(metrics.ultimoPrecoLitro)}/L
              </span>
            </div>

            <div className="w-full h-56 bg-[#fbfdff] rounded-2xl p-2 border border-[#eef4ff]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (hasOdometer ? `${val}km` : `${val}L`)}
                  />
                  <Tooltip
                    formatter={(val: any, name: string) => {
                      if (name === 'gastoMes' || name === 'gastoSemana' || name === 'gastoDia') {
                        return [formatBRL(Number(val)), 'Valor Gasto'];
                      }
                      if (name === 'kmMes' || name === 'kmSemana' || name === 'kmDia') {
                        return [`${val} km`, 'Quilômetros Rodados'];
                      }
                      if (name === 'litrosMes' || name === 'litros') {
                        return [`${Number(val).toFixed(1)} L`, 'Volume Abastecido'];
                      }
                      if (name === 'precoLitro') {
                        return [formatBRL(Number(val)), 'Preço do Litro'];
                      }
                      return [val, name];
                    }}
                    contentStyle={{
                      backgroundColor: '#0b1c30',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey={
                      periodView === 'diario'
                        ? 'gastoDia'
                        : periodView === 'semanal'
                        ? 'gastoSemana'
                        : 'gastoMes'
                    }
                    fill="#006948"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={
                      hasOdometer
                        ? periodView === 'diario'
                          ? 'kmDia'
                          : periodView === 'semanal'
                          ? 'kmSemana'
                          : 'kmMes'
                        : periodView === 'mensal'
                        ? 'litrosMes'
                        : 'litros'
                    }
                    stroke="#006194"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#006194', strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* VIEW 2: HISTÓRICO COMPLETO DOS ABASTECIMENTOS COM COMPROVANTES       */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'historico' && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-[#565e74]">
                  <th className="pb-2.5 font-semibold">Data / Posto</th>
                  <th className="pb-2.5 font-semibold text-right">Odômetro</th>
                  <th className="pb-2.5 font-semibold text-right">Delta KM</th>
                  <th className="pb-2.5 font-semibold text-right">Litros (R$/L)</th>
                  <th className="pb-2.5 font-semibold text-right">Consumo</th>
                  <th className="pb-2.5 font-semibold text-right">Custo / KM</th>
                  <th className="pb-2.5 font-semibold text-right">Total Pago</th>
                  <th className="pb-2.5 font-semibold text-center">Comprovante</th>
                  <th className="pb-2.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8faff]">
                {logsDescending.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8faff] transition-colors group">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-[#0b1c30] truncate max-w-[180px]">
                        {log.posto}
                      </div>
                      <div className="text-[10px] text-[#565e74] flex items-center gap-1.5">
                        <span>{new Date(log.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span className="text-[#006948] font-semibold">{log.combustivel}</span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-semibold text-[#0b1c30]">
                      {log.kmAtual && log.kmAtual > 0 ? (
                        `${log.kmAtual.toLocaleString('pt-BR')} km`
                      ) : (
                        <span className="text-[#94a3b8] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-[#006194] font-bold">
                      {log.kmRodados && log.kmRodados > 0 ? (
                        `+${log.kmRodados} km`
                      ) : (
                        <span className="text-[#94a3b8] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-[#0b1c30]">
                      <div>{log.litros.toFixed(2)} L</div>
                      <span className="text-[10px] text-[#565e74]">
                        {formatBRL(log.precoLitro)}/L
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-bold text-[#006948]">
                      {log.consumoKmPorLitro && log.consumoKmPorLitro > 0 ? (
                        `${log.consumoKmPorLitro} km/L`
                      ) : (
                        <span className="text-[#94a3b8] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-bold text-[#005a3c]">
                      {log.custoPorKm && log.custoPorKm > 0 ? (
                        `${formatBRL(log.custoPorKm)}/km`
                      ) : (
                        <span className="text-[#94a3b8] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-extrabold text-[#0b1c30]">
                      {formatBRL(log.valorTotal)}
                    </td>

                    <td className="py-3 px-2 text-center">
                      {log.comprovanteUrl || log.comprovanteNome ? (
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(log)}
                          className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Visualizar Comprovante do Posto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Cupom</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#94a3b8]">Manual</span>
                      )}
                    </td>

                    <td className="py-3 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(log)}
                          className="p-1 rounded-lg text-[#565e74] hover:text-[#006194] hover:bg-[#eff4ff] cursor-pointer"
                          title="Editar abastecimento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 rounded-lg text-[#565e74] hover:text-[#dc2626] hover:bg-[#fee2e2] cursor-pointer"
                          title="Excluir abastecimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* FOOTER SUMMARY STRIP                                                  */}
      {/* --------------------------------------------------------------------- */}
      <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#565e74] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006948]" />
          <span>
            Telemetria validada: Odômetro atual em{' '}
            <strong className="text-[#0b1c30] font-mono">
              {metrics.ultimoKm.toLocaleString('pt-BR')} km
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#005a3c]">
            Custo real apurado: {formatBRL(metrics.custoRealTotalKm)}/km rodado
          </span>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="text-[#006948] font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>+ Anexar Comprovante</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ABASTECIMENTO (MANUAL OU COMPROVANTE IA)                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#006948] text-white flex items-center justify-center shadow-xs">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    {editingLog ? 'Editar Abastecimento' : 'Registrar Abastecimento'}
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    Alimente o odômetro e comprovante para o cálculo real de consumo
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Input Method Tabs */}
            {!editingLog && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#eff4ff] rounded-2xl my-4 border border-[#dce9ff]">
                <button
                  type="button"
                  onClick={() => setModalMethod('upload')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalMethod === 'upload'
                      ? 'bg-white text-[#006948] shadow-xs'
                      : 'text-[#565e74] hover:text-[#0b1c30]'
                  }`}
                >
                  <Camera className="w-4 h-4 text-[#006948]" />
                  <span>Anexar Comprovante (IA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMethod('manual')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalMethod === 'manual'
                      ? 'bg-white text-[#006948] shadow-xs'
                      : 'text-[#565e74] hover:text-[#0b1c30]'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#006194]" />
                  <span>Preenchimento Manual</span>
                </button>
              </div>
            )}

            {/* AI Receipt Scanning Area */}
            {modalMethod === 'upload' && !editingLog && (
              <div className="mb-4">
                <div className="border-2 border-dashed border-[#cbd5e1] hover:border-[#006948] rounded-2xl p-5 text-center transition-colors bg-[#f8faff]">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {isScanning ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-[#006948] animate-spin" />
                      <div className="text-xs font-bold text-[#0b1c30]">
                        {scanStepMessage || 'Processando comprovante fiscal com Gemini Vision...'}
                      </div>
                      <span className="text-[11px] text-[#565e74]">
                        Extraindo valor total, data, preço do litro e posto...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[#0b1c30] block mb-1">
                        Arraste ou clique para anexar o cupom fiscal do posto
                      </span>
                      <span className="text-[11px] text-[#565e74] block mb-3 max-w-sm">
                        NFC-e, SAT, cupom fiscal ou filipeta de cartão do posto (Shell Box, Premmia, Ipiranga, etc.)
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-[#006948] text-white text-xs font-bold hover:bg-[#005a3c] shadow-xs cursor-pointer transition-transform active:scale-95"
                      >
                        Selecionar Arquivo / Foto
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Test Demo Samples */}
                <div className="mt-3 bg-[#f8faff] rounded-2xl p-3 border border-[#e5eeff] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#565e74]">
                    <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
                    <span className="font-semibold">Testar com exemplos de cupom:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => handleScanReceipt('shell')}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#dce9ff] text-[#006948] text-xs font-bold hover:bg-[#ecfdf5] cursor-pointer disabled:opacity-50"
                    >
                      ⛽ Posto Shell (V-Power)
                    </button>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => handleScanReceipt('ipiranga')}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#dce9ff] text-[#006194] text-xs font-bold hover:bg-[#eff4ff] cursor-pointer disabled:opacity-50"
                    >
                      ⛽ Posto Ipiranga (Comum)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSaveFuelLog} className="flex flex-col gap-3.5">
              {/* Odômetro KM Field (Opcional) */}
              <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#dce9ff]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#006194] flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    <span>Quilometragem no Painel (KM Odômetro) <span className="text-[10px] font-normal text-[#565e74]">(Opcional)</span></span>
                  </label>
                  {lastKnownKm > 0 && (
                    <span className="text-[11px] text-[#565e74] font-mono">
                      Último KM: {lastKnownKm.toLocaleString('pt-BR')} km
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={formKmAtual}
                  onChange={(e) => setFormKmAtual(e.target.value)}
                  placeholder="Ex: 85000 (Opcional - deixe vazio se não anotou)"
                  className="w-full px-3 py-2 bg-white border border-[#dce9ff] rounded-xl text-sm font-mono font-bold text-[#0b1c30] focus:outline-none focus:border-[#006194]"
                />
                {computedDeltaKm > 0 && (
                  <div className="mt-2 flex items-center justify-between text-xs text-[#006948] font-bold font-mono">
                    <span>+{computedDeltaKm} km rodados neste ciclo</span>
                    {computedFormKmL && <span>Eficiência: {computedFormKmL} km/L</span>}
                    {computedFormCustoKm && <span>Custo: {formatBRL(Number(computedFormCustoKm))}/km</span>}
                  </div>
                )}
              </div>

              {/* Data & Posto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Data do Abastecimento
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Posto / Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={formPosto}
                    onChange={(e) => setFormPosto(e.target.value)}
                    placeholder="Ex: Posto Shell Barra"
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>
              </div>

              {/* Valor Total, Preço por Litro, Litros */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Total Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValorTotal}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    placeholder="Ex: 260.00"
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-mono font-bold text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Preço do Litro (R$/L) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formPrecoLitro}
                    onChange={(e) => handlePrecoChange(e.target.value)}
                    placeholder="Ex: 5.85"
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-mono text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Volume (Litros)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formLitros}
                    onChange={(e) => handleLitrosChange(e.target.value)}
                    placeholder="Ex: 44.44"
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-mono text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>
              </div>

              {/* Tipo de Combustível & Quem Pagou */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Combustível
                  </label>
                  <select
                    value={formCombustivel}
                    onChange={(e) => setFormCombustivel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="Gasolina Comum">Gasolina Comum</option>
                    <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Quem Abasteceu
                  </label>
                  <select
                    value={formPagoPor}
                    onChange={(e) => setFormPagoPor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="Felipe">Felipe</option>
                    <option value="Genivânia">Genivânia</option>
                    <option value="Casal">Casal (Conta Conjunta)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Pagamento
                  </label>
                  <select
                    value={formFormaPagamento}
                    onChange={(e) => setFormFormaPagamento(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="PIX NuBank">PIX NuBank</option>
                    <option value="Débito">Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              {/* Observações / Anotações */}
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Observações / Cupom Fiscal
                </label>
                <input
                  type="text"
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Ex: Viagem final de semana serra • NFC-e #284102"
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9] mt-2">
                {editingLog ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteLog(editingLog.id);
                      setIsModalOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-[#dc2626] hover:bg-[#fee2e2] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                  >
                    {editingLog ? 'Salvar Alterações' : 'Confirmar Abastecimento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR COMPROVANTE DO POSTO                                    */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                    Comprovante do Posto
                  </h3>
                  <span className="text-[11px] text-[#565e74]">
                    {viewingReceipt.posto}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingReceipt.comprovanteUrl ? (
              <div className="rounded-2xl overflow-hidden border border-[#cbd5e1] mb-4 max-h-80 flex items-center justify-center bg-gray-50">
                <img
                  src={viewingReceipt.comprovanteUrl}
                  alt="Comprovante de abastecimento"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : null}

            {/* Receipt Summary Card */}
            <div className="bg-[#f8faff] rounded-2xl p-4 border border-[#e5eeff] text-xs flex flex-col gap-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Estabelecimento:</span>
                <span className="font-bold text-[#0b1c30]">{viewingReceipt.posto}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Data:</span>
                <span className="font-bold text-[#0b1c30]">{viewingReceipt.data}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Combustível:</span>
                <span className="font-bold text-[#006948]">{viewingReceipt.combustivel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Preço por Litro:</span>
                <span className="font-bold text-[#0b1c30]">{formatBRL(viewingReceipt.precoLitro)}/L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Litros:</span>
                <span className="font-bold text-[#0b1c30]">{viewingReceipt.litros.toFixed(2)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#565e74]">Odômetro (KM):</span>
                <span className="font-bold text-[#006194]">{viewingReceipt.kmAtual.toLocaleString('pt-BR')} km</span>
              </div>
              {viewingReceipt.kmRodados && viewingReceipt.kmRodados > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[#565e74]">KM Rodados no Ciclo:</span>
                  <span className="font-bold text-[#006194]">+{viewingReceipt.kmRodados} km</span>
                </div>
              )}
              {viewingReceipt.consumoKmPorLitro && viewingReceipt.consumoKmPorLitro > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[#565e74]">Eficiência Real:</span>
                  <span className="font-bold text-[#006948]">{viewingReceipt.consumoKmPorLitro} km/L</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-sm">
                <span className="font-bold text-[#0b1c30]">Valor Total:</span>
                <span className="font-extrabold text-[#005a3c]">{formatBRL(viewingReceipt.valorTotal)}</span>
              </div>
              {viewingReceipt.comprovanteNome && (
                <span className="text-[10px] text-[#565e74] mt-1">
                  Documento: {viewingReceipt.comprovanteNome}
                </span>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl bg-[#006948] text-white text-xs font-bold hover:bg-[#005a3c] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
