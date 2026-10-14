/**
 * Rastreia os ids das mensagens que o PRÓPRIO bot enviou (confirmações,
 * avisos de erro) para nunca reprocessá-las.
 *
 * Importante: isso é diferente de filtrar por `message.fromMe`. O bot
 * roda conectado ao número pessoal de um dos dois (Felipe ou Camila), e
 * o whatsapp-web.js só emite o evento 'message' para mensagens de
 * OUTRAS pessoas — mensagens enviadas por esse mesmo número (inclusive
 * digitadas direto no WhatsApp da pessoa, não pelo bot) ficam de fora.
 * Por isso escutamos 'message_create' (inclui as próprias) e usamos
 * este controle só para ignorar as mensagens que o bot mesmo gerou como
 * resposta — qualquer outra mensagem "fromMe" (a pessoa digitando uma
 * despesa) deve continuar sendo processada normalmente.
 */

const sentMessageIds = new Set<string>();
const MAX_TRACKED = 500;

export function markSentByBot(id: string): void {
  sentMessageIds.add(id);
  if (sentMessageIds.size > MAX_TRACKED) {
    const oldest = sentMessageIds.values().next().value;
    if (oldest) sentMessageIds.delete(oldest);
  }
}

export function wasSentByBot(id: string): boolean {
  return sentMessageIds.has(id);
}
