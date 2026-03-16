import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="stack">
      <div className="card">
        <h1>Room + Furniture Visualiser (2D → 3D)</h1>
        <p className="muted">
          Build a room by size, shape and colour scheme, place furniture in 2D, then
          preview in a fast 3D view for customers.
        </p>
        <div className="row">
          <Link className="btn btnPrimary" to="/designer">
            Start Designing
          </Link>
          <Link className="btn" to="/dashboard">
            View Dashboard
          </Link>
          <Link className="btn" to="/designs">
            Open Saved Designs
          </Link>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>What you can do</h2>
          <ul className="list">
            <li>Set room width/height, shape (Rect or L-shape), floor & wall colours</li>
            <li>Drag & drop furniture (chair, table, bed, sofa, wardrobe)</li>
            <li>Scale, rotate, recolour, and shade furniture items</li>
            <li>Save, edit, duplicate, and delete designs</li>
            <li>Switch between 2D plan and 3D preview (one wall removed for visibility)</li>
          </ul>
        </div>
        <div className="card">
          <h2>Quick tips</h2>
          <ul className="list">
            <li>Use the left panel to edit the room and selected furniture</li>
            <li>In 2D: click an item to select; use the handles to resize/rotate</li>
            <li>In 3D: drag to orbit, scroll to zoom, right-drag to pan</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
