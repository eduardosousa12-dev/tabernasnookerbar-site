/**
 * Efeitos ligados ao scroll da página como um todo:
 *  - barra de progresso de leitura
 *  - navegação encolhe depois de 40px
 *  - CTA fixo do celular aparece após 40% da página (e some perto do fim)
 *  - link da seção atual marcado com aria-current na navegação
 */
import { $, $$ } from '../lib/dom.js';
import { onScrollFrame } from '../lib/scroll-frame.js';

const NAV_SCROLLED_AFTER = 40;
const STICKY_CTA_AFTER = 0.4;
const STICKY_CTA_HIDE_BEFORE_END = 400;
const ACTIVE_SECTION_LINE = 0.4; // fração da altura da tela

export function initSiteHeader() {
  const progressBar = $('[data-scroll-progress]');
  const nav = $('[data-site-nav]');
  const stickyCta = $('[data-sticky-cta]');
  const navLinks = $$('[data-site-nav] .site-nav__links a');
  const sections = navLinks.map((link) => document.getElementById(link.hash.slice(1)));

  onScrollFrame(({ scrollY, viewportHeight, maxScroll, progress }) => {
    // leitura
    const line = viewportHeight * ACTIVE_SECTION_LINE;
    const current = sections.find((section) => {
      if (!section) return false;
      const { top, bottom } = section.getBoundingClientRect();
      return top < line && bottom > line;
    });
    const showSticky = progress > STICKY_CTA_AFTER && scrollY < maxScroll - STICKY_CTA_HIDE_BEFORE_END;

    // escrita
    return () => {
      progressBar?.style.setProperty('transform', `scaleX(${progress})`);
      nav?.classList.toggle('is-scrolled', scrollY > NAV_SCROLLED_AFTER);
      stickyCta?.classList.toggle('is-visible', showSticky);
      navLinks.forEach((link, index) => {
        link.setAttribute('aria-current', String(sections[index] === current));
      });
    };
  });
}
