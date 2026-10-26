"""Generate responsive AVIF + WebP variants (and a JPEG social preview) from source-assets/.

Usage: python scripts/optimize_images.py   (requires Pillow)
Originals stay in source-assets/ so they are not shipped in the production build.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets"
OUT = ROOT / "public" / "images"

# source filename -> short public name
IMAGES = {
    "Woman_posing_in_profile_2K_20261026021755-clean.png": "portrait",
    "consultant.png": "consultation",
    "Medical_spa_interior_design_2K_20261026021818-clean.png": "reception",
    "Medical_spa_treatment_room_2K_20261026021411-clean.png": "treatment-room",
    # First frame of public/videos/hero-loop.mp4 (1280x720): the hero poster and loop cross-fade target.
    "hero-video-first-frame.png": "hero-poster",
    "Woman_receiving_facial_massage_2K_20261026131140-clean.png": "facial",
}
# Widths above a source's native width are skipped: images are never upscaled.
WIDTHS = (640, 1024, 1280, 1600, 2000, 2400)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, name in IMAGES.items():
        im = Image.open(SRC / src_name).convert("RGB")
        for w in WIDTHS:
            if w > im.width or (w == 1280 and im.width != 1280):
                continue
            h = round(im.height * w / im.width)
            sized = im if w == im.width else im.resize((w, h), Image.LANCZOS)
            sized.save(OUT / f"{name}-{w}.webp", "WEBP", quality=82, method=6)
            sized.save(OUT / f"{name}-{w}.avif", "AVIF", quality=62, speed=4)
        print(f"{name}: {im.width}x{im.height}")

    # 1200x630 social preview cropped from the reception image
    im = Image.open(SRC / "Medical_spa_interior_design_2K_20261026021818-clean.png").convert("RGB")
    w, h = im.size
    crop_h = round(w * 630 / 1200)
    top = (h - crop_h) // 2
    im.crop((0, top, w, top + crop_h)).resize((1200, 630), Image.LANCZOS).save(
        OUT / "og-image.jpg", "JPEG", quality=82, optimize=True, progressive=True
    )


if __name__ == "__main__":
    main()
