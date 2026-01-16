import { Link } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'

function UserDashboard() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome */}
            <div className="text-center mb-12">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome, Learner</h1>
                <p className="text-slate-600">
                    Complete your assigned learning tasks below
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card text-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">0</div>
                    <div className="text-sm text-slate-500">Pending</div>
                </div>
                <div className="card text-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">0</div>
                    <div className="text-sm text-slate-500">In Progress</div>
                </div>
                <div className="card text-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">0</div>
                    <div className="text-sm text-slate-500">Completed</div>
                </div>
            </div>

            {/* Tasks List - Empty State */}
            <div className="card">
                <h2 className="font-semibold text-slate-900 mb-4">Assigned Tasks</h2>

                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Tasks Assigned</h3>
                    <p className="text-slate-600 text-sm max-w-sm mx-auto">
                        You don't have any learning tasks assigned yet.
                        Tasks will appear here when assigned by an administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default UserDashboard
