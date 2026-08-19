import os
from PIL import Image

round_png = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-round-icon.png"
master_img = Image.open(round_png).convert("RGBA")

res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

# 1. Update Android Splash Screen Logos
drawable_sizes = [
    ("mdpi", 120),
    ("hdpi", 180),
    ("xhdpi", 240),
    ("xxhdpi", 360),
    ("xxxhdpi", 480)
]

print("Updating Android Splashscreen Logos with new pristine Round Logo...")
for density, splash_size in drawable_sizes:
    for prefix in ["drawable-", "drawable-night-"]:
        folder = os.path.join(res_dir, f"{prefix}{density}")
        os.makedirs(folder, exist_ok=True)
        img_splash = master_img.resize((splash_size, splash_size), Image.Resampling.LANCZOS)
        img_splash.save(os.path.join(folder, "splashscreen_logo.png"), "PNG")
        print(f"  - Updated {prefix}{density}/splashscreen_logo.png ({splash_size}x{splash_size})")

# 2. Update ic_launcher_round.webp for launcher round icons
mipmap_sizes = [
    ("mdpi", 48),
    ("hdpi", 72),
    ("xhdpi", 96),
    ("xxhdpi", 144),
    ("xxxhdpi", 192)
]

print("Updating Android ic_launcher_round.webp icons...")
for density, size in mipmap_sizes:
    folder = os.path.join(res_dir, f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    img_round = master_img.resize((size, size), Image.Resampling.LANCZOS)
    img_round.save(os.path.join(folder, "ic_launcher_round.webp"), "WEBP")
    print(f"  - Updated mipmap-{density}/ic_launcher_round.webp ({size}x{size})")

print("All Android native round logo resources updated successfully!")
