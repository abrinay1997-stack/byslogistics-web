/**
 * Tests del asistente del sitio.
 *
 * Cubren la parte determinista, que es la que no puede fallar: qué hechos
 * recupera una pregunta, qué importes se bloquean y qué contesta el endpoint
 * cuando el proveedor no responde. El modelo no interviene en ninguno: se
 * sustituye por un doble, porque lo que se prueba aquí es el andamiaje que lo
 * rodea, no su redacción.
 *
 * La base de conocimiento se lee de dist/kb.json, así que requiere `pnpm build`
 * previo — igual que build.test.js y e2e.test.js.
 */
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  retrieve,
  invalidPrices,
  buildSystem,
  trimReply,
  normalize,
  tokens,
  MAX_REPLY_CHARS,
} from '../netlify/functions/_retrieval.mts';
import chatHandler from '../netlify/functions/chat.mts';

const ROOT = new URL('..', import.meta.url).pathname;
const KB_PATH = join(ROOT, 'dist', 'kb.json');

let kb;

before(() => {
  assert.ok(
    existsSync(KB_PATH),
    'no existe dist/kb.json: ejecuta `pnpm build` antes de estos tests'
  );
  kb = JSON.parse(readFileSync(KB_PATH, 'utf8'));
});

describe('base de conocimiento', () => {
  test('trae los datos del sitio y una lista de precios vacía', () => {
    assert.equal(kb.site.name, 'B&S Logistics');
    assert.match(kb.site.email, /@/);
    // Vacía a propósito: el sitio no publica precios, así que cualquier
    // importe que escriba el modelo se considera inventado.
    assert.deepEqual(kb.prices, []);
  });

  test('cada hecho es atómico: id único, formas de preguntar y respuesta', () => {
    assert.ok(kb.facts.length > 20, 'la base quedó demasiado corta');
    const ids = new Set();
    for (const fact of kb.facts) {
      assert.ok(!ids.has(fact.id), `id repetido: ${fact.id}`);
      ids.add(fact.id);
      assert.ok(
        fact.q.length > 0,
        `${fact.id} no dice cómo se pregunta por él`
      );
      assert.ok(
        fact.text.length > 40,
        `${fact.id} tiene un texto demasiado corto`
      );
    }
  });

  test('ningún hecho publica un precio', () => {
    for (const fact of kb.facts) {
      assert.deepEqual(
        invalidPrices(fact.text, kb.prices),
        [],
        `${fact.id} trae un importe, y este sitio no publica precios`
      );
    }
  });

  test('los datos de contacto salen de constants.ts, no copiados a mano', () => {
    const contacto = kb.facts.find(f => f.id === 'contacto');
    assert.ok(contacto.text.includes(kb.site.email));
    assert.ok(contacto.text.includes('469 9575'));
  });
});

describe('recuperación', () => {
  /**
   * Las preguntas reales, con el hecho que TIENE que salir primero. Es la
   * prueba que de verdad protege al asistente: si aquí sale el hecho
   * equivocado, da igual lo bueno que sea el modelo que redacte después.
   */
  const casos = [
    ['¿Cuánto cuesta un precinto?', 'precios'],
    ['¿Cuál es el precio del millar?', 'precios'],
    ['¿Qué precintos manejan?', 'categorias-precintos'],
    ['¿Tienen precintos de guaya?', 'precinto-precintos-de-guaya'],
    ['¿Atienden en Panamá?', 'cobertura'],
    ['¿Cuál es el teléfono?', 'contacto'],
    ['¿Sirve para carrotanques?', 'sector-combustibles-e-hidrocarburos'],
    // Desde que existen las guías de uso, una pregunta planteada como el
    // problema —y no como el producto— recupera la guía antes que la ficha
    // del sector, que es exactamente para lo que se escribieron.
    [
      'Necesito asegurar la puerta de un contenedor',
      'guia-precintos-para-contenedores',
    ],
    [
      '¿Se moja la carga dentro del contenedor?',
      'guia-embalaje-y-proteccion-de-carga-faq-3',
    ],
    ['¿Desde cuándo existe la empresa?', 'quienes-somos'],
  ];

  for (const [pregunta, esperado] of casos) {
    test(`"${pregunta}" recupera ${esperado}`, () => {
      const facts = retrieve(kb, pregunta);
      assert.ok(facts.length > 0, 'no recuperó ningún hecho');
      assert.equal(
        facts[0].id,
        esperado,
        `salió ${facts.map(f => f.id).join(', ')}`
      );
    });
  }

  /*
   * El documento de preguntas frecuentes de las dueñas, leído como lo leería un
   * cliente. Estas son las preguntas que antes caían en un hecho cualquiera
   * porque nadie las había escrito en la base: si vuelven a fallar, el
   * asistente contesta otra cosa sin que se note en ninguna página.
   */
  const casosDelDocumento = [
    [
      '¿Por qué son importantes los precintos en la cadena de suministro?',
      'cadena-de-suministro-por-que-importan',
    ],
    [
      '¿Qué beneficios tienen los precintos de seguridad numerados?',
      'precintos-numerados-beneficios',
    ],
    ['¿Qué industrias utilizan precintos?', 'industrias-que-usan-precintos'],
    [
      '¿Qué tipo de precinto ofrece mayor nivel de seguridad?',
      'tipos-de-precinto-por-material',
    ],
    [
      '¿Qué precintos utilizan las empresas de transporte de carga?',
      'precintos-en-transporte-de-carga',
    ],
    [
      '¿Cuál es el mejor proveedor de precintos de seguridad en Colombia?',
      'elegir-proveedor',
    ],
    [
      '¿Qué empresa vende precintos de seguridad al por mayor en Colombia?',
      'suministro-por-volumen',
    ],
    ['¿Dónde comprar precintos de seguridad en Colombia?', 'cobertura'],
    [
      '¿Cómo funcionan los precintos de seguridad en logística y transporte?',
      'como-funciona-el-precintado',
    ],
  ];

  for (const [pregunta, esperado] of casosDelDocumento) {
    test(`"${pregunta}" recupera ${esperado}`, () => {
      const facts = retrieve(kb, pregunta);
      assert.equal(
        facts[0]?.id,
        esperado,
        `salió ${facts.map(f => f.id).join(', ')}`
      );
    });
  }

  /*
   * Preguntas que legítimamente tocan dos hechos a la vez: quien pregunta
   * "¿venden bolsas para traslado de valores?" se conforma igual con la ficha
   * de las tulas o con la del sector financiero. Aquí se exige que el hecho
   * esté entre los primeros, no que gane: al modelo se le pasan los seis, y
   * fijar un orden entre dos respuestas buenas sería un test que se rompe cada
   * vez que se agrega contenido, sin que nada haya empeorado.
   */
  const casosAmbiguos = [
    [
      '¿Venden bolsas para traslado de valores?',
      'familia-tulas-y-bolsas-de-seguridad',
    ],
    ['Quiero cotizar 5.000 unidades', 'como-cotizar'],
    ['¿Cómo hago un pedido?', 'como-cotizar'],
    // La respuesta a la personalización está dos veces y bien: en el hecho
    // general y en la pregunta frecuente de la guía de contenedores.
    ['¿Se les puede poner el logo de mi empresa?', 'personalizacion'],
    /*
     * "¿Qué tipos de precintos existen?" tiene dos respuestas buenas y
     * distintas: el resumen de las once categorías del catálogo —que es el que
     * gana, y debe ganar, por el realce— y la clasificación por material
     * (plástico, metálico, guaya, botella, electrónico) que enseñan las dueñas.
     * Al modelo le llegan las dos.
     */
    ['¿Qué tipos de precintos existen?', 'tipos-de-precinto-por-material'],
  ];

  for (const [pregunta, esperado] of casosAmbiguos) {
    test(`"${pregunta}" trae ${esperado} entre los tres primeros`, () => {
      const ids = retrieve(kb, pregunta)
        .slice(0, 3)
        .map(f => f.id);
      assert.ok(ids.includes(esperado), `salió ${ids.join(', ')}`);
    });
  }

  test('una consulta sin palabras útiles no se queda sin contexto', () => {
    const facts = retrieve(kb, 'y de la que');
    assert.ok(facts.length > 0);
  });

  test('las tildes no cambian el resultado', () => {
    assert.deepEqual(
      retrieve(kb, 'cuánto cuesta').map(f => f.id),
      retrieve(kb, 'cuanto cuesta').map(f => f.id)
    );
  });

  test('normalize y tokens quitan tildes, signos y palabras vacías', () => {
    assert.equal(normalize('¿Cuánto CUESTA?'), 'cuanto cuesta');
    assert.deepEqual(tokens('¿Cuánto cuesta el precinto de guaya?'), [
      'cuanto',
      'cuesta',
      'precinto',
      'guaya',
    ]);
  });
});

describe('barandilla de precios', () => {
  const bloqueados = [
    'Cada precinto vale $1.500.',
    'El millar sale en 950.000 pesos.',
    'Le queda en COP 2500 la unidad.',
    'Son 40 dólares el paquete.',
  ];

  for (const reply of bloqueados) {
    test(`bloquea "${reply}"`, () => {
      assert.ok(invalidPrices(reply, kb.prices).length > 0);
    });
  }

  test('no confunde medidas ni cantidades con dinero', () => {
    assert.deepEqual(
      invalidPrices(
        'Manejamos 11 categorías, y la guaya viene en 40, 60 y 120 cms.',
        kb.prices
      ),
      []
    );
  });

  test('respeta la lista blanca cuando la hay', () => {
    assert.deepEqual(invalidPrices('Cuesta $850', ['850']), []);
  });
});

describe('prompt de sistema', () => {
  test('impone el trato de usted y la prohibición de dar precios', () => {
    const system = buildSystem(kb, retrieve(kb, 'cuánto cuesta'));
    assert.match(system, /Trate de USTED/);
    assert.match(system, /NUNCA dé precios/);
    assert.ok(system.includes(kb.site.email));
    assert.ok(system.includes('CONTEXTO'));
  });

  test('el contexto que se le pasa al modelo son los hechos recuperados', () => {
    const facts = retrieve(kb, 'precintos de guaya');
    const system = buildSystem(kb, facts);
    for (const fact of facts) assert.ok(system.includes(fact.text));
  });
});

describe('recorte de la respuesta', () => {
  test('deja pasar lo que ya es corto', () => {
    assert.equal(trimReply('Dos frases. Y ya.'), 'Dos frases. Y ya.');
  });

  test('corta en el final de frase, no a mitad de idea', () => {
    const largo = 'Frase de relleno con suficiente cuerpo. '.repeat(40);
    const out = trimReply(largo);
    assert.ok(out.length <= MAX_REPLY_CHARS);
    assert.match(out, /\.$/);
  });
});

/* ------------------------------------------------------------------ *
 * El endpoint entero, con el proveedor sustituido por un doble
 * ------------------------------------------------------------------ */

describe('endpoint /api/chat', () => {
  const ORIGEN = 'https://byslogistics.com.co';
  const fetchReal = globalThis.fetch;
  let respuestaDelModelo;

  /** Petición como la que manda el widget. */
  const pedir = (mensaje, extraHeaders = {}) =>
    chatHandler(
      new Request(`${ORIGEN}/api/chat`, {
        method: 'POST',
        headers: {
          origin: ORIGEN,
          'content-type': 'application/json',
          ...extraHeaders,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: mensaje }],
        }),
      }),
      { ip: `1.2.3.${Math.random()}` }
    );

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'clave-de-prueba';
    delete process.env.ANTHROPIC_API_KEY;
    respuestaDelModelo = 'Manejamos once categorías de precintos.';

    // El doble sirve kb.json desde el build y responde por el proveedor, así
    // que ningún test sale a la red.
    globalThis.fetch = async url => {
      const href = String(url);
      if (href.endsWith('/kb.json')) {
        return new Response(readFileSync(KB_PATH, 'utf8'), { status: 200 });
      }
      if (href.includes('groq.com')) {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: respuestaDelModelo } }],
          }),
          { status: 200 }
        );
      }
      throw new Error(`llamada inesperada a ${href}`);
    };
  });

  after(() => {
    globalThis.fetch = fetchReal;
    delete process.env.GROQ_API_KEY;
  });

  test('responde y declara de qué hechos salió la respuesta', async () => {
    const data = await (await pedir('¿qué precintos manejan?')).json();
    assert.equal(data.reply, 'Manejamos once categorías de precintos.');
    assert.ok(data.sources.includes('categorias-precintos'));
  });

  test('un precio inventado no llega a pantalla', async () => {
    respuestaDelModelo = 'Cada precinto le queda en $1.200 la unidad.';
    const data = await (await pedir('¿cuánto vale?')).json();
    assert.ok(!data.reply.includes('1.200'));
    assert.deepEqual(data.blocked, ['1200']);
    assert.match(data.reply, /cotización/i);
  });

  test('sin clave configurada deriva a una persona, no falla', async () => {
    delete process.env.GROQ_API_KEY;
    const data = await (await pedir('hola')).json();
    assert.equal(data.degraded, true);
    assert.ok(data.reply.includes(kb.site.email));
  });

  test('si el proveedor se cae, deriva a una persona y deja el motivo', async () => {
    globalThis.fetch = async url => {
      const href = String(url);
      if (href.endsWith('/kb.json')) {
        return new Response(readFileSync(KB_PATH, 'utf8'), { status: 200 });
      }
      return new Response('sin cuota', { status: 429 });
    };
    const data = await (await pedir('hola')).json();
    assert.equal(data.degraded, true);
    assert.equal(data.code, 'groq_http_429');
    assert.ok(data.reply.includes(kb.site.email));
  });

  /*
   * La caída de agosto de 2026: Groq retiró el modelo que tenía puesto el
   * asistente y contestó 400 a cada mensaje. Con un solo nombre de modelo eso
   * tumbaba el chat entero; con la lista de relevo, el visitante ni se entera.
   */
  test('un modelo retirado no tumba el chat: pasa al siguiente', async () => {
    const pedidos = [];
    globalThis.fetch = async (url, init) => {
      const href = String(url);
      if (href.endsWith('/kb.json')) {
        return new Response(readFileSync(KB_PATH, 'utf8'), { status: 200 });
      }
      const { model } = JSON.parse(init.body);
      pedidos.push(model);
      // El primero de la lista responde como responde un modelo dado de baja.
      if (pedidos.length === 1) {
        return new Response(
          JSON.stringify({ error: { code: 'model_decommissioned' } }),
          { status: 400 }
        );
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Aquí estamos.' } }],
        }),
        { status: 200 }
      );
    };

    const data = await (await pedir('hola')).json();
    assert.equal(data.reply, 'Aquí estamos.');
    assert.ok(!data.degraded);
    assert.equal(pedidos.length, 2, `probó ${pedidos.join(', ')}`);
    assert.notEqual(pedidos[0], pedidos[1]);
  });

  test('una cuota agotada no gasta llamadas probando otros modelos', async () => {
    let llamadas = 0;
    globalThis.fetch = async url => {
      const href = String(url);
      if (href.endsWith('/kb.json')) {
        return new Response(readFileSync(KB_PATH, 'utf8'), { status: 200 });
      }
      llamadas += 1;
      return new Response('sin cuota', { status: 429 });
    };

    const data = await (await pedir('hola')).json();
    assert.equal(data.code, 'groq_http_429');
    assert.equal(llamadas, 1, 'un 429 habla de la cuota, no del modelo');
  });

  test('GROQ_MODEL se prueba primero, pero la lista sigue de relevo', async () => {
    process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';
    const pedidos = [];
    globalThis.fetch = async (url, init) => {
      const href = String(url);
      if (href.endsWith('/kb.json')) {
        return new Response(readFileSync(KB_PATH, 'utf8'), { status: 200 });
      }
      pedidos.push(JSON.parse(init.body).model);
      if (pedidos.length === 1)
        return new Response('retirado', { status: 400 });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Aquí estamos.' } }],
        }),
        { status: 200 }
      );
    };

    try {
      const data = await (await pedir('hola')).json();
      assert.equal(pedidos[0], 'llama-3.3-70b-versatile');
      assert.equal(data.reply, 'Aquí estamos.');
    } finally {
      delete process.env.GROQ_MODEL;
    }
  });

  test('rechaza lo que no venga del propio sitio', async () => {
    const res = await chatHandler(
      new Request(`${ORIGEN}/api/chat`, {
        method: 'POST',
        headers: { origin: 'https://otro-sitio.com' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
      }),
      {}
    );
    assert.equal(res.status, 403);
  });

  test('rechaza los métodos que no son POST', async () => {
    const res = await chatHandler(
      new Request(`${ORIGEN}/api/chat`, { headers: { origin: ORIGEN } }),
      {}
    );
    assert.equal(res.status, 405);
  });

  test('corta a quien dispara mensajes en ráfaga', async () => {
    const req = () =>
      chatHandler(
        new Request(`${ORIGEN}/api/chat`, {
          method: 'POST',
          headers: { origin: ORIGEN, 'content-type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'hola' }],
          }),
        }),
        { ip: 'ip-en-rafaga' }
      );

    let ultimo;
    for (let i = 0; i < 14; i++) ultimo = await req();
    assert.equal(ultimo.status, 429);
  });

  test('se publica en /api/chat', async () => {
    const { config } = await import('../netlify/functions/chat.mts');
    assert.equal(config.path, '/api/chat');
  });
});
