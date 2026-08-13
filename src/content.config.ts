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
      // Si la familia tiene su propio índice de categorías (los precintos),
      // se enlaza ahí en lugar de listar las referencias en esta página.
      catalogUrl: z.string().optional(),
      catalogLabel: z.string().optional(),
      // Referencias agrupadas por subtipo. Los precios no se publican: el
      // listado del Excel es administrativo.
      //
      // La foto va en el GRUPO y no en cada referencia porque así son las
      // fotos que existen: una por tipo de producto, no una por medida. Las
      // nueve bolsas courier se diferencian en centímetros, y fotografiar cada
      // una daría nueve veces la misma imagen.
      groups: z
        .array(
          z.object({
            name: z.string(),
            image: image().optional(),
            imageAlt: z.string().optional(),
            products: z.array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
              })
            ),
          })
        )
        .default([]),
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
            // Descripción de la foto. Sin ella, la ficha repite el nombre de
            // la referencia, que en un listado de medidas dice bastante menos
            // que "precinto de guaya con cuerpo metálico azul".
            imageAlt: z.string().optional(),
          })
        )
        .default([]),
    }),
});

/**
 * Guías de uso: un artículo por aplicación real de los productos (asegurar un
 * contenedor, precintar un carrotanque, transportar valores…).
 *
 * Cada archivo en src/content/usos/ genera su propia página en /usos/<id>.
 *
 * POR QUÉ EXISTEN. Las páginas de producto responden a quien ya sabe qué
 * quiere: busca "precinto de guaya" y llega. Estas responden a quien tiene el
 * problema pero no el nombre del producto —"cómo asegurar la puerta de un
 * contenedor", "qué precinto va en un carrotanque"—, que es la mayor parte de
 * quien busca. Cada guía termina llevando a la referencia que corresponde.
 */
const usosCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/usos',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Se usa como metadescripción, así que conviene que quepa en 160. */
      description: z.string(),
      order: z.number(),
      /** Sector al que pertenece la aplicación, para agrupar en el índice. */
      sector: z.string(),
      /** Resumen de una línea para la tarjeta del índice. */
      summary: z.string(),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      /** Productos recomendados, con su enlace al catálogo. */
      productos: z
        .array(
          z.object({
            name: z.string(),
            url: z.string(),
            note: z.string().optional(),
            image: image().optional(),
            imageAlt: z.string().optional(),
          })
        )
        .default([]),
      /**
       * Preguntas frecuentes de la guía. Se publican también como datos
       * estructurados FAQPage: es lo que permite que la respuesta salga en el
       * buscador sin que nadie entre a la página, que para una consulta corta
       * es exactamente lo que queremos.
       */
      faq: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .default([]),
      /** Guías relacionadas, por id. */
      relacionados: z.array(z.string()).default([]),
    }),
});

export const collections = {
  soluciones: solucionesCollection,
  precintos: precintosCollection,
  usos: usosCollection,
};
