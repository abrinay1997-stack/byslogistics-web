/**
 * Cotizador. Acumula referencias con su cantidad y arma un mensaje de
 * WhatsApp con el listado.
 *
 * El sitio es estático, así que el carrito vive en localStorage del visitante:
 * no se envía a ningún servidor hasta que la persona pulsa "Enviar por
 * WhatsApp", y ahí sale como texto en el chat.
 *
 * La interacción con el DOM va por atributos data-*, para que el marcado lo
 * defina QuoteCart.astro y este archivo solo se ocupe de la lógica.
 */

const STORAGE_KEY = 'bys-cotizacion';
const DEFAULT_QTY = 1000;

/** @typedef {{id: string, name: string, group: string, qty: number}} QuoteLine */

/** @returns {QuoteLine[]} */
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      line =>
        line && typeof line.id === 'string' && typeof line.name === 'string'
    );
  } catch {
    // localStorage puede estar bloqueado (modo privado, cookies de terceros).
    return [];
  }
}

/** @param {QuoteLine[]} lines */
function write(lines) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* sin persistencia; el carrito sigue funcionando en esta pestaña */
  }
}

let lines = read();

function totalUnits() {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(value);
}

function render() {
  const count = lines.length;

  for (const el of document.querySelectorAll('[data-quote-count]')) {
    el.textContent = String(count);
  }
  for (const el of document.querySelectorAll('[data-quote-toggle]')) {
    el.hidden = count === 0;
  }
  for (const el of document.querySelectorAll('[data-quote-empty]')) {
    el.hidden = count > 0;
  }
  for (const el of document.querySelectorAll('[data-quote-filled]')) {
    el.hidden = count === 0;
  }
  for (const el of document.querySelectorAll('[data-quote-total]')) {
    el.textContent = formatNumber(totalUnits());
  }

  // Los botones "Añadir" de las tarjetas reflejan si ya está en la cotización
  const inCart = new Set(lines.map(line => line.id));
  for (const btn of document.querySelectorAll('[data-quote-add]')) {
    const added = inCart.has(btn.dataset.quoteAdd);
    btn.dataset.added = added ? 'true' : 'false';
    const label = btn.querySelector('[data-quote-add-label]');
    if (label) label.textContent = added ? 'En la cotización' : 'Añadir';
  }

  const list = document.querySelector('[data-quote-list]');
  if (!list) return;
  list.replaceChildren();

  for (const line of lines) {
    const item = document.createElement('li');
    item.className =
      'flex items-center gap-3 border-b border-neutral-200 py-3 dark:border-neutral-700';
    item.innerHTML = `
      <div class="min-w-0 grow">
        <p class="truncate font-medium text-neutral-800 dark:text-neutral-200"></p>
        <p class="truncate text-xs text-neutral-600 dark:text-neutral-400"></p>
      </div>
      <label class="sr-only" for="qty-${line.id}">Cantidad</label>
      <input
        id="qty-${line.id}"
        type="number"
        min="1"
        step="1"
        inputmode="numeric"
        value="${line.qty}"
        data-quote-qty="${line.id}"
        class="w-24 shrink-0 rounded-lg border border-neutral-300 bg-neutral-50 px-2 py-2 text-sm text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
      />
      <button
        type="button"
        data-quote-remove="${line.id}"
        aria-label="Quitar de la cotización"
        class="shrink-0 rounded-lg px-2 py-2 text-lg leading-none text-neutral-600 dark:text-neutral-400 transition hover:text-red-600 dark:hover:text-red-400"
      >&times;</button>
    `;
    // El nombre se asigna como texto, nunca como HTML.
    item.querySelector('.grow > p:first-child').textContent = line.name;
    item.querySelector('.grow > p:last-child').textContent = line.group;
    list.append(item);
  }
}

function save() {
  write(lines);
  render();
}

function add(id, name, group) {
  if (lines.some(line => line.id === id)) return;
  lines.push({ id, name, group, qty: DEFAULT_QTY });
  save();
}

function remove(id) {
  lines = lines.filter(line => line.id !== id);
  save();
}

function setQty(id, qty) {
  const line = lines.find(item => item.id === id);
  if (!line) return;
  line.qty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
  write(lines);
  for (const el of document.querySelectorAll('[data-quote-total]')) {
    el.textContent = formatNumber(totalUnits());
  }
}

/** Elementos enfocables dentro del panel, en orden de tabulación. */
function focusables(panel) {
  return [
    ...panel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
    ),
  ].filter(el => el.offsetParent !== null);
}

let lastFocused = null;

function openPanel(open) {
  const panel = document.querySelector('[data-quote-panel]');
  if (!panel) return;
  panel.dataset.open = open ? 'true' : 'false';
  // El cajón lleva su propio data-open porque la variante `data-[open=true]:`
  // de Tailwind mira el atributo del elemento donde está la clase.
  const drawer = panel.querySelector('[data-quote-drawer]');
  if (drawer) drawer.dataset.open = open ? 'true' : 'false';

  // `inert` saca del árbol de accesibilidad y del orden de tabulación todo el
  // contenido del panel mientras está cerrado. Con aria-hidden solo, el lector
  // de pantalla lo ocultaba pero sus botones seguían siendo tabulables, que es
  // justo lo que axe marca como aria-hidden-focus.
  panel.inert = !open;
  panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  panel.setAttribute('aria-modal', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';

  if (open) {
    lastFocused = document.activeElement;
    panel.querySelector('[data-quote-close]')?.focus();
  } else if (lastFocused instanceof HTMLElement) {
    // Al cerrar, el foco vuelve al botón que abrió el panel.
    lastFocused.focus();
    lastFocused = null;
  }
}

/** Mantiene el foco dentro del panel mientras está abierto. */
function trapFocus(event) {
  const panel = document.querySelector('[data-quote-panel]');
  if (!panel || panel.dataset.open !== 'true' || event.key !== 'Tab') return;
  const items = focusables(panel);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Arma el texto del pedido para WhatsApp. */
function buildMessage() {
  // Ojo: los botones "Añadir" llevan data-quote-name con el nombre del
  // producto, así que los campos del panel usan data-quote-field.
  const field = key =>
    document.querySelector(`[data-quote-field="${key}"]`)?.value.trim() ?? '';
  const name = field('name');
  const company = field('company');
  const notes = field('notes');

  const parts = ['Hola, quisiera cotizar las siguientes referencias:', ''];
  lines.forEach((line, index) => {
    parts.push(`${index + 1}. ${line.name} — ${formatNumber(line.qty)} und.`);
  });
  parts.push('');
  if (name) parts.push(`Nombre: ${name}`);
  if (company) parts.push(`Empresa: ${company}`);
  if (notes) parts.push(`Observaciones: ${notes}`);
  return parts.join('\n');
}

function init() {
  const root = document.querySelector('[data-quote-panel]');
  const whatsappBase = root?.dataset.whatsapp ?? '';

  document.addEventListener('click', event => {
    const addBtn = event.target.closest('[data-quote-add]');
    if (addBtn) {
      add(
        addBtn.dataset.quoteAdd,
        addBtn.dataset.quoteName,
        addBtn.dataset.quoteGroup
      );
      return;
    }

    const removeBtn = event.target.closest('[data-quote-remove]');
    if (removeBtn) {
      remove(removeBtn.dataset.quoteRemove);
      return;
    }

    if (event.target.closest('[data-quote-toggle]')) {
      openPanel(true);
      return;
    }
    if (
      event.target.closest('[data-quote-close]') ||
      event.target.hasAttribute?.('data-quote-backdrop')
    ) {
      openPanel(false);
      return;
    }

    if (event.target.closest('[data-quote-send]')) {
      if (lines.length === 0) return;
      const url = `${whatsappBase}?text=${encodeURIComponent(buildMessage())}`;
      window.open(url, '_blank', 'noopener');
    }
  });

  document.addEventListener('input', event => {
    const qtyInput = event.target.closest('[data-quote-qty]');
    if (qtyInput) setQty(qtyInput.dataset.quoteQty, Number(qtyInput.value));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') openPanel(false);
    trapFocus(event);
  });

  // Arranca cerrado e inerte, para que su contenido no sea tabulable.
  const panel = document.querySelector('[data-quote-panel]');
  if (panel) panel.inert = true;

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Astro reutiliza el documento entre navegaciones cuando hay view transitions.
document.addEventListener('astro:page-load', () => {
  lines = read();
  render();
});
