// Scroll expands the mosaic over the fading title block; normal document flow is the fallback.
const heroScroll = document.querySelector('.hero-scroll');
const heroStage = document.querySelector('.hero-stage');
const heroHeading = document.querySelector('.hero-heading');
const heroMotion = matchMedia('(min-width: 901px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
let motionFrame = 0;
function updateHero() {
  motionFrame = 0;
  document.documentElement.classList.toggle('hero-motion', heroMotion.matches);
  if (!heroMotion.matches) return;
  const distance = heroScroll.offsetHeight - heroStage.offsetHeight;
  const progress = Math.max(0, Math.min(1, -heroScroll.getBoundingClientRect().top / Math.max(1, distance)));
  const start = heroHeading.offsetTop + heroHeading.offsetHeight + 36;
  const opacity = Math.max(0, 1 - progress / .35);
  heroStage.style.setProperty('--hero-progress', progress);
  heroStage.style.setProperty('--hero-top', `${start * (1 - progress)}px`);
  heroStage.style.setProperty('--hero-opacity', opacity);
}
function scheduleHero() {
  if (!motionFrame) motionFrame = requestAnimationFrame(updateHero);
}
addEventListener('scroll', scheduleHero, {passive: true});
addEventListener('resize', scheduleHero);
heroMotion.addEventListener('change', scheduleHero);
updateHero();
