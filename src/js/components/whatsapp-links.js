/**
 * Links de WhatsApp com mensagem pronta.
 *
 * Markup: <a href="https://wa.me/NUMERO" data-wa="default" data-cta="hero">
 *   data-wa  → chave da mensagem em site.config.json (whatsapp.messages)
 *   data-cta → nome do botão no evento de analytics
 * O href no HTML já funciona sem JS; aqui só acrescentamos o texto.
 */
import site from '../site-config.js';
import { $$ } from '../lib/dom.js';
import { track } from '../lib/analytics.js';
import { buildWhatsAppUrl } from '../lib/whatsapp.js';

const LOADING_MS = 1400;

export function initWhatsAppLinks({ toast }) {
  const { number, messages } = site.whatsapp;

  for (const link of $$('[data-wa]')) {
    const message = messages[link.dataset.wa] ?? messages.default;
    link.href = buildWhatsAppUrl(number, message);

    link.addEventListener('click', () => {
      track('cta_click', { cta: link.dataset.cta ?? 'whatsapp' });
      if (link.classList.contains('btn')) {
        link.classList.add('is-loading');
        setTimeout(() => link.classList.remove('is-loading'), LOADING_MS);
      }
      toast.show('Abrindo o WhatsApp com a mensagem pronta…');
    });
  }
}
