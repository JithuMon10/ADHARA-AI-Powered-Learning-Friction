import { Outlet, Link } from 'react-router-dom'
import { Activity } from 'lucide-react'

function UserLayout() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/user" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-slate-900">ADHARA</span>
                        </Link>

                        <Link
                            to="/"
                            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Exit
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-4">
                <div className="max-w-4xl mx-auto px-4 text-center text-xs text-slate-400">
                    ADHARA Learning Friction Detection System
                </div>
            </footer>
        </div>
    )
}

export default UserLayout
