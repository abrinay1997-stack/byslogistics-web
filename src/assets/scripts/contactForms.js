/**
 * Envío de los formularios del sitio (contacto y suscripción).
 *
 * El sitio es estático, así que hay dos caminos según la configuración:
 *
 *   1. Con llave de Web3Forms (PUBLIC_WEB3FORMS_KEY): el formulario se envía
 *      por fetch y el mensaje llega al correo de la empresa.
 *   2. Sin llave: el formulario arma el mensaje y lo abre en WhatsApp, para
 *      que nunca quede en un callejón sin salida.
 *
 * La configuración llega por atributos data-* desde el marcado, de modo que
 * este archivo no necesita importar nada del servidor.
 */

const SENDING = 'Enviando…';

function setStatus(form, message, kind) {
  const status =
    form.querySelector('[data-form-status]') ??
    form.parentElement?.querySelector('[data-form-status]');
  if (!status) return;
  status.textContent = message;
  status.hidden = false;
  status.classList.remove('hidden');
  status.dataset.kind = kind;
}

function submitButton(form) {
  return form.querySelector('button[type="submit"], [type="submit"]');
}

/** Texto del pedido para WhatsApp, a partir de los campos del formulario. */
function buildWhatsappMessage(form, data) {
  const intro = form.dataset.waIntro ?? 'Hola, quisiera hacer una consulta:';
  const lines = [intro, ''];

  const labels = {
    name: 'Nombre',
    email: 'Correo',
    phone: 'Teléfono',
    message: 'Mensaje',
  };
  for (const [key, label] of Object.entries(labels)) {
    const value = (data.get(key) ?? '').toString().trim();
    if (value) lines.push(`${label}: ${value}`);
  }
  return lines.join('\n');
}

async function sendToEndpoint(form, data, endpoint, accessKey) {
  data.set('access_key', accessKey);
  data.set('subject', form.dataset.formSubject ?? 'Mensaje desde el sitio web');
  data.set('from_name', 'Sitio web B&S Logistics');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: data,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    /* respuesta sin JSON: se decide por el código HTTP */
  }
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `HTTP ${response.status}`);
  }
}

function initForms() {
  for (const form of document.querySelectorAll('[data-contact-form]')) {
    if (form.dataset.formBound === 'true') continue;
    form.dataset.formBound = 'true';

    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);

      // Trampa antispam: los robots rellenan el campo oculto, las personas no.
      if ((data.get('botcheck') ?? '').toString().trim() !== '') return;
      data.delete('botcheck');

      const endpoint = form.dataset.formEndpoint ?? '';
      const accessKey = form.dataset.formKey ?? '';
      const whatsapp = form.dataset.formWhatsapp ?? '';

      // Sin llave configurada: se entrega por WhatsApp.
      if (!accessKey) {
        if (whatsapp) {
          const url = `${whatsapp}?text=${encodeURIComponent(
            buildWhatsappMessage(form, data)
          )}`;
          window.open(url, '_blank', 'noopener');
          setStatus(
            form,
            'Abrimos WhatsApp con tu mensaje listo para enviar.',
            'ok'
          );
          return;
        }
        setStatus(
          form,
          form.dataset.formFallback ??
            'Escríbenos a ventas@precintosdeseguridad.co y te respondemos.',
          'error'
        );
        return;
      }

      const button = submitButton(form);
      const originalLabel = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = SENDING;
      }
      setStatus(form, SENDING, 'pending');

      try {
        await sendToEndpoint(form, data, endpoint, accessKey);
        setStatus(
          form,
          form.dataset.formSuccess ??
            '¡Gracias! Recibimos tu mensaje y te respondemos pronto.',
          'ok'
        );
        form.reset();
      } catch (error) {
        console.error('Error al enviar el formulario:', error);
        setStatus(
          form,
          'No pudimos enviar el mensaje. Escríbenos a ventas@precintosdeseguridad.co o por WhatsApp.',
          'error'
        );
      } finally {
        if (button) {
          button.disabled = false;
          if (originalLabel) button.textContent = originalLabel;
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForms);
} else {
  initForms();
}

document.addEventListener('astro:page-load', initForms);
