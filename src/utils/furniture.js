export const furnitureCategories = [
  {
    category: 'Living Room',
    items: [
      { type: 'sectional_sofa', label: 'Sectional Sofa', footprint: { w: 240, h: 200 }, color: '#7a8b9c' },
      { type: 'chesterfield_sofa', label: 'Chesterfield Sofa', footprint: { w: 200, h: 90 }, color: '#8b5a2b' },
      { type: 'accent_chair', label: 'Accent Chair', footprint: { w: 75, h: 75 }, color: '#c9a27e' },
      { type: 'coffee_table', label: 'Coffee Table', footprint: { w: 90, h: 50 }, color: '#8b4513' },
      { type: 'ottoman', label: 'Ottoman', footprint: { w: 60, h: 60 }, color: '#e0c0a0' }
    ]
  },
  {
    category: 'Bedroom',
    items: [
      { type: 'bed', label: 'Bed', footprint: { w: 180, h: 200 }, color: '#d7d7d7' },
      { type: 'nightstand', label: 'Nightstand', footprint: { w: 50, h: 45 }, color: '#b08d57' },
      { type: 'dresser', label: 'Dresser', footprint: { w: 140, h: 50 }, color: '#a07d47' },
      { type: 'armoire', label: 'Armoire', footprint: { w: 120, h: 60 }, color: '#c2b59b' },
      { type: 'bedroom_bench', label: 'Bench', footprint: { w: 120, h: 45 }, color: '#d0c5a0' }
    ]
  },
  {
    category: 'Dining Room',
    items: [
      { type: 'dining_table', label: 'Dining Table', footprint: { w: 180, h: 100 }, color: '#b08d57' },
      { type: 'dining_chair', label: 'Dining Chair', footprint: { w: 50, h: 55 }, color: '#c9a27e' },
      { type: 'bar_stool', label: 'Bar Stool', footprint: { w: 45, h: 45 }, color: '#8b4513' },
      { type: 'sideboard', label: 'Sideboard', footprint: { w: 160, h: 45 }, color: '#c2b59b' }
    ]
  },
  {
    category: 'Office',
    items: [
      { type: 'desk', label: 'Desk', footprint: { w: 150, h: 70 }, color: '#b08d57' },
      { type: 'office_chair', label: 'Office Chair', footprint: { w: 65, h: 65 }, color: '#333333' },
      { type: 'filing_cabinet', label: 'Filing Cabinet', footprint: { w: 45, h: 55 }, color: '#858585' },
      { type: 'bookcase', label: 'Bookcase', footprint: { w: 90, h: 35 }, color: '#8b5a2b' }
    ]
  },
  {
    category: 'Entryway',
    items: [
      { type: 'console_table', label: 'Console Table', footprint: { w: 120, h: 35 }, color: '#8b4513' },
      { type: 'bench', label: 'Bench', footprint: { w: 100, h: 40 }, color: '#d0c5a0' },
      { type: 'coat_rack', label: 'Coat Rack', footprint: { w: 40, h: 40 }, color: '#8b5a2b' },
      { type: 'shoe_storage', label: 'Shoe Storage', footprint: { w: 80, h: 35 }, color: '#c2b59b' }
    ]
  },
  {
    category: 'Decor & Fixtures',
    items: [
      { type: 'plant', label: 'Plant', footprint: { w: 45, h: 45 }, color: '#4a7023' },
      { type: 'lamp', label: 'Floor Lamp', footprint: { w: 45, h: 45 }, color: '#f5deb3' },
      { type: 'rug', label: 'Rug', footprint: { w: 200, h: 150 }, color: '#d66e53' },
      { type: 'tv_unit', label: 'TV Unit', footprint: { w: 160, h: 40 }, color: '#333333' },
      { type: 'window', label: 'Window', footprint: { w: 100, h: 15 }, color: '#aaddff' },
      { type: 'ac', label: 'AC Unit', footprint: { w: 80, h: 25 }, color: '#ffffff' }
    ]
  }
]

export const furnitureCatalog = furnitureCategories.flatMap(c => c.items)

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

export function makeItem(type, x, y) {
  const def = furnitureCatalog.find((f) => f.type === type)
  if (!def) throw new Error('Unknown furniture type')
  return {
    id: uid(),
    type: def.type,
    x,
    y,
    w: def.footprint.w,
    h: def.footprint.h,
    rotation: 0,
    color: def.color,
    shade: 0.15, // 0..0.8
    elevation: 0, // Default to 0 for all items
    scale: 1
  }
}
