import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminLearners from './pages/admin/Learners'
import AdminResults from './pages/admin/Results'

// User Pages
import UserDashboard from './pages/user/Dashboard'
import UserTask from './pages/user/Task'
import UserComplete from './pages/user/Complete'

// Landing
import Landing from './pages/Landing'

function App() {
    return (
        <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="learners" element={<AdminLearners />} />
                <Route path="results/:id" element={<AdminResults />} />
            </Route>

            {/* User Routes */}
            <Route path="/user" element={<UserLayout />}>
                <Route index element={<UserDashboard />} />
                <Route path="task/:id" element={<UserTask />} />
                <Route path="complete" element={<UserComplete />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
