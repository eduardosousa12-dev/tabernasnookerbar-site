/**
 * Efeitos só para desktop com mouse (desligados com "reduzir movimento"):
 *  - cursor "bola branca" que segue o mouse com atraso
 *  - botões [data-magnetic] puxados pelo cursor
 *  - cards [data-tilt] inclinam em 3D
 */
import { $, $$ } from '../lib/dom.js';
import { isDesktopPointer, prefersReducedMotion } from '../lib/media.js';

const CURSOR_FOLLOW = 0.2;
const MAGNET_STRENGTH = { x: 0.25, y: 0.35 };
const TILT_DEGREES = { x: 6, y: 8 };
const INTERACTIVE = 'a, button, input, select, label, [data-tilt]';

function initCursor(cursor) {
  const target = { x: -100, y: -100 };
  const current = { x: -100, y: -100 };

  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-hovering', Boolean(event.target.closest(INTERACTIVE)));
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

  const follow = () => {
    current.x += (target.x - current.x) * CURSOR_FOLLOW;
    current.y += (target.y - current.y) * CURSOR_FOLLOW;
    cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

function initMagnetic(element) {
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    const dx = (event.clientX - rect.left - rect.width / 2) * MAGNET_STRENGTH.x;
    const dy = (event.clientY - rect.top - rect.height / 2) * MAGNET_STRENGTH.y;
    element.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  element.addEventListener('pointerleave', () => {
    element.style.transform = '';
  });
}

function initTilt(element) {
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.transform = `perspective(900px) rotateX(${-py * TILT_DEGREES.x}deg) rotateY(${px * TILT_DEGREES.y}deg)`;
  });
  element.addEventListener('pointerleave', () => {
    element.style.transform = '';
  });
}

export function initPointerEffects() {
  if (!isDesktopPointer() || prefersReducedMotion()) return;

  const cursor = $('[data-cursor]');
  if (cursor) initCursor(cursor);
  $$('[data-magnetic]').forEach(initMagnetic);
  $$('[data-tilt]').forEach(initTilt);
}
