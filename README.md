# Furniture Designer (React) — 2D + 3D Room Planner

This project implements the **PUSL3122** coursework scenario: an in‑store **designer** logs in and creates a room design by setting **room size/shape/colour scheme**, placing furniture in **2D**, and previewing it in **3D**.

## Features mapped to the brief
- **Designer login** (demo accounts)
- Provide **room size, shape, colour scheme**
- Create a **new design**
- Visualise in **2D** (drag/drop, resize/rotate)
- Visualise in **3D** (fast preview, **one wall removed** for visibility)
- **Scale** furniture items (per item)
- Add **shade** (shadow) and **change colours** (room + items)
- **Save** designs (LocalStorage)
- **Edit / Delete / Duplicate** designs
- **Dashboard** with simple analytics

## Tech
- React + Vite (fast)
- 2D: `react-konva`
- 3D: `@react-three/fiber` + `@react-three/drei` (Three.js)
- State: `zustand`

## Run locally
```bash
npm install
npm run dev
```

## Demo login credentials
- `designer / designer123`
- `admin / admin123`

## Notes
- All data is stored in the browser (LocalStorage) to keep the app lightweight and easy to demo.
- Furniture is modeled procedurally in 3D (bed, sofa, wardrobe, chair, table) using basic meshes.
