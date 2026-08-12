// https://docs.astro.build/en/guides/content-collections/#defining-collections

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Familias de producto ("Nuestras Soluciones"): precintos de seguridad,
 * etiquetas y cintas, tulas y bolsas, cajas de seguridad.
 * Cada archivo en src/content/soluciones/ genera su propia página en
 * /productos/<id>.
 */
const solucionesCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/soluciones',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Resumen corto: se usa en la tarjeta del listado y en la metadescripción
      description: z.string(),
      // Orden de aparición en /productos
      order: z.number(),
      // Nombre de un icono de src/components/ui/icons/icons.ts
      icon: z.string(),
      // Imagen de portada. Opcional mientras falte el material fotográfico.
      cardImage: image().optional(),
      cardImageAlt: z.string().optional(),
      // Puntos destacados que se listan en la página de la familia
      highlights: z.array(z.string()).default([]),
    }),
});

/**
 * Categorías de precintos (de botella, de guaya, plásticos…).
 * Cada archivo en src/content/precintos/ genera su propia página en
 * /precintos/<id>.
 */
const precintosCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/precintos',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      order: z.number(),
      cardImage: image().optional(),
      cardImageAlt: z.string().optional(),
      // Referencias del catálogo. `code` es la referencia comercial.
      products: z
        .array(
          z.object({
            name: z.string(),
            code: z.string().optional(),
            description: z.string().optional(),
            image: image().optional(),
          })
        )
        .default([]),
    }),
});

export const collections = {
  soluciones: solucionesCollection,
  precintos: precintosCollection,
};
