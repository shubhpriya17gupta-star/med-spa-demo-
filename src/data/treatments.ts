/**
 * PROPOSED treatment menu, pending confirmation by the Pure MedSpa owner.
 * Copy is deliberately general: no prices, durations, outcomes or suitability claims.
 * Remove or edit any entry the clinic does not offer before launch.
 */

export type CategoryId = 'injectables' | 'threads' | 'skin';

export interface Treatment {
  id: string;
  category: CategoryId;
  name: string;
  /** One line shown in the list. */
  summary: string;
  /** Paragraphs shown in the detail dialog. */
  overview: string[];
  /** Topics a provider would typically cover at consultation. */
  discuss: string[];
}

export interface Category {
  id: CategoryId;
  label: string;
  intro: string;
  /**
   * zoom > 1 gives a tighter editorial crop (e.g. to vary an image also used elsewhere).
   * ratio is the source's width / height (default 4:3).
   */
  image: { base: string; alt: string; position: string; zoom?: number; ratio?: number };
}

export const categories: Category[] = [
  {
    id: 'injectables',
    label: 'Injectables',
    intro:
      'Neuromodulators and hyaluronic-acid fillers, planned conservatively around your features and the look you want.',
    image: {
      base: '/images/portrait',
      alt: 'Close-up of a woman’s face in soft natural light, showing realistic skin texture',
      position: '74% 38%',
      zoom: 1.7,
    },
  },
  {
    id: 'threads',
    label: 'Threads',
    intro:
      'A consultation-led option intended to subtly lift and support facial contours. Whether it suits you is decided together, never assumed.',
    image: {
      base: '/images/consultation',
      alt: 'A provider in a beige blazer taking notes while talking with a client in a bright consultation lounge',
      position: '30% 50%',
    },
  },
  {
    id: 'skin',
    label: 'Skin & Anti-Aging',
    intro:
      'Skin-focused treatments and guided home care for texture, tone and long-term skin health.',
    image: {
      base: '/images/facial',
      alt: 'A woman relaxing with eyes closed on a treatment bed while a therapist gently massages her face',
      position: '60% 45%',
      ratio: 2752 / 1536,
    },
  },
];

const commonDiscuss = [
  'Your goals and what you would like to change, or keep',
  'Relevant medical history, reviewed privately with your provider',
  'Whether this treatment is appropriate for you, and any alternatives',
  'Possible side effects, recovery and aftercare',
];

export const treatments: Treatment[] = [
  {
    id: 'botox',
    category: 'injectables',
    name: 'Botox®',
    summary: 'A prescription neuromodulator used to soften the look of certain expression lines.',
    overview: [
      'Botox® Cosmetic is a prescription injectable that temporarily relaxes targeted muscles. It is commonly used to soften the appearance of dynamic lines, such as those between the brows, that form with facial expression.',
      'Effects are temporary and vary from person to person. Treatment should only be planned after an in-person assessment by a qualified, licensed provider.',
    ],
    discuss: commonDiscuss,
  },
  {
    id: 'dysport',
    category: 'injectables',
    name: 'Dysport®',
    summary: 'An alternative neuromodulator, chosen with your provider based on your goals.',
    overview: [
      'Dysport® is another prescription neuromodulator used to temporarily soften the appearance of certain expression lines. It differs from other neuromodulators in formulation, and your provider can explain whether one may be preferable for you.',
      'As with any prescription treatment, suitability, dosing and expectations are determined individually at consultation.',
    ],
    discuss: commonDiscuss,
  },
  {
    id: 'fillers',
    category: 'injectables',
    name: 'Dermal Fillers: Juvéderm® & Restylane®',
    summary: 'Hyaluronic-acid fillers used to restore volume or refine contours.',
    overview: [
      'Juvéderm® and Restylane® are families of hyaluronic-acid gel fillers. Depending on the product, they may be used to add volume, soften the appearance of certain folds, or refine areas such as the lips or cheeks.',
      'Product choice, placement and amount are individual decisions. A natural-looking plan often starts conservatively, and your provider will discuss risks and recovery with you in advance.',
    ],
    discuss: commonDiscuss,
  },
  {
    id: 'threads',
    category: 'threads',
    name: 'Thread Lift',
    summary: 'Dissolvable threads intended to subtly lift features and support skin.',
    overview: [
      'Thread treatments place fine, dissolvable threads beneath the skin. They are intended to subtly lift facial features and to address the appearance of fine lines and wrinkles.',
      'Thread treatments are not right for everyone, and results differ between individuals. This is a consultation-led service: your provider will assess whether threads, another option, or no treatment is the better fit.',
    ],
    discuss: [...commonDiscuss, 'Realistic expectations for how subtle the change may be'],
  },
  {
    id: 'microneedling',
    category: 'skin',
    name: 'Microneedling',
    summary: 'Controlled micro-channels that support the skin’s natural renewal process.',
    overview: [
      'Microneedling uses fine needles to create controlled micro-channels in the skin, which encourages the skin’s own renewal response. It is often considered for concerns with skin texture and the appearance of fine lines or scarring.',
      'A series of sessions is sometimes recommended, and some redness afterwards is common. Your provider will advise on preparation, aftercare and whether it suits your skin.',
    ],
    discuss: commonDiscuss,
  },
  {
    id: 'microblading',
    category: 'skin',
    name: 'Microblading',
    summary: 'Semi-permanent, hair-like strokes to shape and define brows.',
    overview: [
      'Microblading is a semi-permanent cosmetic tattooing technique that adds fine, hair-like strokes to define or fill in the brows. Shape and color are designed with you before any pigment is applied.',
      'Healing takes time and a follow-up appointment is typical. Pigment fades gradually, and how long it lasts varies between individuals.',
    ],
    discuss: [
      'The brow shape and color you have in mind',
      'Skin type and anything that may affect healing',
      'Aftercare and follow-up appointments',
      'Whether microblading is appropriate for you',
    ],
  },
  {
    id: 'skincare',
    category: 'skin',
    name: 'Professional Skincare',
    summary: 'Guidance and professional-grade products for a considered home routine.',
    overview: [
      'Good results in clinic are supported by what you do at home. Pure MedSpa intends to offer skincare guidance and professional-grade products selected around your skin and any treatments you are having.',
      'Specific product lines will be listed here once confirmed.',
    ],
    discuss: [
      'Your current routine and what is or is not working',
      'Skin sensitivities and preferences',
      'How home care fits around in-clinic treatments',
    ],
  },
];

export function treatmentsIn(category: CategoryId): Treatment[] {
  return treatments.filter((t) => t.category === category);
}

export function findTreatment(id: string): Treatment | undefined {
  return treatments.find((t) => t.id === id);
}
