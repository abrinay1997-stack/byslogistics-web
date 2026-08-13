import ogImageSrc from '@images/social.png';

export const SITE = {
  title: 'B&S Logistics',
  legalName: 'Business & Supplies Logistics S.A.S.',
  tagline: 'Líderes en Seguridad Preventiva',
  description:
    'En B&S LOGISTICS nos especializamos en la distribución y comercialización de elementos de seguridad preventiva. Ofrecemos productos de óptima calidad que permiten garantizar la trazabilidad y custodia de bienes y activos.',
  description_short:
    'Distribución y comercialización de elementos de seguridad preventiva para la cadena de custodia y logística.',
  url: 'https://byslogistics.com.co',
  author: 'Business & Supplies Logistics S.A.S.',
};

/**
 * Datos de contacto de la empresa: única fuente de verdad para el footer,
 * la página de contacto, el cotizador y los datos estructurados.
 *
 * TODO(pendiente): falta la dirección de la oficina; aún no está en el
 * material recibido.
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
  // Mapa incrustado de Google. La ficha corresponde a
  // "Precintos de Seguridad Business & Supplies Logistics".
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8309916399876!2d-74.18022189999999!3d4.624224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9f7a3b5253f3%3A0xa8a995e52c756cb1!2sPrecintos%20de%20Seguridad%20Business%20%26%20Supplies%20Logistics!5e0!3m2!1ses-419!2spa!4v1786555459273!5m2!1ses-419!2spa',
  mapLink:
    'https://www.google.com/maps/search/?api=1&query=Precintos+de+Seguridad+Business+%26+Supplies+Logistics',
};

/**
 * Nombres de los formularios en Netlify Forms.
 *
 * El robot de Netlify detecta al desplegar los formularios marcados con
 * `data-netlify="true"` y los agrupa por este nombre. Los envíos se ven en
 * el panel de Netlify → Forms, y desde ahí se configuran las notificaciones
 * por correo a ventas@precintosdeseguridad.co.
 *
 * Si se cambia un nombre, Netlify lo trata como un formulario nuevo y los
 * envíos anteriores quedan en el anterior.
 */
export const FORMS = {
  contact: 'contacto',
  newsletter: 'suscripcion',
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
