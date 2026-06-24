#!/usr/bin/env python3
"""Generate branded QR code assets for The Wall Records."""

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

URL = "https://thewall.adelev8.com"
# Brand palette: Oatmilk Linen + Brunch Tomato
LINEN = "#F0E7C8"
TOMATO = "#B22000"
LINEN_DARK = "#D9CEAE"
LINEN_RGB = (240, 231, 200)
TOMATO_RGB = (178, 32, 0)
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "qr"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_qr_core(size: int) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=SolidFillColorMask(back_color=LINEN_RGB, front_color=TOMATO_RGB),
    ).convert("RGBA")
    return img.resize((size, size), Image.Resampling.LANCZOS)


def draw_branded_card(width: int, height: int) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), LINEN)
    draw = ImageDraw.Draw(canvas)

    margin = int(width * 0.08)
    frame = margin // 2
    draw.rounded_rectangle(
        (frame, frame, width - frame, height - frame),
        radius=int(width * 0.03),
        fill=TOMATO,
        outline=LINEN_DARK,
        width=2,
    )

    title_font = load_font(int(width * 0.052), bold=True)
    label_font = load_font(int(width * 0.028))
    small_font = load_font(int(width * 0.022))
    serif_font = load_font(int(width * 0.07), bold=True)

    inner_left = margin
    inner_right = width - margin
    inner_top = margin
    inner_bottom = height - margin

    draw.text((inner_left, inner_top), "WELCOME TO", fill=LINEN, font=label_font)
    draw.text((inner_left, inner_top + int(width * 0.05)), "THE WALL", fill=LINEN, font=title_font)

    divider_x = int(width * 0.58)
    draw.line((divider_x, inner_top, divider_x, inner_bottom), fill=LINEN_DARK, width=2)

    qr_size = int(height * 0.52)
    qr = make_qr_core(qr_size)
    qr_x = divider_x + ((width - divider_x - margin) - qr_size) // 2
    qr_y = inner_top + int(height * 0.06)

    pad = int(qr_size * 0.06)
    draw.rounded_rectangle(
        (qr_x - pad, qr_y - pad, qr_x + qr_size + pad, qr_y + qr_size + pad),
        radius=int(pad * 0.8),
        fill=LINEN,
    )
    canvas.paste(qr, (qr_x, qr_y), qr)

    draw.text(
        (qr_x, qr_y + qr_size + int(pad * 1.4)),
        "Scan to visit",
        fill=LINEN,
        font=small_font,
    )
    draw.text(
        (qr_x, qr_y + qr_size + int(pad * 2.6)),
        "thewall.adelev8.com",
        fill=LINEN_DARK,
        font=small_font,
    )

    draw.text((inner_left, int(height * 0.42)), "the.Wall", fill=LINEN, font=serif_font)
    draw.text(
        (inner_left, int(height * 0.54)),
        "your personal archive",
        fill=LINEN_DARK,
        font=label_font,
    )
    draw.text(
        (inner_left, inner_bottom - int(width * 0.08)),
        "Your future self is going to love this.",
        fill=LINEN,
        font=small_font,
    )

    return canvas


def make_square_qr(size: int) -> Image.Image:
    pad = int(size * 0.12)
    canvas = Image.new("RGBA", (size, size), TOMATO)
    draw = ImageDraw.Draw(canvas)

    inner = size - pad * 2
    draw.rounded_rectangle(
        (pad, pad, size - pad, size - pad),
        radius=int(pad * 0.5),
        fill=LINEN,
    )

    qr_size = int(inner * 0.78)
    qr = make_qr_core(qr_size)
    offset = (size - qr_size) // 2
    canvas.paste(qr, (offset, offset), qr)

    label_font = load_font(int(size * 0.045))
    text = "thewall.adelev8.com"
    bbox = draw.textbbox((0, 0), text, font=label_font)
    text_w = bbox[2] - bbox[0]
    draw.text(
        ((size - text_w) // 2, size - pad + int(pad * 0.15)),
        text,
        fill=LINEN,
        font=label_font,
    )
    return canvas


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    card = draw_branded_card(2400, 1400)
    card_rgb = Image.new("RGB", card.size, LINEN)
    card_rgb.paste(card, mask=card.split()[3])
    card_rgb.save(OUTPUT_DIR / "the-wall-qr-card.png", "PNG", optimize=True)

    square = make_square_qr(2000)
    square_rgb = Image.new("RGB", square.size, TOMATO)
    square_rgb.paste(square, mask=square.split()[3])
    square_rgb.save(OUTPUT_DIR / "the-wall-qr.png", "PNG", optimize=True)

    qr_only = make_qr_core(1800)
    qr_bg = Image.new("RGB", (2000, 2000), LINEN)
    offset = (2000 - 1800) // 2
    qr_bg.paste(qr_only, (offset, offset), qr_only)
    qr_bg.save(OUTPUT_DIR / "the-wall-qr-code-only.png", "PNG", optimize=True)

    import segno

    qr_svg = segno.make(URL, error="h")
    qr_svg.save(
        OUTPUT_DIR / "the-wall-qr.svg",
        scale=8,
        dark=TOMATO,
        light=LINEN,
        border=2,
    )

    print(f"Saved QR assets to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
