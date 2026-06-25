// lib/scraper.js
// Playwright scraper - runs server-side only (Vercel serverless function)

export async function scrapeReviews(url) {
  // Dynamically import playwright (server-side only)
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  })

  const page = await context.newPage()
  const reviews = []

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for reviews to load
    await page.waitForTimeout(2000)

    // Generic review scraping — works across Booking.com, TripAdvisor, Google
    // Booking.com selectors
    const bookingReviews = await page.evaluate(() => {
      const items = []

      // Try Booking.com structure
      document.querySelectorAll('[data-testid="review-card"], .review_list_new_item_block, .c-review-block').forEach(el => {
        const ratingEl = el.querySelector('[data-testid="review-score"], .bui-review-score__badge, .review-score-badge')
        const textEl = el.querySelector('[data-testid="review-positive-text"], .review_pos, .c-review__body')
        const negativeEl = el.querySelector('[data-testid="review-negative-text"], .review_neg')
        const dateEl = el.querySelector('[data-testid="review-date"], .review_date, .c-review-block__date')
        const nameEl = el.querySelector('[data-testid="review-author"], .reviewer_name, .bui-avatar-block__title')

        if (ratingEl || textEl) {
          const ratingText = ratingEl?.textContent?.trim().replace(',', '.')
          items.push({
            rating: ratingText ? parseFloat(ratingText) : null,
            review_text: [textEl?.textContent?.trim(), negativeEl?.textContent?.trim()].filter(Boolean).join(' '),
            review_date: dateEl?.textContent?.trim() || null,
            reviewer_name: nameEl?.textContent?.trim() || 'Anonymous'
          })
        }
      })

      return items
    })

    if (bookingReviews.length > 0) {
      reviews.push(...bookingReviews)
    } else {
      // Fallback: generic review scraping for other platforms
      const genericReviews = await page.evaluate(() => {
        const items = []
        const possibleReviewContainers = document.querySelectorAll(
          '[class*="review"], [class*="Review"], [itemprop="review"], [data-review]'
        )

        possibleReviewContainers.forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length > 20) {
            const ratingMatch = text.match(/(\d+(\.\d+)?)\s*\/\s*10|(\d+(\.\d+)?)\s*\/\s*5|(\d+)\s*stars?/i)
            items.push({
              rating: ratingMatch ? parseFloat(ratingMatch[1] || ratingMatch[3] || ratingMatch[5]) : null,
              review_text: text.substring(0, 500),
              review_date: new Date().toISOString().split('T')[0],
              reviewer_name: 'Guest'
            })
          }
        })

        return items.slice(0, 50)
      })

      reviews.push(...genericReviews)
    }

    // Normalize ratings to 0-10 scale
    const normalizedReviews = reviews
      .filter(r => r.review_text && r.review_text.length > 10)
      .map(r => ({
        ...r,
        rating: r.rating
          ? (r.rating <= 5 ? r.rating * 2 : r.rating)
          : null,
        is_flagged: r.rating ? r.rating <= 4 : false
      }))

    return { success: true, reviews: normalizedReviews, count: normalizedReviews.length }

  } catch (error) {
    console.error('Scraping error:', error)
    return { success: false, error: error.message, reviews: [] }
  } finally {
    await browser.close()
  }
}
