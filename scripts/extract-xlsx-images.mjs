#!/usr/bin/env node
/**
 * Extrae las fotos de producto incrustadas en el listado de precios (.xlsx) y
 * las deja nombradas con el producto al que corresponden.
 *
 *   node scripts/extract-xlsx-images.mjs LISTADO_PRECIOS_2026.xlsx [destino]
 *
 * Un .xlsx es un ZIP: las imágenes viven en `xl/media/` sin ningún nombre útil
 * (image1.png, image2.png…). Lo que sí guarda Excel es el *ancla* de cada
 * imagen — la celda sobre la que está puesta — en `xl/drawings/drawingN.xml`.
 * Con eso se puede recuperar a qué fila pertenece cada foto y, por lo tanto,
 * el nombre del producto de esa fila.
 *
 * En el listado de B&S el nombre del producto está en la columna K (y a veces
 * en la A) de la fila donde arranca cada bloque de cantidades, así que la foto
 * anclada en esa fila —o en la siguiente— es la de ese producto.
 *
 * El resultado va a `tmp/xlsx-images/` por defecto: es material de trabajo. De
 * ahí se copian a `src/images/productos/` solo las que se van a publicar, ya
 * revisadas, porque el listado trae también capturas de tablas y fotos
 * repetidas que no sirven para la web.
 */

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [, , xlsxPath, outDir = 'tmp/xlsx-images'] = process.argv;

if (!xlsxPath) {
  console.error(
    'Uso: node scripts/extract-xlsx-images.mjs <archivo.xlsx> [destino]'
  );
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'xlsx-'));
try {
  execFileSync('unzip', ['-o', '-q', xlsxPath, '-d', work]);

  const read = p => readFileSync(join(work, p), 'utf8');
  const readOr = (p, fallback = '') => {
    try {
      return read(p);
    } catch {
      return fallback;
    }
  };

  const decode = s =>
    s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

  // Las celdas de texto no guardan el texto: guardan un índice a esta tabla.
  const sharedStrings = [
    ...readOr('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g),
  ].map(m =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')
  );

  const rels = xml =>
    Object.fromEntries(
      [...xml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map(m => [
        m[1],
        m[2],
      ])
    );

  const workbookRels = rels(read('xl/_rels/workbook.xml.rels'));
  const sheets = [
    ...read('xl/workbook.xml').matchAll(
      /<sheet name="([^"]+)"[^>]*r:id="([^"]+)"/g
    ),
  ].map(m => ({
    name: decode(m[1]),
    file: workbookRels[m[2]].replace(/^\/?xl\//, ''),
  }));

  const slug = s =>
    decode(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70);

  mkdirSync(outDir, { recursive: true });
  const seen = new Map();
  const taken = new Map();
  let written = 0;

  for (const sheet of sheets) {
    const sheetRels = readOr(
      `xl/worksheets/_rels/${sheet.file.split('/').pop()}.rels`
    );
    const drawing = sheetRels.match(
      /Target="\.\.\/(drawings\/drawing\d+\.xml)"/
    )?.[1];
    if (!drawing) continue;

    // Valores de la hoja, para poder leer el nombre del producto de cada fila.
    const cells = {};
    for (const m of read(`xl/${sheet.file}`).matchAll(
      /<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g
    )) {
      const [, col, row, attrs, body] = m;
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw === undefined) continue;
      const value = attrs.includes('t="s"') ? sharedStrings[+raw] : raw;
      if (value && String(value).trim()) {
        cells[`${col}${row}`] = decode(String(value).trim()).replace(
          /\s+/g,
          ' '
        );
      }
    }

    const drawingRels = rels(
      read(`xl/drawings/_rels/${drawing.split('/')[1]}.rels`)
    );
    const drawingXml = read(`xl/${drawing}`);

    // Un nombre de producto, no una cantidad ni un precio.
    const isName = v => v && !/^[\d.,$ ]+$/.test(v);

    for (const anchor of drawingXml.matchAll(
      /<xdr:(twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:\1>/g
    )) {
      const block = anchor[0];
      const row = block.match(
        /<xdr:from><xdr:col>\d+<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/
      );
      const embed = block.match(/r:embed="([^"]+)"/);
      if (!row || !embed) continue;

      const rowNumber = +row[1] + 1; // xdr:row es 0-based
      const media = drawingRels[embed[1]]?.replace('../media/', '');
      if (!media) continue;

      // La imagen queda anclada en la fila del título del bloque o justo
      // debajo; se mira hacia arriba hasta encontrar un nombre.
      let name = '';
      for (const col of ['K', 'A']) {
        for (let r = rowNumber; r >= rowNumber - 2 && !name; r--) {
          if (isName(cells[`${col}${r}`])) name = cells[`${col}${r}`];
        }
        if (name) break;
      }

      const base = name ? slug(name) : `${slug(sheet.name)}-fila-${rowNumber}`;
      // Una misma foto sirve a varias filas (variantes de tamaño del mismo
      // producto): se escribe una vez con el nombre de la primera.
      if (seen.has(media)) {
        console.log(
          `  ${media} → ya extraída como ${seen.get(media)} (también: ${base})`
        );
        continue;
      }

      // Dos fotos distintas pueden caer bajo el mismo nombre (el listado repite
      // el título en varios bloques): se numeran para no pisarse.
      const ext = media.slice(media.lastIndexOf('.'));
      const used = (taken.get(base) ?? 0) + 1;
      taken.set(base, used);
      const target = used === 1 ? `${base}${ext}` : `${base}-${used}${ext}`;
      copyFileSync(join(work, 'xl/media', media), join(outDir, target));
      seen.set(media, target);
      written++;
      console.log(`  ${media} → ${target}`);
    }
  }

  console.log(`\n${written} imágenes en ${outDir}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
