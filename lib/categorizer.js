// lib/categorizer.js
// Uses Anthropic API to categorize and analyze reviews

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function categorizeReviews(reviews) {
  if (!reviews.length) return reviews

  // Process in batches of 10 to avoid token limits
  const batchSize = 10
  const categorized = []

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize)

    const prompt = `You are analyzing hotel reviews. For each review below, return a JSON array where each object has:
- "index": the review index (0-based)
- "category": one of: cleaning, checkin, food, noise, staff, wifi, location, value, other
- "sentiment": one of: positive, negative, neutral
- "summary": a 10-word max summary of the main complaint or praise

Reviews:
${batch.map((r, idx) => `[${idx}] Rating: ${r.rating}/10 | Text: "${r.review_text?.substring(0, 300)}"`).join('\n')}

Return ONLY a valid JSON array, no other text.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })

      const text = response.content[0].text
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

      batch.forEach((review, idx) => {
        const analysis = parsed.find(p => p.index === idx) || {}
        categorized.push({
          ...review,
          category: analysis.category || 'other',
          sentiment: analysis.sentiment || 'neutral',
          ai_summary: analysis.summary || ''
        })
      })
    } catch (err) {
      // If AI fails, still save reviews with default category
      batch.forEach(review => {
        categorized.push({ ...review, category: 'other', sentiment: 'neutral', ai_summary: '' })
      })
    }
  }

  return categorized
}
