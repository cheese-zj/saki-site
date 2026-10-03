# SAKI project website

Buildless static site for **Skill Assembly and Kinematic Imitation from Human Videos for Long-Horizon Mobile Manipulation**.

- Canonical: https://aus.bot/research/saki/
- GitHub Pages: https://cheese-zj.github.io/saki-site/
- `npm run dev`: preview on http://127.0.0.1:4174 with byte-range support, so chapter seeking works locally
- `npm run check`: asset, player and accessibility-behaviour checks, plus agreement between the page and its machine-readable copies; no dependencies required.
- `scripts/build-media.sh`: rebuilds the clips, scenes and posters added on 3 October 2026 from the paper workspace.
- `scripts/render-path-scene.py`: renders a fused Quest scene with its observed object path and prints the page's `data-path` string (used for pouring; needs numpy and Pillow).

## For agents and crawlers

Everything on the page is static HTML; nothing depends on JavaScript to appear. Alongside it:

- `index.md`: the page as Markdown, with every video described in words and the full film transcript (linked with `rel="alternate" type="text/markdown"`).
- `llms.txt`: a short index for language-model agents.
- `saki.bib`: BibTeX; JSON-LD (`ScholarlyArticle` and the film as a `VideoObject` with chapter `Clip`s and transcript) in the page head.
- An on-page transcript under the film band.

`npm run check` fails if the JSON-LD, the on-page transcript, `index.md`, `saki.bib` or `llms.txt` drift from the page or the captions. When editing a caption, heading, chapter or the abstract, update `index.md` too.

GitHub Pages serves the repository root on `main`. Relative asset URLs support both Pages and the PAIR Lab Worker proxy. `.nojekyll` disables Jekyll processing.

## Content provenance

Revised on 30 September 2026 after studying sunday.ai: the page is organised as claims, each backed by its own footage, and every clip appears exactly once (`npm run check` enforces this). Helvetica is retained; Sunday's typeface and branding are not copied.

Title, author block, affiliations and abstract follow arXiv:2609.36031 (cs.RO, 28 September 2026), checked against the arXiv entry: Yijie Lu and James Zhao (equal contribution) and Weiming Zhi (corresponding author), School of Computer Science and Australian Centre for Robotics, The University of Sydney. Author links reuse the PAIR Lab people entries.

Sections and sources (all under `OCR_Paper/output/video_edit/public/` unless noted; clips re-encoded muted with H.264 CRF 26). Every section opens with the same chapter bar (rule, number, name, next-section link). Reuse and Assemble keep their headline over the footage; the others use a text title at one shared size:

- **Learn**: `learn-can.mp4` and `learn-wipe.mp4` are the Figure 4 Quest captures `20260909_141230` (can, 2–9 s) and `20260909_140046` (whiteboard, 3–15 s), at 1×. The wipe uses the film's crop; the can crop starts 180 px lower than the film's so a seated bystander's head stays out of frame. Their paths are the observed centroids from `v17/{can,wipe}.json` over `v17/{can,wipe}.png`, joined by straight segments (dashed across gaps over 0.5 s); `data-offset` maps clip time to capture time, so the drawing follows the video exactly. The tape capture is not shown with a path: its saved scene background does not visibly match its video. `human-pour.mp4` (Quest `20260913_144257`, 1×; clip time equals capture time) now has a path too: the accepted short-pour demonstration on the 5090A (`object-centric-retarget-long-horizon-bimanual-20260912/runs/asset-production-20260913-redemo-v1/demonstrations/short-pour-cup/demo-v2/object_trajectory.csv`, `centroid_world_rh` of the 57 held frames, source frames 21–77), projected over that capture's fused Quest cloud (`observations-v3/background_world_fused.ply`) by `scripts/render-path-scene.py` (azimuth 50°, elevation 38°, zoom 1.05, start time 1789281777568 ms). The grey shapes near the cup are the demonstrator's hand, which the fusion leaves as ghosts; the cup itself is masked out of the background. Figure: paper `fig3-preparation`. `human-tidy.*` is no longer used.
- **Reuse**: `grid.mp4` is the nine-trial grid cropped from `v10_generalisation.mp4` (its title and point-cloud panel removed). Figures: paper `pouring-position-generalisation` and `closed-loop-recorded-update`, rendered from the arXiv PDFs.
- **Assemble**: `tidy.mp4` (`v2_l1_original`, 8×; stage strip Dispose 0–8.5 s, Place 8.5–20.5 s, Wipe 20.5–28.04 s, read from the video and approximate), `pour.mp4` (`v33-long-pour-16x` from frame 297, 16×), `collect.mp4` (`submission-v2-collection-main`, 12×).
- **Contact-rich**: demonstration beside robot, as tabs. `human-wipe.mp4` → `wipe.mp4` (`v2_wipe`, retimed from 6× to the film's 4×); `human-door.mp4` (Quest `20260907_233640`, the 64 timestamped frames in `v12/quest-door`, cropped to a square inside the film's reviewed face-excluding crop) → `door.mp4` (`v2_door`, 4×); `human-suitcase.mp4` → `box.mp4` (`final12-suitcase-5x`, 5×). Each pair is two separate recordings and the page says so.

Speed tags match the final film. The user confirmed on 30 September 2026 that all robot videos are autonomous; no log alignment or aggregate success rate is claimed. `assets/film.mp4` is `out/SAKI_final_1080p.mp4` remuxed with `+faststart`; chapters are the cue boundaries of `story_submission_v2/timeline.json`. `assets/overview-figure.webp` is the paper's Fig. 2.

## Behaviour

Clips play muted while at least 35% visible and pause when scrolled away; clicking toggles one. Recovered paths draw in step with their demonstration. The tidying run's stage strip shows progress per stage and seeks on click. The pair tabs follow the ARIA tab pattern (arrow keys, Home, End) and restart both clips together. The header highlights the section being read and scrolls on narrow screens. The film opens in a modal dialog from “Watch the film” or the film band; opening it pauses the mosaic and clips, closing pauses the film and resumes them. A proportional chapter timeline and chapter list seek the film. Reduced motion disables autoplay (clips gain controls) and the scroll-expanding hero. Leaving the tab pauses all video. No analytics, external scripts, third-party embeds or runtime services.
