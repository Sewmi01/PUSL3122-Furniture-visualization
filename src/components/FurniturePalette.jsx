import React, { useState } from 'react'
import { furnitureCategories } from '../utils/furniture'

export default function FurniturePalette({ onAdd }) {
  const [openCategory, setOpenCategory] = useState('Living Room')

  return (
    <div className="card" style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="sectionTitle" style={{ marginBottom: 8 }}>Furniture</div>
      <div className="categories" style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
        {furnitureCategories.map((c) => (
          <div key={c.category} className="categoryGroup" style={{ marginBottom: 4 }}>
            <button
              className="categoryBtn"
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: openCategory === c.category ? 'rgba(110, 231, 183, 0.08)' : 'transparent',
                border: openCategory === c.category
                  ? '1px solid rgba(110, 231, 183, 0.18)'
                  : '1px solid rgba(255,255,255,0.06)',
                color: openCategory === c.category ? 'var(--accent)' : 'var(--text)',
                fontWeight: openCategory === c.category ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: openCategory === c.category ? 8 : 4,
              }}
              onClick={() => setOpenCategory(openCategory === c.category ? null : c.category)}
            >
              <span>{c.category}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>
                {openCategory === c.category ? '▼' : '▶'}
              </span>
            </button>
            {openCategory === c.category && (
              <div className="palette" style={{ paddingBottom: 8 }}>
                {c.items.map((f) => (
                  <button
                    key={f.type}
                    className="paletteItem"
                    onClick={() => onAdd(f.type)}
                    title={`Add ${f.label}`}
                  >
                    <div className="paletteIcon" aria-hidden>
                      {iconFor(f.type)}
                    </div>
                    <div className="paletteLabel">{f.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function iconFor(type) {
  switch (type) {
    case 'chair':
    case 'accent_chair':
    case 'office_chair':
    case 'dining_chair':
    case 'bar_stool':
      return '🪑'
    case 'table':
    case 'dining_table':
    case 'desk':
    case 'console_table':
      return '🪵'
    case 'bed':
      return '🛏️'
    case 'sofa':
    case 'sectional_sofa':
    case 'chesterfield_sofa':
      return '🛋️'
    case 'wardrobe':
    case 'armoire':
    case 'sideboard':
    case 'dresser':
    case 'shoe_storage':
    case 'filing_cabinet':
    case 'nightstand':
      return '🗄️'
    case 'bookshelf':
    case 'bookcase':
      return '📚'
    case 'plant':
      return '🪴'
    case 'rug':
      return '🧶'
    case 'tv_unit':
      return '📺'
    case 'window':
      return '🪟'
    case 'lamp':
      return '💡'
    case 'coffee_table':
      return '☕'
    case 'ac':
      return '❄️'
    case 'pouf':
    case 'ottoman':
    case 'bed_bench':
    case 'bench':
      return '🧘'
    case 'coat_rack':
      return '🧥'
    default:
      return '⬛'
  }
}
