import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { expandWhatsAppTokens, renderFaqItems, stripTags } from '../scripts/lib/sections.mjs';
import { buildStructuredData } from '../scripts/lib/structured-data.mjs';
import { escapeHtml, render } from '../scripts/lib/template.mjs';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

describe('template', () => {
  it('substitui valores com escape de HTML', () => {
    assert.equal(render('<p>{{a.b}}</p>', { a: { b: '<x> & "y"' } }), '<p>&lt;x&gt; &amp; &quot;y&quot;</p>');
  });

  it('insere blocos sem reinterpretar o conteúdo', () => {
    assert.equal(render('{{> block}}', {}, { block: '{{nao.substitui}}' }), '{{nao.substitui}}');
  });

  it('falha alto quando falta um valor', () => {
    assert.throws(() => render('{{faltando}}', {}), /faltando/);
  });

  it('escapa aspas e sinais', () => {
    assert.equal(escapeHtml('a"b<c'), 'a&quot;b&lt;c');
  });
});

describe('FAQ', () => {
  it('troca {{whatsapp:chave|texto}} por link no HTML e por texto no JSON-LD', () => {
    const text = 'Veja {{whatsapp:games|no WhatsApp}}.';
    assert.match(expandWhatsAppTokens(text, 'https://wa.me/1', { asHtml: true }), /<a href="https:\/\/wa.me\/1" data-wa="games"/);
    assert.equal(expandWhatsAppTokens(text, '', { asHtml: false }), 'Veja no WhatsApp.');
    assert.equal(stripTags('a <a href="#x">b</a>'), 'a b');
  });

  it('o accordion e o JSON-LD têm as mesmas perguntas', () => {
    const site = readJson('../site.config.json');
    const menu = readJson('../src/data/menu.json');
    const faq = readJson('../src/data/faq.json');

    const html = renderFaqItems(faq.items, 'https://wa.me/1');
    const ld = JSON.parse(
      buildStructuredData({ site, menu, faq })
        .replace(/^<script[^>]*>|<\/script>$/g, '')
        .replaceAll('<\\/', '</'),
    );
    const faqPage = ld['@graph'].find((node) => node['@type'] === 'FAQPage');

    assert.equal(faqPage.mainEntity.length, faq.items.length);
    for (const question of faqPage.mainEntity) assert.ok(html.includes(escapeHtml(question.name)));
  });
});

describe('cardápio', () => {
  it('formata preço em reais e acha o menor preço das porções', async () => {
    const { formatBRL, lowestPrice } = await import('../scripts/lib/sections.mjs');
    assert.equal(formatBRL(3), 'R$ 3,00');
    assert.equal(formatBRL(49.9), 'R$ 49,90');
    assert.equal(lowestPrice([{ sizes: { M: 24.9, G: 34.9 } }, { price: 37.9 }, { priceOnRequest: true }]), 24.9);
  });

  it('todo item tem preço ou está marcado como preço no WhatsApp', () => {
    const menu = readJson('../src/data/menu.json');
    const items = menu.sections.flatMap((s) => s.items ?? s.groups.flatMap((g) => g.items));
    for (const item of items) {
      assert.ok(item.price != null || item.sizes || item.priceOnRequest, `${item.name} sem preço`);
    }
  });
});
