import {
  retrieve,
  invalidPrices,
  buildSystem,
  stripReasoning,
  trimReply,
  type Kb,
} from './_retrieval.mts';

/**
 * Endpoint del asistente de B&S Logistics. Se publica en /api/chat.
 *
 * PREMISA DE DISEÑO: el modelo es la parte menos fiable del sistema, así que se
 * le da el trabajo más pequeño posible. No busca, no calcula y no recuerda:
 * solo redacta a partir de hechos que le ponemos delante ya resueltos.
 *
 * Reparto de responsabilidades:
 *
 *   Recuperación  → código (léxica sobre kb.json, determinista)
 *   Datos         → código (vienen del build, del mismo sitio)
 *   Precios       → NO se dan; se derivan al equipo comercial
 *   Verificación  → código (cualquier importe se bloquea, post-respuesta)
 *   Redacción     → modelo
 *
 * Con este reparto un modelo pequeño y barato responde igual de bien que uno
 * grande, porque lo único que aporta es el lenguaje. Y lo más importante: el
 * bloqueo de precios NO depende de que el modelo obedezca el prompt.
 *
 * Los tipos de Netlify se declaran aquí en lugar de importar
 * `@netlify/functions`: es lo único que se usaría del paquete, y a cambio el
 * proyecto no suma una dependencia (ni un candado que mantener) para dos
 * interfaces de cuatro líneas.
 */

interface NetlifyContext {
  ip?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* ------------------------------------------------------------------ *
 * Base de conocimiento
 * ------------------------------------------------------------------ */

let kbCache: { kb: Kb; at: number } | null = null;
const KB_TTL_MS = 10 * 60 * 1000;

async function loadKb(origin: string): Promise<Kb> {
  if (kbCache && Date.now() - kbCache.at < KB_TTL_MS) return kbCache.kb;
  const res = await fetch(`${origin}/kb.json`);
  if (!res.ok) throw new Error(`kb.json devolvió ${res.status}`);
  const kb = (await res.json()) as Kb;
  kbCache = { kb, at: Date.now() };
  return kb;
}

/* ------------------------------------------------------------------ *
 * Proveedor
 * ------------------------------------------------------------------ */

interface Provider {
  name: string;
  url: string;
  headers: Record<string, string>;
  /**
   * Modelos a probar, en orden. Ver `MODELOS_GROQ` para el porqué de que sea
   * una lista y no un nombre.
   */
  models: string[];
  body: (model: string, system: string, msgs: ChatMessage[]) => unknown;
  extract: (json: any) => string;
}

/**
 * Modelos de Groq, en orden de preferencia.
 *
 * ES UNA LISTA POR UNA CAÍDA REAL. El asistente estuvo en producción apuntando
 * a `llama-3.3-70b-versatile`, que Groq retiró el 16 de agosto de 2026. Desde
 * ese día la API contestó 400 a cada mensaje y el chat respondió "se nos cayó
 * la conexión" a todo el mundo, con el sitio entero intacto y una sola cadena
 * de texto mal. Un proveedor puede jubilar un modelo con un correo de aviso
 * que nadie lee a tiempo; lo que no puede es tumbar el chat mientras tanto.
 *
 * Así que el nombre del modelo deja de ser un dato único y pasa a ser una
 * lista con relevo: si el primero contesta que no existe o que está retirado,
 * se prueba el siguiente. Los dos de aquí son los que el propio Groq recomendó
 * como reemplazo del Llama al anunciar la baja.
 *
 * Al agregar uno nuevo, va PRIMERO y los anteriores se quedan detrás: el día
 * que se retire el de arriba, el chat sigue contestando solo.
 */
const MODELOS_GROQ = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];

const MODELOS_ANTHROPIC = ['claude-haiku-4-5-20251001'];

/**
 * Tope de tokens por respuesta.
 *
 * Holgado para lo que se pide —el recorte deja 600 caracteres, unos 150
 * tokens— porque los modelos que razonan gastan el presupuesto PENSANDO antes
 * de escribir. Con el tope justo se quedaban sin espacio a mitad del
 * razonamiento y llegaba una respuesta que empezaba a pensar y no contestaba
 * nada. Lo que se paga de más son tokens de razonamiento que nadie ve; lo que
 * se ahorraba con el tope corto era la respuesta entera.
 */
const MAX_TOKENS = 900;

/** Quita vacíos y repetidos conservando el orden. */
const lista = (...xs: (string | undefined)[]): string[] => [
  ...new Set(xs.filter((x): x is string => Boolean(x))),
];

/**
 * Códigos con los que un proveedor dice "ese modelo no" —no existe, se retiró,
 * no está habilitado para esta clave—, que son los que se curan probando el
 * siguiente de la lista. Un 429 o un 500 hablan de la cuota o del servicio, no
 * del modelo: ahí reintentar con otro nombre solo gasta tiempo y cuota.
 */
const esProblemaDelModelo = (status: number) =>
  status === 400 || status === 404;

/**
 * Los proveedores configurados, en orden de preferencia: Groq primero, que es
 * el que está puesto en producción, y Anthropic como repuesto si algún día se
 * configura su clave.
 *
 * Devuelve una LISTA y no uno solo a propósito: con dos claves presentes y una
 * inservible, elegir una y quedarse con ella hace que el chat conteste "se nos
 * cayó la conexión" a todo el mundo mientras la clave buena no se llega a
 * mirar. Un repuesto que no entra a jugar no es un repuesto.
 */
function pickProviders(): Provider[] {
  const groq = process.env.GROQ_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;

  /*
   * CHAT_MODEL solo manda cuando hay una sola clave configurada. Con dos, el
   * mismo nombre de modelo no existe en las dos APIs, así que aplicarlo a
   * ambas garantizaría romper la de repuesto justo cuando hace falta. Para
   * fijar el modelo de un proveedor concreto están GROQ_MODEL y
   * ANTHROPIC_MODEL.
   */
  const generico =
    [groq, anthropic].filter(Boolean).length === 1
      ? process.env.CHAT_MODEL
      : undefined;

  const out: Provider[] = [];

  if (groq) {
    out.push({
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${groq}`,
      },
      models: lista(process.env.GROQ_MODEL, generico, ...MODELOS_GROQ),
      body: (model, system, msgs) => ({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        messages: [{ role: 'system', content: system }, ...msgs],
      }),
      extract: j => j?.choices?.[0]?.message?.content ?? '',
    });
  }

  if (anthropic) {
    out.push({
      name: 'anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropic,
        'anthropic-version': '2023-06-01',
      },
      models: lista(
        process.env.ANTHROPIC_MODEL,
        generico,
        ...MODELOS_ANTHROPIC
      ),
      body: (model, system, msgs) => ({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        system,
        messages: msgs,
      }),
      extract: j => j?.content?.[0]?.text ?? '',
    });
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Quién puede llamar
 * ------------------------------------------------------------------ */

/**
 * Solo se atiende lo que venga del propio sitio.
 *
 * Cada llamada gasta cuota de la clave, así que sin esto cualquiera puede
 * apuntar un script contra /api/chat y facturarnos sus conversaciones. Se
 * compara contra el origen de la petición —no contra una lista fija— para que
 * las previews de Netlify, que viven en otro subdominio, sigan funcionando sin
 * mantener nada.
 *
 * Un `Origin` se puede falsificar con curl: esto no es autenticación, es quitar
 * de en medio el abuso barato. Lo que acota el gasto de verdad es el tope
 * diario de más abajo.
 */
function allowedOrigin(req: Request): boolean {
  const self = new URL(req.url).origin;
  const origin = req.headers.get('origin');
  if (origin) return origin === self;

  // Sin Origin (algunos navegadores en same-origin) miramos el Referer.
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === self;
    } catch {
      return false;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Límites de uso (aproximados, por instancia)
 * ------------------------------------------------------------------ */

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  prev.push(now);
  hits.set(ip, prev);
  if (hits.size > 500) hits.clear(); // no dejamos crecer el mapa sin límite
  return prev.length > MAX_PER_WINDOW;
}

/**
 * Techo de mensajes al día para todo el sitio, no por visitante: es el único
 * límite que pone una cifra máxima a la factura del mes.
 *
 * Vive en memoria y cada instancia lleva su propia cuenta, así que Netlify
 * levantando varias lo multiplica. Es aproximado a propósito: un contador
 * compartido pide almacenamiento externo y una llamada de red en cada mensaje,
 * para proteger un endpoint que hoy responde preguntas sobre precintos.
 */
const MAX_PER_DAY = Number(process.env.CHAT_MAX_PER_DAY || 300);
let day = '';
let dayCount = 0;

function dailyCapReached(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  dayCount += 1;
  return dayCount > MAX_PER_DAY;
}

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default async (req: Request, context: NetlifyContext) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  if (!allowedOrigin(req)) return json({ error: 'Origen no permitido' }, 403);

  const ip =
    context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  if (rateLimited(ip)) {
    return json(
      { reply: 'Va muy rápido. Espere un momento y vuelva a preguntar.' },
      429
    );
  }

  let messages: ChatMessage[];
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    messages = (body.messages ?? [])
      .filter(
        m =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }))
      .slice(-6); // memoria corta a propósito: cada turno se re-recupera
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser?.content.trim())
    return json({ error: 'Falta el mensaje' }, 400);

  const origin = new URL(req.url).origin;

  let kb: Kb;
  try {
    kb = await loadKb(origin);
  } catch {
    return json({
      reply:
        'En este momento no puedo consultar los datos del catálogo. Escríbanos por WhatsApp o al correo y le respondemos directamente.',
      degraded: true,
    });
  }

  // Sin clave configurada el asistente no se cae: deriva a una persona.
  const proveedores = pickProviders();
  if (proveedores.length === 0) {
    /*
     * Qué variables VE la función, que no es lo mismo que las que hay escritas
     * en el panel: pueden estar fuera del contexto de despliegue, sin marcar
     * para funciones, o no haberse redesplegado desde que se crearon. Se
     * registra solo la presencia, NUNCA el valor: un campo donde cabe un
     * secreto acaba conteniendo un secreto.
     */
    console.error(
      `[chat] ningún proveedor disponible. ` +
        `GROQ_API_KEY ${process.env.GROQ_API_KEY ? 'presente' : 'ausente'}; ` +
        `ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? 'presente' : 'ausente'}`
    );
    return json({
      reply: `El asistente todavía no está conectado. Escríbanos al ${kb.site.email} o al P.B.X. ${kb.site.phone} y le atendemos directamente.`,
      degraded: true,
    });
  }

  // Techo del día alcanzado: se deriva a una persona, no se devuelve un error.
  if (dailyCapReached()) {
    return json({
      reply: `El asistente ya no atiende más consultas por hoy. Escríbanos al ${kb.site.email} o al P.B.X. ${kb.site.phone} y le respondemos directamente.`,
      degraded: true,
    });
  }

  const facts = retrieve(kb, lastUser.content);
  const system = buildSystem(kb, facts);

  let reply = '';
  let fallo = 'sin_proveedores';

  /*
   * Se prueban en orden —cada proveedor con sus modelos— y se sale con el
   * primero que conteste. Con una sola clave y el modelo de cabecera vivo, esto
   * es una única llamada, igual que siempre: el relevo solo entra a jugar
   * cuando el de arriba dice que no.
   */
  for (const provider of proveedores) {
    for (const model of provider.models) {
      try {
        const res = await fetch(provider.url, {
          method: 'POST',
          headers: provider.headers,
          body: JSON.stringify(provider.body(model, system, messages)),
          signal: AbortSignal.timeout(20_000),
        });

        if (!res.ok) {
          /*
           * El motivo real vive aquí y en ningún otro sitio: una clave mal
           * pegada, una cuota agotada y un modelo retirado dan los tres el
           * mismo "se nos cayó la conexión" en pantalla. Va al registro de la
           * función (Netlify → Functions → chat), que solo ve quien administra
           * el sitio; al visitante nunca se le enseña el error del proveedor.
           *
           * El nombre del modelo va en la línea a propósito: es el dato que
           * dice si hay que actualizar la lista o revisar la clave.
           */
          const detalle = (await res.text().catch(() => '')).slice(0, 500);
          console.error(
            `[chat] ${provider.name} (${model}) devolvió ${res.status}: ${detalle}`
          );
          fallo = `${provider.name}_http_${res.status}`;
          if (esProblemaDelModelo(res.status)) continue;
          break;
        }

        reply = trimReply(stripReasoning(provider.extract(await res.json())));
        if (reply) break;

        console.error(`[chat] ${provider.name} (${model}) respondió vacío`);
        fallo = `${provider.name}_vacio`;
      } catch (err) {
        console.error(
          `[chat] fallo llamando a ${provider.name} (${model}):`,
          err
        );
        fallo = `${provider.name}_network`;
        break;
      }
    }
    if (reply) break;
  }

  if (!reply) {
    return json({
      reply: `Se nos cayó la conexión. Escríbanos al ${kb.site.email} o al P.B.X. ${kb.site.phone} y le respondemos al momento.`,
      degraded: true,
      // Solo el código, nunca el cuerpo del error: sirve para diagnosticar
      // desde las herramientas del navegador sin publicar nada del proveedor.
      code: fallo,
    });
  }

  // Barandilla: este sitio no publica precios, así que cualquier importe que
  // aparezca en la respuesta salió del modelo y no de nuestros datos.
  const bad = invalidPrices(reply, kb.prices);
  if (bad.length) {
    return json({
      reply:
        'Prefiero no darle una cifra de memoria: los precios dependen de la referencia, la cantidad y la ' +
        `personalización. Escríbanos al ${kb.site.email} con lo que necesita y le enviamos la cotización.`,
      blocked: bad,
    });
  }

  return json({ reply, sources: facts.map(f => f.id) });
};

export const config = { path: '/api/chat' };
