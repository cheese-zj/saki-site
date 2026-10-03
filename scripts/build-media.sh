#!/bin/sh
# Rebuilds the clips added for the recovered-path cards and the demonstration/robot pairs.
# Sources live in the paper workspace; crops match or tighten the film's reviewed, face-excluding crops.
set -eu
SRC="${SRC:-$HOME/Developer/OCR_Paper/output/video_edit/public}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets"
ENC="-an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Can crop sits 180 px below the film's so a seated bystander's head stays out of frame.
# Quest captures matched to the observed centroid paths in v17/{can,wipe}.json.
# Clip time + data-offset = capture time, so the path can follow the video exactly.
ffmpeg -v error -y -ss 2 -to 9 -i "$SRC/assembly_can.mp4" -vf "crop=1160:660:100:620,scale=840:-2,fps=25" $ENC "$OUT/clips/learn-can.mp4"
ffmpeg -v error -y -ss 3 -to 15 -i "$SRC/assembly_wipe.mp4" -vf "crop=1280:928:0:300,scale=840:-2,fps=25" $ENC "$OUT/clips/learn-wipe.mp4"

# Quest door demonstration 20260907_233640: square subset of the reviewed crop (x 140, y 250, 330 x 370),
# replayed against its recorded frame timestamps.
node -e '
const t = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const lines = t.map((s, i) => `file '"'"'${process.argv[2]}/frame_${String(i).padStart(4, "0")}.jpg'"'"'\nduration ${((t[i + 1] ?? s + 0.125) - s).toFixed(3)}`);
lines.push(`file '"'"'${process.argv[2]}/frame_${String(t.length - 1).padStart(4, "0")}.jpg'"'"'`);
require("fs").writeFileSync(process.argv[3], lines.join("\n"));
' "$SRC/../src/data/quest-door-timing.json" "$SRC/v12/quest-door" "$TMP/door.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/door.txt" -vf "crop=330:330:140:270,scale=540:540:flags=lanczos,fps=25" $ENC "$OUT/clips/human-door.mp4"

# Point-cloud scenes behind the paths.
cwebp -quiet -q 82 "$SRC/v17/can.png" -o "$OUT/figures/path-can.webp"
cwebp -quiet -q 82 "$SRC/v17/wipe.png" -o "$OUT/figures/path-wipe.webp"

# Posters.
ffmpeg -v error -y -ss 1.2 -i "$OUT/clips/learn-can.mp4" -frames:v 1 "$TMP/poster.png" && cwebp -quiet -q 78 "$TMP/poster.png" -o "$OUT/clips/learn-can.webp"
ffmpeg -v error -y -ss 3.5 -i "$OUT/clips/learn-wipe.mp4" -frames:v 1 "$TMP/poster.png" && cwebp -quiet -q 78 "$TMP/poster.png" -o "$OUT/clips/learn-wipe.webp"
ffmpeg -v error -y -ss 3 -i "$OUT/clips/human-door.mp4" -frames:v 1 "$TMP/poster.png" && cwebp -quiet -q 78 "$TMP/poster.png" -o "$OUT/clips/human-door.webp"
