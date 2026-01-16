import { Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, LayoutDashboard, Users, LogOut } from 'lucide-react'

function AdminLayout() {
    const location = useLocation()

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/learners', label: 'Learners', icon: Users },
    ]

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path
        return location.pathname.startsWith(path)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-semibold text-slate-900">ADHARA</span>
                        <span className="text-xs text-slate-500 block -mt-1">Admin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map(({ path, label, icon: Icon, exact }) => (
                            <li key={path}>
                                <Link
                                    to={path}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(path, exact)
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Exit Admin
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
