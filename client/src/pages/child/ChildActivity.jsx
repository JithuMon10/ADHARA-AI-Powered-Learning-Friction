import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildActivity.css'

/**
 * Child Activity - Interactive puzzles with REAL tracking
 * Uses useRef to ensure signals persist correctly
 * Tracks: mouse movements, hesitations, response times, corrections
 */

const ACTIVITIES = [
    {
        id: 1,
        type: 'counting',
        question: "How many stars do you see? ⭐",
        emoji: '⭐',
        count: 5,
        options: [4, 5, 6, 7],
        correct: 5
    },
    {
        id: 2,
        type: 'letter',
        question: "Which letter is this?",
        showLetter: 'b',
        options: ['b', 'd', 'p', 'q'],
        correct: 'b'
    },
    {
        id: 3,
        type: 'pattern',
        question: "What comes next? 🔴 🔵 🔴 🔵 ?",
        options: ['🔴', '🔵', '🟢', '🟡'],
        correct: '🔴'
    },
    {
        id: 4,
        type: 'math',
        question: "What is 2 + 3?",
        options: [4, 5, 6, 7],
        correct: 5
    },
    {
        id: 5,
        type: 'drawing',
        question: "Draw a circle with your finger!",
        isDrawing: true
    }
]

const MASCOT_MESSAGES = {
    start: ["Let's play!", "Ready for fun?", "Here we go! 🎉"],
    correct: ["Yay! Great job! 🎉", "You're amazing! ⭐", "Wow, so smart! 🌟", "Perfect! 👏"],
    wrong: ["Good try! Let's try again! 💪", "Almost! Try once more! 🌈", "You can do it! 🎈"],
    next: ["Here's another one!", "Let's try this!", "You're doing great! 🌟"],
    complete: ["All done! You're a superstar! ⭐🌟⭐"]
}

function ChildActivity() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)

    // Use refs for tracking data to avoid stale closure issues
    const signalsRef = useRef({
        responses: [],
        mouseMovements: 0,
        hesitationEvents: [],
        corrections: 0,
        pathData: [],
        startTime: Date.now()
    })

    const [currentIndex, setCurrentIndex] = useState(0)
    const [mascotMessage, setMascotMessage] = useState(MASCOT_MESSAGES.start[0])
    const [showFeedback, setShowFeedback] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [paths, setPaths] = useState([])
    const [currentPath, setCurrentPath] = useState([])
    const [childData, setChildData] = useState(null)
    const [activityStartTime, setActivityStartTime] = useState(Date.now())
    const [lastMouseTime, setLastMouseTime] = useState(Date.now())

    // Load child data and set up tracking
    useEffect(() => {
        const stored = localStorage.getItem('adhara_child')
        if (stored) {
            const data = JSON.parse(stored)
            setChildData(data)
            setMascotMessage(`Hi ${data.name}! Let's play some fun games! 🎮`)
            signalsRef.current.startTime = data.sessionId || Date.now()
        }

        // Clear any previous session data
        localStorage.removeItem('adhara_session_complete')
    }, [])

    // REAL Mouse Movement Tracking
    useEffect(() => {
        let lastX = 0, lastY = 0
        let idleStart = Date.now()

        const handleMouseMove = (e) => {
            const now = Date.now()
            const deltaX = Math.abs(e.clientX - lastX)
            const deltaY = Math.abs(e.clientY - lastY)
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            // Count significant movements
            if (distance > 5) {
                signalsRef.current.mouseMovements++
                idleStart = now
            }

            // Detect hesitation (idle for > 2 seconds with small movements)
            if (now - idleStart > 2000 && distance < 10) {
                signalsRef.current.hesitationEvents.push({
                    timestamp: new Date().toISOString(),
                    activityId: ACTIVITIES[currentIndex]?.id,
                    durationMs: now - idleStart
                })
                idleStart = now // Reset
            }

            lastX = e.clientX
            lastY = e.clientY
            setLastMouseTime(now)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [currentIndex])

    // Save signals to localStorage periodically
    useEffect(() => {
        const saveInterval = setInterval(() => {
            const dataToSave = {
                ...signalsRef.current,
                childData,
                lastUpdate: new Date().toISOString()
            }
            localStorage.setItem('adhara_live_signals', JSON.stringify(dataToSave))
        }, 2000)

        return () => clearInterval(saveInterval)
    }, [childData])

    const currentActivity = ACTIVITIES[currentIndex]

    const handleAnswer = useCallback((answer) => {
        const responseTime = Date.now() - activityStartTime
        const isCorrect = answer === currentActivity.correct

        // Add to responses using ref (always up-to-date)
        signalsRef.current.responses.push({
            activityId: currentActivity.id,
            type: currentActivity.type,
            answer,
            correct: isCorrect,
            responseTimeMs: responseTime,
            timestamp: new Date().toISOString()
        })

        if (!isCorrect) {
            signalsRef.current.corrections++
        }

        // Save immediately
        localStorage.setItem('adhara_live_signals', JSON.stringify({
            ...signalsRef.current,
            childData,
            lastUpdate: new Date().toISOString()
        }))

        // Show feedback
        setShowFeedback(isCorrect ? 'correct' : 'wrong')
        setMascotMessage(
            isCorrect
                ? MASCOT_MESSAGES.correct[Math.floor(Math.random() * MASCOT_MESSAGES.correct.length)]
                : MASCOT_MESSAGES.wrong[Math.floor(Math.random() * MASCOT_MESSAGES.wrong.length)]
        )

        // Move to next after delay
        setTimeout(() => {
            setShowFeedback(null)
            if (isCorrect) {
                if (currentIndex < ACTIVITIES.length - 1) {
                    setCurrentIndex(prev => prev + 1)
                    setActivityStartTime(Date.now())
                    setMascotMessage(MASCOT_MESSAGES.next[Math.floor(Math.random() * MASCOT_MESSAGES.next.length)])
                } else {
                    handleComplete()
                }
            }
        }, 1500)
    }, [currentActivity, activityStartTime, currentIndex, childData])

    const handleDrawingComplete = () => {
        signalsRef.current.responses.push({
            activityId: currentActivity.id,
            type: 'drawing',
            pathCount: paths.length,
            pathData: signalsRef.current.pathData,
            timestamp: new Date().toISOString()
        })

        setMascotMessage("Beautiful drawing! 🎨")
        setTimeout(() => {
            handleComplete()
        }, 1500)
    }

    const handleComplete = useCallback(() => {
        setMascotMessage(MASCOT_MESSAGES.complete[0])

        // Create final session data with ALL signals
        const finalSignals = {
            ...signalsRef.current,
            childData,
            completedAt: new Date().toISOString(),
            totalDurationMs: Date.now() - signalsRef.current.startTime,
            summary: {
                totalResponses: signalsRef.current.responses.length,
                correctResponses: signalsRef.current.responses.filter(r => r.correct).length,
                totalCorrections: signalsRef.current.corrections,
                avgResponseTime: signalsRef.current.responses.length > 0
                    ? Math.round(signalsRef.current.responses.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / signalsRef.current.responses.length)
                    : 0,
                totalMouseMovements: signalsRef.current.mouseMovements,
                hesitationCount: signalsRef.current.hesitationEvents.length
            }
        }

        // Save to localStorage - this is what TeacherDashboard reads
        localStorage.setItem('adhara_session_complete', JSON.stringify(finalSignals))

        // Also append to history for multiple sessions
        const history = JSON.parse(localStorage.getItem('adhara_sessions_history') || '[]')
        history.push(finalSignals)
        localStorage.setItem('adhara_sessions_history', JSON.stringify(history))

        console.log('Session saved:', finalSignals) // For debugging

        // Navigate to completion
        setTimeout(() => {
            navigate('/play/complete')
        }, 2000)
    }, [childData, navigate])

    // Drawing handlers
    const handlePointerDown = (e) => {
        if (!currentActivity?.isDrawing) return
        setIsDrawing(true)
        const pos = getPos(e)
        setCurrentPath([pos])
        signalsRef.current.pathData.push({ type: 'start', ...pos, time: Date.now() })
    }

    const handlePointerMove = (e) => {
        if (!isDrawing) return
        const pos = getPos(e)
        setCurrentPath(p => [...p, pos])
        signalsRef.current.pathData.push({ type: 'move', ...pos, time: Date.now() })
    }

    const handlePointerUp = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        if (currentPath.length > 1) {
            setPaths(p => [...p, currentPath])
        }
        setCurrentPath([])
        signalsRef.current.pathData.push({ type: 'end', time: Date.now() })
    }

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
            y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
        }
    }

    // Draw on canvas
    useEffect(() => {
        if (!canvasRef.current || !currentActivity?.isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#FF6B6B'
        ctx.lineWidth = 8
        ctx.lineCap = 'round'

        const allPaths = paths.concat([currentPath])
        allPaths.forEach(path => {
            if (path.length < 2) return
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            path.forEach(p => ctx.lineTo(p.x, p.y))
            ctx.stroke()
        })
    }, [paths, currentPath, currentActivity])

    // Render stars for counting
    const renderStars = (count) => {
        return Array(count).fill('⭐').map((star, i) => (
            <span key={i} className="counting-star" style={{ animationDelay: `${i * 0.1}s` }}>
                {star}
            </span>
        ))
    }

    return (
        <div className="child-activity">
            {/* Tracking indicator (subtle, for demo) */}
            <div className="tracking-indicator">
                🔴 Tracking: {signalsRef.current.mouseMovements} moves
            </div>

            {/* Mascot */}
            <div className="activity-mascot">
                <div className="mascot-bubble">
                    <p>{mascotMessage}</p>
                </div>
                <span className="mascot-emoji">🐻</span>
            </div>

            {/* Progress */}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((currentIndex + 1) / ACTIVITIES.length) * 100}%` }}
                />
            </div>

            {/* Activity Content */}
            <div className={`activity-content ${showFeedback || ''}`}>
                {currentActivity && !currentActivity.isDrawing && (
                    <>
                        <h2 className="activity-question">{currentActivity.question}</h2>

                        {/* Counting display */}
                        {currentActivity.type === 'counting' && (
                            <div className="counting-display">
                                {renderStars(currentActivity.count)}
                            </div>
                        )}

                        {/* Letter display */}
                        {currentActivity.type === 'letter' && (
                            <div className="letter-display">
                                {currentActivity.showLetter}
                            </div>
                        )}

                        {/* Options */}
                        <div className="options-grid">
                            {currentActivity.options.map((opt, i) => (
                                <button
                                    key={i}
                                    className="option-button"
                                    onClick={() => handleAnswer(opt)}
                                    disabled={showFeedback}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Drawing activity */}
                {currentActivity?.isDrawing && (
                    <div className="drawing-section">
                        <h2 className="activity-question">{currentActivity.question}</h2>
                        <canvas
                            ref={canvasRef}
                            className="drawing-canvas"
                            width={300}
                            height={300}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                            onTouchEnd={handlePointerUp}
                        />
                        <button
                            className="done-button"
                            onClick={handleDrawingComplete}
                            disabled={paths.length === 0}
                        >
                            Done! ✨
                        </button>
                    </div>
                )}
            </div>

            {/* Feedback overlay */}
            {showFeedback === 'correct' && (
                <div className="feedback-overlay correct">
                    <span className="feedback-emoji">🎉</span>
                </div>
            )}
        </div>
    )
}

export default ChildActivity
