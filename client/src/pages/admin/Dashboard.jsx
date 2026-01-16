import { Users, FileText, AlertTriangle, TrendingUp } from 'lucide-react'

function AdminDashboard() {
    // Empty state stats (will be populated from backend)
    const stats = [
        { label: 'Total Learners', value: 0, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
        { label: 'Assessments', value: 0, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-100' },
        { label: 'Needs Review', value: 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'High Friction', value: 0, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-100' },
    ]

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600 mt-1">
                    Monitor learning friction indicators across all learners
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{value}</div>
                                <div className="text-sm text-slate-500">{label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            <div className="card text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Learners Yet</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                    Learner data will appear here once assessments are completed.
                    Data will be fetched from the backend.
                </p>
            </div>
        </div>
    )
}

export default AdminDashboard
