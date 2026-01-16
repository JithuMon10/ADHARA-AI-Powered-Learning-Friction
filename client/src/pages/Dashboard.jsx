import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import LearnerCard from '../components/Dashboard/LearnerCard'
import FrictionSummary from '../components/Dashboard/FrictionSummary'
import { learners } from '../data/mockData'

function Dashboard() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-600 mt-1">
                        Monitor learning friction indicators across all learners
                    </p>
                </div>
                <Link to="/task" className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Start New Assessment
                </Link>
            </div>

            {/* Summary Cards */}
            <FrictionSummary learners={learners} />

            {/* Learner Grid */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Learners</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {learners.map(learner => (
                        <LearnerCard key={learner.id} learner={learner} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
