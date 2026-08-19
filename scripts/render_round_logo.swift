import Foundation
import AppKit
import CoreGraphics

func drawRoundLogo(width: Int, height: Int) -> NSImage {
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
    
    let center = CGPoint(x: w / 2.0, y: h / 2.0)
    let margin: CGFloat = 36
    let radius = (w - margin * 2) / 2.0 // 476
    
    // 1. Circle Background (Light neutral gray #EAEBED)
    ctx.addArc(center: center, radius: radius, startAngle: 0, endAngle: CGFloat.pi * 2, clockwise: false)
    ctx.setFillColor(CGColor(red: 234/255.0, green: 235/255.0, blue: 237/255.0, alpha: 1.0))
    ctx.fillPath()
    
    // 2. Outer Circular Split Ring (Border width 26px)
    let borderWidth: CGFloat = 26
    ctx.setLineWidth(borderWidth)
    
    let redColor = CGColor(red: 222/255.0, green: 22/255.0, blue: 35/255.0, alpha: 1.0)  // Red #DE1623
    let blueColor = CGColor(red: 11/255.0, green: 42/255.0, blue: 122/255.0, alpha: 1.0) // Blue #0B2A7A
    
    // Top-Right Red Arc (from -45° to 135°, i.e. -pi/4 to 3*pi/4)
    ctx.addArc(center: center, radius: radius, startAngle: -CGFloat.pi / 4, endAngle: 3 * CGFloat.pi / 4, clockwise: false)
    ctx.setStrokeColor(redColor)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    
    // Bottom-Left Blue Arc (from 135° to 315°, i.e. 3*pi/4 to 7*pi/4)
    ctx.addArc(center: center, radius: radius, startAngle: 3 * CGFloat.pi / 4, endAngle: 7 * CGFloat.pi / 4, clockwise: false)
    ctx.setStrokeColor(blueColor)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    
    // 3. Draw Vector 'P' Symbol (Centered)
    let stemLeft: CGFloat = 350
    let stemWidth: CGFloat = 100
    let stemRight = stemLeft + stemWidth // 450
    let pBottomY: CGFloat = 290
    let pTopY: CGFloat = 710
    let loopBottomY: CGFloat = 470
    let loopCenterY: CGFloat = (pTopY + loopBottomY) / 2.0 // 590
    
    let loopMaxX: CGFloat = 710
    let outerRadius: CGFloat = (pTopY - loopBottomY) / 2.0 // 120
    let archCenterX = loopMaxX - outerRadius // 590
    
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
    
    // Inner Hole of Blue 'P' (Slot)
    let holeTopY: CGFloat = 630
    let holeBottomY: CGFloat = 550
    let holeRadius: CGFloat = (holeTopY - holeBottomY) / 2.0 // 40
    
    let holePath = CGMutablePath()
    holePath.move(to: CGPoint(x: stemRight, y: holeBottomY))
    holePath.addLine(to: CGPoint(x: archCenterX, y: holeBottomY))
    holePath.addArc(center: CGPoint(x: archCenterX, y: loopCenterY), radius: holeRadius, startAngle: -CGFloat.pi / 2, endAngle: CGFloat.pi / 2, clockwise: false)
    holePath.addLine(to: CGPoint(x: stemRight, y: holeTopY))
    holePath.closeSubpath()
    
    // Render Blue 'P'
    ctx.saveGState()
    ctx.addPath(pPath)
    ctx.addPath(holePath)
    ctx.setFillColor(blueColor)
    ctx.fillPath(using: .evenOdd)
    ctx.restoreGState()
    
    // 4. Red Capsule Bar inside slot
    let barHeight: CGFloat = 38
    let barY = loopCenterY - barHeight / 2.0
    let barLeft = stemRight
    let barRight: CGFloat = 580
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

let roundPath = "/Users/sl307282gmail.com/Desktop/POORAJ/assets/images/pooraj-round-icon.png"
let img = drawRoundLogo(width: 1024, height: 1024)
if let tiffData = img.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiffData), let pngData = bitmap.representation(using: .png, properties: [:]) {
    try? pngData.write(to: URL(fileURLWithPath: roundPath))
    print("Rendered round logo: \(roundPath)")
}
