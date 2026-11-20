#!/usr/bin/env python3
import hashlib
import os
import subprocess
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets", "images")
TAURI_ICONS_DIR = os.path.join(PROJECT_DIR, "src-tauri", "icons")

OPEN_BOOK_COLOR_PATHS = """    <path d="M7.5 9.5C7.5 8.67 8.17 8 9 8H15.5V23.5H9C8.17 23.5 7.5 22.83 7.5 22V9.5Z" fill="#f7f9fa" />
    <path d="M16.5 8H23C23.83 8 24.5 8.67 24.5 9.5V22C24.5 22.83 23.83 23.5 23 23.5H16.5V8Z" fill="#ecf0f2" />
    <rect x="19" y="8" width="2.5" height="6.5" rx="0.6" fill="#0d7480" />
    <path d="M9.5 12H13.5M9.5 15.5H13.5M9.5 19H12.5" stroke="#1f3038" stroke-width="1.5" stroke-linecap="round" />
    <path d="M18.5 17H22.5M18.5 20H21.5" stroke="#0d7480" stroke-width="1.5" stroke-linecap="round" />"""

# 1. Master Icon (iOS & Universal App Icon) - 1024x1024 square, 24-bit RGB (no alpha)
MASTER_ICON_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#263a44" />
      <stop offset="50%" stop-color="#1f3038" />
      <stop offset="100%" stop-color="#16232a" />
    </linearGradient>
    <radialGradient id="tealGlow" cx="78%" cy="18%" r="68%">
      <stop offset="0%" stop-color="#0d7480" stop-opacity="0.28" />
      <stop offset="70%" stop-color="#0d7480" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1024" height="1024" fill="url(#slateGrad)" />
  <rect width="1024" height="1024" fill="url(#tealGlow)" />

  <g transform="translate(32, 39.5) scale(30)">
{OPEN_BOOK_COLOR_PATHS}
  </g>
</svg>"""

# 2. Android Adaptive Icon Background - 1024x1024 opaque 24-bit RGB
ANDROID_BG_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#263a44" />
      <stop offset="50%" stop-color="#1f3038" />
      <stop offset="100%" stop-color="#16232a" />
    </linearGradient>
    <radialGradient id="tealGlow" cx="78%" cy="18%" r="68%">
      <stop offset="0%" stop-color="#0d7480" stop-opacity="0.28" />
      <stop offset="70%" stop-color="#0d7480" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#slateGrad)" />
  <rect width="1024" height="1024" fill="url(#tealGlow)" />
</svg>"""

# 3. Android Adaptive Icon Foreground - 1024x1024 transparent RGBA, inside 66% safe zone circle
ANDROID_FG_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="translate(112, 118.25) scale(25)">
{OPEN_BOOK_COLOR_PATHS}
  </g>
</svg>"""

# 4. Android Adaptive Icon Monochrome - 1024x1024 transparent RGBA, crisp white silhouette
ANDROID_MONO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="translate(112, 118.25) scale(25)">
    <path d="M7.5 9.5C7.5 8.67 8.17 8 9 8H15.5V23.5H9C8.17 23.5 7.5 22.83 7.5 22V9.5Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
    <path d="M16.5 8H23C23.83 8 24.5 8.67 24.5 9.5V22C24.5 22.83 23.83 23.5 23 23.5H16.5V8Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
    <rect x="19" y="8" width="2.5" height="6.5" rx="0.6" fill="#ffffff" />
    <path d="M9.5 12H13.5M9.5 15.5H13.5M9.5 19H12.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
    <path d="M18.5 17H22.5M18.5 20H21.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" />
  </g>
</svg>"""

# 5. Splash Screen Icon - 1024x1024 transparent RGBA, centered squircle badge
SPLASH_ICON_SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#263a44" />
      <stop offset="50%" stop-color="#1f3038" />
      <stop offset="100%" stop-color="#16232a" />
    </linearGradient>
    <radialGradient id="splashGlow" cx="78%" cy="18%" r="68%">
      <stop offset="0%" stop-color="#0d7480" stop-opacity="0.28" />
      <stop offset="70%" stop-color="#0d7480" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="232" y="232" width="560" height="560" rx="136" fill="url(#splashGrad)" />
  <rect x="232" y="232" width="560" height="560" rx="136" fill="url(#splashGlow)" />
  <rect x="232" y="232" width="560" height="560" rx="136" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="3" />

  <g transform="translate(224, 228.5) scale(18)">
{OPEN_BOOK_COLOR_PATHS}
  </g>
</svg>"""

# 6. Favicon SVG - 512x512 matching public/landing/favicon.svg BrandMark
FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512" fill="none">
  <rect width="32" height="32" rx="8" fill="#1f3038" />
  <path d="M7.5 9.5C7.5 8.67 8.17 8 9 8H15.5V23.5H9C8.17 23.5 7.5 22.83 7.5 22V9.5Z" fill="#f7f9fa" />
  <path d="M16.5 8H23C23.83 8 24.5 8.67 24.5 9.5V22C24.5 22.83 23.83 23.5 23 23.5H16.5V8Z" fill="#ecf0f2" />
  <rect x="19" y="8" width="2.5" height="6.5" rx="0.6" fill="#0d7480" />
  <path d="M9.5 12H13.5M9.5 15.5H13.5M9.5 19H12.5" stroke="#1f3038" stroke-width="1.5" stroke-linecap="round" />
  <path d="M18.5 17H22.5M18.5 20H21.5" stroke="#0d7480" stroke-width="1.5" stroke-linecap="round" />
</svg>"""


def file_sha256(path: str) -> str:
    if not os.path.exists(path):
        return ""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def fallback_generate_tauri_icons(master_icon_path: str) -> None:
    if not os.path.isdir(TAURI_ICONS_DIR):
        return

    master_rgba = Image.open(master_icon_path).convert("RGBA")
    updated_pngs = 0

    for root, _, files in os.walk(TAURI_ICONS_DIR):
        for name in files:
            if not name.lower().endswith(".png"):
                continue
            target_path = os.path.join(root, name)
            try:
                with Image.open(target_path) as existing:
                    size = existing.size
            except Exception:
                size = (512, 512)
            resized = master_rgba.resize(size, Image.Resampling.LANCZOS)
            resized.save(target_path, "PNG")
            updated_pngs += 1

    ico_path = os.path.join(TAURI_ICONS_DIR, "icon.ico")
    master_rgba.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    icns_path = os.path.join(TAURI_ICONS_DIR, "icon.icns")
    try:
        master_rgba.save(icns_path, format="ICNS")
        print(f"PIL fallback updated {updated_pngs} PNGs, icon.ico, and icon.icns in src-tauri/icons/")
    except Exception as icns_err:
        print(
            f"PIL fallback updated {updated_pngs} PNGs and icon.ico in src-tauri/icons/ (ICNS skipped: {icns_err})"
        )


def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    temp_dir = "/tmp/class_ledger_assets"
    os.makedirs(temp_dir, exist_ok=True)

    svg_map = {
        "icon": (MASTER_ICON_SVG, "icon.png", False),
        "android-icon-background": (ANDROID_BG_SVG, "android-icon-background.png", False),
        "android-icon-foreground": (ANDROID_FG_SVG, "android-icon-foreground.png", True),
        "android-icon-monochrome": (ANDROID_MONO_SVG, "android-icon-monochrome.png", True),
        "splash-icon": (SPLASH_ICON_SVG, "splash-icon.png", True),
    }

    # Write SVGs and render with ImageMagick
    for key, (svg_content, png_name, has_alpha) in svg_map.items():
        svg_file = os.path.join(temp_dir, f"{key}.svg")
        with open(svg_file, "w") as f:
            f.write(svg_content)

        out_png = os.path.join(ASSETS_DIR, png_name)
        if has_alpha:
            cmd = ["magick", "-background", "none", svg_file, f"PNG32:{out_png}"]
        else:
            cmd = ["magick", svg_file, f"PNG24:{out_png}"]
        subprocess.check_call(cmd)
        print(f"Rendered {png_name} via ImageMagick")

    # Post-process with PIL to guarantee strict requirements:
    # 1. icon.png and android-icon-background.png must be 24-bit RGB (no alpha)
    icon_path = os.path.join(ASSETS_DIR, "icon.png")
    im_icon = Image.open(icon_path).convert("RGB")
    im_icon.save(icon_path, "PNG")
    print("Enforced 24-bit RGB on icon.png")

    bg_path = os.path.join(ASSETS_DIR, "android-icon-background.png")
    im_bg = Image.open(bg_path).convert("RGB")
    im_bg.save(bg_path, "PNG")
    print("Enforced 24-bit RGB on android-icon-background.png")

    # 2. Write favicon.svg and favicon.png (48x48 RGBA)
    favicon_svg_path = os.path.join(ASSETS_DIR, "favicon.svg")
    with open(favicon_svg_path, "w") as f:
        f.write(FAVICON_SVG)

    favicon_png_path = os.path.join(ASSETS_DIR, "favicon.png")
    subprocess.check_call(
        ["magick", "-background", "none", favicon_svg_path, "-resize", "48x48", f"PNG32:{favicon_png_path}"]
    )
    print("Generated favicon.svg and favicon.png (48x48)")

    # 3. Update Tauri desktop icons (check whether npx tauri icon succeeded and refreshed 128x128.png)
    ref_tauri_icon = os.path.join(TAURI_ICONS_DIR, "128x128.png")
    before_hash = file_sha256(ref_tauri_icon)
    tauri_ok = False
    try:
        env = os.environ.copy()
        if "/usr/bin" not in env.get("PATH", "").split(":"):
            env["PATH"] = f"/usr/bin:{env.get('PATH', '')}"
        res = subprocess.run(["npx", "tauri", "icon", icon_path], env=env, check=False)
        after_hash = file_sha256(ref_tauri_icon)
        if res.returncode == 0 and after_hash and after_hash != before_hash:
            tauri_ok = True
            print("Updated Tauri desktop icons in src-tauri/icons/ via Tauri CLI")
        else:
            print(f"Tauri CLI returned {res.returncode} (updated={after_hash != before_hash}); running PIL fallback")
    except Exception as e:
        print("Tauri CLI unavailable; running PIL fallback:", e)

    if not tauri_ok:
        fallback_generate_tauri_icons(icon_path)

    print("\nAll brand assets generated successfully!")


if __name__ == "__main__":
    main()
