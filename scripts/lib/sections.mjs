/**
 * Geradores de HTML a partir dos dados (site.config.json e src/data/*.json).
 */
import { describeSchedule } from '../../src/js/lib/opening-hours.js';
import { escapeHtml } from './template.mjs';

const WHATSAPP_TOKEN = /\{\{whatsapp:(\w+)\|([^}]+)\}\}/g;

/** Remove tags HTML (para o texto do JSON-LD). */
export const stripTags = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** 49.9 → "R$ 49,90" */
export const formatBRL = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

/** "Pix, Visa, Mastercard e Elo" */
export const joinPt = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;

/** Menor preço entre os itens de uma seção (considera tamanhos). */
export function lowestPrice(items) {
  const prices = items.flatMap((item) =>
    item.sizes ? Object.values(item.sizes) : item.price != null ? [item.price] : [],
  );
  return Math.min(...prices);
}

/** Todos os itens do cardápio, de seções com ou sem grupos. */
export const allMenuItems = (menu) =>
  menu.sections.flatMap((section) => section.items ?? section.groups.flatMap((group) => group.items));

/** HTML do preço de um item: "M R$ 49,90 · G R$ 62,90", "R$ 33,90" ou "Preço no WhatsApp". */
function priceHtml(item) {
  if (item.sizes) {
    return Object.entries(item.sizes)
      .map(([size, value]) => `<span class="price"><abbr title="${size === 'M' ? 'Média' : 'Grande'}">${size}</abbr> ${formatBRL(value)}</span>`)
      .join(' ');
  }
  if (item.price != null) return `<span class="price">${formatBRL(item.price)}</span>`;
  return '<span class="price price--ask">Preço no WhatsApp</span>';
}

/**
 * Troca {{whatsapp:chave|texto}} por um link de WhatsApp.
 * Para HTML devolve <a>; para texto puro devolve só o texto.
 */
export function expandWhatsAppTokens(text, whatsappUrl, { asHtml }) {
  return text.replace(WHATSAPP_TOKEN, (_, key, label) =>
    asHtml
      ? `<a href="${whatsappUrl}" data-wa="${key}" data-cta="faq-${key}" target="_blank" rel="noopener">${label}</a>`
      : label,
  );
}

/** Cards do carrossel: só os pratos que têm foto. */
export function renderMenuItems(menu) {
  return menu.sections
    .flatMap((section) => (section.items ?? []).map((item) => ({ ...item, category: section.name })))
    .filter((item) => item.image)
    .map(
      (item) => `<li class="dish" data-carousel-slide>
          <article class="dish__card" data-tilt>
            <div class="dish__media${item.cutout ? ' dish__media--cutout' : ''} tone-${escapeHtml(item.tone)}">
              <img src="assets/img/cardapio/${escapeHtml(item.image)}" width="800" height="600" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async" />
              ${item.badge ? `<span class="dish__badge">${escapeHtml(item.badge)}</span>` : '<i class="ball"></i>'}
            </div>
            <div class="dish__body">
              <span class="dish__category">${escapeHtml(item.category)}</span>
              <h3>${escapeHtml(item.name)}</h3>
              ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
              <p class="dish__price">${priceHtml(item)}</p>
            </div>
          </article>
        </li>`,
    )
    .join('\n        ');
}

/** Texto alternativo da foto redonda do cardápio. */
const photoAlt = (item, sectionId) =>
  item.alt ?? `${sectionId === 'lanches' ? 'Lanche' : 'Porção de'} ${item.name}`;

const badgeHtml = (item, className) =>
  item.badge ? ` <span class="${className}">${escapeHtml(item.badge)}</span>` : '';

function renderPriceRows(items, sectionId) {
  return `<ul class="price-list" role="list">
${items
  .map(
    (item) => `          <li class="price-list__row${item.photo ? ' price-list__row--photo' : ''}">
            <span class="price-list__name">${item.photo ? `<img class="price-list__thumb" src="assets/img/cardapio/${escapeHtml(item.photo)}" width="400" height="400" alt="${escapeHtml(photoAlt(item, sectionId))}" loading="lazy" decoding="async" />` : ''}<span>${escapeHtml(item.name)}${badgeHtml(item, 'price-list__badge')}</span></span>
            <span class="price-list__dots" aria-hidden="true"></span>
            <span class="price-list__price">${priceHtml(item)}</span>
            ${item.description ? `<span class="price-list__desc">${escapeHtml(item.description)}</span>` : ''}
          </li>`,
  )
  .join('\n')}
        </ul>`;
}

/** Grade de fotos redondas, como no cardápio impresso (usada quando todos os itens da seção têm foto). */
function renderPhotoGrid(items, sectionId) {
  return `<ul class="photo-menu" role="list">
${items
  .map(
    (item) => `          <li class="photo-dish">
            <img class="photo-dish__img" src="assets/img/cardapio/${escapeHtml(item.photo)}" width="400" height="400" alt="${escapeHtml(photoAlt(item, sectionId))}" loading="lazy" decoding="async" />
            ${item.badge ? `<span class="photo-dish__badge">${escapeHtml(item.badge)}</span>` : ''}
            <h4 class="photo-dish__name">${escapeHtml(item.name)}</h4>
            <p class="photo-dish__price">${priceHtml(item)}</p>
          </li>`,
  )
  .join('\n')}
        </ul>`;
}

/** Cardápio completo em blocos que abrem e fecham (<details>). O primeiro já vem aberto. */
export function renderMenuList(menu) {
  return menu.sections
    .map((section, index) => {
      const allHavePhotos = section.items?.every((item) => item.photo);
      const body = section.items
        ? (allHavePhotos ? renderPhotoGrid : renderPriceRows)(section.items, section.id)
        : section.groups
            .map((group) => `<h4 class="price-group">${escapeHtml(group.name)}</h4>\n        ${renderPriceRows(group.items, section.id)}`)
            .join('\n        ');
      return `<details class="menu-group" id="cardapio-${escapeHtml(section.id)}"${index === 0 ? ' open' : ''}>
        <summary>
          <span>${escapeHtml(section.name)}</span>
          <svg class="icon" aria-hidden="true"><use href="#i-plus" /></svg>
        </summary>
        ${body}
      </details>`;
    })
    .join('\n      ');
}

/** Tabela de horário a partir de site.config.json → hours.schedule */
export function renderHoursTable(hours) {
  const rows = describeSchedule(hours)
    .map((row) => `<tr><th scope="row">${escapeHtml(row.days)}</th><td>${escapeHtml(row.hours)}</td></tr>`)
    .join('\n          ');
  return `<table class="hours-table">
          <tbody>
          ${rows}
          </tbody>
        </table>`;
}

/** Itens de "Bom saber". */
export const renderAmenities = (amenities) =>
  amenities.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n          ');

/** Selo da nota do Google (vazio se não houver nota configurada). */
export function renderRatingBadge(rating) {
  if (!rating?.value) return '';
  const value = rating.value.toFixed(1).replace('.', ',');
  return `<a class="rating-badge" href="${escapeHtml(rating.url)}" target="_blank" rel="noopener">
        <span class="rating-badge__stars" aria-hidden="true">★★★★★</span>
        <span><b>${value}</b> no Google · ${escapeHtml(rating.countLabel)}</span>
      </a>`;
}

/** Itens do accordion de perguntas frequentes. */
export function renderFaqItems(items, whatsappUrl) {
  return items
    .map((item, index) => {
      const n = index + 1;
      const answer = expandWhatsAppTokens(item.answer, whatsappUrl, { asHtml: true });
      return `<div class="faq-item">
        <h4>
          <button type="button" id="faq-q${n}" aria-expanded="false" aria-controls="faq-a${n}">
            ${escapeHtml(item.question)}
            <svg class="icon" aria-hidden="true"><use href="#i-plus" /></svg>
          </button>
        </h4>
        <div class="faq-item__panel" id="faq-a${n}" role="region" aria-labelledby="faq-q${n}" hidden>${answer}</div>
      </div>`;
    })
    .join('\n      ');
}
