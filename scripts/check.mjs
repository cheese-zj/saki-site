import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
for (const [, path] of html.matchAll(/(?:href|src|data-src|poster)="([^"]+)"/g)) {
  if (!/^(https:|#)/.test(path)) assert.ok(existsSync(path.split('?')[0]), `Missing asset: ${path}`);
  if (path.startsWith('#')) assert.ok(html.includes(`id="${path.slice(1)}"`), `Missing anchor: ${path}`);
}
for (const [, path] of readFileSync('styles.css', 'utf8').matchAll(/url\('([^']+)'\)/g)) assert.ok(existsSync(path));
assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
assert.ok(html.includes('https://aus.bot/research/saki/'));
function checkAssets(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) checkAssets(path);
    else assert.ok(statSync(path).size < 25 * 1024 * 1024, `Oversized asset: ${path}`);
  }
}
checkAssets('assets');

// Exercise the actual player handlers, including reduced motion and task seeking.
function element(extra = {}) {
  return { handlers: {}, dataset: {}, paused: true, textContent: '', src: '',
    addEventListener(type, fn) { this.handlers[type] = fn; },
    setAttribute(key, value) { this[key] = value; },
    play() { this.paused = false; this.handlers.play?.(); return Promise.resolve(); },
    pause() { this.paused = true; this.handlers.pause?.(); },
    scrollIntoView() {}, ...extra };
}
for (const reduced of [true, false]) {
  const intro = element({ dataset: { src: 'assets/mosaic.mp4' } });
  const mosaic = element();
  const film = element({ currentTime: 0, readyState: 0 });
  const label = element();
  const chapters = [...html.matchAll(/data-time="([\d.]+)"><span[^>]+>[^<]+<\/span><strong>([^<]+)<\/strong>/g)].map(([, time, title]) => element({ dataset: { time }, querySelector: () => ({ textContent: title }) }));
  assert.equal(chapters.length, 6);
  const map = { '#intro': intro, '.hero-media': mosaic, '#overview': film, '#chapter-status': label };
  const doc = element({ querySelector: selector => map[selector], querySelectorAll: selector => selector === 'video' ? [intro, film] : chapters });
  const motion = element({ matches: reduced });
  vm.runInNewContext(readFileSync('script.js', 'utf8'), { document: doc, matchMedia: () => motion });
  assert.equal(intro.paused, reduced, 'Reduced motion must prevent automatic playback');
  assert.equal(intro.autoplay, !reduced);
  mosaic.handlers.click();
  assert.equal(intro.paused, !reduced);
  if (intro.paused) mosaic.handlers.keydown({ key: ' ', preventDefault() {} });
  assert.equal(intro.paused, false);
  for (const chapter of chapters) {
    chapter.handlers.click();
    if (film.readyState === 0) {
      assert.equal(film.currentTime, 0, 'Wait for metadata before the initial chapter seek');
      film.readyState = 1;
      film.handlers.loadedmetadata();
    }
    film.handlers.timeupdate();
    assert.equal(film.currentTime, Number(chapter.dataset.time));
    assert.equal(chapter['aria-pressed'], 'true');
    assert.equal(intro.paused, false, 'Film playback must not stop the silent mosaic');
    assert.equal(chapters.filter(c => c['aria-pressed'] === 'true').length, 1);
  }
  doc.hidden = true; doc.handlers.visibilitychange();
  assert.equal(film.paused, true);
  assert.equal(intro.paused, true);
  doc.hidden = false; doc.handlers.visibilitychange();
  assert.equal(intro.paused, reduced, 'Resume autoplay on returning to the tab');
  if (intro.paused) mosaic.handlers.click();
  mosaic.handlers.keydown({ key: 'Enter', preventDefault() {} });
  assert.equal(intro.paused, true);
  doc.hidden = true; doc.handlers.visibilitychange();
  doc.hidden = false; doc.handlers.visibilitychange();
  assert.equal(intro.paused, true, 'Keep a visitor-initiated pause');
}
console.log('Local assets, anchors, canonical, media sizes, chapter seeking, playback and reduced motion passed.');

// Check the real scroll mapping and its reduced-motion/narrow-screen fallback.
for (const enabled of [true, false]) {
  let top = 0;
  const properties = {};
  const classes = new Map();
  const query = { matches: enabled, addEventListener() {} };
  const nodes = {
    '.hero-scroll': { offsetHeight: 1224, getBoundingClientRect: () => ({ top }) },
    '.hero-stage': { offsetHeight: 720, style: { setProperty: (key, value) => { properties[key] = value; } } },
    '.hero-heading': { offsetTop: 0, offsetHeight: 342 },
  };
  const context = vm.createContext({
    document: { querySelector: selector => nodes[selector], documentElement: { classList: { toggle: (key, value) => classes.set(key, value) } } },
    matchMedia: () => query, addEventListener() {}, requestAnimationFrame() {},
  });
  vm.runInContext(readFileSync('motion.js', 'utf8'), context);
  assert.equal(classes.get('hero-motion'), enabled);
  if (!enabled) { assert.deepEqual(properties, {}); continue; }
  for (const [position, expected] of [[100, 0], [-252, .5], [-504, 1], [-900, 1]]) {
    top = position;
    vm.runInContext('updateHero()', context);
    assert.equal(properties['--hero-progress'], expected);
    assert.equal(properties['--hero-top'], `${378 * (1 - expected)}px`);
  }
  query.matches = false;
  vm.runInContext('updateHero()', context);
  assert.equal(classes.get('hero-motion'), false);
}
console.log('Hero scroll bounds and motion fallback passed.');
