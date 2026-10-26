import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end + accessibility suite.
 *
 * The site is built into dist-e2e/ (never deployed) with a dummy Formspree form ID so the live
 * form path can be exercised. Every non-localhost request is blocked or mocked in tests/e2e/fixtures.ts,
 * so these tests never send real email or contact Google.
 *
 * Chrome and Edge use the locally installed browsers. Firefox and WebKit use Playwright's engine
 * builds (`npx playwright install firefox webkit`). WebKit on Windows/Linux approximates Safari but
 * is not Safari; real iPhone/Android testing is still required.
 */
const PORT = 4176;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // One browser at a time keeps memory use low; pass --workers=N on a machine with more RAM.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    env: { VITE_FORMSPREE_FORM_ID: 'e2eTestForm1', VITE_GOOGLE_CALENDAR_BOOKING_URL: '' },
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
