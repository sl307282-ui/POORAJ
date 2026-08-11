from PIL import Image

img = Image.open("./assets/images/pooraj-icon.png")
print("Mode:", img.mode)
if img.mode == 'RGBA':
    extrema = img.getextrema()
    if extrema[3][0] < 255:
        print("HAS_TRANSPARENCY: YES")
    else:
        print("HAS_TRANSPARENCY: NO")
else:
    print("HAS_TRANSPARENCY: NO")
