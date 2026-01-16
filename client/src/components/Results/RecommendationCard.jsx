import { UserCheck, MessageSquare, FileText } from 'lucide-react'

function RecommendationCard({ frictionLevel, explanation }) {
    return (
        <div className="space-y-4">
            {/* Explanation Card */}
            <div className="card">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Analysis Summary</h3>
                        <p className="text-slate-600 mb-3">{explanation.summary}</p>
                        <p className="text-sm text-slate-500">{explanation.details}</p>
                    </div>
                </div>
            </div>

            {/* Recommendation Card */}
            <div className={`card ${frictionLevel === 'high'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${frictionLevel === 'high' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                        <UserCheck className={`w-5 h-5 ${frictionLevel === 'high' ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                    </div>
                    <div>
                        <h3 className={`font-semibold mb-1 ${frictionLevel === 'high' ? 'text-amber-900' : 'text-blue-900'
                            }`}>
                            Recommendation
                        </h3>
                        <p className={
                            frictionLevel === 'high' ? 'text-amber-700' : 'text-blue-700'
                        }>
                            {explanation.recommendation}
                        </p>
                    </div>
                </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                    This analysis is based on behavioral indicators only.
                    Final assessment should be made by qualified educators.
                </p>
            </div>
        </div>
    )
}

export default RecommendationCard
