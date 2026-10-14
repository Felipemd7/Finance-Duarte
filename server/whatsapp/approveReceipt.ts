import { supabaseServer, isSupabaseServerConfigured } from '../supabase';
import { mapCategoryToId, mapSubcategoryToId } from '../../src/shared/taxonomy';
import type { Receipt, Transaction } from '../../src/types';
import { localToday, newId } from './normalize';

/**
 * Equivalente server-side de `saveScannedReceiptToCloud` em
 * src/services/supabaseService.ts:794 — mesma lógica (transactions +
 * receipts→Conciliado + purchase_items + fuel_logs quando aplicável),
 * mas usando o cliente service-role (supabaseServer), já que o bot do
 * WhatsApp roda num processo Node separado, nunca no navegador.
 *
 * É o que acontece tanto quando a pessoa responde "sim" no grupo quanto
 * quando os 10 minutos de auto-confirmação se esgotam.
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return localToday();
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day.slice(0, 2)}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {}
  return localToday();
}

function resolveUsuarioId(pagoPor?: string): string {
  const nome = (pagoPor || '').toLowerCase();
  return nome.includes('genivânia') || nome.includes('genivania') || nome.includes('camila') ? 'usr-genivania' : 'usr-felipe';
}

export async function approveReceiptServerSide(receipt: Receipt, transaction: Transaction): Promise<boolean> {
  if (!isSupabaseServerConfigured) {
    console.warn('[WhatsApp] Supabase não configurado no servidor — confirmação não foi salva.');
    return false;
  }

  try {
    const txDate = normalizeDate(transaction.data);
    const txMes = txDate.slice(0, 7);
    const recDate = normalizeDate(receipt.data);

    const { error: txErr } = await supabaseServer.from('transactions').upsert(
      {
        id: transaction.id,
        usuario_id: resolveUsuarioId(transaction.pagoPor),
        data: txDate,
        mes_referencia: txMes,
        valor: transaction.valor,
        tipo: 'despesa',
        forma_pagamento: transaction.formaPagamento || 'Cartão conjunto Inter',
        status: 'pago',
        categoria_id: transaction.categoria_id || mapCategoryToId(transaction.categoria),
        subcategoria_id:
          transaction.subcategoria_id ||
          mapSubcategoryToId(receipt.subcategoriaSugerida || transaction.subcategoria || receipt.tipoEstabelecimento, transaction.categoria),
        estabelecimento_nome: receipt.estabelecimento,
        observacoes: transaction.observacoes || null,
        comprovante_id: receipt.id,
      },
      { onConflict: 'id' }
    );

    if (txErr) {
      console.error('[WhatsApp] Erro ao confirmar transação:', txErr.message);
      return false;
    }

    const { error: recErr } = await supabaseServer.from('receipts').upsert(
      {
        id: receipt.id,
        transacao_id: transaction.id,
        estabelecimento_nome: receipt.estabelecimento,
        estabelecimento_tipo: receipt.tipoEstabelecimento,
        data: recDate,
        valor_total: receipt.valorTotal,
        numero_cupom: receipt.numeroCupom || null,
        status: 'Conciliado',
        imagem_url: receipt.imagemUrl || null,
        dados_brutos: JSON.stringify(receipt.itens || []),
      },
      { onConflict: 'id' }
    );

    if (recErr) {
      console.warn('[WhatsApp] Erro ao atualizar comprovante confirmado:', recErr.message);
    }

    if (receipt.itens && receipt.itens.length > 0) {
      await supabaseServer.from('purchase_items').delete().eq('transacao_id', transaction.id);

      const itemsToInsert = receipt.itens.map((it, idx) => ({
        id: `${newId("pi-whatsapp")}-${idx}`,
        transacao_id: transaction.id,
        nome_do_item: it.nome,
        categoria_item: it.categoriaItem || 'Outros',
        quantidade: it.quantidade || 1,
        preco_unitario: it.precoUnitario || 0,
        preco_total: it.precoTotal || 0,
      }));

      const { error: itemsErr } = await supabaseServer.from('purchase_items').insert(itemsToInsert);
      if (itemsErr) console.warn('[WhatsApp] Erro ao inserir itens de compra:', itemsErr.message);
    }

    if (receipt.tipoEstabelecimento === 'Posto de combustível') {
      const precoL = receipt.precoLitro || (receipt.litros && receipt.valorTotal ? Number((receipt.valorTotal / receipt.litros).toFixed(2)) : 5.85);
      const lit = receipt.litros || Number((receipt.valorTotal / precoL).toFixed(2));
      const km = receipt.kmAtual || transaction.kmAtual || 0;
      const fuelId = receipt.fuelLogId || `fuel-${receipt.id}`;

      const { error: fuelErr } = await supabaseServer.from('fuel_logs').upsert(
        {
          id: fuelId,
          veiculo_id: 'veh-compass',
          usuario_id: resolveUsuarioId(transaction.pagoPor),
          data: txDate,
          posto_nome: receipt.estabelecimento || 'Posto de Combustível',
          combustivel: receipt.tipoCombustivel || transaction.combustivel || 'Gasolina Comum',
          valor_total: receipt.valorTotal,
          preco_litro: precoL,
          litros: lit,
          km_atual: km,
          forma_pagamento: transaction.formaPagamento || 'Cartão conjunto Inter',
          comprovante_url: receipt.imagemUrl || null,
          transacao_id: transaction.id,
          observacoes: `Abastecimento registrado via WhatsApp (${receipt.numeroCupom || receipt.id})`,
        },
        { onConflict: 'id' }
      );

      if (fuelErr) {
        console.warn('[WhatsApp] Erro ao sincronizar abastecimento em fuel_logs:', fuelErr.message);
      }
    }

    console.log('[WhatsApp] Despesa confirmada e virou transação:', transaction.id);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Falha ao confirmar despesa:', err);
    return false;
  }
}
