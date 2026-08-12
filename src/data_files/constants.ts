import ogImageSrc from '@images/social.png';

export const SITE = {
  title: 'BYS Logistics',
  legalName: 'B&S Logistics Global S.A.S.',
  tagline: 'Soluciones logísticas para tu comercio exterior',
  description:
    'B&S Logistics Global S.A.S. ofrece soluciones logísticas personalizadas para posicionar a tus productos de forma competitiva en el mercado colombiano. Transporte, distribución y acompañamiento en operaciones de comercio exterior.',
  description_short:
    'Soluciones logísticas personalizadas para tus operaciones de comercio exterior en Colombia.',
  url: 'https://byslogistics.com.co',
  author: 'B&S Logistics Global S.A.S.',
};

// Datos de contacto de la empresa. Se consumen desde la página de contacto,
// el footer y los datos estructurados, para que exista una sola fuente de verdad.
export const CONTACT = {
  phone: '+57 316 576 8602',
  phoneHref: 'tel:+573165768602',
  whatsapp: 'https://wa.me/573165768602',
  email: 'cco@byslogistics.com',
  address: {
    street: 'Carrera 38 # 9-45, Oficina 610',
    city: 'Bogotá',
    region: 'Cundinamarca',
    country: 'Colombia',
  },
  hours: 'Lunes a viernes, 9:00 a.m. – 6:00 p.m.',
};

export const SEO = {
  title: SITE.title,
  description: SITE.description,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    inLanguage: 'es-CO',
    '@id': SITE.url,
    url: SITE.url,
    name: SITE.title,
    description: SITE.description,
    isPartOf: {
      '@type': 'WebSite',
      url: SITE.url,
      name: SITE.title,
      description: SITE.description,
    },
  },
};

export const OG = {
  locale: 'es_CO',
  type: 'website',
  url: SITE.url,
  title: `${SITE.title}: ${SITE.tagline}`,
  description: SITE.description,
  image: ogImageSrc,
};

// Logos de clientes o aliados que se muestran en la sección "Clientes".
// Vacío por ahora: la sección no se renderiza hasta que se agreguen logos reales.
export const partnersData: Array<{
  icon: string;
  name: string;
  href: string;
}> = [];
