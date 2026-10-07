/**
 * Revela blocos marcados com [data-reveal] quando entram na tela.
 * Os filhos diretos entram em cascata (até 7 níveis de atraso).
 * O CSS correspondente está em css/base/motion.css.
 */
import { $$ } from '../lib/dom.js';

const MAX_STAGGER_STEPS = 6;

export function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );

  for (const block of $$('[data-reveal]')) {
    Array.from(block.children).forEach((child, index) => {
      child.style.setProperty('--reveal-index', String(Math.min(index, MAX_STAGGER_STEPS)));
    });
    observer.observe(block);
  }
}
