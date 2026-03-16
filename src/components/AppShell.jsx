import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

const LinkItem = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      'navItem ' + (isActive ? 'navItemActive' : '')
    }
  >
    <span className="navIcon" aria-hidden>
      {icon}
    </span>
    <span>{label}</span>
  </NavLink>
)

export default function AppShell() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button
          className="toggleSidebarBtn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? '▶' : '◀'}
        </button>
        <div className="brand">
          <div className="brandMark">FD</div>
          <div>
            <div className="brandTitle">Furniture Designer</div>
            <div className="brandSub">2D + 3D Room Planner</div>
          </div>
        </div>

        <nav className="nav">
          {isAdmin ? (
            <>
              <LinkItem to="/admin" label="Admin Panel" icon="🔑" />
            </>
          ) : (
            <>
              <LinkItem to="/dashboard" label="Dashboard" icon="📊" />
              <LinkItem to="/designer" label="Designer" icon="🛋️" />
              <LinkItem to="/designs" label="Saved Designs" icon="💾" />
              <LinkItem to="/about" label="About" icon="ℹ️" />
            </>
          )}
        </nav>

        <div className="sidebarFooter">
          <div className="userCard">
            <div className={'userAvatar ' + (isAdmin ? 'userAvatarAdmin' : '')} aria-hidden>
              {user?.name?.slice(0, 1) ?? 'U'}
            </div>
            <div>
              <div className="userName">
                {user?.name}
                {isAdmin && <span className="adminBadge">Admin</span>}
              </div>
              <div className="userMeta">{user?.username}</div>
            </div>
          </div>
          <button
            className="btn btnGhost"
            onClick={() => {
              logout()
              nav('/login')
            }}
          >
            <span>🚪</span>
            <span className="logoutLabel" style={{ marginLeft: 8 }}>Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbarTitle">
            {isAdmin ? '⚙️ Admin Control Panel' : 'Design, Preview, Present'}
          </div>
          <div className="topbarHint">
            {isAdmin
              ? 'Manage users, view analytics and furniture usage.'
              : 'Create a room in 2D, then view it in 3D.'}
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
