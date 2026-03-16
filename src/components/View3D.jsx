import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { generateRoomPolygon } from '../utils/roomShape'

// Helpers
function hexToThreeColor(hex) {
  try { return new THREE.Color(hex) }
  catch { return new THREE.Color('#cccccc') }
}

// Rich material presets — roughness / metalness / envMapIntensity per surface type
const MAT = {
  wood: { roughness: 0.75, metalness: 0.0, envMapIntensity: 0.4 },
  fabric: { roughness: 0.95, metalness: 0.0, envMapIntensity: 0.1 },
  metal: { roughness: 0.3, metalness: 0.85, envMapIntensity: 1.2 },
  chrome: { roughness: 0.1, metalness: 1.0, envMapIntensity: 1.5 },
  plastic: { roughness: 0.6, metalness: 0.0, envMapIntensity: 0.3 },
  glass: { roughness: 0.0, metalness: 0.0, envMapIntensity: 1.5 },
  matte_wall: { roughness: 0.92, metalness: 0.0, envMapIntensity: 0.15 },
  matte_floor: { roughness: 0.85, metalness: 0.0, envMapIntensity: 0.2 },
  ceramic: { roughness: 0.35, metalness: 0.0, envMapIntensity: 0.6 },
  leather: { roughness: 0.65, metalness: 0.0, envMapIntensity: 0.25 },
}

function M({ color, preset = 'wood', transparent, opacity, side }) {
  const m = MAT[preset] || MAT.wood
  return (
    <meshStandardMaterial
      color={color}
      roughness={m.roughness}
      metalness={m.metalness}
      envMapIntensity={m.envMapIntensity}
      transparent={transparent}
      opacity={opacity}
      side={side}
    />
  )
}

// Room
function Room({ room }) {
  const w = room.width / 100
  const h = room.height / 100
  const wallH = 2.4
  const wallT = 0.08

  const floorColor = useMemo(() => hexToThreeColor(room.color), [room.color])
  const wallColor = useMemo(() => hexToThreeColor(room.wallColor), [room.wallColor])

  const points = useMemo(() => generateRoomPolygon(w, h, room.shape), [w, h, room.shape])

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    if (points.length > 0) {
      s.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) s.lineTo(points[i].x, points[i].y)
    }
    return s
  }, [points])

  const wallSegments = useMemo(() => {
    const segments = []
    let maxZ = -Infinity
    for (const p of points) maxZ = Math.max(maxZ, p.y)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      const midZ = (p1.y + p2.y) / 2
      if (Math.abs(midZ - maxZ) >= 0.1) {
        segments.push({ x: p1.x + dx / 2, z: p1.y + dy / 2, rot: -angle, len })
      }
    }
    return segments
  }, [points])

  // Subtle floor grid pattern (thin darker lines baked into color)
  const floorRough = new THREE.Color(floorColor).multiplyScalar(0.92)

  return (
    <group position={[-w / 2, 0, -h / 2]}>
      {/* Floor */}
      <mesh rotation-x={Math.PI / 2} receiveShadow>
        <shapeGeometry args={[shape]} />
        <M color={floorColor} preset="matte_floor" side={THREE.DoubleSide} />
      </mesh>

      {/* Floor edge shadow base */}
      <mesh position={[0, -0.005, 0]} rotation-x={Math.PI / 2} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={floorRough} roughness={1} metalness={0} />
      </mesh>

      {/* Walls */}
      {wallSegments.map((wg, i) => (
        <mesh
          key={i}
          position={[wg.x, wallH / 2, wg.z]}
          rotation-y={wg.rot}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[wg.len + wallT, wallH, wallT]} />
          <M color={wallColor} preset="matte_wall" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* White skirting board at base of walls */}
      {wallSegments.map((wg, i) => (
        <mesh
          key={`sk${i}`}
          position={[wg.x, 0.05, wg.z]}
          rotation-y={wg.rot}
          receiveShadow
        >
          <boxGeometry args={[wg.len + wallT, 0.1, wallT + 0.001]} />
          <meshStandardMaterial color={new THREE.Color('#f5f5f5')} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Furniture dispatcher
function Furniture({ item, preset }) {
  const x = item.x / 100
  const z = item.y / 100
  const rot = (item.rotation * Math.PI) / 180

  const baseColor = useMemo(() => hexToThreeColor(item.color), [item.color])
  const shade = useMemo(
    () => baseColor.clone().lerp(new THREE.Color('#000000'), item.shade * 0.4),
    [baseColor, item.shade]
  )

  const dims = {
    w: (item.w / 100) * item.scale,
    d: (item.h / 100) * item.scale
  }

  return (
    <group rotation-y={-rot} scale={[1, item._scaleY || 1, 1]}>
      {['chair', 'accent_chair', 'office_chair', 'dining_chair', 'bar_stool'].includes(item.type) && <Chair color={baseColor} shade={shade} dims={dims} />}
      {['table', 'dining_table', 'desk', 'console_table'].includes(item.type) && <Table color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'bed' && <Bed color={baseColor} shade={shade} dims={dims} />}
      {['sofa', 'sectional_sofa', 'chesterfield_sofa'].includes(item.type) && <Sofa color={baseColor} shade={shade} dims={dims} />}
      {['wardrobe', 'armoire'].includes(item.type) && <Wardrobe color={baseColor} shade={shade} dims={dims} />}
      {['bookshelf', 'bookcase'].includes(item.type) && <Bookshelf color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'plant' && <Plant color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'rug' && <Rug color={baseColor} shade={shade} dims={dims} />}
      {['tv_unit'].includes(item.type) && <TVUnit color={baseColor} shade={shade} dims={dims} />}
      {['sideboard', 'dresser', 'shoe_storage'].includes(item.type) && <Sideboard color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'window' && <WindowItem color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'lamp' && <FloorLamp color={baseColor} shade={shade} dims={dims} preset={preset} />}
      {item.type === 'coffee_table' && <CoffeeTable color={baseColor} shade={shade} dims={dims} />}
      {item.type === 'ac' && <ACUnit color={baseColor} shade={shade} dims={dims} />}
      {['pouf', 'ottoman'].includes(item.type) && <Pouf color={baseColor} shade={shade} dims={dims} isBench={false} />}
      {['bed_bench', 'bedroom_bench', 'bench'].includes(item.type) && <Pouf color={baseColor} shade={shade} dims={dims} isBench={true} />}
      {['nightstand', 'filing_cabinet'].includes(item.type) && <Nightstand color={baseColor} shade={shade} dims={dims} isFilingCabinet={item.type === 'filing_cabinet'} />}
      {item.type === 'coat_rack' && <CoatRack color={baseColor} shade={shade} dims={dims} />}
    </group>
  )
}

// Chair
function Chair({ color, shade, dims }) {
  const seatH = 0.45, seatT = 0.06, backH = 0.5, leg = 0.04
  const w = Math.max(0.4, dims.w), d = Math.max(0.4, dims.d)
  return (
    <group>
      <mesh position={[0, seatH, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatT, d]} />
        <M color={color} preset="fabric" />
      </mesh>
      <mesh position={[0, seatH + backH / 2, -d / 2 + 0.04]} castShadow receiveShadow>
        <boxGeometry args={[w, backH, 0.08]} />
        <M color={shade} preset="fabric" />
      </mesh>
      {[-1, 1].map(sx => [-1, 1].map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - leg), seatH / 2, sz * (d / 2 - leg)]} castShadow>
          <cylinderGeometry args={[leg, leg, seatH, 20]} />
          <M color={shade} preset="metal" />
        </mesh>
      )))}
    </group>
  )
}

// Table
function Table({ color, shade, dims }) {
  const topY = 0.75, topT = 0.07, legR = 0.05
  const w = Math.max(0.8, dims.w), d = Math.max(0.5, dims.d)
  return (
    <group>
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <M color={color} preset="wood" />
      </mesh>
      {[-1, 1].map(sx => [-1, 1].map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.08), topY / 2, sz * (d / 2 - 0.08)]} castShadow>
          <cylinderGeometry args={[legR, legR, topY, 24]} />
          <M color={shade} preset="wood" />
        </mesh>
      )))}
    </group>
  )
}

// Bed
function Bed({ color, shade, dims }) {
  const w = Math.max(1.2, dims.w), d = Math.max(0.9, dims.d)
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.22, d]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.96, 0.18, d * 0.96]} />
        <M color={color} preset="fabric" />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.6, -d / 2 + 0.05]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.72, 0.1]} />
        <M color={shade} preset="fabric" />
      </mesh>
      {/* Headboard panel accent */}
      <mesh position={[0, 0.6, -d / 2 + 0.10]} castShadow>
        <boxGeometry args={[w * 0.92, 0.62, 0.02]} />
        <M color={shade} preset="leather" />
      </mesh>
      {/* Pillows */}
      {[-0.2, 0.2].map(ox => (
        <mesh key={ox} position={[w * ox, 0.47, -d * 0.25]} castShadow>
          <boxGeometry args={[w * 0.25, 0.12, d * 0.22]} />
          <M color={new THREE.Color('#f1f1f1')} preset="fabric" />
        </mesh>
      ))}
      {/* Blanket / duvet at foot */}
      <mesh position={[0, 0.38, d * 0.2]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.95, 0.08, d * 0.55]} />
        <M color={color.clone().lerp(new THREE.Color('#fff'), 0.25)} preset="fabric" />
      </mesh>
    </group>
  )
}

// Sofa
function Sofa({ color, shade, dims }) {
  const w = Math.max(1.2, dims.w), d = Math.max(0.6, dims.d)
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.25, d]} />
        <M color={shade} preset="fabric" />
      </mesh>
      {/* Seat cushions */}
      {[-0.25, 0.25].map(ox => (
        <mesh key={ox} position={[w * ox, 0.43, 0]} castShadow receiveShadow>
          <boxGeometry args={[w * 0.46, 0.18, d * 0.9]} />
          <M color={color} preset="fabric" />
        </mesh>
      ))}
      {/* Back */}
      <mesh position={[0, 0.64, -d / 2 + 0.08]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.5, 0.16]} />
        <M color={shade} preset="fabric" />
      </mesh>
      {/* Back cushions */}
      {[-0.25, 0.25].map(ox => (
        <mesh key={ox} position={[w * ox, 0.7, -d / 2 + 0.16]} castShadow>
          <boxGeometry args={[w * 0.43, 0.42, 0.1]} />
          <M color={color} preset="fabric" />
        </mesh>
      ))}
      {/* Arms */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (w / 2 - 0.1), 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.4, d]} />
          <M color={shade} preset="fabric" />
        </mesh>
      ))}
      {/* Legs */}
      {[-1, 1].map(sx => [-1, 1].map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.12), 0.1, sz * (d / 2 - 0.12)]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 20]} />
          <M color={new THREE.Color('#2a1a0a')} preset="wood" />
        </mesh>
      )))}
    </group>
  )
}

// Wardrobe
function Wardrobe({ color, shade, dims }) {
  const w = Math.max(0.8, dims.w), d = Math.max(0.45, dims.d), H = 2.0
  return (
    <group>
      {/* Body */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Doors */}
      {[-0.25, 0.25].map(ox => (
        <mesh key={ox} position={[w * ox, H / 2, d / 2 + 0.012]} castShadow>
          <boxGeometry args={[w * 0.48, H * 0.95, 0.025]} />
          <M color={color} preset="wood" />
        </mesh>
      ))}
      {/* Door groove line */}
      <mesh position={[0, H / 2, d / 2 + 0.013]}>
        <boxGeometry args={[0.008, H * 0.9, 0.003]} />
        <meshStandardMaterial color={new THREE.Color('#444')} roughness={0.8} />
      </mesh>
      {/* Handles */}
      {[-0.015, 0.015].map(ox => (
        <mesh key={ox} position={[w * 0.25 * Math.sign(ox) - ox * 10, H / 2, d / 2 + 0.045]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.32, 20]} />
          <M color={new THREE.Color('#aaaaaa')} preset="chrome" />
        </mesh>
      ))}
    </group>
  )
}

// Bookshelf
function Bookshelf({ color, shade, dims }) {
  const w = Math.max(0.6, dims.w), d = Math.max(0.3, dims.d), H = 1.5
  const books = [
    '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22', '#1abc9c', '#d35400', '#2c3e50'
  ]
  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, H / 2, -d / 2 + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w, H, 0.04]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Side panels */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (w / 2 - 0.02), H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, H, d]} />
          <M color={shade} preset="wood" />
        </mesh>
      ))}
      {/* Top & Bottom */}
      {[0.02, H - 0.02].map(y => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w - 0.08, 0.04, d - 0.02]} />
          <M color={shade} preset="wood" />
        </mesh>
      ))}
      {/* Shelves */}
      {[0.38, 0.76, 1.14].map(y => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w - 0.08, 0.03, d - 0.02]} />
          <M color={color} preset="wood" />
        </mesh>
      ))}
      {/* Books */}
      {[0, 0.38, 0.76].map((shelfY, si) =>
        books.slice(0, 5 + si).map((bc, bi) => {
          const bw = (w - 0.12) / 8
          const bx = -w / 2 + 0.07 + bi * (bw + 0.01) + bw / 2
          return (
            <mesh key={`${si}-${bi}`} position={[bx, shelfY + 0.16, 0]} castShadow>
              <boxGeometry args={[bw, 0.28, d * 0.6]} />
              <meshStandardMaterial color={new THREE.Color(bc)} roughness={0.9} />
            </mesh>
          )
        })
      )}
    </group>
  )
}

// Plant
function Plant({ color, shade, dims }) {
  const w = Math.max(0.3, dims.w)
  return (
    <group>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.4, w * 0.3, 0.4, 24]} />
        <M color={new THREE.Color('#c0734a')} preset="ceramic" />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.41, 0]} castShadow>
        <torusGeometry args={[w * 0.4, 0.025, 12, 32]} />
        <M color={new THREE.Color('#b06030')} preset="ceramic" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.38, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[w * 0.37, 24]} />
        <meshStandardMaterial color={new THREE.Color('#3d2b1f')} roughness={1} />
      </mesh>
      {/* Foliage - layered spheres */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[w * 0.5, 20, 14]} />
        <M color={color} preset="matte_wall" />
      </mesh>
      <mesh position={[-w * 0.2, 0.62, w * 0.15]} castShadow>
        <sphereGeometry args={[w * 0.32, 16, 12]} />
        <M color={color.clone().lerp(new THREE.Color('#000'), 0.1)} preset="matte_wall" />
      </mesh>
      <mesh position={[w * 0.22, 0.65, -w * 0.1]} castShadow>
        <sphereGeometry args={[w * 0.28, 16, 12]} />
        <M color={color.clone().lerp(new THREE.Color('#fff'), 0.08)} preset="matte_wall" />
      </mesh>
    </group>
  )
}

// Rug
function Rug({ color, shade, dims }) {
  const w = Math.max(0.5, dims.w), d = Math.max(0.5, dims.d)
  return (
    <group>
      <mesh position={[0, 0.008, 0]} receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} roughness={1.0} metalness={0} />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0.006, 0]} receiveShadow rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w + 0.04, d + 0.04]} />
        <meshStandardMaterial color={shade} roughness={1.0} metalness={0} />
      </mesh>
    </group>
  )
}

// TV Unit
function TVUnit({ color, shade, dims }) {
  const w = Math.max(1.0, dims.w), d = Math.max(0.4, dims.d), H = 0.45
  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Door panels */}
      {[-0.33, 0, 0.33].map(ox => (
        <mesh key={ox} position={[w * ox, H / 2, d / 2 + 0.01]} castShadow>
          <boxGeometry args={[w * 0.3, H * 0.88, 0.02]} />
          <M color={color} preset="wood" />
        </mesh>
      ))}
      {/* TV Screen */}
      <mesh position={[0, H + 0.42, -0.01]} castShadow>
        <boxGeometry args={[w * 0.85, 0.72, 0.055]} />
        <M color={new THREE.Color('#0a0a0a')} preset="plastic" />
      </mesh>
      {/* Screen Display */}
      <mesh position={[0, H + 0.42, 0.03]}>
        <boxGeometry args={[w * 0.81, 0.67, 0.005]} />
        <meshStandardMaterial color={new THREE.Color('#081828')} roughness={0.05} metalness={0.1} emissive={new THREE.Color('#030d18')} emissiveIntensity={0.6} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, H + 0.04, 0]} castShadow>
        <boxGeometry args={[w * 0.25, 0.08, 0.18]} />
        <M color={new THREE.Color('#1a1a1a')} preset="plastic" />
      </mesh>
    </group>
  )
}

// Sideboard / Dresser / Cabinet
function Sideboard({ color, shade, dims, isArmoire }) {
  const w = Math.max(0.6, dims.w), d = Math.max(0.3, dims.d), H = isArmoire ? 1.8 : 0.8
  const numDoors = Math.max(2, Math.floor(w / 0.45))
  const doorW = (w * 0.96) / numDoors

  return (
    <group>
      {/* Main Box */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Doors / Drawers front panels */}
      {Array.from({ length: numDoors }).map((_, i) => {
        const ox = -w / 2 + (w * 0.02) + doorW / 2 + i * doorW
        return (
          <group key={i}>
            <mesh position={[ox, H / 2, d / 2 + 0.01]} castShadow>
              <boxGeometry args={[doorW * 0.95, H * 0.9, 0.02]} />
              <M color={color} preset="wood" />
            </mesh>
            {/* Handle */}
            <mesh position={[ox + (i % 2 === 0 ? doorW * 0.35 : -doorW * 0.35), H / 2 + 0.1, d / 2 + 0.025]} castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.12]} />
              <M color={new THREE.Color('#d4af37')} preset="metal" />
            </mesh>
          </group>
        )
      })}
      {/* Legs */}
      {[-1, 1].map(sideX =>
        [-1, 1].map(sideZ => (
          <mesh key={`${sideX}-${sideZ}`} position={[sideX * (w / 2 - 0.05), 0.05, sideZ * (d / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.02, 0.01, 0.1]} />
            <M color={shade} preset="metal" />
          </mesh>
        ))
      )}
    </group>
  )
}

// Window
function WindowItem({ color, shade, dims }) {
  const w = Math.max(0.5, dims.w), H = 1.2, y = 1.0 + H / 2, t = 0.05
  return (
    <group>
      {/* Frame pieces */}
      {[
        [0, y + H / 2 - t / 2, [w, t, 0.1]],
        [0, y - H / 2 + t / 2, [w, t, 0.1]],
        [-w / 2 + t / 2, y, [t, H - 2 * t, 0.1]],
        [w / 2 - t / 2, y, [t, H - 2 * t, 0.1]],
      ].map(([px, py, args], i) => (
        <mesh key={i} position={[px, py, 0]} castShadow receiveShadow>
          <boxGeometry args={args} />
          <M color={new THREE.Color('#e8e8e8')} preset="plastic" />
        </mesh>
      ))}
      {/* Cross bars */}
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[w - 2 * t, t / 1.5, 0.04]} />
        <M color={new THREE.Color('#e0e0e0')} preset="plastic" />
      </mesh>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[t / 1.5, H - 2 * t, 0.04]} />
        <M color={new THREE.Color('#e0e0e0')} preset="plastic" />
      </mesh>
      {/* Glass panes */}
      {[-0.25, 0.25].map(ox => (
        <mesh key={ox} position={[w * ox, y, 0]}>
          <boxGeometry args={[w * 0.47, H - 0.04, 0.04]} />
          <meshStandardMaterial
            color={new THREE.Color('#a8d8f0')}
            transparent opacity={0.22}
            roughness={0.0} metalness={0.1}
            envMapIntensity={2.0}
          />
        </mesh>
      ))}
    </group>
  )
}

// Floor Lamp
function FloorLamp({ color, shade, dims, preset }) {
  const H = 1.65
  return (
    <group>
      {/* Base disc */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 32]} />
        <M color={shade} preset="chrome" />
      </mesh>
      {/* Base weight */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.06, 32]} />
        <M color={shade} preset="metal" />
      </mesh>
      {/* Pole */}
      <mesh position={[0, H / 2 + 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, H, 16]} />
        <M color={new THREE.Color('#3a3a3a')} preset="metal" />
      </mesh>
      {/* Shade outer */}
      <mesh position={[0, H - 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.32, 32, 1, true]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.88} roughness={0.9} />
      </mesh>
      {/* Shade inner (slightly emissive when lit) */}
      <mesh position={[0, H - 0.15, 0]}>
        <cylinderGeometry args={[0.20, 0.26, 0.30, 32, 1, true]} />
        <meshStandardMaterial
          color={new THREE.Color('#ffe8c0')}
          side={THREE.BackSide}
          emissive={new THREE.Color('#ffe0a0')}
          emissiveIntensity={preset === 'Day' ? 0 : 0.5}
          transparent opacity={0.7}
        />
      </mesh>
      {/* Point light */}
      <pointLight
        position={[0, H - 0.2, 0]}
        intensity={preset === 'Day' ? 0 : 2.2}
        distance={5.5}
        decay={2}
        color="#ffeedd"
        castShadow
        shadow-bias={-0.001}
        shadow-mapSize={[512, 512]}
      />
    </group>
  )
}

// Coffee Table
function CoffeeTable({ color, shade, dims }) {
  const w = Math.max(0.6, dims.w), r = w / 2, H = 0.4, t = 0.05
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, H, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, t, 36]} />
        <M color={color} preset="wood" />
      </mesh>
      {/* Understory shelf */}
      <mesh position={[0, H * 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.7, r * 0.7, t * 0.6, 32]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Legs */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map(angle => {
        const lx = (r - 0.1) * Math.cos(angle)
        const lz = (r - 0.1) * Math.sin(angle)
        return (
          <mesh key={angle} position={[lx, H / 2, lz]} castShadow>
            <cylinderGeometry args={[0.025, 0.018, H, 12]} />
            <M color={shade} preset="metal" />
          </mesh>
        )
      })}
    </group>
  )
}

// AC Unit
function ACUnit({ color, shade, dims }) {
  const w = Math.max(0.8, dims.w), d = 0.22, H = 0.26, yOff = 2.05
  return (
    <group position={[0, yOff, 0]}>
      {/* Housing */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        <M color={color} preset="plastic" />
      </mesh>
      {/* Front panel */}
      <mesh position={[0, H / 2, d / 2 + 0.003]}>
        <boxGeometry args={[w - 0.02, H - 0.02, 0.01]} />
        <M color={new THREE.Color('#f0f0f0')} preset="plastic" />
      </mesh>
      {/* Vent slats */}
      {[-0.15, -0.05, 0.05, 0.15].map(vy => (
        <mesh key={vy} position={[0, H * 0.3 + vy, d / 2 + 0.014]}>
          <boxGeometry args={[w * 0.78, 0.018, 0.01]} />
          <M color={new THREE.Color('#cccccc')} preset="plastic" />
        </mesh>
      ))}
      {/* LED indicator */}
      <mesh position={[w * 0.4, H * 0.8, d / 2 + 0.012]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color={new THREE.Color('#00ff88')} emissive={new THREE.Color('#00ff44')} emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// Pouf & Bench
function Pouf({ color, shade, dims, isBench }) {
  const w = isBench ? dims.w : Math.max(0.4, dims.w)
  const d = isBench ? dims.d : w
  const r = w / 2
  const H = 0.45
  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        {isBench ? <boxGeometry args={[w, H, d]} /> : <cylinderGeometry args={[r, r * 1.06, H, 28]} />}
        <M color={color} preset="fabric" />
      </mesh>
      {/* Button tufting top */}
      <mesh position={[0, H + 0.005, 0]} castShadow receiveShadow>
        {isBench ? <boxGeometry args={[w * 0.96, 0.04, d * 0.96]} /> : <cylinderGeometry args={[r * 0.96, r, 0.04, 28]} />}
        <M color={shade} preset="fabric" />
      </mesh>
      {/* Center button (skip for bench) */}
      {!isBench && (
        <mesh position={[0, H + 0.025, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <M color={shade} preset="metal" />
        </mesh>
      )}
    </group>
  )
}

// Nightstand & Filing Cabinet
function Nightstand({ color, shade, dims, isFilingCabinet }) {
  const w = Math.max(0.3, dims.w), d = Math.max(0.3, dims.d), H = isFilingCabinet ? 1.1 : 0.5
  // Calculate how many drawers fit in this height (roughly 0.25 height per drawer)
  const safeH = isNaN(H) ? 0.5 : H
  const numDrawers = Math.max(1, Math.floor((safeH - 0.1) / 0.2)) || 1
  const drawerH = Math.max(0.1, (safeH - 0.1) / numDrawers)

  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Drawers */}
      {Array.from({ length: numDrawers }).map((_, i) => {
        const oy = 0.05 + drawerH / 2 + i * drawerH
        return (
          <group key={i}>
            <mesh position={[0, oy, d / 2 + 0.005]} castShadow>
              <boxGeometry args={[w * 0.9, drawerH * 0.85, 0.01]} />
              <M color={color} preset="wood" />
            </mesh>
            {/* Handle */}
            <mesh position={[0, oy, d / 2 + 0.015]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.01, 0.01, w * 0.3]} />
              <M color={new THREE.Color('#aaaaaa')} preset="chrome" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// Coat Rack
function CoatRack({ color, shade, dims }) {
  const H = 1.7
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 32]} />
        <M color={shade} preset="wood" />
      </mesh>
      {/* Pole */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.025, 0.035, H, 16]} />
        <M color={color} preset="wood" />
      </mesh>
      {/* Hooks */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.08, H - 0.15 + (i % 2) * 0.1, Math.sin(angle) * 0.08]} rotation-z={(Math.cos(angle) * Math.PI) / 4} rotation-x={(-Math.sin(angle) * Math.PI) / 4} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
            <M color={shade} preset="chrome" />
          </mesh>
        )
      })}
    </group>
  )
}

// Main 3D View
export default function View3D({ room, items }) {
  const w = room.width / 100
  const h = room.height / 100

  const lighting = room.lighting || { intensity: 1.0, preset: 'Day' }
  const { intensity, preset } = lighting

  const presets = {
    Day: { ambient: 0.55, dir: 1.1, color: '#fff9f0', sky: 'apartment', bg: '#b0bcc2' },
    Night: { ambient: 0.15, dir: 0.35, color: '#88aaff', sky: 'night', bg: '#050a14' },
    Sunset: { ambient: 0.4, dir: 0.9, color: '#ffbb88', sky: 'sunset', bg: '#1a0d05' },
  }
  const p = presets[preset] || presets.Day

  const centeredItems = useMemo(() => {
    return items.map((it) => {
      const rot = (it.rotation * Math.PI) / 180
      const wCm = it.w * it.scale
      const hCm = it.h * it.scale
      const ox = wCm / 2, oy = hCm / 2
      const rox = ox * Math.cos(rot) - oy * Math.sin(rot)
      const roy = ox * Math.sin(rot) + oy * Math.cos(rot)
      const cx = it.x + rox
      const cy = it.y + roy
      const x = cx / 100 - w / 2
      const z = cy / 100 - h / 2
      const scaleY = Math.max(0.1, 1 + (it.elevation || 0) / 100)
      return { ...it, _pos: [x, 0, z], _scaleY: scaleY }
    })
  }, [items, w, h])

  return (
    <div className="canvas3dWrap">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: preset === 'Night' ? 0.9 : 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
          shadowMapType: THREE.PCFSoftShadowMap,
        }}
        camera={{ position: [2.8, 2.4, 2.8], fov: 44 }}
      >
        {/* Tone + color space */}
        <color attach="background" args={[p.bg]} />

        {/* Lighting rig */}
        <ambientLight intensity={p.ambient * intensity} />

        {/* Key light */}
        <directionalLight
          position={[6, 7, 4]}
          intensity={p.dir * intensity}
          color={p.color}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />

        {/* Fill light — opposite side, cool/fill */}
        <directionalLight
          position={[-4, 3, -3]}
          intensity={p.ambient * 0.45 * intensity}
          color={preset === 'Night' ? '#4466aa' : '#c8dcff'}
        />

        {/* Rim light — top-back for edge definition */}
        <directionalLight
          position={[0, 5, -6]}
          intensity={0.28 * intensity}
          color={preset === 'Night' ? '#334488' : '#ffe8cc'}
        />

        <Environment preset={p.sky} />

        <Room room={room} />

        {centeredItems.map((it) => (
          <group key={it.id} position={it._pos}>
            <Furniture item={it} preset={preset} />
          </group>
        ))}

        <ContactShadows
          position={[0, 0.005, 0]}
          scale={12}
          blur={3.0}
          opacity={0.45}
          far={1.5}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={1.2}
          panSpeed={1.2}
          zoomSpeed={1.2}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={1.2}
          maxDistance={18}
        />
      </Canvas>

      <div className="canvasLegend">
        <span className="chip">3D · {preset}</span>
        <span className="muted">Left drag to rotate · Right drag to pan · Scroll to zoom</span>
      </div>
    </div>
  )
}
