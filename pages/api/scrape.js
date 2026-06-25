// pages/api/scrape.js
import { scrapeReviews } from '../../lib/scraper'
import { categorizeReviews } from '../../lib/categorizer'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url, propertyName } = req.body

  if (!url) return res.status(400).json({ error: 'URL is required' })

  const supabase = supabaseAdmin()

  try {
    // 1. Save or get property
    let property
    const { data: existing } = await supabase
      .from('properties')
      .select('*')
      .eq('url', url)
      .single()

    if (existing) {
      property = existing
    } else {
      const { data: newProp, error } = await supabase
        .from('properties')
        .insert({ name: propertyName || 'Unnamed Property', url, platform: 'booking.com' })
        .select()
        .single()

      if (error) throw error
      property = newProp
    }

    // 2. Scrape reviews
    const { success, reviews, error: scrapeError } = await scrapeReviews(url)

    if (!success) {
      return res.status(500).json({ error: `Scraping failed: ${scrapeError}` })
    }

    if (reviews.length === 0) {
      return res.status(200).json({ success: true, message: 'No reviews found on this page', count: 0 })
    }

    // 3. AI categorize reviews
    const categorized = await categorizeReviews(reviews)

    // 4. Save to Supabase
    const toInsert = categorized.map(r => ({
      property_id: property.id,
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      review_text: r.review_text,
      review_date: r.review_date || new Date().toISOString().split('T')[0],
      category: r.category,
      sentiment: r.sentiment,
      is_flagged: r.is_flagged || false
    }))

    const { error: insertError } = await supabase.from('reviews').insert(toInsert)

    if (insertError) throw insertError

    return res.status(200).json({
      success: true,
      property: property.name,
      count: toInsert.length,
      message: `Successfully scraped and saved ${toInsert.length} reviews`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}
