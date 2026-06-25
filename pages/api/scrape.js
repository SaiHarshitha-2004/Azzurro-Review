// pages/api/scrape.js

import { scrapeReviews } from '../../lib/scraper'
import { categorizeReviews } from '../../lib/categorizer'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  const { url, propertyName } = req.body

  if (!url?.trim()) {
    return res.status(400).json({
      error: 'Property URL is required'
    })
  }

  if (!propertyName?.trim()) {
    return res.status(400).json({
      error: 'Property name is required'
    })
  }

  const supabase = supabaseAdmin()

  try {

    // Check if URL already exists
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('*')
      .eq('url', url)
      .maybeSingle()

    if (existingProperty) {
      return res.status(400).json({
        error: 'This property URL already exists'
      })
    }

    // Check if property name already exists
    const { data: existingName } = await supabase
      .from('properties')
      .select('id')
      .ilike('name', propertyName.trim())
      .maybeSingle()

    if (existingName) {
      return res.status(400).json({
        error: 'Property name already exists. Please use a unique name.'
      })
    }

    // Scrape reviews
    const {
      success,
      reviews,
      error: scrapeError
    } = await scrapeReviews(url)

    if (!success) {
      return res.status(500).json({
        error: `Scraping failed: ${scrapeError}`
      })
    }

    // Create property
    const { data: property, error: propertyError } =
      await supabase
        .from('properties')
        .insert({
          name: propertyName.trim(),
          url,
          platform: 'booking.com'
        })
        .select()
        .single()

    if (propertyError) {
      throw propertyError
    }

    // No reviews found
    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        success: true,
        property: property.name,
        count: 0,
        message: 'No reviews found on this page'
      })
    }

    // Categorize reviews
    const categorized = await categorizeReviews(reviews)

    const reviewsToInsert = categorized.map(review => ({
      property_id: property.id,
      reviewer_name:
        review.reviewer_name || 'Anonymous',

      rating:
        review.rating !== undefined
          ? review.rating
          : null,

      review_text:
        review.review_text || '',

      review_date:
        review.review_date ||
        new Date()
          .toISOString()
          .split('T')[0],

      category:
        review.category || 'other',

      sentiment:
        review.sentiment || 'neutral',

      is_flagged:
        review.is_flagged || false
    }))

    const { error: reviewsError } =
      await supabase
        .from('reviews')
        .insert(reviewsToInsert)

    if (reviewsError) {
      throw reviewsError
    }

    return res.status(200).json({
      success: true,
      property: property.name,
      count: reviewsToInsert.length,
      message: `Successfully scraped and saved ${reviewsToInsert.length} reviews`
    })

  } catch (error) {
    console.error('SCRAPE API ERROR:', error)

    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}