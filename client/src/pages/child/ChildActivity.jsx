import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadFaceModels, analyzeFace, FaceAnalysisSession } from '../../utils/faceAnalysis'
import './ChildActivity.css'

/**
 * Child Activity - Interactive activities with FULL TRACKING
 * Enhanced: Speech Analysis + Face/Emotion Detection
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

// Filler words and stammers to detect
const FILLER_PATTERNS = ['um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh', 'like', 'you know', 'well', 'so']
const STAMMER_PATTERN = /\b(\w)\1+(?:\s+\1+)*\b|\b(\w+)\s+\2\b/gi // Detects "b-b-ball" or "the the"

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

        // Initialize enhanced speech recognition (continuous)
        initEnhancedSpeechRecognition()

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
                            activity: ACTIVITIES[currentIndex]?.type,
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
                                activity: ACTIVITIES[currentIndex]?.id
                            })
                        }

                        // Detect looking away (attention drift)
                        if (!analysis.gaze.isLookingAtScreen) {
                            signalsRef.current.stressIndicators.push({
                                type: 'looking_away',
                                gazeOffset: { x: analysis.gaze.offsetX, y: analysis.gaze.offsetY },
                                timestamp: Date.now(),
                                activity: ACTIVITIES[currentIndex]?.id
                            })
                        }
                    } else {
                        setCurrentEmotion('No face')
                        signalsRef.current.faceData.push({
                            timestamp: Date.now(),
                            present: false,
                            activity: ACTIVITIES[currentIndex]?.type
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
                    activity: ACTIVITIES[currentIndex]?.type
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
                        activity: ACTIVITIES[currentIndex]?.id
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
                    activity: ACTIVITIES[currentIndex]?.id
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
                    activity: ACTIVITIES[currentIndex]?.id
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
                    activity: ACTIVITIES[currentIndex]?.id,
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
                activity: ACTIVITIES[currentIndex]?.id
            })

            signalsRef.current.voiceData.push({
                timestamp: now,
                transcript,
                confidence,
                activity: ACTIVITIES[currentIndex]?.type,
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
            setIsContinuousRecording(true)
            setIsListening(true)
            speechAnalysisRef.current.sessionStartTime = Date.now()
            speechAnalysisRef.current.isRecording = true

            try {
                recognitionRef.current.start()
                console.log('🎤 Continuous recording started')
            } catch (e) {
                console.log('Speech start error:', e)
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
                            activity: ACTIVITIES[currentIndex]?.id
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
                }
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

            {/* Continuous recording toggle */}
            <div className="recording-controls">
                <button
                    className={`record-toggle ${isContinuousRecording ? 'recording' : ''}`}
                    onClick={isContinuousRecording ? stopContinuousRecording : startContinuousRecording}
                >
                    {isContinuousRecording ? '🔴 Stop Recording' : '⚪ Start Voice Recording'}
                </button>
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
