# Pure MedSpa — Project Instructions

## Project goal
Build a polished, premium, lead-generation website concept for Pure MedSpa in Austin, Texas. This is a concept project unless the business owner has explicitly authorized the use of their branding, claims, testimonials, provider details, and contact information.

The visual direction combines:
- The clear service hierarchy, reusable service cards, and CTA structure of a strong local-business website.
- The immersive imagery and premium atmosphere of a luxury med-spa brand.
- A distinct Pure MedSpa identity. Do not copy another website's exact layout, wording, branding, or assets.

## First action: inspect before building
Before making changes:
1. Inspect the entire repository, including package files, source code, public assets, and existing scripts.
2. Identify the framework, build tool, routing, styling approach, and current run commands.
3. Summarize the existing structure and propose the smallest sensible implementation plan.
4. Do not replace the stack or rewrite working code without a clear reason.
5. If this is an empty folder, choose a simple, maintainable stack appropriate for a responsive marketing site and explain the choice briefly.

## Brand and art direction
- Brand: Pure MedSpa
- Market: Austin, Texas
- Positioning: refined, science-informed aesthetics with a calm, welcoming, premium experience.
- Visual mood: editorial luxury, warm ivory, soft sand, muted taupe, restrained deep teal/olive accents, natural stone, soft daylight, tasteful metallic details used sparingly.
- Typography: elegant display type paired with highly readable body text.
- Layout: generous but intentional whitespace, strong visual hierarchy, clear alignment, balanced asymmetry, carefully composed imagery.
- Motion: restrained, smooth transitions; subtle scroll reveals and hover states. Respect reduced-motion preferences.
- 3D: use only where it improves the experience. Prefer lightweight CSS depth or a small, performant effect over heavy 3D dependencies. Do not sacrifice accessibility, mobile usability, or page speed for effects.
- Avoid generic template appearance, excessive gradients, too many rounded cards, fake glassmorphism, clutter, stock-photo overload, and gratuitous animation.

## Core pages/sections
Build the first version as a strong single-page website unless the existing project makes another structure more appropriate:
1. Header/navigation with logo wordmark, Services, About, FAQs, Contact, and a prominent Book a Consultation CTA.
2. Hero with premium imagery, concise headline, supporting copy, primary CTA, and secondary service-exploration CTA.
3. Trust strip with only verifiable claims; use neutral placeholders for credentials, years of experience, ratings, or awards until supplied.
4. Treatment discovery with clear categories:
   - Injectables: Botox, Dysport, dermal fillers including Juvéderm and Restylane, only as services confirmed by the owner.
   - Threads: describe as a consultation-led treatment; avoid guaranteeing results.
   - Anti-aging and skincare: microneedling, microblading, skincare products, and other services only if confirmed by the owner.
5. Featured treatment detail or editorial split section.
6. About/provider section with placeholders where facts are not available.
7. Consultation/booking CTA.
8. FAQs with cautious, non-diagnostic answers and a prompt to consult a qualified provider.
9. Contact/enquiry form with name, email, phone (optional), treatment interest, and message/consent as appropriate.
10. Footer with verified contact details and navigation.

Do not invent a street address, phone number, provider names, licenses, testimonials, ratings, before/after outcomes, prices, offers, or medical claims. Use clearly labeled placeholders until verified information is provided.

## Conversion requirements
- Make the main CTA obvious above the fold and repeat it at sensible points.
- Use specific CTA labels such as “Book a Consultation” and “Explore Treatments.”
- Make forms accessible, validate inputs, show success/error states, and never pretend a message was sent if no backend is connected.
- If no booking service or backend exists, clearly label the form as a front-end demo and document what is required to make it live.
- No chatbot.
- Do not implement fake urgency, fake scarcity, or fabricated social proof.

## Medical, legal, and privacy care
- Do not diagnose, promise outcomes, or imply treatments are suitable for everyone.
- Use qualified, measured language and recommend an individual consultation.
- Do not publish invented medical/provider credentials or fabricated reviews.
- Do not collect sensitive medical history in a basic marketing enquiry form.
- If adding analytics, tracking, a CRM, email delivery, or booking integration, explain what data is sent and to which service.
- Do not add API keys or secrets to client-side code.

## Engineering standards
- Inspect the existing stack before choosing dependencies.
- Prefer reusable components and consistent design tokens.
- Use semantic HTML, accessible labels, keyboard navigation, visible focus states, sufficient contrast, and descriptive alt text.
- Ensure responsive behavior for small phones, tablets, laptops, and large screens.
- Optimize images; lazy-load below-the-fold imagery; avoid autoplay audio.
- Respect `prefers-reduced-motion`.
- Avoid unnecessary dependencies and oversized assets.
- Keep code readable and modular. Do not hide errors or silently swallow failed requests.
- Add appropriate metadata, page title, description, favicon placeholder, and social preview metadata where supported.
- Do not claim SEO, accessibility, security, or performance compliance without checking.

## Workflow
For each major phase:
1. State the goal and inspect relevant files.
2. Implement a coherent slice.
3. Run available lint, typecheck, tests, and build commands.
4. Fix errors introduced by your changes.
5. Summarize changed files, checks run, known limitations, and the next best step.

Do not stop at a static screenshot-like mockup. Implement real navigation, responsive layouts, interactive states, and form validation. Do not invent integrations that are not configured.

## Definition of done
- The project runs using documented commands.
- The main page looks polished on mobile and desktop.
- Navigation and CTAs work.
- The enquiry form validates and communicates its demo/live status honestly.
- No chatbot is present.
- No invented business facts or fake social proof remain.
- No secrets are committed.
- Build/lint/tests are run when available, with results reported honestly.
