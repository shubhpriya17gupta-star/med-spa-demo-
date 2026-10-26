import { expect, instantScroll, isNarrow, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await instantScroll(page);
});

test.afterEach(async ({ problems }) => {
  expect(problems, 'console errors / failed requests').toEqual([]);
});

test('every same-page link points at an existing section', async ({ page }) => {
  const bad = await page.$$eval('a[href]', (links) =>
    links
      .map((a) => a.getAttribute('href')!)
      .filter((h) => h === '#' || h === '' || (h.startsWith('#') && !document.getElementById(h.slice(1)))),
  );
  expect(bad).toEqual([]);
});

test('journey 1: navigate to Treatments, open and close treatment details', async ({ page }) => {
  if (isNarrow(page)) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-menu').getByRole('link', { name: 'Treatments' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Treatments' }).click();
  }
  await expect(page).toHaveURL(/#treatments$/);
  await expect(page.locator('#treatments')).toBeInViewport();

  const dialog = page.getByRole('dialog');
  const row = page.locator('#panel-injectables .treatment-card').first();

  // Escape closes and focus returns to the row that opened it.
  await row.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Botox®');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(row).toBeFocused();

  // Close button.
  await row.click();
  await dialog.getByRole('button', { name: 'Close treatment details' }).click();
  await expect(dialog).toBeHidden();

  // Other categories via tabs; each treatment opens its own content.
  await page.getByRole('tab', { name: 'Threads' }).click();
  await page.locator('#panel-threads .treatment-card').first().click();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Thread Lift');
  await expect(dialog).toContainText('consultation-led');
  await page.keyboard.press('Escape');

  // "Enquire" preselects the treatment and moves focus into the form.
  await page.getByRole('tab', { name: 'Skin & Anti-Aging' }).click();
  await page.locator('#panel-skin .treatment-card').first().click();
  await dialog.getByRole('button', { name: /Enquire about Microneedling/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel(/Treatment of interest/)).toHaveValue('microneedling');
  await expect(page.getByLabel('Full name')).toBeFocused();
});

test('treatment tabs support arrow, Home and End keys', async ({ page }) => {
  const first = page.getByRole('tab', { name: 'Injectables' });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Threads' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Threads' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-threads')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Skin & Anti-Aging' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Skin & Anti-Aging' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await expect(page.locator('#panel-injectables')).toBeVisible();
});

test('journey 2: mobile menu opens, navigates, closes', async ({ page }) => {
  test.skip(!isNarrow(page), 'mobile menu only exists below 960px');
  const toggle = page.locator('[data-menu-toggle]');
  const menu = page.locator('#mobile-menu');

  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveAccessibleName('Close menu');

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await toggle.click();
  await expect(menu).toBeHidden();

  for (const [name, id] of [
    ['FAQs', 'faqs'],
    ['About', 'about'],
    ['Contact', 'contact'],
    ['Home', 'top'],
  ]) {
    await toggle.click();
    await menu.getByRole('link', { name }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test('journey 5: every Book a Consultation CTA is honest while booking is not configured', async ({ page }) => {
  const ctas = page.locator('a[data-book]');
  const count = await ctas.count();
  // Header, mobile menu, hero (chapters 1 and 3), consultation section, treatment dialog, footer.
  expect(count).toBe(7);
  for (let i = 0; i < count; i++) {
    await expect(ctas.nth(i)).toHaveAttribute('href', '#book');
    await expect(ctas.nth(i)).not.toHaveAttribute('target', '_blank');
  }

  await page.locator('a[data-book]:visible').first().click();
  await expect(page.locator('#book')).toBeInViewport();
  await expect(page.locator('#book')).toContainText('Online booking isn’t connected yet');
  // No fake booking button is shown.
  await expect(page.locator('[data-booking-link]')).toBeHidden();
  await expect(page.locator('#book iframe')).toHaveCount(0);
});

test('FAQ accordions open and close with mouse and keyboard', async ({ page }) => {
  const faqs = page.locator('details.faq');
  expect(await faqs.count()).toBeGreaterThan(3);
  const first = faqs.first();
  const summary = first.locator('summary');

  await summary.click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.faq__body')).toBeVisible();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(first).not.toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('open', '');
});

test('footer links and privacy page work', async ({ page }) => {
  await page.locator('.site-footer').getByRole('link', { name: 'Privacy notice' }).click();
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy notice');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveTitle(/Pure MedSpa \|/);
});

test('reduced motion shows all content immediately, without the background film', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
  await page.goto(baseURL + '/');
  const hidden = await page.$$eval('.reveal', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(hidden).toBe(0);
  // Hero stays as stacked static panels: not pinned, every chapter visible, film never requested.
  await expect(page.locator('[data-hero]')).not.toHaveClass(/hero--pinned/);
  for (const chapter of await page.locator('[data-chapter]').all()) await expect(chapter).toBeVisible();
  expect(await page.locator('[data-hero-video]').getAttribute('src')).toBeNull();
  await expect(page.locator('[data-video-toggle]')).toBeHidden();
  await context.close();
});

test('hero chapters follow scroll position and settle on the last chapter', async ({ page }) => {
  const hero = page.locator('[data-hero]');
  await expect(hero).toHaveClass(/hero--pinned/);
  const chapters = page.locator('[data-chapter]');
  const vh = await page.evaluate(() => window.innerHeight);
  const heroH = await hero.evaluate((el) => (el as HTMLElement).offsetHeight);
  const travel = heroH - vh;

  await expect(chapters.nth(0)).toHaveClass(/is-active/);
  for (const [fraction, index] of [[0.5, 1], [0.9, 2], [0.1, 0], [0.5, 1]] as const) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(travel * fraction));
    await expect(chapters.nth(index)).toHaveClass(/is-active/);
    await expect(page.locator('[data-chapter].is-active')).toHaveCount(1);
  }
  // Rapid jumps (as when nav links are clicked in quick succession) end on the right chapter.
  for (const y of [travel, 0, travel * 0.6, heroH + 200, 0]) await page.evaluate((top) => window.scrollTo(0, top), y);
  await expect(chapters.nth(0)).toHaveClass(/is-active/);
  await expect(page.locator('.hero a[data-book]').first()).toBeVisible();
});

test('background film can be paused and resumed', async ({ page }) => {
  const toggle = page.locator('[data-video-toggle]');
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  await expect(toggle).toHaveAccessibleName('Pause background video');
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Play background video');
  expect(await page.locator('[data-hero-video]').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Pause background video');
});

test('category links open the matching treatment tab', async ({ page }) => {
  await page.locator('.site-footer').getByRole('link', { name: 'Skin & Anti-Aging' }).click();
  await expect(page).toHaveURL(/#treatments$/);
  await expect(page.getByRole('tab', { name: 'Skin & Anti-Aging' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-skin')).toBeVisible();
  await page.locator('.site-footer').getByRole('link', { name: 'Threads' }).click();
  await expect(page.locator('#panel-threads')).toBeVisible();
});

test('a direct section URL lands on that section below the header', async ({ page }) => {
  for (const id of ['faqs', 'contact', 'treatments']) {
    await page.goto(`/#${id}`);
    await page.waitForLoadState('load');
    await expect(page.locator(`#${id} h2`).first()).toBeInViewport();
    const { headerBottom, headingTop } = await page.evaluate((target) => ({
      headerBottom: document.querySelector('[data-header]')!.getBoundingClientRect().bottom,
      headingTop: document.querySelector(`#${target} h2`)!.getBoundingClientRect().top,
    }), id);
    expect(headingTop).toBeGreaterThanOrEqual(headerBottom);
  }
});

test('logo returns to the top of the page', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('[data-header] .wordmark').click();
  await expect(page).toHaveURL(/#top$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});

test('mobile menu makes the page behind it inert and restores it', async ({ page }) => {
  test.skip(!isNarrow(page), 'mobile menu only exists below 960px');
  await page.locator('[data-menu-toggle]').click();
  expect(await page.locator('main').evaluate((m) => (m as HTMLElement).inert)).toBe(true);
  await expect(page.locator('#mobile-menu').getByRole('link', { name: 'Home' })).toBeFocused();
  await page.locator('#mobile-menu').getByRole('link', { name: 'Book a Consultation' }).click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
  expect(await page.locator('main').evaluate((m) => (m as HTMLElement).inert)).toBe(false);
  await expect(page.locator('#book')).toBeInViewport();
});
