import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildActivity.css'

/**
 * Child Activity - Interactive activities with FULL TRACKING
 * Tracks: Mouse, Face (webcam), Voice, Response times
 */

// Extended activities with more types
const ACTIVITIES = [
    // COUNTING
    {
        id: 1,
        type: 'counting',
        question: "How many stars do you see? ⭐",
        count: 5,
        options: [4, 5, 6, 7],
        correct: 5
    },
    // LETTER RECOGNITION (common confusion letters)
    {
        id: 2,
        type: 'letter',
        question: "Which letter is this?",
        showLetter: 'b',
        options: ['b', 'd', 'p', 'q'],
        correct: 'b'
    },
    // PATTERN MATCHING
    {
        id: 3,
        type: 'pattern',
        question: "What comes next? 🔴 🔵 🔴 🔵 ?",
        options: ['🔴', '🔵', '🟢', '🟡'],
        correct: '🔴'
    },
    // VERBAL ACTIVITY - Read aloud
    {
        id: 4,
        type: 'verbal',
        question: "Say this word out loud:",
        word: "BUTTERFLY",
        instruction: "Click the 🎤 and say the word clearly"
    },
    // DOT MATCHING - Connect the sequence
    {
        id: 5,
        type: 'sequence',
        question: "Put these numbers in order (smallest to biggest):",
        items: [7, 2, 5, 9],
        correct: [2, 5, 7, 9]
    },
    // PUZZLE - Find missing piece
    {
        id: 6,
        type: 'puzzle',
        question: "Which piece completes the picture?",
        pattern: ['🟦', '🟦', '🟦', '🟦', '❓', '🟦', '🟦', '🟦', '🟦'],
        options: ['🟦', '🟥', '🟨', '🟩'],
        correct: '🟦'
    },
    // MATH
    {
        id: 7,
        type: 'math',
        question: "What is 3 + 4?",
        options: [5, 6, 7, 8],
        correct: 7
    },
    // SHAPE MATCHING
    {
        id: 8,
        type: 'matching',
        question: "Which shape is different?",
        shapes: ['🔵', '🔵', '🔵', '🟢'],
        options: [0, 1, 2, 3],
        correct: 3,
        optionLabels: ['1st', '2nd', '3rd', '4th']
    },
    // DRAWING
    {
        id: 9,
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
    listening: ["I'm listening! 🎤", "Say it clearly! 👂"],
    complete: ["All done! You're a superstar! ⭐🌟⭐"]
}

function ChildActivity() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    // Tracking refs (persist across renders)
    const signalsRef = useRef({
        responses: [],
        mouseMovements: 0,
        hesitationEvents: [],
        corrections: 0,
        pathData: [],
        startTime: Date.now(),
        faceData: [],
        voiceData: [],
        stressIndicators: []
    })

    const [currentIndex, setCurrentIndex] = useState(0)
    const [mascotMessage, setMascotMessage] = useState(MASCOT_MESSAGES.start[0])
    const [showFeedback, setShowFeedback] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [paths, setPaths] = useState([])
    const [currentPath, setCurrentPath] = useState([])
    const [childData, setChildData] = useState(null)
    const [activityStartTime, setActivityStartTime] = useState(Date.now())

    // Face tracking
    const [cameraEnabled, setCameraEnabled] = useState(false)
    const [cameraError, setCameraError] = useState(null)

    // Voice tracking  
    const [isListening, setIsListening] = useState(false)
    const [voiceResult, setVoiceResult] = useState('')
    const recognitionRef = useRef(null)

    // Sequence activity state
    const [selectedSequence, setSelectedSequence] = useState([])

    // Load child data and initialize tracking
    useEffect(() => {
        const stored = localStorage.getItem('adhara_child')
        if (stored) {
            const data = JSON.parse(stored)
            setChildData(data)
            setMascotMessage(`Hi ${data.name}! Let's play some fun games! 🎮`)
            signalsRef.current.startTime = data.sessionId || Date.now()
        }

        localStorage.removeItem('adhara_session_complete')

        // Initialize camera
        initCamera()

        // Initialize speech recognition
        initSpeechRecognition()

        return () => {
            // Cleanup camera
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            // Cleanup speech
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [])

    // Initialize camera for face tracking
    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setCameraEnabled(true)

            // Start face detection interval
            startFaceTracking()
        } catch (err) {
            console.log('Camera not available:', err.message)
            setCameraError('Camera not available')
        }
    }

    // Face tracking loop (simple presence detection)
    const startFaceTracking = () => {
        const trackFace = setInterval(() => {
            if (videoRef.current && cameraEnabled) {
                // Log face presence periodically
                signalsRef.current.faceData.push({
                    timestamp: Date.now(),
                    present: true, // In production, use face-api.js
                    activity: ACTIVITIES[currentIndex]?.type
                })
            }
        }, 3000) // Every 3 seconds

        return () => clearInterval(trackFace)
    }

    // Initialize speech recognition
    const initSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('')
                setVoiceResult(transcript)

                // Record voice data
                signalsRef.current.voiceData.push({
                    timestamp: Date.now(),
                    transcript,
                    confidence: event.results[0]?.[0]?.confidence || 0,
                    activity: ACTIVITIES[currentIndex]?.type
                })
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognition.onerror = (event) => {
                console.log('Speech error:', event.error)
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }

    // Mouse tracking
    useEffect(() => {
        let lastX = 0, lastY = 0
        let idleStart = Date.now()
        let rapidMoves = 0
        let lastMoveTime = Date.now()

        const handleMouseMove = (e) => {
            const now = Date.now()
            const deltaX = Math.abs(e.clientX - lastX)
            const deltaY = Math.abs(e.clientY - lastY)
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const timeDelta = now - lastMoveTime

            if (distance > 5) {
                signalsRef.current.mouseMovements++
                idleStart = now

                // Detect rapid/erratic movements (potential stress)
                if (timeDelta < 50 && distance > 30) {
                    rapidMoves++
                    if (rapidMoves > 10) {
                        signalsRef.current.stressIndicators.push({
                            type: 'rapid_mouse',
                            timestamp: now,
                            activity: ACTIVITIES[currentIndex]?.id
                        })
                        rapidMoves = 0
                    }
                } else {
                    rapidMoves = Math.max(0, rapidMoves - 1)
                }
            }

            // Detect hesitation
            if (now - idleStart > 2000 && distance < 10) {
                signalsRef.current.hesitationEvents.push({
                    timestamp: new Date().toISOString(),
                    activityId: ACTIVITIES[currentIndex]?.id,
                    durationMs: now - idleStart
                })
                idleStart = now
            }

            lastX = e.clientX
            lastY = e.clientY
            lastMoveTime = now
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [currentIndex])

    // Save signals periodically
    useEffect(() => {
        const saveInterval = setInterval(() => {
            localStorage.setItem('adhara_live_signals', JSON.stringify({
                ...signalsRef.current,
                childData,
                lastUpdate: new Date().toISOString()
            }))
        }, 2000)
        return () => clearInterval(saveInterval)
    }, [childData])

    const currentActivity = ACTIVITIES[currentIndex]

    const handleAnswer = useCallback((answer) => {
        const responseTime = Date.now() - activityStartTime
        const isCorrect = answer === currentActivity.correct

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
            signalsRef.current.stressIndicators.push({
                type: 'wrong_answer',
                timestamp: Date.now(),
                activity: currentActivity.id
            })
        }

        localStorage.setItem('adhara_live_signals', JSON.stringify({
            ...signalsRef.current,
            childData,
            lastUpdate: new Date().toISOString()
        }))

        setShowFeedback(isCorrect ? 'correct' : 'wrong')
        setMascotMessage(
            isCorrect
                ? MASCOT_MESSAGES.correct[Math.floor(Math.random() * MASCOT_MESSAGES.correct.length)]
                : MASCOT_MESSAGES.wrong[Math.floor(Math.random() * MASCOT_MESSAGES.wrong.length)]
        )

        setTimeout(() => {
            setShowFeedback(null)
            if (isCorrect) {
                goToNext()
            }
        }, 1500)
    }, [currentActivity, activityStartTime, childData])

    const goToNext = () => {
        if (currentIndex < ACTIVITIES.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setActivityStartTime(Date.now())
            setSelectedSequence([])
            setVoiceResult('')
            setMascotMessage(MASCOT_MESSAGES.next[Math.floor(Math.random() * MASCOT_MESSAGES.next.length)])
        } else {
            handleComplete()
        }
    }

    // Handle verbal activity
    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true)
            setVoiceResult('')
            setMascotMessage(MASCOT_MESSAGES.listening[0])
            recognitionRef.current.start()
        }
    }

    const submitVerbal = () => {
        signalsRef.current.responses.push({
            activityId: currentActivity.id,
            type: 'verbal',
            spokenWord: voiceResult,
            expectedWord: currentActivity.word,
            timestamp: new Date().toISOString()
        })

        setMascotMessage("Good job speaking! 🗣️")
        setTimeout(goToNext, 1500)
    }

    // Handle sequence activity
    const handleSequenceClick = (num) => {
        if (selectedSequence.includes(num)) return

        const newSeq = [...selectedSequence, num]
        setSelectedSequence(newSeq)

        if (newSeq.length === currentActivity.items.length) {
            const isCorrect = JSON.stringify(newSeq) === JSON.stringify(currentActivity.correct)

            signalsRef.current.responses.push({
                activityId: currentActivity.id,
                type: 'sequence',
                answer: newSeq,
                correct: isCorrect,
                responseTimeMs: Date.now() - activityStartTime,
                timestamp: new Date().toISOString()
            })

            if (!isCorrect) signalsRef.current.corrections++

            setShowFeedback(isCorrect ? 'correct' : 'wrong')
            setMascotMessage(isCorrect ? "Perfect order! 🎉" : "Try again! 💪")

            setTimeout(() => {
                setShowFeedback(null)
                if (isCorrect) goToNext()
                else setSelectedSequence([])
            }, 1500)
        }
    }

    const handleDrawingComplete = () => {
        signalsRef.current.responses.push({
            activityId: currentActivity.id,
            type: 'drawing',
            pathCount: paths.length,
            timestamp: new Date().toISOString()
        })

        setMascotMessage("Beautiful drawing! 🎨")
        setTimeout(handleComplete, 1500)
    }

    const handleComplete = useCallback(() => {
        setMascotMessage(MASCOT_MESSAGES.complete[0])

        // Stop camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }

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
                hesitationCount: signalsRef.current.hesitationEvents.length,
                stressIndicatorCount: signalsRef.current.stressIndicators.length,
                faceDataPoints: signalsRef.current.faceData.length,
                voiceDataPoints: signalsRef.current.voiceData.length
            }
        }

        localStorage.setItem('adhara_session_complete', JSON.stringify(finalSignals))

        const history = JSON.parse(localStorage.getItem('adhara_sessions_history') || '[]')
        history.push(finalSignals)
        localStorage.setItem('adhara_sessions_history', JSON.stringify(history))

        console.log('Session saved:', finalSignals)

        setTimeout(() => navigate('/play/complete'), 2000)
    }, [childData, navigate])

    // Drawing handlers
    const handlePointerDown = (e) => {
        if (!currentActivity?.isDrawing) return
        setIsDrawing(true)
        const pos = getPos(e)
        setCurrentPath([pos])
    }

    const handlePointerMove = (e) => {
        if (!isDrawing) return
        const pos = getPos(e)
        setCurrentPath(p => [...p, pos])
    }

    const handlePointerUp = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        if (currentPath.length > 1) {
            setPaths(p => [...p, currentPath])
        }
        setCurrentPath([])
    }

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
            y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
        }
    }

    // Canvas drawing
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

    const renderStars = (count) => (
        Array(count).fill('⭐').map((star, i) => (
            <span key={i} className="counting-star" style={{ animationDelay: `${i * 0.1}s` }}>{star}</span>
        ))
    )

    return (
        <div className="child-activity">
            {/* Camera preview (small, in corner) */}
            {cameraEnabled && (
                <div className="camera-preview">
                    <video ref={videoRef} autoPlay muted playsInline />
                    <div className="camera-indicator">📹</div>
                </div>
            )}

            {/* Tracking stats */}
            <div className="tracking-indicator">
                🔴 {signalsRef.current.mouseMovements} moves |
                {cameraEnabled ? ' 📹 On' : ' 📹 Off'} |
                {signalsRef.current.stressIndicators.length > 0 ? ' ⚠️' : ' ✅'}
            </div>

            {/* Mascot */}
            <div className="activity-mascot">
                <div className="mascot-bubble"><p>{mascotMessage}</p></div>
                <span className="mascot-emoji">🐻</span>
            </div>

            {/* Progress */}
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((currentIndex + 1) / ACTIVITIES.length) * 100}%` }} />
                <span className="progress-text">{currentIndex + 1}/{ACTIVITIES.length}</span>
            </div>

            {/* Activity Content */}
            <div className={`activity-content ${showFeedback || ''}`}>
                {currentActivity && (
                    <>
                        <h2 className="activity-question">{currentActivity.question}</h2>

                        {/* COUNTING */}
                        {currentActivity.type === 'counting' && (
                            <>
                                <div className="counting-display">{renderStars(currentActivity.count)}</div>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* LETTER */}
                        {currentActivity.type === 'letter' && (
                            <>
                                <div className="letter-display">{currentActivity.showLetter}</div>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button letter-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* PATTERN */}
                        {currentActivity.type === 'pattern' && (
                            <div className="options-grid">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button emoji-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* VERBAL */}
                        {currentActivity.type === 'verbal' && (
                            <div className="verbal-activity">
                                <div className="word-display">{currentActivity.word}</div>
                                <p className="verbal-instruction">{currentActivity.instruction}</p>
                                {!isListening ? (
                                    <button className="mic-button" onClick={startListening}>🎤 Start Speaking</button>
                                ) : (
                                    <div className="listening-indicator">
                                        <span className="pulse">🎤</span> Listening...
                                    </div>
                                )}
                                {voiceResult && (
                                    <div className="voice-result">
                                        <p>You said: "{voiceResult}"</p>
                                        <button className="done-button" onClick={submitVerbal}>Next ➡️</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEQUENCE */}
                        {currentActivity.type === 'sequence' && (
                            <div className="sequence-activity">
                                <div className="sequence-items">
                                    {currentActivity.items.map((num, i) => (
                                        <button
                                            key={i}
                                            className={`sequence-item ${selectedSequence.includes(num) ? 'selected' : ''}`}
                                            onClick={() => handleSequenceClick(num)}
                                            disabled={selectedSequence.includes(num) || showFeedback}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="sequence-answer">
                                    Order: {selectedSequence.length > 0 ? selectedSequence.join(' → ') : '(click numbers in order)'}
                                </div>
                            </div>
                        )}

                        {/* PUZZLE */}
                        {currentActivity.type === 'puzzle' && (
                            <div className="puzzle-activity">
                                <div className="puzzle-grid">
                                    {currentActivity.pattern.map((cell, i) => (
                                        <span key={i} className={`puzzle-cell ${cell === '❓' ? 'missing' : ''}`}>{cell}</span>
                                    ))}
                                </div>
                                <p>Which piece fills the ❓?</p>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button emoji-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MATH */}
                        {currentActivity.type === 'math' && (
                            <div className="options-grid">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* MATCHING */}
                        {currentActivity.type === 'matching' && (
                            <div className="matching-activity">
                                <div className="shapes-row">
                                    {currentActivity.shapes.map((shape, i) => (
                                        <span key={i} className="shape-item">{i + 1}. {shape}</span>
                                    ))}
                                </div>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>
                                            {currentActivity.optionLabels[i]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* DRAWING */}
                        {currentActivity.isDrawing && (
                            <div className="drawing-section">
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
                                <button className="done-button" onClick={handleDrawingComplete} disabled={paths.length === 0}>Done! ✨</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Feedback overlay */}
            {showFeedback === 'correct' && (
                <div className="feedback-overlay correct"><span className="feedback-emoji">🎉</span></div>
            )}
        </div>
    )
}

export default ChildActivity
