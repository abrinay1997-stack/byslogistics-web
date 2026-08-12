// An array of links for navigation bar
const navBarLinks = [
  { name: 'Inicio', url: '/' },
  { name: 'Servicios', url: '/services' },
  { name: 'Soluciones', url: '/products' },
  { name: 'Blog', url: '/blog' },
  { name: 'Contacto', url: '/contact' },
];
// An array of links for footer
const footerLinks = [
  {
    section: 'Servicios',
    links: [
      { name: 'Nuestros servicios', url: '/services' },
      { name: 'Soluciones logísticas', url: '/products' },
      { name: 'Documentación', url: '/welcome-to-docs/' },
    ],
  },
  {
    section: 'Empresa',
    links: [
      { name: 'Quiénes somos', url: '/services' },
      { name: 'Blog', url: '/blog' },
      { name: 'Contacto', url: '/contact' },
    ],
  },
];
// An object of links for social icons. Deja vacío lo que no aplique:
// el footer solo renderiza los iconos que tienen URL configurada.
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
