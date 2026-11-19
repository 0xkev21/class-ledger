#!/usr/bin/env python3
import os
import subprocess
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets", "images")
TAURI_ICONS_DIR = os.path.join(PROJECT_DIR, "src-tauri", "icons")

# 1. Master Icon (iOS & Universal App Icon) - 1024x1024 square, RGB (no alpha)
MASTER_ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="45%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <radialGradient id="topGlow" cx="50%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="bookShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#1e1b4b" flood-opacity="0.38" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Opaque background with subtle depth -->
  <rect width="1024" height="1024" fill="url(#primaryGrad)" />
  <rect width="1024" height="1024" fill="url(#topGlow)" />
  <line x1="0" y1="1" x2="1024" y2="1" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />

  <!-- BookOpen Emblem: scale=22.5, centered: 512 - 12*22.5 = 242 -->
  <g transform="translate(242, 242) scale(22.5)"
     filter="url(#bookShadow)"
     fill="none"
     stroke="#ffffff"
     stroke-width="2.35"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </g>
</svg>"""

# 2. Android Adaptive Icon Background - 1024x1024
ANDROID_BG_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="45%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <radialGradient id="topGlow" cx="50%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#primaryGrad)" />
  <rect width="1024" height="1024" fill="url(#topGlow)" />
</svg>"""

# 3. Android Adaptive Icon Foreground - 1024x1024 transparent, inside 66% safe zone circle
ANDROID_FG_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <filter id="fgShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e1b4b" flood-opacity="0.32" />
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Scale 19, centered: 512 - 12*19 = 284. Safe circle radius = 313, max point radius = 266 -->
  <g transform="translate(284, 284) scale(19)"
     filter="url(#fgShadow)"
     fill="none"
     stroke="#ffffff"
     stroke-width="2.35"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </g>
</svg>"""

# 4. Android Adaptive Icon Monochrome - 1024x1024 transparent, white silhouette
ANDROID_MONO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Exact same scale 19, centered at 284 -->
  <g transform="translate(284, 284) scale(19)"
     fill="none"
     stroke="#ffffff"
     stroke-width="2.35"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </g>
</svg>"""

# 5. Splash Screen Icon - 1024x1024 transparent, centered squircle badge with soft elevation
SPLASH_ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="45%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <radialGradient id="splashGlow" cx="50%" cy="20%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="badgeShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#1e1b4b" flood-opacity="0.30" />
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Centered squircle badge: 560x560, rx=136 at (232, 232) -->
  <g filter="url(#badgeShadow)">
    <rect x="232" y="232" width="560" height="560" rx="136" fill="url(#splashGrad)" />
    <rect x="232" y="232" width="560" height="560" rx="136" fill="url(#splashGlow)" />
  </g>

  <!-- Book emblem inside badge: scale 15, centered: 512 - 12*15 = 332 -->
  <g transform="translate(332, 332) scale(15)"
     fill="none"
     stroke="#ffffff"
     stroke-width="2.35"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </g>
</svg>"""

# 6. Favicon SVG - 512x512
FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <radialGradient id="topGlow" cx="50%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="116" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="116" fill="url(#topGlow)" />
  <g transform="translate(116, 116) scale(11.6667)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </g>
</svg>"""


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
    # 1. icon.png must be 24-bit RGB (no alpha) for Apple App Store requirements
    icon_path = os.path.join(ASSETS_DIR, "icon.png")
    im_icon = Image.open(icon_path).convert("RGB")
    im_icon.save(icon_path, "PNG")
    print("Enforced 24-bit RGB on icon.png")

    # 2. Write favicon.svg and favicon.png (48x48 RGBA)
    favicon_svg_path = os.path.join(ASSETS_DIR, "favicon.svg")
    with open(favicon_svg_path, "w") as f:
        f.write(FAVICON_SVG)

    favicon_png_path = os.path.join(ASSETS_DIR, "favicon.png")
    subprocess.check_call(["magick", "-background", "none", favicon_svg_path, "-resize", "48x48", f"PNG32:{favicon_png_path}"])
    print("Generated favicon.svg and favicon.png (48x48)")

    # 3. Update Tauri desktop icons if tauri cli is present
    try:
        subprocess.check_call(["npx", "tauri", "icon", icon_path])
        print("Updated Tauri desktop icons in src-tauri/icons/")
    except Exception as e:
        print("Note: Tauri icon generation warning:", e)

    print("\nAll brand assets generated successfully!")


if __name__ == "__main__":
    main()
