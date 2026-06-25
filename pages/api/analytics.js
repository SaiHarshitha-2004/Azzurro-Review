// pages/api/analytics.js
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { from, to, propertyId } = req.query
  const supabase = supabaseAdmin()

  try {
    // Get all properties
    const { data: properties } = await supabase.from('properties').select('*')

    // Build reviews query
    let query = supabase
      .from('reviews')
      .select('*, properties(name, url)')
      .order('review_date', { ascending: true })

    if (from) query = query.gte('review_date', from)
    if (to) query = query.lte('review_date', to)
    if (propertyId && propertyId !== 'all') query = query.eq('property_id', propertyId)

    const { data: reviews, error } = await query

    if (error) throw error

    // Calculate analytics
    const totalReviews = reviews.length
    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0

    const flaggedCount = reviews.filter(r => r.is_flagged).length

    // Category breakdown
    const categories = {}
    reviews.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1
    })

    // Weekly trend
    const weeklyMap = {}
    reviews.forEach(r => {
      if (!r.review_date || !r.rating) return
      const date = new Date(r.review_date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = weekStart.toISOString().split('T')[0]
      if (!weeklyMap[key]) weeklyMap[key] = { ratings: [], count: 0 }
      weeklyMap[key].ratings.push(r.rating)
      weeklyMap[key].count++
    })

    const weeklyTrend = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgRating: parseFloat((data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length).toFixed(1)),
        count: data.count
      }))

    // Sentiment breakdown
    const sentiments = { positive: 0, negative: 0, neutral: 0 }
    reviews.forEach(r => { if (r.sentiment) sentiments[r.sentiment]++ })

    // Recent flagged reviews
    const flagged = reviews
      .filter(r => r.is_flagged)
      .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))
      .slice(0, 10)

    return res.status(200).json({
      properties,
      summary: { totalReviews, avgRating: parseFloat(avgRating), flaggedCount },
      categories,
      weeklyTrend,
      sentiments,
      flagged,
      recentReviews: reviews.slice(-20).reverse()
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}
