import { UserPlus, Search, Filter } from 'lucide-react'

function AdminLearners() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Learners</h1>
                    <p className="text-slate-600 mt-1">
                        Manage and view all registered learners
                    </p>
                </div>
                <button className="btn-primary inline-flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Add Learner
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search learners..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <button className="btn-secondary inline-flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left text-sm font-medium text-slate-600 px-6 py-4">Name</th>
                            <th className="text-left text-sm font-medium text-slate-600 px-6 py-4">Last Activity</th>
                            <th className="text-left text-sm font-medium text-slate-600 px-6 py-4">Friction Level</th>
                            <th className="text-left text-sm font-medium text-slate-600 px-6 py-4">Assessments</th>
                            <th className="text-left text-sm font-medium text-slate-600 px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan="5" className="text-center py-16">
                                <div className="text-slate-500">
                                    <p className="font-medium mb-1">No learners found</p>
                                    <p className="text-sm">Add learners to get started</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminLearners
