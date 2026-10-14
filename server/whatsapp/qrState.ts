/**
 * Estado em memória compartilhado entre o cliente do whatsapp-web.js
 * (client.ts, que recebe o QR Code e o status da sessão) e o servidor
 * web local (qrServer.ts, que exibe esses dados numa página simples no
 * navegador).
 */

let currentQrDataUrl: string | null = null;
let currentStatus = 'starting';

export function setQr(dataUrl: string | null): void {
  currentQrDataUrl = dataUrl;
}

export function getQr(): string | null {
  return currentQrDataUrl;
}

export function setStatus(status: string): void {
  currentStatus = status;
  // Depois de autenticar, o QR Code antigo não serve mais pra nada.
  if (status === 'authenticated' || status === 'connected') {
    currentQrDataUrl = null;
  }
}

export function getStatus(): string {
  return currentStatus;
}
