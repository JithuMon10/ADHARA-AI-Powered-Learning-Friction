import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

function FrictionIndicator({ level, percentage }) {
    const config = {
        low: {
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            label: 'Low Friction',
            description: 'Learner shows consistent engagement patterns'
        },
        medium: {
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            label: 'Medium Friction',
            description: 'Some hesitation patterns detected'
        },
        high: {
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            label: 'High Friction',
            description: 'Significant friction indicators observed'
        }
    }

    const { icon: Icon, color, bg, border, label, description } = config[level]

    return (
        <div className={`${bg} ${border} border-2 rounded-xl p-6 text-center`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 ${bg} rounded-full mb-4`}>
                <Icon className={`w-8 h-8 ${color}`} />
            </div>

            <div className={`text-3xl font-bold ${color} mb-1`}>
                {label}
            </div>

            {percentage !== undefined && (
                <div className="text-lg font-medium text-slate-600 mb-2">
                    {percentage}% overall friction score
                </div>
            )}

            <p className="text-slate-600">
                {description}
            </p>
        </div>
    )
}

export default FrictionIndicator
