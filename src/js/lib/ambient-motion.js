/**
 * Estado global "animações ambientes ligadas/pausadas".
 *
 * Animações ambientes = as que rodam sozinhas (mesa de sinuca, faixa de
 * avaliações, vídeo em loop). Elas funcionam mesmo com "reduzir movimento"
 * ativo no sistema, mas o visitante pode pausá-las pelo botão da mesa.
 */

let paused = false;
const listeners = new Set();

export const isAmbientMotionOn = () => !paused;

export function setAmbientMotionPaused(value) {
  paused = Boolean(value);
  listeners.forEach((listener) => listener(!paused));
}

/** Registra um callback `(isOn) => void`. Retorna a função para remover. */
export function onAmbientMotionChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
