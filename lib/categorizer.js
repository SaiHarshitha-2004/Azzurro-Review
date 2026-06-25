// lib/categorizer.js
// Uses Google Gemini API to categorize and analyze reviews

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.ARRAY,
      description: 'List of categorized review analysis results.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          index: {
            type: SchemaType.INTEGER,
            description: 'The 0-based index of the review in the input batch'
          },
          category: {
            type: SchemaType.STRING,
            description: 'The category of the review: cleaning, checkin, food, noise, staff, wifi, location, value, or other'
          },
          sentiment: {
            type: SchemaType.STRING,
            description: 'The sentiment of the review: positive, negative, or neutral'
          },
          summary: {
            type: SchemaType.STRING,
            description: 'A 10-word max summary of the main complaint or praise'
          }
        },
        required: ['index', 'category', 'sentiment', 'summary']
      }
    }
  }
})

export async function categorizeReviews(reviews) {
  if (!reviews.length) return reviews

  // Process in batches of 10 to avoid token limits
  const batchSize = 10
  const categorized = []

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize)

    const prompt = `You are analyzing hotel reviews. Analyze each review in the list below:
${batch.map((r, idx) => `Review [${idx}]: Rating: ${r.rating}/10 | Text: "${r.review_text?.substring(0, 300)}"`).join('\n')}

For each review, categorize it into one of these exact categories: cleaning, checkin, food, noise, staff, wifi, location, value, or other.
Determine its sentiment (positive, negative, neutral) and generate a 10-word max summary of the main complaint or praise.
Ensure that the "index" in your response object matches the 0-based index of the review from the prompt (e.g., 0 for Review [0], 1 for Review [1], etc.).`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const parsed = JSON.parse(text)

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
      console.error('Gemini categorization failed:', err)
      // If AI fails, still save reviews with default category
      batch.forEach(review => {
        categorized.push({ ...review, category: 'other', sentiment: 'neutral', ai_summary: '' })
      })
    }
  }

  return categorized
}

