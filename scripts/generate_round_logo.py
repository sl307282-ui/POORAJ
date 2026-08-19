import math
import os
from PIL import Image, ImageDraw

photo_path = "/Users/sl307282gmail.com/Desktop/PHOTO-2026-08-19-11-56-51.jpg"
orig_img = Image.open(photo_path).convert("RGBA")

# Extract the inner 'P' symbol from original photo or master logo
# Create a 1024x1024 canvas for the Circular Logo
canvas_size = 1024
img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

center = canvas_size / 2.0
radius = 440.0
border_width = 24.0

# 1. Fill Circle Background (Light Gray #EAEBED)
bg_bbox = [center - radius, center - radius, center + radius, center + radius]
draw.ellipse(bg_bbox, fill=(234, 235, 237, 255))

# 2. Outer Ring Border: Half Red, Half Blue
# Red Arc: Top-Right half (from 135 deg to 315 deg, i.e., -45 deg to 135 deg)
# Blue Arc: Bottom-Left half (from 315 deg to 135 deg)
ring_bbox = [
    center - radius + border_width / 2.0,
    center - radius + border_width / 2.0,
    center + radius - border_width / 2.0,
    center + radius - border_width / 2.0
]

red_color = (222, 22, 35, 255) # Red #DE1623
blue_color = (11, 42, 122, 255) # Blue #0B2A7A

# Draw Top-Right Red Half Arc (from -45 to 135 degrees)
draw.arc(ring_bbox, start=-45, end=135, fill=red_color, width=int(border_width))

# Draw Bottom-Left Blue Half Arc (from 135 to 315 degrees)
draw.arc(ring_bbox, start=135, end=315, fill=blue_color, width=int(border_width))

# 3. Paste/Center the 'P' symbol inside the circle
# Crop the 'P' symbol from orig_img
w, h = orig_img.size
# Crop inner 'P' region (middle ~45% of image)
p_box = (int(w * 0.28), int(h * 0.26), int(w * 0.72), int(h * 0.76))
p_cropped = orig_img.crop(p_box)

# Scale 'P' symbol to fit inside circle
p_target_height = int(radius * 1.05) # ~460px
p_target_width = int(p_cropped.width * (p_target_height / p_cropped.height))
p_scaled = p_cropped.resize((p_target_width, p_target_height), Image.Resampling.LANCZOS)

# Paste centered
paste_x = int(center - p_target_width / 2.0)
paste_y = int(center - p_target_height / 2.0)
img.paste(p_scaled, (paste_x, paste_y), p_scaled if p_scaled.mode == 'RGBA' else None)

# Save master circular logo PNG
round_logo_path = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-round-icon.png"
img.save(round_logo_path, "PNG")
print(f"Generated round logo: {round_logo_path}")

# Update Splash Screen Logos across all density folders
res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

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
        img_splash = img.resize((splash_size, splash_size), Image.Resampling.LANCZOS)
        img_splash.save(os.path.join(folder, "splashscreen_logo.png"), "PNG")
        print(f"  - Updated {prefix}{density}/splashscreen_logo.png ({splash_size}x{splash_size})")

# Update ic_launcher_round.webp for launcher round icon
mipmap_sizes = [
    ("mdpi", 48),
    ("hdpi", 72),
    ("xhdpi", 96),
    ("xxhdpi", 144),
    ("xxxhdpi", 192)
]

for density, size in mipmap_sizes:
    folder = os.path.join(res_dir, f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    img_round = img.resize((size, size), Image.Resampling.LANCZOS)
    img_round.save(os.path.join(folder, "ic_launcher_round.webp"), "WEBP")
    print(f"  - Updated mipmap-{density}/ic_launcher_round.webp ({size}x{size})")

print("All round logo resources updated successfully!")
