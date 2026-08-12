// Menú principal, replicando la estructura del sitio actual.
// En el sitio original "Precintos", "Productos" y "Usos" son desplegables;
// aquí cada uno tiene su página de listado, desde la que se accede a las
// subpáginas. Convertirlos en desplegables requiere el contenido de cada
// submenú, que aún está pendiente.
const navBarLinks = [
  { name: 'Precintos', url: '/precintos' },
  { name: 'Productos', url: '/productos' },
  { name: 'Usos', url: '/usos' },
  { name: 'Nosotros', url: '/nosotros' },
  { name: "FAQ's", url: '/faq' },
  { name: 'Contacto', url: '/contacto' },
];
// An array of links for footer
const footerLinks = [
  {
    section: 'Productos',
    links: [
      {
        name: 'Precintos de seguridad',
        url: '/productos/precintos-de-seguridad',
      },
      {
        name: 'Etiquetas y cintas',
        url: '/productos/etiquetas-y-cintas-de-seguridad',
      },
      { name: 'Tulas y bolsas', url: '/productos/tulas-y-bolsas-de-seguridad' },
      { name: 'Cajas de seguridad', url: '/productos/cajas-de-seguridad' },
    ],
  },
  {
    section: 'Empresa',
    links: [
      { name: 'Nosotros', url: '/nosotros' },
      { name: 'Usos y sectores', url: '/usos' },
      { name: 'Preguntas frecuentes', url: '/faq' },
      { name: 'Contacto', url: '/contacto' },
    ],
  },
];
// Redes sociales. Deja vacío lo que no aplique: el footer solo renderiza los
// iconos que tienen URL configurada.
// TODO(confirmar): faltan las URL exactas de los perfiles de Facebook e
// Instagram, que en el sitio actual están enlazados desde el footer.
const socialLinks: Record<string, string> = {
  facebook: '',
  instagram: '',
  linkedin: '',
  x: '',
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};
