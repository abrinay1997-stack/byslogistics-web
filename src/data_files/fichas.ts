import faqsData from '@data/faqs.json';

/**
 * Lo que TODA referencia de una familia comparte en su ficha de producto.
 *
 * POR QUÉ NO VIVE EN EL FRONTMATTER. Los cinco beneficios de un precinto y sus
 * cuatro pasos de instalación son los mismos en las once categorías de
 * precintos. Escribirlos en cada archivo de contenido serían once copias del
 * mismo párrafo, y once sitios donde corregirlo el día que cambie. Aquí se
 * escriben una vez.
 *
 * ORDEN DE PRECEDENCIA, de más específico a más general:
 *
 *   la referencia  →  su categoría (frontmatter)  →  su familia (este archivo)
 *
 * Así, una referencia que se instale distinto pone sus propios pasos, una
 * categoría entera puede sobreescribir los suyos, y el resto hereda.
 */

export interface Beneficio {
  titulo: string;
  texto?: string;
  icon?: string;
}

export interface Paso {
  titulo: string;
  texto: string;
}

/**
 * Los cinco beneficios de la franja bajo el encabezado, con los títulos y las
 * líneas de apoyo tal como los dictó la clienta en su mockup. Son etiquetas
 * cortas a propósito: cinco columnas con una frase larga cada una dejan de
 * leerse de un vistazo, que es lo único que esa franja tiene que lograr.
 *
 * Los iconos son los que ya existen en el sitio: ninguno se dibujó para esto.
 */
const BENEFICIOS_PRECINTOS: Beneficio[] = [
  {
    titulo: 'Alta seguridad',
    texto: 'Evidencia de manipulación',
    icon: 'verified',
  },
  {
    titulo: 'Personalizable',
    texto: 'Logo, numeración y código de barras',
    icon: 'puzzle',
  },
  {
    titulo: 'Fácil de usar',
    texto: 'Instalación rápida y segura',
    icon: 'checkCircle',
  },
  {
    titulo: 'Resistente',
    texto: 'Material de alta calidad',
    icon: 'frame',
  },
  {
    titulo: 'Trazabilidad',
    texto: 'Numeración consecutiva',
    icon: 'books',
  },
];

/**
 * Los cuatro pasos del precintado.
 *
 * Son los mismos que el asistente del sitio le explica a quien pregunta cómo
 * funciona un precinto (`conocimiento.ts`, hecho `como-funciona-el-precintado`):
 * la operación es una sola, y la página y el chat tienen que contarla igual.
 */
const COMO_SE_USA_PRECINTOS: Paso[] = [
  {
    titulo: 'Instale el precinto',
    texto:
      'Páselo por el punto de acceso que quiere proteger y ciérrelo hasta el tope.',
  },
  {
    titulo: 'Registre el número',
    texto:
      'Anote la numeración en la remisión, el manifiesto o su sistema de control.',
  },
  {
    titulo: 'Despache la carga',
    texto:
      'Cualquier intento de apertura durante el trayecto queda evidenciado.',
  },
  {
    titulo: 'Verifique al recibir',
    texto:
      'Compare el número con el registrado y revise el cuerpo del precinto antes de cortarlo.',
  },
];

/**
 * Preguntas de la ficha, tomadas de la página de preguntas frecuentes.
 *
 * Se referencian POR SU PREGUNTA en vez de copiarse: la respuesta sigue
 * viviendo en `faqs.json`, que es donde se edita, y así la ficha no puede
 * contestar una cosa distinta a la página. Si alguien reescribe una de estas
 * preguntas allá, `tests/content.test.js` lo avisa en vez de dejar el bloque
 * a medias sin que nadie se entere.
 */
const PREGUNTAS_BASE_PRECINTOS = [
  '¿Los precintos son de un solo uso?',
  '¿Los precintos se pueden personalizar con el logo de mi empresa?',
  '¿Por qué los precios no aparecen publicados?',
  '¿A qué ciudades despachan?',
];

const TODAS_LAS_FAQ = faqsData.categories.flatMap(
  categoria => categoria.faqs
) as Array<{ question: string; answer: string }>;

/** Las preguntas base que sí existen hoy en faqs.json. */
export function faqBase(preguntas: string[]) {
  return preguntas
    .map(pregunta => TODAS_LAS_FAQ.find(faq => faq.question === pregunta))
    .filter((faq): faq is { question: string; answer: string } => Boolean(faq));
}

/** Las preguntas base declaradas, existan o no. Lo usa el test. */
export const PREGUNTAS_BASE = { precintos: PREGUNTAS_BASE_PRECINTOS };

/**
 * Defectos por familia. La clave es el id de la familia en
 * `src/content/soluciones/`.
 *
 * Solo los precintos tienen entrada por ahora: son la familia con las once
 * categorías y las 49 referencias. Las demás heredan lo que declare su propio
 * grupo, y mientras no declaren nada, esos bloques sencillamente no se pintan.
 */
export const FICHA_POR_FAMILIA: Record<
  string,
  {
    beneficios?: Beneficio[];
    comoSeUsa?: Paso[];
    faq?: ReturnType<typeof faqBase>;
  }
> = {
  'precintos-de-seguridad': {
    beneficios: BENEFICIOS_PRECINTOS,
    comoSeUsa: COMO_SE_USA_PRECINTOS,
    faq: faqBase(PREGUNTAS_BASE_PRECINTOS),
  },
};
