import { test as base, expect, type Page, type Route } from '@playwright/test';

export const FORMSPREE = 'https://formspree.io/f/e2eTestForm1';

type FormspreeHandler = (route: Route, body: Record<string, string>) => Promise<void> | void;

interface Fixtures {
  /** Console errors and failed same-origin requests collected during the test. */
  problems: string[];
  /** Replace the default Formspree mock for this test. Returns the list of received payloads. */
  mockFormspree: (handler: FormspreeHandler) => Record<string, string>[];
}

export const test = base.extend<Fixtures>({
  problems: [
    async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (m) => {
      // The form logs the failure scenarios we deliberately trigger; those are expected.
      const fromFormspree = m.location().url.startsWith(FORMSPREE); // browser log for a deliberately failed mock
      if (m.type() === 'error' && !m.text().startsWith('[enquiry]') && !fromFormspree) problems.push(`console: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('response', (r) => {
      if (r.url().startsWith('http://localhost') && r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
    });
    await use(problems);
    },
    { auto: true },
  ],

  mockFormspree: [
    async ({ page }, use) => {
    const received: Record<string, string>[] = [];
    let handler: FormspreeHandler = (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });

    // Block everything that isn't the local site; answer Formspree with the active mock.
    await page.route(/^(?!http:\/\/localhost)/, async (route) => {
      if (route.request().url() === FORMSPREE) {
        const body = route.request().postDataJSON() as Record<string, string>;
        received.push(body);
        return handler(route, body);
      }
      return route.abort('blockedbyclient');
    });
    await use((h) => {
      handler = h;
      return received;
    });
    },
    { auto: true },
  ],
});

export { expect };

export const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 960;

/** Jump without smooth scrolling so assertions don't race the animation. */
export async function instantScroll(page: Page) {
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
}

export async function fillValidForm(page: Page) {
  await page.getByLabel('Full name').fill('Test Person');
  await page.locator('#f-email').fill('test.person@example.com');
  await page.getByLabel(/Treatment of interest/).selectOption('botox');
  await page.getByLabel(/I agree to be contacted/).check();
}
