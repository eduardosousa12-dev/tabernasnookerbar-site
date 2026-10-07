/**
 * Menu de tela cheia do celular, com foco preso enquanto aberto e Esc para fechar.
 */
import { $, $$ } from '../lib/dom.js';

export function initMobileMenu() {
  const menu = $('#mobile-menu');
  const openButton = $('[aria-controls="mobile-menu"]');
  const closeButton = menu && $('[data-menu-close]', menu);
  if (!menu || !openButton || !closeButton) return { close() {} };

  let returnFocusTo = null;
  const isOpen = () => menu.classList.contains('is-open');

  function open() {
    returnFocusTo = document.activeElement;
    menu.classList.add('is-open');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    // espera a transição começar para o foco não "pular" a animação
    setTimeout(() => closeButton.focus(), 50);
  }

  function close() {
    if (!isOpen()) return;
    menu.classList.remove('is-open');
    menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    returnFocusTo?.focus({ preventScroll: true });
  }

  function trapFocus(event) {
    if (event.key === 'Escape') return close();
    if (event.key !== 'Tab') return;

    const focusable = $$('a, button', menu);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  menu.addEventListener('keydown', trapFocus);

  return { open, close };
}
