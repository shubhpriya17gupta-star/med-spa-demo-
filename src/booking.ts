/**
 * Google Calendar appointment-scheduling integration.
 *
 * The only input is the PUBLIC booking-page URL from VITE_GOOGLE_CALENDAR_BOOKING_URL.
 * No Google sign-in, API keys or private calendar data are involved: visitors book
 * directly on Google's own page, which handles availability and confirmations.
 */

export type BookingConfig =
  | { status: 'missing' }
  | { status: 'invalid'; reason: string }
  | { status: 'ready'; url: string; embedUrl: string | null };

const ALLOWED_HOSTS = new Set(['calendar.google.com', 'calendar.app.google']);
const EMBEDDABLE_PATH = /^\/calendar\/appointments\/schedules\/[\w-]+\/?$/;

export function resolveBookingConfig(raw: string | undefined): BookingConfig {
  const value = raw?.trim();
  if (!value) return { status: 'missing' };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { status: 'invalid', reason: 'not a valid URL' };
  }
  if (url.protocol !== 'https:') return { status: 'invalid', reason: 'must use https' };
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    return { status: 'invalid', reason: `host "${url.hostname}" is not a Google Calendar booking host` };
  }

  // Full schedule URLs support Google's documented iframe embed (?gv=true).
  // Short calendar.app.google links redirect, so they are opened in a new tab instead.
  let embedUrl: string | null = null;
  if (url.hostname === 'calendar.google.com' && EMBEDDABLE_PATH.test(url.pathname)) {
    const embed = new URL(url.href);
    embed.searchParams.set('gv', 'true');
    embedUrl = embed.href;
  }
  return { status: 'ready', url: url.href, embedUrl };
}

const NEW_TAB_HINT = ' (opens Google Calendar in a new tab)';

/** Wires every [data-book] CTA and the #book section to the resolved config. */
export function initBooking(config: BookingConfig, root: ParentNode = document): void {
  const ctas = root.querySelectorAll<HTMLAnchorElement>('a[data-book]');
  const section = root.querySelector<HTMLElement>('[data-booking-panel]');

  if (config.status === 'ready' && !config.embedUrl) {
    ctas.forEach((a) => {
      a.href = config.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${a.textContent?.trim() ?? 'Book a Consultation'}${NEW_TAB_HINT}`);
    });
  }
  // Otherwise CTAs keep their default href="#book", which shows the embed or the setup notice.

  if (!section) return;
  section.dataset.state = config.status === 'ready' ? (config.embedUrl ? 'embed' : 'link') : 'pending';

  const link = section.querySelector<HTMLAnchorElement>('[data-booking-link]');
  if (link && config.status === 'ready') {
    link.href = config.url;
    link.hidden = false;
  }

  const frameHost = section.querySelector<HTMLElement>('[data-booking-frame]');
  if (frameHost && config.status === 'ready' && config.embedUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = config.embedUrl;
    iframe.title = 'Pure MedSpa consultation booking (Google Calendar)';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frameHost.append(iframe);
    frameHost.hidden = false;
  }

  // A misconfigured URL is reported in every environment; a missing one only in dev.
  if (config.status === 'invalid') {
    console.warn(`[booking] VITE_GOOGLE_CALENDAR_BOOKING_URL ignored: ${config.reason}.`);
  } else if (config.status === 'missing' && import.meta.env.DEV) {
    console.info(
      '[booking] VITE_GOOGLE_CALENDAR_BOOKING_URL is not set. Booking CTAs point to the on-page ' +
        'setup notice. See README.md > "Google Calendar booking".',
    );
  }
}
