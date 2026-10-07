/**
 * Accordion das perguntas frequentes.
 * Cada <button aria-controls="…" aria-expanded="…"> abre/fecha seu painel.
 */
import { $$ } from '../lib/dom.js';

export function initFaq() {
  for (const button of $$('[data-faq] button[aria-controls]')) {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  }
}
