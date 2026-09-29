# SAKI project website

Buildless static site for **Skill Assembly and Kinematic Imitation from Human Videos for Long-Horizon Mobile Manipulation**.

- Canonical: https://aus.bot/research/saki/
- GitHub Pages: https://cheese-zj.github.io/saki-site/
- `npm run dev`: preview on http://127.0.0.1:4174 with byte-range support, so chapter seeking works locally
- `npm run check`: asset, player and accessibility-behaviour checks; no dependencies required.

GitHub Pages serves the repository root on `main`. Relative asset URLs support both Pages and the PAIR Lab Worker proxy. `.nojekyll` disables Jekyll processing.

## Content provenance

Revised on 30 September 2026. Title, author block, affiliations and abstract follow the arXiv edition prepared on 29 September (`OCR_Paper/output/arxiv-20260929/source/main.tex`, based on Overleaf `69b0cc7`): Yijie Lu and James Zhao (equal contribution) and Weiming Zhi (corresponding author), School of Computer Science and Australian Centre for Robotics, The University of Sydney. Author links reuse the PAIR Lab people entries. The arXiv paper has not been announced, so the paper button is shown as pending and the BibTeX entry is a `@misc` citing this website; add the arXiv identifier and PDF link once available. No acceptance is claimed.

`assets/film.mp4` is `OCR_Paper/output/video_edit/out/SAKI_final_1080p.mp4` remuxed with `+faststart` (streams unchanged): the submission-v2 edit at 1920 × 1080, 25 fps, 179.541 s, H.264/AAC. It replaces the earlier 720p `overview.mp4`. English captions are burnt in; the optional WebVTT track is converted from its SRT and off by default. Chapter boundaries are the cue boundaries of `story_submission_v2/timeline.json`; chapter thumbnails and the poster (99 s) are frames of the film. `assets/overview-figure.webp` is the paper's overview figure (`fig2-overview-20260917.png`) re-encoded.

The three method clips are exact ranges of the film: interaction 21–33 s; reuse 33–42 s; assembly 50–65 s. They play muted while visible (click to pause) and never interrupt the film; with reduced motion they show controls and do not autoplay. The five-second homepage mosaic is rendered from the original `src/IntroMosaic.tsx` composition. Prepared target paths are explanatory visualisations, not measured tracking results. Assembly footage and point clouds include separate captures; no synchronisation claim is made.

## Film player

A play overlay starts the film; native controls appear once playback begins. A chapter timeline below the video is proportional to chapter length, fills with progress and seeks on click; the thumbnail chapter list (Method, Autonomous tasks) seeks, starts playback and highlights the current chapter. Leaving the tab pauses all video. On desktop the hero mosaic expands to full height as the visitor scrolls while the title block fades; small screens, reduced motion and disabled JavaScript keep normal document flow. Typography remains system Helvetica Neue. No analytics, external scripts, third-party embeds or runtime services.
