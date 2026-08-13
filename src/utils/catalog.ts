import { getCollection } from 'astro:content';
import { normalize, slugify } from '@utils/text';

/**
 * Aplana las dos colecciones de contenido en una sola lista de referencias,
 * que es lo que consume el catálogo con filtros de /catalogo.
 *
 * Cada referencia sabe a qué familia y a qué grupo pertenece, y a qué página
 * de detalle enlaza, para que los filtros y el buscador trabajen sobre un
 * único arreglo en lugar de recorrer las colecciones en el navegador.
 */
export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  family: string;
  familyId: string;
  group: string;
  groupId: string;
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
  /** Nombre y descripción normalizados (sin tildes, en minúscula) para buscar */
  search: string;
}

export interface CatalogFacet {
  id: string;
  name: string;
  count: number;
  /** Solo en grupos: la familia a la que pertenecen */
  familyId?: string;
}

export async function getCatalog(): Promise<CatalogItem[]> {
  const items: CatalogItem[] = [];
  const seen = new Set<string>();

  const push = (item: Omit<CatalogItem, 'id' | 'search'>) => {
    // Hay referencias con el mismo nombre en distintos grupos: el id incluye
    // el grupo para no colapsarlas.
    let id = `${item.groupId}--${slugify(item.name)}`;
    let n = 2;
    while (seen.has(id)) id = `${item.groupId}--${slugify(item.name)}-${n++}`;
    seen.add(id);
    items.push({
      ...item,
      id,
      search: normalize(`${item.name} ${item.description ?? ''}`),
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
    for (const product of categoria.data.products) {
      push({
        name: product.name,
        description: product.description,
        family: familiaPrecintos?.data.title ?? 'Precintos de Seguridad',
        familyId: familiaPrecintos?.id ?? 'precintos-de-seguridad',
        group: categoria.data.title,
        groupId: categoria.id,
        url: `/precintos/${categoria.id}`,
        image: product.image ?? categoria.data.cardImage,
        imageAlt:
          product.imageAlt ??
          categoria.data.cardImageAlt ??
          categoria.data.title,
      });
    }
  }

  for (const familia of soluciones) {
    for (const group of familia.data.groups) {
      for (const product of group.products) {
        push({
          name: product.name,
          description: product.description,
          family: familia.data.title,
          familyId: familia.id,
          group: group.name,
          groupId: `${familia.id}--${slugify(group.name)}`,
          url: `/productos/${familia.id}`,
          image: group.image,
          imageAlt: group.imageAlt ?? group.name,
        });
      }
    }
  }

  return items;
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
