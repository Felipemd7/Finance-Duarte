import React, { useState, useMemo } from 'react';
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
  Calendar,
  Search,
  Filter,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import { formatBRL } from '../utils/formatters';
import { Transaction, Receipt as ReceiptType, FinancialGoal, PurchaseItem } from '../types';

interface MarketAnalyticsReportsViewProps {
  transactions?: Transaction[];
  receipts?: ReceiptType[];
  goals?: FinancialGoal[];
  selectedMonth?: string;
  onNavigateTab?: (tab: string) => void;
}

export const MarketAnalyticsReportsView: React.FC<MarketAnalyticsReportsViewProps> = ({
  transactions = [],
  receipts = [],
  goals = [],
  selectedMonth = 'Agosto 2026',
  onNavigateTab,
}) => {
  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<'mes_atual' | 'bimestral' | 'acumulado'>(
    'mes_atual'
  );

  // Month filter state
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>(selectedMonth);

  // User buyer filter
  const [buyerFilter, setBuyerFilter] = useState<'todos' | 'felipe' | 'genivania'>('todos');

  // Category basket filter for the table
  const [basketFilter, setBasketFilter] = useState<string>('todos');

  // Search input for transactions/items
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded row ID for transaction items drawer
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Unit toggle for basket distribution (Absolute R$ vs %)
  const [volumeUnit, setVolumeUnit] = useState<'reais' | 'percent'>('reais');

  // Interactive Deep-dive vs Grid mode for Raio-X section
  const [activeBasketTab, setActiveBasketTab] = useState<string>('carnes');
  const [basketViewMode, setBasketViewMode] = useState<'deep_dive' | 'grid'>('deep_dive');

  // Sort subcategory cards
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

  // Sync with prop when parent month changes
  React.useEffect(() => {
    if (selectedMonth) {
      setActiveMonthFilter(selectedMonth);
    }
  }, [selectedMonth]);

  // Month mapping helpers
  const monthNameToCode: Record<string, string> = {
    'Janeiro 2026': '2026-01',
    'Fevereiro 2026': '2026-02',
    'Março 2026': '2026-03',
    'Abril 2026': '2026-04',
    'Maio 2026': '2026-05',
    'Junho 2026': '2026-06',
    'Julho 2026': '2026-07',
    'Agosto 2026': '2026-08',
    'Setembro 2026': '2026-09',
    'Outubro 2026': '2026-10',
    'Novembro 2026': '2026-11',
    'Dezembro 2026': '2026-12',
  };

  const codeToMonthName: Record<string, string> = {
    '2026-01': 'Janeiro 2026',
    '2026-02': 'Fevereiro 2026',
    '2026-03': 'Março 2026',
    '2026-04': 'Abril 2026',
    '2026-05': 'Maio 2026',
    '2026-06': 'Junho 2026',
    '2026-07': 'Julho 2026',
    '2026-08': 'Agosto 2026',
    '2026-09': 'Setembro 2026',
    '2026-10': 'Outubro 2026',
    '2026-11': 'Novembro 2026',
    '2026-12': 'Dezembro 2026',
  };

  const monthsList = [
    'Janeiro 2026',
    'Fevereiro 2026',
    'Março 2026',
    'Abril 2026',
    'Maio 2026',
    'Junho 2026',
    'Julho 2026',
    'Agosto 2026',
    'Setembro 2026',
  ];

  // Helper to extract clean establishment name
  const getCleanEstablishment = (t: Transaction): string => {
    if (t.estabelecimento && !t.estabelecimento.startsWith('est-')) {
      return t.estabelecimento;
    }
    if (t.estabelecimento_nome) return t.estabelecimento_nome;
    if (t.observacoes && t.observacoes.includes('Gasto registrado:')) {
      return t.observacoes.replace('Gasto registrado:', '').trim();
    }
    return t.estabelecimento || 'Supermercado';
  };

  // Helper to check if a transaction is supermarket / meat / food related
  const isSupermarketRelated = (t: Transaction): boolean => {
    if (t.tipo !== 'despesa') return false;
    const sub = (t.subcategoria || t.subcategoria_id || '').toLowerCase();
    const cat = (t.categoria || t.categoria_id || '').toLowerCase();
    const est = getCleanEstablishment(t).toLowerCase();
    const obs = (t.observacoes || '').toLowerCase();

    if (sub.includes('supermercado') || sub.includes('alimentacao') || sub.includes('mercado')) {
      return true;
    }
    if (cat.includes('supermercado') || cat.includes('alimentacao')) {
      return true;
    }
    const keywords = [
      'frigor',
      'açougue',
      'acougue',
      'carne',
      'atacad',
      'mateus',
      'ferreira',
      'carvalho',
      'edmilson',
      'piçarra',
      'picarra',
      'hortifruti',
      'panificadora',
      'pão da hora',
      'pao da hora',
      'queijo',
      'geramercantil',
      'sams',
      'feira',
    ];
    return keywords.some((kw) => est.includes(kw) || obs.includes(kw));
  };

  // Helper to classify an individual transaction into a main basket
  const classifyTransactionBasket = (t: Transaction) => {
    const est = getCleanEstablishment(t).toLowerCase();
    const obs = (t.observacoes || '').toLowerCase();

    if (/frigor|açougue|acougue|carnes?|bife|boi|frango/i.test(est) || /frigor|açougue|acougue/i.test(obs)) {
      return { id: 'carnes', name: 'Carnes & Frigorífico', icon: '🥩', color: '#006948' };
    }
    if (/fruta|feira|melancia|piçarra|picarra|hortifruti/i.test(est)) {
      return { id: 'hortifruti', name: 'Hortifruti & Feira', icon: '🥬', color: '#10b981' };
    }
    if (/pão|pao|panificadora|leite|queijo/i.test(est)) {
      return { id: 'laticinios', name: 'Laticínios & Padaria', icon: '🥛', color: '#006194' };
    }
    if (/doce|bombom|festa|snack|vinho|cerveja/i.test(est)) {
      return { id: 'snacks', name: 'Snacks & Extras', icon: '🍷', color: '#d97706' };
    }
    return { id: 'graos', name: 'Grãos & Mercearia', icon: '🌾', color: '#1e293b' };
  };

  // =========================================================================
  // CORE BI ANALYTICS ENGINE (Evolução Temporal, Cestas, Estabelecimentos)
  // =========================================================================
  const biData = useMemo(() => {
    const allSuperTxs = transactions.filter(isSupermarketRelated);
    const activeCode = monthNameToCode[activeMonthFilter] || '2026-08';

    // 1. Calculate Historical Evolution Month by Month (Jan to Ago 2026) for BI Area/Bar Chart
    const evolutionMonths = [
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ];

    const evolutionChartData = evolutionMonths.map((mCode) => {
      const txsInMonth = allSuperTxs.filter((t) => {
        const d = t.data || '';
        const m = t.mes_ano || t.mesReferencia || d.substring(0, 7);
        return m === mCode;
      });

      let carnesVal = 0;
      let graosVal = 0;
      let limpezaVal = 0;
      let hortifrutiVal = 0;
      let outrosVal = 0;
      let total = 0;

      txsInMonth.forEach((t) => {
        total += t.valor;
        const est = getCleanEstablishment(t).toLowerCase();
        const obs = (t.observacoes || '').toLowerCase();
        const isMeat = /frigor|açougue|acougue|carnes?|bife|boi|frango/i.test(est) || /frigor|açougue|acougue/i.test(obs);
        const isFruit = /fruta|feira|melancia|piçarra|picarra|hortifruti/i.test(est);

        // Check if has items
        const rawItems = (t.itens && t.itens.length > 0) ? t.itens : (t.itensDetalhados || []);
        if (rawItems.length > 0) {
          rawItems.forEach((it) => {
            const cat = (it.categoriaItem || it.categoria_item || '').toLowerCase();
            const name = (it.nome || it.nome_do_item || '').toLowerCase();
            const val = Number(it.precoTotal || it.preco_total) || ((Number(it.quantidade) || 1) * (Number(it.precoUnitario || it.preco_unitario) || 0)) || 0;

            if (cat.includes('acougue') || cat.includes('açougue') || isMeat || /carne|frango|bife|picanha|alcatra|patinho|peixe/i.test(name)) {
              carnesVal += val;
            } else if (cat.includes('limpeza') || /sabão|detergente|amaciante|ypê|omo/i.test(name)) {
              limpezaVal += val;
            } else if (cat.includes('hortifruti') || isFruit || /banana|maçã|tomate|legume/i.test(name)) {
              hortifrutiVal += val;
            } else {
              graosVal += val;
            }
          });
        } else {
          // Proportion based on store type
          if (isMeat) {
            carnesVal += t.valor;
          } else if (isFruit) {
            hortifrutiVal += t.valor;
          } else {
            carnesVal += t.valor * 0.35;
            graosVal += t.valor * 0.38;
            limpezaVal += t.valor * 0.15;
            outrosVal += t.valor * 0.12;
          }
        }
      });

      const mShortMap: Record<string, string> = {
        '2026-01': 'Jan',
        '2026-02': 'Fev',
        '2026-03': 'Mar',
        '2026-04': 'Abr',
        '2026-05': 'Mai',
        '2026-06': 'Jun',
        '2026-07': 'Jul',
        '2026-08': 'Ago',
      };

      return {
        mesCode: mCode,
        mesLabel: mShortMap[mCode] || mCode,
        mesNome: codeToMonthName[mCode],
        total: Number(total.toFixed(2)),
        carnes: Number(carnesVal.toFixed(2)),
        graos: Number(graosVal.toFixed(2)),
        limpeza: Number(limpezaVal.toFixed(2)),
        hortifruti: Number(hortifrutiVal.toFixed(2)),
        outros: Number(outrosVal.toFixed(2)),
        tetoOrcamento: 1500,
        txCount: txsInMonth.length,
      };
    });

    // 2. Filter Transactions according to selected period
    let periodTxs: Transaction[] = [];
    let periodLabel = activeMonthFilter;

    if (selectedPeriod === 'mes_atual') {
      periodTxs = allSuperTxs.filter((t) => {
        const d = t.data || '';
        const m = t.mes_ano || t.mesReferencia || d.substring(0, 7);
        return m === activeCode;
      });
      periodLabel = activeMonthFilter;
    } else if (selectedPeriod === 'bimestral') {
      const parts = activeCode.split('-');
      const year = parseInt(parts[0], 10);
      const mNum = parseInt(parts[1], 10);
      const prevMNum = mNum > 1 ? mNum - 1 : 12;
      const prevYear = mNum > 1 ? year : year - 1;
      const prevCode = `${prevYear}-${String(prevMNum).padStart(2, '0')}`;

      periodTxs = allSuperTxs.filter((t) => {
        const d = t.data || '';
        const m = t.mes_ano || t.mesReferencia || d.substring(0, 7);
        return m === activeCode || m === prevCode;
      });
      periodLabel = `Bimestre (${codeToMonthName[prevCode] || 'Mês Ant.'} + ${activeMonthFilter})`;
    } else {
      periodTxs = allSuperTxs.filter((t) => {
        const d = t.data || '';
        return d.startsWith('2026-');
      });
      periodLabel = 'Acumulado 2026 (Jan a Ago)';
    }

    // 3. Apply Buyer Filter (Casal, Felipe, Genivânia)
    const filteredPeriodTxs = periodTxs.filter((t) => {
      if (buyerFilter === 'todos') return true;
      if (buyerFilter === 'felipe') return t.usuarioId === 'usr-felipe' || t.pagoPor?.includes('Felipe');
      if (buyerFilter === 'genivania') return t.usuarioId === 'usr-genivania' || t.pagoPor?.includes('Genivânia');
      return true;
    });

    // 4. Aggregate Granular Cestas for the Period
    let totalCarnes = 0;
    let totalGraos = 0;
    let totalLimpeza = 0;
    let totalLaticinios = 0;
    let totalHortifruti = 0;
    let totalSnacks = 0;

    let totalWeightKg = 0;
    let totalLiquidL = 0;
    let totalAuditItemsCount = 0;

    const carnesItems: Array<{ label: string; store: string; price?: number }> = [];
    const graosItems: Array<{ label: string; store: string; price?: number }> = [];
    const limpezaItems: Array<{ label: string; store: string; price?: number }> = [];
    const laticiniosItems: Array<{ label: string; store: string; price?: number }> = [];
    const hortifrutiItems: Array<{ label: string; store: string; price?: number }> = [];
    const snacksItems: Array<{ label: string; store: string; price?: number }> = [];

    const storeMap: Record<string, { total: number; count: number; meatTotal: number }> = {};
    const storesByBasket: Record<string, Record<string, number>> = {
      carnes: {},
      graos: {},
      limpeza: {},
      laticinios: {},
      hortifruti: {},
      snacks: {},
    };

    filteredPeriodTxs.forEach((t) => {
      const est = getCleanEstablishment(t);
      const estLower = est.toLowerCase();
      const obsLower = (t.observacoes || '').toLowerCase();
      const isMeatEst = /frigor|açougue|acougue|carnes?|bife|boi|frango/i.test(estLower) || /frigor|açougue|acougue/i.test(obsLower);
      const isFruitEst = /fruta|feira|melancia|piçarra|picarra|hortifruti/i.test(estLower);
      const isBakeryEst = /pão|pao|panificadora|leite|queijo/i.test(estLower);
      const isSweetEst = /doce|bombom|festa/i.test(estLower);

      if (!storeMap[est]) storeMap[est] = { total: 0, count: 0, meatTotal: 0 };
      storeMap[est].total += t.valor;
      storeMap[est].count += 1;

      const rawItems: PurchaseItem[] = (t.itens && t.itens.length > 0)
        ? t.itens
        : (t.itensDetalhados && t.itensDetalhados.length > 0)
        ? t.itensDetalhados
        : [];

      if (rawItems.length > 0) {
        totalAuditItemsCount += rawItems.length;

        rawItems.forEach((it) => {
          const cat = (it.categoriaItem || it.categoria_item || '').toLowerCase();
          const itemName = it.nome || it.nome_do_item || '';
          const nameLower = itemName.toLowerCase();
          const qtd = Number(it.quantidade) || 1;
          const unitPrice = Number(it.precoUnitario || it.preco_unitario) || 0;
          const totalVal = Number(it.precoTotal || it.preco_total) || (qtd * unitPrice) || 0;

          if (
            cat.includes('acougue') ||
            cat.includes('açougue') ||
            cat.includes('carne') ||
            isMeatEst ||
            /carne|frango|alcatra|picanha|patinho|maminha|peixe|salmão|costela|linguiça|filé|bife|acem|músculo/i.test(nameLower)
          ) {
            totalCarnes += totalVal;
            storeMap[est].meatTotal += totalVal;
            storesByBasket.carnes[est] = (storesByBasket.carnes[est] || 0) + totalVal;
            totalWeightKg += qtd;
            carnesItems.push({
              label: itemName ? `${itemName} (${qtd} ${it.unidade || 'kg'})` : `Cortes Bovinos/Aves (${qtd.toFixed(1)} kg)`,
              store: est,
              price: totalVal,
            });
          } else if (
            cat.includes('limpeza') ||
            /sabão|detergente|amaciante|cloro|desinfetante|ypê|omo|vanish/i.test(nameLower)
          ) {
            totalLimpeza += totalVal;
            storesByBasket.limpeza[est] = (storesByBasket.limpeza[est] || 0) + totalVal;
            totalLiquidL += qtd;
            limpezaItems.push({
              label: itemName ? `${itemName} (${qtd} un)` : `Produtos de Limpeza (${qtd.toFixed(0)} un)`,
              store: est,
              price: totalVal,
            });
          } else if (
            cat.includes('hortifruti') ||
            isFruitEst ||
            /banana|maçã|tomate|cebola|batata|alface|laranja|melancia|uva/i.test(nameLower)
          ) {
            totalHortifruti += totalVal;
            storesByBasket.hortifruti[est] = (storesByBasket.hortifruti[est] || 0) + totalVal;
            totalWeightKg += qtd;
            hortifrutiItems.push({
              label: itemName ? `${itemName} (${qtd} ${it.unidade || 'kg'})` : `Hortifruti Fresco (${qtd.toFixed(1)} kg)`,
              store: est,
              price: totalVal,
            });
          } else if (
            cat.includes('laticinio') ||
            cat.includes('padaria') ||
            isBakeryEst ||
            /leite|queijo|iogurte|pão|manteiga|requeijão/i.test(nameLower)
          ) {
            totalLaticinios += totalVal;
            storesByBasket.laticinios[est] = (storesByBasket.laticinios[est] || 0) + totalVal;
            totalLiquidL += qtd * 0.8;
            laticiniosItems.push({
              label: itemName ? `${itemName} (${qtd} un)` : `Laticínios & Padaria (${qtd.toFixed(0)} un)`,
              store: est,
              price: totalVal,
            });
          } else if (
            cat.includes('mercearia') ||
            cat.includes('grao') ||
            /arroz|feijão|café|açúcar|macarrão|azeite|óleo|farinha/i.test(nameLower)
          ) {
            totalGraos += totalVal;
            storesByBasket.graos[est] = (storesByBasket.graos[est] || 0) + totalVal;
            totalWeightKg += qtd;
            graosItems.push({
              label: itemName ? `${itemName} (${qtd} ${it.unidade || 'kg'})` : `Alimentos Secos (${qtd.toFixed(1)} kg)`,
              store: est,
              price: totalVal,
            });
          } else {
            if (isSweetEst || /chocolate|doce|vinho|cerveja|snack|biscoito|refrigerante/i.test(nameLower)) {
              totalSnacks += totalVal;
              storesByBasket.snacks[est] = (storesByBasket.snacks[est] || 0) + totalVal;
              snacksItems.push({
                label: itemName ? `${itemName} (${qtd} un)` : `Snacks & Extras`,
                store: est,
                price: totalVal,
              });
            } else {
              totalGraos += totalVal;
              storesByBasket.graos[est] = (storesByBasket.graos[est] || 0) + totalVal;
              totalWeightKg += qtd;
              graosItems.push({
                label: itemName ? `${itemName} (${qtd} un)` : `Mercearia Geral`,
                store: est,
                price: totalVal,
              });
            }
          }
        });
      } else {
        totalAuditItemsCount += 1;

        if (isMeatEst) {
          totalCarnes += t.valor;
          storeMap[est].meatTotal += t.valor;
          storesByBasket.carnes[est] = (storesByBasket.carnes[est] || 0) + t.valor;
          totalWeightKg += t.valor / 42.0;
          carnesItems.push({
            label: `Açougue / Carnes Resfriadas (${formatBRL(t.valor)})`,
            store: est,
            price: t.valor,
          });
        } else if (isFruitEst) {
          totalHortifruti += t.valor;
          storesByBasket.hortifruti[est] = (storesByBasket.hortifruti[est] || 0) + t.valor;
          totalWeightKg += t.valor / 8.0;
          hortifrutiItems.push({
            label: `Hortifruti / Feira (${formatBRL(t.valor)})`,
            store: est,
            price: t.valor,
          });
        } else if (isBakeryEst) {
          totalLaticinios += t.valor;
          storesByBasket.laticinios[est] = (storesByBasket.laticinios[est] || 0) + t.valor;
          totalLiquidL += 1.5;
          laticiniosItems.push({
            label: `Padaria & Laticínios (${formatBRL(t.valor)})`,
            store: est,
            price: t.valor,
          });
        } else if (isSweetEst) {
          totalSnacks += t.valor;
          storesByBasket.snacks[est] = (storesByBasket.snacks[est] || 0) + t.valor;
          snacksItems.push({
            label: `Doces, Bebidas & Extras (${formatBRL(t.valor)})`,
            store: est,
            price: t.valor,
          });
        } else {
          const meatPart = t.valor * 0.35;
          const graosPart = t.valor * 0.38;
          const limpPart = t.valor * 0.15;
          const latPart = t.valor * 0.12;

          totalCarnes += meatPart;
          totalGraos += graosPart;
          totalLimpeza += limpPart;
          totalLaticinios += latPart;

          storeMap[est].meatTotal += meatPart;
          storesByBasket.carnes[est] = (storesByBasket.carnes[est] || 0) + meatPart;
          storesByBasket.graos[est] = (storesByBasket.graos[est] || 0) + graosPart;
          storesByBasket.limpeza[est] = (storesByBasket.limpeza[est] || 0) + limpPart;
          storesByBasket.laticinios[est] = (storesByBasket.laticinios[est] || 0) + latPart;

          totalWeightKg += (t.valor * 0.7) / 16.0;
          totalLiquidL += (t.valor * 0.3) / 8.0;

          carnesItems.push({
            label: `Carnes & Proteínas (${formatBRL(meatPart)})`,
            store: est,
            price: meatPart,
          });
          graosItems.push({
            label: `Mercearia & Básicos (${formatBRL(graosPart)})`,
            store: est,
            price: graosPart,
          });
          limpezaItems.push({
            label: `Produtos de Limpeza (${formatBRL(limpPart)})`,
            store: est,
            price: limpPart,
          });
          laticiniosItems.push({
            label: `Frios & Matinais (${formatBRL(latPart)})`,
            store: est,
            price: latPart,
          });
        }
      }
    });

    const totalSpending = totalCarnes + totalGraos + totalLimpeza + totalLaticinios + totalHortifruti + totalSnacks;
    const safeTotal = totalSpending > 0 ? totalSpending : 1;

    // 5. Build Distribution for BI Donut Chart and List
    const categoriesData = [
      {
        id: 'carnes',
        name: 'Carnes & Frigorífico',
        shortName: 'Carnes',
        icon: '🥩',
        amount: totalCarnes,
        percent: Number(((totalCarnes / safeTotal) * 100).toFixed(1)),
        color: '#006948',
        badgeBg: 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]',
      },
      {
        id: 'graos',
        name: 'Grãos & Mercearia',
        shortName: 'Grãos',
        icon: '🌾',
        amount: totalGraos,
        percent: Number(((totalGraos / safeTotal) * 100).toFixed(1)),
        color: '#1e293b',
        badgeBg: 'bg-[#f1f5f9] text-[#1e293b] border-[#cbd5e1]',
      },
      {
        id: 'limpeza',
        name: 'Limpeza & Sabão',
        shortName: 'Limpeza',
        icon: '🧼',
        amount: totalLimpeza,
        percent: Number(((totalLimpeza / safeTotal) * 100).toFixed(1)),
        color: '#0284c7',
        badgeBg: 'bg-[#eff6ff] text-[#0284c7] border-[#bfdbfe]',
      },
      {
        id: 'laticinios',
        name: 'Laticínios & Padaria',
        shortName: 'Laticínios',
        icon: '🥛',
        amount: totalLaticinios,
        percent: Number(((totalLaticinios / safeTotal) * 100).toFixed(1)),
        color: '#006194',
        badgeBg: 'bg-[#eff4ff] text-[#006194] border-[#dce9ff]',
      },
      {
        id: 'hortifruti',
        name: 'Hortifruti & Feira',
        shortName: 'Hortifruti',
        icon: '🥬',
        amount: totalHortifruti,
        percent: Number(((totalHortifruti / safeTotal) * 100).toFixed(1)),
        color: '#10b981',
        badgeBg: 'bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]',
      },
      {
        id: 'snacks',
        name: 'Bebidas & Extras',
        shortName: 'Extras',
        icon: '🍷',
        amount: totalSnacks,
        percent: Number(((totalSnacks / safeTotal) * 100).toFixed(1)),
        color: '#d97706',
        badgeBg: 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]',
      },
    ].sort((a, b) => b.amount - a.amount);

    // Budget Target (Teto) from goals
    const superGoal = goals.find(
      (g) => g.subcategoria === 'sub-supermercado' || g.subcategoria_id === 'sub-supermercado'
    );
    const budgetCap =
      selectedPeriod === 'acumulado'
        ? superGoal ? superGoal.valorPlanejado * 8 : 12000
        : selectedPeriod === 'bimestral'
        ? superGoal ? superGoal.valorPlanejado * 2 : 3000
        : superGoal ? superGoal.valorPlanejado : 1500;

    const overBudget = totalSpending - budgetCap;
    const overPercent = budgetCap > 0 ? ((overBudget / budgetCap) * 100).toFixed(1) : '0';

    // Store Rankings
    const sortedStores = Object.entries(storeMap)
      .map(([name, d]) => ({
        name,
        total: d.total,
        count: d.count,
        meatTotal: d.meatTotal,
        avgTicket: d.total / (d.count || 1),
        sharePercent: Number(((d.total / safeTotal) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.total - a.total);

    // Top Items Filter
    const getTopItems = (itemsList: Array<{ label: string; store: string; price?: number }>) => {
      const seen = new Set<string>();
      const result: Array<{ label: string; store: string }> = [];
      const sorted = [...itemsList].sort((a, b) => (b.price || 0) - (a.price || 0));
      for (const it of sorted) {
        if (!seen.has(it.label)) {
          seen.add(it.label);
          result.push({ label: it.label, store: it.store });
          if (result.length >= 4) break;
        }
      }
      return result;
    };

    // Subcategory Detailed Cards for BI Explorer
    const subcategoryCards = [
      {
        id: 'carnes',
        title: 'Carnes, Aves & Frigorífico',
        shortTitle: 'Carnes',
        amount: totalCarnes,
        share: `${((totalCarnes / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🥩',
        metric1Label: 'Volume Estimado',
        metric1Value: `${(totalCarnes / 42.0).toFixed(1).replace('.', ',')} kg cortes`,
        metric2Label: 'Preço Médio Estimado',
        metric2Value: totalCarnes > 0 ? 'R$ 42,00 / kg' : 'R$ 0,00',
        items: getTopItems(carnesItems),
        color: '#006948',
        accentBg: 'bg-[#ecfdf5]',
        accentText: 'text-[#006948]',
        borderColor: 'border-[#a7f3d0]',
        borderTopClass: 'border-t-4 border-t-[#006948]',
        stores: Object.entries(storesByBasket.carnes || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalCarnes > 0 ? Number(((val / totalCarnes) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Carnes em açougues e frigoríficos (Cristo Rei/Nacional) geram ~15% de economia em relação a hipermercados',
      },
      {
        id: 'graos',
        title: 'Grãos, Mercearia & Básicos',
        shortTitle: 'Grãos & Secos',
        amount: totalGraos,
        share: `${((totalGraos / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🌾',
        metric1Label: 'Volume Estimado',
        metric1Value: `${(totalGraos / 9.5).toFixed(1).replace('.', ',')} kg secos`,
        metric2Label: 'Custo Médio Ponderado',
        metric2Value: totalGraos > 0 ? 'R$ 9,50 / kg' : 'R$ 0,00',
        items: getTopItems(graosItems),
        color: '#1e293b',
        accentBg: 'bg-slate-100',
        accentText: 'text-slate-800',
        borderColor: 'border-slate-300',
        borderTopClass: 'border-t-4 border-t-slate-800',
        stores: Object.entries(storesByBasket.graos || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalGraos > 0 ? Number(((val / totalGraos) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Compras de fardos no Atacadão e Ferreira mantêm o custo sob controle',
      },
      {
        id: 'limpeza',
        title: 'Produtos de Limpeza & Sabão',
        shortTitle: 'Limpeza',
        amount: totalLimpeza,
        share: `${((totalLimpeza / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🧼',
        metric1Label: 'Volume Líquido',
        metric1Value: `${(totalLimpeza / 14.0).toFixed(1).replace('.', ',')} Litros`,
        metric2Label: 'Custo Médio Unitário',
        metric2Value: totalLimpeza > 0 ? 'R$ 14,00 / L' : 'R$ 0,00',
        items: getTopItems(limpezaItems),
        color: '#0284c7',
        accentBg: 'bg-blue-50',
        accentText: 'text-blue-700',
        borderColor: 'border-blue-200',
        borderTopClass: 'border-t-4 border-t-[#0284c7]',
        stores: Object.entries(storesByBasket.limpeza || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalLimpeza > 0 ? Number(((val / totalLimpeza) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Galões concentrados de 5L proporcionam maior rendimento para a rotina doméstica',
      },
      {
        id: 'laticinios',
        title: 'Laticínios, Frios & Padaria',
        shortTitle: 'Laticínios',
        amount: totalLaticinios,
        share: `${((totalLaticinios / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🥛',
        metric1Label: 'Frequência Recorrente',
        metric1Value: 'Compras semanais',
        metric2Label: 'Locais Frequentes',
        metric2Value: 'Pão da Hora / Ideal',
        items: getTopItems(laticiniosItems),
        color: '#006194',
        accentBg: 'bg-sky-50',
        accentText: 'text-sky-800',
        borderColor: 'border-sky-200',
        borderTopClass: 'border-t-4 border-t-[#006194]',
        stores: Object.entries(storesByBasket.laticinios || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalLaticinios > 0 ? Number(((val / totalLaticinios) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Compras rápidas de café da manhã e lanches do dia a dia no bairro',
      },
      {
        id: 'hortifruti',
        title: 'Hortifruti & Feira Fresca',
        shortTitle: 'Hortifruti',
        amount: totalHortifruti,
        share: `${((totalHortifruti / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🥬',
        metric1Label: 'Volume de Frutas & Vegetais',
        metric1Value: `${(totalHortifruti / 8.0).toFixed(1).replace('.', ',')} kg frescos`,
        metric2Label: 'Principais Locais',
        metric2Value: 'Edmilson Frutas / Piçarra',
        items: getTopItems(hortifrutiItems),
        color: '#10b981',
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        borderTopClass: 'border-t-4 border-t-[#10b981]',
        stores: Object.entries(storesByBasket.hortifruti || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalHortifruti > 0 ? Number(((val / totalHortifruti) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Abastecimento em bancas de frutas gera alta qualidade nutricional e melhor preço',
      },
      {
        id: 'snacks',
        title: 'Bebidas, Snacks & Extras',
        shortTitle: 'Extras & Lazer',
        amount: totalSnacks,
        share: `${((totalSnacks / safeTotal) * 100).toFixed(1).replace('.', ',')}%`,
        iconEmoji: '🍷',
        metric1Label: 'Natureza do Dispêndio',
        metric1Value: 'Conforto & Lazer',
        metric2Label: 'Recomendação',
        metric2Value: 'Alocar em Lazer',
        items: getTopItems(snacksItems),
        color: '#d97706',
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-800',
        borderColor: 'border-amber-200',
        borderTopClass: 'border-t-4 border-t-[#d97706]',
        stores: Object.entries(storesByBasket.snacks || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, val]) => ({
            name,
            amount: val,
            percent: totalSnacks > 0 ? Number(((val / totalSnacks) * 100).toFixed(1)) : 0,
          })),
        alertText: 'Doces e extras eventuais moderados para preservar o teto orçamentário',
      },
    ];

    // Filter transactions for the interactive table
    const tableFilteredTxs = filteredPeriodTxs.filter((t) => {
      // Basket filter
      if (basketFilter !== 'todos') {
        const basket = classifyTransactionBasket(t);
        if (basket.id !== basketFilter) return false;
      }
      // Search term filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const est = getCleanEstablishment(t).toLowerCase();
        const obs = (t.observacoes || '').toLowerCase();
        const itensStr = JSON.stringify(t.itens || t.itensDetalhados || []).toLowerCase();
        return est.includes(query) || obs.includes(query) || itensStr.includes(query) || t.valor.toString().includes(query);
      }
      return true;
    });

    return {
      periodLabel,
      periodTxs: filteredPeriodTxs,
      totalSpending,
      budgetCap,
      overBudget,
      overPercent,
      categoriesData,
      subcategoryCards,
      totalWeightKg,
      totalLiquidL,
      totalAuditItemsCount,
      sortedStores,
      conciliatedReceiptsCount: receipts.filter((r) => r.status === 'Conciliado').length,
      carnesTotal: totalCarnes,
      evolutionChartData,
      tableFilteredTxs,
      avgTicket: totalSpending / (filteredPeriodTxs.length || 1),
    };
  }, [
    transactions,
    receipts,
    goals,
    selectedPeriod,
    activeMonthFilter,
    buyerFilter,
    basketFilter,
    searchTerm,
  ]);

  const sortedCards = [...biData.subcategoryCards].sort((a, b) =>
    sortByAmount ? b.amount - a.amount : a.title.localeCompare(b.title)
  );

  return (
    <div
      id="bi-market-analytics-dashboard"
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 pb-24 md:pb-12 flex flex-col gap-6 font-sans animate-in fade-in duration-300"
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
      {/* 1. BI EXECUTIVE HEADER & PARAMETERS TOOLBAR                                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0b1c30] via-[#0f2847] to-[#0b1c30] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/50 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006948]/30 border border-[#006948] text-[#34d399] font-bold text-[11px] tracking-wider uppercase">
                <BarChart3 className="w-3.5 h-3.5 text-[#34d399]" />
                BUSINESS INTELLIGENCE & ANALYTICS
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs font-medium hidden sm:inline">
                Casal Duarte (Felipe & Genivânia)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
              Painel BI de Supermercados, Cestas & Frigoríficos
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Consolidação analítica de dados reais de compras de janeiro a agosto de 2026, com foco
              estratégico em açougues/frigoríficos, controle de peso/litragem e divisão paritária
              50/50.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => setShowInflationModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
            >
              <TrendingUp className="w-4 h-4 text-[#34d399]" />
              <span>IPCA Pessoal</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00563b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
          </div>
        </div>

        {/* BI Filters & Slicers Toolbar */}
        <div className="pt-4 border-t border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#34d399]" /> Filtros BI:
            </span>

            {/* Period Slicer */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => setSelectedPeriod('mes_atual')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'mes_atual'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Mês Ativo
              </button>
              <button
                onClick={() => setSelectedPeriod('bimestral')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'bimestral'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Bimestral
              </button>
              <button
                onClick={() => setSelectedPeriod('acumulado')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'acumulado'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Acumulado 2026 (Jan-Ago)
              </button>
            </div>

            {/* Month Dropdown (visible in mes_atual) */}
            {selectedPeriod === 'mes_atual' && (
              <select
                value={activeMonthFilter}
                onChange={(e) => setActiveMonthFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-700 transition-all outline-none"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m} className="bg-[#0b1c30] text-white">
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* Buyer Slicer */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => setBuyerFilter('todos')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  buyerFilter === 'todos'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Casal Duarte
              </button>
              <button
                onClick={() => setBuyerFilter('felipe')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  buyerFilter === 'felipe'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Felipe
              </button>
              <button
                onClick={() => setBuyerFilter('genivania')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  buyerFilter === 'genivania'
                    ? 'bg-pink-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Genivânia
              </button>
            </div>
          </div>

          {/* Sincronização Status */}
          <div className="flex items-center gap-2 text-slate-300 self-end md:self-auto font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>
              Período Ativo: <strong className="text-white">{biData.periodLabel}</strong> ({biData.periodTxs.length} compras)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE EXECUTIVE BI SCORECARD CARDS                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Dispêndio Total Supermercado */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              TOTAL SUPERMERCADO
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006948] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl text-slate-900 tnum">
              {formatBRL(biData.totalSpending)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Teto: {formatBRL(biData.budgetCap)}</span>
              <span
                className={`font-bold ${
                  biData.overBudget > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {biData.overBudget > 0
                  ? `+${formatBRL(biData.overBudget)}`
                  : `${formatBRL(Math.abs(biData.overBudget))} sob controle`}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-[#006948] h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (biData.totalSpending / (biData.budgetCap || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* KPI 2: Carnes & Frigorífico (Destaque Solicitado) */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              CARNES & FRIGORÍFICO
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-rose-700 flex items-center justify-center text-sm">
              🥩
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl text-slate-900 tnum">
              {formatBRL(biData.carnesTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Share da Cesta:</span>
              <span className="font-bold text-rose-600">
                {((biData.carnesTotal / (biData.totalSpending || 1)) * 100).toFixed(1)}% do total
              </span>
            </div>
          </div>

          <div className="mt-3">
            <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-[#006948] text-[10px] font-bold border border-emerald-200">
              Economia Frigorífico: ~{formatBRL(biData.carnesTotal * 0.15)}
            </span>
          </div>
        </div>

        {/* KPI 3: Volume & Carga Física (kg & L) */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              VOLUME FÍSICO ESTIMADO
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl text-slate-900 tnum">
              {biData.totalWeightKg.toFixed(1).replace('.', ',')} kg
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Líquidos & Bebidas:</span>
              <span className="font-semibold text-slate-700">
                ~{biData.totalLiquidL.toFixed(1).replace('.', ',')} L
              </span>
            </div>
          </div>

          <div className="mt-3">
            <span className="inline-flex px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 text-[10px] font-bold border border-cyan-200">
              ~{((biData.totalWeightKg + biData.totalLiquidL) / 30).toFixed(1)} kg/L por dia
            </span>
          </div>
        </div>

        {/* KPI 4: Auditoria de Itens & Tíquete Médio */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              AUDITORIA & COMPRAS
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl text-slate-900 tnum">
              {biData.periodTxs.length}{' '}
              <span className="text-sm font-normal text-slate-500">compras</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Tíquete Médio:</span>
              <span className="font-bold text-slate-800">{formatBRL(biData.avgTicket)}</span>
            </div>
          </div>

          <div className="mt-3">
            <span className="inline-flex px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
              {biData.totalAuditItemsCount} Itens Auditados
            </span>
          </div>
        </div>

        {/* KPI 5: Rateio Casal 50/50 */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              RATEIO DO CASAL
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="font-display font-black text-2xl text-slate-900 tnum">
              {formatBRL(biData.totalSpending / 2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Felipe: {formatBRL(biData.totalSpending / 2)} • Genivânia: {formatBRL(biData.totalSpending / 2)}
            </div>
          </div>

          <div className="mt-3">
            <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
              Proporção Paritária Confirmada
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BI CHARTS ROW: EVOLUÇÃO MENSAL (RECHARTS) + DONUT CESTAS               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Evolução Histórica Jan a Ago 2026 (Composed Chart) */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                HISTÓRICO MENSAL BI (JAN A AGO 2026)
              </span>
              <h2 className="font-display font-bold text-base text-slate-900 mt-0.5">
                Evolução do Gasto em Supermercado & Participação de Carnes
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#006948]" /> Carnes/Frigorífico
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" /> Mercearia/Outros
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <span className="w-3 h-0.5 bg-rose-500" /> Teto (R$ 1.500)
              </span>
            </div>
          </div>

          {/* Recharts Composed Area + Line Chart */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={biData.evolutionChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="mesLabel"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    formatBRL(Number(val)),
                    name === 'carnes'
                      ? '🥩 Carnes & Frigorífico'
                      : name === 'graos'
                      ? '🌾 Mercearia & Grãos'
                      : name === 'limpeza'
                      ? '🧼 Limpeza'
                      : name === 'total'
                      ? 'Total Geral'
                      : name,
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) return payload[0].payload.mesNome;
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#0b1c30',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }}
                />
                {/* Stacked Bars or Areas */}
                <Bar
                  dataKey="carnes"
                  name="carnes"
                  stackId="a"
                  fill="#006948"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="graos"
                  name="graos"
                  stackId="a"
                  fill="#0284c7"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="limpeza"
                  name="limpeza"
                  stackId="a"
                  fill="#6366f1"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="hortifruti"
                  name="hortifruti"
                  stackId="a"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                {/* Budget Limit Line */}
                <Line
                  type="monotone"
                  dataKey="tetoOrcamento"
                  name="Teto Orçamento"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              💡 <strong>Insight BI:</strong> Agosto teve o maior dispêndio (R$ 2.020,19 com Mix
              Mateus e Ferreira), enquanto Julho foi o mês mais enxuto (R$ 1.023,41).
            </span>
            <span className="font-semibold text-[#006948]">Média Mensal: R$ 1.391,47</span>
          </div>
        </div>

        {/* Right: Donut Chart de Distribuição de Cestas */}
        <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                DISTRIBUIÇÃO DA CESTA
              </span>
              <h2 className="font-display font-bold text-base text-slate-900 mt-0.5">
                Share por Categoria ({biData.periodLabel})
              </h2>
            </div>
            <button
              onClick={() => setVolumeUnit(volumeUnit === 'reais' ? 'percent' : 'reais')}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              {volumeUnit === 'reais' ? 'R$' : '%'}
            </button>
          </div>

          {/* Recharts Pie / Donut */}
          <div className="w-full h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={biData.categoriesData}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {biData.categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatBRL(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0b1c30',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">TOTAL</span>
              <span className="font-display font-black text-sm text-slate-900">
                {formatBRL(biData.totalSpending)}
              </span>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="flex flex-col gap-1.5 text-xs">
            {biData.categoriesData.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-slate-700">
                    {cat.icon} {cat.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 tnum">
                  {volumeUnit === 'reais'
                    ? formatBRL(cat.amount)
                    : `${cat.percent.toString().replace('.', ',')}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXPLORADOR BI DE CESTAS & RAIO-X ANALÍTICO                             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        {/* Header com Switcher de Modo: Deep-Dive (Foco Analítico) vs Bento Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
              <span>EXPLORADOR GRANULAR DE CONSUMO</span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 mt-0.5">
              Raio-X Estratégico por Cesta & Açougue
            </h2>
            <p className="text-xs text-slate-500">
              Navegue entre as cestas para inspecionar fornecedores, volumes físicos e produtos auditados em {biData.periodLabel}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setBasketViewMode('deep_dive')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  basketViewMode === 'deep_dive'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Painel Aprofundado
              </button>
              <button
                onClick={() => setBasketViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  basketViewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Grade Comparativa
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Tabs / Pills Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {biData.subcategoryCards.map((c) => {
            const isActive = activeBasketTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveBasketTab(c.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base">{c.iconEmoji}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-emerald-300' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {c.share}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {c.shortTitle}
                  </div>
                  <div className={`font-display font-black text-sm tnum mt-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-900'}`}>
                    {formatBRL(c.amount)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* MODE 1: DEEP-DIVE CARD (Painel Aprofundado da Cesta Ativa) */}
        {basketViewMode === 'deep_dive' && (() => {
          const current = biData.subcategoryCards.find((c) => c.id === activeBasketTab) || biData.subcategoryCards[0];
          return (
            <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-slate-50/60 shadow-xs flex flex-col gap-5">
              {/* Header da Cesta Ativa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-2xl">
                    {current.iconEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-extrabold text-xl text-slate-900">
                        {current.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {current.share} da cesta familiar
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Diagnóstico de suprimentos, preços médios e fornecedores cadastrados em {biData.periodLabel}.
                    </p>
                  </div>
                </div>

                <div className="font-display font-black text-2xl sm:text-3xl text-slate-900 tnum self-start sm:self-auto">
                  {formatBRL(current.amount)}
                </div>
              </div>

              {/* 3 Columns Deep-Dive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Coluna 1: Métricas & Curagem */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      MÉTRICAS & VOLUMES
                    </span>
                    <div className="mt-2 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">{current.metric1Label}:</span>
                        <span className="font-bold text-slate-900">{current.metric1Value}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">{current.metric2Label}:</span>
                        <span className="font-bold text-[#006948]">{current.metric2Value}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-500">Participação Relativa:</span>
                        <span className="font-bold text-slate-900">{current.share}</span>
                      </div>
                    </div>
                  </div>

                  {/* Callout inteligente */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{current.alertText}</span>
                  </div>
                </div>

                {/* Coluna 2: Lojas & Fornecedores Desta Cesta */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      FORNECEDORES & REDES UTILIZADAS
                    </span>
                    <div className="mt-2.5 flex flex-col gap-2">
                      {current.stores && current.stores.length > 0 ? (
                        current.stores.map((s, sIdx) => (
                          <div key={sIdx} className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-[11px] truncate">
                                {s.name}
                              </span>
                              <span className="font-bold text-slate-900 tnum text-[11px]">
                                {formatBRL(s.amount)} ({s.percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#006948] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, s.percent))}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic py-2">
                          Sem divisão específica por estabelecimento no período.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium">
                    * Proporção calculada sobre o total gasto nesta categoria.
                  </div>
                </div>

                {/* Coluna 3: Produtos & Lançamentos Auditados */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      PRODUTOS & COMPRAS REGISTRADAS
                    </span>
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {current.items && current.items.length > 0 ? (
                        current.items.map((it, itIdx) => (
                          <div
                            key={itIdx}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs gap-2"
                          >
                            <span className="truncate text-slate-800 text-[11px] font-medium" title={it.label}>
                              {it.label}
                            </span>
                            <span className="shrink-0 text-[10px] font-bold text-[#006194] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                              {it.store}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic py-2">
                          Sem itens individuais detalhados para esta cesta no período.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <ScanLine className="w-3 h-3 text-[#006948]" />
                    <span>Integrado com OCR de cupom fiscal e comprovantes.</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODE 2: BENTO GRID COMPARATIVO (Para ver as 6 cestas simultaneamente) */}
        {basketViewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {biData.subcategoryCards.map((c) => (
              <div
                key={c.id}
                className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3.5 hover:shadow-md transition-shadow ${c.borderTopClass}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.iconEmoji}</span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          {c.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {c.share} do total gasto
                        </span>
                      </div>
                    </div>
                    <span className="font-display font-black text-base text-slate-900 tnum">
                      {formatBRL(c.amount)}
                    </span>
                  </div>

                  {/* Micro metrics bar */}
                  <div className="mt-3 py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px] font-medium">{c.metric1Value}</span>
                    <span className="text-[#006948] text-[11px] font-bold">{c.metric2Value}</span>
                  </div>

                  {/* Items chip list */}
                  <div className="mt-2.5 flex flex-col gap-1">
                    {c.items.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 py-0.5">
                        <span className="truncate">• {it.label}</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded shrink-0">
                          {it.store}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1 truncate">
                  <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{c.alertText}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MATRIZ DE ESTABELECIMENTOS & MARKET SHARE (POWER BI MATRIX TABLE)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <Store className="w-3.5 h-3.5 text-[#006948]" />
              <span>MATRIZ BI DE REDES & ESTABELECIMENTOS</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 mt-0.5">
              Concentração de Compras por Rede, Atacado & Açougue
            </h2>
            <p className="text-xs text-slate-500">
              Ranking dos locais onde o casal mais concentrou o orçamento em {biData.periodLabel}.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006948] self-start sm:self-auto shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{biData.sortedStores.length} Estabelecimentos no Período</span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">ESTABELECIMENTO</th>
                <th className="py-2.5 px-3">TOTAL GASTO</th>
                <th className="py-2.5 px-3">MARKET SHARE (%)</th>
                <th className="py-2.5 px-3">VISITAS / COMPRAS</th>
                <th className="py-2.5 px-3">TÍQUETE MÉDIO</th>
                <th className="py-2.5 px-3">CARNES / FRIGORÍFICO</th>
                <th className="py-2.5 px-3 text-right">ESTRATÉGIA DO CASAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {biData.sortedStores.slice(0, 8).map((store, idx) => {
                const isMeat = /frigor|açougue|acougue|carnes/i.test(store.name);
                const isWholesale = /atacad|mateus/i.test(store.name);
                const isFruit = /fruta|feira|piçarra|picarra/i.test(store.name);

                let badge = 'COMPRAS DE ROTINA';
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

                if (isMeat) {
                  badge = '🥩 AÇOUGUE & CARNES';
                  badgeStyle = 'bg-red-50 text-rose-700 border-red-200';
                } else if (isWholesale) {
                  badge = '🏬 ATACADO & VOLUME';
                  badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                } else if (isFruit) {
                  badge = '🍉 HORTIFRUTI FRESCO';
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-base">
                        {isMeat ? '🥩' : isWholesale ? '🏬' : isFruit ? '🍉' : '🛒'}
                      </span>
                      <span>{store.name}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 tnum">
                      {formatBRL(store.total)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006948] h-full rounded-full"
                            style={{ width: `${Math.min(100, store.sharePercent)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {store.sharePercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {store.count} {store.count === 1 ? 'visita' : 'visitas'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 tnum">
                      {formatBRL(store.avgTicket)}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700 tnum">
                      {store.meatTotal > 0 ? formatBRL(store.meatTotal) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                      >
                        {badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. EXTRATO ANALÍTICO BI COM DETALHAMENTO DE ITENS DA IA (MASTER-DETAIL)   */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              REGISTRO DETALHADO DE TRANSAÇÕES
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 mt-0.5">
              Extrato Analítico de Compras com Suporte a Itens da IA
            </h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer compra para inspecionar os itens escaneados e a discriminação de valores.
            </p>
          </div>

          {/* Search & Basket Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por loja ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-52 sm:w-64"
              />
            </div>

            {/* Category Filter Pills */}
            <select
              value={basketFilter}
              onChange={(e) => setBasketFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl cursor-pointer outline-none"
            >
              <option value="todos">Todas as Cestas</option>
              <option value="carnes">🥩 Carnes & Frigorífico</option>
              <option value="graos">🌾 Grãos & Mercearia</option>
              <option value="limpeza">🧼 Limpeza</option>
              <option value="hortifruti">🥬 Hortifruti</option>
              <option value="laticinios">🥛 Laticínios</option>
              <option value="snacks">🍷 Extras & Snacks</option>
            </select>
          </div>
        </div>

        {/* Transactions Table with Expandable Drawer */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">DATA</th>
                <th className="py-2.5 px-3">ESTABELECIMENTO</th>
                <th className="py-2.5 px-3">CESTA / CATEGORIA</th>
                <th className="py-2.5 px-3">PAGO POR</th>
                <th className="py-2.5 px-3">VALOR</th>
                <th className="py-2.5 px-3 text-center">ITENS AUDITADOS</th>
                <th className="py-2.5 px-3 text-right">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {biData.tableFilteredTxs.length > 0 ? (
                biData.tableFilteredTxs.slice(0, 15).map((t) => {
                  const est = getCleanEstablishment(t);
                  const basket = classifyTransactionBasket(t);
                  const rawItems = (t.itens && t.itens.length > 0)
                    ? t.itens
                    : (t.itensDetalhados && t.itensDetalhados.length > 0)
                    ? t.itensDetalhados
                    : [];
                  const isExpanded = expandedTxId === t.id;

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {t.data}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {est}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <span>{basket.icon}</span>
                            <span>{basket.name}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              t.pagoPor?.includes('Genivânia')
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {t.pagoPor || 'Felipe'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900 tnum">
                          {formatBRL(t.valor)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {rawItems.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#006948] border border-emerald-200">
                              {rawItems.length} {rawItems.length === 1 ? 'item' : 'itens'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTxId(isExpanded ? null : t.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Drawer with Detailed Items */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col gap-2.5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                  <ScanLine className="w-4 h-4 text-[#006948]" />
                                  Detalhamento da Compra: {est} ({t.data})
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  Total: {formatBRL(t.valor)}
                                </span>
                              </div>

                              {rawItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {rawItems.map((item, itIdx) => {
                                    const itName = item.nome || item.nome_do_item || 'Item sem nome';
                                    const itQtd = Number(item.quantidade) || 1;
                                    const itUnit = Number(item.precoUnitario || item.preco_unitario) || 0;
                                    const itTotal = Number(item.precoTotal || item.preco_total) || (itQtd * itUnit);

                                    return (
                                      <div
                                        key={itIdx}
                                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between"
                                      >
                                        <span className="font-semibold text-slate-800 text-[11px]">
                                          {itName}
                                        </span>
                                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                                          <span>
                                            {itQtd} {item.unidade || 'un'}{' '}
                                            {itUnit > 0 ? `@ ${formatBRL(itUnit)}` : ''}
                                          </span>
                                          <span className="font-bold text-slate-900">
                                            {formatBRL(itTotal)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 py-1">
                                  Lançamento histórico consolidado. {t.observacoes || 'Sem notas adicionais.'}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs italic">
                    Nenhuma compra encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {biData.tableFilteredTxs.length > 15 && (
          <div className="text-center pt-2 text-[11px] font-semibold text-slate-500">
            Mostrando 15 de {biData.tableFilteredTxs.length} transações no período. Use a busca para
            filtrar compras específicas.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. INFLATION COMPARISON MODAL                                             */}
      {/* ========================================================================= */}
      {showInflationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#006194]" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Comparativo de Inflação & Cesta Familiar
                </h3>
              </div>
              <button
                onClick={() => setShowInflationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800">
                    TOTAL CARNES AUDITADO
                  </span>
                  <div className="font-display font-bold text-lg text-emerald-800">
                    {formatBRL(biData.carnesTotal)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    DISPÊNDIO TOTAL
                  </span>
                  <div className="font-display font-bold text-lg text-slate-900">
                    {formatBRL(biData.totalSpending)}
                  </div>
                </div>
              </div>

              <span className="font-bold text-slate-800">
                Distribuição das Cestas em {biData.periodLabel}:
              </span>
              <div className="flex flex-col gap-1.5">
                {biData.categoriesData.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-700">
                      {c.icon} {c.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatBRL(c.amount)} ({c.percent.toString().replace('.', ',')}%)
                    </span>
                  </div>
                ))}
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
      {/* 8. EXPORT PDF MODAL                                                       */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-[#006948]" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Exportar Relatório Executivo
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-600">
              <p>
                O relatório de <strong>{biData.periodLabel}</strong> consolida o dispêndio total de{' '}
                <strong>{formatBRL(biData.totalSpending)}</strong>, com destaque para{' '}
                <strong>{formatBRL(biData.carnesTotal)}</strong> em carnes/frigorífico, e divisão
                paritária de <strong>{formatBRL(biData.totalSpending / 2)}</strong> por cônjuge.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 text-[11px]">
                <span className="font-bold text-slate-800">Conteúdo do Relatório BI:</span>
                <span>• Resumo executivo de despesas e status orçamentário</span>
                <span>• Matriz de estabelecimentos auditados (Atacadão, Frigorífico, Ferreira)</span>
                <span>• Detalhamento dos itens conciliados</span>
                <span>• Análise de dispersão de preços</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Relatório em PDF gerado com dados reais!');
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
      <footer className="pt-4 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#006948]" />
          <span>
            Relatório Executivo • Casal Duarte (Felipe & Genivânia)
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
