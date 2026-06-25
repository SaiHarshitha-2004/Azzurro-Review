import { useEffect, useState } from 'react'

export default function CompetitorBenchmark() {
    const [properties, setProperties] = useState([])
    const [winner, setWinner] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/compare')
            .then(res => res.json())
            .then(data => {
                setProperties(data.properties || [])
                setWinner(data.winner || null)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow mt-6">
                Loading benchmark...
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                Competitor Benchmark
            </h2>

            {winner && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <h3 className="text-xl font-semibold text-green-700">
                        🏆 Best Performing Property
                    </h3>
                    <p className="text-lg mt-1">
                        {winner.name} ({winner.avgRating}/10)
                    </p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#1D9E75] text-white">
                            <th className="p-3">Property</th>
                            <th className="p-3">Avg Rating</th>
                            <th className="p-3">Reviews</th>
                            <th className="p-3">Positive</th>
                            <th className="p-3">Negative</th>
                            <th className="p-3">Flagged</th>
                        </tr>
                    </thead>

                    <tbody>
                        {properties.map((property, index) => (
                            <tr
                                key={property.id}
                                className={`text-center ${index % 2 === 0
                                    ? 'bg-gray-50'
                                    : 'bg-white'
                                    } hover:bg-green-50`}
                            >
                                <td className="p-3 font-medium">
                                    {property.name}
                                </td>
                                <td className="p-3">
                                    {property.avgRating}/10
                                </td>
                                <td className="p-3">
                                    {property.totalReviews}
                                </td>
                                <td className="p-3 text-green-600 font-semibold">
                                    {property.positive}
                                </td>
                                <td className="p-3 text-red-600 font-semibold">
                                    {property.negative}
                                </td>
                                <td className="p-3 text-orange-600 font-semibold">
                                    {property.flagged}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}