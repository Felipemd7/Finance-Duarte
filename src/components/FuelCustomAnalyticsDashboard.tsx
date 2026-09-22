import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Gauge,
  TrendingUp,
  DollarSign,
  Filter,
  CheckSquare,
  Square,
  Award,
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Sparkles,
  Calendar,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { FuelLog } from '../types';
import { formatBRL } from '../utils/formatters';

interface FuelCustomAnalyticsDashboardProps {
  fuelLogs: FuelLog[];
}

export const FuelCustomAnalyticsDashboard: React.FC<FuelCustomAnalyticsDashboardProps> = ({
  fuelLogs,
}) => {
  // Ordena cronologicamente e calcula deltas
  const sortedBaseLogs = useMemo(() => {
    const list = [...fuelLogs].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const firstLogWithKmIndex = list.findIndex((item) => (item.kmAtual || 0) > 0);

    return list.map((item, index) => {
      const currentKm = item.kmAtual || 0;

      if (currentKm === 0 || index === firstLogWithKmIndex) {
        return {
          ...item,
          isMarcoZero: index === firstLogWithKmIndex && currentKm > 0,
          kmRodados: 0,
          consumoKmPorLitro: 0,
          custoPorKm: 0,
        };
      }

      let prevWithKm: FuelLog | null = null;
      let accumulatedLiters = item.litros > 0 ? item.litros : item.valorTotal / (item.precoLitro || 5.8);

      for (let i = index - 1; i >= 0; i--) {
        if ((list[i].kmAtual || 0) > 0) {
          prevWithKm = list[i];
          break;
        } else {
          accumulatedLiters += list[i].litros || (list[i].valorTotal / (list[i].precoLitro || 5.8));
        }
      }

      if (!prevWithKm || currentKm <= prevWithKm.kmAtual) {
        return {
          ...item,
          isMarcoZero: false,
          kmRodados: 0,
          consumoKmPorLitro: 0,
          custoPorKm: 0,
        };
      }

      const deltaKm = currentKm - prevWithKm.kmAtual;
      const kmPorLitro = accumulatedLiters > 0 && deltaKm > 0
        ? Number((deltaKm / accumulatedLiters).toFixed(2))
        : 0;
      const custoKm = deltaKm > 0 ? Number((item.valorTotal / deltaKm).toFixed(2)) : 0;

      return {
        ...item,
        isMarcoZero: false,
        kmRodados: deltaKm,
        consumoKmPorLitro: kmPorLitro,
        custoPorKm: custoKm,
      };
    });
  }, [fuelLogs]);

  // Lista única de postos encontrados
  const allPostos = useMemo(() => {
    const set = new Set<string>();
    fuelLogs.forEach((l) => {
      if (l.posto && l.posto.trim()) {
        set.add(l.posto.trim());
      }
    });
    return Array.from(set).sort();
  }, [fuelLogs]);

  // Estados de Filtro Interativo
  // 'all' ou array de postos selecionados
  const [selectedPostos, setSelectedPostos] = useState<string[]>([]);
  // Seleção individual de abastecimentos por ID
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>(() =>
    sortedBaseLogs.map((l) => l.id)
  );
  // Modo de seleção: 'postos' ou 'abastecimentos'
  const [selectionMode, setSelectionMode] = useState<'postos' | 'abastecimentos'>('postos');
  // Métrica do gráfico de postos: 'consumo' (KM/L) ou 'preco' (R$/L) ou 'gasto' (R$)
  const [chartMetric, setChartMetric] = useState<'consumo' | 'preco' | 'gasto'>('consumo');
  // Filtro rápido de data
  const [timeFilter, setTimeFilter] = useState<'tudo' | '30dias' | '90dias' | 'ano2026'>('tudo');

  // Aplicar filtro de período rápido
  const periodFilteredLogs = useMemo(() => {
    if (timeFilter === 'tudo') return sortedBaseLogs;

    const now = new Date();
    return sortedBaseLogs.filter((log) => {
      const logDate = new Date(log.data + 'T12:00:00');
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);

      if (timeFilter === '30dias') return diffDays <= 30;
      if (timeFilter === '90dias') return diffDays <= 90;
      if (timeFilter === 'ano2026') return log.data.startsWith('2026');
      return true;
    });
  }, [sortedBaseLogs, timeFilter]);

  // Logs ativos após filtros de posto e seleção
  const activeSelectedLogs = useMemo(() => {
    return periodFilteredLogs.filter((log) => {
      // Se estiver no modo postos com filtros específicos
      if (selectionMode === 'postos' && selectedPostos.length > 0) {
        return selectedPostos.includes(log.posto.trim());
      }
      // Se estiver no modo abastecimentos manuais
      if (selectionMode === 'abastecimentos') {
        return selectedLogIds.includes(log.id);
      }
      return true;
    });
  }, [periodFilteredLogs, selectionMode, selectedPostos, selectedLogIds]);

  // Alternar posto selecionado
  const togglePosto = (posto: string) => {
    setSelectedPostos((prev) =>
      prev.includes(posto) ? prev.filter((p) => p !== posto) : [...prev, posto]
    );
  };

  const handleSelectAllPostos = () => {
    setSelectedPostos([]);
  };

  // Alternar abastecimento individual
  const toggleLogSelection = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllLogs = () => {
    setSelectedLogIds(periodFilteredLogs.map((l) => l.id));
  };

  const handleDeselectAllLogs = () => {
    setSelectedLogIds([]);
  };

  // KPIs Dinâmicos da Seleção Ativa
  const selectionMetrics = useMemo(() => {
    const count = activeSelectedLogs.length;
    const totalGasto = activeSelectedLogs.reduce((acc, l) => acc + l.valorTotal, 0);
    const totalLitros = activeSelectedLogs.reduce((acc, l) => acc + l.litros, 0);
    const precoMedioLitro = totalLitros > 0 ? totalGasto / totalLitros : 0;

    // KM rodados medidos nesta seleção
    const logsComCiclo = activeSelectedLogs.filter((l: any) => (l.kmRodados || 0) > 0);
    const totalKmRodados = logsComCiclo.reduce((acc, l) => acc + (l.kmRodados || 0), 0);
    const litrosCiclos = logsComCiclo.reduce((acc, l) => acc + l.litros, 0);
    const gastoCiclos = logsComCiclo.reduce((acc, l) => acc + l.valorTotal, 0);

    const mediaKmLitro = totalKmRodados > 0 && litrosCiclos > 0 ? totalKmRodados / litrosCiclos : 0;
    const custoPorKm = totalKmRodados > 0 && gastoCiclos > 0 ? gastoCiclos / totalKmRodados : 0;

    return {
      count,
      totalGasto,
      totalLitros,
      precoMedioLitro,
      totalKmRodados,
      mediaKmLitro,
      custoPorKm,
    };
  }, [activeSelectedLogs]);

  // Agrupamento e Comparativo por Posto
  const stationStats = useMemo(() => {
    const map: Record<
      string,
      {
        posto: string;
        abastecimentos: number;
        totalGasto: number;
        totalLitros: number;
        totalKmRodados: number;
        litrosComKm: number;
        gastoComKm: number;
      }
    > = {};

    periodFilteredLogs.forEach((log) => {
      const p = log.posto?.trim() || 'Outro Posto';
      if (!map[p]) {
        map[p] = {
          posto: p,
          abastecimentos: 0,
          totalGasto: 0,
          totalLitros: 0,
          totalKmRodados: 0,
          litrosComKm: 0,
          gastoComKm: 0,
        };
      }
      map[p].abastecimentos += 1;
      map[p].totalGasto += log.valorTotal;
      map[p].totalLitros += log.litros;

      if ((log as any).kmRodados && (log as any).kmRodados > 0) {
        map[p].totalKmRodados += (log as any).kmRodados;
        map[p].litrosComKm += log.litros;
        map[p].gastoComKm += log.valorTotal;
      }
    });

    const list = Object.values(map).map((s) => {
      const precoMedio = s.totalLitros > 0 ? s.totalGasto / s.totalLitros : 0;
      const kmPorLitro = s.totalKmRodados > 0 && s.litrosComKm > 0 ? s.totalKmRodados / s.litrosComKm : 0;
      const custoKm = s.totalKmRodados > 0 && s.gastoComKm > 0 ? s.gastoComKm / s.totalKmRodados : 0;

      return {
        ...s,
        precoMedio: Number(precoMedio.toFixed(2)),
        kmPorLitro: Number(kmPorLitro.toFixed(2)),
        custoKm: Number(custoKm.toFixed(2)),
      };
    });

    // Ordenar por total gasto decrescente
    return list.sort((a, b) => b.totalGasto - a.totalGasto);
  }, [periodFilteredLogs]);

  // Destaques de Rendimento dos Postos
  const bestAndWorstStations = useMemo(() => {
    const measuredStations = stationStats.filter((s) => s.kmPorLitro > 0);

    let bestEconomy = measuredStations.length > 0
      ? [...measuredStations].sort((a, b) => b.kmPorLitro - a.kmPorLitro)[0]
      : null;

    let worstConsumption = measuredStations.length > 1
      ? [...measuredStations].sort((a, b) => a.kmPorLitro - b.kmPorLitro)[0]
      : null;

    // Posto com menor preço médio
    const cheapestPrice = stationStats.length > 0
      ? [...stationStats].sort((a, b) => a.precoMedio - b.precoMedio)[0]
      : null;

    return { bestEconomy, worstConsumption, cheapestPrice };
  }, [stationStats]);

  return (
    <div className="mt-6 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col gap-6 animate-in fade-in">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER DO PAINEL PERSONALIZADO                                        */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#006194]" />
              Dashboard Interativo & Comparador
            </span>
            <span className="text-xs text-[#565e74] font-medium">• Análise Flexível de Combustível</span>
          </div>
          <h3 className="font-display font-bold text-base text-[#0b1c30] mt-1">
            Comparativo de Eficiência por Posto & Seleção Personalizada
          </h3>
          <p className="text-xs text-[#565e74] mt-0.5">
            Selecione postos ou abastecimentos específicos para comparar onde sua gasolina rende mais e quanto você gastou.
          </p>
        </div>

        {/* Filtro Rápido de Período */}
        <div className="flex items-center gap-1 bg-[#f8faff] p-1 rounded-2xl border border-[#dce9ff]">
          {[
            { id: 'tudo', label: 'Tudo' },
            { id: '30dias', label: 'Últimos 30d' },
            { id: '90dias', label: 'Últimos 90d' },
            { id: 'ano2026', label: 'Ano 2026' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as any)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeFilter === item.id
                  ? 'bg-[#006948] text-white shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* CONTROLE DE SELEÇÃO: POSTOS VS ABASTECIMENTOS                          */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[#f8faff] p-4 rounded-2xl border border-[#dce9ff] flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#006194]" />
              Modo de Seleção:
            </span>
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-[#dce9ff] text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectionMode('postos')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectionMode === 'postos'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'text-[#565e74] hover:text-[#0b1c30]'
                }`}
              >
                Filtrar por Postos ({allPostos.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('abastecimentos')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectionMode === 'abastecimentos'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'text-[#565e74] hover:text-[#0b1c30]'
                }`}
              >
                Escolher Abastecimentos ({periodFilteredLogs.length})
              </button>
            </div>
          </div>

          {selectionMode === 'postos' ? (
            <button
              type="button"
              onClick={handleSelectAllPostos}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedPostos.length === 0
                  ? 'text-[#006948] bg-emerald-50 border border-emerald-200'
                  : 'text-[#565e74] hover:text-[#006948]'
              }`}
            >
              {selectedPostos.length === 0 ? '✓ Todos os Postos Ativos' : 'Limpar Filtro de Postos'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllLogs}
                className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
              >
                Marcar Todos
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAllLogs}
                className="text-xs font-bold text-[#dc2626] hover:underline cursor-pointer"
              >
                Desmarcar Todos
              </button>
            </div>
          )}
        </div>

        {/* 1. Chips de Postos */}
        {selectionMode === 'postos' && (
          <div className="flex items-center flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSelectAllPostos}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPostos.length === 0
                  ? 'bg-[#006194] text-white shadow-xs'
                  : 'bg-white text-[#565e74] border border-[#dce9ff] hover:border-[#006194]'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Todos os Postos</span>
              <span className="text-[10px] opacity-80 font-mono">({periodFilteredLogs.length})</span>
            </button>

            {allPostos.map((posto) => {
              const isSelected = selectedPostos.includes(posto);
              const count = periodFilteredLogs.filter((l) => l.posto.trim() === posto).length;
              return (
                <button
                  key={posto}
                  type="button"
                  onClick={() => togglePosto(posto)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#006948] text-white shadow-xs'
                      : 'bg-white text-[#565e74] border border-[#dce9ff] hover:border-[#006948]'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Fuel className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{posto}</span>
                  <span className="text-[10px] opacity-75 font-mono font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Checklist Manual de Abastecimentos */}
        {selectionMode === 'abastecimentos' && (
          <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5 pt-1">
            {periodFilteredLogs.map((log) => {
              const isChecked = selectedLogIds.includes(log.id);
              return (
                <div
                  key={log.id}
                  onClick={() => toggleLogSelection(log.id)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                    isChecked
                      ? 'bg-white border-[#006948]/40 shadow-2xs'
                      : 'bg-white/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#006948]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <span className="font-bold text-[#0b1c30] mr-2">{log.posto}</span>
                      <span className="text-[11px] text-[#565e74]">
                        {new Date(log.data + 'T12:00:00').toLocaleDateString('pt-BR')} • {log.combustivel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-600 font-semibold">{log.litros.toFixed(1)} L</span>
                    <span className="text-[#006948] font-bold">{formatBRL(log.valorTotal)}</span>
                    {(log as any).kmRodados > 0 && (
                      <span className="text-[#006194] text-[11px] font-bold">
                        {(log as any).consumoKmPorLitro} km/L
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* KPIS DINÂMICOS DO RECORTE SELECIONADO                                  */}
      {/* --------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#0b1c30]">
            Resumo do Recorte Selecionado ({selectionMetrics.count} de {periodFilteredLogs.length} abastecimentos)
          </span>
          <span className="text-[11px] text-[#006948] font-semibold">
            {selectedPostos.length > 0
              ? `Filtrado por: ${selectedPostos.join(', ')}`
              : 'Todos os postos considerados'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* KPI 1: Total Gasto */}
          <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] hover:border-[#006948]/30 transition-colors">
            <span className="text-[11px] font-bold text-[#565e74] block">Total Gasto</span>
            <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
              {formatBRL(selectionMetrics.totalGasto)}
            </div>
            <span className="text-[10px] text-[#565e74] mt-0.5 block font-mono">
              {selectionMetrics.count} abastecimentos
            </span>
          </div>

          {/* KPI 2: Volume Total */}
          <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] hover:border-[#006194]/30 transition-colors">
            <span className="text-[11px] font-bold text-[#565e74] block">Volume em Litros</span>
            <div className="font-display font-extrabold text-xl text-[#006194] font-mono mt-1">
              {selectionMetrics.totalLitros.toFixed(1)} <span className="text-xs font-normal">L</span>
            </div>
            <span className="text-[10px] text-[#565e74] mt-0.5 block font-mono">
              Gasolina consumida
            </span>
          </div>

          {/* KPI 3: Preço Médio / L */}
          <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] hover:border-[#006948]/30 transition-colors">
            <span className="text-[11px] font-bold text-[#565e74] block">Preço Médio / Litro</span>
            <div className="font-display font-extrabold text-xl text-[#006948] font-mono mt-1">
              {formatBRL(selectionMetrics.precoMedioLitro)}
            </div>
            <span className="text-[10px] text-[#565e74] mt-0.5 block font-mono">
              Média ponderada do recorte
            </span>
          </div>

          {/* KPI 4: Média de Rendimento (KM/L) */}
          <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] hover:border-[#006948]/30 transition-colors">
            <span className="text-[11px] font-bold text-[#565e74] block">Rendimento Médio</span>
            <div className="font-display font-extrabold text-xl text-[#005a3c] font-mono mt-1">
              {selectionMetrics.mediaKmLitro > 0
                ? `${selectionMetrics.mediaKmLitro.toFixed(2)} km/L`
                : '—'}
            </div>
            <span className="text-[10px] text-[#565e74] mt-0.5 block font-mono">
              {selectionMetrics.totalKmRodados > 0
                ? `${selectionMetrics.totalKmRodados.toLocaleString('pt-BR')} km apurados`
                : 'Aguardando 2º abastecimento'}
            </span>
          </div>

          {/* KPI 5: Custo Real por KM */}
          <div className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] hover:border-[#006948]/30 transition-colors">
            <span className="text-[11px] font-bold text-[#565e74] block">Custo / KM (Gasolina)</span>
            <div className="font-display font-extrabold text-xl text-[#006948] font-mono mt-1">
              {selectionMetrics.custoPorKm > 0 ? `${formatBRL(selectionMetrics.custoPorKm)}/km` : '—'}
            </div>
            <span className="text-[10px] text-[#565e74] mt-0.5 block font-mono">
              Exclusivo de combustível
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* COMPARADOR DE POSTOS: QUAL CONSOME MAIS GASOLINA?                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="pt-4 border-t border-[#f1f5f9] flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#006948]" />
              <h4 className="font-display font-bold text-sm text-[#0b1c30]">
                Comparativo Entre Postos: Onde a Gasolina Rende Mais?
              </h4>
            </div>
            <p className="text-xs text-[#565e74] mt-0.5">
              Análise comparativa de eficiência (km/l), consumo e preço por litro praticado por cada posto.
            </p>
          </div>

          {/* Alternar Métrica do Gráfico */}
          <div className="flex items-center gap-1 bg-[#f8faff] p-1 rounded-xl border border-[#dce9ff] text-xs">
            <span className="text-[10px] text-[#565e74] font-semibold px-2">Visualizar no Gráfico:</span>
            <button
              type="button"
              onClick={() => setChartMetric('consumo')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartMetric === 'consumo'
                  ? 'bg-[#006948] text-white shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Rendimento (KM/L)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('preco')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartMetric === 'preco'
                  ? 'bg-[#006948] text-white shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Preço Médio (R$/L)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('gasto')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartMetric === 'gasto'
                  ? 'bg-[#006948] text-white shadow-2xs'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              Total Gasto (R$)
            </button>
          </div>
        </div>

        {/* Destaques Inteligentes de Economia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Melhor Rendimento */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-3">
            <span className="p-2 rounded-xl bg-emerald-100 text-[#006948]">
              <Award className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
                Melhor Autonomia (Rende Mais)
              </span>
              <div className="font-bold text-xs text-[#0b1c30] mt-0.5">
                {bestAndWorstStations.bestEconomy
                  ? `${bestAndWorstStations.bestEconomy.posto} • ${bestAndWorstStations.bestEconomy.kmPorLitro} km/L`
                  : 'Aguardando mais paradas medidas'}
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                {bestAndWorstStations.bestEconomy
                  ? `Combustível com menor consumo e maior quilometragem por litro.`
                  : 'O odômetro de 124.524 km iniciou a medição.'}
              </p>
            </div>
          </div>

          {/* Card 2: Maior Consumo */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                Maior Consumo (Rende Menos)
              </span>
              <div className="font-bold text-xs text-[#0b1c30] mt-0.5">
                {bestAndWorstStations.worstConsumption
                  ? `${bestAndWorstStations.worstConsumption.posto} • ${bestAndWorstStations.worstConsumption.kmPorLitro} km/L`
                  : 'Necessário comparar 2+ postos com KM'}
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {bestAndWorstStations.worstConsumption
                  ? `Posto onde o veículo consumiu mais gasolina para a mesma distância.`
                  : 'Será apontado quando houver abastecimento em outro posto.'}
              </p>
            </div>
          </div>

          {/* Card 3: Menor Preço por Litro */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex items-start gap-3">
            <span className="p-2 rounded-xl bg-blue-100 text-[#006194]">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006194] block">
                Menor Preço Praticado
              </span>
              <div className="font-bold text-xs text-[#0b1c30] mt-0.5">
                {bestAndWorstStations.cheapestPrice
                  ? `${bestAndWorstStations.cheapestPrice.posto} • ${formatBRL(bestAndWorstStations.cheapestPrice.precoMedio)}/L`
                  : '—'}
              </div>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Melhor valor de bomba registrado entre os postos frequentados.
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Comparativo */}
        <div className="bg-[#f8faff] p-4 rounded-2xl border border-[#dce9ff]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#006948]" />
              {chartMetric === 'consumo'
                ? 'Rendimento Médio por Posto (km/L)'
                : chartMetric === 'preco'
                ? 'Preço Médio por Litro por Posto (R$/L)'
                : 'Total Gasto em Cada Posto (R$)'}
            </span>
            <span className="text-[11px] text-[#565e74] font-mono">
              {stationStats.length} postos analisados
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stationStats.map((s) => ({
                  posto: s.posto,
                  valor:
                    chartMetric === 'consumo'
                      ? s.kmPorLitro
                      : chartMetric === 'preco'
                      ? s.precoMedio
                      : s.totalGasto,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="posto"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 10, fill: '#565e74' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 10, fill: '#565e74' }}
                />
                <Tooltip
                  formatter={(val: any) => {
                    if (chartMetric === 'consumo') return [`${val} km/L`, 'Rendimento'];
                    if (chartMetric === 'preco') return [formatBRL(Number(val)), 'Preço Médio/L'];
                    return [formatBRL(Number(val)), 'Total Gasto'];
                  }}
                  contentStyle={{
                    backgroundColor: '#0b1c30',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={36}>
                  {stationStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        chartMetric === 'consumo'
                          ? entry.kmPorLitro > 0
                            ? '#006948'
                            : '#94a3b8'
                          : chartMetric === 'preco'
                          ? '#006194'
                          : '#005a3c'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Comparativa Detalhada por Posto */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-[#565e74]">
                <th className="pb-2 font-semibold">Posto</th>
                <th className="pb-2 font-semibold text-center">Abastecimentos</th>
                <th className="pb-2 font-semibold text-right">Total Gasto</th>
                <th className="pb-2 font-semibold text-right">Volume (L)</th>
                <th className="pb-2 font-semibold text-right">Preço Médio/L</th>
                <th className="pb-2 font-semibold text-right">Rendimento (KM/L)</th>
                <th className="pb-2 font-semibold text-right">Custo / KM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8faff]">
              {stationStats.map((s) => (
                <tr key={s.posto} className="hover:bg-[#f8faff] transition-colors">
                  <td className="py-2.5 pr-2 font-bold text-[#0b1c30] flex items-center gap-1.5">
                    <span>{s.posto}</span>
                    {bestAndWorstStations.bestEconomy?.posto === s.posto && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[#006948] text-[9px] font-bold">
                        Mais Econômico
                      </span>
                    )}
                    {bestAndWorstStations.worstConsumption?.posto === s.posto && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                        Maior Consumo
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-[#565e74]">
                    {s.abastecimentos}x
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-[#0b1c30]">
                    {formatBRL(s.totalGasto)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#565e74]">
                    {s.totalLitros.toFixed(1)} L
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[#006194] font-semibold">
                    {formatBRL(s.precoMedio)}/L
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-[#006948]">
                    {s.kmPorLitro > 0 ? `${s.kmPorLitro} km/L` : <span className="text-slate-400 font-normal">—</span>}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#005a3c]">
                    {s.custoKm > 0 ? `${formatBRL(s.custoKm)}/km` : <span className="text-slate-400 font-normal">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
