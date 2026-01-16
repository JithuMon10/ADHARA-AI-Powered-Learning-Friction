import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './TeacherDashboard.css'

/**
 * Teacher Dashboard - View student sessions and AI analysis
 * Shows friction signals, patterns, and recommendations
 */

const OLLAMA_URL = 'http://localhost:11434'
const MODEL = 'qwen2.5-coder:7b-instruct-q4_K_M'

function TeacherDashboard() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(null)
    const [aiAnalysis, setAiAnalysis] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [ollamaConnected, setOllamaConnected] = useState(false)

    useEffect(() => {
        // Check auth
        if (!localStorage.getItem('adhara_admin')) {
            navigate('/admin-login')
            return
        }

        // Load all sessions
        loadSessions()

        // Check Ollama
        checkOllama()
    }, [navigate])

    const loadSessions = () => {
        // Try to load from multiple sources
        const sessions = []

        // Current session
        const current = localStorage.getItem('adhara_session_complete')
        if (current) {
            try {
                const parsed = JSON.parse(current)
                if (parsed && parsed.completedAt) {
                    sessions.push(parsed)
                }
            } catch (e) {
                console.error('Error parsing current session:', e)
            }
        }

        // History
        const history = localStorage.getItem('adhara_sessions_history')
        if (history) {
            try {
                const parsed = JSON.parse(history)
                if (Array.isArray(parsed)) {
                    // Add history sessions (avoid duplicates by checking completedAt)
                    parsed.forEach(s => {
                        if (s.completedAt && !sessions.find(existing => existing.completedAt === s.completedAt)) {
                            sessions.push(s)
                        }
                    })
                }
            } catch (e) {
                console.error('Error parsing history:', e)
            }
        }

        // Live signals (in progress)
        const live = localStorage.getItem('adhara_live_signals')
        if (live && sessions.length === 0) {
            try {
                const parsed = JSON.parse(live)
                if (parsed && parsed.responses && parsed.responses.length > 0) {
                    parsed.isLive = true
                    sessions.push(parsed)
                }
            } catch (e) {
                console.error('Error parsing live signals:', e)
            }
        }

        // Sort by most recent
        sessions.sort((a, b) => new Date(b.completedAt || b.lastUpdate) - new Date(a.completedAt || a.lastUpdate))

        setSessions(sessions)
        if (sessions.length > 0) {
            setSelectedSession(sessions[0])
        }
    }

    const checkOllama = async () => {
        try {
            const res = await fetch(`${OLLAMA_URL}/api/tags`)
            setOllamaConnected(res.ok)
        } catch {
            setOllamaConnected(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('adhara_admin')
        navigate('/play')
    }

    const handleRefresh = () => {
        loadSessions()
    }

    const analyzeWithAI = async () => {
        if (!selectedSession || !ollamaConnected) return

        setIsAnalyzing(true)
        setAiAnalysis('')

        const child = selectedSession.childData || {}
        const responses = selectedSession.responses || []
        const summary = selectedSession.summary || {}

        // Use summary if available, otherwise calculate
        const totalResponses = summary.totalResponses || responses.length
        const correctResponses = summary.correctResponses || responses.filter(r => r.correct).length
        const avgResponseTime = summary.avgResponseTime || (responses.length > 0
            ? Math.round(responses.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / responses.length)
            : 0)
        const corrections = summary.totalCorrections || selectedSession.corrections || 0
        const mouseMovements = summary.totalMouseMovements || selectedSession.mouseMovements || 0
        const hesitationCount = summary.hesitationCount || (selectedSession.hesitationEvents?.length || 0)

        const prompt = `You are ADHARA, an AI assistant helping educators understand learning friction patterns. Analyze this student's session data and provide insights.

IMPORTANT RULES:
- Do NOT diagnose or name any conditions
- Do NOT use medical/psychological language
- Use ONLY terms like "learning friction", "interaction patterns", "may indicate"
- Be specific about what you observed
- End with actionable suggestions for the teacher

STUDENT SESSION DATA:
- Name: ${child.name || 'Unknown'}
- Age: ${child.age || 'Unknown'} years
- Gender: ${child.gender || 'Unknown'}

ACTIVITY METRICS:
- Total activities completed: ${totalResponses}
- Correct on first try: ${correctResponses}/${totalResponses}
- Re-attempts needed: ${corrections}
- Average response time: ${avgResponseTime}ms
- Total mouse movements tracked: ${mouseMovements}
- Hesitation events detected: ${hesitationCount}
- Session duration: ${Math.round((selectedSession.totalDurationMs || 0) / 1000)} seconds

RESPONSE PATTERNS:
${responses.slice(0, 10).map((r, i) => `${i + 1}. ${r.type}: ${r.correct ? '✓ Correct' : '✗ Incorrect'} (${r.responseTimeMs}ms)`).join('\n')}

Provide:
1. OBSERVATION SUMMARY (2-3 sentences about interaction patterns observed)
2. FRICTION LEVEL: Expected / Elevated / High
3. SPECIFIC PATTERNS NOTICED (bullet points, be specific)
4. TEACHER RECOMMENDATIONS (actionable next steps)

Remember: Use cautious language like "may indicate" or "appears to show". Always recommend human review.`

        try {
            const res = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    prompt,
                    stream: false,
                    options: { temperature: 0.3, num_predict: 500 }
                })
            })

            if (res.ok) {
                const data = await res.json()
                setAiAnalysis(data.response || 'No analysis generated')
            } else {
                setAiAnalysis('Error: Could not generate analysis. Make sure Ollama is running with the Qwen model.')
            }
        } catch (err) {
            setAiAnalysis(`Error: ${err.message}. Make sure Ollama is running on localhost:11434`)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getFrictionIndicator = () => {
        if (!selectedSession) return { level: 'Unknown', color: '#888' }

        const summary = selectedSession.summary || {}
        const corrections = summary.totalCorrections || selectedSession.corrections || 0
        const responses = summary.totalResponses || (selectedSession.responses?.length || 1)
        const ratio = corrections / responses

        if (ratio > 0.5) return { level: 'High', color: '#e53935' }
        if (ratio > 0.2) return { level: 'Elevated', color: '#fb8c00' }
        return { level: 'Expected', color: '#43a047' }
    }

    const friction = getFrictionIndicator()

    return (
        <div className="teacher-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>👩‍🏫 Teacher Dashboard</h1>
                    <span className={`connection-status ${ollamaConnected ? 'connected' : 'disconnected'}`}>
                        {ollamaConnected ? '● AI Connected' : '○ AI Offline'}
                    </span>
                </div>
                <div className="header-actions">
                    <button onClick={handleRefresh} className="refresh-button">
                        🔄 Refresh
                    </button>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Session List */}
                {sessions.length > 1 && (
                    <div className="sessions-list">
                        <h3>Sessions ({sessions.length})</h3>
                        {sessions.map((s, i) => (
                            <button
                                key={i}
                                className={`session-item ${selectedSession === s ? 'active' : ''}`}
                                onClick={() => setSelectedSession(s)}
                            >
                                <span className="session-name">{s.childData?.name || 'Unknown'}</span>
                                <span className="session-time">
                                    {s.isLive ? '🔴 Live' : new Date(s.completedAt).toLocaleTimeString()}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Session Summary */}
                {selectedSession ? (
                    <>
                        <div className="session-card">
                            <h2>Session Analysis {selectedSession.isLive && '🔴 (In Progress)'}</h2>
                            <div className="session-info">
                                <div className="info-item">
                                    <span className="label">Student</span>
                                    <span className="value">{selectedSession.childData?.name || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Age</span>
                                    <span className="value">{selectedSession.childData?.age || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Duration</span>
                                    <span className="value">
                                        {Math.round((selectedSession.totalDurationMs || 0) / 1000)}s
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Friction Level</span>
                                    <span className="value friction-badge" style={{ background: friction.color }}>
                                        {friction.level}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Metrics */}
                        <div className="metrics-card">
                            <h3>📊 Tracked Signals</h3>
                            <div className="metrics-grid">
                                <div className="metric">
                                    <span className="metric-value">
                                        {selectedSession.summary?.totalMouseMovements || selectedSession.mouseMovements || 0}
                                    </span>
                                    <span className="metric-label">Mouse Movements</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">
                                        {selectedSession.summary?.hesitationCount || selectedSession.hesitationEvents?.length || 0}
                                    </span>
                                    <span className="metric-label">Hesitations</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">
                                        {selectedSession.summary?.totalCorrections || selectedSession.corrections || 0}
                                    </span>
                                    <span className="metric-label">Corrections</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">
                                        {selectedSession.summary?.avgResponseTime || 0}ms
                                    </span>
                                    <span className="metric-label">Avg Response</span>
                                </div>
                            </div>
                        </div>

                        {/* Activity Details */}
                        <div className="activities-card">
                            <h3>Activity Responses</h3>
                            <div className="activity-list">
                                {selectedSession.responses?.map((r, i) => (
                                    <div key={i} className={`activity-item ${r.correct ? 'correct' : 'incorrect'}`}>
                                        <span className="activity-type">{r.type}</span>
                                        <span className="activity-result">
                                            {r.correct ? '✓' : '✗'}
                                        </span>
                                        <span className="activity-time">{r.responseTimeMs}ms</span>
                                    </div>
                                ))}
                                {(!selectedSession.responses || selectedSession.responses.length === 0) && (
                                    <p className="no-data">No response data available</p>
                                )}
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="ai-card">
                            <div className="ai-header">
                                <h3>🤖 AI Analysis</h3>
                                <button
                                    onClick={analyzeWithAI}
                                    disabled={isAnalyzing || !ollamaConnected}
                                    className="analyze-button"
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                                </button>
                            </div>
                            <div className="ai-content">
                                {aiAnalysis ? (
                                    <pre className="ai-output">{aiAnalysis}</pre>
                                ) : (
                                    <p className="ai-placeholder">
                                        {ollamaConnected
                                            ? 'Click "Generate Analysis" to get AI insights on this session.'
                                            : 'Start Ollama with: OLLAMA_ORIGINS="*" ollama serve'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-sessions">
                        <h3>📋 No Sessions Found</h3>
                        <p>Sessions will appear here after students complete activities.</p>
                        <ol className="instructions">
                            <li>Go to <a href="/play" target="_blank">/play</a> in a new tab</li>
                            <li>Enter a name, age, and gender</li>
                            <li>Complete all 5 activities</li>
                            <li>Click "Refresh" above to see the session</li>
                        </ol>
                        <button onClick={handleRefresh} className="big-refresh-button">
                            🔄 Refresh Sessions
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TeacherDashboard
