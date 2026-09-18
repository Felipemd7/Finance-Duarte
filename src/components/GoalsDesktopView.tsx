import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Pencil,
  Trash2,
  X,
  Target,
  Plane,
  BookOpen,
  Heart,
  Home,
  Briefcase,
  Wrench,
  Shield,
  Percent,
} from 'lucide-react';
import { FinancialGoal, FuelLog, Transaction } from '../types';
import { INITIAL_FUEL_LOGS } from '../data/initialData';
import { formatBRL, getCurrentMonthName, getCurrentMonthCode } from '../utils/formatters';
import { FuelManagementSection } from './FuelManagementSection';

export interface BudgetCategoryItem {
  id: string;
  name: string;
  spent: number;
  limit: number;
  icon: string;
  note: string;
  alertPercent?: number;
  type: 'expense' | 'saving';
  isCustom?: boolean;
}

export interface CarPlanningItem {
  id: string;
  title: string;
  amount: number;
  badge: string;
  subtext: string;
  spent?: number;
  data?: string;
  type: 'quota' | 'annual' | 'ceiling' | 'monthly';
}

interface GoalsDesktopViewProps {
  isReclassified: boolean;
  onToggleReclassification: () => void;
  onShowToast: (msg: string) => void;
  onOpenAddGoal: () => void;
  goals?: FinancialGoal[];
  transactions?: Transaction[];
  selectedMonth?: string;
  onAddGoal?: (goal: FinancialGoal) => void;
  onUpdateGoal?: (goal: FinancialGoal) => void;
  onDeleteGoal?: (id: string) => void;
  fuelLogs?: FuelLog[];
  onAddFuelLog?: (log: FuelLog) => void;
  onUpdateFuelLog?: (log: FuelLog) => void;
  onDeleteFuelLog?: (id: string) => void;
}

const DEFAULT_CATEGORIES: BudgetCategoryItem[] = [
  {
    id: 'supermercado',
    name: 'Supermercado & Feira',
    spent: 0,
    limit: 2500,
    icon: 'cart',
    note: '',
    alertPercent: 85,
    type: 'expense',
  },
  {
    id: 'lazer',
    name: 'Lazer & Gastronomia',
    spent: 0,
    limit: 1200,
    icon: 'utensils',
    note: '',
    alertPercent: 85,
    type: 'expense',
  },
  {
    id: 'combustivel',
    name: 'Combustível Mensal',
    spent: 0,
    limit: 800,
    icon: 'fuel',
    note: '',
    alertPercent: 85,
    type: 'expense',
  },
  {
    id: 'farmacia',
    name: 'Farmácia & Cuidados',
    spent: 0,
    limit: 450,
    icon: 'pill',
    note: '',
    alertPercent: 85,
    type: 'expense',
  },
  {
    id: 'reserva',
    name: 'Reserva & Investimentos',
    spent: 0,
    limit: 3500,
    icon: 'piggy',
    note: '',
    alertPercent: 85,
    type: 'saving',
  },
];

const DEFAULT_CAR_COSTS: CarPlanningItem[] = [];

export const GoalsDesktopView: React.FC<GoalsDesktopViewProps> = ({
  isReclassified,
  onToggleReclassification,
  onShowToast,
  goals = [],
  transactions = [],
  selectedMonth = getCurrentMonthName(),
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  fuelLogs: propFuelLogs,
  onAddFuelLog: propAddFuelLog,
  onUpdateFuelLog: propUpdateFuelLog,
  onDeleteFuelLog: propDeleteFuelLog,
}) => {
  // Converte nome do mês para código 'YYYY-MM'
  const activeMonthCode = useMemo(() => {
    if (!selectedMonth) return getCurrentMonthCode();
    const match = selectedMonth.match(/(\d{4})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
    const monthsMap: Record<string, string> = {
      janeiro: '2026-01',
      fevereiro: '2026-02',
      março: '2026-03',
      marco: '2026-03',
      abril: '2026-04',
      maio: '2026-05',
      junho: '2026-06',
      julho: '2026-07',
      agosto: '2026-08',
      setembro: '2026-09',
      outubro: '2026-10',
      novembro: '2026-11',
      dezembro: '2026-12',
    };
    const lower = selectedMonth.toLowerCase();
    for (const [name, code] of Object.entries(monthsMap)) {
      if (lower.includes(name)) return code;
    }
    return getCurrentMonthCode();
  }, [selectedMonth]);

  // Transações do mês ativo
  const monthTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.filter(
      (t) => (t.mesReferencia === activeMonthCode || (t.data && t.data.startsWith(activeMonthCode))) && t.tipo === 'despesa'
    );
  }, [transactions, activeMonthCode]);

  // Cálculo 100% automático do gasto real da categoria no banco Supabase
  const calculateRealSpent = useCallback((cat: BudgetCategoryItem): number => {
    const nameLower = (cat.name + ' ' + (cat.id || '')).toLowerCase();

    if (nameLower.includes('reserva') || nameLower.includes('investimento') || nameLower.includes('poupança') || cat.type === 'saving') {
      return 0; // Removido saldo fictício, investimentos refletem apenas aportes reais
    }

    if (!monthTransactions || monthTransactions.length === 0) return 0;

    const filtered = monthTransactions.filter((t) => {
      const sub = (t.subcategoria || '').toLowerCase();
      const catName = (t.categoria || '').toLowerCase();

      if (nameLower.includes('supermercado') || nameLower.includes('feira')) {
        return sub.includes('supermercado') || sub.includes('feira') || sub.includes('alimento');
      }
      if (nameLower.includes('lazer') || nameLower.includes('gastronomia') || nameLower.includes('restaurante')) {
        return sub.includes('lazer') || sub.includes('restaurante') || sub.includes('jantar');
      }
      if (nameLower.includes('combustivel') || nameLower.includes('combustível') || nameLower.includes('posto')) {
        return (sub.includes('combust') || sub.includes('posto')) && !sub.includes('uber');
      }
      if (nameLower.includes('uber') || nameLower.includes('transporte app') || nameLower.includes('mobilidade')) {
        return sub.includes('uber');
      }
      if (nameLower.includes('farmacia') || nameLower.includes('farmácia') || nameLower.includes('cuidados') || nameLower.includes('saude') || nameLower.includes('saúde')) {
        return sub.includes('farm') || sub.includes('saude') || sub.includes('saúde');
      }
      if (nameLower.includes('moradia') || nameLower.includes('aluguel') || nameLower.includes('condominio')) {
        return sub.includes('aluguel') || sub.includes('condominio') || sub.includes('condomínio');
      }
      if (nameLower.includes('carro') || nameLower.includes('veiculo') || nameLower.includes('veículo')) {
        return (sub.includes('carro') || sub.includes('manuten') || sub.includes('seguro') || sub.includes('rastreador') || sub.includes('combust')) && !sub.includes('uber');
      }
      return sub.includes(cat.id.toLowerCase()) || sub.includes(cat.name.toLowerCase());
    });

    return filtered.reduce((acc, t) => acc + t.valor, 0);
  }, [monthTransactions]);
  // Budget Categories State
  const [categories, setCategories] = useState<BudgetCategoryItem[]>(() => {
    const saved = localStorage.getItem('duarte_desktop_categories');
    if (saved) {
      try {
        const parsed: BudgetCategoryItem[] = JSON.parse(saved);
        // Higieniza qualquer resquício de saldo ou texto estático mockado
        return parsed.map((c) => ({
          ...c,
          spent: (c.type === 'saving' || c.id === 'reserva' || (c.name && c.name.toLowerCase().includes('reserva'))) ? 0 : (c.spent || 0),
          alertPercent: c.alertPercent || 85,
          note:
            c.note &&
            (c.note.includes('não essenciais') ||
              c.note.includes('dias no ciclo') ||
              c.note.includes('regular e controlado') ||
              c.note.includes('imprevistos médicos') ||
              c.note.includes('atingida!'))
              ? ''
              : c.note || '',
        }));
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('duarte_desktop_categories', JSON.stringify(categories));
  }, [categories]);

  // Car Costs State
  const [carCosts, setCarCosts] = useState<CarPlanningItem[]>(() => {
    const saved = localStorage.getItem('duarte_car_costs');
    if (saved) {
      try {
        const parsed: CarPlanningItem[] = JSON.parse(saved);
        return parsed.map((c) => ({
          ...c,
          title: c.title.replace('(SP)', '(PI)'),
        }));
      } catch {}
    }
    return DEFAULT_CAR_COSTS;
  });

  useEffect(() => {
    localStorage.setItem('duarte_car_costs', JSON.stringify(carCosts));
  }, [carCosts]);

  // Fuel Logs State (Telemetria, Odômetro & Comprovantes)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    if (propFuelLogs && propFuelLogs.length > 0) return propFuelLogs;
    const saved = localStorage.getItem('duarte_fuel_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_FUEL_LOGS;
  });

  useEffect(() => {
    if (propFuelLogs && propFuelLogs.length > 0) {
      setFuelLogs(propFuelLogs);
      localStorage.setItem('duarte_fuel_logs', JSON.stringify(propFuelLogs));
    }
  }, [propFuelLogs]);

  useEffect(() => {
    localStorage.setItem('duarte_fuel_logs', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  const handleAddFuelLog = (log: FuelLog) => {
    setFuelLogs((prev) => [...prev, log]);
    if (propAddFuelLog) propAddFuelLog(log);
  };

  const handleUpdateFuelLog = (log: FuelLog) => {
    setFuelLogs((prev) => prev.map((item) => (item.id === log.id ? log : item)));
    if (propUpdateFuelLog) propUpdateFuelLog(log);
  };

  const handleDeleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((item) => item.id !== id));
    if (propDeleteFuelLog) propDeleteFuelLog(id);
  };

  // Modal States
  const [editingCategory, setEditingCategory] = useState<BudgetCategoryItem | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [editingCarCost, setEditingCarCost] = useState<CarPlanningItem | null>(null);
  const [isNewCarCostModalOpen, setIsNewCarCostModalOpen] = useState(false);

  // States para Metas Financeiras Reais do Casal (Supabase)
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalType, setGoalType] = useState<'economia' | 'gasto'>('economia');
  const [goalPeriod, setGoalPeriod] = useState<'mensal' | 'anual' | 'unico'>('mensal');
  const [goalUser, setGoalUser] = useState<'usr-felipe' | 'usr-genivania' | 'casal'>('casal');
  const [goalDescription, setGoalDescription] = useState('');

  // Quick Deposit Modal
  const [depositModalGoal, setDepositModalGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Forms State for Category
  const [catName, setCatName] = useState('');
  const [catLimit, setCatLimit] = useState('');
  const [catAlertPercent, setCatAlertPercent] = useState('85');
  const [catNote, setCatNote] = useState('');
  const [catIcon, setCatIcon] = useState('cart');
  const [catType, setCatType] = useState<'expense' | 'saving'>('expense');

  // Form State for Car Cost
  const [carTitle, setCarTitle] = useState('');
  const [carAmount, setCarAmount] = useState('');
  const [carSpent, setCarSpent] = useState('');
  const [carDate, setCarDate] = useState('');
  const [carBadge, setCarBadge] = useState('');
  const [carSubtext, setCarSubtext] = useState('');

  // Total Forecast Calculation (100% Automático baseado nas despesas reais das categorias)
  const totalSpent = categories
    .filter((c) => c.type !== 'saving')
    .reduce((sum, c) => sum + calculateRealSpent(c), 0);

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: BudgetCategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatLimit(cat.limit.toString());
    setCatAlertPercent((cat.alertPercent || 85).toString());
    setCatNote(cat.note || '');
    setCatIcon(cat.icon);
    setCatType(cat.type);
  };

  // Save Edited Category
  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const numLimit = parseFloat(catLimit.replace(',', '.')) || 0;
    const numAlert = parseInt(catAlertPercent, 10) || 85;
    const currentRealSpent = calculateRealSpent(editingCategory);

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: catName.trim() || c.name,
              limit: numLimit,
              alertPercent: numAlert,
              spent: currentRealSpent,
              note: catNote.trim(),
              icon: catIcon,
              type: catType,
            }
          : c
      )
    );

    setEditingCategory(null);
    onShowToast(`Teto da categoria "${catName}" atualizado com sucesso!`);
  };

  // Delete Category
  const handleDeleteCategory = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta categoria de teto orçamentário?')) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setEditingCategory(null);
      onShowToast('Categoria removida do painel.');
    }
  };

  // Open Create Category Modal
  const handleOpenNewCategory = () => {
    setCatName('');
    setCatLimit('1000');
    setCatAlertPercent('85');
    setCatNote('');
    setCatIcon('cart');
    setCatType('expense');
    setIsNewCategoryModalOpen(true);
  };

  // Save New Category
  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const numLimit = parseFloat(catLimit.replace(',', '.')) || 1000;
    const numAlert = parseInt(catAlertPercent, 10) || 85;

    const newCat: BudgetCategoryItem = {
      id: 'cat-' + Date.now(),
      name: catName.trim(),
      limit: numLimit,
      alertPercent: numAlert,
      spent: 0,
      note: catNote.trim(),
      icon: catIcon,
      type: catType,
      isCustom: true,
    };

    setCategories((prev) => [...prev, newCat]);
    setIsNewCategoryModalOpen(false);
    onShowToast(`Nova categoria "${newCat.name}" adicionada ao orçamento!`);
  };

  // Open Edit Car Cost
  const handleOpenEditCarCost = (item: CarPlanningItem) => {
    setEditingCarCost(item);
    setCarTitle(item.title);
    setCarAmount(item.amount.toString());
    setCarSpent(item.spent ? item.spent.toString() : '');
    setCarDate(item.data || '');
    setCarBadge(item.badge);
    setCarSubtext(item.subtext);
  };

  // Save Car Cost Edit
  const handleSaveCarCostEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarCost) return;

    const amt = parseFloat(carAmount.replace(',', '.')) || 0;
    const sp = carSpent ? parseFloat(carSpent.replace(',', '.')) : undefined;

    setCarCosts((prev) =>
      prev.map((c) =>
        c.id === editingCarCost.id
          ? {
              ...c,
              title: carTitle.trim(),
              amount: amt,
              spent: sp,
              data: carDate ? carDate.trim() : undefined,
              badge: carBadge.trim(),
              subtext: carSubtext.trim(),
            }
          : c
      )
    );

    setEditingCarCost(null);
    onShowToast(`Item do veículo "${carTitle}" atualizado!`);
  };

  // Delete Car Cost
  const handleDeleteCarCost = (id: string) => {
    const item = carCosts.find((c) => c.id === id);
    if (confirm(`Deseja remover o custo planejado "${item?.title || 'este custo'}"?`)) {
      setCarCosts((prev) => prev.filter((c) => c.id !== id));
      setEditingCarCost(null);
      onShowToast('Custo removido do planejamento.');
    }
  };

  // Open Add Car Cost Modal
  const handleOpenNewCarCost = () => {
    setCarTitle('');
    setCarAmount('');
    setCarSpent('');
    setCarDate(new Date().toISOString().split('T')[0]);
    setCarBadge('Planejado');
    setCarSubtext('Despesa do Veículo');
    setIsNewCarCostModalOpen(true);
  };

  // Save New Car Cost
  const handleSaveNewCarCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carTitle.trim()) return;

    const amt = parseFloat(carAmount.replace(',', '.')) || 0;
    const sp = carSpent ? parseFloat(carSpent.replace(',', '.')) : undefined;

    const newCarItem: CarPlanningItem = {
      id: 'car-' + Date.now(),
      title: carTitle.trim(),
      amount: amt,
      spent: sp,
      data: carDate ? carDate.trim() : undefined,
      badge: carBadge.trim() || 'Planejado',
      subtext: carSubtext.trim() || 'Despesa do Veículo',
      type: 'annual',
    };

    setCarCosts((prev) => [...prev, newCarItem]);
    setIsNewCarCostModalOpen(false);
    onShowToast(`Custo "${newCarItem.title}" adicionado ao planejamento do veículo!`);
  };

  // =========================================================================
  // HANDLERS: Metas Financeiras do Casal (Sincronizadas com Supabase)
  // =========================================================================
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalType('economia');
    setGoalPeriod('mensal');
    setGoalUser('casal');
    setGoalDescription('');
    setIsNewGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.titulo || '');
    setGoalTarget(String(goal.valorPlanejado || goal.valorAlvo || ''));
    setGoalCurrent(String(goal.valorAtual || '0'));
    setGoalType((goal.tipoMeta === 'gasto' || goal.tipo === 'teto_gasto') ? 'gasto' : 'economia');
    setGoalPeriod((goal.periodo as any) || 'mensal');
    setGoalUser((goal.usuarioId === 'usr-felipe' ? 'usr-felipe' : goal.usuarioId === 'usr-genivania' ? 'usr-genivania' : 'casal'));
    setGoalDescription(goal.descricao || '');
    setIsNewGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const targetVal = parseFloat(goalTarget.replace(',', '.')) || 0;
    const currentVal = parseFloat(goalCurrent.replace(',', '.')) || 0;

    if (editingGoal) {
      const updated: FinancialGoal = {
        ...editingGoal,
        titulo: goalTitle.trim(),
        valorPlanejado: targetVal,
        valorAlvo: targetVal,
        valorAtual: currentVal,
        tipoMeta: goalType,
        tipo: goalType === 'gasto' ? 'teto_gasto' : 'economia_poupanca',
        periodo: goalPeriod,
        usuarioId: goalUser,
        descricao: goalDescription.trim() || undefined,
      };
      if (onUpdateGoal) onUpdateGoal(updated);
      onShowToast(`Meta "${updated.titulo}" atualizada com sucesso!`);
    } else {
      const newGoal: FinancialGoal = {
        id: 'goal-' + Date.now(),
        titulo: goalTitle.trim(),
        valorPlanejado: targetVal,
        valorAlvo: targetVal,
        valorAtual: currentVal,
        tipoMeta: goalType,
        tipo: goalType === 'gasto' ? 'teto_gasto' : 'economia_poupanca',
        periodo: goalPeriod,
        usuarioId: goalUser,
        descricao: goalDescription.trim() || undefined,
        alertaPercentual: 85,
      };
      if (onAddGoal) onAddGoal(newGoal);
      onShowToast(`Meta "${newGoal.titulo}" criada com sucesso!`);
    }

    setIsNewGoalModalOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoalAction = (id: string, titulo: string) => {
    if (confirm(`Deseja realmente remover a meta "${titulo}"?`)) {
      if (onDeleteGoal) onDeleteGoal(id);
      onShowToast(`Meta "${titulo}" removida.`);
    }
  };

  const handleOpenDepositModal = (goal: FinancialGoal) => {
    setDepositModalGoal(goal);
    setDepositAmount('');
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal) return;
    const addAmt = parseFloat(depositAmount.replace(',', '.')) || 0;
    if (addAmt <= 0) return;

    const newCurrent = (depositModalGoal.valorAtual || 0) + addAmt;
    const updated: FinancialGoal = {
      ...depositModalGoal,
      valorAtual: newCurrent,
    };

    if (onUpdateGoal) onUpdateGoal(updated);
    setDepositModalGoal(null);
    onShowToast(`Aporte de ${formatBRL(addAmt)} registrado na meta "${updated.titulo}"!`);
  };

  // Helper to render icon for category
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'cart':
        return <ShoppingCart className="w-4 h-4" />;
      case 'utensils':
        return <Utensils className="w-4 h-4" />;
      case 'fuel':
        return <Fuel className="w-4 h-4" />;
      case 'pill':
        return <Pill className="w-4 h-4" />;
      case 'piggy':
        return <PiggyBank className="w-4 h-4" />;
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'plane':
        return <Plane className="w-4 h-4" />;
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'heart':
        return <Heart className="w-4 h-4" />;
      case 'home':
        return <Home className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div id="metas-desktop-view" className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-0 pb-12">
      {/* ========================================================================= */}
      {/* TOP HEADER: Breadcrumbs, Title, Rateio Card & Actions                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e5eeff]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#565e74] font-medium">Exercício Financeiro {selectedMonth}</span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-[#0b1c30] tracking-tight">
            Metas, Veículo & Automações
          </h1>
          <p className="text-xs lg:text-sm text-[#565e74] mt-1.5 max-w-2xl leading-relaxed">
            Controle tático compartilhado do casal Duarte. Clique no ícone de lápis em qualquer card para editar valores ou adicione novos tetos e metas com os botões dedicados.
          </p>
        </div>

        {/* Right: Actions & Couple Rateio Card */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleOpenNewGoal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#006948] text-white hover:bg-[#005a3c] text-xs font-bold shadow-[0_4px_14px_rgba(0,105,72,0.25)] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Meta do Casal</span>
          </button>

          <button
            onClick={handleOpenNewCategory}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#f0fdf4] text-[#006948] border border-[#bbf7d0] hover:bg-[#dcfce7] text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Teto / Categoria</span>
          </button>

          <div className="bg-white rounded-2xl p-2 px-3 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center gap-2.5">
            <div className="flex items-center -space-x-2">
              <div
                className="w-7 h-7 rounded-full bg-[#2563eb] text-white font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-2xs"
                title="Felipe Duarte"
              >
                F
              </div>
              <div
                className="w-7 h-7 rounded-full bg-[#ec4899] text-white font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-2xs"
                title="Genivânia Duarte"
              >
                G
              </div>
            </div>
            <div className="text-left pr-1">
              <span className="text-xs font-bold text-[#0b1c30] block leading-tight">
                Casal Duarte
              </span>
              <span className="text-[10px] text-[#006948] font-medium block leading-tight">
                Felipe & Genivânia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: METAS FINANCEIRAS & POUPANÇA REAL DO CASAL (SUPABASE)   */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              PATRIMÔNIO & OBJETIVOS
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <h2 className="font-display font-bold text-lg text-[#0b1c30] flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-[#006948]" />
                <span>Metas Financeiras & Poupança do Casal</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[10px] font-bold border border-[#a7f3d0]">
                {goals.length} metas ativas
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenNewGoal}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ecfdf5] hover:bg-[#dcfce7] text-[#006948] text-xs font-bold border border-[#a7f3d0] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Meta</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-3xl bg-white border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#0b1c30]">Nenhuma meta cadastrada no momento</h4>
            <p className="text-xs text-[#565e74] max-w-md mt-1 mb-4">
              Crie metas conjuntas para reservas de emergência, viagens, investimentos ou aquisições da família Duarte.
            </p>
            <button
              onClick={handleOpenNewGoal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006948] text-white text-xs font-bold hover:bg-[#005a3c] cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Meta</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const target = g.valorPlanejado || g.valorAlvo || 1;
              const current = g.valorAtual || 0;
              const pct = Math.min(100, Math.round((current / target) * 100));
              const remaining = Math.max(0, target - current);
              const isDone = current >= target && target > 0;
              const isSaving = g.tipoMeta === 'economia' || g.tipo === 'economia_poupanca';

              const responsibleLabel =
                g.usuarioId === 'usr-felipe' ? 'Felipe' : g.usuarioId === 'usr-genivania' ? 'Genivânia' : 'Casal Duarte';

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between relative group hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header do Card da Meta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSaving ? 'bg-[#ecfdf5] text-[#006948]' : 'bg-[#eff4ff] text-[#006194]'
                        }`}>
                          {isSaving ? <PiggyBank className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-xs sm:text-sm text-[#0b1c30] truncate" title={g.titulo}>
                            {g.titulo}
                          </h3>
                          <span className="text-[10px] text-[#565e74]">
                            {responsibleLabel} • {g.periodo || 'Mensal'}
                          </span>
                        </div>
                      </div>

                      {/* Ações: Editar e Excluir */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditGoal(g)}
                          className="p-1 rounded-lg text-[#565e74] hover:text-[#006948] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                          title="Editar meta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoalAction(g.id, g.titulo)}
                          className="p-1 rounded-lg text-[#565e74] hover:text-[#ba1a1a] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                          title="Excluir meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Valores: Atual / Alvo */}
                    <div className="flex items-baseline justify-between gap-2 mt-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#565e74] block">
                          Acumulado / Atual
                        </span>
                        <span className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] font-mono">
                          {formatBRL(current)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#565e74] block">
                          Alvo Planejado
                        </span>
                        <span className="text-xs font-semibold text-[#565e74] font-mono">
                          {formatBRL(target)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone ? 'bg-[#005a3c]' : 'bg-[#006948]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Status e Faltante */}
                    <div className="flex items-center justify-between text-[11px] text-[#565e74] mt-1.5">
                      <span className="font-bold text-[#006948]">
                        {isDone ? '✓ Meta Conquistada!' : `${pct}% concluído`}
                      </span>
                      {!isDone && (
                        <span>Faltam {formatBRL(remaining)}</span>
                      )}
                    </div>

                    {g.descricao && (
                      <p className="text-[11px] text-[#565e74] mt-2 pt-2 border-t border-[#f1f5f9] line-clamp-2" title={g.descricao}>
                        {g.descricao}
                      </p>
                    )}
                  </div>

                  {/* Botão de Aporte Rápido */}
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                    <span className="text-[10px] text-[#565e74]">
                      {isSaving ? 'Poupança / Investimento' : 'Teto de Despesa'}
                    </span>
                    <button
                      onClick={() => handleOpenDepositModal(g)}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#006948] text-xs font-bold border border-[#bbf7d0] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Aporte / Ajuste</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CAPACIDADE & TETOS MENSAIS -> Orçamento Compartilhado          */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              CAPACIDADE & TETOS MENSAIS
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <h2 className="font-display font-bold text-lg text-[#0b1c30]">
                Orçamento Compartilhado por Categoria
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8faff] hover:bg-[#eff4ff] text-[#006948] text-xs font-bold border border-[#dce9ff] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Categoria</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold border border-[#dce9ff]">
              <TrendingUp className="w-3.5 h-3.5 text-[#006194]" />
              <span>Previsão Fechamento: {formatBRL(totalSpent)}</span>
            </div>
          </div>
        </div>

        {/* Category Budget Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => {
              const realSpent = calculateRealSpent(cat);
              const limit = cat.limit || 1;
              const consumedPct = Math.round((realSpent / limit) * 100);
              const diff = realSpent - cat.limit;
              const excessPct = cat.limit > 0 ? Math.round(((realSpent - cat.limit) / cat.limit) * 100) : 0;
              const threshold = cat.alertPercent || 85;
              const isExceeded = cat.type === 'expense' && realSpent > cat.limit;
              const isWarning = cat.type === 'expense' && !isExceeded && consumedPct >= threshold;
              const isSavingOver = cat.type === 'saving' && realSpent >= cat.limit && cat.limit > 0;

              // Mensagem dinâmica de alerta e status baseada na realidade dos gastos
              const dynamicStatusText = isExceeded
                ? `Teto excedido em ${formatBRL(diff)}`
                : isWarning
                ? `Alerta: ${consumedPct}% consumido (Gatilho ${threshold}%)`
                : cat.type === 'saving'
                ? (realSpent > 0 ? (isSavingOver ? `Meta atingida (${formatBRL(realSpent)})` : `Poupança em andamento (${consumedPct}%)`) : `Meta planejada: ${formatBRL(cat.limit)}`)
                : `${formatBRL(Math.abs(diff))} livres no mês`;

              const footerText = cat.note ? `${cat.note} • ${dynamicStatusText}` : dynamicStatusText;

              // Styles based on status
              let badgeColor = 'bg-[#dcfce7] text-[#006948]';
              let badgeText = `${consumedPct}% Seguro`;
              let iconBg = 'bg-[#ecfdf5] text-[#006948]';
              let barColor = 'bg-[#006948]';
              let borderColor = 'border-[#e5eeff]';

              if (cat.type === 'saving') {
                if (realSpent === 0) {
                  badgeColor = 'bg-[#f1f5f9] text-[#64748b]';
                  badgeText = '0% Planejado';
                  iconBg = 'bg-[#f1f5f9] text-[#64748b]';
                  barColor = 'bg-[#cbd5e1]';
                  borderColor = 'border-[#e2e8f0]';
                } else {
                  badgeColor = isSavingOver ? 'bg-[#005a3c] text-white' : 'bg-[#dcfce7] text-[#006948]';
                  badgeText = isSavingOver ? `+${excessPct}% Superado` : `${consumedPct}% Guardado`;
                  iconBg = 'bg-[#dcfce7] text-[#006948]';
                  barColor = 'bg-[#005a3c]';
                  borderColor = isSavingOver ? 'border-[#bbf7d0]' : 'border-[#e5eeff]';
                }
              } else if (isExceeded) {
                badgeColor = 'bg-[#fee2e2] text-[#dc2626]';
                badgeText = `+${excessPct}% Excedido`;
                iconBg = 'bg-[#fee2e2] text-[#dc2626]';
                barColor = 'bg-[#dc2626]';
                borderColor = 'border-[#fee2e2]';
              } else if (isWarning) {
                badgeColor = 'bg-[#ede9fe] text-[#7c3aed]';
                badgeText = `${consumedPct}% Atenção`;
                iconBg = 'bg-[#ede9fe] text-[#7c3aed]';
                barColor = 'bg-[#7c3aed]';
              } else if (consumedPct >= 80) {
                badgeColor = 'bg-[#ccfbf1] text-[#0d9488]';
                badgeText = `${consumedPct}% Equilibrado`;
                iconBg = 'bg-[#ccfbf1] text-[#0d9488]';
                barColor = 'bg-[#0d9488]';
              }

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-2xl p-4 border ${borderColor} shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between relative group hover:shadow-md transition-shadow`}
                >
                  <div>
                    {/* Top Row: Icon, Badge & Edit Button */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
                        {renderCategoryIcon(cat.icon)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1 rounded-lg text-[#565e74] hover:text-[#006948] hover:bg-[#eff4ff] cursor-pointer transition-colors"
                          title="Editar teto ou gastos"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-[#565e74] block truncate">
                      {cat.name}
                    </span>
                    <div className="font-display font-extrabold text-xl text-[#0b1c30] font-mono mt-1">
                      {formatBRL(realSpent)}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#565e74] mt-1">
                      <span>Meta: {formatBRL(cat.limit)}</span>
                      {diff > 0 ? (
                        <span className="font-bold text-[#dc2626]">+{formatBRL(diff)}</span>
                      ) : (
                        <span className="text-[#006948] font-semibold">
                          {formatBRL(Math.abs(diff))} livre
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                    <div className="w-full bg-[#e5eeff] h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(consumedPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#565e74] truncate">
                      {isExceeded ? (
                        <AlertTriangle className="w-3 h-3 text-[#dc2626] shrink-0" />
                      ) : isWarning ? (
                        <Clock className="w-3 h-3 text-[#7c3aed] shrink-0" />
                      ) : cat.type === 'saving' && isSavingOver ? (
                        <ArrowUpRight className="w-3 h-3 text-[#006948] shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-[#006948] shrink-0" />
                      )}
                      <span className="truncate" title={footerText}>{footerText}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PATRIMÔNIO & MOBILIDADE -> Gestão do Carro & Custos Reais      */}
      {/* ========================================================================= */}
      <div className="mb-10 flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006194] block">
              PATRIMÔNIO & MOBILIDADE
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Gestão do Carro & Custos Reais por KM • 2026
            </h2>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[#f1f5f9] text-[#565e74] text-xs font-semibold border border-[#e2e8f0]">
            Veículo: Jeep Compass Longitude Turbo • Placa: DUA-2026
          </div>
        </div>

        {/* 1. Planejamento & Custos Fixos (Subcards de Provisão / Gastos com o Veículo) */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Planejamento & Custos do Veículo
                </h3>
                <span className="text-[11px] font-semibold text-[#006948] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                  Manual & Personalizável
                </span>
              </div>
              <p className="text-xs text-[#565e74] mt-0.5">
                {carCosts.length > 0
                  ? `Total registrado: ${formatBRL(carCosts.reduce((acc, c) => acc + c.amount, 0))}`
                  : 'Nenhum custo cadastrado ainda. Adicione seus gastos reais como peças, oficina, IPVA ou troca de pneus.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNewCarCost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006948] text-white text-xs font-bold hover:bg-[#005a3c] shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Custo</span>
              </button>
            </div>
          </div>

          {carCosts.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-[#f8faff] border border-dashed border-[#dce9ff] flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#006194] flex items-center justify-center mb-2">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#0b1c30]">Nenhum custo fixo ou manutenção registrada</h4>
              <p className="text-[11px] text-[#565e74] max-w-md mt-1 mb-3">
                Registre manualmente seus gastos reais como peças, manutenção na oficina, IPVA, troca de pneus, seguro ou taxas.
              </p>
              <button
                onClick={handleOpenNewCarCost}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-semibold hover:bg-[#004f7a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Primeiro Custo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {carCosts.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] relative group hover:border-[#006194]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b1c30] truncate pr-2" title={item.title}>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#006948] text-[10px] font-bold">
                        {item.badge}
                      </span>
                      <button
                        onClick={() => handleOpenEditCarCost(item)}
                        className="p-1 rounded text-[#565e74] hover:text-[#006194] hover:bg-white cursor-pointer"
                        title="Editar custo"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCarCost(item.id)}
                        className="p-1 rounded text-[#565e74] hover:text-[#ba1a1a] hover:bg-white cursor-pointer"
                        title="Excluir custo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="font-display font-extrabold text-lg text-[#0b1c30] font-mono mt-1.5">
                    {item.spent ? (
                      <>
                        {formatBRL(item.spent)}{' '}
                        <span className="text-xs font-normal text-[#565e74]">gastos</span>
                      </>
                    ) : (
                      formatBRL(item.amount)
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#565e74]">
                    <span className="truncate pr-1" title={item.subtext}>
                      {item.subtext}
                    </span>
                    {item.data && (
                      <span className="shrink-0 font-medium text-[#006194] bg-[#eff4ff] px-1.5 py-0.5 rounded text-[9px]">
                        {item.data.split('-').reverse().join('/')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Custo Real por KM, Abastecimentos, Odômetro & Consumo (Diário, Semanal e Mensal) */}
        <FuelManagementSection
          fuelLogs={fuelLogs}
          onAddFuelLog={handleAddFuelLog}
          onUpdateFuelLog={handleUpdateFuelLog}
          onDeleteFuelLog={handleDeleteFuelLog}
          onShowToast={onShowToast}
          veiculoInfo="Jeep Compass Longitude Turbo • Placa DUA-2026"
          custosFixosRateadosKm={0.53}
        />
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HEALTH BAR                                                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center justify-between flex-wrap gap-3 text-xs text-[#565e74]">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-[#006948]" />
          <span className="font-bold text-[#0b1c30]">Planejamento Financeiro:</span>
          <span className="text-[#565e74]">
            Felipe Duarte & Genivânia Duarte
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>© 2026 Duarte Finanças</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT CATEGORY BUDGET                                               */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    Editar Teto: {editingCategory.name}
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    Ajuste o limite e os gastos desta categoria
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit} className="flex flex-col gap-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Meta / Teto Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={catLimit}
                  onChange={(e) => setCatLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                  required
                />
              </div>

              {/* Informação do Gasto Real Automático */}
              <div className="bg-[#f8faff] border border-[#e5eeff] rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#565e74] font-medium block">
                    Gasto Realizado no Mês ({selectedMonth})
                  </span>
                  <span className="font-display font-extrabold text-base text-[#0b1c30] font-mono">
                    {formatBRL(calculateRealSpent(editingCategory))}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#006948] border border-[#a7f3d0]">
                  <CheckCircle2 className="w-3 h-3" />
                  Calculado do Extrato
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Gatilho de Alerta (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="100"
                      step="5"
                      value={catAlertPercent}
                      onChange={(e) => setCatAlertPercent(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-[#565e74]">%</span>
                  </div>
                  <span className="text-[10px] text-[#565e74] mt-0.5 block">Disparar aviso ao atingir esta %</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Lembrete / Nota (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Priorizar compras no atacado"
                    value={catNote}
                    onChange={(e) => setCatNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                  />
                  <span className="text-[10px] text-[#565e74] mt-0.5 block">Lembrete pessoal para o casal</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Tipo de Meta
                  </label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as 'expense' | 'saving')}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="expense">Teto de Despesa</option>
                    <option value="saving">Reserva / Poupança</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Ícone
                  </label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="cart">Supermercado (Carrinho)</option>
                    <option value="utensils">Lazer (Restaurante)</option>
                    <option value="fuel">Combustível (Posto)</option>
                    <option value="pill">Farmácia (Pílula)</option>
                    <option value="piggy">Reserva (Porquinho)</option>
                    <option value="car">Carro (Automóvel)</option>
                    <option value="plane">Viagem (Avião)</option>
                    <option value="book">Educação (Livro)</option>
                    <option value="heart">Saúde (Coração)</option>
                    <option value="home">Moradia (Casa)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9] mt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(editingCategory.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#dc2626] hover:bg-[#fee2e2] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW CATEGORY                                                */}
      {/* ========================================================================= */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006948] text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    Novo Teto Orçamentário
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    Adicione uma nova categoria de controle para o casal
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory} className="flex flex-col gap-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Nome da Categoria / Teto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pets & Veterinário, Educação, Assinaturas..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Meta / Teto Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 800"
                  value={catLimit}
                  onChange={(e) => setCatLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                  required
                />
              </div>

              <div className="bg-[#f8faff] border border-[#e5eeff] rounded-2xl p-3 text-xs text-[#565e74]">
                💡 <strong>Gasto Automático:</strong> Os gastos desta categoria serão calculados automaticamente à medida que novas despesas forem lançadas no extrato.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Gatilho de Alerta (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="100"
                      step="5"
                      value={catAlertPercent}
                      onChange={(e) => setCatAlertPercent(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs font-bold text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-[#565e74]">%</span>
                  </div>
                  <span className="text-[10px] text-[#565e74] mt-0.5 block">Disparar aviso ao atingir %</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Lembrete / Nota (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Compras planejadas para o mês"
                    value={catNote}
                    onChange={(e) => setCatNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-hidden focus:border-[#006948]"
                  />
                  <span className="text-[10px] text-[#565e74] mt-0.5 block">Lembrete opcional do casal</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Tipo de Meta
                  </label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as 'expense' | 'saving')}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="expense">Teto de Despesa</option>
                    <option value="saving">Reserva / Poupança</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Ícone
                  </label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="cart">Supermercado (Carrinho)</option>
                    <option value="utensils">Lazer (Restaurante)</option>
                    <option value="fuel">Combustível (Posto)</option>
                    <option value="pill">Farmácia (Pílula)</option>
                    <option value="piggy">Reserva (Porquinho)</option>
                    <option value="car">Carro (Automóvel)</option>
                    <option value="plane">Viagem (Avião)</option>
                    <option value="book">Educação (Livro)</option>
                    <option value="heart">Saúde (Coração)</option>
                    <option value="home">Moradia (Casa)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                >
                  Adicionar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CAR COST ITEM                                                 */}
      {/* ========================================================================= */}
      {editingCarCost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    Editar Custo do Veículo
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    {editingCarCost.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingCarCost(null)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCarCostEdit} className="flex flex-col gap-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Item de Custo
                </label>
                <input
                  type="text"
                  value={carTitle}
                  onChange={(e) => setCarTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Valor Planejado / Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={carAmount}
                    onChange={(e) => setCarAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                {editingCarCost.spent !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                      Valor Já Gasto (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={carSpent}
                      onChange={(e) => setCarSpent(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Data da Compra / Pagamento
                  </label>
                  <input
                    type="date"
                    value={carDate}
                    onChange={(e) => setCarDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Status / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Quitado, Orçado, 3 de 5"
                    value={carBadge}
                    onChange={(e) => setCarBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Subtexto / Observação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Parcelas de R$ 640/mês"
                  value={carSubtext}
                  onChange={(e) => setCarSubtext(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9] mt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteCarCost(editingCarCost.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffebee] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCarCost(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW CAR COST ITEM                                              */}
      {/* ========================================================================= */}
      {isNewCarCostModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-[#006194] flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    Novo Custo do Veículo
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    Jeep Compass Longitude Turbo
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNewCarCostModalOpen(false)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCarCost} className="flex flex-col gap-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Item de Custo / Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de Pneus, IPVA 2026, Revisão de Freios, Bateria"
                  value={carTitle}
                  onChange={(e) => setCarTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Valor Total / Teto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={carAmount}
                    onChange={(e) => setCarAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Valor Já Gasto (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={carSpent}
                    onChange={(e) => setCarSpent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Data da Compra / Pagamento
                  </label>
                  <input
                    type="date"
                    value={carDate}
                    onChange={(e) => setCarDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Status / Etiqueta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Orçado, Quitado, 1 de 4"
                    value={carBadge}
                    onChange={(e) => setCarBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Subtexto / Observação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Par de pneus dianteiros"
                  value={carSubtext}
                  onChange={(e) => setCarSubtext(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCarCostModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                >
                  Cadastrar Custo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR OU EDITAR META FINANCEIRA DO CASAL                           */}
      {/* ========================================================================= */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">
                    {editingGoal ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
                  </h3>
                  <span className="text-xs text-[#565e74]">
                    Felipe & Genivânia Duarte
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewGoalModalOpen(false);
                  setEditingGoal(null);
                }}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="flex flex-col gap-3.5 pt-4">
              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência, Viagem Europa, Casa Própria"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Valor Alvo / Meta (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Valor Já Acumulado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-sm font-bold text-[#006948] focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Tipo de Meta
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="economia">Poupança / Investimento</option>
                    <option value="gasto">Teto de Despesa</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Periodicidade
                  </label>
                  <select
                    value={goalPeriod}
                    onChange={(e) => setGoalPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="unico">Objetivo Único / Livre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Responsável
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoalUser('casal')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      goalUser === 'casal'
                        ? 'bg-[#ecfdf5] text-[#006948] border-[#a7f3d0]'
                        : 'bg-[#f8faff] text-[#565e74] border-[#e5eeff]'
                    }`}
                  >
                    Casal Duarte
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalUser('usr-felipe')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      goalUser === 'usr-felipe'
                        ? 'bg-[#eff4ff] text-[#2563eb] border-[#b6c7ff]'
                        : 'bg-[#f8faff] text-[#565e74] border-[#e5eeff]'
                    }`}
                  >
                    Felipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalUser('usr-genivania')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      goalUser === 'usr-genivania'
                        ? 'bg-[#fdf2f8] text-[#ec4899] border-[#fbcfe8]'
                        : 'bg-[#f8faff] text-[#565e74] border-[#e5eeff]'
                    }`}
                  >
                    Genivânia
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Descrição / Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aporte mensal na poupança ou CDB de liquidez diária"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewGoalModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APORTE RÁPIDO NA META                                              */}
      {/* ========================================================================= */}
      {depositModalGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#e5eeff] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#006948] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                    Registrar Aporte
                  </h3>
                  <span className="text-[11px] text-[#565e74] truncate max-w-[200px] block" title={depositModalGoal.titulo}>
                    {depositModalGoal.titulo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDepositModalGoal(null)}
                className="p-1 rounded-full text-[#565e74] hover:bg-[#eff4ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="flex flex-col gap-3.5 pt-4">
              <div className="bg-[#f8faff] p-3 rounded-2xl border border-[#e5eeff]">
                <div className="flex justify-between text-xs text-[#565e74]">
                  <span>Acumulado Atual:</span>
                  <span className="font-bold text-[#0b1c30]">{formatBRL(depositModalGoal.valorAtual || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#565e74] mt-1">
                  <span>Alvo da Meta:</span>
                  <span className="font-semibold">{formatBRL(depositModalGoal.valorPlanejado || depositModalGoal.valorAlvo || 0)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Valor do Novo Aporte (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-base font-extrabold text-[#006948] font-mono focus:outline-none focus:border-[#006948]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#565e74] hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs cursor-pointer"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
