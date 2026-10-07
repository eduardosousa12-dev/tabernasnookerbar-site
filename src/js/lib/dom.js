/**
 * Utilitários de DOM usados por todos os módulos.
 */

/** Primeiro elemento que casa com o seletor (ou null). */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Todos os elementos que casam com o seletor, como array. */
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Limita um número ao intervalo [0, 1]. */
export const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Executa `callback` quando o navegador estiver ocioso, depois do load.
 * Usado para tudo que é decorativo, para não competir com o LCP.
 */
export function whenIdle(callback, timeout = 800) {
  const schedule = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(() => callback(), { timeout })
      : setTimeout(() => callback(), 1);

  if (document.readyState === 'complete') schedule();
  else addEventListener('load', schedule, { once: true });
}

/** Observa quando um elemento entra/sai da viewport. Retorna o observer. */
export function observeVisibility(element, callback, options = {}) {
  const observer = new IntersectionObserver(
    ([entry]) => callback(entry.isIntersecting, entry),
    options,
  );
  observer.observe(element);
  return observer;
}
