# Master Prompt — Build Pure MedSpa

You are the lead product designer and senior frontend engineer for a premium local-business website. Build a polished, distinctive, responsive website concept for **Pure MedSpa**, an aesthetics and medical-spa business serving Austin, Texas.

Read `CLAUDE.md` first and follow it.

## Important working method
Do not immediately start generating code. First inspect the repository and report:
1. What files and technology already exist.
2. What can be reused.
3. What is missing.
4. Your proposed implementation plan and any assumptions.

Then proceed with the smallest sensible plan. If the repository is empty, choose an appropriate maintainable stack for a high-quality marketing site, explain the choice briefly, and build it.

## Product goal
The website should feel premium enough to present as a concept to a prospective med-spa client, while making it easy for visitors to understand services and enquire about a consultation. Visual quality matters, but so do clarity, trust, accessibility, speed, and functioning interactions.

## Creative direction
Create an original visual identity for Pure MedSpa:
- Editorial luxury rather than a generic clinic template.
- Warm ivory and stone neutrals, soft taupe, subtle muted teal/olive accents, natural textures, and carefully controlled contrast.
- Sophisticated typography with an elegant display face and a highly readable body face.
- Large, art-directed imagery, thoughtful cropping, generous negative space, asymmetric compositions where useful, and crisp alignment.
- A cinematic hero with restrained depth and a memorable composition.
- Refined service discovery cards, clear section rhythm, subtle motion, and a strong booking CTA.
- Use 3D only if it adds genuine value and can remain performant. A subtle layered effect or carefully built CSS depth is preferable to an unnecessary heavy scene.
- The website must feel designed, not like a standard generated landing-page template.

Do not copy the exact layout, text, logo, or assets of the dental reference or the AURA reference. Use them only as broad inspiration for quality, service hierarchy, and immersive atmosphere.

## Service scope
Start with these proposed categories, but label the menu as provisional until the owner confirms it:
- Injectables: Botox, Dysport, dermal fillers including Juvéderm and Restylane.
- Threads: consultation-led facial-thread services.
- Anti-aging and skincare: microneedling, microblading, skincare products, and related services.

Do not imply every service is confirmed or currently offered. Do not invent prices, discounts, provider credentials, client outcomes, testimonials, review scores, awards, address, phone number, opening hours, or booking links. Use clearly marked placeholders for facts that need owner confirmation.

## Suggested page experience
1. Header: clean wordmark, anchor navigation, obvious “Book a Consultation” CTA, accessible mobile menu.
2. Hero: distinctive image or image/video background with an accessible overlay, strong headline, concise supporting copy, and two CTAs.
3. Trust/approach section: measured language and only verified facts.
4. Treatment categories: visually differentiated cards with a clear title, short benefit-focused description, and “Explore treatment” interaction.
5. Editorial feature: one visually rich section about personalized aesthetic care, without medical guarantees.
6. About/provider section: clearly marked placeholders until accurate business details are provided.
7. Consultation section: low-friction enquiry form.
8. FAQ: practical general information; no diagnosis or individualized treatment advice.
9. Footer: contact placeholders and navigation.

Use compelling but responsible copy. Example direction, not mandatory wording:
- Headline: “A more considered approach to aesthetic care.”
- Supporting copy: “Explore personalized aesthetic treatments in a calm, welcoming setting.”
- Primary CTA: “Book a Consultation”
- Secondary CTA: “Explore Treatments”

## Assets
First inspect existing assets. If suitable assets are absent, create a clearly organized asset plan and use available local assets or reliable image sources supported by the project workflow. Do not invent local file paths or leave broken image references. If remote images are used, document their source and any licensing/production caveats. Keep a consistent art direction across the hero, treatment cards, and supporting sections. Do not embed text into images where HTML text is more accessible and editable.

## Functional requirements
- Responsive navigation and working section links.
- Working CTAs that scroll to the correct sections or open configured destinations.
- Accessible, validated enquiry form with clear success/error feedback.
- If there is no backend/email/CRM integration, explicitly mark the form as a demo and do not falsely claim that enquiries are being delivered.
- No chatbot.
- No fake booking calendar, fake scarcity, fabricated reviews, or decorative controls that do nothing.
- Use reduced-motion settings and keyboard-accessible interactions.

## Technical requirements
- Reuse the repository's current stack if it is viable.
- Use reusable components and centralized design tokens.
- Optimize image size and loading.
- Add title, meta description, semantic landmarks, and useful alt text.
- Run the available build, lint, typecheck, and tests.
- Test mobile and desktop layout and check for console/build errors where possible.
- Keep secrets out of source control. Only add environment variables if a real integration requires them.

## Final deliverables
When finished, report:
1. What you built.
2. Key design decisions.
3. Files changed/created.
4. Commands to run the site locally.
5. Checks run and their actual results.
6. What remains placeholder/demo-only.
7. The exact owner information and integrations needed before launch.

Aim for a polished first version, then critique your own result as a designer, a first-time visitor, a mobile user, and a business owner. Fix the most important issues before declaring it complete.
