import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, Hash } from 'lucide-react'

/**
 * NumberTask - Count dots and simple arithmetic
 * 
 * ADHARA silently tracks:
 * - Response latency
 * - Answer changes (indecision)
 * - Time to first interaction
 * 
 * Student sees ONLY: "Task completed. Thank you!"
 */

function NumberTask() {
    const navigate = useNavigate()
    const [phase, setPhase] = useState('ready') // ready, counting, arithmetic, complete
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState({})
    const [startTime, setStartTime] = useState(null)
    const [questionStartTime, setQuestionStartTime] = useState(null)

    // IDM signals (aggregated post-task)
    const [signals, setSignals] = useState({
        hesitationTimes: [],
        responseTimes: [],
        answerChanges: 0,
        timestamps: []
    })

    // Questions
    const QUESTIONS = [
        { id: 1, type: 'count', dots: 8, prompt: 'How many dots do you see?', options: [6, 7, 8, 9] },
        { id: 2, type: 'count', dots: 5, prompt: 'Count the dots:', options: [3, 4, 5, 6] },
        { id: 3, type: 'arithmetic', prompt: 'What is 3 + 2?', options: [4, 5, 6, 7] },
        { id: 4, type: 'arithmetic', prompt: 'What is 8 - 3?', options: [4, 5, 6, 7] },
    ]

    // Start task
    const handleStart = () => {
        setPhase('task')
        setStartTime(Date.now())
        setQuestionStartTime(Date.now())
        setCurrentQ(0)
        setAnswers({})
        setSignals({
            hesitationTimes: [],
            responseTimes: [],
            answerChanges: 0,
            timestamps: [{ event: 'start', time: Date.now() }]
        })
    }

    // Answer question
    const handleAnswer = (questionId, answer) => {
        const now = Date.now()
        const isChange = answers[questionId] !== undefined

        if (isChange) {
            // Track answer changes (indecision)
            setSignals(s => ({
                ...s,
                answerChanges: s.answerChanges + 1,
                timestamps: [...s.timestamps, { event: 'change', qId: questionId, time: now }]
            }))
        } else {
            // Track first response time
            const responseTime = now - questionStartTime
            setSignals(s => ({
                ...s,
                responseTimes: [...s.responseTimes, responseTime],
                timestamps: [...s.timestamps, { event: 'answer', qId: questionId, time: now }]
            }))
        }

        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    // Next question
    const handleNext = () => {
        if (currentQ < QUESTIONS.length - 1) {
            setCurrentQ(currentQ + 1)
            setQuestionStartTime(Date.now())
        } else {
            handleComplete()
        }
    }

    // Complete - aggregate signals, store for teacher
    const handleComplete = () => {
        const endTime = Date.now()

        // Calculate aggregate metrics
        const avgResponseTime = signals.responseTimes.length > 0
            ? signals.responseTimes.reduce((a, b) => a + b, 0) / signals.responseTimes.length
            : 0

        const aggregatedSignals = {
            taskType: 'number',
            durationMs: endTime - startTime,
            avgResponseTimeMs: Math.round(avgResponseTime),
            answerChanges: signals.answerChanges,
            questionsAnswered: Object.keys(answers).length,
            totalQuestions: QUESTIONS.length,
            timestamp: new Date().toISOString()
        }

        // Store for teacher dashboard (NOT shown to student)
        const existing = JSON.parse(localStorage.getItem('adhara_session_signals') || '[]')
        existing.push(aggregatedSignals)
        localStorage.setItem('adhara_session_signals', JSON.stringify(existing))

        setPhase('complete')
    }

    // Generate dots
    const renderDots = (count) => {
        const dots = []
        for (let i = 0; i < count; i++) {
            const style = {
                left: `${15 + (i % 4) * 22}%`,
                top: `${20 + Math.floor(i / 4) * 35}%`
            }
            dots.push(
                <div
                    key={i}
                    className="absolute w-8 h-8 bg-primary-500 rounded-full"
                    style={style}
                />
            )
        }
        return dots
    }

    const question = QUESTIONS[currentQ]

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/user')}
                    className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Number Activity</h1>
                <p className="text-slate-600 mt-1">Complete simple counting and math activities</p>
            </div>

            {/* Ready Phase */}
            {phase === 'ready' && (
                <div className="card text-center py-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Hash className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to Start?</h2>
                    <p className="text-slate-600 mb-6">
                        You'll count dots and answer simple math questions.
                    </p>
                    <button onClick={handleStart} className="btn-primary flex items-center gap-2 mx-auto">
                        <Play className="w-5 h-5" /> Start Activity
                    </button>
                </div>
            )}

            {/* Task Phase */}
            {phase === 'task' && question && (
                <div className="space-y-6">
                    {/* Progress */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all"
                                style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">{question.prompt}</h3>

                        {/* Dots for counting */}
                        {question.type === 'count' && (
                            <div className="relative w-full h-40 bg-slate-50 rounded-lg mb-6">
                                {renderDots(question.dots)}
                            </div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-3">
                            {question.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(question.id, opt)}
                                    className={`p-4 rounded-lg border-2 font-bold text-xl transition-all ${answers[question.id] === opt
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={answers[question.id] === undefined}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            {currentQ < QUESTIONS.length - 1 ? 'Next' : 'Finish'}
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Complete Phase - STUDENT SEES ONLY THIS */}
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
        </div>
    )
}

export default NumberTask
