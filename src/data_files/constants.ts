import ogImageSrc from '@images/social.png';

export const SITE = {
  title: 'B&S Logistics',
  legalName: 'Business & Supplies Logistics Ltda.',
  tagline: 'Líderes en Seguridad Preventiva',
  description:
    'En B&S LOGISTICS nos especializamos en la distribución y comercialización de elementos de seguridad preventiva. Ofrecemos productos de óptima calidad que permiten garantizar la trazabilidad y custodia de bienes y activos.',
  description_short:
    'Distribución y comercialización de elementos de seguridad preventiva para la cadena de custodia y logística.',
  url: 'https://byslogistics.com.co',
  author: 'Business & Supplies Logistics Ltda.',
};

/**
 * Datos de contacto de la empresa: única fuente de verdad para el footer,
 * la página de contacto y los datos estructurados.
 *
 * TODO(confirmar): el número de WhatsApp y la dirección de la oficina no
 * aparecen en el material recibido. `whatsapp` usa el primer celular como
 * suposición — confirmar antes de publicar, porque un número equivocado
 * desvía las consultas de los clientes.
 */
export const CONTACT = {
  pbx: [
    { label: '(601) 469 9575', href: 'tel:+6014699575' },
    { label: '(601) 469 9809', href: 'tel:+6014699809' },
  ],
  mobiles: [
    { label: '320 951 4930', href: 'tel:+573209514930' },
    { label: '311 253 3085', href: 'tel:+573112533085' },
    { label: '321 418 9261', href: 'tel:+573214189261' },
  ],
  panama: { label: '(507) 6302 0175', href: 'tel:+50763020175' },
  email: 'ventas@precintosdeseguridad.co',
  whatsapp: 'https://wa.me/573209514930',
  city: 'Bogotá, Colombia',
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

// Logos de clientes o aliados. Vacío por ahora: la sección de la home no se
// renderiza hasta que se agreguen logos reales.
export const partnersData: Array<{
  icon: string;
  name: string;
  href: string;
}> = [];
