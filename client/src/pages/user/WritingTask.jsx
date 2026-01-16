import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, Pencil } from 'lucide-react'

/**
 * WritingTask - Copy a word and draw a circle
 * 
 * ADHARA silently tracks:
 * - Pointer smoothness
 * - Path efficiency
 * - Re-draw attempts
 * - Hesitation time
 * 
 * Student sees ONLY: "Task completed. Thank you!"
 */

function WritingTask() {
    const navigate = useNavigate()
    const canvasRef = useRef(null)
    const [phase, setPhase] = useState('ready') // ready, drawing, complete
    const [task, setTask] = useState(null)
    const [startTime, setStartTime] = useState(null)

    // IDM (Interaction Dynamics Monitor) signals
    const [signals, setSignals] = useState({
        hesitationTimeMs: 0,
        strokeCount: 0,
        correctionLoops: 0,
        pointerJitter: 0,
        pathEfficiency: 0,
        idleWithMovement: 0,
        totalDistance: 0,
        timestamps: []
    })

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false)
    const [paths, setPaths] = useState([])
    const [currentPath, setCurrentPath] = useState([])
    const [lastPoint, setLastPoint] = useState(null)
    const [lastMoveTime, setLastMoveTime] = useState(null)

    // Tasks
    const TASKS = [
        { id: 1, type: 'copy', prompt: 'Copy this word:', word: 'hello' },
        { id: 2, type: 'circle', prompt: 'Draw a smooth circle' }
    ]

    // Start task
    const handleStart = (selectedTask) => {
        setTask(selectedTask)
        setPhase('drawing')
        setStartTime(Date.now())
        setPaths([])
        setCurrentPath([])
        setSignals({
            hesitationTimeMs: 0,
            strokeCount: 0,
            correctionLoops: 0,
            pointerJitter: 0,
            pathEfficiency: 0,
            idleWithMovement: 0,
            totalDistance: 0,
            timestamps: []
        })
    }

    // Canvas setup
    useEffect(() => {
        if (phase === 'drawing' && canvasRef.current) {
            const canvas = canvasRef.current
            canvas.width = canvas.offsetWidth * 2
            canvas.height = canvas.offsetHeight * 2
            const ctx = canvas.getContext('2d')
            ctx.scale(2, 2)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.strokeStyle = '#1e40af'
            ctx.lineWidth = 3
        }
    }, [phase])

    // Redraw canvas
    useEffect(() => {
        if (!canvasRef.current || phase !== 'drawing') return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw all completed paths
        paths.forEach(path => {
            if (path.length < 2) return
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            path.forEach(p => ctx.lineTo(p.x, p.y))
            ctx.stroke()
        })

        // Draw current path
        if (currentPath.length > 1) {
            ctx.beginPath()
            ctx.moveTo(currentPath[0].x, currentPath[0].y)
            currentPath.forEach(p => ctx.lineTo(p.x, p.y))
            ctx.stroke()
        }
    }, [paths, currentPath, phase])

    // Get pointer position
    const getPos = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
        return { x, y, t: Date.now() }
    }

    // Calculate jitter (sudden direction changes)
    const calculateJitter = (points) => {
        if (points.length < 3) return 0
        let changes = 0
        for (let i = 2; i < points.length; i++) {
            const dx1 = points[i - 1].x - points[i - 2].x
            const dy1 = points[i - 1].y - points[i - 2].y
            const dx2 = points[i].x - points[i - 1].x
            const dy2 = points[i].y - points[i - 1].y
            const cross = dx1 * dy2 - dy1 * dx2
            if (Math.abs(cross) > 5) changes++
        }
        return Math.min(changes / (points.length * 0.3), 1)
    }

    // Handle drawing events
    const handlePointerDown = (e) => {
        setIsDrawing(true)
        const pos = getPos(e)
        setCurrentPath([pos])
        setLastPoint(pos)
        setLastMoveTime(pos.t)

        // Record hesitation (time before first stroke)
        if (signals.strokeCount === 0 && startTime) {
            setSignals(s => ({
                ...s,
                hesitationTimeMs: pos.t - startTime,
                timestamps: [...s.timestamps, { event: 'start', time: pos.t }]
            }))
        }
    }

    const handlePointerMove = (e) => {
        if (!isDrawing) return
        const pos = getPos(e)
        setCurrentPath(p => [...p, pos])

        // Track distance
        if (lastPoint) {
            const dist = Math.sqrt(
                Math.pow(pos.x - lastPoint.x, 2) +
                Math.pow(pos.y - lastPoint.y, 2)
            )
            setSignals(s => ({ ...s, totalDistance: s.totalDistance + dist }))
        }
        setLastPoint(pos)
        setLastMoveTime(pos.t)
    }

    const handlePointerUp = () => {
        if (!isDrawing) return
        setIsDrawing(false)

        if (currentPath.length > 1) {
            setPaths(p => [...p, currentPath])
            const jitter = calculateJitter(currentPath)
            setSignals(s => ({
                ...s,
                strokeCount: s.strokeCount + 1,
                pointerJitter: (s.pointerJitter * s.strokeCount + jitter) / (s.strokeCount + 1),
                timestamps: [...s.timestamps, { event: 'stroke', time: Date.now() }]
            }))
        }
        setCurrentPath([])
    }

    // Clear and try again (counts as correction)
    const handleClear = () => {
        setPaths([])
        setCurrentPath([])
        setSignals(s => ({
            ...s,
            correctionLoops: s.correctionLoops + 1,
            timestamps: [...s.timestamps, { event: 'clear', time: Date.now() }]
        }))
    }

    // Complete task - STUDENT SEES ONLY "Task completed"
    const handleComplete = () => {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Calculate path efficiency (straight line vs actual)
        let straightDist = 0
        if (paths.length > 0 && paths[0].length > 0) {
            const first = paths[0][0]
            const last = paths[paths.length - 1]?.[paths[paths.length - 1].length - 1] || first
            straightDist = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2))
        }
        const efficiency = signals.totalDistance > 0 ? Math.min(straightDist / signals.totalDistance, 1) : 0

        // Aggregate signals (post-task as per constraints)
        const aggregatedSignals = {
            taskType: 'writing',
            taskId: task.id,
            durationMs: duration,
            hesitationTimeMs: signals.hesitationTimeMs,
            strokeCount: signals.strokeCount,
            correctionLoops: signals.correctionLoops,
            pointerJitter: signals.pointerJitter.toFixed(3),
            pathEfficiency: efficiency.toFixed(3),
            totalDistance: Math.round(signals.totalDistance),
            timestamp: new Date().toISOString()
        }

        // Store for teacher dashboard (NOT shown to student)
        const existing = JSON.parse(localStorage.getItem('adhara_session_signals') || '[]')
        existing.push(aggregatedSignals)
        localStorage.setItem('adhara_session_signals', JSON.stringify(existing))

        setPhase('complete')
    }

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
                <h1 className="text-2xl font-bold text-slate-900">Writing Activity</h1>
                <p className="text-slate-600 mt-1">Complete a simple writing activity</p>
            </div>

            {/* Ready Phase - Select Task */}
            {phase === 'ready' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Choose an Activity</h2>
                    <div className="grid gap-4">
                        {TASKS.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleStart(t)}
                                className="card card-hover cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Pencil className="w-5 h-5 text-primary-600" />
                                        <span className="font-medium">{t.prompt} {t.word || ''}</span>
                                    </div>
                                    <Play className="w-5 h-5 text-primary-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Drawing Phase */}
            {phase === 'drawing' && task && (
                <div className="space-y-6">
                    <div className="card bg-primary-50 border-primary-200">
                        <div className="flex items-center gap-3">
                            <Pencil className="w-5 h-5 text-primary-600" />
                            <span className="font-medium text-primary-900">
                                {task.prompt} {task.word && <strong className="text-xl ml-2">{task.word}</strong>}
                            </span>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="card p-0 overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-64 bg-white cursor-crosshair touch-none"
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                            onTouchEnd={handlePointerUp}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button onClick={handleClear} className="btn-secondary">
                            Clear & Try Again
                        </button>
                        <button
                            onClick={handleComplete}
                            className="btn-primary flex items-center gap-2"
                            disabled={paths.length === 0}
                        >
                            Done <CheckCircle className="w-5 h-5" />
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

export default WritingTask
