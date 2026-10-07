/**
 * Vídeo real do salão em "Quem somos".
 *  - Perto da tela: carrega e toca um loop curto, sem som (data-loop-src).
 *  - Botão "Assistir com som": troca para o vídeo completo com controles (data-full-src).
 * Nada é baixado antes de a seção chegar perto da viewport.
 */
import { $, observeVisibility } from '../lib/dom.js';
import { track } from '../lib/analytics.js';
import { isAmbientMotionOn, onAmbientMotionChange } from '../lib/ambient-motion.js';

export function initAmbientVideo(figure = $('[data-ambient-video]')) {
  if (!figure) return;
  const video = $('video', figure);
  const playButton = $('[data-video-play]', figure);

  let loaded = false;
  let fullMode = false;

  const playLoop = () => {
    if (!fullMode && isAmbientMotionOn()) video.play().catch(() => {});
  };

  observeVisibility(
    video,
    (visible) => {
      if (fullMode) return;
      if (!visible) return video.pause();
      if (!loaded) {
        loaded = true;
        video.src = video.dataset.loopSrc;
      }
      playLoop();
    },
    { rootMargin: '200px 0px' },
  );

  onAmbientMotionChange((on) => {
    if (fullMode) return;
    if (on) playLoop();
    else video.pause();
  });

  playButton.addEventListener('click', () => {
    fullMode = true;
    loaded = true;
    figure.classList.add('is-playing');
    Object.assign(video, { loop: false, muted: false, controls: true, preload: 'auto' });
    video.src = video.dataset.fullSrc;
    video.play().catch(() => {});
    track('video_play', { video: 'ambiente' });
  });
}
