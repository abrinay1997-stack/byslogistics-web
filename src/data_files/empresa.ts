/**
 * Textos institucionales de B&S Logistics: quiénes somos y a qué sectores
 * atendemos.
 *
 * Vivían dentro de `/nosotros` y `/usos`, cada uno en su página. Se sacaron
 * aquí cuando el asistente del sitio empezó a responder por ellos: la base de
 * conocimiento del chat (`src/pages/kb.json.ts`) se genera en el build a
 * partir de estos mismos datos, así que un texto que cambie en la página
 * cambia también en lo que contesta el asistente, sin que nadie tenga que
 * acordarse de actualizar dos sitios.
 */

/** Año de constitución de la sociedad. Se cita en /nosotros y en el chat. */
export const FUNDACION = 2011;

/** Reseña de la empresa, tal cual se lee en /nosotros. */
export const RESENA: string[] = [
  'BUSINESS & SUPPLIES LOGISTICS S.A.S., es una empresa colombiana fundada en 2011 que se especializa en la distribución y comercialización de todo tipo de productos y elementos de Seguridad preventiva que intervienen en la cadena de custodia y logística de las compañías.',
  'Nos enfocamos en la creación de valor agregado, en establecer relaciones sólidas y confiables que permitan a nuestros clientes contar con soluciones de seguridad oportunas y adecuadas a sus necesidades. Esto, sumado al esfuerzo y compromiso constante, nos ha permitido en pocos años posicionarnos en el mercado nacional como uno de los principales proveedores de Precintos de Seguridad.',
  'Contamos con una completa gama de productos a precios competitivos enfocados a brindar soluciones logísticas en transporte y control de activos, lo que nos ha permitido suministrar a líderes de industria en sectores como: Financiero, transportes, combustibles e hidrocarburos, minería y carbón, alimentos, cárnicos, apuestas, farmacéuticos, entre otros.',
];

/**
 * Sectores atendidos, tomados del texto "¿Quiénes Somos?" del sitio actual.
 *
 * TODO(contenido): el menú "Usos" del sitio actual es un desplegable con
 * páginas propias por aplicación. Falta ese material para desarrollar cada
 * sector con su caso de uso y sus productos recomendados.
 */
export const SECTORES: Array<{ name: string; description: string }> = [
  {
    name: 'Financiero',
    description:
      'Traslado de valores y documentos con tulas y bolsas de seguridad de un solo uso.',
  },
  {
    name: 'Transporte',
    description:
      'Precintado de puertas de contenedor y furgones para asegurar la carga en ruta.',
  },
  {
    name: 'Combustibles e hidrocarburos',
    description:
      'Precintos de botella y de guaya en válvulas, tapas y puntos de descarga de carrotanques.',
  },
  {
    name: 'Minería y carbón',
    description:
      'Control de despachos a granel y verificación de carga en operaciones de alto volumen.',
  },
  {
    name: 'Alimentos',
    description:
      'Sellos de garantía y control de inventarios en cadena de frío y producto terminado.',
  },
  {
    name: 'Cárnicos',
    description:
      'Trazabilidad en el transporte refrigerado y evidencia de apertura indebida.',
  },
  {
    name: 'Apuestas',
    description:
      'Custodia de recaudo y de equipos en punto de venta con precintos numerados.',
  },
  {
    name: 'Farmacéuticos',
    description:
      'Sellos de garantía sobre empaques y control de trazabilidad en la distribución.',
  },
];
