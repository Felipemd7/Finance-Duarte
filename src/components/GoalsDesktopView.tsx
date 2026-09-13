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
import { formatBRL } from '../utils/formatters';
import { FuelManagementSection } from './FuelManagementSection';

export interface BudgetCategoryItem {
  id: string;
  name: string;
  spent: number;
  limit: number;
  icon: string;
  note: string;
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
}

const DEFAULT_CATEGORIES: BudgetCategoryItem[] = [
  {
    id: 'supermercado',
    name: 'Supermercado & Feira',
    spent: 3280,
    limit: 2800,
    icon: 'cart',
    note: 'Alerta: 3 compras não essenciais',
    type: 'expense',
  },
  {
    id: 'lazer',
    name: 'Lazer & Gastronomia',
    spent: 1120,
    limit: 1200,
    icon: 'utensils',
    note: 'Restam 12 dias no ciclo',
    type: 'expense',
  },
  {
    id: 'combustivel',
    name: 'Combustível Mensal',
    spent: 680,
    limit: 800,
    icon: 'fuel',
    note: 'Consumo regular e controlado',
    type: 'expense',
  },
  {
    id: 'farmacia',
    name: 'Farmácia & Cuidados',
    spent: 380,
    limit: 450,
    icon: 'pill',
    note: 'Sem imprevistos médicos',
    type: 'expense',
  },
  {
    id: 'reserva',
    name: 'Reserva & Investimentos',
    spent: 4329.6,
    limit: 4000,
    icon: 'piggy',
    note: 'Meta de poupança atingida!',
    type: 'saving',
  },
];

const DEFAULT_CAR_COSTS: CarPlanningItem[] = [
  {
    id: 'car-ipva',
    title: 'IPVA 2026 (SP)',
    amount: 3200,
    badge: '3 de 5 Quitadas',
    subtext: 'Parcelas de R$ 640,00/mês',
    type: 'quota',
  },
  {
    id: 'car-seguro',
    title: 'Seguro Cobertura Total',
    amount: 2800,
    badge: 'Renovação Nov/26',
    subtext: 'Provisionado R$ 233,33/mês',
    type: 'annual',
  },
  {
    id: 'car-manutencao',
    title: 'Manutenção Preventiva',
    amount: 3000,
    spent: 650,
    badge: 'Teto R$ 3.000',
    subtext: 'Revisão 40.000km em dia',
    type: 'ceiling',
  },
  {
    id: 'car-telemetria',
    title: 'Telemetria & Rastreador',
    amount: 99,
    badge: 'Assinatura Débito',
    subtext: 'Total Anual R$ 1.188,00',
    type: 'monthly',
  },
];

export const GoalsDesktopView: React.FC<GoalsDesktopViewProps> = ({
  isReclassified,
  onToggleReclassification,
  onShowToast,
  goals = [],
  transactions = [],
  selectedMonth = 'Março 2026',
}) => {
  // Converte nome do mês para código 'YYYY-MM'
  const activeMonthCode = useMemo(() => {
    if (!selectedMonth) return '2026-03';
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
    return '2026-03';
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
    if (!monthTransactions || monthTransactions.length === 0) return cat.spent;
    const nameLower = (cat.name + ' ' + (cat.id || '')).toLowerCase();

    if (nameLower.includes('reserva') || nameLower.includes('investimento') || nameLower.includes('poupança') || cat.type === 'saving') {
      return cat.spent;
    }

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
        return sub.includes('combust');
      }
      if (nameLower.includes('farmacia') || nameLower.includes('farmácia') || nameLower.includes('cuidados') || nameLower.includes('saude') || nameLower.includes('saúde')) {
        return sub.includes('farm') || sub.includes('saude') || sub.includes('saúde');
      }
      if (nameLower.includes('moradia') || nameLower.includes('aluguel') || nameLower.includes('condominio')) {
        return sub.includes('aluguel') || sub.includes('condominio') || sub.includes('condomínio');
      }
      if (nameLower.includes('carro') || nameLower.includes('veiculo') || nameLower.includes('veículo')) {
        return sub.includes('carro') || sub.includes('manuten') || sub.includes('seguro') || sub.includes('rastreador') || sub.includes('combust');
      }
      return sub.includes(cat.id.toLowerCase()) || sub.includes(cat.name.toLowerCase());
    });

    return filtered.reduce((acc, t) => acc + t.valor, 0);
  }, [monthTransactions]);
  // Budget Categories State
  const [categories, setCategories] = useState<BudgetCategoryItem[]>(() => {
    const saved = localStorage.getItem('duarte_desktop_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('duarte_desktop_categories', JSON.stringify(categories));
  }, [categories]);

  // Car Costs State
  const [carCosts, setCarCosts] = useState<CarPlanningItem[]>(() => {
    const saved = localStorage.getItem('duarte_car_costs');
    return saved ? JSON.parse(saved) : DEFAULT_CAR_COSTS;
  });

  useEffect(() => {
    localStorage.setItem('duarte_car_costs', JSON.stringify(carCosts));
  }, [carCosts]);

  // Fuel Logs State (Telemetria, Odômetro & Comprovantes)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('duarte_fuel_logs');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('duarte_fuel_logs', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  const handleAddFuelLog = (log: FuelLog) => {
    setFuelLogs((prev) => [...prev, log]);
  };

  const handleUpdateFuelLog = (log: FuelLog) => {
    setFuelLogs((prev) => prev.map((item) => (item.id === log.id ? log : item)));
  };

  const handleDeleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((item) => item.id !== id));
  };

  // Modal States
  const [editingCategory, setEditingCategory] = useState<BudgetCategoryItem | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [editingCarCost, setEditingCarCost] = useState<CarPlanningItem | null>(null);

  // Forms State for Category
  const [catName, setCatName] = useState('');
  const [catLimit, setCatLimit] = useState('');
  const [catSpent, setCatSpent] = useState('');
  const [catNote, setCatNote] = useState('');
  const [catIcon, setCatIcon] = useState('cart');
  const [catType, setCatType] = useState<'expense' | 'saving'>('expense');

  // Form State for Car Cost
  const [carTitle, setCarTitle] = useState('');
  const [carAmount, setCarAmount] = useState('');
  const [carSpent, setCarSpent] = useState('');
  const [carBadge, setCarBadge] = useState('');
  const [carSubtext, setCarSubtext] = useState('');

  // Total Forecast Calculation (100% Automático)
  const totalSpent = categories.reduce((sum, c) => sum + calculateRealSpent(c), 0);

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: BudgetCategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatLimit(cat.limit.toString());
    setCatSpent(cat.spent.toString());
    setCatNote(cat.note);
    setCatIcon(cat.icon);
    setCatType(cat.type);
  };

  // Save Edited Category
  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const numLimit = parseFloat(catLimit.replace(',', '.')) || 0;
    const currentRealSpent = calculateRealSpent(editingCategory);

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: catName.trim() || c.name,
              limit: numLimit,
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
    setCatSpent('0');
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
    const numSpent = parseFloat(catSpent.replace(',', '.')) || 0;

    const newCat: BudgetCategoryItem = {
      id: 'cat-' + Date.now(),
      name: catName.trim(),
      limit: numLimit,
      spent: numSpent,
      note: catNote.trim() || 'Criado pelo casal Duarte',
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
              badge: carBadge.trim(),
              subtext: carSubtext.trim(),
            }
          : c
      )
    );

    setEditingCarCost(null);
    onShowToast(`Item do veículo "${carTitle}" atualizado!`);
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
    <div id="metas-desktop-view" className="hidden md:block w-full max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* TOP HEADER: Breadcrumbs, Title, Rateio Card & Actions                     */}
      {/* ========================================================================= */}
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
            Controle tático compartilhado do casal Duarte. Clique no ícone de lápis em qualquer card para editar valores ou adicione novos tetos e metas com os botões dedicados.
          </p>
        </div>

        {/* Right: Actions & Couple Rateio Card */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleOpenNewCategory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#006948] text-white hover:bg-[#005a3c] text-xs font-bold shadow-[0_4px_14px_rgba(0,105,72,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Teto / Categoria</span>
          </button>

          <div className="bg-white rounded-2xl p-2.5 px-3.5 border border-[#e5eeff] shadow-[0_2px_8px_rgba(11,28,48,0.03)] flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <div
                className="w-8 h-8 rounded-full bg-[#2563eb] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title="Felipe Duarte"
              >
                F
              </div>
              <div
                className="w-8 h-8 rounded-full bg-[#ec4899] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs"
                title="Genivânia Duarte"
              >
                G
              </div>
            </div>
            <div className="text-left pr-2">
              <span className="text-xs font-bold text-[#0b1c30] block">
                Gestão Conjunta 50/50
              </span>
              <span className="text-[10px] text-[#006948] font-medium block">
                Felipe & Genivânia
              </span>
            </div>
          </div>
        </div>
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
              const pct = Math.round((realSpent / (cat.limit || 1)) * 100);
              const diff = realSpent - cat.limit;
              const isExceeded = cat.type === 'expense' && realSpent > cat.limit;
              const isWarning = cat.type === 'expense' && !isExceeded && pct >= 90;
              const isSavingOver = cat.type === 'saving' && realSpent >= cat.limit;

              // Styles based on status
              let badgeColor = 'bg-[#dcfce7] text-[#006948]';
              let badgeText = `${pct}% Seguro`;
              let iconBg = 'bg-[#ecfdf5] text-[#006948]';
              let barColor = 'bg-[#006948]';
              let borderColor = 'border-[#e5eeff]';

              if (cat.type === 'saving') {
                badgeColor = isSavingOver ? 'bg-[#005a3c] text-white' : 'bg-[#dcfce7] text-[#006948]';
                badgeText = `${pct}% ${isSavingOver ? 'Superado' : 'Em Andamento'}`;
                iconBg = 'bg-[#dcfce7] text-[#006948]';
                barColor = 'bg-[#005a3c]';
                borderColor = isSavingOver ? 'border-[#bbf7d0]' : 'border-[#e5eeff]';
              } else if (isExceeded) {
                badgeColor = 'bg-[#fee2e2] text-[#dc2626]';
                badgeText = `${pct}% Excedido`;
                iconBg = 'bg-[#fee2e2] text-[#dc2626]';
                barColor = 'bg-[#dc2626]';
                borderColor = 'border-[#fee2e2]';
              } else if (isWarning) {
                badgeColor = 'bg-[#ede9fe] text-[#7c3aed]';
                badgeText = `${pct}% Atenção`;
                iconBg = 'bg-[#ede9fe] text-[#7c3aed]';
                barColor = 'bg-[#7c3aed]';
              } else if (pct >= 80) {
                badgeColor = 'bg-[#ccfbf1] text-[#0d9488]';
                badgeText = `${pct}% Equilibrado`;
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
                        style={{ width: `${Math.min(pct, 100)}%` }}
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
                      <span className="truncate">{cat.note || 'Teto planejado'}</span>
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
            Veículo: Compass Limited 1.3 Turbo • Placa: DUA-2026
          </div>
        </div>

        {/* 1. Planejamento & Custos Fixos (4 Subcards de Provisão Anual) */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                Planejamento & Custos Fixos Anuais
              </h3>
              <p className="text-xs text-[#565e74]">
                Provisões e rateio 50% Felipe / 50% Genivânia • Total orçado: R$ 9.188,00/ano
              </p>
            </div>
            <span className="text-xs font-bold text-[#006194] bg-[#eff4ff] px-3 py-1 rounded-full border border-[#dce9ff]">
              Rateio fixo rateado: ~R$ 0,53 / km
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {carCosts.map((item) => (
              <div
                key={item.id}
                className="bg-[#f8faff] rounded-2xl p-3.5 border border-[#e5eeff] relative group hover:border-[#006194]/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0b1c30] truncate pr-2">
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
                <span className="text-[10px] text-[#565e74] block mt-0.5 truncate">
                  {item.subtext}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Custo Real por KM, Abastecimentos, Odômetro & Consumo (Diário, Semanal e Mensal) */}
        <FuelManagementSection
          fuelLogs={fuelLogs}
          onAddFuelLog={handleAddFuelLog}
          onUpdateFuelLog={handleUpdateFuelLog}
          onDeleteFuelLog={handleDeleteFuelLog}
          onShowToast={onShowToast}
          veiculoInfo="Compass Limited 1.3 Turbo • Placa DUA-2026"
          custosFixosRateadosKm={0.53}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SUPERMERCADO & FECHAMENTO -> Lista Ativa & Reconciliação IA    */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              SUPERMERCADO & FECHAMENTO
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Lista Ativa com Reconciliação IA
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#006194] text-xs font-semibold border border-[#dce9ff]">
              Subtotal Lista: R$ 231,30
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Itens da Sessão Atual */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#006948]" />
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                  Itens da Sessão Atual (Atacadão & Hortifrúti)
                </h3>
              </div>
              <span className="text-xs text-[#565e74]">3 de 5 comprados</span>
            </div>

            <div className="space-y-2.5">
              {/* Item 1 */}
              <div className="p-3 bg-[#f8faff] rounded-2xl border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#dcfce7] text-[#006948] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Azeite Extra Virgem 500ml
                    </span>
                    <span className="text-[10px] text-[#565e74]">
                      Felipe via Alexa 08:30
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#0b1c30]">
                  R$ 38,90
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 bg-white rounded-2xl border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Café Especial em Grãos 1kg
                    </span>
                    <span className="text-[10px] text-[#7c3aed] font-medium">
                      Genivânia via Siri 14:15 • Item Gourmet
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#0b1c30]">
                  R$ 54,90
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 bg-white rounded-2xl border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Detergente Líquido Neutro 5L
                    </span>
                    <span className="text-[10px] text-[#565e74]">
                      Invariável / Limpeza
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#0b1c30]">
                  R$ 29,90
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-3 bg-[#f8faff] rounded-2xl border border-[#e5eeff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#dcfce7] text-[#006948] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">
                      Filé de Frango Sassami 3kg
                    </span>
                    <span className="text-[10px] text-[#565e74]">
                      Essencial Proteína
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#0b1c30]">
                  R$ 62,70
                </div>
              </div>

              {/* Item 5: Impulso Vinho */}
              <div className="p-3 bg-[#fff1f2] rounded-2xl border border-[#fecdd3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f43f5e] text-white flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0b1c30]">
                        Vinho Tinto Chileno Carménère
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#ffe4e6] text-[#e11d48] text-[9px] font-bold">
                        Impulso Detectado
                      </span>
                    </div>
                    <span className="text-[10px] text-[#e11d48]">
                      Não estava na lista • Sugestão: Reclassificar para Lazer
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-[#e11d48]">
                  R$ 68,00
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Reconciliação Pós-Compras • Auditoria de Hábitos */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#0b1c30]">
                    Reconciliação Pós-Compras
                  </h3>
                  <span className="text-[11px] text-[#565e74]">
                    Auditoria de Hábitos & Alocação Inteligente
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[10px] font-bold">
                  Motor IA Ativo
                </span>
              </div>

              <p className="text-xs text-[#565e74] leading-relaxed mb-4">
                Ao comparar a lista planejada com os itens do cupom fiscal, identificamos{' '}
                <strong className="text-[#e11d48]">1 item não essencial</strong> (Vinho Chileno, R$ 68,00).
              </p>

              {/* Comparison boxes */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#f8faff] rounded-2xl p-3 border border-[#e5eeff]">
                  <span className="text-[10px] text-[#565e74] block">Teto Alimentação</span>
                  <div className="font-mono text-sm font-bold text-[#0b1c30] mt-0.5">
                    {isReclassified ? 'R$ 3.280,00' : 'R$ 3.348,00'}
                  </div>
                  <span className="text-[10px] text-[#006948] block mt-0.5">
                    {isReclassified ? 'Sem distorção de vinho' : '+R$ 68,00 de vinho'}
                  </span>
                </div>

                <div className="bg-[#f8faff] rounded-2xl p-3 border border-[#e5eeff]">
                  <span className="text-[10px] text-[#565e74] block">Impacto em Lazer</span>
                  <div className="font-mono text-sm font-bold text-[#7c3aed] mt-0.5">
                    {isReclassified ? 'R$ 1.120,00' : 'R$ 1.052,00'}
                  </div>
                  <span className="text-[10px] text-[#565e74] block mt-0.5">
                    {isReclassified ? 'Alocado corretamente' : 'Teto preservado'}
                  </span>
                </div>
              </div>

              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 text-xs text-[#166534]">
                <span className="font-bold block mb-1">
                  {isReclassified ? 'Reclassificação Aplicada' : 'Ação Recomendada:'}
                </span>
                <span>
                  {isReclassified
                    ? 'O item "Vinho Tinto Chileno" foi debitado da cota de Lazer do casal, mantendo a cota de Supermercado limpa.'
                    : 'Mover os R$ 68,00 do Vinho para "Lazer & Gastronomia" para não estourar artificialmente o teto de Alimentação.'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f1f5f9] mt-4">
              <button
                onClick={onToggleReclassification}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isReclassified
                    ? 'bg-[#f1f5f9] text-[#565e74] hover:bg-[#e2e8f0]'
                    : 'bg-[#006948] text-white hover:bg-[#005a3c] shadow-xs'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>
                  {isReclassified
                    ? 'Desfazer Reclassificação'
                    : 'Aplicar Reclassificação Sugerida'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: ECOSSISTEMA CONECTADO -> Hub de Assistentes de Voz & API       */}
      {/* ========================================================================= */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#006948] block">
              ECOSSISTEMA CONECTADO
            </span>
            <h2 className="font-display font-bold text-lg text-[#0b1c30]">
              Hub de Assistentes de Voz & API
            </h2>
          </div>

          <span className="text-xs text-[#565e74]">Dispositivos Ativos: Echo Dot Quarto + Siri iPhone</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Amazon Alexa */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#00a8e8]/10 text-[#00a8e8] flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0b1c30]">Amazon Alexa</h4>
                    <span className="text-[10px] text-[#006948] font-semibold">Skill Ativa: "Duarte Finanças"</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              </div>

              <p className="text-[11px] text-[#565e74] leading-relaxed mb-3">
                Comandos de voz capturados pela Alexa no balcão da cozinha sincronizam diretamente na lista.
              </p>

              <div className="space-y-1.5 text-[10px] font-mono bg-[#f8faff] p-2.5 rounded-xl border border-[#e5eeff] text-[#0b1c30]">
                <div className="text-[#006194]">"Alexa, adiciona azeite na lista de mercado"</div>
                <div className="text-[#565e74]">"Alexa, quanto sobrou do teto de lazer?"</div>
              </div>
            </div>

            <button
              onClick={() => onShowToast('Simulação de disparo Alexa executada com sucesso!')}
              className="mt-4 w-full py-2 px-3 rounded-xl border border-[#dce9ff] text-xs font-bold text-[#006194] hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              Testar Comando Alexa
            </button>
          </div>

          {/* Card 2: Apple Siri Shortcuts */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0b1c30]">Apple Siri Shortcuts</h4>
                    <span className="text-[10px] text-[#006948] font-semibold">Atalhos no iOS 18</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              </div>

              <p className="text-[11px] text-[#565e74] leading-relaxed mb-3">
                Atalhos instalados nos celulares de Felipe e Genivânia com categorização rápida por toque ou voz.
              </p>

              <div className="space-y-1.5 text-[10px] font-mono bg-[#f8faff] p-2.5 rounded-xl border border-[#e5eeff] text-[#0b1c30]">
                <div className="text-[#a855f7]">"E aí Siri, gastei 45 reais em café"</div>
                <div className="text-[#565e74]">"E aí Siri, abasteci 150 no Compass"</div>
              </div>
            </div>

            <button
              onClick={() => onShowToast('Arquivo de atalho .shortcut gerado para download!')}
              className="mt-4 w-full py-2 px-3 rounded-xl border border-[#dce9ff] text-xs font-bold text-[#006194] hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              Baixar Atalhos iOS
            </button>
          </div>

          {/* Card 3: Rotas da API REST */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-[0_2px_12px_rgba(11,28,48,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0b1c30]">Rotas da API REST</h4>
                    <span className="text-[10px] text-[#565e74]">Webhook v1.2</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#006948] text-[9px] font-bold">
                  200 OK
                </span>
              </div>

              <p className="text-[11px] text-[#565e74] leading-relaxed mb-2">
                Endpoints autenticados por Bearer Token para automação no Home Assistant ou n8n.
              </p>

              <div className="space-y-1 text-[10px] font-mono bg-[#0b1c30] text-[#a7f3d0] p-2 rounded-xl">
                <div>POST /api/v1/listas-compras</div>
                <div className="text-white/70">GET  /api/v1/resumo-mensal</div>
                <div className="text-white/70">POST /api/v1/transacoes/rapida</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-[#f8faff] rounded-xl border border-[#e5eeff] mt-3">
              <code className="text-[10px] text-[#565e74] truncate">
                duarte_live_sec_99a8b7...
              </code>
              <button
                onClick={() => onShowToast('Chave de API copiada para a área de transferência!')}
                className="text-xs font-bold text-[#0b1c30] hover:text-[#006948] flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HEALTH BAR                                                         */}
      {/* ========================================================================= */}
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
            onClick={() => onShowToast('Auditoria Fiscal: 100% dos comprovantes conciliados no exercício.')}
            className="hover:text-[#006948] hover:underline cursor-pointer"
          >
            Auditoria Fiscal
          </button>
          <span>•</span>
          <button
            onClick={() => onShowToast('Parceria 50/50: Orçamento 100% compartilhado entre Felipe e Genivânia.')}
            className="hover:text-[#006948] hover:underline cursor-pointer"
          >
            Parceria 50/50
          </button>
          <span>•</span>
          <button
            onClick={() => onShowToast('Exportação de Relatório consolidado em PDF/XLSX gerado!')}
            className="hover:text-[#006948] hover:underline cursor-pointer"
          >
            Exportar Relatório Mensal
          </button>
          <span>•</span>
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

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Observação / Alerta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alerta: 3 compras não essenciais"
                  value={catNote}
                  onChange={(e) => setCatNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
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

              <div>
                <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                  Observação / Subtítulo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vacinas e ração mensal"
                  value={catNote}
                  onChange={(e) => setCatNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                />
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
                    Status / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 3 de 5 Quitadas"
                    value={carBadge}
                    onChange={(e) => setCarBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0b1c30] block mb-1">
                    Subtexto Informativo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Parcelas de R$ 640/mês"
                    value={carSubtext}
                    onChange={(e) => setCarSubtext(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faff] border border-[#dce9ff] rounded-xl text-xs text-[#0b1c30] focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-2">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
