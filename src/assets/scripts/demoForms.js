/**
 * Manejo de los formularios de demostración (contacto y suscripción).
 * Evita el envío silencioso y muestra un mensaje honesto de que aún no hay
 * un backend conectado.
 *
 * Nota: este archivo traía anotaciones de tipo de TypeScript dentro de un
 * archivo .js, así que `querySelectorAll < HTMLFormElement > '...'` se
 * evaluaba como una comparación y lanzaba
 * `"[data-demo-form]".forEach is not a function`. El error rompía el módulo
 * completo, de modo que ningún formulario respondía.
 */
function initDemoForms() {
  for (const form of document.querySelectorAll('[data-demo-form]')) {
    if (form.dataset.demoBound === 'true') continue;
    form.dataset.demoBound = 'true';

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const status =
        form.querySelector('[data-demo-status]') ??
        form.parentElement?.querySelector('[data-demo-status]');
      const message =
        form.dataset.demoMessage ||
        status?.dataset.successMessage ||
        'Demo: este formulario todavía no está conectado a un servidor.';

      if (status) {
        status.textContent = message;
        status.hidden = false;
        status.classList.remove('hidden');
      }

      form.reset();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDemoForms);
} else {
  initDemoForms();
}

document.addEventListener('astro:page-load', initDemoForms);
