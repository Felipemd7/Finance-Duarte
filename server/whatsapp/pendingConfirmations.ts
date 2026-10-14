import fs from 'node:fs';
import path from 'node:path';
import type { Receipt, Transaction } from '../../src/types';

/**
 * Confirmações pendentes de aprovação pelo grupo. O timer vive em memória,
 * mas a lista é espelhada em disco (`tokens/pending-confirmations.json`, pasta
 * já fora do git) para sobreviver a um reinício do bot: no boot,
 * `loadPersisted()` devolve o que estava pendente e o chamador reagenda o
 * tempo que faltava (ou confirma na hora se já passou dos 10 min).
 */

export const CONFIRM_TIMEOUT_MS = 10 * 60 * 1000;
const STORE_FILE = path.resolve('./tokens/pending-confirmations.json');

export interface PendingConfirmation {
  receiptId: string;
  chatId: string;
  receipt: Receipt;
  transaction: Transaction;
  createdAt: number;
  timer: NodeJS.Timeout;
}

type Persisted = Omit<PendingConfirmation, 'timer'>;

const pendingByChat = new Map<string, PendingConfirmation[]>();

function persist(): void {
  try {
    const all: Persisted[] = [...pendingByChat.values()].flat().map(({ timer: _t, ...rest }) => rest);
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(all));
  } catch (err: any) {
    console.warn('[WhatsApp] Não consegui salvar confirmações pendentes em disco:', err?.message || err);
  }
}

export function loadPersisted(): Persisted[] {
  try {
    if (!fs.existsSync(STORE_FILE)) return [];
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) as Persisted[];
  } catch {
    return [];
  }
}

export function addPending(
  entry: Omit<PendingConfirmation, 'timer' | 'createdAt'> & { createdAt?: number },
  onTimeout: (pending: PendingConfirmation) => void
): PendingConfirmation {
  const createdAt = entry.createdAt ?? Date.now();
  const remaining = Math.max(0, CONFIRM_TIMEOUT_MS - (Date.now() - createdAt));

  const timer = setTimeout(() => {
    const pending = removePending(entry.receiptId);
    if (pending) onTimeout(pending);
  }, remaining);

  const pending: PendingConfirmation = { ...entry, createdAt, timer };
  const list = pendingByChat.get(entry.chatId) || [];
  list.push(pending);
  pendingByChat.set(entry.chatId, list);
  persist();
  return pending;
}

/** FIFO — a confirmação mais antiga desse chat ainda sem resposta. */
export function getOldestPending(chatId: string): PendingConfirmation | undefined {
  const list = pendingByChat.get(chatId);
  return list && list.length > 0 ? list[0] : undefined;
}

export function removePending(receiptId: string): PendingConfirmation | undefined {
  for (const [chatId, list] of pendingByChat) {
    const idx = list.findIndex((p) => p.receiptId === receiptId);
    if (idx === -1) continue;
    const [pending] = list.splice(idx, 1);
    clearTimeout(pending.timer);
    if (list.length === 0) pendingByChat.delete(chatId);
    else pendingByChat.set(chatId, list);
    persist();
    return pending;
  }
  return undefined;
}
