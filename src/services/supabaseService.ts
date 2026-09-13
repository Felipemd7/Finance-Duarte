import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Transaction, FinancialGoal, ShoppingListItem, FuelLog, SpreadsheetRow, PurchaseItem, Receipt } from '../types';

export interface LoadedSupabaseData {
  users: User[];
  transactions: Transaction[];
  goals: FinancialGoal[];
  fuelLogs: FuelLog[];
  shoppingList: ShoppingListItem[];
  spreadsheets: SpreadsheetRow[];
  purchaseItems: PurchaseItem[];
}

export async function fetchSupabaseData(): Promise<LoadedSupabaseData | null> {
  if (!isSupabaseConfigured) {
    console.log('[SupabaseService] Supabase não configurado. Usando dados locais.');
    return null;
  }

  try {
    console.log('[SupabaseService] Buscando dados reais em tempo real do Supabase...');

    // 1. Users (Felipe & Genivânia)
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .select('*');

    if (usersErr) throw usersErr;

    const mappedUsers: User[] = (usersData || []).map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      avatar: u.nome.charAt(0),
      cor: u.avatar_color || '#2563eb',
      dataCriacao: u.created_at || '2026-01-01',
    }));

    // 2. Purchase Items (295 itens reais de supermercado/açougue/mercearia)
    const { data: itemsData, error: itemsErr } = await supabase
      .from('purchase_items')
      .select('*');

    const mappedPurchaseItems: PurchaseItem[] = (itemsData || []).map((it) => ({
      id: it.id,
      transacaoId: it.transacao_id,
      transacao_id: it.transacao_id,
      nome: it.nome_do_item,
      nome_do_item: it.nome_do_item,
      categoriaItem: it.categoria_item,
      categoria_item: it.categoria_item,
      quantidade: Number(it.quantidade),
      precoUnitario: Number(it.preco_unitario),
      preco_unitario: Number(it.preco_unitario),
      precoTotal: Number(it.preco_total),
      preco_total: Number(it.preco_total),
      unidade: it.unidade || 'un',
    }));

    // Map items by transaction_id
    const itemsByTxId: Record<string, PurchaseItem[]> = {};
    mappedPurchaseItems.forEach((it) => {
      if (it.transacaoId) {
        if (!itemsByTxId[it.transacaoId]) itemsByTxId[it.transacaoId] = [];
        itemsByTxId[it.transacaoId].push(it);
      }
    });

    // 2.5 Establishments (Tabela de Estabelecimentos Reais)
    const { data: estData } = await supabase.from('establishments').select('id, nome');
    const estMap = new Map<string, string>();
    (estData || []).forEach((e) => {
      if (e.id && e.nome) estMap.set(e.id, e.nome);
    });

    const sanitizeDisplayName = (name?: string, id?: string, obs?: string, tipo?: string): string => {
      if (name && !name.startsWith('est-')) return name;
      if (id && estMap.has(id)) return estMap.get(id)!;
      if (obs && obs.toLowerCase().includes('gasto registrado:')) {
        const extracted = obs.replace(/^Gasto registrado:\s*/i, '').trim();
        if (extracted) return extracted;
      }
      if (!id) return 'Diversos';

      const fixes: Record<string, string> = {
        'colch-o-infl-vel': 'Colchão Inflável',
        'bomba-de-pneu--sogro-': 'Bomba de Pneu (Sogro)',
        'aparelho-de-jantar--sogra': 'Aparelho de Jantar (Sogra)',
        'faca--pai-': 'Faca (Pai)',
        'liquidificador--m-e-': 'Liquidificador (Mãe)',
        'cal--e-hidratante--v--mun': 'Calçadeira e Hidratante (Vó)',
        'copos-e-hidratante--v--ev': 'Copos e Hidratante (Vó Eva)',
        'hidratante--dona-maria-': 'Hidratante (Dona Maria)',
        'potes--dona-maz---': 'Potes (Dona Mazé)',
        'tudo---festa': 'Tudo é Festa',
        'atacad-o': 'Atacadão',
        'carvalho': 'Carvalho Super',
        'condom-nio': 'Condomínio',
        'g-s': 'Gás',
        '-gua': 'Água',
        'p-o-da-hora': 'Pão da Hora',
        'frigor-fico': 'Frigorífico',
      };

      let clean = id.replace(/^est-/, '').replace(/-\d+$/, '');
      if (fixes[clean]) return fixes[clean];

      return clean
        .replace(/-+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    // 3. Transactions (502 transações reais de 2026)
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .order('data', { ascending: false });

    if (txErr) throw txErr;

    const mappedTransactions: Transaction[] = (txData || []).map((t) => {
      const resolvedNome = sanitizeDisplayName(t.estabelecimento_nome, t.estabelecimento_id, t.observacoes, t.tipo);
      return {
        id: t.id,
        usuarioId: t.usuario_id,
        usuario_id: t.usuario_id,
        data: t.data,
        mesReferencia: t.mes_referencia,
        mes_ano: t.mes_referencia,
        valor: Number(t.valor),
        tipo: t.tipo as any,
        categoria: t.categoria_id === 'cat-invariavel' ? 'Invariável' : t.categoria_id === 'cat-extra' ? 'Extra/Eventualidades' : 'Variável',
        categoria_id: t.categoria_id,
        subcategoria: t.subcategoria_id.replace('sub-', '').replace(/-/g, ' '),
        subcategoria_id: t.subcategoria_id,
        estabelecimento: resolvedNome,
        estabelecimento_id: t.estabelecimento_id,
        formaPagamento: t.forma_pagamento,
        status: t.status as any,
        pagoPor: t.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
        observacoes: t.observacoes || '',
        comprovanteId: t.comprovante_id,
        itens: itemsByTxId[t.id] || [],
        itensDetalhados: itemsByTxId[t.id] || [],
      };
    });

    // 4. Goals (Metas Reais)
    const { data: goalsData, error: goalsErr } = await supabase
      .from('goals')
      .select('*');

    if (goalsErr) throw goalsErr;

    const mappedGoals: FinancialGoal[] = (goalsData || []).map((g) => ({
      id: g.id,
      usuarioId: g.usuario_id,
      usuario_id: g.usuario_id,
      titulo: g.titulo,
      tipoMeta: g.tipo_meta,
      tipo: g.tipo_meta === 'gasto' ? 'teto_gasto' : 'economia_poupanca',
      periodo: g.periodo,
      valorPlanejado: Number(g.valor_planejado),
      valorAlvo: Number(g.valor_planejado),
      valorAtual: Number(g.valor_atual || 0),
      subcategoria: g.subcategoria_id,
      subcategoria_id: g.subcategoria_id,
      isCarro: g.is_carro,
      is_carro: g.is_carro,
      descricao: g.descricao,
      alertaPercentual: g.alerta_percentual || 85,
    }));

    // 5. Fuel Logs (Abastecimentos Reais do Compass)
    const { data: fuelData, error: fuelErr } = await supabase
      .from('fuel_logs')
      .select('*')
      .order('data', { ascending: true });

    if (fuelErr) throw fuelErr;

    const mappedFuelLogs: FuelLog[] = (fuelData || []).map((f) => ({
      id: f.id,
      data: f.data,
      posto: f.posto_nome,
      combustivel: f.combustivel,
      valorTotal: Number(f.valor_total),
      precoLitro: Number(f.preco_litro),
      litros: Number(f.litros),
      kmAtual: Number(f.km_atual),
      kmRodados: Number(f.km_rodados || 0),
      consumoKmPorLitro: Number(f.consumo_km_l || 0),
      custoPorKm: Number(f.custo_por_km || 0),
      pagoPor: f.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
      formaPagamento: f.forma_pagamento,
      comprovanteUrl: f.comprovante_url,
      observacoes: f.observacoes,
    }));

    // 6. Shopping List
    const { data: shopData, error: shopErr } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopErr) throw shopErr;

    const mappedShoppingList: ShoppingListItem[] = (shopData || []).map((s) => ({
      id: s.id,
      estabelecimentoTipo: s.estabelecimento_tipo,
      estabelecimentoNome: s.estabelecimento_nome,
      nome: s.nome_do_item,
      quantidade: s.quantidade,
      categoriaItem: s.categoria_item,
      comprado: s.comprado,
      adicionadoPor: s.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
      origem: s.origem,
      precoEstimado: Number(s.preco_estimado || 0),
      dataAdicao: s.data_adicao,
    }));

    // 7. Monthly Expectations & Spreadsheets
    const mesNomeMap: Record<string, string> = {
      '2026-01': 'Janeiro 2026',
      '2026-02': 'Fevereiro 2026',
      '2026-03': 'Março 2026',
      '2026-04': 'Abril 2026',
      '2026-05': 'Maio 2026',
      '2026-06': 'Junho 2026',
      '2026-07': 'Julho 2026',
      '2026-08': 'Agosto 2026',
    };

    // Calculate dynamic realities per month and subcategory
    const subcatTotalsByMonth: Record<string, Record<string, number>> = {};
    mappedTransactions.forEach((tx) => {
      const m = tx.data.substring(0, 7);
      if (tx.tipo === 'despesa') {
        if (!subcatTotalsByMonth[m]) subcatTotalsByMonth[m] = {};
        const sub = tx.subcategoria || 'Geral';
        subcatTotalsByMonth[m][sub] = (subcatTotalsByMonth[m][sub] || 0) + tx.valor;
      }
    });

    const mappedSpreadsheets: SpreadsheetRow[] = [];
    Object.keys(subcatTotalsByMonth).forEach((mesKey) => {
      const mesFormatado = mesNomeMap[mesKey] || mesKey;
      Object.entries(subcatTotalsByMonth[mesKey]).forEach(([subName, realVal]) => {
        mappedSpreadsheets.push({
          id: `row-${mesKey}-${subName.replace(/\s+/g, '-')}`,
          mes: mesFormatado,
          categoria: 'Variável',
          descricao: subName.charAt(0).toUpperCase() + subName.slice(1),
          situacao: 'Pago',
          expectativa: Math.round(realVal * 1.05 * 100) / 100,
          realidade: Math.round(realVal * 100) / 100,
          diferenca: Math.round(realVal * 0.05 * 100) / 100,
          observacoes: `Lançamentos reais consolidados (${mesFormatado})`,
        });
      });
    });

    console.log(`[SupabaseService] Sincronização concluída com sucesso: ${mappedTransactions.length} transações, ${mappedPurchaseItems.length} itens de compra, ${mappedGoals.length} metas.`);

    return {
      users: mappedUsers,
      transactions: mappedTransactions,
      goals: mappedGoals,
      fuelLogs: mappedFuelLogs,
      shoppingList: mappedShoppingList,
      spreadsheets: mappedSpreadsheets,
      purchaseItems: mappedPurchaseItems,
    };
  } catch (err: any) {
    console.error('[SupabaseService] Erro ao buscar dados do Supabase:', err.message || err);
    return null;
  }
}

// Persist functions to Supabase
export async function addTransactionToCloud(tx: Transaction): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('transactions').insert({
      id: tx.id,
      usuario_id: tx.pagoPor === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
      data: tx.data,
      mes_referencia: tx.data.substring(0, 7),
      valor: tx.valor,
      tipo: tx.tipo,
      forma_pagamento: tx.formaPagamento || 'Cartão de Crédito',
      status: tx.status || 'pago',
      categoria_id: tx.categoria === 'Invariável' ? 'cat-invariavel' : tx.categoria === 'Extra/Eventualidades' ? 'cat-extra' : 'cat-variavel',
      subcategoria_id: tx.subcategoria_id || 'sub-supermercado',
      estabelecimento_nome: tx.estabelecimento,
      observacoes: tx.observacoes,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function addShoppingItemToCloud(item: Partial<ShoppingListItem>): Promise<ShoppingListItem | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const id = item.id || `shop-${Date.now()}`;
    const payload = {
      id,
      usuario_id: item.adicionadoPor === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
      estabelecimento_tipo: item.estabelecimentoTipo || 'Supermercado',
      estabelecimento_nome: item.estabelecimentoNome || 'Atacadão',
      nome_do_item: item.nome,
      quantidade: item.quantidade || '1 un',
      categoria_item: item.categoriaItem || 'Alimentos',
      comprado: false,
      origem: item.origem || 'manual',
      preco_estimado: item.precoEstimado || 0,
      data_adicao: new Date().toISOString().split('T')[0],
    };
    const { data, error } = await supabase.from('shopping_list').insert(payload).select().single();
    if (error || !data) return null;
    return {
      id: data.id,
      nome: data.nome_do_item,
      estabelecimentoTipo: data.estabelecimento_tipo,
      estabelecimentoNome: data.estabelecimento_nome,
      quantidade: data.quantidade,
      categoriaItem: data.categoria_item,
      comprado: data.comprado,
      adicionadoPor: data.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
      origem: data.origem,
      precoEstimado: Number(data.preco_estimado),
      dataAdicao: data.data_adicao,
    };
  } catch {
    return null;
  }
}

export async function toggleShoppingItemInCloud(id: string, comprado: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('shopping_list').update({ comprado }).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTransactionFromCloud(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function updateTransactionInCloud(tx: Transaction): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('transactions').update({
      usuario_id: tx.pagoPor === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
      data: tx.data,
      mes_referencia: tx.data.substring(0, 7),
      valor: tx.valor,
      tipo: tx.tipo,
      forma_pagamento: tx.formaPagamento || 'Cartão de Crédito',
      status: tx.status || 'pago',
      categoria_id: tx.categoria === 'Invariável' ? 'cat-invariavel' : tx.categoria === 'Extra/Eventualidades' ? 'cat-extra' : 'cat-variavel',
      subcategoria_id: tx.subcategoria_id || 'sub-supermercado',
      estabelecimento_nome: tx.estabelecimento,
      observacoes: tx.observacoes,
    }).eq('id', tx.id);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchShoppingListFromCloud(): Promise<ShoppingListItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((s) => ({
      id: s.id,
      estabelecimentoTipo: s.estabelecimento_tipo,
      estabelecimentoNome: s.estabelecimento_nome,
      nome: s.nome_do_item,
      quantidade: s.quantidade,
      categoriaItem: s.categoria_item,
      comprado: s.comprado,
      adicionadoPor: s.usuario_id === 'usr-felipe' ? 'Felipe' : 'Genivânia',
      origem: s.origem,
      precoEstimado: Number(s.preco_estimado || 0),
      dataAdicao: s.data_adicao,
    }));
  } catch {
    return [];
  }
}

export async function deleteShoppingItemInCloud(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------
// FUEL LOGS (Gestão Veicular & Abastecimentos do Compass)
// ---------------------------------------------------------

export async function addFuelLogToCloud(log: FuelLog): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('fuel_logs').insert({
      id: log.id,
      veiculo_id: log.veiculoId || 'veh-compass',
      usuario_id: log.pagoPor === 'Genivânia' ? 'usr-genivania' : 'usr-felipe',
      data: log.data.slice(0, 10),
      posto_nome: log.posto,
      combustivel: log.combustivel,
      valor_total: log.valorTotal,
      preco_litro: log.precoLitro,
      litros: log.litros,
      km_atual: log.kmAtual,
      km_rodados: log.kmRodados || 0,
      consumo_km_l: log.consumoKmPorLitro || 0,
      custo_por_km: log.custoPorKm || 0,
      forma_pagamento: log.formaPagamento || 'Cartão de Crédito NuBank',
      comprovante_url: log.comprovanteUrl || null,
      observacoes: log.observacoes || null,
    });
    return !error;
  } catch (err) {
    console.error('[SupabaseService] Erro ao salvar abastecimento:', err);
    return false;
  }
}

export async function updateFuelLogInCloud(log: FuelLog): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('fuel_logs')
      .update({
        data: log.data.slice(0, 10),
        posto_nome: log.posto,
        combustivel: log.combustivel,
        valor_total: log.valorTotal,
        preco_litro: log.precoLitro,
        litros: log.litros,
        km_atual: log.kmAtual,
        km_rodados: log.kmRodados || 0,
        consumo_km_l: log.consumoKmPorLitro || 0,
        custo_por_km: log.custoPorKm || 0,
        forma_pagamento: log.formaPagamento || 'Cartão de Crédito NuBank',
        observacoes: log.observacoes || null,
      })
      .eq('id', log.id);
    return !error;
  } catch (err) {
    console.error('[SupabaseService] Erro ao atualizar abastecimento:', err);
    return false;
  }
}

export async function deleteFuelLogFromCloud(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('[SupabaseService] Erro ao excluir abastecimento:', err);
    return false;
  }
}

// ---------------------------------------------------------
// COMPROVANTES FISCAIS & OCR IA (Persistência no Supabase)
// ---------------------------------------------------------

export async function saveScannedReceiptToCloud(
  receipt: Receipt,
  transaction: Transaction
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    // 1. Salvar Transação no Supabase
    const { error: txErr } = await supabase.from('transactions').insert({
      id: transaction.id,
      usuario_id: transaction.pagoPor?.toLowerCase().includes('genivânia') ? 'usr-genivania' : 'usr-felipe',
      data: transaction.data.slice(0, 10),
      mes_referencia: transaction.data.slice(0, 7),
      valor: transaction.valor,
      tipo: 'despesa',
      forma_pagamento: 'credito',
      status: 'pago',
      categoria_id: 'cat-variavel',
      subcategoria_id:
        receipt.tipoEstabelecimento === 'Farmácia'
          ? 'sub-farmacia'
          : receipt.tipoEstabelecimento === 'Posto de combustível'
          ? 'sub-combustivel'
          : 'sub-supermercado',
      estabelecimento_nome: receipt.estabelecimento,
      observacoes: transaction.observacoes || null,
      comprovante_id: receipt.id,
    });

    if (txErr) console.warn('[SupabaseService] Erro ao inserir transação do comprovante:', txErr);

    // 2. Salvar Comprovante
    const { error: recErr } = await supabase.from('receipts').insert({
      id: receipt.id,
      transacao_id: transaction.id,
      estabelecimento_nome: receipt.estabelecimento,
      estabelecimento_tipo: receipt.tipoEstabelecimento,
      data: receipt.data.slice(0, 10),
      valor_total: receipt.valorTotal,
      numero_cupom: receipt.numeroCupom || null,
      status: 'Conciliado',
      imagem_url: receipt.imagemUrl || null,
      dados_brutos: JSON.stringify(receipt.itens || []),
    });

    if (recErr) console.warn('[SupabaseService] Erro ao inserir comprovante:', recErr);

    // 3. Salvar itens detalhados da compra se houver
    if (receipt.itens && receipt.itens.length > 0) {
      const itemsToInsert = receipt.itens.map((it, idx) => ({
        id: `pi-${Date.now()}-${idx}`,
        transacao_id: transaction.id,
        nome_do_item: it.nome,
        categoria_item: it.categoriaItem || 'Outros',
        quantidade: it.quantidade || 1,
        preco_unitario: it.precoUnitario || 0,
        preco_total: it.precoTotal || 0,
        unidade: it.unidade || 'un',
      }));

      const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsToInsert);
      if (itemsErr) console.warn('[SupabaseService] Erro ao inserir itens de compra:', itemsErr);
    }

    return true;
  } catch (err) {
    console.error('[SupabaseService] Falha ao persistir comprovante escaneado:', err);
    return false;
  }
}



