import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BudgetCategoryItem, CarPlanningItem } from '../types';

// Substitui o uso de localStorage ('duarte_desktop_categories' e 'duarte_car_costs'):
// categorias de orçamento e custos planejados do carro agora sincronizam entre
// todos os dispositivos do casal via Supabase (tabelas budget_categories e car_planning_items).

let categoriesCache: BudgetCategoryItem[] | null = null;
let carCostsCache: CarPlanningItem[] | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function subscribeBudgetData(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCachedCategories(): BudgetCategoryItem[] | null {
  return categoriesCache;
}

export function getCachedCarCosts(): CarPlanningItem[] | null {
  return carCostsCache;
}

export async function loadBudgetCategories(): Promise<BudgetCategoryItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('budget_categories').select('*').order('ordem', { ascending: true });
    if (error) throw error;
    const mapped: BudgetCategoryItem[] = (data || []).map((c: any) => ({
      id: c.id,
      name: c.nome,
      spent: 0,
      limit: Number(c.limite) || 0,
      icon: c.icone || 'cart',
      note: c.nota || '',
      alertPercent: c.alerta_percentual || 85,
      type: c.tipo || 'expense',
      isCustom: false,
    }));
    categoriesCache = mapped;
    notify();
    return mapped;
  } catch (err: any) {
    console.warn('[BudgetCategoriesService] Erro ao carregar categorias:', err?.message || err);
    return categoriesCache || [];
  }
}

export async function saveBudgetCategory(cat: BudgetCategoryItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('budget_categories').upsert(
      {
        id: cat.id,
        nome: cat.name,
        limite: cat.limit,
        icone: cat.icon,
        nota: cat.note || '',
        alerta_percentual: cat.alertPercent || 85,
        tipo: cat.type || 'expense',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.warn('[BudgetCategoriesService] Erro ao salvar categoria:', err?.message || err);
    return false;
  }
}

export async function deleteBudgetCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('budget_categories').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function loadCarPlanningItems(): Promise<CarPlanningItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('car_planning_items').select('*').order('data', { ascending: true });
    if (error) throw error;
    const mapped: CarPlanningItem[] = (data || []).map((c: any) => ({
      id: c.id,
      title: c.titulo,
      amount: Number(c.valor) || 0,
      badge: c.badge || '',
      subtext: c.subtext || '',
      spent: Number(c.gasto) || 0,
      data: c.data,
      type: c.tipo || 'annual',
    }));
    carCostsCache = mapped;
    notify();
    return mapped;
  } catch (err: any) {
    console.warn('[BudgetCategoriesService] Erro ao carregar custos do carro:', err?.message || err);
    return carCostsCache || [];
  }
}

export async function saveCarPlanningItem(item: CarPlanningItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('car_planning_items').upsert(
      {
        id: item.id,
        titulo: item.title,
        valor: item.amount,
        badge: item.badge || '',
        subtext: item.subtext || '',
        gasto: item.spent || 0,
        data: item.data || null,
        tipo: item.type || 'annual',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.warn('[BudgetCategoriesService] Erro ao salvar custo do carro:', err?.message || err);
    return false;
  }
}

export async function deleteCarPlanningItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('car_planning_items').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
