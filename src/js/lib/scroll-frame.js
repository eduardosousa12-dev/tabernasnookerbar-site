/**
 * Um único loop de scroll para a página inteira.
 *
 * Cada efeito se inscreve com `onScrollFrame(measure)`:
 *   - `measure(state)` só LÊ o layout (getBoundingClientRect etc.)
 *     e devolve uma função que só ESCREVE (classes, estilos).
 *   - Todas as leituras de todos os efeitos rodam primeiro e todas as escritas
 *     depois. Assim o navegador calcula o layout uma vez por frame, sem
 *     "reflow forçado" (ler depois de escrever obriga a recalcular).
 */

const effects = new Set();
let scheduled = false;

function run() {
  scheduled = false;
  const viewportHeight = innerHeight;
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;
  const state = {
    scrollY,
    viewportHeight,
    maxScroll,
    progress: maxScroll > 0 ? scrollY / maxScroll : 0,
  };

  const writes = [];
  for (const measure of effects) {
    const write = measure(state);
    if (write) writes.push(write);
  }
  for (const write of writes) write();
}

/** Agenda uma rodada dos efeitos para o próximo frame. */
export function requestScrollFrame() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(run);
}

/**
 * Inscreve um efeito e já o agenda uma vez.
 * @param {(state) => (void | (() => void))} measure
 */
export function onScrollFrame(measure) {
  effects.add(measure);
  requestScrollFrame();
  return () => effects.delete(measure);
}

addEventListener('scroll', requestScrollFrame, { passive: true });
addEventListener('resize', requestScrollFrame);
