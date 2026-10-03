"""Render an observed object path over its fused Quest scene, in the film's v17 style.

Orthographic point splat of the fused background cloud (world y up), blended 42% onto paper,
plus the observed centroids projected with the same camera. Prints the page's data-path string:
x,y,t with t in seconds from the first Quest frame, so it matches the 1x demonstration clip.

usage: python3 render-path-scene.py SCENE.ply TRAJECTORY.csv T0_MS AZIMUTH_DEG ELEVATION_DEG ZOOM OUT.png
"""
import csv, sys
import numpy as np
from PIL import Image

W, H, S = 1400, 900, 2
PAPER = np.array([246, 245, 240], dtype=np.float32)


def read_ply(path):
    with open(path, 'rb') as f:
        header = []
        while header[-1:] != ['end_header']:
            header.append(f.readline().decode().strip())
        types = {'double': '<f8', 'float': '<f4', 'uchar': 'u1'}
        props = [line.split()[1:] for line in header if line.startswith('property ')]
        n = int(next(line for line in header if line.startswith('element vertex')).split()[-1])
        a = np.fromfile(f, dtype=[(name, types[t]) for t, name in props], count=n)
    return np.c_[a['x'], a['y'], a['z']], np.c_[a['red'], a['green'], a['blue']].astype(np.float32)


scene_path, csv_path, t0, azimuth, elevation, zoom, out = sys.argv[1:]
xyz, rgb = read_ply(scene_path)
rows = [r for r in csv.DictReader(open(csv_path)) if r['valid'] == 'True']
centres = np.array([[float(r[f'centroid_world_rh_{k}']) for k in 'xyz'] for r in rows])
times = (np.array([int(r['timestamp_ms']) for r in rows]) - int(t0)) / 1000

# Camera: looks at the path centre from the given azimuth/elevation, world y up.
target = centres.mean(0)
az, el = np.radians(float(azimuth)), np.radians(float(elevation))
back = np.array([np.cos(el) * np.sin(az), np.sin(el), np.cos(el) * np.cos(az)])
right = np.cross([0, 1, 0], back); right /= np.linalg.norm(right)
up = np.cross(back, right)
def view(p):
    d = p - target
    return np.c_[d @ right, d @ up, d @ back]

v = view(xyz)
keep = np.abs(v[:, :2]).max(1) < 1.6 / float(zoom)
v, rgb = v[keep], rgb[keep]
span = np.array([W / H, 1.0]) * 0.9 / float(zoom)
def to_px(q):
    return np.c_[(q[:, 0] / span[0] + .5) * W, (.5 - q[:, 1] / span[1]) * H]

# Far-to-near square splats at S x resolution.
canvas = np.tile(PAPER, (H * S, W * S, 1))
uv = (to_px(v) * S).round().astype(int)
order = np.argsort(v[:, 2])
r = 3
for i in order:
    x, y = uv[i]
    if r <= x < W * S - r and r <= y < H * S - r:
        canvas[y - r:y + r + 1, x - r:x + r + 1] = rgb[i]
canvas = PAPER + (canvas - PAPER) * .6
Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).resize((W, H), Image.Resampling.LANCZOS).save(out)

path = to_px(view(centres))
print(' '.join(f'{x:.0f},{y:.0f},{t:.3f}'.rstrip('0').rstrip('.') for (x, y), t in zip(path, times)))
