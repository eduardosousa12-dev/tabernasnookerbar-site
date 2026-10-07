/**
 * Cardápio em carrossel que avança sozinho.
 *
 * - A cada 1 s rola suavemente para o próximo prato; depois do último volta ao primeiro.
 * - Para enquanto o visitante interage (toque, arrasto, roda do mouse, foco) e
 *   retoma alguns segundos depois. Com o mouse em cima, fica parado até sair.
 * - Só anda com o carrossel visível, a aba ativa e as animações ligadas.
 * - Botões: anterior, próximo e pausar/retomar (exigência de acessibilidade
 *   para conteúdo que se move sozinho — WCAG 2.2.2).
 *
 * A rolagem é a nativa (overflow-x + scroll-snap), então o dedo sempre funciona.
 */
import { $, $$, observeVisibility } from '../lib/dom.js';
import { isAmbientMotionOn, onAmbientMotionChange } from '../lib/ambient-motion.js';

const ADVANCE_EVERY_MS = 1000;
const RESUME_AFTER_INTERACTION_MS = 5000;
const SETTLE_MS = 120;

const LABELS = { pause: 'Pausar passagem automática', resume: 'Retomar passagem automática' };

export function initMenuCarousel(root = $('[data-menu-carousel]')) {
  if (!root) return;
  const viewport = $('[data-carousel-viewport]', root);
  const slides = $$('[data-carousel-slide]', root);
  const prevButton = $('[data-carousel-prev]', root);
  const nextButton = $('[data-carousel-next]', root);
  const toggleButton = $('[data-carousel-toggle]', root);
  if (!viewport || slides.length < 2) return;

  let current = 0;
  let pausedByUser = false;
  let holdUntil = 0;
  let onScreen = false;
  let timer = 0;

  /* ---------- posição ---------- */

  /** Slide cujo centro está mais perto do centro do viewport. */
  function nearestSlide() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  }

  function markActive(index) {
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
  }

  function goTo(index) {
    const slide = slides[(index + slides.length) % slides.length];
    const left = slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2;
    viewport.scrollTo({ left, behavior: 'smooth' });
    markActive(slides.indexOf(slide));
  }

  /* ---------- passagem automática ---------- */

  const canAdvance = () =>
    onScreen && !pausedByUser && !document.hidden && isAmbientMotionOn() && performance.now() >= holdUntil;

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (canAdvance()) goTo(current + 1);
      schedule();
    }, ADVANCE_EVERY_MS);
  }

  const holdFor = (ms) => {
    holdUntil = performance.now() + ms;
  };

  /* ---------- controles ---------- */

  function setPaused(paused) {
    pausedByUser = paused;
    toggleButton.setAttribute('aria-pressed', String(paused));
    toggleButton.setAttribute('aria-label', paused ? LABELS.resume : LABELS.pause);
    $('[data-icon="pause"]', toggleButton).hidden = paused;
    $('[data-icon="play"]', toggleButton).hidden = !paused;
  }

  prevButton?.addEventListener('click', () => {
    holdFor(RESUME_AFTER_INTERACTION_MS);
    goTo(current - 1);
  });
  nextButton?.addEventListener('click', () => {
    holdFor(RESUME_AFTER_INTERACTION_MS);
    goTo(current + 1);
  });
  toggleButton?.addEventListener('click', () => setPaused(!pausedByUser));

  // Interação manual pausa por alguns segundos; mouse em cima pausa até sair
  for (const type of ['pointerdown', 'touchstart', 'wheel', 'focusin']) {
    viewport.addEventListener(type, () => holdFor(RESUME_AFTER_INTERACTION_MS), { passive: true });
  }
  viewport.addEventListener('mouseenter', () => holdFor(Infinity));
  viewport.addEventListener('mouseleave', () => holdFor(0));

  // Depois que a rolagem (do dedo ou automática) assenta, atualiza o slide atual
  let settleTimer = 0;
  viewport.addEventListener(
    'scroll',
    () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => markActive(nearestSlide()), SETTLE_MS);
    },
    { passive: true },
  );

  // Setas do teclado quando o carrossel está focado
  viewport.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    holdFor(RESUME_AFTER_INTERACTION_MS);
    goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
  });

  observeVisibility(
    viewport,
    (visible) => {
      onScreen = visible;
    },
    { threshold: 0.5 },
  );
  onAmbientMotionChange(() => holdFor(0));

  markActive(0);
  schedule();
}
