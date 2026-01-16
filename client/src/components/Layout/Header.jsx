import { Link, useLocation } from 'react-router-dom'
import { Activity, LayoutDashboard, ClipboardList } from 'lucide-react'

function Header() {
    const location = useLocation()

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/task', label: 'New Assessment', icon: ClipboardList },
    ]

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-slate-900">ADHARA</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === path
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile menu button */}
                    <div className="sm:hidden">
                        <Link
                            to="/task"
                            className="btn-primary text-sm py-2"
                        >
                            New Assessment
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
