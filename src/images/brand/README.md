# Logo e imágenes de marca

Archivos de marca de B&S Logistics. Todo lo que se ponga en esta carpeta lo
procesa y optimiza Astro automáticamente.

## Logo

`logo.png` — logo oficial, 1600 x 839 px, fondo transparente. Ya está
conectado: lo usa `src/components/BrandLogo.astro`, que lo muestra en el
encabezado y en el pie de página de todas las páginas.

Para cambiarlo, reemplaza este archivo conservando el nombre. Si algún día
hay una versión en SVG, es preferible: escala sin perder nitidez.

**Pendiente — versión para fondo oscuro.** El logo actual tiene las letras
en negro y gris, así que sobre fondo oscuro no se lee. Mientras tanto,
`BrandLogo.astro` lo dibuja sobre una base blanca cuando el sitio está en
modo oscuro. Si llega un `logo-dark.png` o `logo-dark.svg` con las letras
en blanco, se puede mostrar esa versión y quitar la base blanca.

## Colores

Los colores salen del logo y viven en un solo sitio: la rampa
`--color-brand-*` dentro del bloque `@theme` de
`src/assets/styles/global.css`.

| Color | Hex       | Dónde está                           |
| ----- | --------- | ------------------------------------ |
| Azul  | `#0060A8` | `brand-600`. Botones y enlaces.      |
| Gris  | `#848484` | Cubierto por las rampas `neutral-*`. |
| Negro | `#181818` | Cubierto por las rampas `neutral-*`. |

Cambiar el color de la marca es cambiar esos once valores y nada más: todos
los componentes usan las clases `brand-*`.

## Fotografías

Las fotos de producto y de operación **no** van en esta carpeta, sino en
`src/images/`. Hacen falta:

- Imagen principal para el encabezado de la página de inicio
- Una foto por familia de producto (campo `cardImage` en los archivos de
  `src/content/soluciones/`)
- Una foto por categoría de precinto (campo `cardImage` en
  `src/content/precintos/`)
- Fotos por referencia del catálogo (campo `image` dentro de `products`)
- Fotos para la página `Nosotros`

Las páginas ya están preparadas para recibirlas: mientras el campo esté
vacío, simplemente no se muestra ninguna imagen.
