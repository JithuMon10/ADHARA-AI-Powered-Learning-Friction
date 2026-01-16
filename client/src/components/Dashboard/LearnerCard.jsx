import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight } from 'lucide-react'

function LearnerCard({ learner }) {
    const navigate = useNavigate()

    const frictionColors = {
        low: 'friction-low',
        medium: 'friction-medium',
        high: 'friction-high'
    }

    const frictionLabels = {
        low: 'Low Friction',
        medium: 'Medium Friction',
        high: 'High Friction'
    }

    const handleClick = () => {
        navigate(`/results/${learner.id}`)
    }

    return (
        <div
            onClick={handleClick}
            className="card card-hover cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {learner.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{learner.lastActivity}</span>
                    </div>
                </div>
                <span className={`friction-badge ${frictionColors[learner.frictionLevel]}`}>
                    {frictionLabels[learner.frictionLevel]}
                </span>
            </div>

            {/* Progress indicator */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Task Progress</span>
                    <span>{learner.completedTasks}/{learner.totalTasks}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${(learner.completedTasks / learner.totalTasks) * 100}%` }}
                    />
                </div>
            </div>

            {/* Friction scores preview */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-500 text-xs">Reading</div>
                    <div className="font-medium text-slate-700">{learner.scores.reading}%</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-500 text-xs">Attention</div>
                    <div className="font-medium text-slate-700">{learner.scores.attention}%</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-500 text-xs">Memory</div>
                    <div className="font-medium text-slate-700">{learner.scores.memory}%</div>
                </div>
            </div>

            {/* View details link */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end text-sm text-primary-600 font-medium">
                View Details
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    )
}

export default LearnerCard
