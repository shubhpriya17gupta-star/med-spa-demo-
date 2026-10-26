/**
 * Cinematic hero.
 *
 * The markup is three stacked full-bleed chapters, which is also the no-JS and reduced-motion
 * experience. With motion allowed, the hero is pinned for 3 × 100svh of scroll and the visible
 * chapter follows scroll position. Chapter changes are class toggles animated by CSS, so fast
 * scrolling or anchor jumps simply land on the right chapter instead of scrubbing frames.
 */

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Seconds before the end of the film at which it dissolves back to the poster (its first frame). */
const LOOP_FADE = 1.1;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function prefersLightData(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return !!connection && (connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? ''));
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const chapters = [...hero.querySelectorAll<HTMLElement>('[data-chapter]')];
  const indexLabel = hero.querySelector<HTMLElement>('[data-hero-index]');

  if (reducedMotion() || chapters.length < 2) return; // stacked panels, poster instead of film

  const video = initHeroVideo(hero);

  let active = Math.max(0, chapters.findIndex((c) => c.classList.contains('is-active')));
  const setActive = (index: number) => {
    if (index === active) return;
    chapters[active].classList.remove('is-active');
    chapters[index].classList.add('is-active');
    active = index;
    hero.dataset.activeChapter = String(index);
    if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');
    video.setVisible(index === 0);
  };

  hero.classList.add('hero--pinned');
  hero.dataset.activeChapter = String(active);

  let ticking = false;
  const update = () => {
    ticking = false;
    const distance = hero.offsetHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, (window.scrollY - hero.offsetTop) / distance)) : 0;
    hero.style.setProperty('--hero-progress', progress.toFixed(4));
    setActive(Math.min(chapters.length - 1, Math.floor(progress * chapters.length)));
  };
  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  // Enable the copy entrance transitions only after the first frame, so chapter one is never
  // hidden while the page is still loading.
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
}

/**
 * Ambient background film for the first chapter. It loads only when motion is allowed and the
 * visitor hasn't asked to save data, pauses when off screen or in a background tab, and has a
 * visible pause control. The clip's last frame differs from its first, so instead of a hard loop
 * it dissolves to the poster (the first frame) and restarts underneath it.
 */
function initHeroVideo(hero: HTMLElement): { setVisible: (visible: boolean) => void } {
  const noop = { setVisible: () => {} };
  const video = hero.querySelector<HTMLVideoElement>('[data-hero-video]');
  const media = video?.parentElement;
  const toggle = hero.querySelector<HTMLButtonElement>('[data-video-toggle]');
  const label = toggle?.querySelector<HTMLElement>('[data-video-toggle-label]');
  if (!video || !media || !video.dataset.src || prefersLightData()) return noop;

  let userPaused = false;
  let inView = true;
  let chapterVisible = true;

  const shouldPlay = () => !userPaused && inView && chapterVisible && !document.hidden;
  const renderToggle = () => {
    if (!toggle || !label) return;
    toggle.dataset.paused = String(userPaused);
    label.textContent = userPaused ? 'Play background video' : 'Pause background video';
  };
  const sync = () => {
    if (!shouldPlay()) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      // Autoplay refused (e.g. battery saver). The poster stays; offer a play button instead.
      userPaused = true;
      renderToggle();
      if (toggle) toggle.hidden = false;
    });
  };

  video.addEventListener(
    'playing',
    () => {
      media.classList.add('is-playing');
      if (toggle) toggle.hidden = false;
    },
    { once: true },
  );

  video.addEventListener('timeupdate', () => {
    if (video.duration && video.duration - video.currentTime < LOOP_FADE) media.classList.add('is-looping');
  });
  video.addEventListener('ended', () => {
    video.addEventListener(
      'seeked',
      () => {
        // Back on frame one, which matches the poster: show the film again without a transition.
        media.classList.add('is-restarting');
        media.classList.remove('is-looping');
        void video.offsetWidth; // flush styles so the snap back to full opacity isn't transitioned
        requestAnimationFrame(() => media.classList.remove('is-restarting'));
        sync();
      },
      { once: true },
    );
    video.currentTime = 0;
  });

  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    renderToggle();
    sync();
  });
  renderToggle();

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(hero);
  document.addEventListener('visibilitychange', sync);

  video.src = video.dataset.src;
  video.preload = 'auto';
  sync();

  return {
    setVisible(visible: boolean) {
      chapterVisible = visible;
      sync();
    },
  };
}
