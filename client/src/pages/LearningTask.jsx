import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MousePointer, RotateCcw } from 'lucide-react'
import ReadingTask from '../components/Task/ReadingTask'
import ProgressBar from '../components/Task/ProgressBar'
import { readingPassage } from '../data/mockData'

function LearningTask() {
    const navigate = useNavigate()
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [isActive, setIsActive] = useState(true)
    const [interactions, setInteractions] = useState({
        wordClicks: 0,
        idleTime: 0,
        retries: 0
    })

    // Timer
    useEffect(() => {
        let interval = null
        if (isActive) {
            interval = setInterval(() => {
                setTimeElapsed(time => time + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isActive])

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleWordClick = () => {
        setInteractions(prev => ({
            ...prev,
            wordClicks: prev.wordClicks + 1
        }))
    }

    const handleComplete = (results) => {
        setIsActive(false)

        // Store results in sessionStorage for the results page
        const assessmentData = {
            timeElapsed,
            ...interactions,
            wordClicks: results.wordClicks,
            correctAnswers: results.correctAnswers,
            totalQuestions: readingPassage.questions.length,
            timestamp: new Date().toISOString()
        }

        sessionStorage.setItem('lastAssessment', JSON.stringify(assessmentData))
        navigate('/results/new')
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Learning Assessment</h1>
                <p className="text-slate-600 mt-1">
                    Complete the reading task and answer questions
                </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Time</div>
                        <div className="font-semibold text-slate-900">{formatTime(timeElapsed)}</div>
                    </div>
                </div>

                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <MousePointer className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Hesitations</div>
                        <div className="font-semibold text-slate-900">{interactions.wordClicks}</div>
                    </div>
                </div>

                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Retries</div>
                        <div className="font-semibold text-slate-900">{interactions.retries}</div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
                <ProgressBar current={1} total={2} label="Task Progress" />
            </div>

            {/* Reading Task */}
            <div className="card">
                <ReadingTask
                    passage={readingPassage}
                    onWordClick={handleWordClick}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    )
}

export default LearningTask
