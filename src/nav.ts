/** Header state, full-screen mobile menu, active-section highlighting and deep-link settling. */
export function initNav(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');
  if (!header || !toggle || !menu || !label) return;

  // The header stays transparent while it sits over the hero imagery, then turns solid.
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const overHero = hero ? hero.getBoundingClientRect().bottom > header.offsetHeight : window.scrollY <= 12;
    header.classList.toggle('is-scrolled', !overHero);
  };
  onScroll();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', onScroll);

  // While the overlay menu is open, the page behind it is inert and doesn't scroll.
  const background = [...document.querySelectorAll<HTMLElement>('main, footer')];
  const setOpen = (open: boolean, returnFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close menu' : 'Open menu';
    menu.hidden = !open;
    header.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    background.forEach((el) => (el.inert = open));
    if (open) menu.querySelector<HTMLElement>('a')?.focus();
    else if (returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  // Any link in the header (menu items, logo, Book CTA) closes the menu first; the browser then
  // follows the link as normal, now that the page is no longer inert.
  header.addEventListener('click', (e) => {
    if (!menu.hidden && (e.target as Element).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) setOpen(false, true);
  });

  // Close if the viewport grows past the mobile breakpoint while open.
  window.matchMedia('(min-width: 960px)').addEventListener('change', (mq) => {
    if (mq.matches && !menu.hidden) setOpen(false);
  });

  // Highlight the desktop nav link for the section currently in view.
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.primary-nav a[href^="#"]').forEach((a) => {
    links.set(a.hash.slice(1), a);
  });
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => observer.observe(s));

  settleInitialHash();
}

/**
 * On a refresh or a shared link such as /#faqs, the browser may scroll before scripts have built
 * the treatment panels and fonts have loaded. Re-align the target once now and once on load,
 * unless the visitor has already started scrolling themselves.
 */
function settleInitialHash(): void {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) return;

  let userMoved = false;
  const mark = () => (userMoved = true);
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
  events.forEach((type) => window.addEventListener(type, mark, { once: true, passive: true }));

  const align = () => {
    if (!userMoved) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  align();
  if (document.readyState === 'complete') return;
  window.addEventListener('load', align, { once: true });
}
