import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Square, Clock, BookOpen, CheckCircle } from 'lucide-react'
import { useMouseTracker } from '../../hooks/useMouseTracker'
import { LiveMetricsBar } from '../../components/Tracking/MouseMetrics'

// Sample reading passages for demo
const READING_PASSAGES = [
    {
        id: 1,
        title: 'The Water Cycle',
        level: 'Grade 4-5',
        content: `Water is always moving around Earth. This movement is called the water cycle. 

The sun heats water in oceans, lakes, and rivers. The warm water turns into water vapor and rises into the air. This is called evaporation.

High in the sky, the water vapor cools down and turns back into tiny water droplets. These droplets form clouds. This process is called condensation.

When the clouds get heavy with water, the droplets fall back to Earth as rain, snow, or hail. This is called precipitation.

The water flows into rivers and streams, and eventually back to the ocean. Then the cycle starts all over again.`,
        questions: [
            { id: 1, question: 'What happens when the sun heats water?', options: ['It freezes', 'It evaporates', 'It turns blue', 'It disappears'], correct: 1 },
            { id: 2, question: 'What are clouds made of?', options: ['Smoke', 'Dust', 'Water droplets', 'Air'], correct: 2 },
            { id: 3, question: 'What is precipitation?', options: ['Water rising up', 'Water falling down', 'Water flowing', 'Water freezing'], correct: 1 },
        ],
    },
    {
        id: 2,
        title: 'Photosynthesis',
        level: 'Grade 5-6',
        content: `Plants are amazing because they can make their own food. This process is called photosynthesis.

Plants have special parts in their leaves called chloroplasts. These contain a green substance called chlorophyll, which gives leaves their green color.

During photosynthesis, plants take in carbon dioxide from the air through tiny holes in their leaves. They also absorb water from the soil through their roots.

Using energy from sunlight, the plant combines carbon dioxide and water to make glucose, a type of sugar. This glucose gives the plant energy to grow.

As a bonus, plants release oxygen into the air during photosynthesis. This is the oxygen that we breathe!`,
        questions: [
            { id: 1, question: 'What gives leaves their green color?', options: ['Sunlight', 'Water', 'Chlorophyll', 'Oxygen'], correct: 2 },
            { id: 2, question: 'What do plants make during photosynthesis?', options: ['Protein', 'Glucose', 'Fat', 'Salt'], correct: 1 },
            { id: 3, question: 'What gas do plants release?', options: ['Carbon dioxide', 'Nitrogen', 'Hydrogen', 'Oxygen'], correct: 3 },
        ],
    },
]

function ReadingTask() {
    const navigate = useNavigate()
    const contentRef = useRef(null)

    // State
    const [selectedPassage, setSelectedPassage] = useState(null)
    const [phase, setPhase] = useState('select') // select, reading, questions, complete
    const [answers, setAnswers] = useState({})
    const [startTime, setStartTime] = useState(null)
    const [readingTime, setReadingTime] = useState(0)
    const [ageGroup, setAgeGroup] = useState('9-11')

    // Mouse tracking
    const {
        isTracking,
        startTracking,
        stopTracking,
        results,
        liveMetrics,
        resetTracker,
    } = useMouseTracker(ageGroup)

    // Timer for reading phase
    useEffect(() => {
        let interval
        if (phase === 'reading' && startTime) {
            interval = setInterval(() => {
                setReadingTime(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [phase, startTime])

    // Start reading task
    const handleStartReading = (passage) => {
        setSelectedPassage(passage)
        setPhase('reading')
        setStartTime(Date.now())
        setAnswers({})
        resetTracker()

        // Start tracking after a short delay for DOM to update
        setTimeout(() => {
            if (contentRef.current) {
                startTracking(contentRef.current)
            } else {
                startTracking(document)
            }
        }, 100)
    }

    // Move to questions
    const handleFinishReading = () => {
        setPhase('questions')
    }

    // Answer a question
    const handleAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
    }

    // Complete task
    const handleComplete = () => {
        const trackingResults = stopTracking()
        setPhase('complete')

        // Store results for the results page
        const taskResults = {
            passage: selectedPassage,
            answers,
            readingTime,
            ageGroup,
            mouseTracking: trackingResults,
            timestamp: new Date().toISOString(),
        }

        // Save to localStorage for demo
        localStorage.setItem('adhara_last_result', JSON.stringify(taskResults))
    }

    // Restart
    const handleRestart = () => {
        setPhase('select')
        setSelectedPassage(null)
        setAnswers({})
        setReadingTime(0)
        setStartTime(null)
        resetTracker()
    }

    // Calculate score
    const getScore = () => {
        if (!selectedPassage) return 0
        let correct = 0
        selectedPassage.questions.forEach(q => {
            if (answers[q.id] === q.correct) correct++
        })
        return correct
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={contentRef}>
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/user')}
                    className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Reading Assessment</h1>
                <p className="text-slate-600 mt-1">
                    Complete a reading task while we observe interaction patterns
                </p>
            </div>

            {/* Age Group Selector */}
            {phase === 'select' && (
                <div className="card mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Age Group (for baseline comparison)
                    </label>
                    <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="6-8">6-8 years</option>
                        <option value="9-11">9-11 years</option>
                        <option value="12-14">12-14 years</option>
                        <option value="15+">15+ years</option>
                    </select>
                </div>
            )}

            {/* Phase: Select Passage */}
            {phase === 'select' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Choose a Reading Passage</h2>
                    <div className="grid gap-4">
                        {READING_PASSAGES.map(passage => (
                            <div
                                key={passage.id}
                                className="card card-hover cursor-pointer"
                                onClick={() => handleStartReading(passage)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{passage.title}</h3>
                                        <p className="text-sm text-slate-500">{passage.level} • {passage.questions.length} questions</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600">
                                        <Play className="w-5 h-5" />
                                        <span className="font-medium">Start</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Phase: Reading */}
            {phase === 'reading' && selectedPassage && (
                <div className="space-y-6">
                    {/* Timer Bar */}
                    <div className="card bg-primary-50 border-primary-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-primary-600" />
                                <span className="font-medium text-primary-900">{selectedPassage.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary-700">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">{Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reading Content */}
                    <div className="card">
                        <div className="prose prose-slate max-w-none">
                            {selectedPassage.content.split('\n\n').map((paragraph, i) => (
                                <p key={i} className="text-lg leading-relaxed text-slate-700 mb-4">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Continue Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleFinishReading}
                            className="btn-primary flex items-center gap-2"
                        >
                            I've finished reading
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Phase: Questions */}
            {phase === 'questions' && selectedPassage && (
                <div className="space-y-6">
                    <div className="card bg-amber-50 border-amber-200">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <span className="text-amber-900">
                                Reading time: {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">Answer the Questions</h2>

                    <div className="space-y-6">
                        {selectedPassage.questions.map((q, qIndex) => (
                            <div key={q.id} className="card">
                                <h3 className="font-medium text-slate-900 mb-4">
                                    {qIndex + 1}. {q.question}
                                </h3>
                                <div className="grid gap-2">
                                    {q.options.map((option, oIndex) => (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleAnswer(q.id, oIndex)}
                                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${answers[q.id] === oIndex
                                                ? 'border-primary-500 bg-primary-50 text-primary-900'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleComplete}
                            disabled={Object.keys(answers).length < selectedPassage.questions.length}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Answers
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Phase: Complete - STUDENT SEES ONLY THIS */}
            {phase === 'complete' && (
                <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Task completed.</h2>
                    <p className="text-slate-600 mb-6">Thank you!</p>
                    <button
                        onClick={() => navigate('/user')}
                        className="btn-primary"
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Live Metrics Bar */}
            <LiveMetricsBar metrics={liveMetrics} isTracking={isTracking} />
        </div>
    )
}

export default ReadingTask
