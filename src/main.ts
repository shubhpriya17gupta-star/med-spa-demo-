import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource-variable/manrope';
import './styles/main.css';

import { initBooking, resolveBookingConfig } from './booking';
import { initEnquiryForm } from './enquiry';
import { resolveEnquiryConfig } from './enquiry-service';
import { initHero } from './hero';
import { initReveal } from './motion';
import { initNav } from './nav';
import { initTreatmentDialog, initTreatmentTabs, populateTreatmentSelect } from './treatments-ui';

document.documentElement.classList.add('js');

// The hero sets its final (pinned) layout before anything measures the page.
initHero();
populateTreatmentSelect();
const enquiry = initEnquiryForm(resolveEnquiryConfig(import.meta.env.VITE_FORMSPREE_FORM_ID));
const openTreatment = initTreatmentDialog((id) => enquiry.preselect(id));
const selectCategory = initTreatmentTabs(openTreatment);
// Booking runs after the dialog is set up so its CTA is wired along with the rest.
initBooking(resolveBookingConfig(import.meta.env.VITE_GOOGLE_CALENDAR_BOOKING_URL));
initNav();
initReveal();

// Links such as "Explore injectables & threads" open their category, then scroll as normal.
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLElement>('[data-select-tab]');
  if (link?.dataset.selectTab) selectCategory(link.dataset.selectTab);
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
