/**
 * Política de privacidade em <dialog> nativo (foco preso e Esc já vêm do navegador).
 * Qualquer botão com [data-privacy-open] abre; clicar no fundo fecha.
 */
import { $, $$ } from '../lib/dom.js';

export function initPrivacyDialog() {
  const dialog = $('#privacidade');
  if (!dialog) return;

  $$('[data-privacy-open]').forEach((button) => {
    button.addEventListener('click', () => dialog.showModal());
  });
  $('[data-privacy-close]', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
