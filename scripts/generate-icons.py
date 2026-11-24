#!/usr/bin/env python3
"""Regenerate the PWA icons (public/icons/*.png) from scratch.

The PNG icons are binary files, so they are generated locally instead of
being hand-edited. Requires Pillow:  pip install Pillow

Usage:  python3 scripts/generate-icons.py
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons"

BG = (11, 10, 20)          # #0b0a14
VIOLET = (139, 92, 246)    # #8b5cf6
INDIGO = (99, 102, 241)    # #6366f1
CYAN = (34, 211, 238)      # #22d3ee


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    # Waveform bars across the centre.
    bars = 9
    margin = size * (0.22 if maskable else 0.14)
    avail = size - 2 * margin
    gap = avail * 0.08
    bw = (avail - gap * (bars - 1)) / bars
    cx, cy = size / 2, size / 2
    max_h = size * (0.42 if maskable else 0.56)
    for i in range(bars):
        t = i / max(1, bars - 1)
        h = max_h * (0.35 + 0.65 * math.sin(math.pi * t) ** 0.8)
        x0 = margin + i * (bw + gap)
        x1 = x0 + bw
        color = _lerp(_lerp(VIOLET, INDIGO, t), CYAN, max(0.0, t - 0.6) * 2)
        draw.rounded_rectangle([x0, cy - h / 2, x1, cy + h / 2], radius=bw / 2, fill=color)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon(192, False).save(OUT / "icon-192.png")
    make_icon(512, False).save(OUT / "icon-512.png")
    make_icon(512, True).save(OUT / "maskable-512.png")
    print("Icons written to", OUT)


if __name__ == "__main__":
    main()
