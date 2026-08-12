/**
 * Helpers de texto sin dependencias del servidor, para que puedan usarse tanto
 * al construir las páginas como en los scripts del navegador.
 */

/** Quita tildes y pasa a minúscula, para que "botella" encuentre "Botellá". */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
