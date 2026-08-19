import Foundation
import AppKit
import CoreGraphics

func drawTaglineBrandingUnmasked(width: Int, height: Int) -> NSImage {
    let size = NSSize(width: width, height: height)
    let image = NSImage(size: size)
    
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }
    
    let w = CGFloat(width)
    let h = CGFloat(height)
    
    ctx.clear(CGRect(x: 0, y: 0, width: w, height: h))
    
    // Tagline text: "Where Leads Become Deals"
    // Sized so total width is ~58% of canvas width (fitting 100% inside Android 12 branding viewport width)
    let tagStr = "Where Leads Become Deals"
    let tagFont = NSFont.systemFont(ofSize: h * 0.155, weight: .semibold)
    let tagColor = NSColor(red: 71/255.0, green: 85/255.0, blue: 105/255.0, alpha: 1.0) // Slate #475569
    
    let tagAttrs: [NSAttributedString.Key: Any] = [
        .font: tagFont,
        .foregroundColor: tagColor,
        .kern: 0.2
    ]
    let tagAttrStr = NSAttributedString(string: tagStr, attributes: tagAttrs)
    let tagSize = tagAttrStr.size()
    let tagRect = CGRect(x: (w - tagSize.width) / 2.0, y: (h - tagSize.height) / 2.0, width: tagSize.width, height: tagSize.height)
    
    tagAttrStr.draw(in: tagRect)
    
    image.unlockFocus()
    return image
}

let res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

let branding_sizes = [
    ("mdpi", 200, 80),
    ("hdpi", 300, 120),
    ("xhdpi", 400, 160),
    ("xxhdpi", 600, 240),
    ("xxxhdpi", 800, 320)
]

for (density, w, h) in branding_sizes {
    for prefix in ["drawable-", "drawable-night-"] {
        let folder = "\(res_dir)/\(prefix)\(density)"
        let img = drawTaglineBrandingUnmasked(width: w * 2, height: h * 2) // Double resolution for ultra sharpness
        
        if let tiffData = img.tiffRepresentation,
           let bitmap = NSBitmapImageRep(data: tiffData),
           let pngData = bitmap.representation(using: .png, properties: [:]) {
            let outPath = "\(folder)/splashscreen_branding.png"
            try? pngData.write(to: URL(fileURLWithPath: outPath))
            print("Updated \(outPath)")
        }
    }
}
