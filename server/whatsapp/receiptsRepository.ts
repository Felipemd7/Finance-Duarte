import { supabaseServer, isSupabaseServerConfigured } from '../supabase';
import type { Receipt } from '../../src/types';
import { localToday, newId } from './normalize';

/**
 * Mesma lógica de upsert que `saveScannedReceiptDraftToCloud` em
 * src/services/supabaseService.ts, mas usando o cliente service-role
 * (supabaseServer) em vez do cliente anônimo do browser — necessário
 * porque o bot do WhatsApp roda no processo Node de um host separado,
 * nunca no navegador.
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

export async function saveDraftReceiptServerSide(receipt: Receipt): Promise<boolean> {
  if (!isSupabaseServerConfigured) {
    console.warn('[WhatsApp] Supabase não configurado no servidor — rascunho não foi salvo.');
    return false;
  }

  try {
    const { error } = await supabaseServer.from('receipts').upsert(
      {
        id: receipt.id,
        transacao_id: receipt.transacaoId || null,
        estabelecimento_nome: receipt.estabelecimento,
        estabelecimento_tipo: receipt.tipoEstabelecimento || 'Supermercado',
        data: normalizeDate(receipt.data),
        valor_total: receipt.valorTotal,
        numero_cupom: receipt.numeroCupom || null,
        // 'Pendente' não é um valor aceito pela constraint real do banco
        // (supabase/schema.sql só permite 'Conciliado', 'Pendente
        // Vinculação' ou 'Processando') — ver expenseIngest.ts.
        status: receipt.status === 'Pendente' ? 'Pendente Vinculação' : receipt.status || 'Pendente Vinculação',
        imagem_url: receipt.imagemUrl || null,
        // O app lê dados_brutos como JSON da lista de itens (supabaseService.ts) — texto livre aqui deixava os itens vazios.
        dados_brutos: JSON.stringify(receipt.itens || []),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[WhatsApp] Erro ao salvar rascunho de comprovante:', error.message);
      return false;
    }
    console.log('[WhatsApp] Rascunho de comprovante salvo no Supabase:', receipt.id);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Falha ao salvar rascunho de comprovante:', err);
    return false;
  }
}
