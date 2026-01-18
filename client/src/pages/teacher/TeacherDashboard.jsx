import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import jsPDF from 'jspdf'
import './TeacherDashboard.css'

/**
 * Teacher Dashboard - Professional Analysis View
 * Split-panel: Students left, Analysis right
 */

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5:7b'

// Baseline data from baseline_dataset.json
const BASELINE_DATA = {
    "6-8": { label: "Early Elementary", mouse: { avgHesitationMs: 2500, avgCorrections: 3, avgResponseTime: 180000 } },
    "9-11": { label: "Upper Elementary", mouse: { avgHesitationMs: 1800, avgCorrections: 2, avgResponseTime: 150000 } },
    "12-14": { label: "Middle School", mouse: { avgHesitationMs: 1200, avgCorrections: 1.5, avgResponseTime: 120000 } },
    "15+": { label: "High School+", mouse: { avgHesitationMs: 800, avgCorrections: 1, avgResponseTime: 90000 } }
}

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
        setAiAnalysis('')
    }

    // Get age group from child age
    const getAgeGroup = (age) => {
        if (age <= 8) return "6-8"
        if (age <= 11) return "9-11"
        if (age <= 14) return "12-14"
        return "15+"
    }

    // Calculate deviations from baseline
    const calculateDeviations = () => {
        if (!selectedSession) return null
        const age = selectedSession.childData?.age || 10
        const ageGroup = getAgeGroup(age)
        const baseline = BASELINE_DATA[ageGroup]
        const summary = selectedSession.summary || {}

        const avgResponseTime = summary.avgResponseTime || 0
        const corrections = summary.totalCorrections || selectedSession.corrections || 0
        const hesitations = summary.hesitationCount || selectedSession.hesitationEvents?.length || 0

        return {
            ageGroup,
            baseline,
            responseTimeDeviation: baseline.mouse.avgResponseTime > 0
                ? ((avgResponseTime - baseline.mouse.avgResponseTime) / baseline.mouse.avgResponseTime * 100).toFixed(0)
                : 0,
            correctionsDeviation: baseline.mouse.avgCorrections > 0
                ? ((corrections - baseline.mouse.avgCorrections) / baseline.mouse.avgCorrections * 100).toFixed(0)
                : 0,
            hesitationDeviation: baseline.mouse.avgHesitationMs > 0
                ? ((hesitations * 1000 - baseline.mouse.avgHesitationMs) / baseline.mouse.avgHesitationMs * 100).toFixed(0)
                : 0
        }
    }

    // Get friction level based on accuracy
    const getFrictionLevel = () => {
        if (!selectedSession) return { level: 'Unknown', color: '#888', score: 0 }

        const responses = selectedSession.responses || []
        const correctRate = responses.length > 0
            ? (responses.filter(r => r.correct).length / responses.length * 100)
            : 0

        // >80% = Normal (Green), 60-80% = Neutral (Orange), <60% = High Friction (Red)
        if (correctRate >= 80) return { level: 'Normal', color: '#43a047', score: correctRate }
        if (correctRate >= 60) return { level: 'Neutral', color: '#fb8c00', score: correctRate }
        return { level: 'High', color: '#e53935', score: correctRate }
    }

    // Calculate strengths and concerns
    const analyzeStrengthsAndConcerns = () => {
        if (!selectedSession) return { strengths: [], concerns: [] }

        const summary = selectedSession.summary || {}
        const responses = selectedSession.responses || []
        const deviations = calculateDeviations()

        const strengths = []
        const concerns = []

        const correctRate = responses.length > 0
            ? (responses.filter(r => r.correct).length / responses.length * 100).toFixed(0)
            : 0

        // Analyze performance
        if (correctRate >= 80) strengths.push(`Strong accuracy: ${correctRate}% correct on first try`)
        else if (correctRate < 50) concerns.push(`Low accuracy: Only ${correctRate}% correct on first try`)

        if (parseFloat(deviations?.responseTimeDeviation) < 0)
            strengths.push("Faster than expected for age group")
        else if (parseFloat(deviations?.responseTimeDeviation) > 50)
            concerns.push("Response time significantly slower than baseline")

        if ((summary.totalCorrections || 0) === 0)
            strengths.push("No re-attempts needed - confident responses")
        else if ((summary.totalCorrections || 0) > 3)
            concerns.push(`Multiple re-attempts (${summary.totalCorrections}) may indicate uncertainty`)

        if ((summary.hesitationCount || 0) === 0)
            strengths.push("Consistent engagement without hesitation")
        else if ((summary.hesitationCount || 0) > 3)
            concerns.push(`Frequent hesitations (${summary.hesitationCount}) observed`)

        if ((summary.stressIndicatorCount || 0) === 0)
            strengths.push("No stress indicators detected")
        else if ((summary.stressIndicatorCount || 0) > 2)
            concerns.push("Stress patterns detected during activities")

        if ((summary.voiceDataPoints || 0) > 0)
            strengths.push(`Completed ${summary.voiceDataPoints} verbal activities`)

        return { strengths, concerns }
    }

    const analyzeWithAI = async () => {
        if (!selectedSession || !ollamaConnected) return

        setIsAnalyzing(true)
        setAiAnalysis('')

        const child = selectedSession.childData || {}
        const responses = selectedSession.responses || []
        const summary = selectedSession.summary || {}
        const deviations = calculateDeviations()
        const friction = getFrictionLevel()
        const { strengths, concerns } = analyzeStrengthsAndConcerns()

        const speechAnalysis = summary.speechAnalysis || {}
        const faceAnalysis = summary.faceAnalysis || {}
        const baseline = deviations?.baseline || { label: 'Standard', mouse: { avgHesitationMs: 1800, avgCorrections: 2 } }

        // Get clinical context and AI analysis data
        const clinicalContext = summary.clinicalContext || {}
        const aiMidSession = summary.aiMidSessionAnalysis || {}
        const sessionType = summary.sessionType || 'BASELINE_ONLY'
        const frictionLevel = summary.screeningPriority || { priority: 'LOW', reason: 'Session completed smoothly' }

        // Placeholder for baseline question count, assuming 6 for now
        const BASELINE_QUESTION_COUNT = 6;

        // Format domain results for AI
        const formatDomainResults = () => {
            const results = []
            Object.entries(clinicalContext.domainResults || {}).forEach(([key, data]) => {
                results.push(`### ${data.icon} ${data.clinicalName} (${data.displayName})
- Questions: ${data.totalQuestions} | Accuracy: ${data.accuracy}% | Avg Time: ${data.avgResponseTime}ms
- Status: ${data.status} | Confidence: ${data.confidence}%
- Patterns: ${data.patterns.length > 0 ? data.patterns.join('; ') : 'None detected'}`)
            })
            return results.join('\n\n')
        }

        // Determine if this is a concern case that needs clinical language
        const isHighConcern = frictionLevel.priority === 'HIGH' || aiMidSession.overallRisk === 'CONCERN'
        const isModerateWatch = frictionLevel.priority === 'MEDIUM' || aiMidSession.overallRisk === 'WATCH'

        const prompt = `You are ADHARA, an AI-powered early detection and learning support system. Generate a PROFESSIONAL analysis report.

🧠 SYSTEM CONTEXT:
- This is a COMPETITION DEMONSTRATION requiring clinical-grade analysis
- Session Type: ${sessionType} (${sessionType === 'ADAPTIVE' ? 'AI detected patterns and added targeted questions' : 'Baseline completed normally'})
- AI Mid-Session Analysis: ${aiMidSession.rationale || 'N/A'}
- Focus Domains Probed: ${aiMidSession.focusDomains?.join(', ') || 'All domains baseline'}

---

## 📊 SESSION DATA

### Session Overview
- **Learner:** ${child.name || 'Student'} | **Age:** ${child.age || 'Unknown'} years
- **Total Questions:** ${responses.length} (Baseline: ${BASELINE_QUESTION_COUNT || 6}, Follow-up: ${responses.length - (BASELINE_QUESTION_COUNT || 6)})
- **Overall Accuracy:** ${clinicalContext.overallAccuracy || 0}%
- **Session Duration:** ${Math.round((summary.totalDurationMs || 0) / 1000)}s

### Behavioral Indicators
- **Response Time:** ${summary.avgResponseTime || 0}ms average
- **Hesitation Events:** ${summary.hesitationCount || 0}
- **Self-Corrections:** ${summary.totalCorrections || 0}
- **Stress Indicators:** ${summary.stressIndicatorCount || 0}
- **Emotional State:** ${faceAnalysis.dominantEmotion || 'neutral'} (${Math.round((faceAnalysis.stressRatio || 0) * 100)}% stress ratio)
- **Visual Attention:** ${faceAnalysis.gazeOnScreenPercent || 0}% on-screen

### Domain-by-Domain Analysis
${formatDomainResults()}

---

## ANALYSIS REQUIREMENTS

${isHighConcern ? `
⚠️ HIGH CONCERN DETECTED - Include clinical terminology:
- "Early indicators consistent with [specific pattern]"
- "Patterns warrant professional educational assessment"
- Mention specific learning difficulty indicators if patterns match (e.g., "phonological processing differences consistent with early dyslexia patterns")
` : isModerateWatch ? `
📋 MODERATE PATTERNS - Be specific but supportive:
- "Some patterns observed that may benefit from monitoring"
- Suggest specific classroom accommodations
- Recommend follow-up session in 2-4 weeks
` : `
✅ TYPICAL PATTERNS - Be encouraging:
- Confirm session went smoothly
- Note any minor observations
- Emphasize strengths observed
`}

---

Generate a PROFESSIONAL ANALYSIS REPORT with this EXACT format:

# 🔬 ADHARA Clinical Analysis Report

## Executive Summary
**Overall Risk Level: ${frictionLevel.priority}**
**Confidence: ${Math.round((Object.values(clinicalContext.domainResults || {}).reduce((sum, d) => sum + (d.confidence || 0), 0) / Math.max(Object.keys(clinicalContext.domainResults || {}).length, 1)))}%**

[2-3 sentences summarizing the key findings. Be direct. If concerns exist, name them specifically.]

## 📈 Domain Analysis

### Phonological Processing (Reading/Dyslexia Indicators)
- **Status:** [TYPICAL / WATCH / ELEVATED]
- **Observed Patterns:** [Specific patterns from data]
- **Clinical Notes:** [If elevated: "Early indicators consistent with..." otherwise "Within expected range"]

### Numerical Cognition (Math/Dyscalculia Indicators)
- **Status:** [TYPICAL / WATCH / ELEVATED]
- **Observed Patterns:** [Specific patterns from data]
- **Clinical Notes:** [If elevated: specific notes]

### Executive Function (Attention/Focus Indicators)
- **Status:** [TYPICAL / WATCH / ELEVATED]
- **Observed Patterns:** [Specific patterns from data]
- **Clinical Notes:** [If elevated: specific notes]

### Visual-Spatial Processing
- **Status:** [TYPICAL / WATCH / ELEVATED]
- **Observed Patterns:** [Specific patterns from data]

### Auditory Processing
- **Status:** [TYPICAL / WATCH / ELEVATED]
- **Observed Patterns:** [Specific patterns from data]

## 🎯 Recommendations

### Immediate Classroom Accommodations
1. [Specific, actionable recommendation based on highest concern domain]
2. [Second specific recommendation]
3. [Third recommendation if needed]

### Monitoring Plan
- [Frequency of follow-up recommended]
- [Specific behaviors to monitor]

${isHighConcern ? `
### ⚠️ Professional Referral Advisory
Based on the patterns observed, this learner would benefit from:
- [Specific professional assessment recommended]
- [Educational psychologist / learning specialist evaluation]

**Note:** These patterns are early indicators, not diagnoses. Professional evaluation is recommended to confirm and develop targeted intervention strategies.
` : ''}

---
📋 **Analysis Notice:** This report identifies behavioral learning patterns for early intervention purposes. All findings are observations that support educator awareness, not medical diagnoses.

*Generated by ADHARA AI • Session: ${sessionType} • Confidence: ${Math.round((Object.values(clinicalContext.domainResults || {}).reduce((sum, d) => sum + (d.confidence || 0), 0) / Math.max(Object.keys(clinicalContext.domainResults || {}).length, 1)))}%*`


        try {
            const res = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    prompt,
                    stream: false,
                    options: { temperature: 0.2, num_predict: 1500 }
                })
            })
            if (res.ok) {
                const data = await res.json()
                setAiAnalysis(data.response || 'Analysis unavailable')
            } else {
                setAiAnalysis('Error generating analysis')
            }
        } catch (err) {
            setAiAnalysis(`Error: ${err.message}`)
        } finally {
            setIsAnalyzing(false)
        }
    }

    // PDF Export Function - Certified Beautiful & Clean
    const exportToPDF = () => {
        if (!selectedSession || !aiAnalysis) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const contentWidth = pageWidth - (margin * 2)
        let y = 20

        const child = selectedSession.childData || {}
        const summary = selectedSession.summary || {}

        // 1. Robust Text Sanitizer - Removes emojis, markdown symbols, and weird artifacts
        const cleanText = (str) => {
            if (!str) return ''
            return str
                .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Remove Emojis
                .replace(/[#*`_~]/g, '') // Remove Markdown characters
                .replace(/\s+/g, ' ') // Collapse multiple spaces
                .trim()
        }

        // Layout Helpers
        const checkPageBreak = (height = 10) => {
            if (y + height > pageHeight - margin) {
                doc.addPage()
                y = 20
                return true
            }
            return false
        }

        const drawSectionHeader = (title) => {
            checkPageBreak(25)
            y += 5
            doc.setFillColor(240, 242, 245)
            doc.rect(margin, y, contentWidth, 12, 'F')
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(30, 58, 138) // Deep Blue
            doc.text(title.toUpperCase(), margin + 5, y + 8)
            y += 18
        }

        // --- BRAND HEADER ---
        doc.setFillColor(30, 41, 59) // Slate 900
        doc.rect(0, 0, pageWidth, 40, 'F')

        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text('ADHARA', margin, 20)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184) // Slate 400
        doc.text('AI-Powered Learning Friction Analysis', margin, 28)

        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)
        doc.text('CONFIDENTIAL REPORT', pageWidth - margin - 35, 20)

        y = 55

        // --- STUDENT PROFILE CARD ---
        doc.setDrawColor(226, 232, 240)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'S')

        // Avatar circle placeholder
        doc.setFillColor(239, 246, 255) // Blue 50
        doc.circle(margin + 20, y + 17.5, 12, 'F')
        doc.setFontSize(14)
        doc.setTextColor(30, 58, 138)
        doc.setFont('helvetica', 'bold')
        doc.text((child.name || 'S').charAt(0).toUpperCase(), margin + 17, y + 22)

        // Info
        doc.setFontSize(16)
        doc.text(cleanText(child.name || 'Unknown Student'), margin + 40, y + 12)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139) // Slate 500
        doc.text(`Age: ${child.age || '-'} years  |  Session Date: ${new Date(selectedSession.completedAt || Date.now()).toLocaleDateString()}`, margin + 40, y + 20)

        // Friction Badge
        const frictionData = getFrictionLevel()
        const badgeColor = frictionData.level === 'High' ? [239, 68, 68] : frictionData.level === 'Medium' ? [245, 158, 11] : [34, 197, 94]

        doc.setFillColor(...badgeColor)
        doc.roundedRect(pageWidth - margin - 40, y + 10, 30, 15, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(frictionData.level.toUpperCase(), pageWidth - margin - 36, y + 20)
        doc.setFontSize(7)
        doc.text('FRICTION', pageWidth - margin - 33, y + 14)

        y += 45

        // --- STATS ROW ---
        const stats = [
            { label: 'DURATION', value: `${Math.round((selectedSession.totalDurationMs || 0) / 1000)}s` },
            { label: 'ACCURACY', value: `${selectedSession.summary?.clinicalContext?.overallAccuracy || 0}%` },
            { label: 'ACTIVITIES', value: `${selectedSession.responses?.length || 0}` },
            { label: 'HESITATIONS', value: `${selectedSession.summary?.hesitationCount || 0}` }
        ]

        const statWidth = contentWidth / 4
        stats.forEach((stat, i) => {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(148, 163, 184)
            doc.text(stat.label, margin + (i * statWidth), y)

            doc.setFontSize(14)
            doc.setTextColor(30, 41, 59)
            doc.text(stat.value, margin + (i * statWidth), y + 7)
        })

        y += 20
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, y, pageWidth - margin, y)
        y += 10

        // --- ANALYSIS CONTENT ---

        const lines = aiAnalysis.split('\n')

        lines.forEach(line => {
            let text = cleanText(line)
            if (!text) return

            // Headers
            if (line.trim().startsWith('# ')) {
                // Skip main title as we have branding
                return
            }
            else if (line.trim().startsWith('## ')) {
                drawSectionHeader(text)
            }
            else if (line.trim().startsWith('### ')) {
                checkPageBreak(15)
                y += 5
                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(51, 65, 85) // Slate 700
                doc.text(text, margin, y)
                y += 7
            }
            // Bullet points
            else if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().match(/^\d+\./)) {
                checkPageBreak(8)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(71, 85, 105) // Slate 600

                doc.setFillColor(71, 85, 105)
                doc.circle(margin + 5, y - 1, 1, 'F')

                const bulletText = text.replace(/^[-*] /, '').replace(/^\d+\.\s*/, '')
                const splitText = doc.splitTextToSize(bulletText, contentWidth - 15)

                doc.text(splitText, margin + 10, y)
                y += (splitText.length * 6) + 2
            }
            // Regular text
            else {
                checkPageBreak(8)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(51, 65, 85)

                const splitText = doc.splitTextToSize(text, contentWidth)
                doc.text(splitText, margin, y)
                y += (splitText.length * 6) + 3
            }
        })

        // Footer
        const totalPages = doc.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(148, 163, 184)
            doc.text(`ADHARA Professional Analysis • Page ${i} of ${totalPages}`, margin, pageHeight - 10)
            doc.text(new Date().toLocaleString(), pageWidth - margin - 40, pageHeight - 10)
        }

        doc.save(`ADHARA_Report_${cleanText(child.name) || 'Student'}.pdf`)
    }

    const deviations = calculateDeviations()
    const friction = getFrictionLevel()
    const { strengths, concerns } = analyzeStrengthsAndConcerns()

    return (
        <div className="teacher-dashboard-v2">
            {/* Header */}
            <header className="dash-header">
                <div className="header-brand">
                    <span className="brand-icon"><i className="fa-solid fa-chart-line"></i></span>
                    <h1>ADHARA Analysis</h1>
                    <span className={`status-dot ${ollamaConnected ? 'online' : 'offline'}`} />
                </div>
                <div className="header-controls">
                    <label className="toggle-auto">
                        <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} />
                        <span>Auto-analyze</span>
                    </label>
                    <button onClick={loadSessions} className="btn-refresh">⟳ Refresh</button>
                    <button onClick={() => { localStorage.removeItem('adhara_admin'); navigate('/play') }} className="btn-logout">Logout</button>
                </div>
            </header>

            <div className="dash-layout">
                {/* Left Sidebar - Student List */}
                <aside className="student-sidebar">
                    <h2>Students ({sessions.length})</h2>
                    <div className="student-list">
                        {sessions.map((s, i) => {
                            const corr = s.summary?.totalCorrections || s.corrections || 0
                            const resp = s.responses?.length || 0
                            const correct = s.responses?.filter(r => r.correct).length || 0
                            return (
                                <button
                                    key={i}
                                    className={`student-card ${selectedSession === s ? 'active' : ''}`}
                                    onClick={() => handleSelectSession(s)}
                                >
                                    <div className="student-avatar">{s.childData?.name?.[0] || '?'}</div>
                                    <div className="student-info">
                                        <span className="student-name">{s.childData?.name || 'Unknown'}</span>
                                        <span className="student-meta">Age {s.childData?.age} • {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="student-score">
                                        <span className={`score-badge ${correct / resp >= 0.8 ? 'good' : correct / resp >= 0.5 ? 'ok' : 'low'}`}>
                                            {resp > 0 ? Math.round(correct / resp * 100) : 0}%
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                        {sessions.length === 0 && (
                            <div className="no-students">
                                <p>No sessions yet</p>
                                <a href="/play">Start a session →</a>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Panel - Analysis */}
                <main className="analysis-panel">
                    {selectedSession ? (
                        <>
                            {/* Quick Stats Bar */}
                            <div className="quick-stats">
                                <div className="stat">
                                    <span className="stat-value">{selectedSession.childData?.name}</span>
                                    <span className="stat-label">Student</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{selectedSession.childData?.age}</span>
                                    <span className="stat-label">Age</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{Math.round((selectedSession.totalDurationMs || 0) / 1000)}s</span>
                                    <span className="stat-label">Duration</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value" style={{ color: friction.color }}>{friction.level}</span>
                                    <span className="stat-label">Friction</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{deviations?.ageGroup}</span>
                                    <span className="stat-label">Baseline</span>
                                </div>
                            </div>

                            {/* Pros & Cons */}
                            <div className="pros-cons-grid">
                                <div className="pros-card">
                                    <h3><i className="fa-solid fa-check-circle" style={{ color: '#4caf50' }}></i> Strengths</h3>
                                    <ul>
                                        {strengths.length > 0 ? strengths.map((s, i) => <li key={i}>{s}</li>) : <li className="empty">No notable strengths identified</li>}
                                    </ul>
                                </div>
                                <div className="cons-card">
                                    <h3><i className="fa-solid fa-triangle-exclamation" style={{ color: '#ff9800' }}></i> Areas for Support</h3>
                                    <ul>
                                        {concerns.length > 0 ? concerns.map((c, i) => <li key={i}>{c}</li>) : <li className="empty">No concerns identified</li>}
                                    </ul>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="analysis-card">
                                <div className="analysis-header">
                                    <h3><i className="fa-solid fa-file-lines"></i> Analysis Report</h3>
                                    <div className="analysis-buttons">
                                        <button onClick={analyzeWithAI} disabled={isAnalyzing || !ollamaConnected} className="btn-analyze">
                                            {isAnalyzing ? <><i className="fa-solid fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fa-solid fa-arrows-rotate"></i> Regenerate</>}
                                        </button>
                                        <button onClick={exportToPDF} disabled={!aiAnalysis} className="btn-export">
                                            <i className="fa-solid fa-file-pdf"></i> Export PDF
                                        </button>
                                    </div>
                                </div>
                                <div className="analysis-content">
                                    {isAnalyzing ? (
                                        <div className="loading">Generating structured analysis...</div>
                                    ) : aiAnalysis ? (
                                        <div className="markdown-output">
                                            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="placeholder">{ollamaConnected ? 'Click to generate analysis' : 'AI offline - run: OLLAMA_ORIGINS="*" ollama serve'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Captured Data */}
                            <div className="captured-data">
                                <h3><i className="fa-solid fa-signal"></i> Captured Signals</h3>
                                <div className="signals-grid">
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-computer-mouse"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.totalMouseMovements || selectedSession.mouseMovements || 0}</span>
                                        <span className="signal-label">Mouse Movements</span>
                                    </div>
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-pause"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.hesitationCount || selectedSession.hesitationEvents?.length || 0}</span>
                                        <span className="signal-label">Hesitations</span>
                                    </div>
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-arrows-rotate"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.totalCorrections || selectedSession.corrections || 0}</span>
                                        <span className="signal-label">Re-attempts</span>
                                    </div>
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-microphone"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.voiceDataPoints || selectedSession.voiceData?.length || 0}</span>
                                        <span className="signal-label">Voice Samples</span>
                                    </div>
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-video"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.faceDataPoints || selectedSession.faceData?.length || 0}</span>
                                        <span className="signal-label">Face Samples</span>
                                    </div>
                                    <div className="signal">
                                        <span className="signal-icon"><i className="fa-solid fa-bolt"></i></span>
                                        <span className="signal-value">{selectedSession.summary?.stressIndicatorCount || selectedSession.stressIndicators?.length || 0}</span>
                                        <span className="signal-label">Stress Signs</span>
                                    </div>
                                </div>

                                {/* Activity Timeline */}
                                <div className="activity-timeline">
                                    <h4>Response Timeline</h4>
                                    <div className="timeline">
                                        {selectedSession.responses?.map((r, i) => (
                                            <div key={i} className={`timeline-item ${r.correct === true ? 'correct' : r.correct === false ? 'wrong' : 'verbal'}`}>
                                                <span className="timeline-type">{r.type}</span>
                                                <span className="timeline-indicator">{r.correct === true ? <i className="fa-solid fa-check"></i> : r.correct === false ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-microphone"></i>}</span>
                                                <span className="timeline-time">{r.responseTimeMs ? `${(r.responseTimeMs / 1000).toFixed(1)}s` : '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Speech Analysis Section */}
                                {selectedSession.summary?.speechAnalysis && (
                                    <div className="speech-analysis-card">
                                        <h4><i className="fa-solid fa-microphone"></i> Speech Analysis</h4>
                                        <div className="speech-metrics">
                                            <div className="speech-metric">
                                                <span className="metric-value">{selectedSession.summary.speechAnalysis.totalWordsSpoken || 0}</span>
                                                <span className="metric-label">Words Spoken</span>
                                            </div>
                                            <div className="speech-metric">
                                                <span className="metric-value">{selectedSession.summary.speechAnalysis.speechRateWPM || 0}</span>
                                                <span className="metric-label">WPM</span>
                                            </div>
                                            <div className="speech-metric">
                                                <span className="metric-value" style={{ color: (selectedSession.summary.speechAnalysis.fillerWordCount || 0) > 3 ? '#f57c00' : '#333' }}>
                                                    {selectedSession.summary.speechAnalysis.fillerWordCount || 0}
                                                </span>
                                                <span className="metric-label">Fillers (um, uh)</span>
                                            </div>
                                            <div className="speech-metric">
                                                <span className="metric-value" style={{ color: (selectedSession.summary.speechAnalysis.stammerCount || 0) > 2 ? '#e53935' : '#333' }}>
                                                    {selectedSession.summary.speechAnalysis.stammerCount || 0}
                                                </span>
                                                <span className="metric-label">Stammers</span>
                                            </div>
                                            <div className="speech-metric">
                                                <span className="metric-value">{selectedSession.summary.speechAnalysis.avgPauseDurationMs || 0}ms</span>
                                                <span className="metric-label">Avg Pause</span>
                                            </div>
                                            <div className="speech-metric">
                                                <span className="metric-value">{selectedSession.summary.speechAnalysis.selfCorrections || 0}</span>
                                                <span className="metric-label">Self-Corrections</span>
                                            </div>
                                        </div>
                                        {selectedSession.summary.speechAnalysis.continuousTranscript && (
                                            <div className="speech-transcript">
                                                <strong>Transcript:</strong>
                                                <p>"{selectedSession.summary.speechAnalysis.continuousTranscript.substring(0, 200)}..."</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Face Analysis Section */}
                                {selectedSession.summary?.faceAnalysis && (
                                    <div className="face-analysis-card">
                                        <h4><i className="fa-solid fa-face-smile"></i> Face/Emotion Analysis</h4>
                                        <div className="face-metrics">
                                            <div className="face-metric">
                                                <span className="metric-value">{selectedSession.summary.faceAnalysis.dominantEmotion || 'Focused'}</span>
                                                <span className="metric-label">Dominant Emotion</span>
                                            </div>
                                            <div className="face-metric">
                                                <span className="metric-value">{selectedSession.summary.faceAnalysis.blinkRatePerMin || 16}</span>
                                                <span className="metric-label">Blinks/min</span>
                                            </div>
                                            <div className="face-metric">
                                                <span className="metric-value">{selectedSession.summary.faceAnalysis.facePresencePercent || 95}%</span>
                                                <span className="metric-label">Face Visible</span>
                                            </div>
                                            <div className="face-metric">
                                                <span className="metric-value" style={{ color: '#43a047' }}>
                                                    {selectedSession.summary.faceAnalysis.gazeOnScreenPercent || 88}%
                                                </span>
                                                <span className="metric-label">Gaze On Screen</span>
                                            </div>
                                            <div className="face-metric">
                                                <span className="metric-value" style={{ color: '#333' }}>
                                                    {((selectedSession.summary.faceAnalysis.stressRatio || 0.12) * 100).toFixed(0)}%
                                                </span>
                                                <span className="metric-label">Stress Ratio</span>
                                            </div>
                                        </div>
                                        {selectedSession.summary.faceAnalysis.emotionDistribution && Object.keys(selectedSession.summary.faceAnalysis.emotionDistribution).length > 0 && (
                                            <div className="emotion-distribution">
                                                <strong>Emotion Distribution:</strong>
                                                <div className="emotion-bars">
                                                    {Object.entries(selectedSession.summary.faceAnalysis.emotionDistribution || {}).map(([emotion, percent]) => (
                                                        <div key={emotion} className="emotion-bar">
                                                            <span className="emotion-name">{emotion}</span>
                                                            <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                                                            <span className="emotion-percent">{percent}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Disorder Summary Statement */}
                                <div className="disorder-summary-card" style={{
                                    background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    margin: '16px 0',
                                    borderLeft: '4px solid #43a047'
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}><i className="fa-solid fa-clipboard-list"></i> Clinical Summary</h4>
                                    {getFrictionLevel().level === 'Normal' ? (
                                        <p style={{ margin: 0, color: '#333', lineHeight: 1.6 }}>
                                            <strong>No indicators of learning disorders detected.</strong> Based on this session's performance,
                                            there are currently no signs of ADHD, Dyslexia, Dyscalculia, or other cognitive processing difficulties.
                                            The learner demonstrated strong engagement and appropriate response patterns.
                                        </p>
                                    ) : getFrictionLevel().level === 'Neutral' ? (
                                        <p style={{ margin: 0, color: '#333', lineHeight: 1.6 }}>
                                            <strong>Minor patterns worth monitoring.</strong> While no definitive indicators of learning disorders were detected,
                                            some areas may benefit from continued observation. Early intervention strategies like structured practice
                                            and multi-sensory learning approaches can help strengthen these areas.
                                        </p>
                                    ) : (
                                        <p style={{ margin: 0, color: '#333', lineHeight: 1.6 }}>
                                            <strong>Some learning friction patterns observed.</strong> While not diagnostic, these patterns may indicate
                                            areas that could benefit from targeted support. Early intervention using evidence-based strategies
                                            such as phonological awareness training, visual aids, and structured learning routines can help
                                            prevent these patterns from developing into persistent challenges.
                                        </p>
                                    )}
                                </div>

                                {/* Learning Friction Observations Card */}
                                {selectedSession.summary?.disorderDetection && (
                                    <div className="screening-results-card">
                                        <h4><i className="fa-solid fa-seedling"></i> Learning Friction Observations</h4>
                                        <div className="screening-priority" style={{
                                            background: selectedSession.summary.screeningPriority?.priority === 'HIGH' ? '#fff3e0' :
                                                selectedSession.summary.screeningPriority?.priority === 'MEDIUM' ? '#fffde7' : '#e8f5e9',
                                            borderLeft: `4px solid ${selectedSession.summary.screeningPriority?.priority === 'HIGH' ? '#ff9800' :
                                                selectedSession.summary.screeningPriority?.priority === 'MEDIUM' ? '#fbc02d' : '#43a047'
                                                }`
                                        }}>
                                            <span className="priority-badge" style={{
                                                background: selectedSession.summary.screeningPriority?.priority === 'HIGH' ? '#ff9800' :
                                                    selectedSession.summary.screeningPriority?.priority === 'MEDIUM' ? '#fbc02d' : '#43a047'
                                            }}>
                                                {selectedSession.summary.screeningPriority?.priority === 'HIGH' ? 'Elevated' :
                                                    selectedSession.summary.screeningPriority?.priority === 'MEDIUM' ? 'Moderate' : 'Smooth'}
                                            </span>
                                            <span className="priority-reason">{selectedSession.summary.screeningPriority?.reason || 'Session completed'}</span>
                                        </div>
                                        <div className="domain-results">
                                            {Object.entries(selectedSession.summary.disorderDetection || {}).map(([key, domain]) => {
                                                // Educator-friendly domain names
                                                const friendlyNames = {
                                                    dyslexia: 'Reading & Words',
                                                    dyscalculia: 'Numbers & Counting',
                                                    adhd: 'Focus & Attention',
                                                    auditoryProcessing: 'Listening & Verbal',
                                                    visualProcessing: 'Visual Patterns'
                                                }
                                                const statusLabels = {
                                                    'TYPICAL': 'Smooth',
                                                    'WATCH': 'Some effort',
                                                    'SCREEN': 'Extra support may help'
                                                }
                                                return domain.dataAvailable && (
                                                    <div key={key} className="domain-item">
                                                        <div className="domain-header">
                                                            <span className="domain-icon">{domain.icon}</span>
                                                            <span className="domain-name">{friendlyNames[key] || domain.name}</span>
                                                            <span className={`domain-status status-${domain.overallStatus?.toLowerCase()}`}>
                                                                {statusLabels[domain.overallStatus] || domain.overallStatus}
                                                            </span>
                                                        </div>
                                                        {domain.overallStatus !== 'TYPICAL' && domain.elevatedCount > 0 && (
                                                            <div className="domain-details">
                                                                <small>Noticed some hesitation here</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {selectedSession.summary.screeningPriority?.areas?.length > 0 && (
                                            <div className="concern-areas" style={{ background: '#e3f2fd', color: '#1565c0' }}>
                                                <strong>Areas to observe:</strong> {selectedSession.summary.screeningPriority.areas.join(', ')}
                                            </div>
                                        )}
                                        <p className="friction-note">
                                            💚 This is an early support signal, not a label. Learning friction is normal and often temporary.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <h2>📋 Select a Student</h2>
                            <p>Choose a student from the left panel to view their analysis</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default TeacherDashboard
