/**
 * Ponto de entrada do site.
 *
 * Ordem de inicialização:
 *  1. Essencial: links do WhatsApp, menu, rolagem para âncoras, perguntas,
 *     selo de horário, mapa, política de privacidade.
 *  2. Efeitos leves: navegação ao rolar, revelação das seções, carrossel.
 *  3. Pesado ou decorativo (vídeo, cursor) só quando o navegador fica ocioso.
 */
import { $, whenIdle } from './lib/dom.js';

import { createToast } from './components/toast.js';
import { initWhatsAppLinks } from './components/whatsapp-links.js';
import { initOpeningStatus } from './components/opening-status.js';
import { initMobileMenu } from './components/mobile-menu.js';
import { initSmoothScroll } from './components/smooth-scroll.js';
import { initFaq } from './components/faq.js';
import { initMapEmbed } from './components/map-embed.js';
import { initPrivacyDialog } from './components/privacy-dialog.js';

import { initSiteHeader } from './components/site-header.js';
import { initReveal } from './components/reveal.js';
import { initAmbientVideo } from './components/ambient-video.js';
import { initMotionToggle } from './components/motion-toggle.js';

import { initMenuCarousel } from './components/menu-carousel.js';
import { initPointerEffects } from './components/pointer-effects.js';

// 1. Essencial
const toast = createToast();
const mobileMenu = initMobileMenu();
initSmoothScroll({ beforeScroll: mobileMenu.close });
initWhatsAppLinks({ toast });
initOpeningStatus();
initFaq();
initMapEmbed();
initPrivacyDialog();

const year = $('[data-current-year]');
if (year) year.textContent = String(new Date().getFullYear());

// 2. Efeitos de scroll e entrada
initSiteHeader();
initReveal();
initMotionToggle();
initMenuCarousel();

// 3. Pesado ou decorativo: o vídeo do topo (1,3 MB) só começa a baixar depois que a
//    página carregou, para não disputar banda com o que aparece primeiro.
whenIdle(initAmbientVideo);
whenIdle(initPointerEffects, 1500);
