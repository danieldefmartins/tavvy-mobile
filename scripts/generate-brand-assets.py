#!/usr/bin/env python3
"""Regenerates Tavvy's mobile brand assets from two sources of truth:

  * the mark geometry measured from assets/icon.png (the App Store icon that
    matches tavvy.com's purple/teal identity), drawn as vector shapes so every
    output is crisp at any size;
  * assets/brand/tavvy-wordmark-dark.png, the high-resolution wordmark, whose
    alpha is recolored to brand navy (#17013A) or white.

Outputs (all RGBA PNG):
  assets/brand/tavvy-logo-horizontal-{dark,white}.png   2448x716, same layout as web tavvy-logo-{dark,white}.png
  assets/brand/tavvy-logo-stacked-{dark,white}.png      1024x1024 mark above wordmark (splash, guest headers)
  assets/brand/tavvy-mark.png                           1024x1024 mark only, transparent
  assets/brand/tavvy-mark-circle.png                    1024x1024 mark on a navy circle
  assets/adaptive-icon.png                              Android adaptive foreground (mark on navy, safe padding)
  assets/splash-mark.png, assets/favicon.png

Run from the repository root: python3 scripts/generate-brand-assets.py
"""
from PIL import Image, ImageDraw
import os

PURPLE = (138, 5, 190, 255)
TEAL = (0, 194, 203, 255)
WHITE = (255, 255, 255, 255)
NAVY = (23, 1, 58, 255)
SS = 4  # supersampling factor for anti-aliased edges
MARK_W, MARK_H = 761, 597  # mark bounding box in icon.png space (x 130..891, y 213..810)


def draw_mark(scale, ox, oy, canvas):
    """Draw the mark (icon.png coordinates scaled by `scale`, offset by ox/oy) onto an RGBA canvas."""
    W, H = canvas.size
    big = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)

    def P(x, y):
        return ((ox + x * scale) * SS, (oy + y * scale) * SS)

    r = 163 * scale * SS
    cx, cy = P(293, 484)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PURPLE)
    a, b = P(467, 638), P(741, 364)
    for (x, y) in (a, b):
        d.ellipse([x - r, y - r, x + r, y + r], fill=TEAL)
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = (dx * dx + dy * dy) ** 0.5
    nx, ny = -dy / L * r, dx / L * r
    d.polygon([(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)], fill=TEAL)
    wx, wy = P(457, 645)
    wr = 65 * scale * SS
    d.ellipse([wx - wr, wy - wr, wx + wr, wy + wr], fill=WHITE)
    canvas.alpha_composite(big.resize((W, H), Image.LANCZOS))
    return canvas


def wordmark(width, color):
    w = Image.open('assets/brand/tavvy-wordmark-dark.png').convert('RGBA')
    h = round(width * w.height / w.width)
    w = w.resize((width, h), Image.LANCZOS)
    out = Image.new('RGBA', w.size, color[:3] + (0,))
    out.putalpha(w.getchannel('A'))
    return out


def horizontal(color, S=4):
    """Same layout as the 612x179 web logo: mark in x 1..212, wordmark from x 246 to the right edge."""
    W, H = 612 * S, 179 * S
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    scale = (212 * S) / MARK_W
    draw_mark(scale, 1 * S - 130 * scale, 1 * S - 213 * scale, c)
    wm = wordmark(365 * S, color)
    c.alpha_composite(wm, (246 * S, (177 * S) - wm.height))
    return c


def mark_only(px, pad=0.0, bg=None, circle=False):
    c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    if bg:
        d = ImageDraw.Draw(c)
        if circle:
            d.ellipse([0, 0, px - 1, px - 1], fill=bg)
        else:
            d.rectangle([0, 0, px, px], fill=bg)
    scale = px * (1 - 2 * pad) / MARK_W
    ox = (px - MARK_W * scale) / 2 - 130 * scale
    oy = (px - MARK_H * scale) / 2 - 213 * scale
    return draw_mark(scale, ox, oy, c)


def stacked(px, color):
    c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    mw = px * 0.56
    scale = mw / MARK_W
    draw_mark(scale, (px - mw) / 2 - 130 * scale, px * 0.10 - 213 * scale, c)
    wm = wordmark(round(px * 0.72), color)
    c.alpha_composite(wm, ((px - wm.width) // 2, round(px * 0.10 + MARK_H * scale + px * 0.06)))
    return c


if __name__ == '__main__':
    os.makedirs('assets/brand', exist_ok=True)
    horizontal(NAVY).save('assets/brand/tavvy-logo-horizontal-dark.png', optimize=True)
    horizontal(WHITE).save('assets/brand/tavvy-logo-horizontal-white.png', optimize=True)
    mark_only(1024).save('assets/brand/tavvy-mark.png', optimize=True)
    mark_only(1024, pad=0.16, bg=NAVY, circle=True).save('assets/brand/tavvy-mark-circle.png', optimize=True)
    stacked(1024, NAVY).save('assets/brand/tavvy-logo-stacked-dark.png', optimize=True)
    stacked(1024, WHITE).save('assets/brand/tavvy-logo-stacked-white.png', optimize=True)
    mark_only(1024, pad=0.20, bg=NAVY).save('assets/adaptive-icon.png', optimize=True)
    mark_only(1024, pad=0.12).save('assets/splash-mark.png', optimize=True)
    mark_only(256).resize((64, 64), Image.LANCZOS).save('assets/favicon.png', optimize=True)
    print('brand assets regenerated')
