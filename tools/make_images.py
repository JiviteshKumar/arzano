"""Build responsive AVIF/WebP/JPEG variants: python -I make_images.py <src_dir> <out_dir> <manifest.json>"""
import json, os, sys
from PIL import Image, ImageOps

src, out, manifest_path = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
WIDTHS = [480, 800, 1200]
manifest = {}

for name in sorted(os.listdir(src)):
    if not name.lower().endswith('.jpg'):
        continue
    stem = name[:-4]
    im = ImageOps.exif_transpose(Image.open(os.path.join(src, name))).convert('RGB')
    w, h = im.size
    widths = [x for x in WIDTHS if x < w] + [w]
    widths = sorted(set(widths))
    for tw in widths:
        th = round(h * tw / w)
        r = im if tw == w else im.resize((tw, th), Image.LANCZOS)
        r.save(os.path.join(out, f'{stem}-{tw}.avif'), quality=55, speed=6)
        r.save(os.path.join(out, f'{stem}-{tw}.webp'), quality=78, method=6)
    # one progressive JPEG fallback at full size for very old browsers
    im.save(os.path.join(out, f'{stem}.jpg'), quality=80, optimize=True, progressive=True)
    manifest[stem] = {'w': w, 'h': h, 'widths': widths}

with open(manifest_path, 'w') as f:
    json.dump(manifest, f, indent=1)

def kb(ext):
    return sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.endswith(ext)) // 1024
print('images', len(manifest), '| avif', kb('.avif'), 'KB | webp', kb('.webp'), 'KB | jpg', kb('.jpg'), 'KB')
