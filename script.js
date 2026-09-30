const intro = document.querySelector('#intro');
const mosaic = document.querySelector('.hero-media');
const dialog = document.querySelector('#film-dialog');
const film = document.querySelector('#overview');
const status = document.querySelector('#chapter-status');
const track = document.querySelector('.timeline-track');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const FILM_END = 179.54;

// Homepage mosaic: silent, loops unless reduced motion is requested.
let mosaicPausedByVisitor = false;
function playIntro() {
  if (!intro.src) intro.src = intro.dataset.src;
  intro.play().catch(() => {});
}
function toggleMosaic() {
  mosaicPausedByVisitor = !intro.paused;
  if (intro.paused) playIntro(); else intro.pause();
}
mosaic.addEventListener('click', toggleMosaic);
mosaic.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggleMosaic(); }
});
intro.addEventListener('play', () => mosaic.setAttribute('aria-label', 'Pause mosaic animation'));
intro.addEventListener('pause', () => mosaic.setAttribute('aria-label', 'Play mosaic animation'));
intro.autoplay = !motion.matches;
if (!motion.matches) playIntro();

// Clips play silently while visible; clicking pauses or resumes one.
const ambient = [...document.querySelectorAll('video.ambient')];
const pausedByVisitor = new WeakSet();
const visible = new WeakSet();
function mayPlay(video) {
  return visible.has(video) && !motion.matches && !pausedByVisitor.has(video) && !document.hidden && !dialog.open;
}
for (const video of ambient) {
  const card = video.closest('.clip');
  video.addEventListener('play', () => card?.classList.add('playing'));
  video.addEventListener('pause', () => card?.classList.remove('playing'));
  video.addEventListener('click', () => {
    if (video.paused) { pausedByVisitor.delete(video); video.play().catch(() => {}); }
    else { pausedByVisitor.add(video); video.pause(); }
  });
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target); else visible.delete(target);
      if (mayPlay(target)) target.play().catch(() => {}); else if (!isIntersecting) target.pause();
    }
  }, { threshold: .35 });
  ambient.forEach(video => observer.observe(video));
}
const resumeAmbient = () => ambient.forEach(video => { if (mayPlay(video)) video.play().catch(() => {}); });

// Film dialog with a chapter timeline.
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const chapters = [...dialog.querySelectorAll('[data-time]')].map(button => ({
  button, start: Number(button.dataset.time), end: Number(button.dataset.end), title: button.querySelector('strong').textContent,
}));
const segments = [];
for (const chapter of [...chapters, { start: chapters.at(-1).end, end: FILM_END }]) {
  const segment = document.createElement(chapter.button ? 'button' : 'span');
  segment.className = 'segment';
  segment.style.flexGrow = chapter.end - chapter.start;
  segment.innerHTML = '<span class="fill"></span>';
  if (chapter.button) {
    segment.type = 'button';
    segment.tabIndex = -1;
    const tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = `${clock(chapter.start)}  ${chapter.title}`;
    segment.append(tip);
    segment.addEventListener('click', () => seek(chapter.start));
    chapter.button.setAttribute('aria-pressed', 'false');
    chapter.button.addEventListener('click', () => seek(chapter.start));
    chapter.segment = segment;
  }
  segments.push({ ...chapter, segment });
  track.append(segment);
}

let requestedTime = null;
film.addEventListener('loadedmetadata', () => { if (requestedTime !== null) film.currentTime = requestedTime; });
function seek(time) {
  requestedTime = time;
  if (film.readyState > 0) film.currentTime = time;
  film.play().catch(() => { status.textContent = 'Press play in the video to watch.'; });
}
function openFilm(event) {
  event?.preventDefault();
  ambient.forEach(video => video.pause());
  intro.pause();
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  film.play().catch(() => {});
}
for (const trigger of document.querySelectorAll('[data-open-film]')) trigger.addEventListener('click', openFilm);
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  film.pause();
  if (!motion.matches && !mosaicPausedByVisitor) playIntro();
  resumeAmbient();
});

let active;
function sync() {
  const t = film.currentTime;
  for (const s of segments) s.segment.style.setProperty('--p', Math.max(0, Math.min(1, (t - s.start) / (s.end - s.start))));
  const current = chapters.findLast(c => t >= c.start && t < c.end) || null;
  if (current === active) return;
  active = current;
  for (const c of chapters) {
    c.button.setAttribute('aria-pressed', String(c === current));
    c.segment.classList.toggle('active', c === current);
  }
  if (current) status.textContent = `Now playing: ${current.title}`;
}
film.addEventListener('timeupdate', sync);
film.addEventListener('seeked', sync);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { for (const video of document.querySelectorAll('video')) video.pause(); return; }
  if (!motion.matches && !mosaicPausedByVisitor && !dialog.open) playIntro();
  resumeAmbient();
});
motion.addEventListener('change', () => {
  intro.autoplay = !motion.matches;
  if (motion.matches) { intro.pause(); ambient.forEach(video => video.pause()); }
  else { if (!document.hidden && !mosaicPausedByVisitor) playIntro(); resumeAmbient(); }
});
if (motion.matches) ambient.forEach(video => { video.controls = true; });

// Copy BibTeX.
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const block = document.getElementById(button.dataset.copy);
    try { await navigator.clipboard.writeText(block.textContent); button.textContent = 'Copied'; }
    catch { getSelection().selectAllChildren(block); button.textContent = 'Selected, press copy'; }
    setTimeout(() => { button.textContent = 'Copy BibTeX'; }, 2000);
  });
}
