/**
 * Botão "Pausar animações" sobre a mesa do hero.
 * Alterna o estado global de lib/ambient-motion.js (mesa, faixa e vídeo ouvem).
 */
import { $ } from '../lib/dom.js';
import { isAmbientMotionOn, setAmbientMotionPaused } from '../lib/ambient-motion.js';

const LABELS = { pause: 'Pausar animações', resume: 'Retomar animações' };

export function initMotionToggle(button = $('[data-motion-toggle]')) {
  if (!button) return;
  const label = $('[data-motion-label]', button);
  const pauseIcon = $('[data-icon="pause"]', button);
  const playIcon = $('[data-icon="play"]', button);

  button.addEventListener('click', () => {
    const paused = isAmbientMotionOn();
    setAmbientMotionPaused(paused);
    button.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? LABELS.resume : LABELS.pause;
    pauseIcon.hidden = paused;
    playIcon.hidden = !paused;
  });
}
