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
│   ├── QuoteCart.astro       Botones flotantes y panel del cotizador
│   ├── sections/             Bloques grandes de página
│   └── ui/                   Piezas reutilizables
├── content/
│   ├── soluciones/           Las 6 familias de producto (un .md cada una)
│   └── precintos/            Las 11 categorías de precintos
├── data_files/
│   ├── constants.ts          Datos de la empresa: contacto, SEO, formularios
│   └── faqs.json             Preguntas frecuentes
├── images/
│   ├── brand/                Logo y colores (ver su README)
│   ├── backgrounds/          Fondos laterales de sección
│   └── productos/            Fotos del catálogo
├── pages/                    Una página por ruta
└── utils/
    ├── catalog.ts            Aplana las colecciones para el catálogo
    ├── navigation.ts         Menú, pie de página y redes sociales
    └── text.ts               Normalización de texto (búsqueda sin tildes)
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

`SectionBackdrop.astro` pone la imagen a un lado de la sección, a plena
intensidad, y la desvanece hacia el lado donde está el texto — ni pegada tal
cual detrás del contenido ni rebajada a una opacidad mínima. La usan el hero,
los encabezados de página (`MainSection`, prop `backdrop`), los testimonios y
el cierre de página (`HeroSectionAlt`). La sección contenedora debe ser
`relative overflow-hidden` y su contenido ir en un `div` `relative`.

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

## Tests

```bash
pnpm test            # todo
pnpm test:content    # contenido y catálogo (sin navegador, rápido)
pnpm test:build      # HTML generado: rutas, enlaces, metadatos, formularios
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
- **Navegador:** los filtros del catálogo, el buscador sin tildes, el cotizador
  completo (acumular, no duplicar, quitar, mensaje de WhatsApp, foco atrapado,
  cerrar con Escape), el envío del formulario con su alternativa por WhatsApp,
  el menú móvil y que ninguna página desborde horizontalmente.
- **Accesibilidad:** axe sobre nueve páginas, exigiendo cero violaciones serias
  o críticas de WCAG 2.1 AA.

---

## Despliegue

El repositorio está conectado a Netlify. `netlify.toml` define el comando de
build, la carpeta publicada (`dist`), las cabeceras de seguridad y el cacheado.

La CSP permite iframes de `google.com` porque la página de contacto incrusta el
mapa de la sede. Si se agrega otro servicio externo (analítica, chat), hay que
añadir su dominio a la cabecera o quedará bloqueado en silencio.

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
