const intro = document.querySelector('#intro');
const mosaic = document.querySelector('.hero-media');
const film = document.querySelector('#overview');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('[data-time]')];
let requestedTime = 0;
film.addEventListener('loadedmetadata', () => { film.currentTime = requestedTime; });

let mosaicPausedByVisitor = false;
function playIntro() {
  if (!intro.src) intro.src = intro.dataset.src;
  intro.play().catch(() => { mosaic.setAttribute('aria-label', 'Play mosaic animation'); });
}
function toggleMosaic() {
  mosaicPausedByVisitor = !intro.paused;
  if (intro.paused) playIntro(); else intro.pause();
}
mosaic.addEventListener('click', toggleMosaic);
mosaic.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    toggleMosaic();
  }
});
intro.addEventListener('play', () => mosaic.setAttribute('aria-label', 'Pause mosaic animation'));
intro.addEventListener('pause', () => mosaic.setAttribute('aria-label', 'Play mosaic animation'));
intro.autoplay = !motion.matches;
if (!motion.matches) playIntro();
motion.addEventListener('change', () => {
  intro.autoplay = !motion.matches;
  if (motion.matches) intro.pause();
  else if (!document.hidden && !mosaicPausedByVisitor) playIntro();
});

for (const button of chapters) {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    requestedTime = Number(button.dataset.time);
    if (film.readyState > 0) film.currentTime = requestedTime;
    film.play().catch(() => { document.querySelector('#chapter-status').textContent = 'Press play in the video to watch this task.'; });
    film.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
  });
}
film.addEventListener('timeupdate', () => {
  const active = chapters.findLast(button => film.currentTime >= Number(button.dataset.time));
  for (const button of chapters) button.setAttribute('aria-pressed', String(button === active));
  const status = active ? active.querySelector('strong').textContent : 'Project overview';
  const label = document.querySelector('#chapter-status');
  if (label.textContent !== status) label.textContent = status;
});

// The silent background mosaic is independent of the narrated demonstrations.
const demonstrations = [...document.querySelectorAll('video')].filter(video => video !== intro);
for (const video of demonstrations) {
  video.addEventListener('play', () => {
    for (const other of demonstrations) if (other !== video) other.pause();
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const video of document.querySelectorAll('video')) video.pause();
  else if (!motion.matches && !mosaicPausedByVisitor) playIntro();
});
