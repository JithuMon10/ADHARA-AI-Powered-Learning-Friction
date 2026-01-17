import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadFaceModels, analyzeFace, FaceAnalysisSession } from '../../utils/faceAnalysis'
import {
    generateBaselineSession,
    generateFollowUpQuestions,
    analyzeBaselineForAI,
    generateClinicalContext,
    MAX_TRIES,
    BASELINE_QUESTION_COUNT
} from '../../utils/questionGenerator'
import { analyzeSession, getScreeningPriority, generateDetectionSummary } from '../../utils/disorderDetection'
import './ChildActivity.css'

/**
 * Child Activity - AI-Powered Early Detection Screening
 * 
 * Features:
 * - Adaptive screening questions based on child's age
 * - Domain-specific activities (dyslexia, dyscalculia, ADHD, auditory, visual)
 * - Follow-up questions when errors detected
 * - Multi-modal tracking (mouse, speech, face)
 * - Disorder pattern analysis
 */

const MASCOT_MESSAGES = {
    start: ["Let's play some games!", "Ready for fun activities?", "Here we go! 🎉"],
    correct: ["Yay! Great job! 🎉", "You're amazing! ⭐", "Wow! 🌟", "Perfect! 👏"],
    wrong: ["Good try! 💪", "Almost! 🌈", "You can do it! 🎈"],
    next: ["Here's another one!", "Let's try this!", "You're doing great! 🌟"],
    listening: ["I'm listening! 🎤", "Say it clearly! 👂"],
    complete: ["All done! You're a superstar! ⭐🌟⭐"],
    screening: ["Let's see how you learn best! 🧠", "These games help us understand you better! 🎯"]
}

// Filler words and stammers to detect
const FILLER_PATTERNS = ['um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh', 'like', 'you know', 'well', 'so']
const STAMMER_PATTERN = /\b(\w)\1+(?:\s+\1+)*\b|\b(\w+)\s+\2\b/gi // Detects "b-b-ball" or "the the"

// ============ SUB-COMPONENTS FOR COMPLEX ACTIVITIES ============

/**
 * Impulse Control Activity - Go/No-Go task
 * Child clicks ONLY when target (star) appears
 */
function ImpulseControlActivity({ activity, onComplete }) {
    const [currentItem, setCurrentItem] = useState(null)
    const [itemIndex, setItemIndex] = useState(0)
    const [correctClicks, setCorrectClicks] = useState(0)
    const [wrongClicks, setWrongClicks] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [showClickFeedback, setShowClickFeedback] = useState(null)

    useEffect(() => {
        if (isComplete) return

        const sequence = activity.sequence || ['🔵', '⭐', '🔺', '⭐', '🟢', '⭐', '🔷']

        if (itemIndex < sequence.length) {
            // Show item
            setCurrentItem(sequence[itemIndex])

            // Move to next after delay
            const timer = setTimeout(() => {
                setCurrentItem(null)
                setItemIndex(prev => prev + 1)
            }, 1200)

            return () => clearTimeout(timer)
        } else {
            // All done
            setIsComplete(true)
            onComplete(correctClicks)
        }
    }, [itemIndex, isComplete])

    const handleClick = () => {
        const targetEmoji = activity.sequence?.includes('⭐') ? '⭐' :
            activity.sequence?.includes('🔴') ? '🔴' :
                activity.sequence?.includes('❤️') ? '❤️' : '⭐'

        if (currentItem === targetEmoji) {
            setCorrectClicks(prev => prev + 1)
            setShowClickFeedback('correct')
        } else if (currentItem) {
            setWrongClicks(prev => prev + 1)
            setShowClickFeedback('wrong')
        }

        setTimeout(() => setShowClickFeedback(null), 300)
    }

    if (isComplete) {
        return <div className="impulse-complete">Done! You got {correctClicks} correct! 🎯</div>
    }

    return (
        <div className="impulse-activity" onClick={handleClick}>
            <div className={`impulse-display ${showClickFeedback || ''}`}>
                {currentItem ? (
                    <span className="impulse-item">{currentItem}</span>
                ) : (
                    <span className="impulse-waiting">Wait...</span>
                )}
            </div>
            <p className="impulse-instruction">👆 Tap when you see the target!</p>
            <div className="impulse-score">
                Correct: {correctClicks} | Wrong clicks: {wrongClicks}
            </div>
        </div>
    )
}

/**
 * Sustained Attention Activity - Count appearing targets
 */
function SustainedAttentionActivity({ activity, onComplete }) {
    const [count, setCount] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [showTarget, setShowTarget] = useState(false)
    const [targetCount, setTargetCount] = useState(0)

    useEffect(() => {
        if (isComplete) return

        let shown = 0
        const totalTargets = activity.targetCount || 5
        const duration = activity.duration || 15000
        const interval = duration / (totalTargets * 2)

        const showInterval = setInterval(() => {
            if (shown < totalTargets) {
                setShowTarget(true)
                shown++
                setTargetCount(shown)

                setTimeout(() => setShowTarget(false), 800)
            } else {
                clearInterval(showInterval)
                setIsComplete(true)
            }
        }, interval)

        return () => clearInterval(showInterval)
    }, [])

    const handleCountClick = () => setCount(prev => prev + 1)

    if (isComplete) {
        return (
            <div className="sustained-complete">
                <p>How many did you count?</p>
                <div className="count-buttons">
                    {[...Array(10)].map((_, i) => (
                        <button key={i} className="count-button" onClick={() => onComplete(i + 1)}>
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="sustained-activity">
            <div className="sustained-display" onClick={handleCountClick}>
                {showTarget ? (
                    <span className="sustained-target">🔴</span>
                ) : (
                    <span className="sustained-wait">👀</span>
                )}
            </div>
            <p>Watch for red circles! Count them in your head.</p>
        </div>
    )
}

/**
 * Visual Memory Activity - Remember and recall sequence
 */
function VisualMemoryActivity({ activity, onComplete }) {
    const [phase, setPhase] = useState('show') // 'show' or 'recall'
    const [timeLeft, setTimeLeft] = useState(Math.ceil((activity.hideAfter || 3000) / 1000))

    useEffect(() => {
        const hideAfter = activity.hideAfter || 3000

        // Countdown
        const countdownInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Hide after delay
        const timer = setTimeout(() => {
            setPhase('recall')
        }, hideAfter)

        return () => {
            clearTimeout(timer)
            clearInterval(countdownInterval)
        }
    }, [])

    if (phase === 'show') {
        return (
            <div className="visual-memory-show">
                <p>Remember this! ({timeLeft}s)</p>
                <div className="memory-sequence-display">
                    {activity.showFirst.map((item, i) => (
                        <span key={i} className="memory-display-item">{item}</span>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="visual-memory-recall">
            <p>What was the order?</p>
            <div className="options-grid">
                {activity.options.map((opt, i) => (
                    <button key={i} className="option-button sequence-option" onClick={() => onComplete(i)}>
                        {opt.join(' ')}
                    </button>
                ))}
            </div>
        </div>
    )
}

function ChildActivity() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    // Enhanced speech tracking refs
    const speechAnalysisRef = useRef({
        isRecording: false,
        sessionStartTime: null,
        wordTimestamps: [],
        fillerWords: [],
        stammers: [],
        pauses: [],
        totalWordsSpoken: 0,
        lastWordTime: null,
        continuousTranscript: '',
        speechSegments: [],
        silenceStartTime: null,
        totalSpeakingTime: 0,
        totalSilenceTime: 0
    })

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
        stressIndicators: [],
        // Enhanced speech metrics
        speechAnalysis: {
            speechRateWPM: 0,
            avgPauseDurationMs: 0,
            fillerWordCount: 0,
            stammerCount: 0,
            silenceRatio: 0,
            selfCorrections: 0,
            wordTimestamps: [],
            detectedFillers: [],
            detectedStammers: [],
            pauseDetails: []
        }
    })

    const [currentIndex, setCurrentIndex] = useState(0)
    const [mascotMessage, setMascotMessage] = useState(MASCOT_MESSAGES.start[0])
    const [showFeedback, setShowFeedback] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [paths, setPaths] = useState([])
    const [currentPath, setCurrentPath] = useState([])
    const [childData, setChildData] = useState(null)
    const [activityStartTime, setActivityStartTime] = useState(Date.now())

    // Face tracking with emotion detection
    const [cameraEnabled, setCameraEnabled] = useState(false)
    const [cameraError, setCameraError] = useState(null)
    const [faceModelsLoaded, setFaceModelsLoaded] = useState(false)
    const [currentEmotion, setCurrentEmotion] = useState('loading...')
    const [faceStats, setFaceStats] = useState({ blinks: 0, gazeOnScreen: 0, emotion: 'neutral' })
    const faceAnalysisSessionRef = useRef(new FaceAnalysisSession())
    const faceTrackingIntervalRef = useRef(null)

    // Voice tracking  
    const [isListening, setIsListening] = useState(false)
    const [voiceResult, setVoiceResult] = useState('')
    const [isContinuousRecording, setIsContinuousRecording] = useState(false)
    const [speechStats, setSpeechStats] = useState({ words: 0, fillers: 0, pauses: 0 })
    const recognitionRef = useRef(null)

    // Sequence activity state
    const [selectedSequence, setSelectedSequence] = useState([])

    // Adaptive session state
    const [activities, setActivities] = useState([])
    const [sessionPhase, setSessionPhase] = useState('baseline') // 'baseline' | 'analyzing' | 'followup' | 'complete'
    const [aiAnalysis, setAiAnalysis] = useState(null)
    const [baselineComplete, setBaselineComplete] = useState(false)

    // Load child data and initialize with BASELINE questions only
    useEffect(() => {
        const stored = localStorage.getItem('adhara_child')
        if (stored) {
            const data = JSON.parse(stored)
            setChildData(data)
            setMascotMessage(`Hi ${data.name}! ${MASCOT_MESSAGES.screening[0]}`)
            signalsRef.current.startTime = data.sessionId || Date.now()

            // Start with BASELINE questions only (5-7 questions)
            const baselineActivities = generateBaselineSession()
            setActivities(baselineActivities)
            setSessionPhase('baseline')
            console.log(`🧠 ADHARA: Starting with ${baselineActivities.length} baseline questions`)
        }

        localStorage.removeItem('adhara_session_complete')

        // Initialize camera
        initCamera()

        // Initialize enhanced speech recognition and auto-start recording
        initEnhancedSpeechRecognition()

        // Auto-start continuous recording after a short delay
        setTimeout(() => {
            startContinuousRecording()
        }, 2000)

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            if (faceTrackingIntervalRef.current) {
                clearInterval(faceTrackingIntervalRef.current)
            }
            stopContinuousRecording()
        }
    }, [])

    // Initialize camera and face-api.js models
    const initCamera = async () => {
        try {
            // Load face-api.js models first
            setCurrentEmotion('Loading AI...')
            const modelsLoaded = await loadFaceModels()
            setFaceModelsLoaded(modelsLoaded)

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play()
                    if (modelsLoaded) {
                        startAdvancedFaceTracking()
                    } else {
                        startBasicFaceTracking()
                    }
                }
            }
            setCameraEnabled(true)
            setCurrentEmotion('Ready')
        } catch (err) {
            console.log('Camera not available:', err.message)
            setCameraError('Camera not available')
            setCurrentEmotion('No camera')
        }
    }

    // Advanced face tracking with emotion detection
    const startAdvancedFaceTracking = () => {
        faceAnalysisSessionRef.current.reset()

        faceTrackingIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !cameraEnabled || !faceModelsLoaded) return

            try {
                const analysis = await analyzeFace(videoRef.current)

                if (analysis) {
                    faceAnalysisSessionRef.current.addSample(analysis)

                    if (analysis.faceDetected) {
                        // Update current emotion
                        setCurrentEmotion(analysis.emotions.dominant)

                        // Update stats display
                        const summary = faceAnalysisSessionRef.current.getSummary()
                        setFaceStats({
                            blinks: summary.blinkCount,
                            gazeOnScreen: summary.gazeOnScreenPercent,
                            emotion: analysis.emotions.dominant
                        })

                        // Store detailed face data
                        signalsRef.current.faceData.push({
                            timestamp: analysis.timestamp,
                            present: true,
                            activity: activities[currentIndex]?.type,
                            emotion: analysis.emotions.dominant,
                            emotionConfidence: analysis.emotions.confidence,
                            allEmotions: analysis.emotions.all,
                            isBlinking: analysis.blink.isBlinking,
                            eyeAspectRatio: analysis.blink.avgEAR,
                            headPose: analysis.headPose,
                            gaze: analysis.gaze,
                            isLookingAtScreen: analysis.gaze.isLookingAtScreen
                        })

                        // Detect stress indicators from face
                        if (['angry', 'fearful', 'sad', 'disgusted'].includes(analysis.emotions.dominant) &&
                            analysis.emotions.confidence > 0.5) {
                            signalsRef.current.stressIndicators.push({
                                type: 'negative_emotion',
                                emotion: analysis.emotions.dominant,
                                confidence: analysis.emotions.confidence,
                                timestamp: Date.now(),
                                activity: activities[currentIndex]?.id
                            })
                        }

                        // Detect looking away (attention drift)
                        if (!analysis.gaze.isLookingAtScreen) {
                            signalsRef.current.stressIndicators.push({
                                type: 'looking_away',
                                gazeOffset: { x: analysis.gaze.offsetX, y: analysis.gaze.offsetY },
                                timestamp: Date.now(),
                                activity: activities[currentIndex]?.id
                            })
                        }
                    } else {
                        setCurrentEmotion('No face')
                        signalsRef.current.faceData.push({
                            timestamp: Date.now(),
                            present: false,
                            activity: activities[currentIndex]?.type
                        })
                    }
                }
            } catch (err) {
                console.log('Face analysis error:', err)
            }
        }, 1000) // Analyze every 1 second
    }

    // Basic face tracking fallback (no models)
    const startBasicFaceTracking = () => {
        setInterval(() => {
            if (videoRef.current && cameraEnabled) {
                signalsRef.current.faceData.push({
                    timestamp: Date.now(),
                    present: true,
                    activity: activities[currentIndex]?.type
                })
            }
        }, 3000)
    }

    // ========== ENHANCED SPEECH RECOGNITION ==========

    // Detect fillers in text
    const detectFillers = (text) => {
        const lowerText = text.toLowerCase()
        const found = []
        FILLER_PATTERNS.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi')
            const matches = lowerText.match(regex)
            if (matches) {
                matches.forEach(() => {
                    found.push({
                        word: filler,
                        timestamp: Date.now(),
                        activity: activities[currentIndex]?.id
                    })
                })
            }
        })
        return found
    }

    // Detect stammers in text
    const detectStammers = (text) => {
        const found = []
        const matches = text.match(STAMMER_PATTERN)
        if (matches) {
            matches.forEach(match => {
                found.push({
                    pattern: match,
                    timestamp: Date.now(),
                    activity: activities[currentIndex]?.id
                })
            })
        }
        // Also detect repeated syllables like "ba-ba-ball"
        const syllableRepeat = text.match(/\b(\w{1,3})-\1+/gi)
        if (syllableRepeat) {
            syllableRepeat.forEach(match => {
                found.push({
                    pattern: match,
                    type: 'syllable_repeat',
                    timestamp: Date.now(),
                    activity: activities[currentIndex]?.id
                })
            })
        }
        return found
    }

    // Detect self-corrections
    const detectSelfCorrections = (text) => {
        const patterns = [
            /\b(I mean|wait|no|actually|sorry|I meant)\b/gi,
            /\b(\w+)\s+no\s+(\w+)\b/gi // "red no blue"
        ]
        let count = 0
        patterns.forEach(pattern => {
            const matches = text.match(pattern)
            if (matches) count += matches.length
        })
        return count
    }

    // Process speech segment
    const processSpeechSegment = (transcript, confidence, isFinal) => {
        const now = Date.now()
        const speechRef = speechAnalysisRef.current

        if (!speechRef.sessionStartTime) {
            speechRef.sessionStartTime = now
        }

        // Calculate pause duration since last word
        if (speechRef.lastWordTime) {
            const pauseDuration = now - speechRef.lastWordTime
            if (pauseDuration > 500) { // Pause > 500ms is significant
                speechRef.pauses.push({
                    durationMs: pauseDuration,
                    timestamp: now,
                    activity: activities[currentIndex]?.id,
                    beforeText: transcript.substring(0, 30)
                })
                signalsRef.current.speechAnalysis.pauseDetails.push({
                    durationMs: pauseDuration,
                    timestamp: now
                })
            }
        }

        // Count words
        const words = transcript.trim().split(/\s+/).filter(w => w.length > 0)
        const wordCount = words.length

        // Record word timestamps
        words.forEach((word, i) => {
            speechRef.wordTimestamps.push({
                word: word.toLowerCase(),
                timestamp: now + (i * 100), // Approximate timing
                confidence
            })
        })

        // Detect fillers
        const fillers = detectFillers(transcript)
        if (fillers.length > 0) {
            speechRef.fillerWords.push(...fillers)
            signalsRef.current.speechAnalysis.detectedFillers.push(...fillers)
            signalsRef.current.speechAnalysis.fillerWordCount += fillers.length
        }

        // Detect stammers
        const stammers = detectStammers(transcript)
        if (stammers.length > 0) {
            speechRef.stammers.push(...stammers)
            signalsRef.current.speechAnalysis.detectedStammers.push(...stammers)
            signalsRef.current.speechAnalysis.stammerCount += stammers.length
        }

        // Detect self-corrections
        const corrections = detectSelfCorrections(transcript)
        signalsRef.current.speechAnalysis.selfCorrections += corrections

        // Update counts
        speechRef.totalWordsSpoken += wordCount
        speechRef.lastWordTime = now
        speechRef.continuousTranscript += ' ' + transcript

        // Calculate running stats
        const sessionDuration = (now - speechRef.sessionStartTime) / 1000 / 60 // minutes
        if (sessionDuration > 0) {
            signalsRef.current.speechAnalysis.speechRateWPM = Math.round(speechRef.totalWordsSpoken / sessionDuration)
        }

        // Average pause duration
        if (speechRef.pauses.length > 0) {
            const avgPause = speechRef.pauses.reduce((sum, p) => sum + p.durationMs, 0) / speechRef.pauses.length
            signalsRef.current.speechAnalysis.avgPauseDurationMs = Math.round(avgPause)
        }

        // Update UI stats
        setSpeechStats({
            words: speechRef.totalWordsSpoken,
            fillers: signalsRef.current.speechAnalysis.fillerWordCount,
            pauses: speechRef.pauses.length
        })

        // Record segment if final
        if (isFinal) {
            speechRef.speechSegments.push({
                transcript,
                confidence,
                timestamp: now,
                wordCount,
                fillersFound: fillers.length,
                stammersFound: stammers.length,
                activity: activities[currentIndex]?.id
            })

            signalsRef.current.voiceData.push({
                timestamp: now,
                transcript,
                confidence,
                activity: activities[currentIndex]?.type,
                analysis: {
                    wordCount,
                    fillers: fillers.length,
                    stammers: stammers.length,
                    pausesBefore: speechRef.pauses.length > 0 ? speechRef.pauses[speechRef.pauses.length - 1].durationMs : 0
                }
            })
        }
    }

    // Initialize enhanced speech recognition with continuous mode
    const initEnhancedSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()

            // Enable continuous listening
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'
            recognition.maxAlternatives = 1

            recognition.onresult = (event) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    const transcript = result[0].transcript
                    const confidence = result[0].confidence || 0

                    if (result.isFinal) {
                        finalTranscript += transcript
                        processSpeechSegment(transcript, confidence, true)
                    } else {
                        interimTranscript += transcript
                        // Process interim for real-time analysis
                        processSpeechSegment(transcript, confidence, false)
                    }
                }

                setVoiceResult(finalTranscript || interimTranscript)
            }

            recognition.onend = () => {
                // Auto-restart if continuous recording is enabled
                if (isContinuousRecording && recognitionRef.current) {
                    try {
                        recognition.start()
                    } catch (e) {
                        console.log('Speech restart error:', e)
                    }
                } else {
                    setIsListening(false)
                }
            }

            recognition.onerror = (event) => {
                console.log('Speech error:', event.error)
                if (event.error === 'no-speech' && isContinuousRecording) {
                    // Track silence
                    if (!speechAnalysisRef.current.silenceStartTime) {
                        speechAnalysisRef.current.silenceStartTime = Date.now()
                    }
                } else if (event.error !== 'aborted') {
                    setIsListening(false)
                }
            }

            recognition.onspeechend = () => {
                // Track silence periods
                const speechRef = speechAnalysisRef.current
                if (speechRef.lastWordTime) {
                    speechRef.silenceStartTime = Date.now()
                }
            }

            recognition.onspeechstart = () => {
                // Calculate silence duration if we were silent
                const speechRef = speechAnalysisRef.current
                if (speechRef.silenceStartTime) {
                    const silenceDuration = Date.now() - speechRef.silenceStartTime
                    speechRef.totalSilenceTime += silenceDuration
                    speechRef.silenceStartTime = null
                }
            }

            recognitionRef.current = recognition
        }
    }

    // Start continuous recording
    const startContinuousRecording = () => {
        if (recognitionRef.current && !isContinuousRecording) {
            // Prevent double-start
            if (speechAnalysisRef.current.isRecording) {
                console.log('🎤 Already recording, skipping start')
                return
            }

            setIsContinuousRecording(true)
            setIsListening(true)
            speechAnalysisRef.current.sessionStartTime = Date.now()
            speechAnalysisRef.current.isRecording = true

            try {
                recognitionRef.current.start()
                console.log('🎤 Continuous recording started')
            } catch (e) {
                console.log('Speech start error:', e.message)
                // Reset state if start failed
                speechAnalysisRef.current.isRecording = false
            }
        }
    }

    // Stop continuous recording and calculate final metrics
    const stopContinuousRecording = () => {
        if (recognitionRef.current && isContinuousRecording) {
            setIsContinuousRecording(false)
            speechAnalysisRef.current.isRecording = false

            try {
                recognitionRef.current.stop()
            } catch (e) {
                console.log('Speech stop error:', e)
            }

            // Calculate final metrics
            const speechRef = speechAnalysisRef.current
            const totalTime = Date.now() - (speechRef.sessionStartTime || Date.now())
            const speakingTime = totalTime - speechRef.totalSilenceTime

            signalsRef.current.speechAnalysis.silenceRatio = totalTime > 0
                ? (speechRef.totalSilenceTime / totalTime).toFixed(2)
                : 0
            signalsRef.current.speechAnalysis.wordTimestamps = speechRef.wordTimestamps

            console.log('🎤 Recording stopped. Final analysis:', signalsRef.current.speechAnalysis)
        }
    }

    // Single verbal activity speech
    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true)
            setVoiceResult('')
            setMascotMessage(MASCOT_MESSAGES.listening[0])

            // Use single-shot for verbal activities
            recognitionRef.current.continuous = false
            try {
                recognitionRef.current.start()
            } catch (e) {
                console.log('Already listening')
            }
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

                if (timeDelta < 50 && distance > 30) {
                    rapidMoves++
                    if (rapidMoves > 10) {
                        signalsRef.current.stressIndicators.push({
                            type: 'rapid_mouse',
                            timestamp: now,
                            activity: activities[currentIndex]?.id
                        })
                        rapidMoves = 0
                    }
                } else {
                    rapidMoves = Math.max(0, rapidMoves - 1)
                }
            }

            if (now - idleStart > 2000 && distance < 10) {
                signalsRef.current.hesitationEvents.push({
                    timestamp: new Date().toISOString(),
                    activityId: activities[currentIndex]?.id,
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

    // Use dynamic activities from state (or empty if not loaded yet)
    const currentActivity = activities[currentIndex] || null

    // Track tries per question
    const [currentTries, setCurrentTries] = useState(0)
    const MAX_TRIES = 3

    const handleAnswer = useCallback((answer) => {
        const responseTime = Date.now() - activityStartTime
        const isCorrect = answer === currentActivity.correct
        const newTries = currentTries + 1

        // Check if this is the last try or correct
        const isFinalAttempt = newTries >= MAX_TRIES || isCorrect

        signalsRef.current.responses.push({
            activityId: currentActivity.id,
            type: currentActivity.type,
            domain: currentActivity.domain,
            category: currentActivity.category,
            answer,
            correct: isCorrect,
            responseTimeMs: responseTime,
            timestamp: new Date().toISOString(),
            tries: newTries,
            maxTriesReached: newTries >= MAX_TRIES && !isCorrect
        })

        if (!isCorrect) {
            signalsRef.current.corrections++
            if (newTries >= MAX_TRIES) {
                signalsRef.current.stressIndicators.push({
                    type: 'max_tries_reached',
                    timestamp: Date.now(),
                    activity: currentActivity.id,
                    domain: currentActivity.domain
                })
            } else {
                signalsRef.current.stressIndicators.push({
                    type: 'wrong_answer',
                    timestamp: Date.now(),
                    activity: currentActivity.id
                })
            }
        }

        localStorage.setItem('adhara_live_signals', JSON.stringify({
            ...signalsRef.current,
            childData,
            lastUpdate: new Date().toISOString()
        }))

        // Determine feedback message
        let message
        if (isCorrect) {
            message = MASCOT_MESSAGES.correct[Math.floor(Math.random() * MASCOT_MESSAGES.correct.length)]
        } else if (newTries >= MAX_TRIES) {
            message = `That's okay! The answer was "${currentActivity.correct}". Let's try another! 🌟`
        } else {
            message = `${MASCOT_MESSAGES.wrong[Math.floor(Math.random() * MASCOT_MESSAGES.wrong.length)]} (${MAX_TRIES - newTries} ${MAX_TRIES - newTries === 1 ? 'try' : 'tries'} left)`
        }

        setShowFeedback(isCorrect ? 'correct' : 'wrong')
        setMascotMessage(message)
        setCurrentTries(newTries)

        setTimeout(() => {
            setShowFeedback(null)
            if (isFinalAttempt) {
                goToNext()
            }
        }, isCorrect ? 1500 : (newTries >= MAX_TRIES ? 2500 : 1500))
    }, [currentActivity, activityStartTime, childData, currentTries])

    const goToNext = () => {
        const nextIndex = currentIndex + 1

        // Check if we just finished baseline phase and need AI analysis
        if (sessionPhase === 'baseline' && nextIndex >= activities.length) {
            console.log('🧠 ADHARA: Baseline complete, running AI analysis...')
            setSessionPhase('analyzing')
            setMascotMessage("Let me think about what we've learned... 🤔")

            // Collect behavioral data
            const behavioralData = {
                stressRatio: signalsRef.current.stressIndicators.length / Math.max(signalsRef.current.responses.length, 1),
                hesitationCount: signalsRef.current.hesitations?.length || 0,
                totalCorrections: signalsRef.current.corrections || 0
            }

            // Run AI analysis on baseline responses
            const aiRecommendation = analyzeBaselineForAI(signalsRef.current.responses, behavioralData)
            setAiAnalysis(aiRecommendation)
            console.log('🧠 AI Recommendation:', aiRecommendation)

            // If AI recommends follow-up questions, add them
            if (aiRecommendation.continueSession && aiRecommendation.additionalQuestions > 0) {
                const followUpQuestions = generateFollowUpQuestions(aiRecommendation)
                console.log(`🧠 Adding ${followUpQuestions.length} follow-up questions for: ${aiRecommendation.focusDomains.join(', ')}`)

                setTimeout(() => {
                    setActivities(prev => [...prev, ...followUpQuestions])
                    setCurrentIndex(nextIndex)
                    setActivityStartTime(Date.now())
                    setSelectedSequence([])
                    setVoiceResult('')
                    setCurrentTries(0)
                    setSessionPhase('followup')
                    setMascotMessage(`Let's try a few more activities in ${aiRecommendation.focusDomains.join(' and ')}! 🎯`)
                }, 2000) // Show "thinking" message for 2 seconds
            } else {
                // No follow-up needed, session complete
                console.log('🧠 No follow-up needed, session complete!')
                setTimeout(() => {
                    handleComplete()
                }, 1500)
            }
            return
        }

        // Normal progression to next question
        if (nextIndex < activities.length) {
            setCurrentIndex(nextIndex)
            setActivityStartTime(Date.now())
            setSelectedSequence([])
            setVoiceResult('')
            setCurrentTries(0)
            setMascotMessage(MASCOT_MESSAGES.next[Math.floor(Math.random() * MASCOT_MESSAGES.next.length)])
        } else {
            handleComplete()
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

        // Stop face tracking interval
        if (faceTrackingIntervalRef.current) {
            clearInterval(faceTrackingIntervalRef.current)
        }

        // Stop continuous recording and finalize speech analysis
        stopContinuousRecording()

        // Get face analysis summary
        const faceAnalysisSummary = faceAnalysisSessionRef.current.getSummary()

        // Run disorder detection analysis
        const sessionForAnalysis = {
            responses: signalsRef.current.responses,
            summary: {
                avgResponseTime: signalsRef.current.responses.length > 0
                    ? Math.round(signalsRef.current.responses.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / signalsRef.current.responses.length)
                    : 0,
                totalCorrections: signalsRef.current.corrections,
                hesitationCount: signalsRef.current.hesitationEvents.length,
                totalMouseMovements: signalsRef.current.mouseMovements,
                speechAnalysis: signalsRef.current.speechAnalysis,
                faceAnalysis: {
                    gazeStability: faceAnalysisSummary.gazeStability,
                    gazeOnScreenPercent: faceAnalysisSummary.gazeOnScreenPercent
                }
            }
        }

        const disorderAnalysis = analyzeSession(sessionForAnalysis, childData?.age || 8)
        const screeningPriority = getScreeningPriority(disorderAnalysis)

        // Generate clinical context with all data including mid-session AI analysis
        const clinicalContext = generateClinicalContext(
            signalsRef.current.responses,
            aiAnalysis, // Include the mid-session AI recommendation
            {
                stressRatio: faceAnalysisSummary.stressRatio,
                hesitationCount: signalsRef.current.hesitationEvents.length,
                totalCorrections: signalsRef.current.corrections
            }
        )

        console.log('🧠 Final Clinical Context:', clinicalContext)
        console.log('Disorder Detection Analysis:', disorderAnalysis)
        console.log('Screening Priority:', screeningPriority)

        const finalSignals = {
            ...signalsRef.current,
            childData,
            activities,
            sessionPhase, // Include session phase info
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
                voiceDataPoints: signalsRef.current.voiceData.length,
                // Enhanced speech summary
                speechAnalysis: {
                    ...signalsRef.current.speechAnalysis,
                    totalWordsSpoken: speechAnalysisRef.current.totalWordsSpoken,
                    totalPauses: speechAnalysisRef.current.pauses.length,
                    continuousTranscript: speechAnalysisRef.current.continuousTranscript.trim()
                },
                // Enhanced face analysis summary
                faceAnalysis: {
                    blinkCount: faceAnalysisSummary.blinkCount,
                    blinkRatePerMin: faceAnalysisSummary.blinkRatePerMin,
                    facePresencePercent: faceAnalysisSummary.facePresencePercent,
                    gazeStability: faceAnalysisSummary.gazeStability,
                    gazeOnScreenPercent: faceAnalysisSummary.gazeOnScreenPercent,
                    dominantEmotion: faceAnalysisSummary.dominantEmotion,
                    emotionDistribution: faceAnalysisSummary.emotionDistribution,
                    stressRatio: faceAnalysisSummary.stressRatio,
                    recentEmotions: faceAnalysisSummary.recentEmotions
                },
                // Disorder detection results
                disorderDetection: disorderAnalysis,
                screeningPriority: screeningPriority,
                // NEW: Clinical context with mid-session AI analysis
                clinicalContext: clinicalContext,
                aiMidSessionAnalysis: aiAnalysis,
                sessionType: aiAnalysis?.continueSession ? 'ADAPTIVE' : 'BASELINE_ONLY'
            }
        }

        localStorage.setItem('adhara_session_complete', JSON.stringify(finalSignals))

        const history = JSON.parse(localStorage.getItem('adhara_sessions_history') || '[]')
        history.push(finalSignals)
        localStorage.setItem('adhara_sessions_history', JSON.stringify(history))

        console.log('Session saved with face + speech analysis:', {
            speech: finalSignals.summary.speechAnalysis,
            face: finalSignals.summary.faceAnalysis
        })

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
            {/* Camera preview */}
            {cameraEnabled && (
                <div className="camera-preview">
                    <video ref={videoRef} autoPlay muted playsInline />
                    <div className="camera-indicator">📹</div>
                </div>
            )}

            {/* Enhanced tracking stats */}
            <div className="tracking-indicator">
                🔴 {signalsRef.current.mouseMovements} |
                {faceModelsLoaded ? ` 😊 ${currentEmotion}` : ' 📹 ' + (cameraEnabled ? 'On' : 'Off')} |
                👁️ {faceStats.blinks} |
                🎤 {speechStats.words}w {speechStats.fillers}f |
                {signalsRef.current.stressIndicators.length > 0 ? ' ⚠️' : ' ✅'}
            </div>

            {/* Recording indicator (auto-started, no button needed) */}
            {isContinuousRecording && (
                <div className="recording-indicator">
                    <span className="recording-dot">●</span> Recording
                </div>
            )}

            {/* Mascot */}
            <div className="activity-mascot">
                <div className="mascot-bubble"><p>{mascotMessage}</p></div>
                <span className="mascot-emoji">🐻</span>
            </div>

            {/* Progress */}
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((currentIndex + 1) / Math.max(activities.length, 1)) * 100}%` }} />
                <span className="progress-text">{currentIndex + 1}/{activities.length}</span>
            </div>

            {/* Tries indicator */}
            {currentActivity && (
                <div className="tries-indicator">
                    {[...Array(MAX_TRIES)].map((_, i) => (
                        <span key={i} className={`try-dot ${i < currentTries ? 'used' : ''}`}>
                            {i < currentTries ? '✕' : '●'}
                        </span>
                    ))}
                </div>
            )}

            {/* Activity Content */}
            <div className={`activity-content ${showFeedback || ''}`}>
                {currentActivity && (
                    <>
                        <h2 className="activity-question">{currentActivity.question}</h2>

                        {/* COUNTING */}
                        {currentActivity.type === 'counting' && (
                            <>
                                <div className="counting-display">
                                    {currentActivity.displayItems || renderStars(currentActivity.count)}
                                </div>
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

                        {/* RHYMING / SOUND - Word recognition */}
                        {(currentActivity.type === 'rhyming' || currentActivity.type === 'sound' || currentActivity.type === 'soundMatch') && (
                            <>
                                {currentActivity.targetWord && (
                                    <div className="target-word-display">{currentActivity.targetWord}</div>
                                )}
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button word-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* MATH - Simple arithmetic */}
                        {currentActivity.type === 'math' && (
                            <div className="options-grid">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* QUANTITY - Compare groups */}
                        {currentActivity.type === 'quantity' && (
                            <div className="options-grid quantity-options">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button quantity-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* STROOP - Color word test */}
                        {currentActivity.type === 'stroop' && (
                            <>
                                <div className="stroop-display" style={{ color: currentActivity.displayColor }}>
                                    {currentActivity.word}
                                </div>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                    ))}
                                </div>
                            </>
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
                                    {currentActivity.shapes?.map((shape, i) => (
                                        <span key={i} className="shape-item">{i + 1}. {shape}</span>
                                    ))}
                                </div>
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>
                                            {currentActivity.optionLabels?.[i] || opt}
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

                        {/* NUMBER PATTERN */}
                        {currentActivity.type === 'numberPattern' && (
                            <div className="options-grid">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* WORKING MEMORY - Digit span */}
                        {(currentActivity.type === 'workingMemory' || currentActivity.type === 'workingMemoryBackward') && (
                            <>
                                <div className="memory-sequence">
                                    {currentActivity.sequence.map((num, i) => (
                                        <span key={i} className="memory-item">{num}</span>
                                    ))}
                                </div>
                                {currentActivity.type === 'workingMemoryBackward' && (
                                    <p className="memory-instruction">⬅️ Say them BACKWARDS!</p>
                                )}
                                <div className="options-grid">
                                    {currentActivity.options.map((opt, i) => (
                                        <button key={i} className="option-button sequence-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>
                                            {typeof opt === 'string' ? opt : opt.join(' → ')}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* IMPULSE CONTROL - Go/No-Go */}
                        {currentActivity.type === 'impulseControl' && (
                            <ImpulseControlActivity
                                activity={currentActivity}
                                onComplete={(correctClicks) => {
                                    const isCorrect = correctClicks === currentActivity.correctClicks
                                    signalsRef.current.responses.push({
                                        activityId: currentActivity.id,
                                        type: 'impulseControl',
                                        domain: currentActivity.domain,
                                        correctClicks,
                                        expected: currentActivity.correctClicks,
                                        correct: isCorrect,
                                        timestamp: new Date().toISOString()
                                    })
                                    setShowFeedback(isCorrect ? 'correct' : 'wrong')
                                    setMascotMessage(isCorrect ? 'Great focus! 🎯' : 'Good try! Keep practicing! 💪')
                                    setTimeout(() => {
                                        setShowFeedback(null)
                                        goToNext()
                                    }, 1500)
                                }}
                            />
                        )}

                        {/* RAPID NAMING - Timed picture naming */}
                        {currentActivity.type === 'rapidNaming' && (
                            <div className="verbal-activity">
                                <div className="rapid-naming-grid">
                                    {currentActivity.images.map((img, i) => (
                                        <span key={i} className="rapid-image">{img}</span>
                                    ))}
                                </div>
                                <p className="verbal-instruction">{currentActivity.instruction}</p>
                                {!isListening ? (
                                    <button className="mic-button" onClick={startListening}>🎤 Start Naming</button>
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

                        {/* MIRROR - Rotation/reflection */}
                        {currentActivity.type === 'mirror' && (
                            <div className="options-grid">
                                {currentActivity.options.map((opt, i) => (
                                    <button key={i} className="option-button emoji-option" onClick={() => handleAnswer(opt)} disabled={showFeedback}>{opt}</button>
                                ))}
                            </div>
                        )}

                        {/* INSTRUCTION - Following verbal instructions */}
                        {currentActivity.type === 'instruction' && (
                            <div className="instruction-activity">
                                <p className="instruction-text">{currentActivity.instruction}</p>
                                <button className="done-button" onClick={goToNext}>I did it! ✅</button>
                            </div>
                        )}

                        {/* SUSTAINED ATTENTION - Count targets */}
                        {currentActivity.type === 'sustainedAttention' && (
                            <SustainedAttentionActivity
                                activity={currentActivity}
                                onComplete={(count) => {
                                    const isCorrect = count === currentActivity.targetCount
                                    signalsRef.current.responses.push({
                                        activityId: currentActivity.id,
                                        type: 'sustainedAttention',
                                        domain: currentActivity.domain,
                                        count,
                                        expected: currentActivity.targetCount,
                                        correct: isCorrect,
                                        timestamp: new Date().toISOString()
                                    })
                                    setShowFeedback(isCorrect ? 'correct' : 'wrong')
                                    setMascotMessage(isCorrect ? 'Perfect counting! 👀' : `You counted ${count}, but there were ${currentActivity.targetCount}!`)
                                    setTimeout(() => {
                                        setShowFeedback(null)
                                        goToNext()
                                    }, 1500)
                                }}
                            />
                        )}

                        {/* VISUAL MEMORY - Remember sequence */}
                        {currentActivity.type === 'visualMemory' && (
                            <VisualMemoryActivity
                                activity={currentActivity}
                                onComplete={(selectedIndex) => {
                                    const isCorrect = selectedIndex === currentActivity.correct
                                    handleAnswer(selectedIndex)
                                }}
                            />
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
