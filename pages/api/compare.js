import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
    const supabase = supabaseAdmin()

    try {
        const { data: properties } = await supabase
            .from('properties')
            .select('*')

        const results = []

        for (const property of properties) {
            const { data: reviews } = await supabase
                .from('reviews')
                .select('*')
                .eq('property_id', property.id)

            const totalReviews = reviews?.length || 0

            const avgRating = totalReviews
                ? Number(
                    (
                        reviews.reduce(
                            (sum, r) => sum + (Number(r.rating) || 0),
                            0
                        ) / totalReviews
                    ).toFixed(1)
                )
                : 0

            const positive =
                reviews?.filter(r => r.sentiment === 'positive').length || 0

            const negative =
                reviews?.filter(r => r.sentiment === 'negative').length || 0

            const flagged =
                reviews?.filter(r => r.is_flagged).length || 0

            results.push({
                id: property.id,
                name: property.name,
                avgRating,
                totalReviews,
                positive,
                negative,
                flagged
            })
        }

        const winner = [...results].sort(
            (a, b) => b.avgRating - a.avgRating
        )[0]

        return res.status(200).json({
            properties: results,
            winner
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}