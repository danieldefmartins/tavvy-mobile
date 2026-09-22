#!/usr/bin/env python3
"""Regenerates Tavvy's mobile brand assets from two sources of truth:

  * assets/brand/tavvy-mark-source.png — the mark (purple leg, teal capsule,
    white dot) rasterized at 1276 px from the designer's vector file
    (tavvy-new-Logo.ai) and flattened to the brand colors #8A05BE / #00C2CB;
  * assets/brand/tavvy-wordmark-dark.png — the high-resolution wordmark, whose
    alpha is recolored to brand navy (#17013A) or white.

Layouts follow the designer's 300 ppi exports (horizontal 838x292: mark in
x 113-325 / y 57-222, wordmark x 366-723 / y 122-234; stacked 496x496: mark
x 129-366 / y 84-270, wordmark x 69-427 / y 300-412; icon: mark 74% wide,
centered on navy).

Outputs (RGBA PNG):
  assets/brand/tavvy-logo-horizontal-{dark,white}.png   2514x876
  assets/brand/tavvy-logo-stacked-{dark,white}.png      1024x1024
  assets/brand/tavvy-mark.png                           1024x1024 transparent
  assets/brand/tavvy-mark-circle.png                    1024x1024 mark on a navy circle
  assets/icon.png                                       App Store icon (opaque navy)
  assets/adaptive-icon.png                              Android adaptive foreground
  assets/splash-mark.png, assets/favicon.png
  ios/Tavvy/Images.xcassets/SplashScreenLogo.imageset/image*.png (from stacked white)

Run from the repository root: python3 scripts/generate-brand-assets.py
"""
from PIL import Image
import os

NAVY = (23, 1, 58, 255)
WHITE = (255, 255, 255, 255)
MARK = Image.open('assets/brand/tavvy-mark-source.png').convert('RGBA')
WORD = Image.open('assets/brand/tavvy-wordmark-dark.png').convert('RGBA')


def fit(img, width):
    return img.resize((int(round(width)), int(round(width * img.height / img.width))), Image.LANCZOS)


def wordmark(width, color):
    w = fit(WORD, width)
    out = Image.new('RGBA', w.size, color[:3] + (0,))
    out.putalpha(w.getchannel('A'))
    return out


def place(canvas, img, x, y):
    canvas.alpha_composite(img, (int(round(x)), int(round(y))))


def horizontal(color, S=3):
    c = Image.new('RGBA', (838 * S, 292 * S), (0, 0, 0, 0))
    place(c, fit(MARK, 212 * S), 113 * S, 57 * S)
    wm = wordmark(357 * S, color)
    place(c, wm, 366 * S, 234 * S - wm.height)
    return c


def stacked(px, color):
    c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    s = px / 496
    place(c, fit(MARK, 237 * s), 129 * s, 84 * s)
    wm = wordmark(358 * s, color)
    place(c, wm, 69 * s, 412 * s - wm.height)
    return c


def mark_on(px, frac, bg=None, circle=False):
    c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    if bg:
        from PIL import ImageDraw
        d = ImageDraw.Draw(c)
        if circle:
            d.ellipse([0, 0, px - 1, px - 1], fill=bg)
        else:
            d.rectangle([0, 0, px, px], fill=bg)
    m = fit(MARK, px * frac)
    place(c, m, (px - m.width) / 2, (px - m.height) / 2)
    return c


if __name__ == '__main__':
    horizontal(NAVY).save('assets/brand/tavvy-logo-horizontal-dark.png', optimize=True)
    horizontal(WHITE).save('assets/brand/tavvy-logo-horizontal-white.png', optimize=True)
    stacked(1024, NAVY).save('assets/brand/tavvy-logo-stacked-dark.png', optimize=True)
    white = stacked(1024, WHITE)
    white.save('assets/brand/tavvy-logo-stacked-white.png', optimize=True)
    mark_on(1024, 1.0).save('assets/brand/tavvy-mark.png', optimize=True)
    mark_on(1024, 0.62, bg=NAVY, circle=True).save('assets/brand/tavvy-mark-circle.png', optimize=True)
    mark_on(1024, 0.74, bg=NAVY).convert('RGB').save('assets/icon.png', optimize=True)
    mark_on(1024, 0.56, bg=NAVY).save('assets/adaptive-icon.png', optimize=True)
    mark_on(1024, 0.76).save('assets/splash-mark.png', optimize=True)
    mark_on(256, 1.0).resize((64, 64), Image.LANCZOS).save('assets/favicon.png', optimize=True)
    for name, px in [('image.png', 400), ('image@2x.png', 800), ('image@3x.png', 1200)]:
        white.resize((px, px), Image.LANCZOS).save(f'ios/Tavvy/Images.xcassets/SplashScreenLogo.imageset/{name}', optimize=True)
    print('brand assets regenerated')
