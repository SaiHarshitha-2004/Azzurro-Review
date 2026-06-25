// lib/scraper.js

export async function scrapeReviews(url) {
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  })

  const context = await browser.newContext({
    viewport: {
      width: 1366,
      height: 768
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  })

  const page = await context.newPage()

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    })

    await page.waitForTimeout(8000)

    console.log('Loaded URL:', page.url())
    console.log('Page Title:', await page.title())

    const reviews = await page.evaluate(() => {
      const results = []

      const possibleCards = [
        ...document.querySelectorAll('[data-testid*="review"]'),
        ...document.querySelectorAll('[class*="review"]'),
        ...document.querySelectorAll('[class*="Review"]')
      ]

      const seen = new Set()

      possibleCards.forEach(card => {
        const text = (card.innerText || '').trim()

        if (!text || text.length < 20) return

        if (seen.has(text)) return
        seen.add(text)

        let rating = null

        const scoreMatch =
          text.match(/\b([0-9]\.[0-9])\b/) ||
          text.match(/\b(10|[0-9])\b/)

        if (scoreMatch) {
          rating = parseFloat(scoreMatch[1] || scoreMatch[0])
        }

        results.push({
          reviewer_name: 'Guest',
          review_text: text.substring(0, 1500),
          review_date: null,
          rating
        })
      })

      return results
    })

    console.log('Raw reviews found:', reviews.length)

    const cleaned = reviews
      .filter(r => r.review_text && r.review_text.length > 20)
      .map(r => ({
        ...r,
        rating:
          r.rating !== null && r.rating <= 5
            ? r.rating * 2
            : r.rating,
        is_flagged:
          r.rating !== null && r.rating <= 4
      }))

    console.log('Final reviews:', cleaned.length)

    if (cleaned.length > 0) {
      console.log('Sample:', cleaned[0])
    }

    return {
      success: true,
      reviews: cleaned,
      count: cleaned.length
    }
  } catch (error) {
    console.error('Scraper Error:', error)

    return {
      success: false,
      error: error.message,
      reviews: []
    }
  } finally {
    await browser.close()
  }
}