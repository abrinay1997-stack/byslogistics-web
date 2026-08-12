/**
 * Comprobaciones sobre el HTML ya construido (carpeta dist).
 *
 * Requiere haber ejecutado `pnpm build` antes. Cubre lo que solo se puede
 * verificar en la salida final: rutas generadas, metadatos, enlaces internos
 * que no llevan a un 404 y el marcado que Netlify necesita ver.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

before(() => {
  assert.ok(
    existsSync(DIST),
    'no existe dist/: ejecuta `pnpm build` antes de estos tests'
  );
});

/** Todas las páginas HTML generadas, con su ruta pública. */
function pages() {
  const out = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '_astro' && entry.name !== 'pagefind') walk(full);
      } else if (entry.name.endsWith('.html')) {
        const route =
          '/' +
          relative(DIST, full)
            .replace(/index\.html$/, '')
            .replace(/\\/g, '/');
        out.push({ route, file: full, html: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(DIST);
  return out;
}

const RUTAS_ESPERADAS = [
  '/',
  '/catalogo/',
  '/precintos/',
  '/precintos/precintos-de-botella/',
  '/precintos/precintos-de-guaya/',
  '/productos/',
  '/productos/precintos-de-seguridad/',
  '/productos/etiquetas-y-cintas-de-seguridad/',
  '/productos/embalaje-protector/',
  '/productos/rastreo-satelital/',
  '/usos/',
  '/faq/',
  '/nosotros/',
  '/contacto/',
  '/politica-de-datos/',
];

describe('rutas generadas', () => {
  test('todas las páginas esperadas existen', () => {
    const rutas = new Set(pages().map(p => p.route));
    for (const r of RUTAS_ESPERADAS) {
      assert.ok(rutas.has(r), `falta la página ${r}`);
    }
  });

  test('existe la página 404', () => {
    assert.ok(existsSync(join(DIST, '404.html')));
  });

  test('el sitemap incluye todas las páginas esperadas', () => {
    const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
    for (const r of RUTAS_ESPERADAS) {
      assert.ok(
        xml.includes(`https://byslogistics.com.co${r}`),
        `el sitemap no incluye ${r}`
      );
    }
  });

  test('robots.txt apunta al sitemap del dominio propio', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    assert.match(robots, /byslogistics\.com\.co\/sitemap-index\.xml/);
  });

  test('el manifest lleva el nombre de la empresa', () => {
    const manifest = JSON.parse(
      readFileSync(join(DIST, 'manifest.json'), 'utf8')
    );
    assert.equal(manifest.name, 'B&S Logistics');
    assert.ok(manifest.icons.length > 0);
  });

  test('el favicon no está vacío', () => {
    assert.ok(statSync(join(DIST, 'favicon.ico')).size > 500);
  });
});

describe('metadatos de cada página', () => {
  test('el documento está en español', () => {
    for (const p of pages()) {
      assert.match(p.html, /<html lang="es"/, `${p.route} no declara lang=es`);
    }
  });

  test('cada página tiene título y descripción propios', () => {
    for (const p of pages()) {
      const title = p.html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      assert.ok(title.length > 5, `${p.route} sin <title>`);
      const desc = p.html.match(
        /<meta content="([^"]*)" name="description"/
      )?.[1];
      assert.ok(desc && desc.length > 20, `${p.route} sin descripción`);
    }
  });

  test('cada página declara una URL canónica', () => {
    for (const p of pages()) {
      assert.match(p.html, /rel="canonical"/, `${p.route} sin canonical`);
    }
  });

  test('cada página tiene exactamente un h1', () => {
    // El h1 le dice a buscadores y lectores de pantalla de qué trata la página.
    for (const p of pages()) {
      const count = (p.html.match(/<h1[\s>]/g) ?? []).length;
      assert.equal(count, 1, `${p.route} tiene ${count} h1 (debe tener 1)`);
    }
  });

  test('las páginas de producto llevan datos estructurados', () => {
    const p = pages().find(x => x.route === '/productos/cajas-de-seguridad/');
    assert.match(p.html, /application\/ld\+json/);
  });

  test('la página de FAQ publica sus preguntas como datos estructurados', () => {
    const p = pages().find(x => x.route === '/faq/');
    const json = p.html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    )[1];
    const data = JSON.parse(json);
    assert.equal(data['@type'], 'FAQPage');
    assert.ok(data.mainEntity.length >= 5);
  });
});

describe('enlaces', () => {
  test('ningún enlace interno lleva a una página inexistente', () => {
    const rutas = new Set(pages().map(p => p.route));
    const rotos = [];
    for (const p of pages()) {
      for (const [, href] of p.html.matchAll(/href="(\/[^"#?]*)"/g)) {
        if (
          /\.(css|js|png|jpg|jpeg|avif|webp|svg|ico|xml|txt|json)$/.test(href)
        )
          continue;
        if (href.startsWith('/_astro')) continue;
        const normalizado = href.endsWith('/') ? href : href + '/';
        if (!rutas.has(normalizado) && !rutas.has(href)) {
          rotos.push(`${p.route} → ${href}`);
        }
      }
    }
    assert.deepEqual(rotos, [], 'hay enlaces internos rotos');
  });

  test('no quedan enlaces de relleno', () => {
    for (const p of pages()) {
      assert.ok(
        !/href="#"/.test(p.html),
        `${p.route} tiene un enlace vacío href="#"`
      );
    }
  });

  test('los enlaces externos que abren pestaña llevan rel de seguridad', () => {
    for (const p of pages()) {
      for (const [tag] of p.html.matchAll(/<a[^>]*target="_blank"[^>]*>/g)) {
        assert.match(tag, /rel="[^"]*noopener/, `${p.route}: ${tag}`);
      }
    }
  });
});

describe('formularios', () => {
  test('el de contacto tiene el marcado que Netlify necesita', () => {
    const p = pages().find(x => x.route === '/contacto/');
    const form = p.html.match(/<form[^>]*name="contacto"[^>]*>/)[0];
    assert.match(form, /data-netlify="true"/);
    assert.match(form, /method="POST"/);
    assert.match(form, /data-netlify-honeypot="botcheck"/);
    assert.match(p.html, /name="form-name"[^>]*value="contacto"/);
  });

  test('el de suscripción también, y está en todas las páginas', () => {
    for (const p of pages()) {
      if (p.route === '/404.html' || p.route.endsWith('404.html')) continue;
      if (!p.html.includes('name="suscripcion"')) continue;
      assert.match(p.html, /<form[^>]*name="suscripcion"[^>]*data-netlify/);
    }
  });

  test('el formulario exige autorización de tratamiento de datos', () => {
    const p = pages().find(x => x.route === '/contacto/');
    assert.match(
      p.html,
      /name="autorizacion"[^>]*required|required[^>]*name="autorizacion"/,
      'la casilla de autorización debe ser obligatoria'
    );
    assert.match(p.html, /href="\/politica-de-datos"/);
  });

  test('todos los campos visibles tienen etiqueta asociada', () => {
    const p = pages().find(x => x.route === '/contacto/');
    for (const [, id] of p.html.matchAll(/<input[^>]*id="(hs-[^"]+)"/g)) {
      assert.ok(
        p.html.includes(`for="${id}"`),
        `el campo ${id} no tiene <label for>`
      );
    }
  });
});

describe('catálogo', () => {
  test('publica las 115 referencias del listado', () => {
    const p = pages().find(x => x.route === '/catalogo/');
    // Solo las tarjetas: el atributo también aparece dentro del selector del
    // script de filtrado, y contarlo daría uno de más.
    const count = (p.html.match(/<article[^>]*data-catalog-item/g) ?? [])
      .length;
    assert.equal(count, 115, `se esperaban 115 referencias, hay ${count}`);
  });

  test('cada referencia se puede añadir a la cotización', () => {
    const p = pages().find(x => x.route === '/catalogo/');
    const adds = (p.html.match(/data-quote-add="/g) ?? []).length;
    assert.equal(adds, 115);
  });

  test('los identificadores de referencia no se repiten', () => {
    const p = pages().find(x => x.route === '/catalogo/');
    const ids = [...p.html.matchAll(/data-quote-add="([^"]+)"/g)].map(
      m => m[1]
    );
    assert.equal(new Set(ids).size, ids.length, 'hay ids duplicados');
  });

  test('el buscador indexa sin tildes', () => {
    const p = pages().find(x => x.route === '/catalogo/');
    const search = p.html.match(/data-search="([^"]*holograma[^"]*)"/)?.[1];
    assert.ok(search, 'no se encontró una referencia de holograma');
    assert.doesNotMatch(search, /[áéíóúñ]/, 'data-search debe ir normalizado');
  });

  test('el mapa de contacto está incrustado', () => {
    const p = pages().find(x => x.route === '/contacto/');
    assert.match(p.html, /google\.com\/maps\/embed/);
    assert.match(p.html, /<iframe[^>]*title="/, 'el iframe necesita title');
  });
});
