const intro = document.querySelector('#intro');
const replay = document.querySelector('#replay');
const film = document.querySelector('#overview');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('[data-time]')];
let requestedTime = 0;
film.addEventListener('loadedmetadata', () => { film.currentTime = requestedTime; });

function playIntro() {
  if (!intro.src) intro.src = intro.dataset.src;
  if (intro.ended) intro.currentTime = 0;
  intro.play().catch(() => { replay.textContent = 'Play introduction ▷'; });
}
replay.addEventListener('click', () => intro.paused ? playIntro() : intro.pause());
intro.addEventListener('play', () => { replay.textContent = 'Pause introduction Ⅱ'; });
intro.addEventListener('pause', () => { replay.textContent = 'Play introduction ▷'; });
intro.addEventListener('ended', () => { replay.textContent = 'Replay introduction ↻'; });
if (!motion.matches) playIntro();
motion.addEventListener('change', () => { if (motion.matches) intro.pause(); });

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

// Keep narration and demonstrations from playing over one another.
for (const video of document.querySelectorAll('video')) {
  video.addEventListener('play', () => {
    for (const other of document.querySelectorAll('video')) if (other !== video) other.pause();
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const video of document.querySelectorAll('video')) video.pause();
});
