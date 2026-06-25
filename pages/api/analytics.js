import { supabaseAdmin } from '../../lib/supabase'
import CompetitorBenchmark from '../../components/competitorBenchmark'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  const { from, to, propertyId } = req.query
  const supabase = supabaseAdmin()

  try {
    const {
      data: properties,
      error: propertiesError
    } = await supabase
      .from('properties')
      .select('*')

    if (propertiesError) throw propertiesError

    let query = supabase
      .from('reviews')
      .select('*, properties(name, url)')
      .order('review_date', { ascending: true })

    if (from) {
      query = query.gte('review_date', from)
    }

    if (to) {
      query = query.lte('review_date', to)
    }

    if (propertyId && propertyId !== 'all') {
      query = query.eq('property_id', propertyId)
    }

    const {
      data: reviews,
      error
    } = await query

    if (error) throw error

    const safeReviews = reviews || []

    const totalReviews = safeReviews.length

    const validRatings = safeReviews
      .map(r => Number(r.rating))
      .filter(r => !isNaN(r) && r > 0)

    const avgRating = validRatings.length
      ? Number(
        (
          validRatings.reduce(
            (sum, rating) => sum + rating,
            0
          ) / validRatings.length
        ).toFixed(1)
      )
      : 0

    const flaggedCount = safeReviews.filter(
      r => r.is_flagged
    ).length

    const categories = {}

    safeReviews.forEach(r => {
      if (!r.category) return

      categories[r.category] =
        (categories[r.category] || 0) + 1
    })

    const weeklyMap = {}

    safeReviews.forEach(r => {
      if (!r.review_date) return

      if (
        r.rating === null ||
        r.rating === undefined
      ) {
        return
      }

      const date = new Date(r.review_date)

      const weekStart = new Date(date)

      weekStart.setDate(
        date.getDate() - date.getDay()
      )

      const key = weekStart
        .toISOString()
        .split('T')[0]

      if (!weeklyMap[key]) {
        weeklyMap[key] = {
          ratings: [],
          count: 0
        }
      }

      weeklyMap[key].ratings.push(
        Number(r.rating)
      )

      weeklyMap[key].count++
    })

    const weeklyTrend = Object.entries(
      weeklyMap
    )
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(([week, data]) => ({
        week,
        avgRating: Number(
          (
            data.ratings.reduce(
              (sum, rating) => sum + rating,
              0
            ) / data.ratings.length
          ).toFixed(1)
        ),
        count: data.count
      }))

    const sentiments = {
      positive: 0,
      neutral: 0,
      negative: 0
    }

    safeReviews.forEach(r => {
      if (
        r.sentiment &&
        sentiments.hasOwnProperty(
          r.sentiment
        )
      ) {
        sentiments[r.sentiment]++
      }
    })

    const flagged = safeReviews
      .filter(r => r.is_flagged)
      .sort(
        (a, b) =>
          new Date(b.review_date) -
          new Date(a.review_date)
      )
      .slice(0, 10)

    return res.status(200).json({
      properties,

      summary: {
        totalReviews,
        avgRating,
        flaggedCount
      },

      categories,

      weeklyTrend,

      sentiments,

      flagged,

      recentReviews: safeReviews
        .slice(-20)
        .reverse()
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: error.message
    })
  }
}

<CompetitorBenchmark />