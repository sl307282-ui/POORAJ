import os
from PIL import Image

photo_path = "/Users/sl307282gmail.com/Desktop/PHOTO-2026-08-19-11-56-51.jpg"

if not os.path.exists(photo_path):
    print(f"Error: {photo_path} not found")
    exit(1)

# Open original image uploaded by the user
orig_img = Image.open(photo_path).convert("RGBA")

# Ensure 1:1 square aspect ratio
w, h = orig_img.size
min_dim = min(w, h)
left = (w - min_dim) // 2
top = (h - min_dim) // 2
square_img = orig_img.crop((left, top, left + min_dim, top + min_dim))

# Master 1024x1024 image
master_1024 = square_img.resize((1024, 1024), Image.Resampling.LANCZOS)

# 1. Update project assets
assets_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images"
master_1024.save(os.path.join(assets_dir, "pooraj-icon.png"), "PNG")
master_1024.save(os.path.join(assets_dir, "android-icon-foreground.png"), "PNG")

fav_192 = master_1024.resize((192, 192), Image.Resampling.LANCZOS)
fav_192.save(os.path.join(assets_dir, "favicon.png"), "PNG")

print("Updated master assets from original photo!")

# 2. Update Android native res mipmaps
res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

mipmap_sizes = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

for density, size_launcher, size_fg in mipmap_sizes:
    folder = os.path.join(res_dir, f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    
    img_launcher = master_1024.resize((size_launcher, size_launcher), Image.Resampling.LANCZOS)
    img_launcher.save(os.path.join(folder, "ic_launcher.webp"), "WEBP")
    img_launcher.save(os.path.join(folder, "ic_launcher_round.webp"), "WEBP")
    
    img_fg = master_1024.resize((size_fg, size_fg), Image.Resampling.LANCZOS)
    img_fg.save(os.path.join(folder, "ic_launcher_foreground.webp"), "WEBP")
    print(f"  - Updated mipmap-{density} WebP icons")

# 3. Update Android Splashscreen Logos
# For Android 12+ splash screens, add padding so the rounded square box fits completely within the splash screen circle mask
drawable_sizes = [
    ("mdpi", 120),
    ("hdpi", 180),
    ("xhdpi", 240),
    ("xxhdpi", 360),
    ("xxxhdpi", 480)
]

for density, splash_size in drawable_sizes:
    for prefix in ["drawable-", "drawable-night-"]:
        folder = os.path.join(res_dir, f"{prefix}{density}")
        os.makedirs(folder, exist_ok=True)
        
        # Create transparent canvas with padded logo to fit full box inside Android 12 splash screen
        canvas = Image.new("RGBA", (splash_size, splash_size), (0, 0, 0, 0))
        inner_size = int(splash_size * 0.75) # 75% scale so full rounded box is visible
        scaled_logo = master_1024.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        
        offset = (splash_size - inner_size) // 2
        canvas.paste(scaled_logo, (offset, offset), scaled_logo)
        
        canvas.save(os.path.join(folder, "splashscreen_logo.png"), "PNG")
        print(f"  - Updated {prefix}{density} splashscreen_logo.png")

print("All original photo resources processed and updated!")
