# Pure MedSpa: website concept

A responsive, single-page marketing site (plus a draft privacy page) for Pure MedSpa, Austin, Texas.
**Status: concept.** Business details, the treatment menu and provider information are placeholders until the
owner confirms them (see [Launch checklist](#launch-checklist)).

## Run it

Requires Node 18+ (tested on Node 20.18).

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build at http://localhost:4173
npm test           # unit tests (Vitest)
npm run typecheck  # TypeScript only
```

## Stack and structure

Vite + TypeScript with no UI framework. A one-page marketing site doesn't need one, so the shipped JS is ~6 kB gzipped.

```
index.html              Main page markup (semantic sections, dialog, form)
privacy.html            Draft privacy notice (pending legal review)
src/main.ts             Entry: wires up all modules
src/booking.ts          Google Calendar booking configuration + CTA wiring
src/enquiry.ts          Enquiry form: validation UI, demo/live submission
src/validation.ts       Pure validation rules (unit tested)
src/treatments-ui.ts    Category tabs, treatment detail dialog, form <select>
src/data/treatments.ts  Single source of truth for the (provisional) treatment menu
src/nav.ts              Header state, full-screen mobile menu, active-section highlight, deep-link settling
src/hero.ts             Pinned 3-chapter cinematic hero + background film (see "Hero" below)
src/motion.ts           Scroll reveals (respect reduced motion)
src/styles/main.css     Design tokens and all component styles
public/images/          Optimized AVIF/WebP variants + og-image.jpg (generated)
public/videos/          hero-loop.mp4 (10 s, 1280x720, 1.9 MB) background film
source-assets/          Original 2400×1792 PNGs (not shipped); see note below
scripts/optimize_images.py  Regenerates public/images from source-assets (needs Pillow)
```

Fonts (Cormorant Garamond + Manrope) are self-hosted via Fontsource, with no third-party font requests.

**Asset note:** the hero film is `Water_flowing_over_stone_ledge_20261025135703_gwr_video_mvp.mp4` from the
owner's Downloads folder (the watermark-free version), copied to `public/videos/hero-loop.mp4`. Its first frame is
`source-assets/hero-video-first-frame.png`, used as the poster. Confirm usage rights for the film like the stills.
The original PNGs live in `source-assets/` so they aren't deployed; run `npm run images` after replacing any source
image (the script never upscales).

## Hero

Dark "evening stone" art direction: three full-bleed chapters (film, then portrait, then studio), each with its
own copy and scrim.

- **Motion allowed:** the hero is pinned for 3 screens of scroll; the visible chapter follows scroll position
  (class toggles animated in CSS, so fast scrolling and anchor jumps land cleanly, without scrubbing).
- **Reduced motion / no JS:** the same chapters render as stacked static panels; the film is never downloaded.
- **Film:** loads only when motion is allowed and Save-Data / 2G isn't set; pauses off-screen, in background tabs
  and on chapters 2 and 3; has a visible pause/play button. The clip doesn't loop seamlessly, so it dissolves to the
  poster (its first frame) in the last second and restarts underneath.
- Scrims were checked against the brightest 5% of pixels behind each text block at 320 to 1440 px (≥ 4.5:1).

## Google Calendar booking

Every "Book a Consultation" CTA (header, mobile menu, hero chapters 1 and 3, consultation section, treatment
dialog, footer) is
marked `data-book` and wired by `src/booking.ts` from one variable:

| `VITE_GOOGLE_CALENDAR_BOOKING_URL` | Behavior |
| --- | --- |
| not set (current) | CTAs scroll to the booking section, which says online booking isn't connected yet and offers the enquiry form. No fake times or confirmations. |
| `https://calendar.app.google/…` (short share link) | CTAs open Google's booking page in a new tab (`rel="noopener noreferrer"`). |
| `https://calendar.google.com/calendar/appointments/schedules/…` | Booking page is embedded in the booking section (Google's documented `?gv=true` iframe) with an "Open booking page" fallback link. |
| anything else | Ignored; a console warning explains why. Only `https` Google Calendar hosts are accepted. |

### Setup (done by the account owner, signed in to Google)

1. In Google Calendar for the account that will manage bookings, choose **Create → Appointment schedule**, and
   set duration, availability, and booking form questions. Keep form questions to contact details; don't ask for
   medical history.
2. Save, open the schedule, click **Share**, and copy the booking page link. Choose the full
   `calendar.google.com/calendar/appointments/schedules/…` link if you want it embedded on the page.
3. Create `.env.local` in the project root (it's git-ignored):
   ```
   VITE_GOOGLE_CALENDAR_BOOKING_URL=https://calendar.google.com/calendar/appointments/schedules/XXXX
   ```
4. Restart `npm run dev` (or rebuild). On a host such as Netlify/Vercel, add the same variable in the project's
   environment settings and redeploy.

No sign-in, API keys, or tokens are needed or stored: the URL is a public link. Feature availability differs
between free Google accounts and paid Workspace / Google One plans, so check Google's current terms.
**Data flow:** when a visitor books, their details go to Google and appear on the owner's calendar. In embed mode,
Google also receives standard request data (e.g. IP address) when the iframe loads.

## Enquiry form

The form validates name, email, optional phone (required if "Phone" is the preferred contact method),
treatment interest, contact method, optional message (≤1000 chars, with a "no medical details" hint) and
consent.

- **Demo mode (current):** with no endpoint configured, the form is labeled as a demo, and a valid submission
  explicitly says **nothing was sent or stored**.
- **Live mode:** set `VITE_ENQUIRY_ENDPOINT` to a URL that accepts a JSON `POST` (e.g. a Formspree form endpoint,
  or your own serverless function that emails the clinic). The form shows a sending state, blocks duplicate
  submits, and only shows success on a 2xx response; failures show an error and keep the user's input.
  **Data sent:** `name, email, phone, treatment, contactMethod, message, consent`, to that endpoint only.
  Update `privacy.html` with the chosen provider before going live. Keep any email/API secrets server-side.

## Launch checklist

Information the owner must supply or confirm (search the code for `Pending`, `pending` and `[` placeholders):

- [ ] Which treatments are offered (`src/data/treatments.ts`), and the brands/products used
- [ ] Provider name(s), role, licensure/training, and medical oversight (About section)
- [ ] Street address, phone, business email, hours, social accounts (Contact + footer)
- [ ] Credentials/affiliations for the trust strip (currently "To be confirmed")
- [ ] Google Calendar booking URL (above), then test every CTA on desktop and mobile
- [ ] Enquiry delivery endpoint (above)
- [ ] Privacy notice reviewed by a qualified adviser; legal business name and privacy contact
- [ ] Production domain: absolute `og:image` URL and canonical link in `index.html`
- [ ] Authorization to use the Pure MedSpa name/branding; licensing of imagery (current images appear
      AI-generated: confirm usage rights and that they aren't presented as the real clinic or real clients)
- [ ] Medical/marketing copy reviewed by the clinic's medical director
