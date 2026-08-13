import '@styles/lenis.css';

import Lenis from 'lenis';

// Respect reduced-motion preferences — skip smooth scrolling when requested.
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // https://github.com/darkroomengineering/lenis
  const lenis = new Lenis({
    autoRaf: true,
  });

  /*
   * La instancia queda accesible para el resto del sitio.
   *
   * Lenis desplaza la página él mismo, así que `document.body.style.overflow =
   * 'hidden'` no lo detiene: con el cotizador abierto, la rueda seguía moviendo
   * la página de detrás. Quien abra una capa modal llama a `lenis.stop()` y a
   * `lenis.start()` al cerrarla.
   *
   * Para que un contenedor de dentro sí se desplace, marque el elemento con
   * `data-lenis-prevent`.
   */
  window.lenis = lenis;
} else {
  document.documentElement.classList.remove('lenis', 'lenis-smooth');
}
