import React, { useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { furnitureCatalog } from '../utils/furniture'
import { useAuth } from '../store/useAuth'
import { storage } from '../store/storage'

const USERS_KEY = 'fd_users_v1'


const BAR_COLORS = [
    '#6ee7b7',
    '#60a5fa',
    '#f472b6',
    '#fb923c',
    '#a78bfa',
    '#34d399',
    '#facc15',
    '#f87171',
    '#38bdf8',
    '#c084fc',
    '#4ade80',
    '#fbbf24',
    '#e879f9',
    '#f9a8d4',
]

const FURNITURE_ICONS = {
    chair: '🪑', table: '🪵', bed: '🛏️', sofa: '🛋️', wardrobe: '🚪',
    bookshelf: '📚', plant: '🪴', rug: '🎨', tv_unit: '📺', window: '🪟',
    lamp: '💡', coffee_table: '☕', ac: '❄️', pouf: '🪑'
}

function StatCard({ icon, label, value, accent }) {
    return (
        <div className="adminStatCard" style={{ '--accent-color': accent }}>
            <div className="adminStatIcon">{icon}</div>
            <div>
                <div className="adminStatValue">{value}</div>
                <div className="adminStatLabel">{label}</div>
            </div>
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const icon = FURNITURE_ICONS[furnitureCatalog.find(f => f.label === label)?.type] || '🪑'
        return (
            <div className="chartTooltip">
                <div className="chartTooltipTitle">{icon} {label}</div>
                <div className="chartTooltipValue">{payload[0].value} used</div>
            </div>
        )
    }
    return null
}

export default function AdminDashboard() {
    const { getRegisteredUsers } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [banMsg, setBanMsg] = useState('')

    const users = getRegisteredUsers()

    const allDesigns = useMemo(() => {
        let all = []
        users.forEach(u => {
            if (u.username === 'admin') return
            const key = `fd_designs_v1_${u.username.toLowerCase()}`
            const userDesigns = storage.get(key, [])
            all = all.concat(userDesigns)
        })
        return all
    }, [users])

    const stats = useMemo(() => {
        // Build counts for ALL furniture types in the catalog
        const counts = {}
        furnitureCatalog.forEach((f) => { counts[f.type] = 0 })
        for (const d of allDesigns) {
            for (const it of d.items || []) {
                if (counts[it.type] != null) counts[it.type] += 1
            }
        }

        const chart = furnitureCatalog.map((f) => ({
            type: f.type,
            label: f.label,
            count: counts[f.type] || 0,
            color: f.color
        })).sort((a, b) => b.count - a.count)

        const totalItems = Object.values(counts).reduce((a, b) => a + b, 0)
        const mostUsed = chart[0]
        const leastUsed = chart[chart.length - 1]

        return {
            chart,
            totalItems,
            totalDesigns: allDesigns.length,
            totalUsers: users.length,
            mostUsed,
            leastUsed
        }
    }, [allDesigns, users])

    const [localUsers, setLocalUsers] = useState(() => {
        return storage.get(USERS_KEY, [])
    })

    const toggleBan = (username) => {
        const updated = localUsers.map((u) =>
            u.username === username ? { ...u, banned: !u.banned } : u
        )
        storage.set(USERS_KEY, updated)
        setLocalUsers(updated)
        setBanMsg(`User "${username}" status updated.`)
        setTimeout(() => setBanMsg(''), 2500)
    }

    return (
        <div className="stack">
            {/* Stat Cards */}
            <div className="adminStatGrid">
                <StatCard icon="👥" label="Total Users" value={stats.totalUsers} accent="#6ee7b7" />
                <StatCard icon="🗂️" label="Total Designs" value={stats.totalDesigns} accent="#60a5fa" />
                <StatCard icon="🪑" label="Furniture Placed" value={stats.totalItems} accent="#f472b6" />
                <StatCard icon="🏆" label="Most Used" value={stats.mostUsed?.label || '—'} accent="#facc15" />
                <StatCard icon="📉" label="Least Used" value={stats.leastUsed?.label || '—'} accent="#fb923c" />
            </div>

            {/* Tab Nav */}
            <div className="adminTabNav">
                {['overview', 'users', 'controls'].map((t) => (
                    <button
                        key={t}
                        className={'adminTabBtn ' + (activeTab === t ? 'adminTabBtnActive' : '')}
                        onClick={() => setActiveTab(t)}
                    >
                        {t === 'overview' && '📊 Furniture Usage'}
                        {t === 'users' && '👤 User Management'}
                        {t === 'controls' && '⚙️ Site Controls'}
                    </button>
                ))}
            </div>

            {/* Furniture Usage */}
            {activeTab === 'overview' && (
                <div className="card">
                    <div className="rowBetween" style={{ marginBottom: 16 }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Furniture Usage — All Types</h2>
                            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                                Across all {stats.totalDesigns} saved designs · {stats.totalItems} pieces placed
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div style={{ width: '100%', height: 340 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={stats.chart}
                                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                                barCategoryGap="30%"
                            >
                                <defs>
                                    {BAR_COLORS.map((color, i) => (
                                        <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: 'rgba(233,238,246,0.7)', fontSize: 12 }}
                                    angle={-30}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis allowDecimals={false} tick={{ fill: 'rgba(233,238,246,0.7)', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={46}>
                                    {stats.chart.map((entry, i) => (
                                        <Cell key={entry.type} fill={`url(#grad${i % BAR_COLORS.length})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend grid */}
                    <div className="furnitureLegendGrid">
                        {stats.chart.map((entry, i) => (
                            <div key={entry.type} className="furnitureLegendItem">
                                <div
                                    className="furnitureLegendDot"
                                    style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                                />
                                <span className="furnitureLegendIcon">{FURNITURE_ICONS[entry.type]}</span>
                                <span className="furnitureLegendName">{entry.label}</span>
                                <span className="furnitureLegendCount">{entry.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Management tab */}
            {activeTab === 'users' && (
                <div className="card">
                    <h2 style={{ margin: '0 0 16px' }}>Registered Users</h2>
                    {banMsg && <div className="alertSuccess" style={{ marginBottom: 12 }}>{banMsg}</div>}
                    <div className="adminUsersTable">
                        <div className="adminUsersRow adminUsersHead">
                            <div>User</div>
                            <div>Username</div>
                            <div>Joined</div>
                            <div>Last Login</div>
                            <div>Status</div>
                            <div>Action</div>
                        </div>
                        {localUsers.length === 0 && (
                            <div className="muted" style={{ padding: '16px 0' }}>No registered users yet.</div>
                        )}
                        {localUsers.map((u) => (
                            <div className="adminUsersRow" key={u.username}>
                                <div className="adminUserCell">
                                    <div className="adminUserAvatar">{u.name?.slice(0, 1).toUpperCase()}</div>
                                    <span>{u.name}</span>
                                </div>
                                <div className="muted">@{u.username}</div>
                                <div className="muted" style={{ fontSize: 12 }}>
                                    {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '—'}
                                </div>
                                <div className="muted" style={{ fontSize: 12 }}>
                                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                                </div>
                                <div>
                                    <span className={'statusBadge ' + (u.banned ? 'statusBanned' : 'statusActive')}>
                                        {u.banned ? '🚫 Banned' : '✅ Active'}
                                    </span>
                                </div>
                                <div>
                                    {u.username !== 'designer' ? (
                                        <button
                                            className={'btn ' + (u.banned ? 'btnPrimary' : 'btnDanger')}
                                            style={{ fontSize: 12, padding: '6px 10px' }}
                                            onClick={() => toggleBan(u.username)}
                                        >
                                            {u.banned ? 'Unban' : 'Ban'}
                                        </button>
                                    ) : (
                                        <span className="muted" style={{ fontSize: 12 }}>Protected</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Site Controls tab */}
            {activeTab === 'controls' && (
                <div className="stack">
                    <div className="card">
                        <h2 style={{ margin: '0 0 16px' }}>📋 Site Statistics</h2>
                        <div className="adminControlGrid">
                            <div className="adminControlItem">
                                <div className="adminControlIcon">🗂️</div>
                                <div className="adminControlLabel">Total Designs Saved</div>
                                <div className="adminControlValue">{stats.totalDesigns}</div>
                            </div>
                            <div className="adminControlItem">
                                <div className="adminControlIcon">🪑</div>
                                <div className="adminControlLabel">Furniture Pieces Placed</div>
                                <div className="adminControlValue">{stats.totalItems}</div>
                            </div>
                            <div className="adminControlItem">
                                <div className="adminControlIcon">👥</div>
                                <div className="adminControlLabel">Registered Users</div>
                                <div className="adminControlValue">{stats.totalUsers}</div>
                            </div>
                            <div className="adminControlItem">
                                <div className="adminControlIcon">📐</div>
                                <div className="adminControlLabel">Avg. Items / Design</div>
                                <div className="adminControlValue">
                                    {stats.totalDesigns > 0
                                        ? Math.round((stats.totalItems / stats.totalDesigns) * 10) / 10
                                        : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ margin: '0 0 8px' }}>🏆 Furniture Rankings</h2>
                        <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                            Which furniture types are chosen most often by users
                        </div>
                        <div className="rankingList">
                            {stats.chart.slice(0, 5).map((entry, i) => (
                                <div key={entry.type} className="rankingItem">
                                    <div className="rankingPos">#{i + 1}</div>
                                    <div className="rankingIcon">{FURNITURE_ICONS[entry.type]}</div>
                                    <div className="rankingName">{entry.label}</div>
                                    <div className="rankingBar">
                                        <div
                                            className="rankingBarFill"
                                            style={{
                                                width: stats.chart[0].count > 0
                                                    ? `${Math.round((entry.count / stats.chart[0].count) * 100)}%`
                                                    : '0%',
                                                background: BAR_COLORS[i]
                                            }}
                                        />
                                    </div>
                                    <div className="rankingCount">{entry.count}</div>
                                </div>
                            ))}
                            {stats.chart.every(e => e.count === 0) && (
                                <div className="muted">No furniture placed yet. Start designing!</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
