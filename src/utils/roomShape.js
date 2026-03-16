export function generateRoomPolygon(width, height, shape) {
    // width/height in px or cm (units don't matter as long as consistent)
    // Returns array of [x, y, x, y, ...] for Konva Line
    // Or maybe array of {x, y} is better? Konva Line takes flat array.
    // View3D/Three Shape takes Vector2s.
    // Let's return objects {x,y} and convert as needed.

    const points = []

    // Helper to add point
    const p = (x, y) => points.push({ x, y })

    switch (shape) {
        case 'L':
            // L shape: remove top-right chunk
            {
                const cutW = width * 0.4
                const cutH = height * 0.4
                p(0, 0)
                p(width - cutW, 0)
                p(width - cutW, cutH)
                p(width, cutH)
                p(width, height)
                p(0, height)
            }
            break

        case 'L_REV':
            // Inverted L (Horizontal-ish?): remove top-left chunk
            {
                const cutW = width * 0.4
                const cutH = height * 0.4
                p(cutW, 0)
                p(width, 0)
                p(width, height)
                p(0, height)
                p(0, cutH)
                p(cutW, cutH)
            }
            break

        case 'U':
            // U shape: remove top-middle chunk
            {
                const legW = width * 0.3
                const depth = height * 0.5
                p(0, 0)
                p(legW, 0)
                p(legW, depth)
                p(width - legW, depth)
                p(width - legW, 0)
                p(width, 0)
                p(width, height)
                p(0, height)
            }
            break

        case 'CIRCLE':
            {
                const rx = width / 2
                const ry = height / 2
                const cx = width / 2
                const cy = height / 2
                const segments = 64
                for (let i = 0; i < segments; i++) {
                    const theta = (i / segments) * Math.PI * 2
                    p(cx + rx * Math.cos(theta), cy + ry * Math.sin(theta))
                }
            }
            break

        case 'OVAL':
            {
                // Same as circle but we use full width/height
                const rx = width / 2
                const ry = height / 2
                const cx = width / 2
                const cy = height / 2
                const segments = 64
                for (let i = 0; i < segments; i++) {
                    const theta = (i / segments) * Math.PI * 2
                    p(cx + rx * Math.cos(theta), cy + ry * Math.sin(theta))
                }
            }
            break

        case 'SEMICIRCLE':
            {
                // Flat bottom, rounded top? Or flat top?
                // Let's do Flat Top (like a D shape on its back?) or arch?
                // "Filled U. Like a half circle".
                // Let's assume standard semi-circle: flat bottom, curved top.
                const cx = width / 2
                const cy = height // bottom
                const r = width / 2
                // If height != r, it's a semi-oval. Let's respect height.

                // Let's Draw:
                // Start Bottom Left
                p(0, height)

                // Arc to Bottom Right
                const segments = 32
                for (let i = 0; i <= segments; i++) {
                    const theta = Math.PI + (i / segments) * Math.PI // PI to 2PI? No.
                    // We want top arc?
                    // "Filled U" usually means opening up? 
                    // "Like a half circle".
                    // Let's make it an arch: flat bottom.
                    const angle = Math.PI - (i / segments) * Math.PI // PI to 0

                    // ellipse logic
                    const px = cx + (width / 2) * Math.cos(angle)
                    const py = height - (height) * Math.sin(angle) // height is bottom?

                    // Wait, coordinate system: 0,0 is top-left.
                    // Flat bottom means y = height.
                    // Arch top means y goes to 0.

                    // Center X = width/2.
                    // Center Y = height.
                    // Radius X = width/2.
                    // Radius Y = height.

                    // Angle: PI (left) -> 0 (right).
                    // x = cx + rx * cos(t)
                    // y = cy - ry * sin(t) (since y is down, -sin goes up)

                    p(cx + (width / 2) * Math.cos(angle), height + (height) * -Math.sin(angle))
                }
                // It ends at (width, height).
                // p(width, height) is effectively added by the loop end.
                // Close shape? Polygon closes automatically usually, but let's be explicit.
            }
            break

        case 'RECT':
        default:
            p(0, 0)
            p(width, 0)
            p(width, height)
            p(0, height)
            break
    }

    return points
}
