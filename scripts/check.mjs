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
for (const clip of ["tidy","pour","collect","box","wipe","door","grid","learn-can","learn-wipe","human-pour","human-wipe","human-door","human-suitcase"]) assert.ok(html.includes(`assets/clips/${clip}.mp4`), `Missing clip ${clip}`);
assert.equal((html.match(/assets\/clips\/[a-z-]+\.mp4/g) || []).length, new Set(html.match(/assets\/clips\/[a-z-]+\.mp4/g)).size, "Each clip appears once");
assert.equal(chapters[0].start, 0);
for (let i = 1; i < chapters.length; i++) assert.equal(chapters[i].start, chapters[i - 1].end, `Gap before ${chapters[i].title}`);
assert.ok(chapters.at(-1).end < 179.54);
for (const author of ['Yijie Lu', 'James Zhao', 'Weiming Zhi']) assert.ok(html.includes(author), `Missing author ${author}`);
assert.ok(!/Vanderbilt/.test(html));
console.log('Local assets, anchors, canonical, media sizes, chapter tiling and author block passed.');

// Every clip is described in text, so it survives for screen readers and for agents that skip video.
for (const [tag] of html.matchAll(/<video class="ambient"[^>]*>/g)) assert.match(tag, /aria-label="[^"]{12,}"/, `Undescribed clip: ${tag}`);

// Recovered paths: observation times increase; stage strip tiles the tidying run.
for (const [, data] of html.matchAll(/data-path="([^"]+)"/g)) {
  const times = data.split(' ').map(p => Number(p.split(',')[2]));
  assert.ok(times.every((t, i) => i === 0 || t > times[i - 1]), 'Path times must increase');
}
const stages = [...html.matchAll(/data-from="([\d.]+)" data-to="([\d.]+)"/g)].map(([, a, b]) => [Number(a), Number(b)]);
assert.equal(stages[0][0], 0);
for (let i = 1; i < stages.length; i++) assert.equal(stages[i][0], stages[i - 1][1]);
assert.equal(stages.at(-1)[1], 28.04, 'Stages end with the tidying clip');
for (const [, id] of html.matchAll(/aria-controls="([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `Missing tab panel ${id}`);

// Machine-readable copies agree with the page: JSON-LD, transcript, Markdown twin, BibTeX.
const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const film = ld['@graph'].find(node => node['@type'] === 'VideoObject');
const paper = ld['@graph'].find(node => node['@type'] === 'ScholarlyArticle');
assert.deepEqual(film.hasPart.map(c => c.name), chapters.map(c => c.title), 'JSON-LD chapters match the dialog');
film.hasPart.forEach((c, i) => assert.equal(c.startOffset, Math.floor(chapters[i].start)));
const cues = [...readFileSync('assets/overview.vtt', 'utf8').matchAll(/-->[^\n]+\n([\s\S]+?)(?:\n\n|\s*$)/g)].map(([, text]) => text.replace(/\s+/g, ' ').trim());
const narration = cues.join(' ');
assert.equal(film.transcript, narration, 'JSON-LD transcript matches the captions');
const text = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const transcript = [...html.match(/<div class="transcript-body">([\s\S]*?)<\/div>/)[1].matchAll(/<\/strong> ([\s\S]*?)<\/p>/g)].map(([, t]) => text(t)).join(' ');
assert.equal(transcript, narration, 'On-page transcript matches the captions');
const abstract = [...html.match(/<div class="abstract-body">([\s\S]*?)<\/div>/)[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([, t]) => text(t));
assert.equal(paper.abstract, abstract.join(' '), 'JSON-LD abstract matches the page');
const md = readFileSync('index.md', 'utf8');
for (const paragraph of abstract) assert.ok(md.includes(paragraph), 'Markdown carries the abstract');
for (const chapter of chapters) assert.ok(md.includes(`| ${chapter.title} |`), `Markdown lacks chapter ${chapter.title}`);
for (const cue of cues) assert.ok(md.replace(/\s+/g, ' ').includes(cue), `Markdown transcript lacks: ${cue}`);
for (const [, caption] of html.matchAll(/<(?:figcaption|p class="pair-caption")>([\s\S]*?)<\/(?:figcaption|p)>/g)) {
  const first = text(caption).split('. ')[0].replace(/\.$/, '');
  assert.ok(md.includes(first), `Markdown lacks caption: ${first}`);
}
for (const [, label] of html.matchAll(/<h2 id="(?:learn|reuse|assemble|contact|method)-title">([^<]+)<\/h2>/g)) assert.ok(md.includes(label), `Markdown lacks heading ${label}`);
const bib = html.match(/<pre id="bibtex"><code>([\s\S]*?)<\/code><\/pre>/)[1];
assert.equal(readFileSync('saki.bib', 'utf8').trim(), bib.trim(), 'saki.bib matches the page');
assert.ok(md.includes(bib.trim()), 'Markdown BibTeX matches the page');
for (const [, url] of readFileSync('llms.txt', 'utf8').matchAll(/\]\(https:\/\/aus\.bot\/research\/saki\/([^)]+)\)/g)) assert.ok(existsSync(url), `llms.txt links a missing file: ${url}`);
console.log('Clip descriptions, path data, stages, JSON-LD, transcript, Markdown twin, BibTeX and llms.txt passed.');

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
