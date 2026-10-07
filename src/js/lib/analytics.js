/**
 * Envia eventos para o dataLayer (Google Tag Manager / GA4).
 * Sem GTM instalado, os eventos ficam só no array e nada quebra.
 *
 * Eventos usados no site:
 *   cta_click   { cta: 'hero' | 'nav' | 'form' | ... }
 *   video_play  { video: 'ambiente' }
 */
export function track(event, data = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}
