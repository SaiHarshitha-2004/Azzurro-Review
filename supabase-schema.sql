-- Run this in your Supabase SQL editor

-- Properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'booking.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating NUMERIC(3,1),
  review_text TEXT,
  review_date DATE,
  category TEXT, -- cleaning, checkin, food, noise, staff, wifi, other
  sentiment TEXT, -- positive, negative, neutral
  is_flagged BOOLEAN DEFAULT FALSE, -- flagged if rating <= 2
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_review_date ON reviews(review_date);
CREATE INDEX idx_reviews_category ON reviews(category);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all" ON reviews FOR ALL USING (true);
