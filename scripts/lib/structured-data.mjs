/**
 * Dados estruturados (JSON-LD) para o Google, gerados a partir de
 * site.config.json + src/data/*.json. Assim o FAQ e o cardápio da página
 * nunca ficam diferentes do que o Google lê.
 *
 * Valide em https://search.google.com/test/rich-results depois de publicar.
 */
import { expandWhatsAppTokens, stripTags } from './sections.mjs';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hour = (h) => `${String(h).padStart(2, '0')}:00`;

export function buildStructuredData({ site, menu, faq }) {
  const url = site.url;
  const id = (fragment) => `${url}/#${fragment}`;
  const asset = (path) => `${url}/assets/${path}`;
  const city = { '@type': 'City', name: site.address.city };

  const offersFor = (item) => {
    if (item.sizes) {
      return Object.entries(item.sizes).map(([size, price]) => ({
        '@type': 'Offer',
        name: size === 'M' ? 'Média' : 'Grande',
        price: price.toFixed(2),
        priceCurrency: menu.currency,
      }));
    }
    return item.price != null ? { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: menu.currency } : undefined;
  };
  const menuItem = (item) => ({
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    image: item.image ? asset(`img/cardapio/${item.image}`) : undefined,
    offers: offersFor(item),
  });

  const graph = [
    {
      '@type': 'BarOrPub',
      '@id': id('bar'),
      name: site.name,
      slogan: site.slogan,
      description: site.description,
      url: `${url}/`,
      image: asset('img/og-taberna-snooker-bar-uberlandia.jpg'),
      logo: asset('icons/favicon-192.png'),
      telephone: site.phone.e164,
      taxID: site.cnpj,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.state,
        postalCode: site.address.postalCode,
        addressCountry: site.address.country,
      },
      openingHoursSpecification: site.hours.schedule.map((shift) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: shift.days.map((day) => DAY_NAMES[day]),
        opens: hour(shift.opens),
        closes: hour(shift.closes),
      })),
      paymentAccepted: site.payments.join(', '),
      currenciesAccepted: 'BRL',
      priceRange: '$',
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: '6 mesas de sinuca', value: true },
        { '@type': 'LocationFeatureSpecification', name: '4 TVs com transmissão de futebol', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Estacionamento', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi', value: true },
      ],
      servesCuisine: ['Porções', 'Petiscos', 'Lanches'],
      hasMenu: { '@id': id('cardapio') },
      sameAs: [site.instagram],
      areaServed: city,
    },
    {
      '@type': 'Menu',
      '@id': id('cardapio'),
      name: `Cardápio do ${site.name}`,
      inLanguage: 'pt-BR',
      hasMenuSection: menu.sections.map((section) => ({
        '@type': 'MenuSection',
        name: section.name,
        hasMenuItem: (section.items ?? section.groups.flatMap((group) => group.items)).map(menuItem),
      })),
    },
    {
      '@type': 'Service',
      name: 'Mesas de sinuca',
      serviceType: 'Sinuca',
      description: `6 mesas de sinuca. Ficha a R$ ${site.pool.tokenPrice.toFixed(2).replace('.', ',')}.`,
      offers: { '@type': 'Offer', name: 'Ficha da sinuca', price: site.pool.tokenPrice.toFixed(2), priceCurrency: 'BRL' },
      provider: { '@id': id('bar') },
      areaServed: city,
    },
    {
      '@type': 'Service',
      name: 'Transmissão de futebol',
      serviceType: 'Transmissão de jogos de futebol',
      description: '4 TVs para acompanhar as partidas com comida e bebida na mesa.',
      provider: { '@id': id('bar') },
      areaServed: city,
    },
    {
      '@type': 'VideoObject',
      name: site.video.name,
      description: site.video.description,
      thumbnailUrl: asset('img/poster-taberna-snooker-bar-ambiente.webp'),
      contentUrl: asset('video/taberna-snooker-bar-uberlandia.mp4'),
      uploadDate: site.video.uploadDate,
      duration: site.video.duration,
      inLanguage: 'pt-BR',
      publisher: { '@id': id('bar') },
    },
    {
      '@type': 'WebSite',
      '@id': id('site'),
      url: `${url}/`,
      name: site.name,
      inLanguage: 'pt-BR',
      publisher: { '@id': id('bar') },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: `${url}/` }],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripTags(expandWhatsAppTokens(item.answer, '', { asHtml: false })),
        },
      })),
    },
  ];

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    // impede que um "</script>" dentro de algum texto feche a tag
    .replaceAll('</', '<\\/');

  return `<script type="application/ld+json">\n${json}\n    </script>`;
}
