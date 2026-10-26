import { afterEach, describe, expect, it, vi } from 'vitest';
import { initBooking, resolveBookingConfig } from './booking';

describe('resolveBookingConfig', () => {
  it('reports a missing URL', () => {
    expect(resolveBookingConfig(undefined)).toEqual({ status: 'missing' });
    expect(resolveBookingConfig('   ')).toEqual({ status: 'missing' });
  });

  it('rejects non-Google, non-https and malformed URLs', () => {
    expect(resolveBookingConfig('https://example.com/book').status).toBe('invalid');
    expect(resolveBookingConfig('http://calendar.app.google/abc').status).toBe('invalid');
    expect(resolveBookingConfig('not a url').status).toBe('invalid');
    expect(resolveBookingConfig('https://calendar.google.com.evil.com/x').status).toBe('invalid');
  });

  it('accepts a short booking link without embedding it', () => {
    expect(resolveBookingConfig('https://calendar.app.google/AbC123')).toEqual({
      status: 'ready',
      url: 'https://calendar.app.google/AbC123',
      embedUrl: null,
    });
  });

  it('builds an embed URL for full appointment-schedule links', () => {
    const cfg = resolveBookingConfig('https://calendar.google.com/calendar/appointments/schedules/AcZssZ1-x_y');
    expect(cfg).toMatchObject({
      status: 'ready',
      embedUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1-x_y?gv=true',
    });
  });
});

describe('initBooking', () => {
  const markup = `
    <a href="#book" data-book>Book a Consultation</a>
    <a href="#book" data-book>Book a Consultation</a>
    <section data-booking-panel data-state="pending">
      <div data-booking-frame hidden></div>
      <a data-booking-link href="#book" hidden>Open booking page</a>
    </section>`;

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps CTAs on the on-page notice when no URL is configured', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    document.body.innerHTML = markup;
    initBooking({ status: 'missing' });
    document.querySelectorAll<HTMLAnchorElement>('[data-book]').forEach((a) => {
      expect(a.getAttribute('href')).toBe('#book');
      expect(a.target).toBe('');
    });
    expect(document.querySelector<HTMLElement>('[data-booking-panel]')!.dataset.state).toBe('pending');
    expect(document.querySelector<HTMLElement>('[data-booking-link]')!.hidden).toBe(true);
  });

  it('warns and stays in the pending state for an invalid URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = markup;
    initBooking(resolveBookingConfig('https://example.com'));
    expect(warn).toHaveBeenCalled();
    expect(document.querySelector<HTMLElement>('[data-booking-panel]')!.dataset.state).toBe('pending');
  });

  it('points every CTA at a short booking link in a new tab', () => {
    document.body.innerHTML = markup;
    initBooking(resolveBookingConfig('https://calendar.app.google/AbC123'));
    document.querySelectorAll<HTMLAnchorElement>('[data-book]').forEach((a) => {
      expect(a.href).toBe('https://calendar.app.google/AbC123');
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener noreferrer');
      expect(a.getAttribute('aria-label')).toMatch(/new tab/);
    });
    expect(document.querySelector<HTMLElement>('[data-booking-panel]')!.dataset.state).toBe('link');
  });

  it('embeds full schedule links and keeps CTAs on the booking section', () => {
    document.body.innerHTML = markup;
    initBooking(resolveBookingConfig('https://calendar.google.com/calendar/appointments/schedules/AcZ'));
    const iframe = document.querySelector('iframe')!;
    expect(iframe.src).toContain('gv=true');
    expect(iframe.title).toMatch(/booking/i);
    expect(document.querySelector<HTMLAnchorElement>('[data-book]')!.getAttribute('href')).toBe('#book');
    expect(document.querySelector<HTMLElement>('[data-booking-link]')!.hidden).toBe(false);
  });
});
