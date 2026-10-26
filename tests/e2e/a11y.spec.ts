import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, instantScroll, isNarrow, test } from './fixtures';

// Automated WCAG 2.2 A/AA checks with axe-core, plus a scripted keyboard walk.
// Automated results do not establish accessibility on their own; manual screen-reader testing is still required.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, `axe violations: ${label}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await instantScroll(page);
});

test('axe: home page (default state)', async ({ page }) => {
  // Reveal everything so axe evaluates final colors, not mid-fade opacity.
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
  await page.waitForTimeout(1000);
  await axe(page, 'home');
});

test('axe: treatment dialog open', async ({ page }) => {
  await page.locator('#panel-injectables .treatment-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(500);
  await axe(page, 'dialog');
});

test('axe: form with validation errors and status', async ({ page }) => {
  await page.getByRole('button', { name: 'Send Enquiry' }).click();
  // Submitting scrolls to the form; let the hero finish cross-fading so axe measures settled colors.
  await page.waitForTimeout(1500);
  await axe(page, 'form errors');
});

test('axe: mobile menu open', async ({ page }) => {
  test.skip(!isNarrow(page), 'mobile menu only exists below 960px');
  await page.locator('[data-menu-toggle]').click();
  await axe(page, 'mobile menu');
});

test('axe: privacy page', async ({ page }) => {
  await page.goto('/privacy.html');
  await axe(page, 'privacy');
});

test('keyboard: every focus stop is visible, unobscured and has a focus indicator', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not Tab to links by default (Safari option), so a Tab walk is not meaningful here');
  test.skip(isNarrow(page) && test.info().project.name.startsWith('mobile'), 'touch device projects');

  const stops: string[] = [];
  const issues: string[] = [];
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const header = document.querySelector('[data-header]')!.getBoundingClientRect();
      const inHeader = !!el.closest('[data-header]');
      const label = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}"`;
      return {
        label,
        inViewport: r.bottom > 0 && r.top < window.innerHeight && r.width > 0,
        obscured: !inHeader && r.top < header.bottom - 2 && r.bottom > header.top,
        indicator: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? true : cs.boxShadow !== 'none',
        isSkip: el.classList.contains('skip-link'),
      };
    });
    if (!info) break;
    stops.push(info.label);
    if (!info.inViewport) issues.push(`not scrolled into view: ${info.label}`);
    // The skip link is deliberately layered above the header when focused.
    if (info.obscured && !info.isSkip) issues.push(`under sticky header: ${info.label}`);
    if (!info.indicator) issues.push(`no visible focus indicator: ${info.label}`);
  }
  expect(stops[0]).toContain('Skip to main content');
  expect(stops.length).toBeGreaterThan(20);
  expect(issues).toEqual([]);
});

test('text spacing override (WCAG 1.4.12) does not break layout', async ({ page }) => {
  await page.addStyleTag({
    content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
