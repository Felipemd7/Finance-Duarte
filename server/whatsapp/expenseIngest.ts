import type { Client, Message } from 'whatsapp-web.js';
import {
  analyzeReceiptImage,
  analyzeFuelReceiptImage,
  analyzeAudioExpense,
  analyzeTextExpense,
  sanitizeDate,
  AnalyzedReceipt,
  ExpenseAnalysisResult,
  isGeminiBusyError,
  isGeminiQuotaError,
  GeminiQuotaError,
} from '../receiptAnalyzer';
import { saveDraftReceiptServerSide } from './receiptsRepository';
import { approveReceiptServerSide } from './approveReceipt';
import { addPending, getOldestPending, removePending, loadPersisted, PendingConfirmation } from './pendingConfirmations';
import { addPendingQuestion, getPendingQuestion, removePendingQuestion, Channel, GapField } from './pendingQuestions';
import { markSentByBot } from './ownMessages';
import { getActiveClient } from './client';
import { getKnowledge, knowledgePromptBlock, matchPlace, suggestPlace, invalidateKnowledge, Knowledge, PlaceKnowledge } from './knowledge';
import { buildWarnings, findDuplicate, kmIssue, sanitizeAnalyzed } from './guards';
import {
  canonicalPayment,
  DEFAULT_PAYMENT,
  isGenericAcquirerName,
  isNo,
  isYes,
  newId,
  parseFirstNumber,
  parseLitrosKm,
} from './normalize';
import { categoryNameForSubcategoryId, mapCategoryToId, subcategoryIdToName } from '../../src/shared/taxonomy';
import type { Receipt, Transaction, PurchaseItem } from '../../src/types';

const MAX_MEDIA_BASE64 = 15_000_000; // ~11 MB de arquivo

/**
 * Responde citando a mensagem original (`message.reply`) e marca a resposta
 * como "gerada pelo bot" (ver ownMessages.ts) para o handler de
 * message_create nunca reprocessá-la. Em chats "@lid" o `sendMessage` já
 * devolveu `undefined` (bug da biblioteca antes da correção do _serialized);
 * a mensagem é entregue de qualquer forma, só não dá pra marcar o id.
 */
async function replyInGroup(message: Message, text: string): Promise<void> {
  try {
    const sent = await message.reply(text);
    if (sent?.id?._serialized) markSentByBot(sent.id._serialized);
  } catch (err: any) {
    // Mensagem "velha" ligada a um cliente que foi reiniciado (watchdog/reconexão):
    // responde sem citar, pelo cliente ativo.
    console.warn('[WhatsApp] message.reply falhou, enviando sem citar:', err?.message || err);
    await sendToChat(getActiveClient() as Client, message.from, text);
  }
}

/** Envia ao chat pelo cliente ATIVO (o passado pode ter sido reiniciado entre o agendamento e o disparo do timer). */
async function sendToChat(client: Client, chatId: string, text: string): Promise<void> {
  const c = getActiveClient() ?? client;
  const sent = await c.sendMessage(chatId, text);
  if (sent?.id?._serialized) markSentByBot(sent.id._serialized);
}

/**
 * Quem enviou: mensagem do próprio número do bot → WHATSAPP_OWNER_NAME
 * (Felipe); demais → WHATSAPP_SENDER_MAP ("id:Nome,..."), onde `id` pode
 * ser o LID (autor chega como "233371376570550:97@lid") ou o telefone.
 * Desconhecido → "Casal" e loga o id pra ser adicionado ao mapa.
 */
function resolveSenderName(message: Message): string {
  if (message.fromMe) return process.env.WHATSAPP_OWNER_NAME || 'Casal';

  const raw = message.author || message.from || '';
  const id = raw.split('@')[0].split(':')[0].replace(/\D/g, '');
  for (const entry of (process.env.WHATSAPP_SENDER_MAP || '').split(',')) {
    const [key, name] = entry.split(':').map((s) => s?.trim());
    const keyDigits = (key || '').replace(/\D/g, '');
    if (keyDigits && name && (id === keyDigits || id.endsWith(keyDigits))) return name;
  }
  console.log(`[WhatsApp] Autor desconhecido "${id}" — adicione em WHATSAPP_SENDER_MAP (ex.: ${id}:Camila). Usando "Casal".`);
  return 'Casal';
}

function formatMoney(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function formatDateBR(iso: string): string {
  return iso.split('-').reverse().join('/');
}

// ───────────────────────── pós-processamento + lacunas ─────────────────────────

/**
 * Padroniza o que a IA devolveu usando o conhecimento aprendido: nome
 * canônico do lugar, subcategoria confiável do histórico, forma de
 * pagamento padrão do grupo (cartão conjunto), data válida.
 */
function postProcess(input: AnalyzedReceipt, k: Knowledge, channel: Channel): { analyzed: AnalyzedReceipt; place?: PlaceKnowledge } {
  let a = sanitizeAnalyzed({ ...input });
  a.data = sanitizeDate(a.data);
  a.formaPagamento = channel === 'image' ? DEFAULT_PAYMENT : canonicalPayment(a.formaPagamento);

  const place = a.estabelecimento && !isGenericAcquirerName(a.estabelecimento) ? matchPlace(k, a.estabelecimento) : undefined;
  if (place) {
    a.estabelecimento = place.nome;
    if (place.reliable) a.subcategoria_id = place.subcategoriaId;
    if (place.subcategoriaId === 'sub-combustivel' && place.reliable) {
      a.tipoDespesa = 'combustivel';
      a.tipoEstabelecimento = 'Posto de combustível';
      a.subcategoria_id = 'sub-combustivel';
    }
  }
  a.categoria_id = mapCategoryToId(categoryNameForSubcategoryId(a.subcategoria_id));

  if (a.tipoDespesa === 'combustivel') {
    a.tipoCombustivel = a.tipoCombustivel || k.fuel.commonFuel || 'Gasolina Comum';
    if (a.litros && a.valorTotal) a.precoPorLitro = Number((a.valorTotal / a.litros).toFixed(2));
  }
  return { analyzed: a, place };
}

interface Gap {
  fields: GapField[];
  pergunta: string;
  suggestion?: string;
}

/** Próxima lacuna — prioridade: valor > local > litros > km (e conferência de km). */
function findGap(a: AnalyzedReceipt, k: Knowledge): Gap | undefined {
  if (!(a.valorTotal > 0)) return { fields: ['valorTotal'], pergunta: 'Qual foi o valor total dessa despesa?' };

  if (isGenericAcquirerName(a.estabelecimento)) {
    const hint = suggestPlace(k, a.valorTotal, a.tipoDespesa === 'combustivel' ? 'sub-combustivel' : undefined);
    return hint
      ? {
          fields: ['estabelecimento'],
          suggestion: hint.nome,
          pergunta: `Onde foi essa compra de ${formatMoney(a.valorTotal)}? Parece ser ${hint.nome} (costuma ser ~${formatMoney(hint.median)}). Responda "sim" ou diga o nome do lugar.`,
        }
      : { fields: ['estabelecimento'], pergunta: `Onde foi essa despesa de ${formatMoney(a.valorTotal)}? (nome do lugar)` };
  }

  if (a.tipoDespesa === 'combustivel') {
    if (!a.litros && !a.kmAtual) return { fields: ['litros', 'kmAtual'], pergunta: 'Quantos litros e qual o km atual do carro?' };
    if (!a.litros) return { fields: ['litros'], pergunta: 'Quantos litros foram abastecidos?' };
    if (!a.kmAtual) return { fields: ['kmAtual'], pergunta: 'Qual o km atual do carro?' };
    const issue = kmIssue(a.kmAtual, k.fuel.lastKm);
    if (issue) {
      const km = a.kmAtual.toLocaleString('pt-BR');
      const last = issue.lastKm.toLocaleString('pt-BR');
      return {
        fields: ['kmConfirm'],
        pergunta:
          issue.kind === 'lower'
            ? `O km informado (${km}) é menor que o último registrado (${last}). Confere? Responda o km correto ou "ok" pra manter.`
            : `O km informado (${km}) está bem acima do último registrado (${last}). Confere? Responda o km correto ou "ok" pra manter.`,
      };
    }
  }
  return undefined;
}

function applyReply(a: AnalyzedReceipt, fields: GapField[], reply: string, suggestion?: string): AnalyzedReceipt {
  const out = { ...a };
  if (fields.includes('valorTotal')) {
    const v = parseFirstNumber(reply);
    if (v) out.valorTotal = v;
  }
  if (fields.includes('estabelecimento')) {
    if (isYes(reply) && suggestion) out.estabelecimento = suggestion;
    else {
      const name = reply.replace(/^\s*(foi\s+)?(n[oa]s?|em|d[oa]s?)\s+/i, '').trim().slice(0, 60);
      if (name) out.estabelecimento = name;
    }
  }
  if (fields.includes('litros') || fields.includes('kmAtual')) {
    const { litros, km } = parseLitrosKm(reply);
    const first = parseFirstNumber(reply);
    if (fields.includes('litros')) out.litros = litros ?? (fields.length === 1 ? first : undefined) ?? out.litros;
    if (fields.includes('kmAtual')) out.kmAtual = km ?? (fields.length === 1 ? first : undefined) ?? out.kmAtual;
  }
  if (fields.includes('kmConfirm') && !isYes(reply)) {
    const { km } = parseLitrosKm(reply);
    const n = km ?? parseFirstNumber(reply);
    if (n) out.kmAtual = n;
  }
  return out;
}

// ───────────────────────── montagem do rascunho ─────────────────────────

function toReceipt(a: AnalyzedReceipt, imagemUrl?: string): Receipt {
  const itens: PurchaseItem[] = (a.itens || []).map((it, idx) => ({
    id: `${newId('item-whatsapp')}-${idx}`,
    nome: it.nome,
    quantidade: it.quantidade,
    precoUnitario: it.precoUnitario,
    precoTotal: it.precoTotal,
    categoriaItem: (it as any).categoriaItem,
  })) as any;

  return {
    id: newId('rec-whatsapp'),
    data: a.data,
    estabelecimento: a.estabelecimento,
    tipoEstabelecimento: a.tipoEstabelecimento as any,
    valorTotal: a.valorTotal,
    // A constraint real em supabase/schema.sql só aceita 'Conciliado',
    // 'Pendente Vinculação' ou 'Processando'.
    status: 'Pendente Vinculação',
    itens,
    formaPagamento: a.formaPagamento,
    litros: a.litros,
    kmAtual: a.kmAtual,
    tipoCombustivel: a.tipoCombustivel,
    precoLitro: a.precoPorLitro,
    // Guarda a própria foto do comprovante, igual ao ScannerView manual do
    // app — sem isso, a foto enviada no WhatsApp se perdia e só sobravam
    // os dados extraídos pelo Gemini.
    imagemUrl,
  };
}

function toTransaction(receipt: Receipt, a: AnalyzedReceipt, senderName: string, origemTexto: string): Transaction {
  return {
    id: newId('tx-whatsapp'),
    data: receipt.data,
    valor: receipt.valorTotal,
    tipo: 'despesa',
    categoria_id: a.categoria_id,
    subcategoria_id: a.subcategoria_id,
    formaPagamento: receipt.formaPagamento as any,
    status: 'pago',
    pagoPor: senderName,
    // "via WhatsApp" fica só como comentário da transação (não como nome do lugar).
    observacoes: `via WhatsApp · ${senderName}${origemTexto ? `: "${origemTexto.slice(0, 200)}"` : ''}`,
    kmAtual: receipt.kmAtual,
    combustivel: receipt.tipoCombustivel,
    comprovanteId: receipt.id,
  };
}

/**
 * Lista os itens na própria mensagem do WhatsApp (ex.: compra de
 * supermercado) — não aparece quando é só 1 item sintético (ex.:
 * combustível, despesa genérica sem detalhamento de itens).
 */
function itemsBlock(a: AnalyzedReceipt): string {
  const itens = (a.itens || []).filter((it) => it.nome?.trim());
  if (itens.length <= 1) return '';

  const MAX = 20;
  const linhas = itens.slice(0, MAX).map((it) => {
    const qtd = it.quantidade && it.quantidade !== 1 ? `${it.quantidade}x ` : '';
    const valor = formatMoney(it.precoTotal || (it.precoUnitario || 0) * (it.quantidade || 1));
    return `• ${qtd}${it.nome} — ${valor}`;
  });
  const resto = itens.length > MAX ? `\n…+${itens.length - MAX} itens` : '';
  return `\n📋 Itens (${itens.length}):\n${linhas.join('\n')}${resto}`;
}

function confirmationMessage(receipt: Receipt, a: AnalyzedReceipt, senderName: string, warnings: string[]): string {
  const header = a.confianca === 'baixa' ? '📝 Entendi como despesa, mas não tenho certeza de alguns dados:' : '✅ Despesa registrada!';

  const body =
    a.tipoDespesa === 'combustivel'
      ? `⛽ ${a.litros ? `${a.litros}L — ` : ''}${receipt.estabelecimento} — ${formatMoney(receipt.valorTotal)}${
          a.precoPorLitro ? ` (${formatMoney(a.precoPorLitro)}/L)` : ''
        }\n🚗 KM: ${a.kmAtual ? a.kmAtual.toLocaleString('pt-BR') : '(não informado)'} · ${senderName}\n📅 ${formatDateBR(receipt.data)}`
      : `💰 ${formatMoney(receipt.valorTotal)} — ${receipt.estabelecimento} (${subcategoryIdToName(a.subcategoria_id)})\n📅 ${formatDateBR(receipt.data)} · ${senderName}`;

  const extra = warnings.length ? `\n${warnings.join('\n')}` : '';
  return `${header}\n${body}${itemsBlock(a)}\n💳 ${receipt.formaPagamento}${extra}\nResponda "sim" pra confirmar ou "não" pra corrigir no app.\n⏱️ Sem resposta em 10 min, confirmo automaticamente.`;
}

/** Auto-confirmação (10 min sem resposta) — também reaproveitada na recuperação após reinício. */
function autoConfirm(client: Client) {
  return async (pending: PendingConfirmation) => {
    const ok = await approveReceiptServerSide(pending.receipt, pending.transaction);
    if (ok) invalidateKnowledge();
    const icon = pending.receipt.tipoEstabelecimento === 'Posto de combustível' ? '⛽' : '✅';
    await sendToChat(
      client,
      pending.chatId,
      ok
        ? `⏱️ Não recebi resposta em 10 min, confirmei automaticamente:\n${icon} ${formatMoney(pending.receipt.valorTotal)} — ${pending.receipt.estabelecimento}`
        : '⚠️ Tentei confirmar automaticamente após 10 min, mas não consegui salvar. Confira no app.'
    );
  };
}

/** Chamado no boot: reagenda as confirmações que estavam pendentes antes do reinício. */
export function restorePendingConfirmations(client: Client): void {
  const persisted = loadPersisted();
  for (const p of persisted) addPending(p, autoConfirm(client));
  if (persisted.length) console.log(`[WhatsApp] ${persisted.length} confirmação(ões) pendente(s) recuperada(s) após reinício.`);
}

/** Etapa final: cria o rascunho, avisa (com alertas) e registra a confirmação pendente. */
async function createDraftAndAsk(
  client: Client,
  message: Message,
  a: AnalyzedReceipt,
  place: PlaceKnowledge | undefined,
  k: Knowledge,
  senderName: string,
  origemTexto: string,
  imagemUrl?: string
): Promise<void> {
  const receipt = toReceipt(a, imagemUrl);
  const transaction = toTransaction(receipt, a, senderName, origemTexto);

  const saved = await saveDraftReceiptServerSide(receipt);
  if (!saved) {
    await replyInGroup(message, '⚠️ Recebi a despesa, mas não consegui salvar agora. Tente de novo em alguns minutos.');
    return;
  }

  const duplicate = await findDuplicate(receipt.valorTotal, receipt.data, receipt.estabelecimento);
  await replyInGroup(message, confirmationMessage(receipt, a, senderName, buildWarnings(a, place, k, duplicate)));

  addPending({ receiptId: receipt.id, chatId: message.from, receipt, transaction }, autoConfirm(client));
}

interface Ctx {
  channel: Channel;
  origemTexto: string;
  /** Foto original do comprovante (data URL) — só quando channel='image'. */
  imagemUrl?: string;
}

async function askGap(client: Client, message: Message, a: AnalyzedReceipt, gap: Gap, ctx: Ctx, round: number, senderName: string): Promise<void> {
  await replyInGroup(message, `❓ ${gap.pergunta}`);
  addPendingQuestion(
    message.from,
    '',
    gap.pergunta,
    async () => {
      const k = await getKnowledge();
      if (!(a.valorTotal > 0)) {
        await sendToChat(client, message.from, '⌛ Não recebi o valor, vou deixar essa de lado. Pode mandar de novo com o valor incluído.');
        return;
      }
      await sendToChat(client, message.from, '⌛ Não recebi a resposta, vou registrar com o que tenho. Você pode completar no app depois.');
      const { analyzed, place } = postProcess(a, k, ctx.channel);
      await createDraftAndAsk(client, message, analyzed, place, k, senderName, ctx.origemTexto, ctx.imagemUrl);
    },
    { round, fill: { receipt: a, fields: gap.fields, suggestion: gap.suggestion, channel: ctx.channel, origemTexto: ctx.origemTexto } }
  );
}

/** Funil único de toda despesa reconhecida (foto, áudio ou texto): padroniza, completa lacunas e cria o rascunho. */
async function finishExpense(
  client: Client,
  message: Message,
  input: AnalyzedReceipt,
  senderName: string,
  ctx: Ctx,
  round = 1
): Promise<void> {
  const k = await getKnowledge();
  const { analyzed, place } = postProcess(input, k, ctx.channel);

  const gap = findGap(analyzed, k);
  if (gap && round <= 2) {
    await askGap(client, message, analyzed, gap, ctx, round, senderName);
    return;
  }
  if (!(analyzed.valorTotal > 0)) {
    await replyInGroup(message, '🤔 Ainda não consegui identificar o valor. Adicione essa despesa manualmente no app.');
    return;
  }
  await createDraftAndAsk(client, message, analyzed, place, k, senderName, ctx.origemTexto, ctx.imagemUrl);
}

/** Resultado comum de texto/áudio (e de respostas a perguntas do Gemini). */
async function handleAnalysisResult(
  client: Client,
  message: Message,
  result: ExpenseAnalysisResult,
  senderName: string,
  ctx: Ctx,
  round = 1
): Promise<void> {
  switch (result.kind) {
    case 'not_expense':
      await replyInGroup(message, '🤔 Não entendi essa mensagem como despesa. Se for um gasto, descreva o valor e o local (ex.: "gastei 45 no mercado").');
      return;
    case 'unclear':
      await replyInGroup(message, '🎙️ Não consegui entender o áudio. Pode repetir mais devagar ou mandar por texto?');
      return;
    case 'multiple':
      await replyInGroup(message, '📝 Vi mais de uma despesa nessa mensagem. Me mande uma por vez pra eu registrar certinho.');
      return;
    case 'question':
      await replyInGroup(message, `❓ ${result.pergunta}`);
      addPendingQuestion(message.from, result.contextoParcial, result.pergunta, async () => {
        await sendToChat(client, message.from, '⌛ Não recebi mais detalhes, vou deixar essa de lado. Pode mandar de novo com as informações completas.');
      });
      return;
    case 'expense':
      await finishExpense(client, message, result.receipt, senderName, ctx, round);
  }
}

// ───────────────────────── respostas a perguntas/confirmações ─────────────────────────

/** Tenta tratar a mensagem como resposta a uma pergunta pendente do chat. */
export async function resolvePendingQuestion(client: Client, message: Message): Promise<boolean> {
  const pending = getPendingQuestion(message.from);
  if (!pending || !message.body?.trim()) return false;

  removePendingQuestion(message.from);
  const senderName = resolveSenderName(message);
  const reply = message.body.trim();

  // Pergunta nascida de uma despesa já lida: só preenche o campo, sem reanalisar.
  if (pending.fill) {
    const { receipt, fields, suggestion, channel, origemTexto } = pending.fill;
    const updated = applyReply(receipt, fields, reply, suggestion);
    await finishExpense(client, message, updated, senderName, { channel, origemTexto }, pending.round + 1);
    return true;
  }

  // Pergunta do Gemini (texto/áudio): reanalisa combinando contexto + resposta.
  const combinedText = `${pending.contextoParcial}. Informação adicional perguntada ("${pending.pergunta}"): ${reply}`;
  let result: ExpenseAnalysisResult;
  try {
    result = await analyzeTextExpense(combinedText, { knowledgeBlock: await knowledgePromptBlock() });
  } catch (err: any) {
    console.error('[WhatsApp] Erro ao reanalisar após pergunta:', err?.message || err);
    const failure = describeGeminiFailure(err);
    await replyInGroup(
      message,
      failure.kind === 'other'
        ? '⚠️ Não consegui processar essa informação. Adicione a despesa manualmente no app.'
        : failure.text.replace(/Vou tentar de novo sozinho[^.]*./, 'Reenvie essa resposta em alguns minutos.')
    );
    return true;
  }

  if (result.kind === 'question') {
    await replyInGroup(message, '🤔 Ainda não ficou claro. Adicione essa despesa manualmente no app.');
    return true;
  }
  await handleAnalysisResult(client, message, result, senderName, { channel: 'text', origemTexto: combinedText }, 2);
  return true;
}

/** "sim"/"não" a uma confirmação pendente. `true` = a mensagem foi tratada como confirmação. */
export async function resolvePendingConfirmation(message: Message): Promise<boolean> {
  const pending = getOldestPending(message.from);
  if (!pending) return false;

  const body = (message.body || '').trim();
  const resumo = `${formatMoney(pending.receipt.valorTotal)} — ${pending.receipt.estabelecimento}`;

  if (isYes(body)) {
    removePending(pending.receiptId);
    const ok = await approveReceiptServerSide(pending.receipt, pending.transaction);
    if (ok) invalidateKnowledge();
    await replyInGroup(
      message,
      ok ? `✅ Confirmado: ${resumo}. Virou transação no app.` : '⚠️ Não consegui confirmar agora. Tente de novo em alguns minutos.'
    );
    return true;
  }

  if (isNo(body)) {
    removePending(pending.receiptId);
    await replyInGroup(message, `👍 Ok, não confirmei ${resumo}. Ajusta manualmente no app quando puder.`);
    return true;
  }

  return false;
}

// ───────────────────────── entrada principal ─────────────────────────

/**
 * Foto de posto: `analyzeReceiptImage` nunca extrai litros/km — isso só
 * existe no analisador específico de combustível; roda ele na mesma imagem
 * e mescla litros/preço/combustível/km antes do funil comum.
 */
async function enrichFuelPhoto(a: AnalyzedReceipt, base64Image: string, mimeType: string): Promise<AnalyzedReceipt> {
  if (a.tipoEstabelecimento !== 'Posto de combustível' && a.subcategoria_id !== 'sub-combustivel') return a;
  // A análise da foto já extrai litros/preço/km na mesma chamada — só chama o
  // analisador específico se faltou o litro (poupa cota do Gemini).
  if (a.litros) {
    return { ...a, tipoEstabelecimento: 'Posto de combustível', subcategoria_id: 'sub-combustivel', tipoDespesa: 'combustivel' };
  }
  try {
    const fuel = await analyzeFuelReceiptImage(base64Image, mimeType);
    return {
      ...a,
      estabelecimento: isGenericAcquirerName(a.estabelecimento) ? fuel.postoNome || a.estabelecimento : a.estabelecimento,
      tipoEstabelecimento: 'Posto de combustível',
      subcategoria_id: 'sub-combustivel',
      tipoDespesa: 'combustivel',
      tipoCombustivel: fuel.tipoCombustivel,
      litros: fuel.litros || undefined,
      precoPorLitro: fuel.precoPorLitro || undefined,
      kmAtual: fuel.km || undefined,
    };
  } catch (err: any) {
    console.warn('[WhatsApp] Falha ao extrair dados de combustível da foto, seguindo sem litros/km:', err?.message || err);
    return { ...a, tipoDespesa: 'combustivel' };
  }
}

/**
 * Traduz uma falha do Gemini em mensagem clara pro grupo. Distingue o que
 * NÃO é culpa da mensagem: cota esgotada (plano gratuito — diária ou por
 * minuto) e instabilidade temporária do serviço.
 */
function describeGeminiFailure(err: unknown): { kind: 'quota-daily' | 'quota-minute' | 'busy' | 'other'; text: string; retryMs?: number } {
  if (isGeminiQuotaError(err)) {
    const q = err instanceof GeminiQuotaError ? err : undefined;
    if (!q || q.daily) {
      return {
        kind: 'quota-daily',
        text:
          '🚫 O limite DIÁRIO gratuito do Gemini (IA do Google) acabou — não é problema da sua mensagem. ' +
          'Ele volta sozinho de madrugada (por volta das 4h–5h daqui). Reenvie depois, ou adicione manualmente no app. ' +
          'Dica: ativar o faturamento no Google AI Studio remove esse limite (o uso daqui custa centavos).',
      };
    }
    const secs = Math.max(10, Math.ceil(q.retryAfterMs / 1000));
    return { kind: 'quota-minute', retryMs: Math.min(secs * 1000 + 2000, 120_000), text: `⏳ Atingi o limite por minuto do Gemini (plano gratuito). Vou tentar de novo sozinho em ~${secs}s — não é problema da sua mensagem.` };
  }
  if (isGeminiBusyError(err)) {
    return { kind: 'busy', retryMs: AUTO_RETRY_DELAY_MS, text: '⏳ O Gemini (IA do Google) está instável agora — problema temporário deles, não da sua mensagem. Vou tentar de novo sozinho em 1 minuto.' };
  }
  return { kind: 'other', text: '⚠️ Não consegui ler essa mensagem como despesa. Tente reenviar com mais detalhes ou adicione manualmente no app.' };
}

const AUTO_RETRY_DELAY_MS = 60_000;
const autoRetried = new Set<string>();

export async function ingestExpenseMessage(client: Client, message: Message): Promise<void> {
  const senderName = resolveSenderName(message);
  const messageKey = message.id?._serialized || message.id?.id || `${message.from}-${message.timestamp}`;

  try {
    const isPhoto = message.hasMedia && (message.type === 'image' || message.type === 'document');
    if (isPhoto) {
      const media = await message.downloadMedia();
      if (!media?.data) {
        await replyInGroup(message, '⚠️ Não consegui baixar essa mídia do WhatsApp. Tente reenviar.');
        return;
      }
      const mime = media.mimetype || 'image/jpeg';
      if (message.type === 'document' && !(mime.startsWith('image/') || mime === 'application/pdf')) return; // documento comum, ignora
      if (media.data.length > MAX_MEDIA_BASE64) {
        await replyInGroup(message, '⚠️ Esse arquivo é grande demais pra eu ler (limite ~10 MB). Mande uma foto menor ou adicione no app.');
        return;
      }

      let analyzed = await analyzeReceiptImage(media.data, mime, { knowledgeBlock: await knowledgePromptBlock() });

      if (analyzed.ehComprovante === false) {
        await replyInGroup(message, '🤔 Essa imagem não parece um comprovante de pagamento, então não registrei nada. Se for uma despesa, mande o comprovante ou descreva por texto.');
        return;
      }
      if (analyzed.legivel === false) {
        if (!(analyzed.valorTotal > 0)) {
          await replyInGroup(message, '📷 Não consegui ler o valor nessa imagem (borrada/cortada). Mande outra foto mais nítida ou digite o valor.');
          return;
        }
        analyzed = { ...analyzed, confianca: 'baixa' };
      }

      analyzed = await enrichFuelPhoto(analyzed, media.data, mime);
      await finishExpense(client, message, analyzed, senderName, {
        channel: 'image',
        origemTexto: message.body || '(foto de comprovante)',
        imagemUrl: `data:${mime};base64,${media.data}`,
      });
      return;
    }

    if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
      const media = await message.downloadMedia();
      if (!media?.data) {
        await replyInGroup(message, '⚠️ Não consegui baixar esse áudio do WhatsApp. Tente reenviar.');
        return;
      }
      const result = await analyzeAudioExpense(media.data, media.mimetype || 'audio/ogg', { knowledgeBlock: await knowledgePromptBlock() });
      await handleAnalysisResult(client, message, result, senderName, { channel: 'audio', origemTexto: '(áudio)' });
      return;
    }

    if (message.type === 'chat' && message.body?.trim()) {
      const texto = message.body.trim();
      const result = await analyzeTextExpense(texto, { knowledgeBlock: await knowledgePromptBlock() });
      await handleAnalysisResult(client, message, result, senderName, { channel: 'text', origemTexto: texto });
      return;
    }

    // Tipo não suportado (sticker, localização, etc.) — ignora silenciosamente.
  } catch (err: any) {
    console.error('[WhatsApp] Erro ao analisar despesa recebida:', err?.message || err);

    // Instabilidade do Gemini ≠ conteúdo ilegível: avisa que foi o serviço e
    // tenta de novo UMA vez sozinho em 1 minuto.
    const failure = describeGeminiFailure(err);
    if (failure.retryMs && !autoRetried.has(messageKey)) {
      autoRetried.add(messageKey);
      await replyInGroup(message, failure.text);
      setTimeout(() => {
        ingestExpenseMessage(client, message).catch((e) => console.error('[WhatsApp] Falha na nova tentativa automática:', e));
      }, failure.retryMs);
      return;
    }
    if (failure.kind === 'busy' || failure.kind === 'quota-minute') {
      await replyInGroup(message, '⚠️ O Gemini continua indisponível. Sua mensagem estava ok — reenvie daqui a alguns minutos ou adicione manualmente no app.');
      return;
    }
    await replyInGroup(message, failure.text);
  }
}
