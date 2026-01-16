import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

/**
 * Simple Admin Login
 * Username: teacher
 * Password: 123
 */
function AdminLogin() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = (e) => {
        e.preventDefault()

        if (username === 'teacher' && password === '123') {
            localStorage.setItem('adhara_admin', 'true')
            navigate('/teacher')
        } else {
            setError('Invalid credentials. Try teacher / 123')
        }
    }

    return (
        <div className="admin-login">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-icon">👩‍🏫</span>
                    <h1>Teacher Login</h1>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                <button
                    className="back-link"
                    onClick={() => navigate('/play')}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    )
}

export default AdminLogin
