/**
 * Mini motor de templates do build (sem dependências).
 *
 *   <!-- @include partials/hero.html -->   inclui outro arquivo (relativo ao arquivo atual)
 *   {{site.address.city}}                  valor do contexto, com escape de HTML
 *   {{> menuItems}}                        bloco de HTML já pronto (sem escape)
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const INCLUDE = /<!--\s*@include\s+(\S+)\s*-->/g;
const BLOCK = /\{\{>\s*([\w.]+)\s*\}\}/g;
const VALUE = /\{\{\s*([\w.]+)\s*\}\}/g;

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Lê `file` e resolve os @include recursivamente. */
export function resolveIncludes(file, seen = new Set()) {
  const path = resolve(file);
  if (seen.has(path)) throw new Error(`Include circular: ${path}`);
  const nextSeen = new Set(seen).add(path);

  return readFileSync(path, 'utf8').replace(INCLUDE, (_, relative) =>
    resolveIncludes(resolve(dirname(path), relative), nextSeen).trimEnd(),
  );
}

function lookup(context, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), context);
}

/**
 * Substitui {{> bloco}} e {{valor}}. Falha alto se algo não existir,
 * para um erro de digitação não chegar ao site publicado.
 */
export function render(template, context, blocks = {}) {
  // valores primeiro: assim o conteúdo dos blocos gerados nunca é reinterpretado
  return template
    .replace(VALUE, (_, path) => {
      const value = lookup(context, path);
      if (value === undefined) throw new Error(`Valor desconhecido no template: {{${path}}}`);
      return escapeHtml(value);
    })
    .replace(BLOCK, (_, name) => {
      if (!(name in blocks)) throw new Error(`Bloco desconhecido no template: {{> ${name}}}`);
      return blocks[name];
    });
}
