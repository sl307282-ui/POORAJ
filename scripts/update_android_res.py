import os
from PIL import Image

base_png = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-icon.png"
master_img = Image.open(base_png).convert("RGBA")

# Mipmap densities and sizes
# (density, ic_launcher_size, ic_foreground_size)
mipmap_sizes = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

print("Updating Android Launcher Mipmaps...")
for density, size_launcher, size_fg in mipmap_sizes:
    folder = os.path.join(res_dir, f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    
    # 1. ic_launcher.webp
    img_launcher = master_img.resize((size_launcher, size_launcher), Image.Resampling.LANCZOS)
    img_launcher.save(os.path.join(folder, "ic_launcher.webp"), "WEBP")
    
    # 2. ic_launcher_round.webp
    img_launcher.save(os.path.join(folder, "ic_launcher_round.webp"), "WEBP")
    
    # 3. ic_launcher_foreground.webp
    img_fg = master_img.resize((size_fg, size_fg), Image.Resampling.LANCZOS)
    img_fg.save(os.path.join(folder, "ic_launcher_foreground.webp"), "WEBP")
    
    # Also save PNG fallbacks just in case
    img_launcher.save(os.path.join(folder, "ic_launcher.png"), "PNG")
    img_launcher.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
    img_fg.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")
    
    print(f"  - Updated mipmap-{density} ({size_launcher}x{size_launcher}, fg {size_fg}x{size_fg})")

# Splash screen logo sizes
drawable_sizes = [
    ("mdpi", 120),
    ("hdpi", 180),
    ("xhdpi", 240),
    ("xxhdpi", 360),
    ("xxxhdpi", 480)
]

print("Updating Android Splashscreen Logos...")
for density, splash_size in drawable_sizes:
    for prefix in ["drawable-", "drawable-night-"]:
        folder = os.path.join(res_dir, f"{prefix}{density}")
        os.makedirs(folder, exist_ok=True)
        img_splash = master_img.resize((splash_size, splash_size), Image.Resampling.LANCZOS)
        img_splash.save(os.path.join(folder, "splashscreen_logo.png"), "PNG")
        print(f"  - Updated {prefix}{density} (splashscreen_logo.png {splash_size}x{splash_size})")

print("All Android native resources updated successfully!")
