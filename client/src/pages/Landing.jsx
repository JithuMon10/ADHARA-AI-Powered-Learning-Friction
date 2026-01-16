import { Link } from 'react-router-dom'
import { Activity, Shield, User } from 'lucide-react'

function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-slate-900">ADHARA</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">
                            Learning Friction Detection
                        </h1>
                        <p className="text-lg text-slate-600 max-w-xl mx-auto">
                            AI-assisted early warning system to identify learning friction
                            during normal learning activities.
                        </p>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Admin Card */}
                        <Link
                            to="/admin"
                            className="card card-hover group text-center p-8"
                        >
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                                <Shield className="w-8 h-8 text-primary-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                Admin Portal
                            </h2>
                            <p className="text-slate-600 text-sm">
                                View learner progress, analyze friction reports, and manage assessments.
                            </p>
                        </Link>

                        {/* User Card */}
                        <Link
                            to="/user"
                            className="card card-hover group text-center p-8"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                                <User className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                Learner Portal
                            </h2>
                            <p className="text-slate-600 text-sm">
                                Take learning assessments and complete assigned tasks.
                            </p>
                        </Link>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-center text-xs text-slate-400 mt-8">
                        This is a demonstration prototype using synthetic data only.
                        Not intended for clinical or diagnostic use.
                    </p>
                </div>
            </main>
        </div>
    )
}

export default Landing
