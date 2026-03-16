import React, { useEffect, useMemo, useState } from 'react'
import Canvas2D from '../components/Canvas2D'
import View3D from '../components/View3D'
import FurniturePalette from '../components/FurniturePalette'
import RoomForm from '../components/RoomForm'
import SelectionInspector from '../components/SelectionInspector'
import { useDesignStore } from '../store/useDesignStore'
import { makeItem } from '../utils/furniture'

export default function Designer() {
  const designs = useDesignStore((s) => s.designs)
  const activeId = useDesignStore((s) => s.activeId)
  const setActive = useDesignStore((s) => s.setActive)
  const createDesign = useDesignStore((s) => s.createDesign)
  const updateDesign = useDesignStore((s) => s.updateDesign)

  const active = useMemo(() => {
    const id = activeId ?? designs[0]?.id
    return designs.find((d) => d.id === id) ?? null
  }, [designs, activeId])

  const [tab, setTab] = useState('2D') // 2D | 3D
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!designs.length) {
      const d = createDesign({})
      setActive(d.id)
    } else if (!activeId) {
      setActive(designs[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSelectedId(null)
  }, [active?.id])

  if (!active) {
    return (
      <div className="card">
        <p className="muted">Loading...</p>
      </div>
    )
  }

  const room = active.room
  const items = active.items

  const selected = items.find((x) => x.id === selectedId) ?? null

  const saveRoomPatch = (patch) => {
    updateDesign(active.id, { room: { ...patch } })
  }

  const saveItems = (nextItems) => {
    updateDesign(active.id, { items: nextItems })
  }

  const addFurniture = (type) => {
    // place near room center (cm)
    const x = Math.max(10, room.width / 2 - 60)
    const y = Math.max(10, room.height / 2 - 40)
    const it = makeItem(type, x, y)
    saveItems([...items, it])
    setSelectedId(it.id)
  }

  const patchSelected = (patch) => {
    if (!selected) return
    saveItems(items.map((it) => (it.id === selected.id ? { ...it, ...patch } : it)))
  }

  const removeSelected = () => {
    if (!selected) return
    saveItems(items.filter((it) => it.id !== selected.id))
    setSelectedId(null)
  }

  return (
    <div className="designerRoot">
      <div className="designerMain">
        <div className="designerLeft">
          {/* ─── Workspace + View Toggle ─── */}
          <div className="card" style={{ padding: 14 }}>
            <div className="rowBetween" style={{ marginBottom: 10 }}>
              <div>
                <div className="sectionTitle" style={{ marginBottom: 4 }}>Workspace</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Active: <strong>{active.room?.name}</strong>
                </div>
              </div>
              <div className="viewToggle">
                <button
                  className={`viewToggleBtn ${tab === '2D' ? 'viewToggleBtnActive' : ''}`}
                  onClick={() => setTab('2D')}
                >
                  2D
                </button>
                <button
                  className={`viewToggleBtn ${tab === '3D' ? 'viewToggleBtnActive' : ''}`}
                  onClick={() => setTab('3D')}
                >
                  3D
                </button>
              </div>
            </div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  const d = createDesign({})
                  setActive(d.id)
                }}
              >
                + New design
              </button>
              <select
                className="select"
                value={active.id}
                onChange={(e) => setActive(e.target.value)}
                style={{ flex: 1 }}
              >
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.room?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Visuals ─── */}
          <div className="card" style={{ padding: 14 }}>
            <div className="sectionTitle" style={{ marginBottom: 8 }}>Visuals</div>
            <div className="grid2" style={{ gap: 8 }}>
              <label className="field">
                <span>Time of Day</span>
                <select
                  className="select"
                  value={room.lighting?.preset || 'Day'}
                  onChange={(e) => {
                    const l = room.lighting || { intensity: 1, preset: 'Day' }
                    saveRoomPatch({ lighting: { ...l, preset: e.target.value } })
                  }}
                >
                  <option value="Day">☀️ Day</option>
                  <option value="Night">🌙 Night</option>
                </select>
              </label>
              <label className="field">
                <span>Brightness: {Math.round((room.lighting?.intensity ?? 1) * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={room.lighting?.intensity ?? 1}
                  onChange={(e) => {
                    const l = room.lighting || { intensity: 1, preset: 'Day' }
                    saveRoomPatch({ lighting: { ...l, intensity: parseFloat(e.target.value) } })
                  }}
                />
              </label>
            </div>
          </div>

          {/* Room Settings */}
          <RoomForm room={room} onChange={saveRoomPatch} />

          {/* Clear Button */}
          <button
            className="btn btnDanger"
            style={{ width: '100%', padding: '12px 14px' }}
            onClick={() => {
              if (window.confirm('Are you sure you want to remove all furniture from this room?')) {
                saveItems([])
                setSelectedId(null)
              }
            }}
          >
            🗑️ Clear Room Items
          </button>
        </div>

        <div className="designerCenter">
          {tab === '2D' ? (
            <Canvas2D
              room={room}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChangeItems={saveItems}
            />
          ) : (
            <View3D room={room} items={items} />
          )}
        </div>

        <div className="designerTools">
          <FurniturePalette onAdd={addFurniture} />
          <SelectionInspector item={selected} onChange={patchSelected} onRemove={removeSelected} />
        </div>
      </div>
    </div>
  )
}
