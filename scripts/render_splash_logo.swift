import Foundation
import AppKit
import CoreGraphics

func drawFullUnifiedSplashLogo(width: Int, height: Int) -> NSImage {
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
    
    // Load master icon
    let masterPath = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-icon.png"
    guard let masterImage = NSImage(contentsOfFile: masterPath),
          let cgMaster = masterImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        image.unlockFocus()
        return image
    }
    
    // 1. Logo Icon - Sized at 28% of canvas width
    let logoSize: CGFloat = w * 0.28
    let logoX: CGFloat = (w - logoSize) / 2.0
    let logoY: CGFloat = h * 0.50
    
    ctx.draw(cgMaster, in: CGRect(x: logoX, y: logoY, width: logoSize, height: logoSize))
    
    // 2. Title "POORAJ" directly below logo
    let titleStr = "POORAJ"
    let titleFont = NSFont.systemFont(ofSize: w * 0.058, weight: .bold)
    let titleColor = NSColor(red: 11/255.0, green: 42/255.0, blue: 122/255.0, alpha: 1.0) // #0B2A7A
    
    let titleAttrs: [NSAttributedString.Key: Any] = [
        .font: titleFont,
        .foregroundColor: titleColor,
        .kern: 2.2
    ]
    let titleAttrStr = NSAttributedString(string: titleStr, attributes: titleAttrs)
    let titleSize = titleAttrStr.size()
    let titleY = logoY - titleSize.height - (h * 0.025)
    let titleRect = CGRect(x: (w - titleSize.width) / 2.0, y: titleY, width: titleSize.width, height: titleSize.height)
    
    titleAttrStr.draw(in: titleRect)
    
    // 3. Tagline "Where Leads Become Deals" directly below POORAJ
    let tagStr = "Where Leads Become Deals"
    let tagFont = NSFont.systemFont(ofSize: w * 0.031, weight: .semibold)
    let tagColor = NSColor(red: 71/255.0, green: 85/255.0, blue: 105/255.0, alpha: 1.0) // Slate #475569
    
    let tagAttrs: [NSAttributedString.Key: Any] = [
        .font: tagFont,
        .foregroundColor: tagColor,
        .kern: 0.5
    ]
    let tagAttrStr = NSAttributedString(string: tagStr, attributes: tagAttrs)
    let tagSize = tagAttrStr.size()
    let tagY = titleY - tagSize.height - (h * 0.018)
    let tagRect = CGRect(x: (w - tagSize.width) / 2.0, y: tagY, width: tagSize.width, height: tagSize.height)
    
    tagAttrStr.draw(in: tagRect)
    
    image.unlockFocus()
    return image
}

let res_dir = "/Users/sl307282gmail.com/Desktop/POORAJ/android/app/src/main/res"

let drawable_sizes = [
    ("mdpi", 120),
    ("hdpi", 180),
    ("xhdpi", 240),
    ("xxhdpi", 360),
    ("xxxhdpi", 480)
]

for (density, size_val) in drawable_sizes {
    for prefix in ["drawable-", "drawable-night-"] {
        let folder = "\(res_dir)/\(prefix)\(density)"
        let logoImg = drawFullUnifiedSplashLogo(width: size_val * 3, height: size_val * 3)
        
        if let tiffData = logoImg.tiffRepresentation,
           let bitmap = NSBitmapImageRep(data: tiffData),
           let pngData = bitmap.representation(using: .png, properties: [:]) {
            let outPath = "\(folder)/splashscreen_logo.png"
            try? pngData.write(to: URL(fileURLWithPath: outPath))
            print("Updated \(outPath)")
        }
    }
}
