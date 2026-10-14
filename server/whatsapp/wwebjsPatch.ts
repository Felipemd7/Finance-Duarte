import { createRequire } from 'node:module';

/**
 * Correção em runtime (sem tocar no node_modules) para o bug do
 * whatsapp-web.js em que o evento `ready` NUNCA dispara depois de
 * `authenticated` (issue wwebjs/whatsapp-web.js#201946, PR #201958 ainda
 * aberto): o WhatsApp Web destrói um iframe efêmero (pdf-viewer) enquanto a
 * biblioteca registra suas funções com `page.exposeFunction`, a chamada
 * rejeita com "Target closed" e o erro é engolido — o bot fica pra sempre em
 * "authenticated". Aqui o helper passa a tentar de novo nesses erros
 * transitórios (até 5x, espera linear de 200ms), igual ao PR.
 *
 * PRECISA ser importado ANTES de 'whatsapp-web.js': o Client.js faz
 * `const { exposeFunctionIfAbsent } = require('./util/Puppeteer')` na hora em
 * que carrega, então só um patch anterior a isso é enxergado. Quando o
 * upstream publicar a correção este arquivo vira um no-op inofensivo.
 */
const require = createRequire(import.meta.url);

const TRANSIENT = /target closed|detached frame|execution context was destroyed|session closed|frame was detached|protocol error/i;
const MAX_ATTEMPTS = 5;

const util = require('whatsapp-web.js/src/util/Puppeteer');
const original: (page: unknown, name: string, fn: unknown) => Promise<void> = util.exposeFunctionIfAbsent;

if (original && !(util as any).__retryPatched) {
  util.exposeFunctionIfAbsent = async (page: unknown, name: string, fn: unknown) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await original(page, name, fn);
      } catch (err: any) {
        const msg = String(err?.message || err);
        if (!TRANSIENT.test(msg) || attempt >= MAX_ATTEMPTS) throw err;
        console.warn(`[WhatsApp] exposeFunction("${name}") falhou de forma transitória (${msg}) — tentativa ${attempt}/${MAX_ATTEMPTS}.`);
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  };
  (util as any).__retryPatched = true;
}
