import { expect, instantScroll, test } from './fixtures';

// Journey 6 (layout half): the required viewport widths, run in every desktop browser project.
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

test.describe('responsive layout', () => {
  // Playwright requires an object pattern for the fixtures argument, even when unused.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'device projects have a fixed viewport');
  });

  for (const vp of VIEWPORTS) {
    test(`${vp.width}px: no overflow, clipping, distortion or blurry images`, async ({ page, problems }, testInfo) => {
      await page.setViewportSize(vp);
      await page.goto('/');
      await instantScroll(page);

      // Primary CTA is visible above the fold.
      const heroCta = page.locator('.hero a[data-book]').first();
      await expect(heroCta).toBeInViewport();

      // Load every lazy image and run reveals by scrolling through the page.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += Math.round(vp.height * 0.8)) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(60);
      }
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => [...document.images].filter((i) => !i.closest('[hidden]')).every((i) => i.complete), null, { timeout: 15_000 });

      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden], dialog:not([open]), .honeypot, .visually-hidden, .skip-link');
        };
        const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 30)}"`;

        const overflow = document.documentElement.scrollWidth - vw;

        // Content poking outside the viewport horizontally.
        const offscreen = [...document.querySelectorAll('main *, header *, footer *')]
          .filter(visible)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (el.closest('.tabs__list')) return false; // intentionally horizontally scrollable
            return r.right > vw + 1 || r.left < -1;
          })
          .filter((el) => !el.closest('.about__media, .booking__bg, .editorial__media, .tabpanel__media, .hero__media'))
          .map(describe);

        // Text clipped inside its own box.
        const clipped = [...document.querySelectorAll('h1,h2,h3,p,a,button,label,summary,li,dt,dd,legend,span')]
          .filter(visible)
          .filter((el) => {
            const cs = getComputedStyle(el);
            const clips = cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis';
            return clips && el.scrollWidth > el.clientWidth + 1 && !el.closest('.tabs__list');
          })
          .map(describe);

        // Interactive targets: WCAG 2.2 SC 2.5.8 minimum 24×24 (inline text links are exempt).
        const small = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=tab]')]
          .filter(visible)
          .filter((el) => !el.closest('p, dd, .field--consent'))
          .filter((el) => {
            const target = el.matches('input[type=radio], input[type=checkbox]') ? el.closest('label') ?? el : el;
            const r = target.getBoundingClientRect();
            return r.width < 24 || r.height < 24;
          })
          .map(describe);

        // Images: no stretching (non-cover images keep their ratio) and enough pixels for the display.
        const dpr = Math.min(window.devicePixelRatio, 2);
        const images = [...document.images].filter(visible).map((img) => {
          const r = img.getBoundingClientRect();
          const fit = getComputedStyle(img).objectFit;
          const natural = img.naturalWidth / img.naturalHeight;
          const box = r.width / r.height;
          const distorted = fit !== 'cover' && fit !== 'contain' && Math.abs(natural / box - 1) > 0.02;
          // For cover, the image must cover the box at the device pixel ratio (or be the full-size source).
          const coverScale = fit === 'cover' ? Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight) * img.naturalWidth : r.width;
          const needed = coverScale * dpr * 0.95;
          // The hero poster is a frame of the 1280×720 film, so it can't be sharper than the film itself.
          const native = img.classList.contains('hero__poster') && img.naturalWidth >= 1280;
          const blurry = img.naturalWidth < needed && img.naturalWidth < 2400 && !native;
          return { src: img.currentSrc.split('/').pop(), broken: img.naturalWidth === 0, distorted, blurry, have: img.naturalWidth, needed: Math.round(needed) };
        });

        return { overflow, offscreen, clipped, small, images };
      });

      await page.evaluate(() => window.scrollTo(0, 0));
      await testInfo.attach(`top-${vp.width}`, { body: await page.screenshot(), contentType: 'image/png' });

      expect(report.overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(0);
      expect(report.offscreen, 'elements outside the viewport').toEqual([]);
      expect(report.clipped, 'clipped text').toEqual([]);
      expect(report.small, 'targets under 24×24 CSS px').toEqual([]);
      expect(report.images.filter((i) => i.broken), 'broken images').toEqual([]);
      expect(report.images.filter((i) => i.distorted), 'distorted images').toEqual([]);
      expect(report.images.filter((i) => i.blurry), 'under-resolved images').toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});

test('anchor targets are not hidden under the sticky header', async ({ page }) => {
  await page.goto('/');
  await instantScroll(page);
  for (const id of ['treatments', 'about', 'book', 'faqs', 'contact']) {
    await page.evaluate((target) => (window.location.hash = target), id);
    await page.waitForTimeout(50);
    const { headerBottom, headingTop } = await page.evaluate((target) => ({
      headerBottom: document.querySelector('[data-header]')!.getBoundingClientRect().bottom,
      headingTop: document.querySelector(`#${target} h2`)!.getBoundingClientRect().top,
    }), id);
    expect(headingTop, `#${id} heading below header`).toBeGreaterThanOrEqual(headerBottom);
  }
});
