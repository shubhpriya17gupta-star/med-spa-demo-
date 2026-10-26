const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fades sections in as they enter the viewport. Content is visible without JS or with reduced motion. */
export function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  items.forEach((el) => observer.observe(el));
}
