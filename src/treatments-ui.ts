import { categories, findTreatment, treatmentsIn, type Category } from './data/treatments';

const WIDTHS = [640, 1024, 1600, 2400];
const srcset = (base: string, ext: string) => WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
/**
 * Photos are cropped to cover a 4:5 arch on desktop and a 4:3 frame on smaller screens, and may be
 * zoomed, so request a source wide enough for the cropped render, not just for the column.
 * A ratio × 4:5 photo renders at (5/4 × ratio) of the column width; in a 4:3 frame, at (3/4 × ratio).
 */
const DEFAULT_RATIO = 4 / 3;
const sizesFor = (zoom = 1, ratio = DEFAULT_RATIO) =>
  `(min-width: 960px) ${Math.round(38 * Math.max(1, 1.25 * ratio) * zoom)}vw, ` +
  `${Math.round(100 * Math.max(1, 0.75 * ratio) * zoom)}vw`;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function categoryImage(c: Category): HTMLPictureElement {
  const img = el('img', {
    src: `${c.image.base}-1024.webp`,
    srcset: srcset(c.image.base, 'webp'),
    sizes: sizesFor(c.image.zoom, c.image.ratio),
    alt: c.image.alt,
    loading: 'lazy',
    decoding: 'async',
    width: 1600,
    height: Math.round(1600 / (c.image.ratio ?? DEFAULT_RATIO)),
  });
  img.style.objectPosition = c.image.position;
  if (c.image.zoom) {
    img.style.setProperty('--zoom', String(c.image.zoom));
    img.style.setProperty('--zoom-origin', c.image.position);
  }
  const avif = el('source', { type: 'image/avif', srcset: srcset(c.image.base, 'avif'), sizes: sizesFor(c.image.zoom, c.image.ratio) });
  return el('picture', {}, [avif, img]);
}

/**
 * Builds the accessible category tabs (WAI-ARIA tabs pattern, automatic activation).
 * Returns a function that selects a category by id, used by links such as the footer's
 * "Injectables" that jump to the section with a specific category open.
 */
export function initTreatmentTabs(onOpen: (id: string) => void): (categoryId: string) => void {
  const tablist = document.querySelector<HTMLElement>('[data-tablist]');
  const panelHost = document.querySelector<HTMLElement>('[data-tabpanels]');
  if (!tablist || !panelHost) return () => {};

  let counter = 0;
  const tabs = categories.map((c, i) => {
    const tab = el('button', {
      type: 'button',
      className: 'tab',
      id: `tab-${c.id}`,
      textContent: c.label,
      tabIndex: i === 0 ? 0 : -1,
    });
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(i === 0));
    tab.setAttribute('aria-controls', `panel-${c.id}`);

    const list = el(
      'ul',
      { className: 'treatment-grid' },
      treatmentsIn(c.id).map((t) => {
        counter += 1;
        const nameId = `treatment-${t.id}-name`;
        const ctaId = `treatment-${t.id}-cta`;
        const summaryId = `treatment-${t.id}-summary`;
        const card = el('button', { type: 'button', className: 'treatment-card' }, [
          el('span', { className: 'treatment-card__num', textContent: String(counter).padStart(2, '0') }),
          el('span', { className: 'treatment-card__name', id: nameId, textContent: t.name }),
          el('span', { className: 'treatment-card__summary', id: summaryId, textContent: t.summary }),
          el('span', { className: 'treatment-card__cta', id: ctaId }, [
            'View details',
            el('span', { className: 'treatment-card__arrow', textContent: '→' }),
          ]),
        ]);
        // Announced as "Botox®, View details", with the summary as its description.
        card.setAttribute('aria-labelledby', `${nameId} ${ctaId}`);
        card.setAttribute('aria-describedby', summaryId);
        card.setAttribute('aria-haspopup', 'dialog');
        card.querySelector('.treatment-card__arrow')?.setAttribute('aria-hidden', 'true');
        card.addEventListener('click', () => onOpen(t.id));
        return el('li', {}, [card]);
      }),
    );

    const panel = el('div', { className: 'tabpanel', id: `panel-${c.id}`, hidden: i !== 0, tabIndex: 0 }, [
      el('div', { className: 'tabpanel__media' }, [categoryImage(c)]),
      el('div', {}, [el('p', { className: 'tabpanel__intro', textContent: c.intro }), list]),
    ]);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);

    tablist.append(tab);
    panelHost.append(panel);
    return { tab, panel };
  });

  const select = (index: number, focus: boolean) => {
    tabs.forEach(({ tab, panel }, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && panel.hidden) {
        panel.hidden = false;
        panel.classList.remove('is-entering');
        void panel.offsetWidth; // restart the entrance animation
        panel.classList.add('is-entering');
      } else if (!active) {
        panel.hidden = true;
      }
    });
    if (focus) tabs[index].tab.focus();
  };

  tabs.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      const next: Record<string, number> = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      };
      if (e.key in next) {
        e.preventDefault();
        select(next[e.key], true);
      }
    });
  });

  return (categoryId: string) => {
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index >= 0) select(index, false);
  };
}

/** Fills the enquiry form's treatment <select> from the same data source. */
export function populateTreatmentSelect(): void {
  const select = document.querySelector<HTMLSelectElement>('[data-treatment-select]');
  if (!select) return;
  categories.forEach((c) => {
    const group = el('optgroup', { label: c.label });
    treatmentsIn(c.id).forEach((t) => group.append(el('option', { value: t.id, textContent: t.name })));
    select.append(group);
  });
  select.append(el('option', { value: 'not-sure', textContent: 'Not sure yet, I’d like advice' }));
}

/** Treatment detail dialog built on native <dialog> (focus containment, Escape, inert background). */
export function initTreatmentDialog(onEnquire: (id: string) => void): (id: string) => void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-treatment-dialog]');
  if (!dialog) throw new Error('Treatment dialog markup is missing');

  const q = <T extends HTMLElement>(sel: string) => {
    const node = dialog.querySelector<T>(sel);
    if (!node) throw new Error(`Treatment dialog is missing ${sel}`);
    return node;
  };
  const category = q('[data-dlg-category]');
  const title = q('[data-dlg-title]');
  const overview = q('[data-dlg-overview]');
  const discuss = q('[data-dlg-discuss]');
  const enquire = q<HTMLButtonElement>('[data-dlg-enquire]');
  let current: string | null = null;

  // Release the page scroll lock immediately: browsers may dispatch the 'close' event late,
  // which would otherwise leave the page unscrollable for a moment after closing.
  const unlock = () => document.documentElement.classList.remove('dialog-open');
  const close = () => {
    dialog.close();
    unlock();
  };
  dialog.addEventListener('cancel', unlock); // Escape
  dialog.addEventListener('close', unlock); // any other path
  q('[data-dialog-close]').addEventListener('click', close);
  // Click on the backdrop (the dialog element itself, outside the inner panel) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  // Links inside (e.g. "Book a Consultation") close the dialog, then navigate as normal.
  dialog.querySelectorAll('[data-dialog-dismiss]').forEach((a) => a.addEventListener('click', close));
  enquire.addEventListener('click', () => {
    if (!current) return;
    const id = current;
    close();
    onEnquire(id);
  });

  return (id: string) => {
    const t = findTreatment(id);
    if (!t) throw new Error(`Unknown treatment "${id}"`);
    current = id;
    category.textContent = categories.find((c) => c.id === t.category)?.label ?? '';
    title.textContent = t.name;
    overview.replaceChildren(...t.overview.map((p) => el('p', { textContent: p })));
    discuss.replaceChildren(...t.discuss.map((d) => el('li', { textContent: d })));
    enquire.textContent = `Enquire about ${t.name.split(':')[0].replace('®', '')}`;
    dialog.showModal();
    document.documentElement.classList.add('dialog-open');
    dialog.scrollTop = 0;
  };
}
