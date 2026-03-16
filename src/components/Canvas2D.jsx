import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage, Text, Transformer, Group } from 'react-konva'
import { generateRoomPolygon } from '../utils/roomShape'

function roomPolygon(room, scale, pad) {
  // Use the shared utility
  // It returns [{x,y}, ...]
  const basePoints = generateRoomPolygon(room.width, room.height, room.shape)

  // Convert to flat array [rx, ry, rx, ry...] scaled and padded
  const flat = []
  for (const p of basePoints) {
    flat.push(pad + p.x * scale)
    flat.push(pad + p.y * scale)
  }
  return flat
}

export default function Canvas2D({ room, items, selectedId, onSelect, onChangeItems }) {
  const wrapRef = useRef(null)
  const trRef = useRef(null)
  const itemRefs = useRef({})

  const [size, setSize] = useState({ w: 900, h: 520 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({
        w: Math.floor(r.width),
        h: Math.floor(r.height)
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { scale, pad, poly } = useMemo(() => {
    const pad = 24
    const maxW = size.w - pad * 2
    const maxH = size.h - pad * 2

    // cm -> px scaling
    const s = Math.min(maxW / room.width, maxH / room.height)
    return { scale: s, pad, poly: roomPolygon(room, s, pad) }
  }, [room, size.w, size.h])

  useEffect(() => {
    const tr = trRef.current
    if (!tr) return

    const node = selectedId ? itemRefs.current[selectedId] : null
    if (node) {
      tr.nodes([node])
      tr.getLayer()?.batchDraw()
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId, items])

  const toPx = (cm) => cm * scale
  const toCm = (px) => px / scale

  const onDragEnd = (id, e) => {
    // Use the reference to the Group to safely bypass Konva's nested child e.target ambiguity
    const node = itemRefs.current[id]
    if (!node) return

    const nx = node.x()
    const ny = node.y()

    onChangeItems(
      items.map((it) =>
        it.id === id
          ? { ...it, x: toCm(nx - pad), y: toCm(ny - pad) }
          : it
      )
    )
  }

  const onTransformEnd = (id, e) => {
    const node = itemRefs.current[id]
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)

    const wPx = Math.max(10, node.width() * scaleX)
    const hPx = Math.max(10, node.height() * scaleY)

    onChangeItems(
      items.map((it) =>
        it.id === id
          ? {
            ...it,
            x: toCm(node.x() - pad),
            y: toCm(node.y() - pad),
            w: toCm(wPx) / it.scale,
            h: toCm(hPx) / it.scale,
            rotation: node.rotation()
          }
          : it
      )
    )
  }

  const roomStroke = room.wallColor || '#111'

  return (
    <div ref={wrapRef} className="canvas2dWrap">
      <Stage
        width={size.w}
        height={size.h}
        onMouseDown={(e) => {
          const target = e.target
          const clickedStage = target === target.getStage()
          const clickedRoom = typeof target?.name === 'function' && target.name() === 'room-shape'
          if (clickedStage || clickedRoom) onSelect(null)
        }}
      >
        <Layer>
          <Line
            name="room-shape"
            points={poly}
            closed
            fill={room.color}
            stroke={roomStroke}
            strokeWidth={2}
          />

          <Text
            x={pad}
            y={pad - 18}
            text={`${room.name} (${room.width}cm × ${room.height}cm)`}
            fontSize={12}
            fill={'rgba(233, 238, 246, 0.85)'}
          />
        </Layer>

        <Layer>
          {items.map((it) => {
            const wPx = toPx(it.w * it.scale)
            const hPx = toPx(it.h * it.scale)
            return (
              <Group
                key={it.id}
                x={pad + toPx(it.x)}
                y={pad + toPx(it.y)}
                rotation={it.rotation}
                draggable
                onDragEnd={(e) => onDragEnd(it.id, e)}
                onClick={() => onSelect(it.id)}
                onTap={() => onSelect(it.id)}
                ref={(node) => {
                  if (node) itemRefs.current[it.id] = node
                }}
                onTransformEnd={(e) => onTransformEnd(it.id, e)}
                width={wPx}
                height={hPx}
              >
                <Rect
                  width={wPx}
                  height={hPx}
                  fill={it.color}
                  cornerRadius={Math.min(18, Math.min(wPx, hPx) * 0.2)}
                  stroke={it.id === selectedId ? '#2b6cb0' : '#222'}
                  strokeWidth={it.id === selectedId ? 2 : 1}
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={false}
                />
                <Text
                  text={it.type.toUpperCase()}
                  x={8}
                  y={8}
                  fontSize={11}
                  fill={'#111'}
                  opacity={0.7}
                  perfectDrawEnabled={false}
                />
                <Line
                  points={[10, hPx - 18, wPx - 10, hPx - 18]}
                  stroke={'rgba(0,0,0,0.25)'}
                  strokeWidth={2}
                  lineCap="round"
                  perfectDrawEnabled={false}
                />
                <Line
                  points={[10, 18, wPx - 10, 18]}
                  stroke={'rgba(255,255,255,0.35)'}
                  strokeWidth={2}
                  lineCap="round"
                  perfectDrawEnabled={false}
                />
              </Group>
            )
          })}

          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox
              return newBox
            }}
          />
        </Layer>
      </Stage>

      <div className="canvasLegend">
        <span className="chip">2D Plan</span>
        <span className="muted">Drag items. Select to resize/rotate (handles).</span>
      </div>
    </div>
  )
}
