import Foundation
import AppKit
import CoreGraphics

func drawLogo(width: Int, height: Int) -> NSImage {
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
    
    // Canvas & Container
    let margin: CGFloat = 36
    let cornerRadius: CGFloat = 135
    let rect = CGRect(x: margin, y: margin, width: w - margin * 2, height: h - margin * 2)
    
    // Background fill (Clean light neutral gray)
    let bgPath = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.addPath(bgPath)
    ctx.setFillColor(CGColor(red: 234/255.0, green: 235/255.0, blue: 237/255.0, alpha: 1.0))
    ctx.fillPath()
    
    // Outer Split Border (Thicker stroke ~26px)
    let borderWidth: CGFloat = 26
    ctx.setLineWidth(borderWidth)
    
    let redColor = CGColor(red: 222/255.0, green: 22/255.0, blue: 35/255.0, alpha: 1.0) // Red #DE1623
    let blueColor = CGColor(red: 11/255.0, green: 42/255.0, blue: 122/255.0, alpha: 1.0) // Deep Blue #0B2A7A
    
    let midX = w / 2.0
    
    // Top-Right half (Red border)
    let topRightPath = CGMutablePath()
    topRightPath.move(to: CGPoint(x: midX, y: margin))
    topRightPath.addLine(to: CGPoint(x: rect.maxX - cornerRadius, y: rect.minY))
    topRightPath.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY), tangent2End: CGPoint(x: rect.maxX, y: rect.minY + cornerRadius), radius: cornerRadius)
    topRightPath.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - cornerRadius))
    topRightPath.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY), tangent2End: CGPoint(x: rect.maxX - cornerRadius, y: rect.maxY), radius: cornerRadius)
    topRightPath.addLine(to: CGPoint(x: midX, y: rect.maxY))
    
    ctx.addPath(topRightPath)
    ctx.setStrokeColor(redColor)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    
    // Bottom-Left half (Blue border)
    let bottomLeftPath = CGMutablePath()
    bottomLeftPath.move(to: CGPoint(x: midX, y: rect.maxY))
    bottomLeftPath.addLine(to: CGPoint(x: rect.minX + cornerRadius, y: rect.maxY))
    bottomLeftPath.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY), tangent2End: CGPoint(x: rect.minX, y: rect.minY + cornerRadius), radius: cornerRadius)
    bottomLeftPath.addLine(to: CGPoint(x: rect.minX, y: rect.minY + cornerRadius))
    bottomLeftPath.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY), tangent2End: CGPoint(x: rect.minX + cornerRadius, y: rect.minY), radius: cornerRadius)
    bottomLeftPath.addLine(to: CGPoint(x: midX, y: rect.minY))
    
    ctx.addPath(bottomLeftPath)
    ctx.setStrokeColor(blueColor)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    
    // --- Draw Main Solid Blue 'P' Shape ---
    let stemLeft: CGFloat = 345
    let stemWidth: CGFloat = 105
    let stemRight = stemLeft + stemWidth // 450
    let pBottomY: CGFloat = 280
    let pTopY: CGFloat = 710
    let loopBottomY: CGFloat = 470
    let loopCenterY: CGFloat = (pTopY + loopBottomY) / 2.0 // 590
    
    let loopMaxX: CGFloat = 715
    let outerRadius: CGFloat = (pTopY - loopBottomY) / 2.0 // 120
    let archCenterX = loopMaxX - outerRadius // 595
    
    let pPath = CGMutablePath()
    
    // Stem bottom-left
    pPath.move(to: CGPoint(x: stemLeft, y: pBottomY + 10))
    pPath.addArc(tangent1End: CGPoint(x: stemLeft, y: pBottomY), tangent2End: CGPoint(x: stemLeft + 10, y: pBottomY), radius: 10)
    pPath.addLine(to: CGPoint(x: stemRight - 10, y: pBottomY))
    pPath.addArc(tangent1End: CGPoint(x: stemRight, y: pBottomY), tangent2End: CGPoint(x: stemRight, y: pBottomY + 10), radius: 10)
    
    // Up stem right side to loop bottom
    pPath.addLine(to: CGPoint(x: stemRight, y: loopBottomY))
    
    // Outer arch bottom
    pPath.addLine(to: CGPoint(x: archCenterX, y: loopBottomY))
    pPath.addArc(center: CGPoint(x: archCenterX, y: loopCenterY), radius: outerRadius, startAngle: -CGFloat.pi / 2, endAngle: CGFloat.pi / 2, clockwise: false)
    
    // Top of loop to stem top-left
    pPath.addLine(to: CGPoint(x: stemLeft + 20, y: pTopY))
    pPath.addArc(tangent1End: CGPoint(x: stemLeft, y: pTopY), tangent2End: CGPoint(x: stemLeft, y: pTopY - 20), radius: 20)
    pPath.closeSubpath()
    
    // Inner Hole of Blue 'P' (Rounded slot)
    let holeTopY: CGFloat = 630
    let holeBottomY: CGFloat = 550
    let holeRadius: CGFloat = (holeTopY - holeBottomY) / 2.0 // 40
    
    let holePath = CGMutablePath()
    holePath.move(to: CGPoint(x: stemRight, y: holeBottomY))
    holePath.addLine(to: CGPoint(x: archCenterX, y: holeBottomY))
    holePath.addArc(center: CGPoint(x: archCenterX, y: loopCenterY), radius: holeRadius, startAngle: -CGFloat.pi / 2, endAngle: CGFloat.pi / 2, clockwise: false)
    holePath.addLine(to: CGPoint(x: stemRight, y: holeTopY))
    holePath.closeSubpath()
    
    // Render Solid Blue 'P' with inner slot
    ctx.saveGState()
    ctx.addPath(pPath)
    ctx.addPath(holePath)
    ctx.setFillColor(blueColor)
    ctx.fillPath(using: .evenOdd)
    ctx.restoreGState()
    
    // --- Red Capsule Bar inside the slot ---
    // In the user's logo, the red capsule bar sits INSIDE the slot starting from the inner stem wall (stemRight = 450)!
    let barHeight: CGFloat = 38
    let barY = loopCenterY - barHeight / 2.0 // 571
    let barLeft = stemRight // Starts at inner edge of stem!
    let barRight: CGFloat = 585
    let barCapRadius = barHeight / 2.0
    
    let barPath = CGMutablePath()
    barPath.move(to: CGPoint(x: barLeft, y: barY))
    barPath.addLine(to: CGPoint(x: barRight - barCapRadius, y: barY))
    barPath.addArc(center: CGPoint(x: barRight - barCapRadius, y: loopCenterY), radius: barCapRadius, startAngle: -CGFloat.pi / 2, endAngle: CGFloat.pi / 2, clockwise: false)
    barPath.addLine(to: CGPoint(x: barLeft, y: barY + barHeight))
    barPath.closeSubpath()
    
    ctx.addPath(barPath)
    ctx.setFillColor(redColor)
    ctx.fillPath()
    
    image.unlockFocus()
    return image
}

let sizes = [
    (1024, 1024, "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-icon.png"),
    (1024, 1024, "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/android-icon-foreground.png"),
    (192, 192, "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/favicon.png")
]

for (w, h, path) in sizes {
    let img = drawLogo(width: w, height: h)
    if let tiffData = img.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiffData), let pngData = bitmap.representation(using: .png, properties: [:]) {
        try? pngData.write(to: URL(fileURLWithPath: path))
        print("Rendered \(path)")
    }
}
