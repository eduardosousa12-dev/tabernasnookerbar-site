/**
 * Media queries compartilhadas. Mantê-las num só lugar evita que cada
 * módulo use um breakpoint diferente do CSS.
 */

const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

/** Desktop de verdade: tela larga E mouse (exclui tablet com toque). */
const desktopPointerQuery = matchMedia('(min-width: 1024px) and (pointer: fine)');

export const prefersReducedMotion = () => reducedMotionQuery.matches;

export const isDesktopPointer = () => desktopPointerQuery.matches;

/** Chama `callback` quando qualquer uma das preferências acima mudar. */
export function onMediaChange(callback) {
  reducedMotionQuery.addEventListener('change', callback);
  desktopPointerQuery.addEventListener('change', callback);
}
