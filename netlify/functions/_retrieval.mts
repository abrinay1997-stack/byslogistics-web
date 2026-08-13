/**
 * Lógica determinista del asistente: recuperación de hechos, verificación de
 * importes y armado del prompt.
 *
 * Vive fuera del handler para poder probarla sin levantar Netlify ni llamar a
 * ningún modelo (ver tests/chat.test.js). Es justamente la parte que NO puede
 * fallar: si la recuperación trae el hecho equivocado, da igual lo bueno que
 * sea el modelo que redacte.
 */

export interface KbFact {
  id: string;
  topic: string;
  q: string[];
  text: string;
  /**
   * Realce del hecho en la puntuación. 1 por defecto.
   *
   * Lo llevan los hechos de entrada —los que resumen una línea entera de
   * producto—, y existe por un caso concreto: "¿qué precintos manejan?" se
   * reduce a una sola palabra útil, "precintos", que puntúa igual en las once
   * categorías y en el resumen. Sin realce ganaba una categoría cualquiera por
   * ser más corta, y la pregunta más general del sitio se contestaba con el
   * precinto de ancla. Ante una pregunta vaga, el resumen es mejor respuesta
   * que un detalle tomado al azar.
   */
  boost?: number;
}

export interface Kb {
  generatedAt: string;
  site: {
    name: string;
    legalName: string;
    location: string;
    email: string;
    whatsapp: string;
    phone: string;
  };
  /** Importes que el asistente puede repetir. En este sitio va vacía. */
  prices: string[];
  facts: KbFact[];
}

const STOP = new Set(
  (
    'de la que el en y a los del se las por un para con no una su al es lo como mas pero sus le ya o ' +
    'este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos ' +
    'durante ni contra ese eso ante ellos e esto mi antes algunos cual poco ella tiene tienen hacer ' +
    'quiero necesito puedo puede son estan ustedes usted manejan tienes'
  ).split(' ')
);

/** Sin tildes ni signos: "cuánto" y "cuanto" tienen que puntuar igual. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter(t => t.length > 2 && !STOP.has(t));
}

/**
 * Puntúa cada hecho contra la consulta y devuelve los mejores.
 *
 * Las `q` pesan el triple que el cuerpo: son las formas concretas en que
 * sabemos que la gente pregunta por esa cosa. Es recuperación léxica y no
 * vectorial a propósito — con unas decenas de hechos, los embeddings añadirían
 * una dependencia externa, latencia y coste para resolver un problema que este
 * sitio no tiene.
 */
export function retrieve(kb: Kb, query: string, k = 6): KbFact[] {
  const qt = tokens(query);
  if (!qt.length) return kb.facts.slice(0, k);

  const scored = kb.facts.map(fact => {
    const qText = normalize(fact.q.join(' '));
    const body = normalize(fact.text);
    let score = 0;
    for (const t of qt) {
      if (qText.includes(t)) score += 3;
      if (body.includes(t)) score += 1;
    }
    // A igual puntuación gana el hecho más corto: es el más específico. El
    // realce se aplica antes del desempate, que si no lo devora.
    return {
      fact,
      score: score * (fact.boost ?? 1) - fact.text.length / 20000,
    };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => s.fact);
}

/**
 * Importes que aparecen en la respuesta y NO están en la lista blanca del
 * build.
 *
 * Es la única defensa que no depende de que el modelo obedezca el prompt, y en
 * este sitio es la que más trabaja: la lista blanca va vacía porque no
 * publicamos precios, así que cualquier cifra en pesos que el modelo escriba se
 * considera inventada. Un precio inventado por un proveedor no es un error de
 * estilo: es una cotización que el cliente da por buena.
 *
 * Cubre las tres formas en que se escribe dinero aquí: con símbolo ($1.500),
 * con la palabra (1.500 pesos) y con el código (COP 1500). Un importe escrito
 * en letras se le escapa; para eso está la regla 2 del prompt.
 */
export function invalidPrices(reply: string, allowed: string[]): string[] {
  const patrones = [
    /\$\s?[\d.,]+/g,
    /\b\d[\d.,]*\s*(?:pesos|cop|usd|d[oó]lares)\b/gi,
    /\bcop\s*\$?\s?[\d.,]+/gi,
  ];

  const ok = new Set(allowed);
  const encontrados = patrones.flatMap(p => reply.match(p) ?? []);

  return [
    ...new Set(
      encontrados
        .map(f => f.replace(/[^0-9,]/g, ''))
        .filter(n => n && !ok.has(n))
    ),
  ];
}

/**
 * Prompt de sistema. Corto a propósito: los modelos pequeños pierden
 * instrucciones cuando el prompt se alarga, así que aquí solo van las reglas
 * que el código no puede imponer por sí mismo.
 *
 * El trato de usted no es un detalle: es el del resto del sitio, y un
 * asistente que tutea sonaría a pieza pegada de otro lado.
 */
export function buildSystem(kb: Kb, facts: KbFact[]): string {
  const contexto = facts.map(f => `- ${f.text}`).join('\n');
  return `Trabaja en ${kb.site.name} (${kb.site.legalName}), empresa de ${kb.site.location} que distribuye y comercializa elementos de seguridad preventiva: precintos, tulas, cajas y etiquetas de seguridad. Atiende a quien escribe por la página web. Es parte del equipo, no un intermediario que habla de la empresa desde fuera.

REGLAS
1. Responda SOLO con lo que diga el CONTEXTO. Si la respuesta no está ahí, dígalo y ofrezca el correo ${kb.site.email} o el P.B.X. ${kb.site.phone}.
2. NUNCA dé precios, ni exactos ni aproximados ni rangos: no publicamos lista de precios. Si le preguntan cuánto vale algo, explique que se cotiza según referencia, cantidad y personalización, e invite a escribirnos.
3. No invente referencias, plazos de entrega ni características. Copie los datos tal cual aparecen en el CONTEXTO.
4. Escriba entre 2 y 4 frases (unas 40–70 palabras). Dé el dato concreto y añada una frase de contexto útil. Ni respuestas de una línea seca, ni párrafos largos.
5. Trate de USTED. Español de Colombia, cercano pero profesional. No se disculpe ni diga "según el contexto".
6. Hable en primera persona del plural: "manejamos", "le cotizamos", "escríbanos".
   NUNCA en tercera: nada de "ellos", "la empresa" ni "${kb.site.name} ofrece".
7. Cierre ofreciendo el siguiente paso solo cuando encaje de forma natural, no en cada respuesta.

CONTEXTO
${contexto}`;
}

/**
 * Longitud objetivo de una respuesta.
 *
 * Un párrafo corto genera confianza; dos líneas secas parecen un bot y cinco
 * párrafos no se leen. El modelo suele quedarse dentro del rango con la regla
 * 4, pero un recorte duro evita el caso raro en que se desborda.
 */
export const MAX_REPLY_CHARS = 600;

export function trimReply(reply: string): string {
  if (reply.length <= MAX_REPLY_CHARS) return reply;
  // Cortar en el último final de frase para no dejar la idea a medias.
  const cut = reply.slice(0, MAX_REPLY_CHARS);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return (
    lastStop > 220 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + '…'
  ).trim();
}
