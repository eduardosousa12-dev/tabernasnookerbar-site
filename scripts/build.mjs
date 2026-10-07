#!/usr/bin/env node
/**
 * Build do site (Node 20+, sem dependências).
 *
 *   src/  →  dist/
 *
 * 1. Gera js/site-config.js a partir de site.config.json
 * 2. Copia JS (módulos ES, sem bundler), imagens, vídeos, ícones e arquivos públicos
 * 3. Junta e minifica o CSS e o coloca dentro do <head> (página única: um arquivo
 *    a menos no caminho crítico). Também grava css/styles.css para consulta.
 * 4. Monta o index.html: inclui partials, gera cardápio/FAQ/JSON-LD a partir de src/data,
 *    substitui {{valores}} e adiciona <link rel="modulepreload"> para cada módulo
 *
 * Uso: node scripts/build.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundleCss, collectModuleGraph, contentHash, minifyCss, minifyJs } from './lib/assets.mjs';
import {
  formatBRL,
  joinPt,
  lowestPrice,
  renderAmenities,
  renderFaqItems,
  renderHoursTable,
  renderMenuItems,
  renderMenuList,
  renderRatingBadge,
} from './lib/sections.mjs';
import { buildStructuredData } from './lib/structured-data.mjs';
import { render, resolveIncludes } from './lib/template.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const write = (file, content) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

/** Remove chaves de comentário ($comment) antes de expor a config. */
const withoutComments = (value) =>
  JSON.parse(JSON.stringify(value, (key, v) => (key === '$comment' ? undefined : v)));

export function build() {
  const started = performance.now();
  const site = withoutComments(readJson(join(ROOT, 'site.config.json')));
  const menu = readJson(join(SRC, 'data/menu.json'));
  const faq = readJson(join(SRC, 'data/faq.json'));
  site.url = site.url.replace(/\/$/, '');

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  // 1–2. Arquivos estáticos e JS
  cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
  cpSync(join(SRC, 'js'), join(DIST, 'js'), { recursive: true });
  write(
    join(DIST, 'js/site-config.js'),
    '// Gerado por scripts/build.mjs a partir de site.config.json. Não edite.\n' +
      `export default Object.freeze(${JSON.stringify(
        { name: site.name, whatsapp: site.whatsapp, address: site.address, hours: site.hours },
        null,
        2,
      )});\n`,
  );

  // Minifica os módulos JS copiados (só comentários e indentação; ver minifyJs)
  const minifyTree = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) minifyTree(path);
      else if (entry.name.endsWith('.js')) writeFileSync(path, minifyJs(readFileSync(path, 'utf8')));
    }
  };
  minifyTree(join(DIST, 'js'));

  // 3. CSS
  const css = minifyCss(bundleCss(join(SRC, 'css/main.css')));
  const cssFile = 'css/styles.css';
  write(join(DIST, cssFile), css);

  // 4. HTML
  const modules = collectModuleGraph(join(DIST, 'js/main.js'), DIST);
  const jsVersion = contentHash(modules.map((file) => readFileSync(join(DIST, file), 'utf8')).join(''));
  const whatsappUrl = `https://wa.me/${site.whatsapp.number}`;
  const mapsQuery = encodeURIComponent(`${site.address.street}, ${site.address.city} ${site.address.state}`);

  const portions = menu.sections.find((section) => section.id === 'porcoes').items;
  const context = {
    site,
    prices: { token: formatBRL(site.pool.tokenPrice), portionsFrom: formatBRL(lowestPrice(portions)) },
    paymentsText: joinPt(site.payments),
    menuNote: menu.note,
    whatsappUrl,
    mapsSearchUrl: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    mapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
    assets: { js: `js/main.js?v=${jsVersion}` },
    fonts: {
      css: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Figtree:wght@400;500;600;700&display=swap',
    },
  };
  const blocks = {
    menuItems: renderMenuItems(menu),
    menuList: renderMenuList(menu),
    hoursTable: renderHoursTable(site.hours),
    amenitiesList: renderAmenities(site.amenities),
    ratingBadge: renderRatingBadge(site.googleRating),
    faqItems: renderFaqItems(faq.items, whatsappUrl),
    structuredData: buildStructuredData({ site, menu, faq }),
    inlineCss: `<style>${css}</style>`,
    modulePreloads: modules
      .filter((file) => file !== 'js/main.js')
      .map((file) => `<link rel="modulepreload" href="${file}" />`)
      .join('\n    '),
  };
  const page = render(resolveIncludes(join(SRC, 'index.html')), context, blocks)
    // comentários do código-fonte não vão para produção
    .replace(/<!--[\s\S]*?-->\s*/g, '');
  write(join(DIST, 'index.html'), page);

  // Arquivos públicos (robots, sitemap, manifest) também aceitam {{valores}}
  const publicDir = join(SRC, 'public');
  for (const file of ['robots.txt', 'sitemap.xml', 'manifest.webmanifest']) {
    const source = join(publicDir, file);
    if (existsSync(source)) {
      write(join(DIST, file), render(readFileSync(source, 'utf8'), { ...context, today: new Date().toISOString().slice(0, 10) }));
    }
  }
  for (const file of ['favicon.ico', '_headers']) {
    if (existsSync(join(publicDir, file))) cpSync(join(publicDir, file), join(DIST, file));
  }

  const ms = Math.round(performance.now() - started);
  const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
  console.log(`✔ build em ${ms} ms → dist/ (${modules.length} módulos JS, CSS ${kb(css.length)} embutido)`);
}

// Executa quando chamado diretamente (node scripts/build.mjs)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    build();
  } catch (error) {
    console.error(`✖ build falhou: ${error.message}`);
    process.exit(1);
  }
}
