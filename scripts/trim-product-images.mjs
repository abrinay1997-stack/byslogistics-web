/**
 * Recorta el margen muerto de las fotos del catálogo.
 *
 * EL PROBLEMA QUE RESUELVE. Las fotos vienen del listado de precios y cada una
 * trae el producto centrado en un lienzo distinto: en
 * `precinto-dentado-doble-cierre.png` el precinto ocupaba el 44% del archivo y
 * el resto era blanco. Como las tarjetas usan `object-contain`, lo que se
 * escala para llenar el marco es el LIENZO, no el producto: al lado de una foto
 * bien encuadrada, ese precinto se veía a la mitad de tamaño y flotando. La
 * rejilla de "Nuestras Soluciones" quedaba desigual sin que hubiera nada mal en
 * la maquetación.
 *
 * Con el margen recortado, el relleno lo pone la tarjeta (`p-6`) y es el mismo
 * para todas.
 *
 * POR QUÉ UN SCRIPT Y NO UN RECORTE A MANO. Porque la próxima foto que llegue
 * traerá su propio margen. Esto se vuelve a correr y ya.
 *
 *   node scripts/trim-product-images.mjs         recorta e informa
 *   node scripts/trim-product-images.mjs --dry   solo informa, no toca nada
 *
 * Es idempotente: una imagen ya recortada no gana nada al volver a pasarla, y
 * el script la deja como está en vez de reescribirla.
 *
 * Solo quita borde UNIFORME. Una fotografía con fondo real no se toca, porque
 * no hay nada que recortar sin comerse la imagen.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const DIR = new URL('../src/images/productos/', import.meta.url).pathname;

/**
 * Cuánta diferencia de color tolera para considerar que un píxel sigue siendo
 * "borde". 12 sobre 255: aguanta el gris sucio de un blanco escaneado sin
 * llegar a morder el producto.
 */
const UMBRAL = 12;

/**
 * Por debajo de esta ganancia no se reescribe el archivo. Sin este mínimo,
 * cada corrida volvería a comprimir imágenes que ya están bien y ensuciaría el
 * historial con cambios de un píxel.
 */
const GANANCIA_MINIMA = 0.03;

const seco = process.argv.includes('--dry');
const EXTENSIONES = new Set(['.png', '.jpg', '.jpeg']);

const archivos = (await readdir(DIR))
  .filter(f => EXTENSIONES.has(extname(f).toLowerCase()))
  .sort();

let recortadas = 0;

for (const nombre of archivos) {
  const ruta = join(DIR, nombre);
  const original = await readFile(ruta);

  let meta, recortada;
  try {
    meta = await sharp(original).metadata();
    recortada = await sharp(original)
      .trim({ threshold: UMBRAL })
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    console.log(`· ${nombre}: no se pudo leer (${err.message})`);
    continue;
  }

  const areaAntes = meta.width * meta.height;
  const areaDespues = recortada.info.width * recortada.info.height;
  const ganancia = 1 - areaDespues / areaAntes;

  if (ganancia < GANANCIA_MINIMA) continue;

  const antes = `${meta.width}x${meta.height}`;
  const despues = `${recortada.info.width}x${recortada.info.height}`;
  const pct = `${Math.round(ganancia * 100)}%`.padStart(3);

  if (!seco) {
    // Se reescribe en el mismo formato: los .md apuntan a esta ruta y no
    // tienen por qué enterarse.
    const salida =
      meta.format === 'png'
        ? await sharp(recortada.data).png({ compressionLevel: 9 }).toBuffer()
        : await sharp(recortada.data).jpeg({ quality: 90 }).toBuffer();
    await writeFile(ruta, salida);
  }

  console.log(`${pct} menos  ${nombre.padEnd(42)} ${antes} → ${despues}`);
  recortadas += 1;
}

console.log(
  recortadas === 0
    ? 'Nada que recortar: todas las fotos están ajustadas a su contenido.'
    : `${recortadas} de ${archivos.length} imágenes ${seco ? 'se recortarían' : 'recortadas'}.`
);
