// https://docs.astro.build/en/guides/content-collections/#defining-collections

import { defineCollection } from 'astro:content';
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** El `image()` que Astro inyecta en el schema de cada colección. */
type ImageFn = SchemaContext['image'];

/**
 * Campos de la FICHA de una referencia, compartidos por las dos colecciones
 * que tienen productos.
 *
 * POR QUÉ ESTÁ TODO OPCIONAL. Son 129 referencias y la información técnica se
 * levanta a mano, referencia por referencia. Si la plantilla exigiera specs,
 * medidas o ficha técnica, agregar el primer producto completo obligaría a
 * completar los 128 restantes el mismo día o el sitio no compilaría. Cada
 * bloque de la ficha se pinta solo cuando su dato existe, así que el catálogo
 * se puede ir llenando de a poco sin dejar una página a medias por el camino.
 *
 * POR QUÉ `specs` ES UNA LISTA Y NO UNAS COLUMNAS FIJAS. Material, longitud y
 * tipo de cierre describen un precinto; una tula pide capacidad, tela y tipo
 * de cremallera. Con columnas fijas, la ficha de la tula saldría con media
 * tabla vacía y sin dónde poner lo suyo. Cada referencia declara los atributos
 * que le aplican, en el orden en que quiere enseñarlos.
 */
const fichaDeProducto = (image: ImageFn) => ({
  /** Última parte de la URL. Sin él se deriva del nombre. */
  slug: z.string().optional(),
  /** "Más vendido", "Personalizable"… */
  badges: z.array(z.string()).default([]),
  /** Fotos adicionales. La principal sigue siendo `image`. */
  galeria: z
    .array(z.object({ src: image(), alt: z.string().optional() }))
    .default([]),
  specs: z
    .array(z.object({ etiqueta: z.string(), valor: z.string() }))
    .default([]),
  medidas: z
    .object({
      imagen: image().optional(),
      imagenAlt: z.string().optional(),
      valores: z
        .array(z.object({ etiqueta: z.string(), valor: z.string() }))
        .default([]),
    })
    .optional(),
  /**
   * `hex` es opcional: sin él se pinta el nombre del color como etiqueta en
   * vez de un círculo. Un círculo gris para "rojo" confunde más que un texto.
   */
  colores: z
    .array(z.object({ nombre: z.string(), hex: z.string().optional() }))
    .default([]),
  notaColores: z.string().optional(),
  personalizacion: z.array(z.string()).default([]),
  notaPersonalizacion: z.string().optional(),
  /** Cantidad mínima de pedido. */
  moq: z
    .object({ unidades: z.number(), nota: z.string().optional() })
    .optional(),
  usos: z.array(z.string()).default([]),
  sectores: z.array(z.string()).default([]),
  /** Si va vacío, la ficha hereda los pasos de su categoría. */
  comoSeUsa: z
    .array(z.object({ titulo: z.string(), texto: z.string() }))
    .default([]),
  presentacion: z.array(z.string()).default([]),
  /**
   * Ruta del PDF dentro de /public. Sin archivo, el bloque de descarga no se
   * pinta: vale más que no esté a que esté y no abra.
   */
  fichaTecnica: z.string().optional(),
  /** Se suman a las de la categoría, no las reemplazan. */
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
});

/**
 * Lo que una categoría presta a TODAS sus referencias.
 *
 * Los cinco beneficios de un precinto, cómo se instala y las dudas de siempre
 * son casi los mismos en las seis referencias de correa dentada. Escribirlos
 * una vez por categoría y dejar que cada ficha los sobreescriba si hace falta
 * evita copiar el mismo párrafo 129 veces —y tener que corregirlo 129 veces
 * cuando cambie.
 */
const defectosDeCategoria = {
  beneficios: z
    .array(
      z.object({
        titulo: z.string(),
        texto: z.string().optional(),
        /** Nombre de un icono de src/components/ui/icons/icons.ts */
        icon: z.string().optional(),
      })
    )
    .default([]),
  comoSeUsa: z
    .array(z.object({ titulo: z.string(), texto: z.string() }))
    .default([]),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
};

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
            ...defectosDeCategoria,
            products: z.array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                // La foto propia de la referencia; sin ella hereda la del
                // grupo, que es como están hechas las fotos del catálogo.
                image: image().optional(),
                imageAlt: z.string().optional(),
                ...fichaDeProducto(image),
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
      ...defectosDeCategoria,
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
            ...fichaDeProducto(image),
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
