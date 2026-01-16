import { Routes, Route, Navigate } from 'react-router-dom'

// Child Pages (CocomeloN-style)
import ChildLanding from './pages/child/ChildLanding'
import ChildRegister from './pages/child/ChildRegister'
import ChildActivity from './pages/child/ChildActivity'
import ChildComplete from './pages/child/ChildComplete'

// Admin
import AdminLogin from './pages/admin/AdminLogin'

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard'

// Legacy (keep for now)
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLearners from './pages/admin/Learners'
import AdminResults from './pages/admin/Results'
import UserDashboard from './pages/user/Dashboard'
import UserTask from './pages/user/Task'
import UserComplete from './pages/user/Complete'
import ReadingTask from './pages/user/ReadingTask'
import WritingTask from './pages/user/WritingTask'
import NumberTask from './pages/user/NumberTask'
import Landing from './pages/Landing'

function App() {
    return (
        <Routes>
            {/* NEW: Child-Friendly Flow (CocomeloN-style) */}
            <Route path="/play" element={<ChildLanding />} />
            <Route path="/play/register" element={<ChildRegister />} />
            <Route path="/play/activity" element={<ChildActivity />} />
            <Route path="/play/complete" element={<ChildComplete />} />

            {/* NEW: Admin Login & Teacher Dashboard */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/teacher" element={<TeacherDashboard />} />

            {/* Legacy Landing redirects to new child landing */}
            <Route path="/" element={<Navigate to="/play" replace />} />

            {/* Legacy Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="learners" element={<AdminLearners />} />
                <Route path="results/:id" element={<AdminResults />} />
            </Route>

            {/* Legacy User Routes */}
            <Route path="/user" element={<UserLayout />}>
                <Route index element={<UserDashboard />} />
                <Route path="task/:id" element={<UserTask />} />
                <Route path="reading-task" element={<ReadingTask />} />
                <Route path="writing-task" element={<WritingTask />} />
                <Route path="number-task" element={<NumberTask />} />
                <Route path="complete" element={<UserComplete />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/play" replace />} />
        </Routes>
    )
}

export default App


