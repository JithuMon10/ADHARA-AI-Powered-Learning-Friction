import { Link } from 'react-router-dom'
import { BookOpen, Pencil, Hash, Play } from 'lucide-react'

/**
 * User Dashboard - Simple task selector
 * Student sees only task options, no analysis data
 */
function UserDashboard() {
    const tasks = [
        {
            id: 'reading',
            path: '/user/reading-task',
            title: 'Reading Activity',
            description: 'Read a short passage and answer questions',
            icon: BookOpen,
            color: 'primary',
            time: '3-5 min'
        },
        {
            id: 'writing',
            path: '/user/writing-task',
            title: 'Writing Activity',
            description: 'Copy a word and draw a simple shape',
            icon: Pencil,
            color: 'amber',
            time: '2-3 min'
        },
        {
            id: 'number',
            path: '/user/number-task',
            title: 'Number Activity',
            description: 'Count dots and answer simple math questions',
            icon: Hash,
            color: 'emerald',
            time: '2-3 min'
        }
    ]

    const getColorClasses = (color) => ({
        primary: { bg: 'bg-primary-100', icon: 'text-primary-600', hover: 'hover:border-primary-300 hover:bg-primary-50' },
        amber: { bg: 'bg-amber-100', icon: 'text-amber-600', hover: 'hover:border-amber-300 hover:bg-amber-50' },
        emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', hover: 'hover:border-emerald-300 hover:bg-emerald-50' }
    })[color]

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Welcome */}
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h1>
                <p className="text-slate-600">
                    Choose an activity to get started.
                </p>
            </div>

            {/* Tasks */}
            <div className="space-y-4">
                {tasks.map(task => {
                    const colors = getColorClasses(task.color)
                    const Icon = task.icon
                    return (
                        <Link
                            key={task.id}
                            to={task.path}
                            className={`block p-5 rounded-xl border-2 border-slate-200 ${colors.hover} transition-all group`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-7 h-7 ${colors.icon}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900">{task.title}</h3>
                                        <p className="text-sm text-slate-500">{task.description}</p>
                                        <span className="text-xs text-slate-400 mt-1 inline-block">
                                            ⏱ {task.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                                    <Play className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Info Box */}
            <div className="mt-10 p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-500">
                    These activities help us understand how you learn best.
                </p>
            </div>
        </div>
    )
}

export default UserDashboard

