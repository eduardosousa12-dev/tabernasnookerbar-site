/**
 * Toast de feedback (ex.: "Abrindo o WhatsApp…").
 * Markup: <div class="toast" data-toast><i class="ball"></i><span data-toast-text></span></div>
 */
import { $ } from '../lib/dom.js';

const VISIBLE_MS = 3200;

export function createToast(root = $('[data-toast]')) {
  const text = root && $('[data-toast-text]', root);
  let hideTimer;

  return {
    show(message) {
      if (!root) return;
      text.textContent = message;
      root.classList.add('is-visible');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => root.classList.remove('is-visible'), VISIBLE_MS);
    },
  };
}
