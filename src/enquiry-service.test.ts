import { describe, expect, it, vi } from 'vitest';
import { resolveEnquiryConfig, submitEnquiry } from './enquiry-service';

describe('resolveEnquiryConfig', () => {
  it('is not configured without a value', () => {
    expect(resolveEnquiryConfig(undefined)).toEqual({ status: 'not-configured' });
    expect(resolveEnquiryConfig('  ')).toEqual({ status: 'not-configured' });
  });

  it('accepts a bare form ID or the full Formspree endpoint', () => {
    const expected = { status: 'live', endpoint: 'https://formspree.io/f/xyzAbc12' };
    expect(resolveEnquiryConfig('xyzAbc12')).toEqual(expected);
    expect(resolveEnquiryConfig('https://formspree.io/f/xyzAbc12')).toEqual(expected);
  });

  it('rejects other URLs and malformed IDs', () => {
    expect(resolveEnquiryConfig('https://evil.example/f/xyzAbc12').status).toBe('invalid');
    expect(resolveEnquiryConfig('http://formspree.io/f/xyzAbc12').status).toBe('invalid');
    expect(resolveEnquiryConfig('abc').status).toBe('invalid');
    expect(resolveEnquiryConfig('someone@example.com').status).toBe('invalid');
  });
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const opts = { retryDelayMs: 0 };
const payload = { name: 'Test', email: 'test@example.com' };

describe('submitEnquiry', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});

  it('succeeds only when the service confirms acceptance', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { ok: true }));
    expect(await submitEnquiry('https://formspree.io/f/x', payload, { ...opts, fetchImpl })).toEqual({ ok: true });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('does not treat a 200 without confirmation as success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<html>ok</html>', { status: 200 }));
    expect((await submitEnquiry('u', payload, { ...opts, fetchImpl })).ok).toBe(false);
  });

  it('retries once on a network error, then succeeds', async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(json(200, { ok: true }));
    expect(await submitEnquiry('u', payload, { ...opts, fetchImpl })).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports a server error after the retry is exhausted', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(503, {}));
    expect(await submitEnquiry('u', payload, { ...opts, fetchImpl })).toMatchObject({ ok: false, kind: 'server' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry validation rejections, and surfaces the reason', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(422, { errors: [{ message: 'should be an email' }] }));
    const result = await submitEnquiry('u', payload, { ...opts, fetchImpl });
    expect(result).toMatchObject({ ok: false, kind: 'rejected', message: 'should be an email' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports rate limiting without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(429, {}));
    expect(await submitEnquiry('u', payload, { ...opts, fetchImpl })).toMatchObject({ kind: 'rate-limited' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not auto-retry a timeout (the enquiry may already have been accepted)', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    );
    const result = await submitEnquiry('u', payload, { ...opts, timeoutMs: 10, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toMatchObject({ ok: false, kind: 'timeout' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
