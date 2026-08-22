import { getCollection } from 'astro:content';
import { normalize, slugify } from '@utils/text';
import { FICHA_POR_FAMILIA } from '@data/fichas';

/**
 * Aplana las dos colecciones de contenido en una sola lista de referencias.
 *
 * De aquí comen tres cosas: el catálogo con filtros de /catalogo, la ficha
 * individual de cada referencia y el bloque de productos relacionados. Un
 * único recorrido para las tres, porque cada uno por su lado era la forma
 * segura de que la URL de una referencia dijera una cosa en el catálogo y otra
 * en su propia página.
 */

export interface FichaSpec {
  etiqueta: string;
  valor: string;
}

export interface FichaPaso {
  titulo: string;
  texto: string;
}

export interface FichaFaq {
  question: string;
  answer: string;
}

export interface FichaBeneficio {
  titulo: string;
  texto?: string;
  icon?: string;
}

/**
 * La información de la página de producto, ya resuelta: lo que trae la
 * referencia, más lo que hereda de su categoría.
 *
 * Se resuelve aquí y no en la plantilla para que la plantilla no tenga que
 * saber de dónde salió cada cosa. Cada campo puede venir vacío —la ficha se
 * llena referencia por referencia— y la plantilla oculta el bloque que no
 * tenga datos.
 */
export interface Ficha {
  badges: string[];
  galeria: Array<{ src: ImageMetadata; alt?: string }>;
  specs: FichaSpec[];
  medidas?: {
    imagen?: ImageMetadata;
    imagenAlt?: string;
    valores: FichaSpec[];
  };
  colores: Array<{ nombre: string; hex?: string }>;
  notaColores?: string;
  personalizacion: string[];
  notaPersonalizacion?: string;
  moq?: { unidades: number; nota?: string };
  usos: string[];
  sectores: string[];
  /** Propios si los tiene; si no, los de la categoría. */
  comoSeUsa: FichaPaso[];
  presentacion: string[];
  fichaTecnica?: string;
  /** Las de la categoría primero, después las propias. */
  faq: FichaFaq[];
  beneficios: FichaBeneficio[];
}

export interface Referencia {
  /**
   * Identificador global, el que usa el cotizador para no mezclar dos
   * referencias que se llaman igual en categorías distintas.
   */
  id: string;
  /** Última parte de la URL, única dentro de su categoría. */
  slug: string;
  name: string;
  code?: string;
  description?: string;
  family: string;
  familyId: string;
  group: string;
  groupId: string;
  /** Página de la categoría a la que pertenece. */
  groupUrl: string;
  /** Su propia página de producto. */
  url: string;
  /**
   * Fotografía de la referencia.
   *
   * Las fotos que existen son una por tipo de producto, no una por medida: las
   * nueve bolsas courier se diferencian en centímetros, y fotografiar cada una
   * daría nueve veces la misma imagen. Por eso, cuando la referencia no trae
   * foto propia, hereda la de SU grupo o categoría —que sí la retrata— y nunca
   * la de la familia entera, que enseñaría una tula en la ficha de un
   * protector de guía.
   */
  image?: ImageMetadata;
  imageAlt?: string;
  ficha: Ficha;
  /** Nombre y descripción normalizados (sin tildes, en minúscula) para buscar */
  search: string;
}

/** Lo que el catálogo con filtros necesita de cada referencia. */
export type CatalogItem = Omit<Referencia, 'ficha' | 'groupUrl'>;

export interface CatalogFacet {
  id: string;
  name: string;
  count: number;
  /** Solo en grupos: la familia a la que pertenecen */
  familyId?: string;
}

/** Lo que una categoría le presta a sus referencias. */
interface Defectos {
  beneficios?: FichaBeneficio[];
  comoSeUsa?: FichaPaso[];
  faq?: FichaFaq[];
}

/**
 * Junta lo de la referencia con lo de su categoría y lo de su familia.
 *
 * Los pasos de instalación se REEMPLAZAN —si una referencia se instala
 * distinto, sus pasos son otros, no unos cuantos más— y las preguntas se
 * SUMAN, porque las de la familia siguen valiendo y la referencia solo agrega
 * las suyas. De más específico a más general: referencia, categoría, familia.
 */
function resolverFicha(
  producto: any,
  defectos: Defectos,
  familiaId: string
): Ficha {
  const familia = FICHA_POR_FAMILIA[familiaId] ?? {};
  const comoSeUsa = producto.comoSeUsa?.length
    ? producto.comoSeUsa
    : defectos.comoSeUsa?.length
      ? defectos.comoSeUsa
      : (familia.comoSeUsa ?? []);
  return {
    badges: producto.badges ?? [],
    galeria: producto.galeria ?? [],
    specs: producto.specs ?? [],
    medidas: producto.medidas,
    colores: producto.colores ?? [],
    notaColores: producto.notaColores,
    personalizacion: producto.personalizacion ?? [],
    notaPersonalizacion: producto.notaPersonalizacion,
    moq: producto.moq,
    usos: producto.usos ?? [],
    sectores: producto.sectores ?? [],
    comoSeUsa,
    presentacion: producto.presentacion ?? [],
    fichaTecnica: producto.fichaTecnica,
    faq: [
      ...(familia.faq ?? []),
      ...(defectos.faq ?? []),
      ...(producto.faq ?? []),
    ],
    beneficios: defectos.beneficios?.length
      ? defectos.beneficios
      : (familia.beneficios ?? []),
  };
}

/**
 * Todas las referencias del sitio, con su ficha resuelta y su URL propia.
 *
 * El slug se hace único DENTRO de su categoría, no del sitio entero: dos
 * referencias que se llaman igual en categorías distintas conviven sin
 * problema porque sus URLs ya se diferencian por la categoría, y arrastrar un
 * sufijo global haría que la URL de una referencia dependiera de si alguien
 * agregó otra en otra parte del catálogo.
 */
export async function getReferencias(): Promise<Referencia[]> {
  const referencias: Referencia[] = [];
  const idsUsados = new Set<string>();
  const slugsPorCategoria = new Map<string, Set<string>>();

  const unico = (usados: Set<string>, base: string) => {
    let valor = base;
    let n = 2;
    while (usados.has(valor)) valor = `${base}-${n++}`;
    usados.add(valor);
    return valor;
  };

  const push = (
    datos: Omit<Referencia, 'id' | 'slug' | 'url' | 'search' | 'ficha'>,
    producto: any,
    defectos: Defectos
  ) => {
    const id = unico(idsUsados, `${datos.groupId}--${slugify(datos.name)}`);

    let slugs = slugsPorCategoria.get(datos.groupUrl);
    if (!slugs) slugsPorCategoria.set(datos.groupUrl, (slugs = new Set()));
    const slug = unico(slugs, producto.slug ?? slugify(datos.name));

    referencias.push({
      ...datos,
      id,
      slug,
      url: `${datos.groupUrl}/${slug}`,
      ficha: resolverFicha(producto, defectos, datos.familyId),
      search: normalize(`${datos.name} ${datos.description ?? ''}`),
    });
  };

  const soluciones = (await getCollection('soluciones')).sort(
    (a, b) => a.data.order - b.data.order
  );
  const precintos = (await getCollection('precintos')).sort(
    (a, b) => a.data.order - b.data.order
  );

  // Los precintos se agrupan por categoría, no por familia: la familia
  // "Precintos de Seguridad" delega su catálogo en /precintos.
  const familiaPrecintos = soluciones.find(s => s.data.catalogUrl);
  for (const categoria of precintos) {
    const defectos: Defectos = {
      beneficios: categoria.data.beneficios,
      comoSeUsa: categoria.data.comoSeUsa,
      faq: categoria.data.faq,
    };
    for (const product of categoria.data.products) {
      push(
        {
          name: product.name,
          code: product.code,
          description: product.description,
          family: familiaPrecintos?.data.title ?? 'Precintos de Seguridad',
          familyId: familiaPrecintos?.id ?? 'precintos-de-seguridad',
          group: categoria.data.title,
          groupId: categoria.id,
          groupUrl: `/precintos/${categoria.id}`,
          image: product.image ?? categoria.data.cardImage,
          imageAlt:
            product.imageAlt ??
            categoria.data.cardImageAlt ??
            categoria.data.title,
        },
        product,
        defectos
      );
    }
  }

  for (const familia of soluciones) {
    for (const group of familia.data.groups) {
      const defectos: Defectos = {
        beneficios: group.beneficios,
        comoSeUsa: group.comoSeUsa,
        faq: group.faq,
      };
      for (const product of group.products) {
        push(
          {
            name: product.name,
            description: product.description,
            family: familia.data.title,
            familyId: familia.id,
            group: group.name,
            groupId: `${familia.id}--${slugify(group.name)}`,
            groupUrl: `/productos/${familia.id}`,
            image: product.image ?? group.image,
            imageAlt: product.imageAlt ?? group.imageAlt ?? group.name,
          },
          product,
          defectos
        );
      }
    }
  }

  return referencias;
}

/**
 * Las rutas de ficha que le tocan a una base (`/precintos` o `/productos`),
 * con sus relacionados ya resueltos.
 *
 * Los relacionados salen de la MISMA categoría y no de la familia entera: al
 * pie de un precinto de correa dentada de 35 cm, lo útil es el de 39 y el de
 * doble cierre —las otras medidas del mismo producto—, no una tula de recaudo
 * que comparte con él poco más que el proveedor. Van cuatro: los que caben en
 * una fila sin que el pie de página se convierta en un segundo catálogo.
 */
export async function getRutasDeProducto(base: '/precintos' | '/productos') {
  const referencias = await getReferencias();

  return referencias
    .filter(referencia => referencia.groupUrl.startsWith(`${base}/`))
    .map(referencia => ({
      params: {
        id: referencia.groupUrl.slice(base.length + 1),
        producto: referencia.slug,
      },
      props: {
        referencia,
        relacionados: referencias
          .filter(
            otra =>
              otra.groupId === referencia.groupId && otra.id !== referencia.id
          )
          .slice(0, 4),
      },
    }));
}

export async function getCatalog(): Promise<CatalogItem[]> {
  const referencias = await getReferencias();
  return referencias.map(
    ({ ficha: _ficha, groupUrl: _groupUrl, ...item }) => item
  );
}

/** Familias y grupos con su conteo, para pintar los filtros. */
export function getFacets(items: CatalogItem[]) {
  const families = new Map<string, CatalogFacet>();
  const groups = new Map<string, CatalogFacet>();

  for (const item of items) {
    const family = families.get(item.familyId);
    if (family) family.count++;
    else
      families.set(item.familyId, {
        id: item.familyId,
        name: item.family,
        count: 1,
      });

    const group = groups.get(item.groupId);
    if (group) group.count++;
    else
      groups.set(item.groupId, {
        id: item.groupId,
        name: item.group,
        count: 1,
        familyId: item.familyId,
      });
  }

  return {
    families: [...families.values()],
    groups: [...groups.values()],
  };
}
