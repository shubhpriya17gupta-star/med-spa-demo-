import { expect, fillValidForm, instantScroll, test } from './fixtures';

// Journey 3: valid/invalid submissions, duplicate submissions and delivery failures.
// Formspree is mocked (see fixtures.ts); no real enquiry is sent by this suite.

test.beforeEach(async ({ page }) => {
  await page.goto('/#contact');
  await instantScroll(page);
});

test.afterEach(async ({ problems }) => {
  expect(problems).toEqual([]);
});

const status = (page: import('@playwright/test').Page) => page.locator('[data-form-status]');
const submit = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /Send Enquiry|Sending/ });

test('live mode hides the not-live banner', async ({ page }) => {
  await expect(page.locator('[data-mode-banner]')).toBeHidden();
});

test('invalid submission shows accessible inline errors and sends nothing', async ({ page, mockFormspree }) => {
  const received = mockFormspree((route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
  await submit(page).click();

  await expect(page.locator('[data-error-summary]')).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeFocused();
  for (const [id, message] of [
    ['#f-name', 'Please enter your name.'],
    ['#f-email', 'Please enter your email address.'],
  ] as const) {
    const field = page.locator(id);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(message);
  }
  await expect(page.getByText('Please confirm you are happy to be contacted')).toBeVisible();

  await page.locator('#f-email').fill('not-an-email');
  await expect(page.locator('#f-email')).toHaveAccessibleDescription(/valid email address/);

  await page.getByLabel('Phone', { exact: true }).check();
  await submit(page).click();
  await expect(page.getByText(/add a phone number/)).toBeVisible();
  expect(received).toHaveLength(0);
});

test('valid submission is sent once and success is shown only after confirmation', async ({ page, mockFormspree }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const received = mockFormspree(async (route) => {
    await gate; // hold the response so we can observe the sending state
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"next":"/thanks"}' });
  });

  await fillValidForm(page);
  await page.getByLabel('Message').fill('Dummy QA message: please ignore.');
  await submit(page).click();

  await expect(submit(page)).toBeDisabled();
  await expect(submit(page)).toHaveText('Sending…');
  await expect(status(page)).not.toContainText('Thank you');
  // Duplicate attempts while sending are ignored.
  await submit(page).click({ force: true });
  await page.locator('[data-enquiry]').evaluate((f: HTMLFormElement) => f.requestSubmit());

  release();
  await expect(status(page)).toContainText('Thank you, your enquiry has been sent.');
  await expect(status(page)).toBeFocused();
  expect(received).toHaveLength(1);

  const body = received[0];
  expect(body).toMatchObject({
    name: 'Test Person',
    email: 'test.person@example.com',
    treatment: 'Botox®',
    contactMethod: 'email',
    message: 'Dummy QA message: please ignore.',
    _gotcha: '',
  });
  expect(body.consent).toMatch(/^Yes/);
  // The recipient is configured in Formspree, never sent from (or present in) the browser.
  expect(JSON.stringify(body)).not.toMatch(/gmail|recipient|_to/i);

  // After success the form is cleared (so it can't be resent by accident) and ready for another enquiry.
  await expect(page.getByLabel('Full name')).toHaveValue('');
  await expect(submit(page)).toBeEnabled();
  await fillValidForm(page);
  await submit(page).click();
  await expect(status(page)).toContainText('Thank you, your enquiry has been sent.');
  expect(received).toHaveLength(2);
});

test('server failures retry once automatically, then offer a manual retry that succeeds', async ({ page, mockFormspree }) => {
  let calls = 0;
  const received = mockFormspree((route) => {
    calls += 1;
    return calls <= 2
      ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await fillValidForm(page);
  await submit(page).click();
  await expect(status(page)).toContainText('wasn’t sent', { timeout: 10_000 });
  await expect(status(page)).not.toContainText('Thank you');
  expect(received).toHaveLength(2); // initial attempt + one automatic retry
  await expect(page.getByLabel('Full name')).toHaveValue('Test Person'); // input preserved

  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(status(page)).toContainText('Thank you, your enquiry has been sent.');
  expect(received).toHaveLength(3);
});

test('network failure is reported honestly', async ({ page, mockFormspree }) => {
  mockFormspree((route) => route.abort('internetdisconnected'));
  await fillValidForm(page);
  await submit(page).click();
  await expect(status(page)).toContainText('couldn’t reach the enquiry service', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('a rejected submission shows the reason without a retry loop', async ({ page, mockFormspree }) => {
  const received = mockFormspree((route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ field: 'email', message: 'should be an email' }] }),
    }),
  );
  await fillValidForm(page);
  await submit(page).click();
  await expect(status(page)).toContainText('should be an email');
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  expect(received).toHaveLength(1);
});

test('a 200 response without confirmation is not treated as success', async ({ page, mockFormspree }) => {
  mockFormspree((route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html>ok</html>' }));
  await fillValidForm(page);
  await submit(page).click();
  await expect(status(page)).toContainText('wasn’t sent');
  await expect(status(page)).not.toContainText('Thank you');
});
