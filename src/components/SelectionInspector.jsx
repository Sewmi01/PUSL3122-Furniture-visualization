import React from 'react'

export default function SelectionInspector({ item, onChange, onRemove }) {
  if (!item) {
    return (
      <div className="card" style={{ padding: 14 }}>
        <div className="sectionTitle" style={{ marginBottom: 6 }}>Selected Item</div>
        <div className="muted" style={{ fontSize: 12 }}>Click a furniture item in 2D to edit it.</div>
      </div>
    )
  }

  const typeName = item.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="rowBetween" style={{ marginBottom: 8 }}>
        <div>
          <div className="sectionTitle" style={{ marginBottom: 2 }}>{typeName}</div>
          <div className="muted" style={{ fontSize: 11 }}>Edit properties below</div>
        </div>
        <button className="btn btnDanger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onRemove}>
          🗑️ Remove
        </button>
      </div>

      <div className="grid2" style={{ gap: 8 }}>
        <label className="field">
          <span>Rotation (°)</span>
          <input
            type="number"
            value={Math.round(item.rotation)}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Colour</span>
          <input
            type="color"
            value={item.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      </div>

      <label className="field">
        <span>Scale: {Math.round(item.scale * 100)}%</span>
        <input
          type="range"
          min={0.5}
          max={1.8}
          step={0.05}
          value={item.scale}
          onChange={(e) => onChange({ scale: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Shade: {Math.round(item.shade * 100)}%</span>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.05}
          value={item.shade}
          onChange={(e) => onChange({ shade: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Height (cm)</span>
        <input
          type="number"
          value={Math.round(item.elevation || 0)}
          onChange={(e) => onChange({ elevation: Number(e.target.value) })}
        />
      </label>
    </div>
  )
}
