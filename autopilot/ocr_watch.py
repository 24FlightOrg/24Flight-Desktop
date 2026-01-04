#!/usr/bin/env python3
"""
ocr_watch.py
Simple helper that uses pytesseract+OpenCV to OCR a region of an image.

Usage examples:
  # Process single image, region given as normalized fractions (x, y, w, h)
  python ocr_watch.py --image "C:/path/to/img.png" --region 0.5 0.1 0.2 0.05 --out out.json

  # Watch a directory for new images (polling) and process newest file
  python ocr_watch.py --watch-dir "C:/Screenshots" --region 0.1 0.8 0.3 0.1 --poll 1.0

Region coordinates are fractions of width/height (0..1). If you prefer absolute pixels, pass --abs and provide pixel values.
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime

try:
    import cv2
    import numpy as np
    import pytesseract
except Exception as e:
    print("Missing dependency:", e, file=sys.stderr)
    print("Install with: pip install opencv-python pytesseract numpy", file=sys.stderr)
    sys.exit(2)


def preprocess(img):
    # convert to gray, resize a bit, denoise, adaptive threshold
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]
    # upscale small images to improve OCR
    scale = 1.0
    if max(w, h) < 800:
        scale = 2.0
    if scale != 1.0:
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LINEAR)
    # bilateral filter then adaptive threshold
    blur = cv2.bilateralFilter(gray, 9, 75, 75)
    th = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 21, 10)
    return th


def ocr_image(img):
    proc = preprocess(img)
    # Use tesseract to extract text and boxes
    custom_oem_psm_config = r"--oem 3 --psm 6"
    text = pytesseract.image_to_string(proc, config=custom_oem_psm_config)
    boxes = []
    data = pytesseract.image_to_data(proc, config=custom_oem_psm_config, output_type=pytesseract.Output.DICT)
    n = len(data.get('text', []))
    for i in range(n):
        txt = data['text'][i].strip()
        if not txt:
            continue
        boxes.append({
            'text': txt,
            'left': int(data['left'][i]),
            'top': int(data['top'][i]),
            'width': int(data['width'][i]),
            'height': int(data['height'][i]),
            'conf': int(data['conf'][i])
        })
    return text, boxes


def crop_region(img, region, abs_coords=False):
    h, w = img.shape[:2]
    if abs_coords:
        x, y, rw, rh = region
    else:
        x = int(region[0] * w)
        y = int(region[1] * h)
        rw = int(region[2] * w)
        rh = int(region[3] * h)
    x = max(0, min(w - 1, int(x)))
    y = max(0, min(h - 1, int(y)))
    rw = max(1, min(w - x, int(rw)))
    rh = max(1, min(h - y, int(rh)))
    return img[y:y+rh, x:x+rw]


def process_image_file(path, region=None, abs_coords=False, outpath=None):
    img = cv2.imread(path)
    if img is None:
        return {'error': 'could not read image', 'path': path}
    meta = {'source': path, 'ts': datetime.utcnow().isoformat() + 'Z', 'width': img.shape[1], 'height': img.shape[0]}
    if region:
        imgc = crop_region(img, region, abs_coords=abs_coords)
        meta['region_px'] = {'x': int(region[0] if abs_coords else region[0]*meta['width']),
                             'y': int(region[1] if abs_coords else region[1]*meta['height']),
                             'w': int(region[2] if abs_coords else region[2]*meta['width']),
                             'h': int(region[3] if abs_coords else region[3]*meta['height'])}
    else:
        imgc = img
    text, boxes = ocr_image(imgc)
    out = {'meta': meta, 'text': text, 'boxes': boxes}
    if outpath:
        try:
            with open(outpath, 'w', encoding='utf-8') as f:
                json.dump(out, f, ensure_ascii=False, indent=2)
        except Exception as e:
            out['write_error'] = str(e)
    return out


def watch_directory(dirpath, region, abs_coords, poll, outdir=None):
    seen = set()
    while True:
        try:
            files = [os.path.join(dirpath, p) for p in os.listdir(dirpath) if p.lower().endswith(('.png', '.jpg', '.jpeg'))]
            files.sort(key=lambda p: os.path.getmtime(p))
            for f in files:
                if f in seen: continue
                seen.add(f)
                print('Processing', f)
                out = process_image_file(f, region=region, abs_coords=abs_coords)
                print(json.dumps(out, ensure_ascii=False))
                if outdir:
                    base = os.path.splitext(os.path.basename(f))[0]
                    outpath = os.path.join(outdir, base + '.ocr.json')
                    try:
                        with open(outpath, 'w', encoding='utf-8') as fh:
                            json.dump(out, fh, ensure_ascii=False, indent=2)
                    except Exception as e:
                        print('Failed writing', outpath, e, file=sys.stderr)
            time.sleep(poll)
        except KeyboardInterrupt:
            return
        except Exception as e:
            print('watch error', e, file=sys.stderr)
            time.sleep(poll)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--image', help='Image file to process')
    p.add_argument('--watch-dir', help='Directory to watch for new images')
    p.add_argument('--out', help='Output json file')
    p.add_argument('--out-dir', help='Directory to write per-image outputs when watching')
    p.add_argument('--region', nargs=4, type=float, help='Region x y w h (fractions 0..1) or pixels if --abs')
    p.add_argument('--abs', dest='abs_coords', action='store_true', help='Treat region as absolute pixels')
    p.add_argument('--poll', type=float, default=1.0, help='Poll interval when watching (seconds)')
    args = p.parse_args()

    region = args.region if args.region else None

    if args.image:
        result = process_image_file(args.image, region=region, abs_coords=args.abs_coords, outpath=args.out)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.watch_dir:
        watch_directory(args.watch_dir, region=region, abs_coords=args.abs_coords, poll=args.poll, outdir=args.out_dir)
        return

    print('No image or watch-dir specified. See --help')


if __name__ == '__main__':
    main()
