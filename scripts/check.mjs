#!/usr/bin/env node
/**
 * Verificações automáticas do HTML gerado (rode depois do build).
 * Falha com código 1 se encontrar problema. Uso: npm run check
 *
 *  - um único <h1>
 *  - toda <img> com alt
 *  - ids únicos e referências ARIA apontando para ids existentes
 *  - arquivos locais referenciados existem em dist/
 *  - JSON-LD válido
 *  - nenhum {{placeholder}} sobrando
 *  - título e meta description no tamanho recomendado
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const html = readFileSync(join(DIST, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const errors = [];
const fail = (message) => errors.push(message);

// <h1>
const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
if (h1Count !== 1) fail(`Esperado 1 <h1>, encontrado ${h1Count}`);

// alt em imagens
for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\salt="/.test(tag)) fail(`<img> sem alt: ${tag.slice(0, 90)}…`);
}

// ids únicos
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicated.length) fail(`ids duplicados: ${[...new Set(duplicated)].join(', ')}`);

// referências ARIA e âncoras internas
const idSet = new Set(ids);
for (const [, attr, value] of html.matchAll(/\s(aria-controls|aria-labelledby|aria-describedby|for)="([^"]+)"/g)) {
  for (const ref of value.split(/\s+/)) if (!idSet.has(ref)) fail(`${attr}="${ref}" aponta para id inexistente`);
}
for (const [, ref] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!idSet.has(ref)) fail(`link interno #${ref} sem destino`);
}
for (const [, ref] of html.matchAll(/<use href="#([^"]+)"/g)) {
  if (!idSet.has(ref)) fail(`ícone #${ref} não existe no sprite`);
}

// arquivos locais
const localRefs = [...html.matchAll(/\s(?:src|href|poster|data-loop-src|data-full-src)="([^"#:]+?)(?:\?[^"]*)?"/g)]
  .map(([, path]) => path)
  .filter((path) => !path.startsWith('//'));
for (const path of new Set(localRefs)) {
  if (!existsSync(join(DIST, path))) fail(`arquivo referenciado não existe: ${path}`);
}

// JSON-LD
for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  try {
    JSON.parse(json.replaceAll('<\\/', '</'));
  } catch (error) {
    fail(`JSON-LD inválido: ${error.message}`);
  }
}

// placeholders e SEO básico
if (/\{\{[^}]*\}\}/.test(html)) fail('sobrou {{placeholder}} no HTML');
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
if (title.length < 30 || title.length > 60) fail(`<title> com ${title.length} caracteres (ideal 30–60)`);
const description = /name="description"\s+content="([^"]*)"/.exec(html)?.[1] ?? '';
if (description.length < 120 || description.length > 160) {
  fail(`meta description com ${description.length} caracteres (ideal 120–160)`);
}
if (html.includes('seudominio.com.br')) {
  console.warn('⚠ site.config.json ainda usa o domínio de exemplo (seudominio.com.br)');
}

if (errors.length) {
  console.error(`✖ ${errors.length} problema(s):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log('✔ checagens do HTML ok');
