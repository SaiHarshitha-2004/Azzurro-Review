// lib/categorizer.js
// Local keyword-based review categorizer and sentiment analyzer

const KEYWORDS = {
  cleaning: [
    'clean', 'dirty', 'dust', 'mess', 'spotless', 'hygiene', 'swept', 'wash', 
    'bathroom', 'shower', 'sheets', 'towel', 'tidy', 'smell', 'odor', 'stain', 
    'bugs', 'bedding', 'linens', 'mold', 'vacuum', 'garbage', 'trash', 'filthy',
    'neat', 'carpet', 'housekeeping', 'maid', 'hair', 'tub', 'toilet'
  ],
  checkin: [
    'check-in', 'checkin', 'arrival', 'front desk', 'reception', 'key', 
    'check out', 'checkout', 'arrive', 'lobby', 'check-out', 'clerk',
    'late entry', 'early check-in', 'wait time', 'registration', 'queue',
    'welcome', 'deposit', 'card'
  ],
  food: [
    'food', 'breakfast', 'dinner', 'lunch', 'restaurant', 'meal', 'buffet', 
    'coffee', 'delicious', 'eat', 'beverage', 'drink', 'bar', 'cooking',
    'menu', 'taste', 'hungry', 'tea', 'cafe', 'dining', 'kitchen', 'egg',
    'toast', 'juice', 'cook'
  ],
  noise: [
    'noise', 'noisy', 'loud', 'quiet', 'soundproof', 'traffic', 'street', 
    'party', 'walls', 'hear', 'sleep', 'siren', 'construction', 'thin walls',
    'disturb', 'silent', 'peaceful', 'barking', 'music', 'pub', 'club'
  ],
  staff: [
    'staff', 'friendly', 'helpful', 'rude', 'welcoming', 'hospitable', 'host', 
    'manager', 'employee', 'service', 'kind', 'polite', 'unprofessional',
    'assistant', 'courteous', 'attitude', 'personnel', 'guy', 'lady', 'clerk'
  ],
  wifi: [
    'wifi', 'wi-fi', 'internet', 'connection', 'network', 'slow', 'signal',
    'online', 'connect', 'web', 'router', 'bandwidth', 'disconnect', 'speed'
  ],
  location: [
    'location', 'close to', 'near', 'distance', 'metro', 'subway', 'walking', 
    'neighborhood', 'central', 'convenient', 'bus stop', 'attractions',
    'surroundings', 'view', 'scenery', 'accessible', 'transport', 'far from',
    'station', 'walk'
  ],
  value: [
    'price', 'value', 'cheap', 'expensive', 'worth', 'cost', 'deal', 'money', 
    'budget', 'overpriced', 'charge', 'free', 'affordable', 'rates', 'fee', 
    'bill', 'payment', 'refund', 'expensive', 'rip-off', 'overcharge', 'pay'
  ]
}

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'friendly', 'clean', 'perfect', 
  'love', 'nice', 'helpful', 'beautiful', 'wonderful', 'best', 'liked', 
  'perfectly', 'comfortable', 'cozy', 'superb', 'awesome', 'enjoy', 'sweet',
  'fantastic', 'pleasant', 'glad', 'satisfied', 'lovely', 'recommend'
]

const NEGATIVE_WORDS = [
  'bad', 'poor', 'dirty', 'noisy', 'rude', 'slow', 'broken', 'disappointed', 
  'terrible', 'worst', 'horrible', 'hate', 'annoyed', 'dislike', 'uncomfortable', 
  'old', 'smelly', 'disgusting', 'failed', 'issue', 'complaint', 'sad',
  'unfriendly', 'nasty', 'awful', 'regret', 'unhelpful', 'avoid'
]

export async function categorizeReviews(reviews) {
  if (!reviews.length) return reviews

  const categorized = []

  for (const review of reviews) {
    const textLower = (review.review_text || '').toLowerCase()
    
    // 1. Categorization based on keyword occurrences
    let bestCategory = 'other'
    let maxMatches = 0

    for (const [category, words] of Object.entries(KEYWORDS)) {
      let matches = 0
      for (const word of words) {
        if (textLower.includes(word)) {
          matches++
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches
        bestCategory = category
      }
    }

    // 2. Sentiment analysis based on rating (if available) and sentiment keywords
    let sentiment = 'neutral'
    if (review.rating !== null && review.rating !== undefined) {
      if (review.rating >= 7.0) {
        sentiment = 'positive'
      } else if (review.rating <= 4.0) {
        sentiment = 'negative'
      } else {
        sentiment = 'neutral'
      }
    } else {
      let posMatches = 0
      let negMatches = 0
      for (const pw of POSITIVE_WORDS) {
        if (textLower.includes(pw)) posMatches++
      }
      for (const nw of NEGATIVE_WORDS) {
        if (textLower.includes(nw)) negMatches++
      }

      if (posMatches > negMatches) {
        sentiment = 'positive'
      } else if (negMatches > posMatches) {
        sentiment = 'negative'
      } else {
        sentiment = 'neutral'
      }
    }

    // 3. Generate a summary (first 8 words or short description)
    let ai_summary = ''
    if (review.review_text) {
      const words = review.review_text.trim().split(/\s+/)
      if (words.length <= 8) {
        ai_summary = review.review_text.trim()
      } else {
        ai_summary = words.slice(0, 8).join(' ') + '...'
      }
    }

    categorized.push({
      ...review,
      category: bestCategory,
      sentiment,
      ai_summary
    })
  }

  return categorized
}

