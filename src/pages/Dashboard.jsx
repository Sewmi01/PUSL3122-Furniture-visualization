import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts'
import { useDesignStore } from '../store/useDesignStore'

// truncate long room names for the chart
const short = (name = '', max = 10) =>
  name.length > max ? name.slice(0, max) + '…' : name

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chartTooltip">
      <div className="chartTooltipTitle" style={{ marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 13, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const designs = useDesignStore((s) => s.designs)

  const stats = useMemo(() => {
    const total = designs.length
    const totalItems = designs.reduce((acc, d) => acc + (d.items?.length || 0), 0)
    const avgItems = total ? Math.round((totalItems / total) * 10) / 10 : 0

    // Activity map — last 7 days by day name
    const now = new Date()
    const activityMap = {}
    const dayKeys = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const day = d.toLocaleDateString('en-US', { weekday: 'short' })
      activityMap[day] = 0
      dayKeys.push(day)
    }
    for (const d of designs) {
      const day = new Date(d.updatedAt).toLocaleDateString('en-US', { weekday: 'short' })
      if (activityMap[day] != null) activityMap[day] += 1
    }

    // Combined insights chart
    const designInsights = designs
      .slice()
      .reverse()
      .map((d) => {
        const day = new Date(d.updatedAt).toLocaleDateString('en-US', { weekday: 'short' })
        return {
          name: short(d.room?.name),
          items: d.items?.length || 0,
          activity: activityMap[day] || 0,
          shape: d.room?.shape || 'RECT'
        }
      })

    // Room shape split
    const shapeCounts = { RECT: 0, L: 0, SEMICIRCLE: 0 }
    for (const d of designs) {
      const s = d.room?.shape || 'RECT'
      if (shapeCounts[s] != null) shapeCounts[s] += 1
      else shapeCounts[s] = 1
    }

    // Completion rate: average items / target (8 pieces = "complete")
    const TARGET = 8
    const completionRate =
      total > 0 ? Math.min(100, Math.round((avgItems / TARGET) * 100)) : 0

    // Most furnished design
    const richest = designs.reduce(
      (best, d) => ((d.items?.length || 0) > (best?.items?.length || 0) ? d : best),
      null
    )

    const latestDesign = designs[0] || null
    const recent = designs.slice(0, 5)

    return {
      total, totalItems, avgItems, completionRate,
      designInsights, shapeCounts, richest, latestDesign, recent
    }
  }, [designs])

  return (
    <div className="stack">
      {/* KPI Row */}
      <div className="grid3">
        <div className="card">
          <div className="kpiLabel">Saved Designs</div>
          <div className="kpiValue">{stats.total}</div>
          <div className="kpiHint">rooms created</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Furniture Pieces</div>
          <div className="kpiValue">{stats.totalItems}</div>
          <div className="kpiHint">items placed total</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Avg / Design</div>
          <div className="kpiValue">{stats.avgItems}</div>
          <div className="kpiHint">furniture per room</div>
        </div>
      </div>

      {/* ── Design Insights (merged analytic) ── */}
      <div className="card">
        <div className="rowBetween" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Design Insights</h2>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
              Furniture complexity per design · activity this week
            </div>
          </div>
          <Link className="btn btnPrimary" to="/designer">+ New Design</Link>
        </div>

        {stats.designInsights.length > 0 ? (
          <>
            {/* Combined chart: bars = items per design, line = edit activity that day */}
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={stats.designInsights}
                  margin={{ top: 6, right: 24, left: 0, bottom: 0 }}
                  barCategoryGap="35%"
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(233,238,246,0.7)', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fill: 'rgba(233,238,246,0.7)', fontSize: 12 }}
                    label={{ value: 'Items', angle: -90, position: 'insideLeft', fill: 'rgba(233,238,246,0.4)', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fill: 'rgba(96,165,250,0.8)', fontSize: 12 }}
                    label={{ value: 'Edits', angle: 90, position: 'insideRight', fill: 'rgba(96,165,250,0.4)', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'rgba(233,238,246,0.7)', paddingTop: 12 }}
                    formatter={(val) => val === 'items' ? 'Furniture items' : 'Weekly edits'}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="items"
                    name="items"
                    fill="url(#barGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {stats.designInsights.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.items >= stats.avgItems ? 'url(#barGrad)' : 'rgba(110,231,183,0.3)'}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activity"
                    name="activity"
                    stroke="#60a5fa"
                    strokeWidth={2.5}
                    dot={{ fill: '#60a5fa', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Inline summary row under chart */}
            <div className="insightsSummary">
              {/* Completion rate */}
              <div className="insightItem">
                <div className="insightItemLabel">Design Richness</div>
                <div className="insightProgressBar">
                  <div className="insightProgressFill" style={{ width: `${stats.completionRate}%` }} />
                </div>
                <div className="insightItemValue">{stats.completionRate}%</div>
                <div className="insightItemHint">avg vs target of 8 items</div>
              </div>

              {/* Room type split */}
              <div className="insightItem">
                <div className="insightItemLabel">Room Types Used</div>
                <div className="insightShapeRow">
                  {stats.shapeCounts.RECT > 0 && (
                    <div className="insightShapeBadge">
                      <span>▭ Rect</span>
                      <span className="insightShapeCount">{stats.shapeCounts.RECT}</span>
                    </div>
                  )}
                  {stats.shapeCounts.L > 0 && (
                    <div className="insightShapeBadge">
                      <span>⌐ L-Shape</span>
                      <span className="insightShapeCount">{stats.shapeCounts.L}</span>
                    </div>
                  )}
                  {stats.shapeCounts.SEMICIRCLE > 0 && (
                    <div className="insightShapeBadge">
                      <span>◑ Semi</span>
                      <span className="insightShapeCount">{stats.shapeCounts.SEMICIRCLE}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Most furnished design */}
              {stats.richest && (
                <div className="insightItem">
                  <div className="insightItemLabel">Most Furnished Room</div>
                  <div className="insightDesignName">{stats.richest.room?.name}</div>
                  <div className="insightItemHint">{stats.richest.items?.length || 0} furniture pieces</div>
                </div>
              )}

              {/* Latest edit */}
              {stats.latestDesign && (
                <div className="insightItem">
                  <div className="insightItemLabel">Last Edited</div>
                  <div className="insightDesignName">{stats.latestDesign.room?.name}</div>
                  <div className="insightItemHint">{new Date(stats.latestDesign.updatedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="muted" style={{ paddingTop: 16 }}>
            No designs yet. <Link to="/designer" style={{ color: 'var(--accent)' }}>Create your first room →</Link>
          </div>
        )}
      </div>

      {/* Recent Designs */}
      <div className="card">
        <h2 style={{ margin: '0 0 14px' }}>Recent Designs</h2>
        {stats.recent.length ? (
          <div className="table">
            <div className="tableRow tableHead" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
              <div>Room Name</div>
              <div>Items</div>
              <div>Last Updated</div>
            </div>
            {stats.recent.map((d) => (
              <div
                className="tableRow"
                key={d.id}
                style={{ gridTemplateColumns: '2fr 1fr 2fr' }}
              >
                <div>{d.room?.name}</div>
                <div>{d.items?.length || 0}</div>
                <div className="muted">{new Date(d.updatedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No designs yet. Create one in the Designer.</p>
        )}
      </div>
    </div>
  )
}
