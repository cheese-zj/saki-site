# SAKI project website

Buildless static site for **Skill Assembly and Kinematic Imitation from Human Videos for Long-Horizon Mobile Manipulation**.

- Canonical: https://aus.bot/research/saki/
- GitHub Pages: https://cheese-zj.github.io/saki-site/
- `npm run dev`: basic layout preview on http://127.0.0.1:4174 (chapter seeking requires a byte-range-capable server such as Vite or GitHub Pages)
- `npm run check`: asset, player and accessibility-behaviour checks; no dependencies required.

GitHub Pages serves the repository root on `main`. Relative asset URLs support both Pages and the PAIR Lab Worker proxy. `.nojekyll` disables Jekyll processing.

## Content provenance

Copy follows `OCR_Paper/paper_writing/main.tex` and the final video narrative, inspected on 23 September 2026. The manuscript has an empty author field; no author list, acceptance claim, paper PDF or research-code release is inferred or published here.

`assets/overview.mp4` is an unchanged copy of `OCR_Paper/output/video_edit/out/SAKI_ICRA2027_submission_v2.mp4`: 179.541 seconds, 1280 × 720, 25 fps, H.264/AAC, 18,495,750 bytes. English captions are burnt into the film; the optional WebVTT track is converted from its supplied SRT. The video’s labelled playback rates are preserved. Multi-location collection ends with the second can in the basket, as requested in the source conversation. Insets use approximate visual alignment.

The three method excerpts use exact ranges of that same video: interaction 21–33 s; reuse 33–42 s; assembly 50–65 s. Their posters are sampled at 27, 40 and 62 seconds; the film poster is at 99 seconds. The five-second homepage mosaic is rendered from the original `src/IntroMosaic.tsx` composition, retaining all 20 cells and their source timing but removing the title, desaturation, dimming and camera drift. Its poster is frame 30. Page text uses system Helvetica, with Helvetica Neue and Arial fallbacks, in two sizes: 20/36 px on desktop and 18/30 px on mobile. Typography burnt into the original video is unchanged. Prepared target paths are explanatory visualisations, not measured tracking results. Assembly footage and point clouds include separate captures; no synchronisation claim is made.

The silent homepage mosaic loops unless reduced motion is requested, in which case its poster remains visible until the visitor chooses to play. A visible control pauses or resumes it. Every other video requires user playback. Starting a video pauses the others; leaving the tab pauses playback. No analytics, external scripts, third-party embeds or runtime services.
