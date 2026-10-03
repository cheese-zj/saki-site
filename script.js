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

// Recovered object paths: a faint full path, overdrawn as the demonstration reaches each observation.
const SVG = 'http://www.w3.org/2000/svg';
const GAP = .5; // seconds without observations, bridged by a dashed segment
for (const card of document.querySelectorAll('.trace')) {
  const video = card.querySelector('video');
  const svg = card.querySelector('svg[data-path]');
  const offset = Number(card.dataset.offset) || 0;
  const points = svg.dataset.path.trim().split(/\s+/).map(p => p.split(',').map(Number));
  const width = svg.viewBox.baseVal.width;
  const make = (name, attrs) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return svg.appendChild(node);
  };
  const segments = points.slice(1).map(([x, y, t], i) => {
    const [x0, y0, t0] = points[i];
    const gap = t - t0 > GAP;
    make('line', { x1: x0, y1: y0, x2: x, y2: y, class: gap ? 'trace-under gap' : 'trace-under', 'stroke-width': width / 260 });
    const hue = 205 + 105 * i / points.length;
    return { x0, y0, t0, x, y, t, line: make('line', { x1: x0, y1: y0, x2: x0, y2: y0, class: gap ? 'trace-live gap' : 'trace-live', stroke: `hsl(${hue} 90% 50%)`, 'stroke-width': width / 150 }) };
  });
  const head = make('circle', { r: width / 95, class: 'trace-head', 'stroke-width': width / 500 });
  let frame = 0;
  function draw() {
    const t = video.currentTime + offset;
    let hx = points[0][0], hy = points[0][1];
    for (const s of segments) {
      const k = Math.max(0, Math.min(1, (t - s.t0) / (s.t - s.t0)));
      const x = s.x0 + (s.x - s.x0) * k, y = s.y0 + (s.y - s.y0) * k;
      s.line.setAttribute('x2', x);
      s.line.setAttribute('y2', y);
      s.line.style.opacity = k > 0 ? 1 : 0;
      if (k > 0) { hx = x; hy = y; }
    }
    head.setAttribute('cx', hx);
    head.setAttribute('cy', hy);
    card.classList.toggle('tracking', t >= points[0][2]);
    frame = video.paused ? 0 : requestAnimationFrame(draw);
  }
  video.addEventListener('play', () => { if (!frame) frame = requestAnimationFrame(draw); });
  video.addEventListener('seeked', draw);
  video.addEventListener('loadeddata', draw);
  draw();
}

// Skill-chain strip on the tidying run: progress per stage, and each stage seeks the run.
for (const chain of document.querySelectorAll('.chain')) {
  const video = chain.querySelector('video');
  const stages = [...chain.querySelectorAll('[data-from]')].map(button => ({ button, from: Number(button.dataset.from), to: Number(button.dataset.to) }));
  let frame = 0;
  function update() {
    const t = video.currentTime;
    for (const s of stages) {
      s.button.style.setProperty('--p', Math.max(0, Math.min(1, (t - s.from) / (s.to - s.from))));
      const current = t >= s.from && t < s.to;
      s.button.classList.toggle('active', current);
      if (current) s.button.setAttribute('aria-current', 'step'); else s.button.removeAttribute('aria-current');
    }
    frame = video.paused ? 0 : requestAnimationFrame(update);
  }
  for (const s of stages) s.button.addEventListener('click', () => {
    video.currentTime = s.from + .01;
    pausedByVisitor.delete(video);
    if (!dialog.open) video.play().catch(() => {});
    update();
  });
  video.addEventListener('play', () => { if (!frame) frame = requestAnimationFrame(update); });
  video.addEventListener('seeked', update);
  update();
}

// Demonstration/robot pairs: an ARIA tab set. The panel's clips restart together when shown.
for (const tablist of document.querySelectorAll('.pair-tabs')) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  function select(tab, focus) {
    for (const other of tabs) {
      const chosen = other === tab;
      other.setAttribute('aria-selected', String(chosen));
      other.tabIndex = chosen ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls'));
      panel.hidden = !chosen;
      for (const video of panel.querySelectorAll('video')) {
        if (!chosen) video.pause();
        else { video.currentTime = 0; if (mayPlay(video)) video.play().catch(() => {}); }
      }
    }
    if (focus) tab.focus();
  }
  tablist.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  tablist.addEventListener('keydown', event => {
    const i = tabs.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (i < 0 || next === undefined) return;
    event.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });
}

// Contents: mark the section being read, and keep its link in view on narrow screens.
const nav = document.querySelector('.site-header nav');
const navLinks = new Map([...nav.querySelectorAll('a')].map(link => [link.hash.slice(1), link]));
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      const link = navLinks.get(target.id);
      if (!isIntersecting) { link.removeAttribute('aria-current'); continue; }
      for (const other of navLinks.values()) other.toggleAttribute('aria-current', other === link);
      link.setAttribute('aria-current', 'location');
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: motion.matches ? 'auto' : 'smooth' });
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of navLinks.keys()) sectionObserver.observe(document.getElementById(id));
}
