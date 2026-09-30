# SAKI project website

Buildless static site for **Skill Assembly and Kinematic Imitation from Human Videos for Long-Horizon Mobile Manipulation**.

- Canonical: https://aus.bot/research/saki/
- GitHub Pages: https://cheese-zj.github.io/saki-site/
- `npm run dev`: preview on http://127.0.0.1:4174 with byte-range support, so chapter seeking works locally
- `npm run check`: asset, player and accessibility-behaviour checks; no dependencies required.

GitHub Pages serves the repository root on `main`. Relative asset URLs support both Pages and the PAIR Lab Worker proxy. `.nojekyll` disables Jekyll processing.

## Content provenance

Revised on 30 September 2026 after studying sunday.ai: the page is organised as claims, each backed by its own footage, and every clip appears exactly once (`npm run check` enforces this). Helvetica is retained; Sunday's typeface and branding are not copied.

Title, author block, affiliations and abstract follow arXiv:2609.36031 (cs.RO, 28 September 2026), checked against the arXiv entry: Yijie Lu and James Zhao (equal contribution) and Weiming Zhi (corresponding author), School of Computer Science and Australian Centre for Robotics, The University of Sydney. Author links reuse the PAIR Lab people entries.

Sections and sources (all under `OCR_Paper/output/video_edit/public/` unless noted; clips re-encoded muted with H.264 CRF 26):

- **Learn**: `human-{tidy,pour,wipe,suitcase}.mp4` are the Quest demonstrations `human_*.mp4`, cropped to remove the metadata strip, at 1× (tidy trimmed to 12–40 s). Figure: paper `fig3-preparation`.
- **Reuse**: `grid.mp4` is the nine-trial grid cropped from `v10_generalisation.mp4` (its title and point-cloud panel removed). Figures: paper `pouring-position-generalisation` and `closed-loop-recorded-update`, rendered from the arXiv PDFs.
- **Assemble**: `tidy.mp4` (`v2_l1_original`, 8×), `pour.mp4` (`v33-long-pour-16x` from frame 297, 16×), `collect.mp4` (`submission-v2-collection-main`, 12×).
- **Contact**: `wipe.mp4` (`v2_wipe`, retimed from 6× to the film's 4×), `door.mp4` (`v2_door`, 4×), `box.mp4` (`final12-suitcase-5x`, 5×).

Speed tags match the final film. The user confirmed on 30 September 2026 that all robot videos are autonomous; no log alignment or aggregate success rate is claimed. `assets/film.mp4` is `out/SAKI_final_1080p.mp4` remuxed with `+faststart`; chapters are the cue boundaries of `story_submission_v2/timeline.json`. `assets/overview-figure.webp` is the paper's Fig. 2.

## Behaviour

Clips play muted while at least 35% visible and pause when scrolled away; clicking toggles one. The film opens in a modal dialog from “Watch the film” or the film band; opening it pauses the mosaic and clips, closing pauses the film and resumes them. A proportional chapter timeline and chapter list seek the film. Reduced motion disables autoplay (clips gain controls) and the scroll-expanding hero. Leaving the tab pauses all video. No analytics, external scripts, third-party embeds or runtime services.
