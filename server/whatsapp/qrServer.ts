import express from 'express';
import { getQr, getStatus } from './qrState';

/**
 * Painel web local e mínimo, exclusivo do processo `whatsapp-bot`, para
 * conectar o WhatsApp sem depender de QR Code em ASCII no terminal (que
 * costuma renderizar ilegível em terminais do Windows). Roda numa porta
 * própria (WHATSAPP_QR_PORT), separada do app principal (porta 3000) —
 * não faz parte do build/deploy da Vercel.
 */

const STATUS_LABELS: Record<string, string> = {
  starting: 'Iniciando o bot…',
  qr_pending: 'Aguardando leitura do QR Code abaixo.',
  authenticated: '✅ Autenticado — sincronizando mensagens…',
  connected: '✅ Conectado! Pode fechar esta página.',
  disconnected: '❌ Desconectado — tentando reconectar automaticamente…',
  failed: '❌ Não consegui concluir o carregamento após várias tentativas. Veja o terminal.',
};

export function startQrServer(port: number): void {
  const app = express();

  app.get('/', (_req, res) => {
    const status = getStatus();
    const label = STATUS_LABELS[status] || (status.startsWith('loading_') ? `Carregando o WhatsApp… ${status.slice(8)}%` : status);
    const qr = getQr();

    res.send(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="3" />
<title>Conexão WhatsApp — Finanças Casal Duarte</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
  h1 { font-size: 1.1rem; margin-bottom: 4px; }
  p.status { font-size: 1rem; margin: 12px 0 24px; }
  img { background: #fff; padding: 16px; border-radius: 12px; max-width: 320px; width: 90vw; }
  .hint { color: #94a3b8; font-size: 0.85rem; margin-top: 16px; max-width: 360px; }
</style>
</head>
<body>
  <h1>Conexão WhatsApp · Finanças Casal Duarte</h1>
  <p class="status">${label}</p>
  ${qr ? `<img src="${qr}" alt="QR Code do WhatsApp" />` : ''}
  <p class="hint">Esta página atualiza sozinha a cada 3 segundos. Escaneie com WhatsApp → Configurações → Dispositivos conectados → Conectar dispositivo.</p>
</body>
</html>`);
  });

  app.get('/status', (_req, res) => {
    res.json({ status: getStatus(), hasQr: Boolean(getQr()) });
  });

  app.listen(port, () => {
    console.log(`[WhatsApp] Painel de conexão disponível em http://localhost:${port}`);
  });
}
