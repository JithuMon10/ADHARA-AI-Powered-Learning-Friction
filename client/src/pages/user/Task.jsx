import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'

function UserTask() {
    const { id } = useParams()

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/user"
                    className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Learning Task</h1>
                <p className="text-slate-600 mt-1">Task #{id}</p>
            </div>

            {/* Empty State */}
            <div className="card text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileQuestion className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Task Not Found</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                    This task could not be loaded. It may not exist or has not been assigned to you.
                </p>
                <Link to="/user" className="btn-primary">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    )
}

export default UserTask
