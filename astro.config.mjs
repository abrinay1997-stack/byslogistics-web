import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // https://docs.astro.build/en/guides/images/#authorizing-remote-images
  site: 'https://byslogistics.com.co',
  prefetch: true,
  integrations: [
    sitemap(),
    starlight({
      title: 'Documentación BYS Logistics',
      // https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md
      // If no Astro and Starlight i18n configurations are provided, the built-in default locale is used in Starlight and a matching Astro i18n configuration is generated/used.
      // If only a Starlight i18n configuration is provided, an equivalent Astro i18n configuration is generated/used.
      // If only an Astro i18n configuration is provided, the Starlight i18n configuration is updated to match it.
      // If both an Astro and Starlight i18n configurations are provided, an error is thrown.
      locales: {
        root: {
          label: 'Español',
          lang: 'es',
        },
      },
      // https://starlight.astro.build/guides/sidebar/
      sidebar: [
        {
          label: 'Guías de inicio rápido',
          items: [{ autogenerate: { directory: 'guides' } }],
        },
        {
          label: 'Servicios',
          items: [{ autogenerate: { directory: 'construction' } }],
        },
        {
          label: 'Manejo de carga',
          items: [
            { label: 'Guías operativas', link: 'tools/tool-guides/' },
            { label: 'Cuidado de equipos', link: 'tools/equipment-care/' },
          ],
        },
        {
          label: 'Temas avanzados',
          items: [{ autogenerate: { directory: 'advanced' } }],
        },
      ],
      disable404Route: true,
      customCss: ['./src/assets/styles/starlight.css'],
      favicon: '/favicon.ico',
      components: {
        SiteTitle: './src/components/ui/starlight/SiteTitle.astro',
        Head: './src/components/ui/starlight/Head.astro',
        MobileMenuFooter:
          './src/components/ui/starlight/MobileMenuFooter.astro',
        ThemeSelect: './src/components/ui/starlight/ThemeSelect.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://byslogistics.com.co' + '/social.webp',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'twitter:image',
            content: 'https://byslogistics.com.co' + '/social.webp',
          },
        },
      ],
    }),
    mdx(),
  ],
  experimental: {
    clientPrerender: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
