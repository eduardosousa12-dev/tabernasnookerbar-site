/**
 * Mapa do Google carregado só sob demanda (privacidade e performance).
 * Dentro de um iframe (ex.: pré-visualização), abre o Maps em nova aba.
 */
import site from '../site-config.js';
import { $ } from '../lib/dom.js';

export function initMapEmbed() {
  const container = $('[data-map]');
  const button = container && $('[data-map-load]', container);
  if (!button) return;

  const query = encodeURIComponent(`${site.address.street}, ${site.address.city} ${site.address.state}`);

  button.addEventListener('click', () => {
    if (window.self !== window.top) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.title = `Mapa: ${site.name}, ${site.address.street}, ${site.address.city}`;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.src = `https://www.google.com/maps?q=${query}&output=embed`;
    container.replaceChildren(iframe);
  });
}
