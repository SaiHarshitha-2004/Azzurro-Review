// pages/index.js
import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const CATEGORY_COLORS = {
  cleaning: '#E24B4A',
  checkin: '#EF9F27',
  food: '#1D9E75',
  noise: '#7F77DD',
  staff: '#378ADD',
  wifi: '#D4537E',
  location: '#639922',
  value: '#BA7517',
  other: '#888780'
}

const CATEGORY_ICONS = {
  cleaning: '🧹', checkin: '🔑', food: '🍽️', noise: '🔊',
  staff: '👤', wifi: '📶', location: '📍', value: '💰', other: '💬'
}

export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { fetchAnalytics() }, [selectedProperty, dateFrom, dateTo])

  async function fetchAnalytics() {
    const params = new URLSearchParams()
    if (selectedProperty !== 'all') params.set('propertyId', selectedProperty)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const res = await fetch(`/api/analytics?${params}`)
    const data = await res.json()
    setAnalytics(data)
  }

  async function handleScrape() {
    if (!url) return
    setLoading(true)
    setScrapeMsg('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, propertyName })
      })
      const data = await res.json()
      setScrapeMsg(data.success ? `✅ ${data.message || 'Success'}` : `❌ ${data.error || data.message || 'An error occurred'}`)
      if (data.success && data.count > 0) {
        setUrl('')
        setPropertyName('')
        fetchAnalytics()
      }
    } catch (e) {
      setScrapeMsg('❌ Failed to connect. Please try again.')
    }
    setLoading(false)
  }

  const categoryData = analytics?.categories
    ? Object.entries(analytics.categories)
        .map(([name, value]) => ({ name, value, icon: CATEGORY_ICONS[name] || '💬' }))
        .sort((a, b) => b.value - a.value)
    : []

  const sentimentData = analytics?.sentiments
    ? [
        { name: 'Positive', value: analytics.sentiments.positive, color: '#1D9E75' },
        { name: 'Neutral', value: analytics.sentiments.neutral, color: '#888780' },
        { name: 'Negative', value: analytics.sentiments.negative, color: '#E24B4A' }
      ]
    : []

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E6E0', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: '#1D9E75', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>★</div>
            <span style={{ fontWeight: 600, fontSize: 18, color: '#1a1a1a' }}>Review Analytics</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {analytics?.properties?.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProperty(p.id)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  background: selectedProperty === p.id ? '#1D9E75' : 'transparent',
                  color: selectedProperty === p.id ? '#fff' : '#666',
                  border: `1px solid ${selectedProperty === p.id ? '#1D9E75' : '#ddd'}`
                }}
              >{p.name}</button>
            ))}
            <button
              onClick={() => setSelectedProperty('all')}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                background: selectedProperty === 'all' ? '#1D9E75' : 'transparent',
                color: selectedProperty === 'all' ? '#fff' : '#666',
                border: `1px solid ${selectedProperty === 'all' ? '#1D9E75' : '#ddd'}`
              }}
            >All Properties</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* Add Property */}
        <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 500, fontSize: 15, color: '#1a1a1a' }}>Add a property to monitor</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={propertyName}
              onChange={e => setPropertyName(e.target.value)}
              placeholder="Property name (e.g. Hotel Sunrise)"
              style={{ flex: '0 0 220px', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste Booking.com or review page URL"
              style={{ flex: 1, minWidth: 300, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url}
              style={{
                padding: '10px 24px', background: loading ? '#9FE1CB' : '#1D9E75',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                cursor: loading ? 'wait' : 'pointer', fontWeight: 500, whiteSpace: 'nowrap'
              }}
            >{loading ? 'Scraping...' : 'Fetch Reviews'}</button>
          </div>
          {scrapeMsg && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: scrapeMsg.startsWith('✅') ? '#1D9E75' : '#E24B4A' }}>{scrapeMsg}</p>
          )}
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 13, color: '#666' }}>Date range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
          <span style={{ color: '#999' }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              style={{ fontSize: 13, color: '#666', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[
                { label: 'Average Rating', value: `${analytics.summary.avgRating}/10`, color: analytics.summary.avgRating >= 8 ? '#1D9E75' : analytics.summary.avgRating >= 6 ? '#EF9F27' : '#E24B4A' },
                { label: 'Total Reviews', value: analytics.summary.totalReviews, color: '#378ADD' },
                { label: 'Flagged Reviews', value: analytics.summary.flaggedCount, color: '#E24B4A' },
                { label: 'Properties', value: analytics.properties?.length || 0, color: '#7F77DD' }
              ].map(card => (
                <div key={card.label} style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', borderBottom: '1px solid #E8E6E0' }}>
              {['overview', 'complaints', 'flagged'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 20px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #1D9E75' : '2px solid transparent',
                  color: activeTab === tab ? '#1D9E75' : '#666', fontSize: 14,
                  cursor: 'pointer', fontWeight: activeTab === tab ? 500 : 400,
                  textTransform: 'capitalize'
                }}>{tab}</button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#1a1a1a' }}>Rating trend (week by week)</p>
                  {analytics.weeklyTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={w => w.slice(5)} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [`${v}/10`, 'Avg Rating']} />
                        <Line type="monotone" dataKey="avgRating" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
                      No trend data yet — scrape some reviews to get started
                    </div>
                  )}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#1a1a1a' }}>Sentiment</p>
                  {sentimentData.some(s => s.value > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>No data yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#1a1a1a' }}>Complaints by category</p>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#888'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>No data yet</div>
                  )}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#1a1a1a' }}>Top issues to fix</p>
                  {categoryData.slice(0, 6).map(cat => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        <span style={{ fontSize: 14, textTransform: 'capitalize', color: '#333' }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                          <div style={{ width: `${Math.min(100, (cat.value / (categoryData[0]?.value || 1)) * 100)}%`, height: '100%', background: CATEGORY_COLORS[cat.name] || '#888', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#555', minWidth: 24 }}>{cat.value}</span>
                      </div>
                    </div>
                  ))}
                  {categoryData.length === 0 && <p style={{ color: '#aaa', fontSize: 14 }}>No data yet</p>}
                </div>
              </div>
            )}

            {/* Flagged Tab */}
            {activeTab === 'flagged' && (
              <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 12, padding: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: 500, color: '#1a1a1a' }}>
                  Flagged reviews — need urgent attention
                  <span style={{ marginLeft: 8, background: '#FCEBEB', color: '#E24B4A', fontSize: 12, padding: '2px 8px', borderRadius: 10 }}>{analytics.flagged?.length || 0}</span>
                </p>
                {analytics.flagged?.length > 0 ? analytics.flagged.map(r => (
                  <div key={r.id} style={{ padding: '1rem', marginBottom: 8, border: '1px solid #FEE', borderRadius: 8, background: '#FFFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: '#E24B4A', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{r.rating}/10</span>
                        <span style={{ background: '#FEF0E0', color: '#BA7517', fontSize: 11, padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize' }}>{CATEGORY_ICONS[r.category]} {r.category}</span>
                        <span style={{ fontSize: 13, color: '#999' }}>{r.reviewer_name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#aaa' }}>{r.review_date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{r.review_text?.substring(0, 300)}{r.review_text?.length > 300 ? '...' : ''}</p>
                  </div>
                )) : (
                  <p style={{ color: '#aaa', fontSize: 14 }}>No flagged reviews — great news! 🎉</p>
                )}
              </div>
            )}
          </>
        )}

        {!analytics && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 16 }}>Paste a property URL above and click "Fetch Reviews" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
