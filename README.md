# Taberna Snooker Bar — site

Landing page do Taberna Snooker Bar (Uberlândia/MG). HTML, CSS e JavaScript puros, sem framework.
Um build pequeno em Node (sem dependências) junta as partes e gera a pasta `dist/`, que é o que vai
para o ar.

## Comandos

Requisito: **Node 20 ou mais novo**. Não há `npm install` obrigatório para rodar o site.

| Comando           | O que faz                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| `npm run dev`     | Gera o site e abre em http://localhost:5173, refazendo a cada alteração |
| `npm run build`   | Gera `dist/` para publicar                                             |
| `npm run preview` | Serve o `dist/` atual, sem observar alterações                         |
| `npm test`        | Testes das regras (horário por dia, preços do cardápio, build)          |
| `npm run check`   | Build + checagens do HTML (alt, ids, links, JSON-LD, SEO) + testes      |
| `npm run lint`    | ESLint e Stylelint (precisa de `npm install` antes)                    |
| `npm run format`  | Prettier (precisa de `npm install` antes)                              |

## Onde mudar cada coisa

| Quero mudar…                                        | Arquivo                                      |
| --------------------------------------------------- | -------------------------------------------- |
| Telefone, WhatsApp, endereço, horário, CNPJ, domínio | `site.config.json`                           |
| Mensagens prontas do WhatsApp                       | `site.config.json` → `whatsapp.messages`     |
| Cardápio e preços (pratos, bebidas, foto, cor)      | `src/data/menu.json` + foto em `src/assets/img/cardapio/` |
| Preço da ficha, pagamento, nota do Google           | `site.config.json` → `pool`, `payments`, `googleRating` |
| Fotos da galeria                                    | `src/partials/gallery.html` + `src/assets/img/galeria/` |
| Perguntas frequentes                                | `src/data/faq.json`                          |
| Textos de uma seção                                 | `src/partials/<seção>.html`                  |
| Cores, fontes, espaçamentos, velocidades            | `src/css/settings/tokens.css`                |
| Estilo de uma seção                                 | `src/css/sections/<seção>.css`               |
| Comportamento de uma seção                          | `src/js/components/<recurso>.js`             |

O cardápio e o FAQ geram **duas coisas ao mesmo tempo**: o HTML da página e os dados estruturados
(JSON-LD) que o Google lê. Por isso eles ficam em JSON e não direto no HTML: assim nunca ficam
diferentes um do outro.

**Foto nova no cardápio:** WebP, 800×600. Foto com fundo transparente (prato recortado) leva
`"cutout": true` no `menu.json` para aparecer inteira, sem corte.

## Estrutura

```
site.config.json          dados do negócio (fonte única para HTML, SEO e JS)
netlify.toml              build e publicação no Netlify
scripts/
  build.mjs               src/ → dist/
  serve.mjs               servidor local (com suporte a vídeo no Safari)
  check.mjs               checagens automáticas do HTML gerado
  lib/                    template, geradores de seções, JSON-LD, CSS/JS
src/
  index.html              esqueleto da página; inclui as partes abaixo
  partials/               uma parte por seção (hero, cardápio, FAQ, rodapé…)
  data/                   menu.json e faq.json
  css/
    main.css              só a ordem dos @import
    settings/tokens.css   design tokens (cores, fontes, espaços, tempos)
    base/                 reset, layout (container, grid), movimento
    components/           peças reutilizáveis (botão, bola, nav, diálogo…)
    sections/             um arquivo por seção da página
  js/
    main.js               ponto de entrada e ordem de inicialização
    lib/                  utilitários e regras puras (horário, mensagem, scroll)
    components/           um módulo por recurso (menu, carrossel, vídeo, horário…)
  assets/                 imagens, vídeos e ícones
  public/                 robots.txt, sitemap.xml, manifest, _headers, favicon
tests/                    testes com node:test
```

## Convenções

- **Classes para estilo, `data-*` para comportamento.** O JS nunca procura elementos por classe de
  estilo. Ex.: `<a class="btn" data-wa="default" data-cta="hero">`. Dá para mudar o visual sem
  quebrar o JS e vice-versa.
- **CSS em BEM** (`bloco__elemento--variação`) e **só tokens**: nenhuma cor ou tempo solto fora de
  `tokens.css`. Cor de bolinha/marcador é uma classe `tone-red`, `tone-yellow`… (bolas da sinuca).
- **Ícones** num único sprite (`src/partials/icons.html`): `<svg class="icon"><use href="#i-chat" /></svg>`.
- **Um módulo JS por recurso**, cada um com uma função `init…()` chamada por `main.js`.
- **Scroll sem reflow forçado:** efeitos de scroll usam `onScrollFrame()` de `lib/scroll-frame.js`.
  A função lê o layout e devolve outra função que só escreve. O loop faz todas as leituras antes de
  todas as escritas.
- **Regras de negócio são funções puras** em `src/js/lib/` e têm teste (`tests/`).
- **Dados reais apenas.** Avaliações são copiadas literalmente do Google. Não invente
  números, prêmios ou depoimentos. Horário e preços vêm do cardápio impresso da casa.

## Movimento e acessibilidade

- Com "reduzir movimento" ligado no sistema, o site corta giros, parallax e deslocamentos.
- **Decisão do cliente:** o vídeo em loop do topo e o carrossel do cardápio continuam rodando mesmo
  com "reduzir movimento" (muitos celulares vêm com isso ligado pela economia de bateria). Para
  cumprir a WCAG 2.2.2, há botão de pausa no vídeo (pausa tudo) e no carrossel.
- O carrossel avança a cada 1 s (`ADVANCE_EVERY_MS` em `menu-carousel.js`) e para enquanto a
  pessoa interage.

## Performance

- O CSS é embutido no `<head>` pelo build (página única: nenhum arquivo bloqueia a primeira pintura).
- As fontes do Google carregam sem bloquear (`media="print"` → `all`). Até chegarem, o texto usa
  fontes de reserva de largura parecida (ver `tokens.css`).
- Módulos JS: `modulepreload` para todos, minificação conservadora no build. O que é decorativo
  (vídeo, cursor) só inicia com o navegador ocioso.
- O vídeo em loop carrega depois da primeira pintura (o pôster é o LCP); o mapa do Google só carrega no clique.
- Cache e cabeçalhos de segurança: `src/public/_headers` (Netlify e Cloudflare Pages).

## Publicar

**Netlify (atual: tabernasnookerbar.netlify.app):** conecte o repositório. O `netlify.toml` já diz
para rodar `npm run build` e publicar `dist/`. Ou rode `npm run build` e arraste a pasta `dist/` no
painel do Netlify.

**Domínio próprio:** troque `url` em `site.config.json` e rode o build de novo. Isso atualiza
canonical, Open Graph, JSON-LD, sitemap e robots.

Depois de publicar, valide os dados estruturados em https://search.google.com/test/rich-results e
envie `sitemap.xml` no Google Search Console.

## Analytics

Os cliques são enviados ao `dataLayer` (Google Tag Manager/GA4), sem nada instalado por padrão:

- `cta_click` com `cta`: `hero`, `nav`, `menu`, `sticky`, `fab`, `footer`, `cardapio`, `faq-games`
- `video_play` com `video: 'ambiente'`

## Pendências conhecidas

- **Legendas do vídeo** (`<track kind="captions">`): falta a transcrição da fala do vídeo. Com o
  texto em mãos, crie `src/assets/video/taberna-snooker-bar-uberlandia.pt-BR.vtt` e adicione o
  `<track>` em `src/partials/hero.html`.
- **Fontes hospedadas no próprio site** (opcional): baixar os `.woff2` de Big Shoulders Display e
  Figtree para `src/assets/fonts/` e trocar o link do Google por `@font-face` em `tokens.css`
  elimina a conexão com terceiros.
