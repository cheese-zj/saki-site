const intro = document.querySelector('#intro');
const mosaic = document.querySelector('.hero-media');
const film = document.querySelector('#overview');
const player = document.querySelector('.player');
const overlay = document.querySelector('.play-overlay');
const status = document.querySelector('#chapter-status');
const track = document.querySelector('.timeline-track');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('.chapters [data-time]')].map(button => ({
  button, start: Number(button.dataset.time), end: Number(button.dataset.end), title: button.querySelector('strong').textContent,
}));

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

// Film: overlay play button, chapter timeline and chapter list stay in sync.
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
for (const chapter of chapters) {
  const segment = document.createElement('button');
  segment.type = 'button';
  segment.className = 'segment';
  segment.tabIndex = -1;
  segment.style.flexGrow = chapter.end - chapter.start;
  segment.innerHTML = '<span class="fill"></span><span class="tip"></span>';
  segment.querySelector('.tip').textContent = `${clock(chapter.start)}  ${chapter.title}`;
  segment.addEventListener('click', () => seek(chapter, false));
  track.append(segment);
  chapter.segment = segment;
  chapter.button.setAttribute('aria-pressed', 'false');
  chapter.button.setAttribute('aria-label', `Play from ${clock(chapter.start)}: ${chapter.title}`);
  chapter.button.addEventListener('click', () => seek(chapter, true));
}
{ // The closing titles complete the timeline.
  const last = chapters.at(-1);
  const closing = document.createElement('span');
  closing.className = 'segment';
  closing.style.flexGrow = 179.54 - last.end;
  closing.innerHTML = '<span class="fill"></span>';
  track.append(closing);
  chapters.closing = { start: last.end, end: 179.54, segment: closing };
}

film.controls = false; // Native controls return once the film starts.
let requestedTime = null;
film.addEventListener('loadedmetadata', () => {
  if (requestedTime !== null) film.currentTime = requestedTime;
});
function start() {
  player.classList.add('started');
  film.controls = true;
  film.play().catch(() => { status.textContent = 'Press play in the video to watch.'; });
}
function seek(chapter, scroll) {
  requestedTime = chapter.start;
  if (film.readyState > 0) film.currentTime = chapter.start;
  start();
  if (scroll) player.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
}
overlay.addEventListener('click', () => { start(); film.focus({ preventScroll: true }); });
film.addEventListener('play', () => { player.classList.add('started'); film.controls = true; });

let active = null;
function sync() {
  const t = film.currentTime;
  for (const c of [...chapters, chapters.closing]) {
    c.segment.style.setProperty('--p', Math.max(0, Math.min(1, (t - c.start) / (c.end - c.start))));
  }
  const current = chapters.findLast(c => t >= c.start && t < c.end) || null;
  if (current === active) return;
  active = current;
  for (const c of chapters) {
    const on = c === current;
    c.button.setAttribute('aria-pressed', String(on));
    c.segment.classList.toggle('active', on);
  }
  status.textContent = current ? `Now playing: ${current.title}` : t > 1 ? 'SAKI: reusable interactions, connected tasks.' : status.textContent;
}
film.addEventListener('timeupdate', sync);
film.addEventListener('seeked', sync);

// Method clips play silently while visible; the film is never interrupted by them.
const ambient = [...document.querySelectorAll('video.ambient')];
const ambientPausedByVisitor = new WeakSet();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting && !motion.matches && !ambientPausedByVisitor.has(video) && !document.hidden) video.play().catch(() => {});
      else if (!entry.isIntersecting) video.pause();
    }
  }, { threshold: .4 });
  ambient.forEach(video => observer.observe(video));
}
for (const video of ambient) {
  video.addEventListener('click', () => {
    if (video.paused) { ambientPausedByVisitor.delete(video); video.play().catch(() => {}); }
    else { ambientPausedByVisitor.add(video); video.pause(); }
  });
  if (motion.matches) video.controls = true;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const video of document.querySelectorAll('video')) video.pause();
  else if (!motion.matches && !mosaicPausedByVisitor) playIntro();
});
motion.addEventListener('change', () => {
  intro.autoplay = !motion.matches;
  if (motion.matches) { intro.pause(); ambient.forEach(video => video.pause()); }
  else if (!document.hidden && !mosaicPausedByVisitor) playIntro();
});

// Copy BibTeX.
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; }
    catch { getSelection().selectAllChildren(document.getElementById(button.dataset.copy)); button.textContent = 'Selected, press copy'; }
    setTimeout(() => { button.textContent = 'Copy BibTeX'; }, 2000);
  });
}
