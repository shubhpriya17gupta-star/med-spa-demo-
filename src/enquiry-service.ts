/**
 * Enquiry delivery via Formspree (https://formspree.io).
 *
 * The site only knows a public form ID. The recipient address (e.g. the clinic inbox) is set and
 * verified in the Formspree dashboard, so it can be changed without a code change and never
 * appears in the bundle. No API keys or secrets are used client-side.
 */

export type EnquiryConfig =
  | { status: 'not-configured' }
  | { status: 'invalid'; reason: string }
  | { status: 'live'; endpoint: string };

const FORM_ID = /^[A-Za-z0-9]{6,16}$/;

/** Accepts a bare form ID ("xyzabcde") or the full endpoint ("https://formspree.io/f/xyzabcde"). */
export function resolveEnquiryConfig(raw: string | undefined): EnquiryConfig {
  const value = raw?.trim();
  if (!value) return { status: 'not-configured' };

  let id = value;
  if (value.includes('/')) {
    const match = /^https:\/\/formspree\.io\/f\/([^/?#]+)\/?$/.exec(value);
    if (!match) return { status: 'invalid', reason: 'expected a Formspree form ID or https://formspree.io/f/<id>' };
    id = match[1];
  }
  if (!FORM_ID.test(id)) return { status: 'invalid', reason: `"${id}" is not a valid Formspree form ID` };
  return { status: 'live', endpoint: `https://formspree.io/f/${id}` };
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: 'network' | 'timeout' | 'server' | 'rate-limited' | 'rejected'; message: string };

export interface SubmitOptions {
  fetchImpl?: typeof fetch;
  /**
   * Automatic retries for failures where the request almost certainly wasn't processed
   * (connection errors and 5xx). Timeouts are not retried automatically, because the
   * service may already have accepted the enquiry and a retry could send it twice.
   */
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function attempt(endpoint: string, payload: Record<string, string>, fetchImpl: typeof fetch, timeoutMs: number): Promise<SubmitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    console.error('[enquiry] network error', err);
    if (controller.signal.aborted) {
      return { ok: false, kind: 'timeout', message: 'The enquiry service took too long to respond.' };
    }
    return { ok: false, kind: 'network', message: 'We couldn’t reach the enquiry service.' };
  } finally {
    clearTimeout(timer);
  }

  let body: { ok?: boolean; errors?: { message?: string }[] } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON body: fall through to status-based handling below.
  }

  // Success only when the service explicitly confirms it accepted the submission.
  if (res.ok && body.ok === true) return { ok: true };

  console.error('[enquiry] submission not accepted', res.status, body);
  if (res.status === 429) {
    return { ok: false, kind: 'rate-limited', message: 'Too many enquiries were sent from this connection.' };
  }
  if (res.status >= 500) return { ok: false, kind: 'server', message: 'The enquiry service had a temporary problem.' };
  const detail = body.errors?.map((e) => e.message).filter(Boolean).join(' ');
  return { ok: false, kind: 'rejected', message: detail || 'The enquiry service didn’t accept the submission.' };
}

export async function submitEnquiry(
  endpoint: string,
  payload: Record<string, string>,
  { fetchImpl = fetch, retries = 1, retryDelayMs = 1500, timeoutMs = 15000 }: SubmitOptions = {},
): Promise<SubmitResult> {
  let result = await attempt(endpoint, payload, fetchImpl, timeoutMs);
  for (let i = 0; i < retries && !result.ok && (result.kind === 'network' || result.kind === 'server'); i++) {
    await wait(retryDelayMs);
    result = await attempt(endpoint, payload, fetchImpl, timeoutMs);
  }
  return result;
}
