// Precisa vir ANTES do import do whatsapp-web.js (ver wwebjsPatch.ts).
import './wwebjsPatch';
// whatsapp-web.js é um pacote CommonJS; com "type": "module" no projeto,
// a importação nomeada direta (`import { Client } from ...`) falha em
// runtime ("does not provide an export named") mesmo validando no tsc.
// Import default + destructuring é a forma robusta de interoperar aqui.
import whatsappWebJs, { type Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { setQr, setStatus } from './qrState';
import { wasSentByBot } from './ownMessages';

const { Client, LocalAuth } = whatsappWebJs;
type Client = InstanceType<typeof Client>;

/**
 * Pasta onde o whatsapp-web.js persiste a sessão de login (LocalAuth)
 * para não precisar escanear o QR Code a cada reinício do processo.
 * Fica fora do versionamento — ver .gitignore.
 *
 * Biblioteca e configuração do puppeteer espelham o projeto EDUCAR
 * (C:\Users\Usuario\Documents\EDUCAR\server.cjs), que já funciona em
 * produção nesta mesma máquina — trocamos venom-bot por whatsapp-web.js
 * depois que o venom-bot falhou ao abrir o Chrome/gerar QR no Windows.
 */
const CLIENT_ID = 'duarte-financas-bot';
const SESSION_FOLDER = './tokens';

/**
 * Se depois de `authenticated` o `ready` não vier neste prazo, o cliente está
 * travado (bug intermitente do whatsapp-web.js: wwebjs#201946/#201821 — o
 * `ready` simplesmente nunca dispara; a sessão fica "autenticada" para
 * sempre). Reiniciar o cliente (mesma sessão salva, sem novo QR) resolve na
 * grande maioria das vezes. Sincronização normal leva bem menos que isso.
 */
const READY_TIMEOUT_MS = 120_000;
/** Sem QR, sem autenticação e sem ready neste prazo: a página nem carregou direito. */
const BOOT_TIMEOUT_MS = 180_000;
const MAX_WATCHDOG_RESTARTS = 4;

export type IncomingExpenseMessage = Message;
type OnMessage = (client: Client, message: IncomingExpenseMessage) => void | Promise<void>;
type OnReady = (client: Client) => void;

let activeClient: Client | null = null;
/** Cliente atual — pode mudar após reconexão/reinício; use este em tarefas adiadas (timers). */
export function getActiveClient(): Client | null {
  return activeClient;
}

let reconnecting = false;
let watchdogRestarts = 0;

function scheduleReconnect(onMessage: OnMessage, onReady: OnReady | undefined, delayMs: number) {
  if (reconnecting) return;
  reconnecting = true;
  console.log(`[WhatsApp] Reconectando em ${delayMs / 1000}s...`);
  setTimeout(() => {
    reconnecting = false;
    startWhatsAppBot(onMessage, onReady).catch((err) => console.error('[WhatsApp] Falha ao reconectar:', err));
  }, delayMs);
}

/**
 * Inicializa o whatsapp-web.js e chama `onMessage` para TODA mensagem
 * recebida em QUALQUER chat — o filtro de "só o grupo autorizado" é
 * feito pelo chamador (bot.ts), nunca aqui, para deixar a regra
 * explícita e fácil de auditar em um único lugar.
 */
export async function startWhatsAppBot(onMessage: OnMessage, onReady?: OnReady): Promise<Client> {
  setStatus('starting');

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: CLIENT_ID,
      dataPath: SESSION_FOLDER,
    }),
    puppeteer: {
      headless: true,
      args: process.platform === 'linux'
        ? [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ]
        : ['--no-first-run'],
    },
  });
  activeClient = client;

  // Eventos de um cliente já descartado pelo watchdog não devem reagir.
  let dead = false;
  let bootTimer: NodeJS.Timeout | undefined;
  let readyTimer: NodeJS.Timeout | undefined;
  const clearTimers = () => {
    if (bootTimer) clearTimeout(bootTimer);
    if (readyTimer) clearTimeout(readyTimer);
  };

  const restartStuckClient = async (reason: string) => {
    if (dead) return;
    dead = true;
    clearTimers();
    watchdogRestarts++;
    console.warn(`[WhatsApp] ⚠️ ${reason} — reiniciando o cliente (tentativa ${watchdogRestarts}/${MAX_WATCHDOG_RESTARTS}).`);
    try {
      await client.destroy();
    } catch {}
    if (watchdogRestarts > MAX_WATCHDOG_RESTARTS) {
      setStatus('failed');
      console.error(
        '[WhatsApp] ❌ O WhatsApp Web não concluiu o carregamento após várias tentativas. Feche o bot, ' +
          'confira a internet do celular e, se persistir, apague a pasta tokens/session-duarte-financas-bot (vai pedir QR de novo).'
      );
      return;
    }
    setTimeout(() => {
      startWhatsAppBot(onMessage, onReady).catch((err) => console.error('[WhatsApp] Falha ao reiniciar o cliente:', err));
    }, 3000);
  };

  bootTimer = setTimeout(() => restartStuckClient('WhatsApp Web não chegou ao QR/autenticação a tempo'), BOOT_TIMEOUT_MS);

  client.on('qr', async (qr) => {
    if (bootTimer) clearTimeout(bootTimer); // esperando a pessoa escanear: sem watchdog
    try {
      const base64Qr = await qrcode.toDataURL(qr);
      setQr(base64Qr);
      setStatus('qr_pending');
    } catch (err) {
      console.error('[WhatsApp] Falha ao gerar imagem do QR:', err);
    }
  });

  // Progresso do carregamento da conversa — mostra se está andando ou travado.
  client.on('loading_screen', (percent, message) => {
    console.log(`[WhatsApp] Carregando… ${percent}% (${message})`);
    setStatus(`loading_${percent}`);
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Autenticado — sincronizando...');
    setStatus('authenticated');
    if (bootTimer) clearTimeout(bootTimer);
    if (readyTimer) clearTimeout(readyTimer);
    readyTimer = setTimeout(
      () => restartStuckClient(`"ready" não chegou em ${READY_TIMEOUT_MS / 1000}s após autenticar (bug conhecido wwebjs#201946)`),
      READY_TIMEOUT_MS
    );
  });

  client.on('auth_failure', (msg) => {
    if (dead) return;
    console.error('[WhatsApp] Falha de autenticação:', msg);
    clearTimers();
    setStatus('disconnected');
    scheduleReconnect(onMessage, onReady, 30_000);
  });

  client.on('ready', () => {
    if (dead) return;
    clearTimers();
    watchdogRestarts = 0;
    console.log('[WhatsApp] ✅ Conectado e ouvindo mensagens.');
    setStatus('connected');
    onReady?.(client);
  });

  client.on('disconnected', (reason) => {
    if (dead) return;
    console.warn('[WhatsApp] Desconectado:', reason);
    clearTimers();
    setStatus('disconnected');
    scheduleReconnect(onMessage, onReady, 30_000);
  });

  // 'message_create' inclui mensagens enviadas pelo PRÓPRIO número
  // conectado ao bot — necessário porque o whatsapp-web.js nunca emite
  // 'message' (só "recebidas") para mensagens de quem está logado no
  // bot. Como o bot roda com o WhatsApp pessoal do Felipe ou da Camila,
  // uma despesa digitada por essa mesma pessoa no grupo precisa ser
  // capturada também. Só pulamos as mensagens que o PRÓPRIO bot gerou
  // como resposta (ver ownMessages.ts) para não reprocessar as
  // confirmações e entrar em loop.
  client.on('message_create', async (message) => {
    if (dead) return;
    if (message.fromMe && wasSentByBot(message.id._serialized)) return;
    try {
      await onMessage(client, message);
    } catch (err) {
      console.error('[WhatsApp] Erro ao processar mensagem:', err);
    }
  });

  try {
    await client.initialize();
  } catch (err) {
    if (!dead) throw err;
  }
  return client;
}
