import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function FrictionSummary({ learners }) {
    // Calculate summary statistics
    const stats = {
        total: learners.length,
        low: learners.filter(l => l.frictionLevel === 'low').length,
        medium: learners.filter(l => l.frictionLevel === 'medium').length,
        high: learners.filter(l => l.frictionLevel === 'high').length,
    }

    const summaryCards = [
        {
            label: 'Total Learners',
            value: stats.total,
            icon: Minus,
            color: 'text-slate-600',
            bg: 'bg-slate-100'
        },
        {
            label: 'Low Friction',
            value: stats.low,
            icon: TrendingDown,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            label: 'Medium Friction',
            value: stats.medium,
            icon: Minus,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            label: 'High Friction',
            value: stats.high,
            icon: TrendingUp,
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="card">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-slate-900">{value}</div>
                            <div className="text-sm text-slate-500">{label}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default FrictionSummary
