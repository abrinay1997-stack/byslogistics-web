# Sitio web de B&S Logistics

Sitio de **Business & Supplies Logistics**, distribuidor de elementos de
seguridad preventiva: precintos, etiquetas y cintas, tulas y bolsas, cajas de
seguridad, embalaje protector y rastreo satelital.

Construido con [Astro](https://astro.build) y [Tailwind CSS](https://tailwindcss.com)
sobre la plantilla ScrewFast, y adaptado por completo al contenido, la marca y
los colores de la empresa.

- **Producción:** https://byslogistics.com.co
- **Hosting:** Netlify (configuración en `netlify.toml`)

---

## Puesta en marcha

Requiere Node 22 y pnpm (la versión exacta está fijada en `packageManager`).

```bash
pnpm install
pnpm dev          # servidor de desarrollo en localhost:4321
pnpm build        # comprueba tipos y genera dist/
pnpm preview      # sirve dist/ como en producción
```

---

## Estructura

```
src/
├── assets/
│   ├── scripts/
│   │   ├── contactForms.js   Envío de formularios (Netlify Forms)
│   │   ├── quoteCart.js      Cotizador: carrito + mensaje de WhatsApp
│   │   └── lenisSmoothScroll.js
│   └── styles/global.css     Tema de Tailwind. Aquí vive la paleta de marca
├── components/
│   ├── BrandLogo.astro       Logo oficial
│   ├── ChatWidget.astro      Burbuja del asistente (abajo a la izquierda)
│   ├── QuoteCart.astro       Botones flotantes y panel del cotizador
│   ├── sections/             Bloques grandes de página
│   └── ui/                   Piezas reutilizables
├── content/
│   ├── soluciones/           Las 6 familias de producto (un .md cada una)
│   └── precintos/            Las 11 categorías de precintos
├── data_files/
│   ├── constants.ts          Datos de la empresa: contacto, SEO, formularios
│   ├── empresa.ts            Reseña de /nosotros y sectores de /usos
│   └── faqs.json             Preguntas frecuentes
├── images/
│   ├── brand/                Logo y colores (ver su README)
│   ├── backgrounds/          Fondos laterales de sección
│   └── productos/            Fotos del catálogo
├── pages/                    Una página por ruta
│   └── kb.json.ts            Base de conocimiento del asistente (se genera
│                             en el build desde los datos de arriba)
└── utils/
    ├── catalog.ts            Aplana las colecciones para el catálogo
    ├── navigation.ts         Menú, pie de página y redes sociales
    └── text.ts               Normalización de texto (búsqueda sin tildes)

netlify/functions/
├── chat.mts                  Endpoint del asistente, publicado en /api/chat
└── _retrieval.mts            Recuperación, prompt y bloqueo de precios
```

### Páginas

| Ruta                     | Contenido                                       |
| ------------------------ | ----------------------------------------------- |
| `/`                      | Portada: propuesta, soluciones, testimonio, CTA |
| `/catalogo`              | Las 115 referencias con filtros y buscador      |
| `/precintos`             | Índice de las 11 categorías de precintos        |
| `/precintos/<categoría>` | Referencias de una categoría                    |
| `/productos`             | Índice de las 6 familias                        |
| `/productos/<familia>`   | Familia con sus referencias agrupadas           |
| `/usos`                  | Sectores atendidos                              |
| `/nosotros`              | Historia de la empresa                          |
| `/faq`                   | Preguntas frecuentes                            |
| `/contacto`              | Formulario, teléfonos y mapa                    |
| `/politica-de-datos`     | Tratamiento de datos personales                 |

---

## Tareas frecuentes

### Agregar una referencia al catálogo

Los productos viven en Markdown, no en código. Para agregar una referencia a
una categoría de precintos, edita el archivo correspondiente en
`src/content/precintos/` y añade una entrada bajo `products`:

```yaml
products:
  - name: 'Precinto Botella BS-03'
    code: 'BS-03' # opcional
    description: 'Cuerpo metálico reforzado.' # opcional
```

Para las demás familias, la lista está agrupada por subtipo en
`src/content/soluciones/`:

```yaml
groups:
  - name: 'Etiquetas VOID'
    products:
      - name: 'Etiqueta VOID 5 x 3 cms'
```

La referencia aparece sola en la página de su categoría, en el catálogo con
filtros y en el cotizador. **No se publican precios**: el listado de la empresa
es administrativo y solo se traslada nombre y categoría.

### Agregar una categoría o una familia

Crea un archivo nuevo en `src/content/precintos/` o `src/content/soluciones/`.
El esquema de campos obligatorios está en `src/content.config.ts`. Recuerda dar
un `order` que no choque con los existentes: hay un test que lo comprueba.

### Cambiar los colores de la marca

Están en un solo sitio: la rampa `--color-brand-*` del bloque `@theme` en
`src/assets/styles/global.css`. Todos los componentes usan clases `brand-*`, así
que cambiar esos once valores cambia el sitio entero. El azul actual (`#0060A8`)
sale del logo.

### Cambiar teléfonos, correo o WhatsApp

En `src/data_files/constants.ts`, objeto `CONTACT`. De ahí lo leen el pie de
página, la página de contacto, el cotizador, la política de datos y los datos
estructurados.

### Agregar fotografías

Las fotos del catálogo van en `src/images/productos/` y se referencian con su
ruta relativa desde el `.md`, en `cardImage` (familias y categorías) o `image`
(referencias individuales). Mientras el campo esté vacío la ficha muestra el
logotipo atenuado en lugar de la foto, así que la rejilla no se desarma.

```yaml
cardImage: ../../images/productos/precinto-botella.png
cardImageAlt: 'Precinto de botella metálico amarillo'
products:
  - name: 'Precinto Botella One Seal'
    image: ../../images/productos/precinto-botella-oneseal.png
```

#### Sacar las fotos del listado de precios

El `.xlsx` de precios lleva las fotos incrustadas. Para extraerlas ya nombradas
con el producto de su fila:

```bash
node scripts/extract-xlsx-images.mjs LISTADO_PRECIOS_2026.xlsx
```

Deja todo en `tmp/xlsx-images/`. De ahí se copian a `src/images/productos/`
**solo las que se vayan a publicar**: el listado trae también capturas de
tablas y fotos repetidas. El script no toca `src/`, así que se puede volver a
correr con un listado nuevo sin pisar nada.

### Poner una imagen de fondo en una sección

`SectionBackdrop.astro` pone la imagen a un lado de la sección y la desvanece
hacia el lado donde está el texto. Tiene dos tratamientos, los dos con la
imagen nítida:

- `mate` (el de por defecto): desaturada y con un velo del color de la sección
  encima. Se sigue viendo con todo su detalle, pero apagada, de modo que se
  asienta como fondo en lugar de competir con el texto. Es el que corresponde
  cuando la foto es literal, un producto recortado.
- `photo`: tal cual. Solo para ilustraciones y planos generales, que ya de por
  sí no distraen.

No lleva desenfoque: emborronar la imagen se veía peor que dejarla como
estaba. Y por debajo de `lg` el fondo se oculta, porque ahí el texto ocupa
todo el ancho y cualquier imagen detrás estorbaría la lectura.

La usan los encabezados de página (`MainSection`, props `backdrop` y
`backdropTreatment`), los testimonios y el cierre de página (`HeroSectionAlt`).
La sección contenedora debe ser `relative overflow-hidden` y su contenido ir en
un `div` `relative`.

El hero de la portada no lo usa: va sobre azul de marca lleno (`bg-brand-700`)
con el texto en blanco, sin foto. Con el color detrás, una imagen o queda tapada
o abre un hueco por un lado, y en los dos casos el bloque deja de leerse como
una sola pieza. Ese azul es el mismo en tema claro y en oscuro, a propósito: es
lo primero que se ve del sitio y la marca no debería presentarse de dos formas
distintas según la configuración del visitante.

---

## Formularios

El sitio es estático, así que la recepción la hace **Netlify Forms**: al
desplegar, Netlify detecta en el HTML los formularios marcados con
`data-netlify="true"` y les habilita un endpoint. No hace falta ningún servicio
externo ni llave de acceso.

Hay dos formularios, con los nombres definidos en `FORMS` (`constants.ts`):

| Nombre        | Dónde              |
| ------------- | ------------------ |
| `contacto`    | Página de contacto |
| `suscripcion` | Pie de página      |

Tras el primer despliegue, configura las notificaciones en
**Netlify → Forms → contacto → Settings → Form notifications** para que los
mensajes lleguen a `ventas@precintosdeseguridad.co`.

Si el envío falla, el formulario de contacto abre WhatsApp con el mensaje ya
compuesto en lugar de dejar al visitante sin salida.

El formulario exige marcar la autorización de tratamiento de datos, y ese
consentimiento viaja en el envío (`autorizacion=Sí`) para dejar constancia,
como pide la Ley 1581 de 2012.

---

## Cotizador

Reemplaza el carrito de cotización de WooCommerce del sitio anterior, que un
sitio estático no puede replicar tal cual.

Funciona así: cada referencia del catálogo tiene un botón «Añadir a cotización».
Lo acumulado vive en `localStorage`, de modo que sobrevive a la navegación entre
páginas. Al enviar, se abre WhatsApp con el listado, las cantidades y los datos
de contacto ya escritos. **No se envía nada a ningún servidor** hasta que la
persona pulsa enviar.

---

## Asistente

La burbuja de abajo a la izquierda responde preguntas con la información que ya
está publicada en el sitio. No es un chat genérico enchufado a un modelo: el
modelo hace la parte más pequeña posible del trabajo.

| Tarea        | Quién la hace                                       |
| ------------ | --------------------------------------------------- |
| Recuperación | Código, léxica y determinista, sobre `kb.json`      |
| Datos        | El build, desde los mismos archivos que las páginas |
| Precios      | Nadie: se derivan al equipo comercial               |
| Verificación | Código, después de la respuesta                     |
| Redacción    | El modelo                                           |

Con este reparto, un modelo pequeño y barato responde igual de bien que uno
grande, porque lo único que aporta es el lenguaje.

**Las piezas**

- `src/pages/kb.json.ts` genera `/kb.json` en cada build a partir de las
  colecciones de contenido, `constants.ts`, `empresa.ts` y `faqs.json`. Si
  cambia un teléfono o se agrega una categoría, el asistente lo sabe en el
  siguiente despliegue: no hay nada que actualizar a mano.
- `netlify/functions/chat.mts` recibe la pregunta, recupera los seis hechos más
  cercanos, arma el prompt y llama al proveedor.
- `netlify/functions/_retrieval.mts` es la parte determinista, y por eso vive
  aparte: se prueba entera sin levantar Netlify ni llamar a ningún modelo.

**Precios: por qué el asistente nunca da uno**

El sitio no publica precios y el asistente tampoco. La lista blanca de importes
(`prices` en `kb.json`) va vacía a propósito, así que cualquier cifra en pesos
que escriba el modelo se detecta y se sustituye por la invitación a cotizar,
_después_ de la respuesta. Es la única defensa que no depende de que el modelo
obedezca el prompt.

**Variables en Netlify** (Site configuration → Environment variables). Nunca en
el repositorio: la clave solo existe en el servidor y el navegador jamás la ve.

| Variable            | Obligatoria | Para qué                                    |
| ------------------- | ----------- | ------------------------------------------- |
| `GROQ_API_KEY`      | Sí          | La clave del proveedor                      |
| `GROQ_MODEL`        | No          | Fijar el modelo (`llama-3.3-70b-versatile`) |
| `ANTHROPIC_API_KEY` | No          | Repuesto si Groq falla                      |
| `CHAT_MAX_PER_DAY`  | No          | Techo diario de mensajes del sitio (300)    |

Después de crear la variable hay que **volver a desplegar**: las funciones leen
el entorno del despliegue, no el del panel en vivo.

**Sin clave configurada el asistente no se rompe:** contesta que todavía no está
conectado y deriva al correo y al P.B.X. Lo mismo si el proveedor se cae, si se
agota la cuota o si se alcanza el techo del día. El motivo real queda en el
registro de la función (Netlify → Functions → chat), nunca en pantalla.

**Límites de gasto.** Doce mensajes por minuto y visitante, y un techo diario
para todo el sitio. Ambos viven en memoria de la función, así que son
aproximados: si Netlify levanta varias instancias, cada una lleva su cuenta.

---

## Tests

```bash
pnpm test            # todo
pnpm test:content    # contenido y catálogo (sin navegador, rápido)
pnpm test:build      # HTML generado: rutas, enlaces, metadatos, formularios
pnpm test:chat       # asistente: recuperación, bloqueo de precios, endpoint
pnpm test:smoke      # que cada ruta responda 200
pnpm test:e2e        # comportamiento en navegador + accesibilidad con axe
```

`test:build`, `test:smoke` y `test:e2e` necesitan un `pnpm build` previo.

Los de navegador usan Playwright. En local, si Chromium está en otra ruta,
pásala por `CHROMIUM_PATH`:

```bash
CHROMIUM_PATH=/ruta/a/chrome pnpm test:e2e
```

Qué cubren, en resumen:

- **Contenido:** que las colecciones estén completas, que los iconos existan,
  que no haya `order` repetidos, que no se publiquen precios y que no queden
  restos de la plantilla original.
- **HTML generado:** que todas las rutas existan, que no haya enlaces internos
  rotos ni `href="#"`, que cada página tenga un solo `h1`, título y descripción
  propios, y que los formularios lleven el marcado que Netlify necesita.
- **Asistente:** que cada pregunta real recupere el hecho correcto, que ningún
  importe pase la barandilla, que el prompt imponga el trato de usted y que el
  endpoint derive a una persona cuando no hay clave o el proveedor falla. El
  modelo se sustituye por un doble: ningún test sale a la red.
- **Navegador:** los filtros del catálogo, el buscador sin tildes, el cotizador
  completo (acumular, no duplicar, quitar, mensaje de WhatsApp, foco atrapado,
  cerrar con Escape), el envío del formulario con su alternativa por WhatsApp,
  el menú móvil, el encogido de la barra al bajar, la burbuja del asistente y
  que ninguna página desborde horizontalmente.
- **Accesibilidad:** axe sobre nueve páginas, exigiendo cero violaciones serias
  o críticas de WCAG 2.1 AA.

---

## Despliegue

El repositorio está conectado a Netlify. `netlify.toml` define el comando de
build, la carpeta publicada (`dist`), la carpeta de funciones
(`netlify/functions`), las cabeceras de seguridad y el cacheado.

La CSP permite iframes de `google.com` porque la página de contacto incrusta el
mapa de la sede. Si se agrega otro servicio externo (analítica, otro chat), hay
que añadir su dominio a la cabecera o quedará bloqueado en silencio. El
asistente no necesitó tocarla: llama a `/api/chat`, que es el propio dominio, y
el proveedor se llama desde el servidor, no desde el navegador.

---

## Pendientes

- **Fotografías.** Las familias y categorías ya tienen foto, salida del listado
  de precios. Faltan referencias sueltas que el listado no identifica sin
  ambigüedad (tubulares 2 y 3, rotor Ref. 01 y 3, tornillo 9, ancla mini y 1,
  espiral 33 cms, plano BC 42, candado, dentado doble cierre 39 cms) y no hay
  ninguna foto de rastreo satelital: en el Excel esa hoja solo trae una captura
  de la tabla de precios.
- **Logo para fondo oscuro.** El actual tiene letras negras y grises; en modo
  oscuro se dibuja sobre una base blanca como solución provisional.
- **Política de datos.** El texto es un borrador conforme a la ley, pero
  necesita revisión de un abogado, la dirección física, la fecha de entrada en
  vigencia y verificar si hay que inscribir las bases de datos en el RNBD.
- **Razón social.** El logo dice «S.A.S.» y el sitio anterior decía «Ltda.»;
  falta confirmar cuál es la vigente.
- **Analítica.** No hay medición configurada.
