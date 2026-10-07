/**
 * Selo "Aberto agora / Abre hoje às 16h" no hero, calculado no fuso do bar.
 * Markup: <p data-open-status><span …dot></span><span data-open-status-text>…</span></p>
 */
import site from '../site-config.js';
import { $ } from '../lib/dom.js';
import { getOpeningStatus, getZonedTime } from '../lib/opening-hours.js';

export function initOpeningStatus(root = $('[data-open-status]')) {
  if (!root) return;
  const { hours } = site;
  const status = getOpeningStatus(getZonedTime(new Date(), hours.timezone), hours);
  root.dataset.open = String(status.open);
  $('[data-open-status-text]', root).textContent = status.label;
}
