// Menú principal, replicando la estructura del sitio actual.
// Los menús "Precintos", "Productos" y "Usos" son desplegables en el sitio
// original; aquí apuntan al catálogo hasta tener el listado completo de
// categorías y sus productos.
const navBarLinks = [
  { name: 'Precintos', url: '/products' },
  { name: 'Productos', url: '/products' },
  { name: 'Usos', url: '/products' },
  { name: 'Nosotros', url: '/nosotros' },
  { name: "FAQ's", url: '/#faq' },
  { name: 'Contacto', url: '/contact' },
];
// An array of links for footer
const footerLinks = [
  {
    section: 'Productos',
    links: [
      { name: 'Precintos de seguridad', url: '/products' },
      { name: 'Etiquetas y cintas', url: '/products' },
      { name: 'Tulas y bolsas', url: '/products' },
      { name: 'Cajas de seguridad', url: '/products' },
    ],
  },
  {
    section: 'Empresa',
    links: [
      { name: 'Nosotros', url: '/nosotros' },
      { name: 'Preguntas frecuentes', url: '/#faq' },
      { name: 'Contacto', url: '/contact' },
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
