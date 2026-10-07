/**
 * Rolagem suave para âncoras internas (#cardapio, #perguntas…).
 * Respeita "reduzir movimento" (pula direto) e devolve o foco à seção
 * de destino para quem navega por teclado/leitor de tela.
 */
import { $$ } from '../lib/dom.js';
import { prefersReducedMotion } from '../lib/media.js';

const NAV_OFFSET = 76;
const MIN_DURATION = 400;
const MAX_DURATION = 1200;

/** easeInOutQuint */
const ease = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

function scrollToElement(target) {
  const targetY = target.getBoundingClientRect().top + scrollY - NAV_OFFSET;
  if (prefersReducedMotion()) {
    scrollTo(0, targetY);
    return;
  }

  const startY = scrollY;
  const distance = targetY - startY;
  const duration = Math.min(MAX_DURATION, MIN_DURATION + Math.abs(distance) * 0.25);
  const startTime = performance.now();

  const step = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    scrollTo(0, startY + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** @param {{ beforeScroll?: () => void }} options */
export function initSmoothScroll({ beforeScroll } = {}) {
  for (const link of $$('a[href^="#"]')) {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      beforeScroll?.();
      scrollToElement(target);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }
}
