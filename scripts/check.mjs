import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
for (const [, path] of html.matchAll(/(?:href|src|data-src|poster)="([^"]+)"/g)) {
  if (!/^(https:|mailto:|#)/.test(path)) assert.ok(existsSync(path.split('?')[0]), `Missing asset: ${path}`);
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

// Chapters must tile the film timeline without gaps, in order.
const chapters = [...html.matchAll(/data-time="([\d.]+)" data-end="([\d.]+)">[\s\S]*?<strong>([^<]+)<\/strong>/g)].map(([, start, end, title]) => ({ start: Number(start), end: Number(end), title }));
assert.equal(chapters.length, 11);
for (const clip of ["tidy","pour","collect","box","wipe","door","grid"]) assert.ok(html.includes(`assets/clips/${clip}.mp4`), `Missing clip ${clip}`);
assert.equal((html.match(/assets\/clips\/[a-z-]+\.mp4/g) || []).length, new Set(html.match(/assets\/clips\/[a-z-]+\.mp4/g)).size, "Each clip appears once");
assert.equal(chapters[0].start, 0);
for (let i = 1; i < chapters.length; i++) assert.equal(chapters[i].start, chapters[i - 1].end, `Gap before ${chapters[i].title}`);
assert.ok(chapters.at(-1).end < 179.54);
for (const author of ['Yijie Lu', 'James Zhao', 'Weiming Zhi']) assert.ok(html.includes(author), `Missing author ${author}`);
assert.ok(!/Vanderbilt/.test(html));
console.log('Local assets, anchors, canonical, media sizes, chapter tiling and author block passed.');

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
