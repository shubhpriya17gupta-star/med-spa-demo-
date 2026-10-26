import { findTreatment } from './data/treatments';
import { submitEnquiry, type EnquiryConfig, type SubmitOptions } from './enquiry-service';
import { validateEnquiry, type EnquiryErrors, type EnquiryValues } from './validation';

/**
 * Consultation enquiry form.
 *
 * Live: submissions go to Formspree, and success is shown only after Formspree confirms it
 * accepted the enquiry. Not configured: input is validated in the browser, the form is labelled
 * as not yet live, and nothing is sent or stored.
 */
export function initEnquiryForm(
  config: EnquiryConfig,
  submitOptions: SubmitOptions = {},
): { preselect: (treatmentId: string) => void } {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  if (!form) throw new Error('Enquiry form markup is missing');

  const live = config.status === 'live' ? config : null;
  const banner = form.querySelector<HTMLElement>('[data-mode-banner]')!;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const phoneOptional = form.querySelector<HTMLElement>('[data-phone-optional]')!;
  const fields = form.elements;

  form.dataset.mode = live ? 'live' : 'not-live';
  if (live) {
    banner.hidden = true;
  } else {
    banner.innerHTML =
      '<strong>Not yet live:</strong> online enquiries aren’t connected yet. You can fill in the form, but it ' +
      '<strong>will not be sent or stored</strong>.';
  }
  if (config.status === 'invalid') {
    console.warn(`[enquiry] VITE_FORMSPREE_FORM_ID ignored: ${config.reason}.`);
  } else if (config.status === 'not-configured' && import.meta.env.DEV) {
    console.info('[enquiry] VITE_FORMSPREE_FORM_ID is not set; the form is in not-live mode. See README.md.');
  }

  const read = (): EnquiryValues => {
    const data = new FormData(form);
    const str = (k: string) => String(data.get(k) ?? '');
    return {
      name: str('name'),
      email: str('email'),
      phone: str('phone'),
      treatment: str('treatment'),
      contactMethod: str('contactMethod'),
      message: str('message'),
      consent: data.get('consent') === 'on',
    };
  };

  const control = (name: string) => {
    const c = fields.namedItem(name);
    if (c instanceof RadioNodeList) return c[0] as HTMLInputElement;
    return c as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  };

  const showErrors = (errors: EnquiryErrors, only?: string) => {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((slot) => {
      const name = slot.dataset.errorFor as keyof EnquiryValues;
      if (only && name !== only) return;
      const msg = errors[name] ?? '';
      slot.textContent = msg;
      const targets = name === 'contactMethod' ? [...form.querySelectorAll('input[name="contactMethod"]')] : [control(name)];
      targets.forEach((c) => (msg ? c?.setAttribute('aria-invalid', 'true') : c?.removeAttribute('aria-invalid')));
    });
  };

  // Re-validate a field once the user leaves it, but only if it has already been flagged
  // or the form has been submitted, so people aren't scolded while still typing.
  let attempted = false;
  form.addEventListener('focusout', (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.name || (!attempted && target.getAttribute('aria-invalid') !== 'true')) return;
    showErrors(validateEnquiry(read()), target.name);
  });

  // Keep flagged fields' messages current while typing, so they don't change (and shift
  // the layout under the pointer) when the user clicks the next control.
  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name && target.getAttribute('aria-invalid') === 'true') {
      showErrors(validateEnquiry(read()), target.name);
    }
  });

  form.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'contactMethod') {
      phoneOptional.textContent = target.value === 'phone' ? '(required for phone contact)' : '(optional)';
      if (attempted) showErrors(validateEnquiry(read()), 'phone');
    }
    if (attempted && target.type === 'checkbox') showErrors(validateEnquiry(read()), target.name);
  });

  const setStatus = (tone: 'demo' | 'success' | 'error', title: string, detail: string, action?: HTMLButtonElement) => {
    status.dataset.tone = tone;
    const strong = document.createElement('strong');
    strong.textContent = title;
    const p1 = document.createElement('p');
    p1.append(strong);
    const p2 = document.createElement('p');
    p2.textContent = detail;
    status.replaceChildren(p1, p2, ...(action ? [action] : []));
    status.focus();
  };

  const actionButton = (label: string, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost btn--small form-status__action';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  };

  const setBusy = (busy: boolean) => {
    submitting = busy;
    submit.disabled = busy;
    submit.setAttribute('aria-busy', String(busy));
    submit.textContent = busy ? 'Sending…' : 'Send Enquiry';
  };

  const payloadFor = (v: EnquiryValues): Record<string, string> => ({
    name: v.name.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    treatment: v.treatment === 'not-sure' ? 'Not sure yet' : findTreatment(v.treatment)?.name ?? '',
    contactMethod: v.contactMethod || 'email',
    message: v.message.trim(),
    consent: v.consent ? 'Yes, agreed to be contacted about this enquiry' : 'No',
    // Timestamped so Gmail doesn't fold repeat enquiries from the same name into one thread.
    _subject: `New consultation enquiry from ${v.name.trim()} (${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })})`,
    // Honeypot: real visitors never see or fill this; Formspree discards submissions that include it.
    _gotcha: String(new FormData(form).get('_gotcha') ?? ''),
  });

  let submitting = false;

  const deliver = async (values: EnquiryValues) => {
    if (!live || submitting) return;
    setBusy(true);
    status.replaceChildren();
    delete status.dataset.tone;
    const result = await submitEnquiry(live.endpoint, payloadFor(values), submitOptions);
    setBusy(false);

    if (result.ok) {
      // Clear the form so the same enquiry can't be resent by accident, but leave it ready
      // for a new one straight away.
      form.reset();
      attempted = false;
      phoneOptional.textContent = '(optional)';
      setStatus(
        'success',
        'Thank you, your enquiry has been sent.',
        'The team will be in touch using your preferred contact method. You can send another enquiry using the form above.',
      );
      return;
    }

    const next =
      result.kind === 'rejected'
        ? 'Please check your details and try again.'
        : result.kind === 'rate-limited'
          ? 'Please wait a few minutes before trying again.'
          : 'Please check your connection and try again. Your details are still in the form.';
    setStatus(
      'error',
      `Sorry, your enquiry wasn’t sent. ${result.message}`,
      next,
      result.kind === 'rejected' ? undefined : actionButton('Try again', () => void deliver(read())),
    );
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitting) return;
    attempted = true;

    const values = read();
    const errors = validateEnquiry(values);
    showErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      summary.hidden = false;
      status.replaceChildren();
      delete status.dataset.tone;
      control(firstInvalid)?.focus();
      return;
    }
    summary.hidden = true;

    if (!live) {
      setStatus(
        'demo',
        'Not sent: online enquiries aren’t live yet.',
        'Your details passed validation, but this form isn’t connected to the clinic yet, so nothing was delivered or stored.',
      );
      return;
    }
    void deliver(values);
  });

  return {
    preselect(treatmentId: string) {
      const select = control('treatment') as HTMLSelectElement | null;
      if (select) select.value = treatmentId;
      document.getElementById('contact')?.scrollIntoView({ block: 'start' });
      control('name')?.focus({ preventScroll: true });
    },
  };
}
