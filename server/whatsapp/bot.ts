import dotenv from 'dotenv';
import { startWhatsAppBot } from './client';
import { ingestExpenseMessage, resolvePendingConfirmation, resolvePendingQuestion, restorePendingConfirmations } from './expenseIngest';
import { startQrServer } from './qrServer';

dotenv.config();

const QR_PORT = Number(process.env.WHATSAPP_QR_PORT) || 3101;

/**
 * Entrypoint independente do bot do WhatsApp — NÃO é importado por
 * server.ts e não participa do build/deploy da Vercel. Roda como um
 * processo separado e sempre ativo (PC de casa, Raspberry Pi, VPS,
 * Railway/Fly.io), conectado ao mesmo Supabase do app principal.
 *
 * Início: `npm run whatsapp-bot`
 */

const GROUP_ID = process.env.WHATSAPP_GROUP_ID || '';

if (!GROUP_ID) {
  console.warn(
    '[WhatsApp] WHATSAPP_GROUP_ID não configurado. O bot vai conectar e logar o chatId de toda mensagem recebida — ' +
      'use esse valor para preencher WHATSAPP_GROUP_ID no .env e reinicie. Até lá, NENHUMA mensagem será processada.'
  );
}

// Timestamp (segundos) de quando o processo iniciou. Mensagens mais
// antigas que isso são histórico re-sincronizado pelo WhatsApp Web ao
// reconectar — sem esse filtro, cada restart reprocessaria o histórico
// recente do grupo inteiro como se fossem despesas novas (chamando o
// Gemini e gerando rascunhos duplicados), e a sincronização desse
// backlog é o que faz a conexão parecer lenta/travada.
const STARTED_AT = Math.floor(Date.now() / 1000);

async function main() {
  startQrServer(QR_PORT);
  console.log(`[WhatsApp] Abra http://localhost:${QR_PORT} no navegador para ver o QR Code e o status da conexão.`);

  // Fila serial: as mensagens do grupo são tratadas UMA POR VEZ, na ordem em
  // que chegam. Sem isso, duas despesas em sequência rápida corriam em
  // paralelo e um "sim" podia confirmar a despesa errada (ou a pergunta e a
  // resposta se atropelavam).
  let queue: Promise<unknown> = Promise.resolve();

  // Reagenda confirmações que estavam pendentes antes de um reinício do bot —
  // só quando o WhatsApp estiver de fato pronto (e uma única vez, mesmo que o
  // cliente seja reiniciado depois pelo watchdog/reconexão).
  let restored = false;

  await startWhatsAppBot(
    (c, message) => {
      const run = queue.then(() => handleMessage(c, message));
      queue = run.catch(() => undefined);
      return run;
    },
    (c) => {
      if (restored) return;
      restored = true;
      restorePendingConfirmations(c);
    }
  );
}

async function handleMessage(client: Parameters<typeof resolvePendingQuestion>[0], message: Parameters<typeof resolvePendingQuestion>[1]) {
    // Ignora qualquer mensagem anterior ao início deste processo —
    // histórico re-sincronizado, nunca despesa nova. Verificação mais
    // barata (sem round-trip ao navegador), por isso vem primeiro.
    if (message.timestamp < STARTED_AT) return;

    // Log de diagnóstico: toda mensagem chega aqui ANTES de qualquer
    // filtro, para sabermos no terminal o que está realmente passando.
    console.log(
      `[WhatsApp] message_create recebida — type=${message.type} from=${message.from} author=${message.author || '(nenhum)'} fromMe=${message.fromMe} body="${(message.body || '').slice(0, 40)}"`
    );

    // Regra única e auditável: só processa mensagens do grupo autorizado.
    // Qualquer outro chat/número é ignorado silenciosamente — o bot nunca
    // lê, responde ou envia nada fora desse grupo.
    //
    // `message.author` só existe em mensagens de grupo (é quem enviou,
    // diferente de `message.from`, que ali é o id do grupo). Evitamos
    // `message.getChat()`/`chat.isGroup` de propósito: fazem um
    // round-trip ao WhatsApp Web dentro do navegador que se mostrou
    // instável para chats no formato novo "@lid", lançando erro.
    if (!message.author) {
      console.log('[WhatsApp] Ignorado: não é mensagem de grupo.');
      return;
    }

    if (!GROUP_ID) {
      console.log('[WhatsApp] chatId recebido (copie para WHATSAPP_GROUP_ID se for o grupo certo):', message.from);
      return;
    }

    if (message.from !== GROUP_ID) {
      console.log(`[WhatsApp] Ignorado: grupo "${message.from}" não é o autorizado ("${GROUP_ID}").`);
      return;
    }

    // Antes de tratar como despesa nova: 1) é resposta a uma PERGUNTA
    // pendente (falta de dado)? 2) é resposta "sim"/"não" a uma
    // CONFIRMAÇÃO pendente (rascunho já criado)? A ordem importa — uma
    // pergunta pendente é resolvida antes de qualquer confirmação.
    const resolvedQuestion = await resolvePendingQuestion(client, message);
    if (resolvedQuestion) return;

    const resolved = await resolvePendingConfirmation(message);
    if (resolved) return;

    console.log('[WhatsApp] Mensagem do grupo autorizado — iniciando análise da despesa...');
    await ingestExpenseMessage(client, message);
}

main().catch((err) => {
  console.error('[WhatsApp] Falha ao iniciar o bot:', err);
  process.exit(1);
});
