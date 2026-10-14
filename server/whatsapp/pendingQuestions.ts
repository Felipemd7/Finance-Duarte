import type { AnalyzedReceipt } from '../receiptAnalyzer';

/**
 * Perguntas pendentes de resposta pelo grupo — mesmo padrão de
 * pendingConfirmations.ts (por chat, timer de 10 min), mas pra pedir um dado
 * que falta (valor, local, litros, km, o que foi comprado) em vez de
 * confirmar um rascunho já criado. Em memória: se o bot reiniciar, a pergunta
 * se perde e a pessoa só precisa mandar a despesa de novo.
 */

const QUESTION_TIMEOUT_MS = 10 * 60 * 1000;

/** Campos que dá pra preencher direto da resposta (sem reanalisar nada no Gemini). */
export type GapField = 'valorTotal' | 'estabelecimento' | 'litros' | 'kmAtual' | 'kmConfirm';

/** De onde veio a despesa — foto ignora o chute de forma de pagamento do Gemini. */
export type Channel = 'text' | 'audio' | 'image';

export interface PendingQuestion {
  chatId: string;
  /** Contexto da mensagem original para reanálise textual (perguntas vindas do Gemini). */
  contextoParcial: string;
  pergunta: string;
  createdAt: number;
  timer: NodeJS.Timeout;
  /** Quantas perguntas já foram feitas para esta despesa (limite: 2). */
  round: number;
  /**
   * Preenchido quando a pergunta nasceu de uma despesa já analisada (foto,
   * áudio ou texto completo com lacuna): a resposta só preenche `fields` no
   * `receipt` — nada é reanalisado, então nada do que já foi lido se perde.
   */
  fill?: { receipt: AnalyzedReceipt; fields: GapField[]; suggestion?: string; channel: Channel; origemTexto: string };
}

const pendingByChat = new Map<string, PendingQuestion>();

export function addPendingQuestion(
  chatId: string,
  contextoParcial: string,
  pergunta: string,
  onTimeout: () => void,
  opts: { round?: number; fill?: PendingQuestion['fill'] } = {}
): PendingQuestion {
  // Só uma pergunta pendente por chat — uma nova substitui a anterior.
  removePendingQuestion(chatId);

  const timer = setTimeout(() => {
    pendingByChat.delete(chatId);
    onTimeout();
  }, QUESTION_TIMEOUT_MS);

  const pending: PendingQuestion = {
    chatId,
    contextoParcial,
    pergunta,
    createdAt: Date.now(),
    timer,
    round: opts.round ?? 1,
    fill: opts.fill,
  };
  pendingByChat.set(chatId, pending);
  return pending;
}

export function getPendingQuestion(chatId: string): PendingQuestion | undefined {
  return pendingByChat.get(chatId);
}

export function removePendingQuestion(chatId: string): PendingQuestion | undefined {
  const pending = pendingByChat.get(chatId);
  if (!pending) return undefined;
  clearTimeout(pending.timer);
  pendingByChat.delete(chatId);
  return pending;
}
