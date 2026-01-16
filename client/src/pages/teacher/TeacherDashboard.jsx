import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import './TeacherDashboard.css'

/**
 * Teacher Dashboard - Enhanced with auto-analysis and early signs detection
 */

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:7b'

function TeacherDashboard() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(null)
    const [aiAnalysis, setAiAnalysis] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [ollamaConnected, setOllamaConnected] = useState(false)
    const [autoAnalyze, setAutoAnalyze] = useState(true)

    useEffect(() => {
        if (!localStorage.getItem('adhara_admin')) {
            navigate('/admin-login')
            return
        }
        loadSessions()
        checkOllama()
    }, [navigate])

    // Auto-analyze when session is selected
    useEffect(() => {
        if (selectedSession && autoAnalyze && ollamaConnected && !aiAnalysis) {
            analyzeWithAI()
        }
    }, [selectedSession, autoAnalyze, ollamaConnected])

    const loadSessions = () => {
        const sessions = []

        const current = localStorage.getItem('adhara_session_complete')
        if (current) {
            try {
                const parsed = JSON.parse(current)
                if (parsed?.completedAt) sessions.push(parsed)
            } catch (e) { }
        }

        const history = localStorage.getItem('adhara_sessions_history')
        if (history) {
            try {
                const parsed = JSON.parse(history)
                if (Array.isArray(parsed)) {
                    parsed.forEach(s => {
                        if (s.completedAt && !sessions.find(ex => ex.completedAt === s.completedAt)) {
                            sessions.push(s)
                        }
                    })
                }
            } catch (e) { }
        }

        sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        setSessions(sessions)
        if (sessions.length > 0) setSelectedSession(sessions[0])
    }

    const checkOllama = async () => {
        try {
            const res = await fetch(`${OLLAMA_URL}/api/tags`)
            setOllamaConnected(res.ok)
        } catch { setOllamaConnected(false) }
    }

    const handleSelectSession = (session) => {
        setSelectedSession(session)
        setAiAnalysis('') // Reset for new analysis
    }

    const analyzeWithAI = async () => {
        if (!selectedSession || !ollamaConnected) return

        setIsAnalyzing(true)
        setAiAnalysis('')

        const child = selectedSession.childData || {}
        const responses = selectedSession.responses || []
        const summary = selectedSession.summary || {}
        const stressIndicators = selectedSession.stressIndicators || []
        const hesitations = selectedSession.hesitationEvents || []
        const faceData = selectedSession.faceData || []
        const voiceData = selectedSession.voiceData || []

        const totalResponses = summary.totalResponses || responses.length
        const correctResponses = summary.correctResponses || responses.filter(r => r.correct).length
        const avgResponseTime = summary.avgResponseTime || 0
        const corrections = summary.totalCorrections || 0
        const mouseMovements = summary.totalMouseMovements || 0
        const hesitationCount = summary.hesitationCount || hesitations.length
        const stressCount = summary.stressIndicatorCount || stressIndicators.length

        const prompt = `You are ADHARA, an AI assistant analyzing learning friction patterns for educators. This analysis is CONFIDENTIAL for teachers only.

ANALYZE THIS SESSION AND PROVIDE EARLY DETECTION INSIGHTS:

STUDENT PROFILE:
- Name: ${child.name || 'Unknown'}
- Age: ${child.age || 'Unknown'} years
- Gender: ${child.gender || 'Unknown'}

SESSION METRICS:
- Total activities: ${totalResponses}
- Correct on first try: ${correctResponses}/${totalResponses}
- Re-attempts needed: ${corrections}
- Average response time: ${avgResponseTime}ms
- Mouse movements tracked: ${mouseMovements}
- Hesitation events: ${hesitationCount}
- Stress indicators detected: ${stressCount}
- Face tracking data points: ${faceData.length}
- Voice recordings: ${voiceData.length}

RESPONSE DETAILS:
${responses.slice(0, 15).map((r, i) => `${i + 1}. ${r.type}: ${r.correct !== undefined ? (r.correct ? '✓' : '✗') : 'verbal'} (${r.responseTimeMs || 'N/A'}ms)`).join('\n')}

STRESS INDICATORS DETECTED:
${stressIndicators.map(s => `- ${s.type} at activity ${s.activity}`).join('\n') || 'None detected'}

PROVIDE YOUR ANALYSIS WITH THESE SECTIONS:

1. **OBSERVATION SUMMARY** (2-3 sentences about overall interaction patterns)

2. **FRICTION LEVEL**: Expected / Elevated / High

3. **EARLY SIGNS DETECTED** (use cautious language like "patterns may indicate"):
   - Look for signs that MAY suggest: visual processing differences, attention variance, fine motor development, reading/letter recognition patterns
   - If letter reversal (b/d/p/q): may indicate early visual processing patterns common in developing readers
   - If slow response + many corrections: may indicate processing speed variance
   - If rapid mouse + stress indicators: may indicate frustration or anxiety patterns
   - If hesitations before answers: may indicate uncertainty or attention fluctuation

4. **POTENTIAL EARLY INDICATORS** (optional - only if significant patterns):
   - Use format: "Pattern may warrant further observation for [area]"
   - Areas: Reading Development, Attention Patterns, Visual Processing, Motor Skills, Anxiety/Stress Response
   - Do NOT diagnose - only suggest areas for additional professional assessment

5. **RECOMMENDATIONS FOR TEACHER**:
   - Specific actionable steps
   - Suggest professional assessment if patterns are significant

Remember: This is for early detection only. Always recommend professional evaluation for any concerns. Use phrases like "may indicate", "warrants observation", "consider assessing".`

        try {
            const res = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    prompt,
                    stream: false,
                    options: { temperature: 0.3, num_predict: 700 }
                })
            })

            if (res.ok) {
                const data = await res.json()
                setAiAnalysis(data.response || 'No analysis generated')
            } else {
                setAiAnalysis('Error: Could not generate analysis.')
            }
        } catch (err) {
            setAiAnalysis(`Error: ${err.message}`)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getStressLevel = () => {
        if (!selectedSession) return { level: 'Unknown', color: '#888', icon: '❓' }

        const stressCount = selectedSession.stressIndicators?.length || 0
        const hesitations = selectedSession.hesitationEvents?.length || 0
        const corrections = selectedSession.corrections || 0

        const score = stressCount * 2 + hesitations + corrections

        if (score > 10) return { level: 'High Stress Detected', color: '#e53935', icon: '🔴' }
        if (score > 5) return { level: 'Elevated Concern', color: '#fb8c00', icon: '🟠' }
        if (score > 2) return { level: 'Mild Patterns', color: '#fdd835', icon: '🟡' }
        return { level: 'Normal Range', color: '#43a047', icon: '🟢' }
    }

    const getFrictionLevel = () => {
        if (!selectedSession) return { level: 'Unknown', color: '#888' }
        const corrections = selectedSession.corrections || 0
        const responses = selectedSession.responses?.length || 1
        const ratio = corrections / responses
        if (ratio > 0.5) return { level: 'High', color: '#e53935' }
        if (ratio > 0.2) return { level: 'Elevated', color: '#fb8c00' }
        return { level: 'Expected', color: '#43a047' }
    }

    const stress = getStressLevel()
    const friction = getFrictionLevel()

    return (
        <div className="teacher-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>👩‍🏫 Teacher Dashboard</h1>
                    <span className={`connection-status ${ollamaConnected ? 'connected' : 'disconnected'}`}>
                        {ollamaConnected ? '● AI Connected' : '○ AI Offline'}
                    </span>
                </div>
                <div className="header-actions">
                    <label className="auto-toggle">
                        <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} />
                        Auto-Analyze
                    </label>
                    <button onClick={loadSessions} className="refresh-button">🔄 Refresh</button>
                    <button onClick={() => { localStorage.removeItem('adhara_admin'); navigate('/play') }} className="logout-button">Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Session List */}
                {sessions.length > 0 && (
                    <div className="sessions-list">
                        <h3>📋 Sessions ({sessions.length})</h3>
                        {sessions.map((s, i) => (
                            <button
                                key={i}
                                className={`session-item ${selectedSession === s ? 'active' : ''}`}
                                onClick={() => handleSelectSession(s)}
                            >
                                <span className="session-name">{s.childData?.name || 'Unknown'}</span>
                                <span className="session-meta">
                                    Age {s.childData?.age} | {new Date(s.completedAt).toLocaleTimeString()}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {selectedSession ? (
                    <>
                        {/* Session Overview */}
                        <div className="session-card">
                            <h2>📊 Session Analysis</h2>
                            <div className="session-info">
                                <div className="info-item">
                                    <span className="label">Student</span>
                                    <span className="value">{selectedSession.childData?.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Age</span>
                                    <span className="value">{selectedSession.childData?.age}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Duration</span>
                                    <span className="value">{Math.round((selectedSession.totalDurationMs || 0) / 1000)}s</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Friction</span>
                                    <span className="value friction-badge" style={{ background: friction.color }}>{friction.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stress Alert */}
                        {stress.level !== 'Normal Range' && (
                            <div className="stress-alert" style={{ borderColor: stress.color }}>
                                <span className="stress-icon">{stress.icon}</span>
                                <div>
                                    <strong>{stress.level}</strong>
                                    <p>This session shows patterns that may warrant additional attention.</p>
                                </div>
                            </div>
                        )}

                        {/* Metrics Grid */}
                        <div className="metrics-card">
                            <h3>📈 Tracked Signals</h3>
                            <div className="metrics-grid">
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.totalMouseMovements || selectedSession.mouseMovements || 0}</span>
                                    <span className="metric-label">Mouse Moves</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.hesitationCount || selectedSession.hesitationEvents?.length || 0}</span>
                                    <span className="metric-label">Hesitations</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.totalCorrections || selectedSession.corrections || 0}</span>
                                    <span className="metric-label">Corrections</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.stressIndicatorCount || selectedSession.stressIndicators?.length || 0}</span>
                                    <span className="metric-label">Stress Signs</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.faceDataPoints || selectedSession.faceData?.length || 0}</span>
                                    <span className="metric-label">Face Samples</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-value">{selectedSession.summary?.voiceDataPoints || selectedSession.voiceData?.length || 0}</span>
                                    <span className="metric-label">Voice Samples</span>
                                </div>
                            </div>
                        </div>

                        {/* Activity Responses */}
                        <div className="activities-card">
                            <h3>📝 Activity Responses</h3>
                            <div className="activity-list">
                                {selectedSession.responses?.map((r, i) => (
                                    <div key={i} className={`activity-item ${r.correct === true ? 'correct' : r.correct === false ? 'incorrect' : 'verbal'}`}>
                                        <span className="activity-type">{r.type}</span>
                                        <span className="activity-result">
                                            {r.correct === true ? '✓' : r.correct === false ? '✗' : '🎤'}
                                        </span>
                                        <span className="activity-time">{r.responseTimeMs ? `${r.responseTimeMs}ms` : 'verbal'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="ai-card">
                            <div className="ai-header">
                                <h3>🤖 AI Early Detection Analysis</h3>
                                <button onClick={analyzeWithAI} disabled={isAnalyzing || !ollamaConnected} className="analyze-button">
                                    {isAnalyzing ? 'Analyzing...' : '🔄 Re-Analyze'}
                                </button>
                            </div>
                            <div className="ai-content">
<<<<<<< HEAD
                                {isAnalyzing ? (
                                    <div className="loading-analysis">
                                        <span className="spinner">⏳</span> Analyzing patterns...
                                    </div>
                                ) : aiAnalysis ? (
                                    <pre className="ai-output">{aiAnalysis}</pre>
=======
                                {aiAnalysis ? (
                                    <div className="ai-output">
                                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                    </div>
>>>>>>> 0675d2fc9052ec3cb636be7d8c3766a8ff7eb8db
                                ) : (
                                    <p className="ai-placeholder">
                                        {ollamaConnected ? 'Analysis will appear automatically...' : 'Start Ollama: OLLAMA_ORIGINS="*" ollama serve'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-sessions">
                        <h3>📋 No Sessions Found</h3>
                        <p>Have students complete activities at <a href="/play">/play</a></p>
                        <button onClick={loadSessions} className="big-refresh-button">🔄 Refresh</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TeacherDashboard
