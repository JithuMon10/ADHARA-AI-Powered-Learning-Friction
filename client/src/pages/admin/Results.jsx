import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, FileQuestion } from 'lucide-react'

function AdminResults() {
    const { id } = useParams()

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <Link
                        to="/admin/learners"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Learners
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Assessment Results</h1>
                    <p className="text-slate-600 mt-1">
                        Friction analysis for assessment #{id}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button className="btn-secondary inline-flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="btn-secondary inline-flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>

            {/* Empty State */}
            <div className="card text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileQuestion className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Results Available</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                    Assessment results will be displayed here once the learner completes their assessment.
                    Results data will be fetched from the backend.
                </p>
            </div>
        </div>
    )
}

export default AdminResults
