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

  // Astro se come el salto de línea que separa una frase del enlace que sigue,
  // y el texto queda pegado: «conforme a laPolítica de Tratamiento…». Se
  // arregla escribiendo {' '} antes del <a>. Este test vigila que no vuelva.
  test('ninguna frase queda pegada al enlace que la sigue', () => {
    const pegados = [];
    for (const p of pages()) {
      for (const [, antes, texto] of p.html.matchAll(
        /([a-záéíóúüñ,;:)])<a\s[^>]*>([^<]{0,40})/gi
      )) {
        pegados.push(`${p.route}: «…${antes}${texto}…»`);
      }
    }
    assert.deepEqual(pegados, [], "falta un {' '} antes del enlace");
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

describe('hero de la home', () => {
  test('la fotografía ocupa el bloque entero', () => {
    const p = pages().find(x => x.route === '/');
    const hero = p.html.match(/<section[^>]*min-h-svh[^>]*>/);
    assert.ok(hero, 'el hero dejó de ocupar el alto de la pantalla');
    // `svh` y no `vh`: en el móvil, `vh` cuenta la barra de direcciones del
    // navegador aunque esté a la vista y el bloque se pasa de largo.
    assert.doesNotMatch(hero[0], /min-h-screen/);

    const foto = p.html.match(/<img[^>]*precinto-tecnologia[^>]*>/)?.[0];
    assert.ok(foto, 'el hero perdió su fotografía');
    // Es la imagen más grande de la primera pantalla: si carga en diferido,
    // el visitante ve el hueco.
    assert.match(foto, /loading="eager"/);
    assert.match(foto, /fetchpriority="high"/);
    // Decorativa: lo que dice ya está en el titular de al lado. El
    // minificador deja `alt` a secas, que es lo mismo que `alt=""`.
    assert.match(foto, /\salt(=""|[\s>])/);
  });

  test('el titular va en blanco sobre la foto', () => {
    const p = pages().find(x => x.route === '/');
    const h1 = p.html.match(/<h1[^>]*>/)[0];
    assert.match(h1, /text-white/, 'el titular del hero no va en blanco');
    // El velo es lo que garantiza el contraste pase lo que pase detrás de
    // cada línea, y eso cambia con el ancho de la pantalla.
    assert.match(p.html, /from-brand-950\/90/, 'el hero perdió su velo');
  });

  test('empieza en el borde superior, sin franja por encima', () => {
    const p = pages().find(x => x.route === '/');
    // La barra va fija y no ocupa sitio; el <main> de la portada no lleva el
    // relleno que sí llevan las demás páginas.
    const main = p.html.match(/<main[^>]*id="main-content"[^>]*>/)[0];
    assert.doesNotMatch(main, /pt-\[4\.75rem\]/);

    const otra = pages().find(x => x.route === '/nosotros/');
    assert.match(
      otra.html.match(/<main[^>]*id="main-content"[^>]*>/)[0],
      /pt-\[4\.75rem\]/,
      'las páginas sin hero a sangre deben separar el contenido de la barra'
    );
  });

  test('la señal de "sigue hacia abajo" lleva a una sección que existe', () => {
    const p = pages().find(x => x.route === '/');
    const destino = p.html.match(
      /href="#([a-z-]+)"[^>]*>\s*<span[^>]*>Nuestras/
    )?.[1];
    assert.ok(destino, 'el hero perdió la señal de continuar');
    assert.match(
      p.html,
      new RegExp(`id="${destino}"`),
      `no existe #${destino}`
    );
  });
});

describe('asistente del sitio', () => {
  test('la base de conocimiento se publica con el build', () => {
    const kb = JSON.parse(readFileSync(join(DIST, 'kb.json'), 'utf8'));
    assert.ok(kb.facts.length > 20, 'la base de conocimiento quedó corta');
    assert.equal(kb.site.name, 'B&S Logistics');
    // Sin precios publicados: la lista blanca vacía es lo que hace que
    // cualquier importe del modelo se bloquee.
    assert.deepEqual(kb.prices, []);
  });

  test('la burbuja está en todas las páginas', () => {
    for (const p of pages()) {
      assert.match(
        p.html,
        /data-chat-toggle/,
        `${p.route} no lleva la burbuja`
      );
    }
  });

  test('la burbuja vive abajo a la derecha, donde estaba WhatsApp', () => {
    const css = readdirSync(join(DIST, '_astro'))
      .filter(f => f.endsWith('.css'))
      .map(f => readFileSync(join(DIST, '_astro', f), 'utf8'))
      .join('');
    // Astro le añade su atributo de alcance a cada selector, de ahí el
    // `\[[^\]]*\]` en medio.
    const reglas = css.match(/\.chat(?:\[[^\]]*\])?\{[^}]*\}/g) ?? [];
    assert.ok(
      reglas.length > 0,
      'no se encontró la regla de posición del chat'
    );
    for (const regla of reglas) {
      assert.match(regla, /right:/, 'la burbuja debe anclarse a la derecha');
      assert.doesNotMatch(regla, /left:/);
    }
  });

  test('el rincón de la burbuja quedó libre: no hay otro botón flotante', () => {
    // El de WhatsApp se retiró y el del cotizador subió a la barra. Si vuelve
    // a aparecer un `fixed` en esa esquina, se tapan entre ellos.
    for (const p of pages()) {
      assert.doesNotMatch(
        p.html,
        /<aside[^>]*aria-label="Acciones rápidas de contacto"/,
        `${p.route} conserva los botones flotantes de la derecha`
      );
    }
  });

  test('se puede llegar a WhatsApp desde el primer mensaje', () => {
    // Al quitar el botón flotante, la vía directa con una persona pasa a
    // depender de la burbuja: tiene que estar a la vista al abrirla, no
    // después de preguntar algo.
    const p = pages().find(x => x.route === '/');
    const saludo = p.html.slice(p.html.indexOf('chat-msg is-bot'));
    assert.match(saludo.slice(0, 900), /wa\.me\/573209514930/);
  });

  test('ninguna página filtra una clave del proveedor', () => {
    for (const p of pages()) {
      assert.doesNotMatch(
        p.html,
        /gsk_[A-Za-z0-9]/,
        `${p.route} filtra una clave`
      );
      assert.doesNotMatch(p.html, /sk-ant-/, `${p.route} filtra una clave`);
    }
  });
});
