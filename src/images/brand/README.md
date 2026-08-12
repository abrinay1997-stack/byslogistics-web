# Logo e imágenes de marca

Aquí van los archivos de marca de Business & Supplies Logistics Ltda.
Todo lo que se ponga en esta carpeta lo procesa y optimiza Astro
automáticamente.

## Logo

Sube el logo con **exactamente** uno de estos nombres:

| Archivo         | Uso                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------- |
| `logo.svg`      | Preferido. Escala sin perder nitidez en cualquier tamaño.                                |
| `logo.png`      | Alternativa si no hay SVG. Que venga a **1000 px de ancho como mínimo**.                 |
| `logo-dark.svg` | Opcional. Versión para modo oscuro (fondo oscuro), si el logo normal no se lee bien ahí. |

En cuanto el archivo esté en esta carpeta, hay que apuntar
`src/components/BrandLogo.astro` a él. Ese componente hoy dibuja un
**wordmark provisional** hecho a mano, no el logo real: es lo único que
falta cambiar para que el logo oficial aparezca en el encabezado y en el
pie de página de todas las páginas.

Si el logo tiene fondo blanco "quemado" (no transparente), avísalo: el
encabezado tiene fondo azul claro y se vería un recuadro blanco alrededor.

## Colores

La paleta vive en un solo sitio: la rampa `--color-brand-*` dentro del
bloque `@theme` de `src/assets/styles/global.css`. Ahora está cargado el
azul aproximado tomado de las capturas del sitio actual.

Si tienes los códigos de color exactos de la marca (hex), pásalos y se
ajustan ahí: no hay que tocar ningún otro archivo, porque todos los
componentes usan las clases `brand-*`.

## Fotografías

Las fotos de producto y de operación **no** van en esta carpeta, sino en
`src/images/`. Hacen falta, entre otras:

- Imagen principal para el encabezado de la página de inicio
- Una foto por familia de producto (precintos, etiquetas y cintas, tulas
  y bolsas, cajas de seguridad)
- Una foto por referencia del catálogo de precintos
- Fotos para la página `Nosotros`
