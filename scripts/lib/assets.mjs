/**
 * CSS e JS para produção:
 *  - CSS: resolve os @import de css/main.css num único arquivo e remove comentários.
 *  - JS: percorre os imports a partir de js/main.js para gerar <link rel="modulepreload">
 *    (o navegador baixa todos os módulos em paralelo, sem cascata).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const CSS_IMPORT = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)\s*;/g;
const JS_IMPORT = /^\s*import\s+(?:[^'"]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm;

export const contentHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 10);

export function bundleCss(entryFile, seen = new Set()) {
  const path = resolve(entryFile);
  if (seen.has(path)) return '';
  seen.add(path);

  const source = readFileSync(path, 'utf8');
  return source.replace(CSS_IMPORT, (_, file) => bundleCss(resolve(dirname(path), file), seen));
}

/**
 * Minificação segura de CSS: remove comentários e espaços sem tocar no conteúdo
 * de strings (ex.: o SVG em data URI). Não mexe em espaços ao redor de + e -
 * porque eles são obrigatórios dentro de calc().
 */
export function minifyCss(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const char = css[i];

    // strings: copia como estão
    if (char === '"' || char === "'") {
      const end = css.indexOf(char, i + 1);
      out += css.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    // comentários: descarta
    if (char === '/' && css[i + 1] === '*') {
      i = css.indexOf('*/', i + 2) + 2;
      continue;
    }
    // espaços: vira um só, e some ao lado de { } ; , > e depois de :
    if (/\s/.test(char)) {
      while (i < css.length && /\s/.test(css[i])) i += 1;
      const previous = out.at(-1);
      const next = css[i];
      if (!previous || '{};,>:('.includes(previous) || '{};,>)!'.includes(next)) continue;
      out += ' ';
      continue;
    }
    out += char;
    i += 1;
  }
  return out.replaceAll(';}', '}');
}

/**
 * Minificação conservadora de JS (sem ferramenta externa): remove só comentários
 * de linha inteira, blocos de documentação e a indentação. Não toca em nada
 * dentro de uma linha de código, então não há risco de quebrar strings ou regex.
 */
export function minifyJs(js) {
  const lines = [];
  let inBlockComment = false;
  for (const raw of js.split('\n')) {
    const line = raw.trim();
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      inBlockComment = !line.includes('*/');
      continue;
    }
    if (!line || line.startsWith('//')) continue;
    lines.push(line);
  }
  return `${lines.join('\n')}\n`;
}

/** Lista (relativa a `rootDir`) de todos os módulos alcançáveis a partir de `entryFile`. */
export function collectModuleGraph(entryFile, rootDir) {
  const found = new Set();
  const visit = (file) => {
    const path = resolve(file);
    if (found.has(path)) return;
    found.add(path);
    for (const [, specifier] of readFileSync(path, 'utf8').matchAll(JS_IMPORT)) {
      visit(resolve(dirname(path), specifier));
    }
  };
  visit(entryFile);
  return [...found].map((path) => relative(rootDir, path).replaceAll('\\', '/'));
}
