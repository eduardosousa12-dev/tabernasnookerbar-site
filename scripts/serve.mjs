#!/usr/bin/env node
/**
 * Servidor local para desenvolvimento (Node 20+, sem dependências).
 *
 *   node scripts/serve.mjs           serve dist/ em http://localhost:5173
 *   node scripts/serve.mjs --watch   refaz o build a cada alteração em src/ ou site.config.json
 *   PORT=8080 node scripts/serve.mjs muda a porta
 *
 * Suporta requisições Range, necessárias para o vídeo tocar no Safari/iOS.
 */
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from './build.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 5173;
const WATCH = process.argv.includes('--watch');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

function resolveFile(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(DIST, safePath.endsWith('/') ? `${safePath}index.html` : safePath);
  return file.startsWith(DIST) && existsSync(file) && statSync(file).isFile() ? file : null;
}

function serve(request, response) {
  const file = resolveFile(request.url);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Não encontrado');
    return;
  }

  const { size } = statSync(file);
  const headers = {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
  };

  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, 'Content-Length': size });
  createReadStream(file).pipe(response);
}

build();

if (WATCH) {
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (error) {
        console.error(`✖ ${error.message}`);
      }
    }, 100);
  };
  watch(join(ROOT, 'src'), { recursive: true }, rebuild);
  watch(join(ROOT, 'site.config.json'), rebuild);
  console.log('… observando src/ e site.config.json');
}

createServer(serve).listen(PORT, () => {
  console.log(`→ http://localhost:${PORT}`);
});
