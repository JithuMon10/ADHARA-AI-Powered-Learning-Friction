import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildComplete.css'

/**
 * Child Completion Screen - Only shows "Great job!"
 * No analysis or results shown to children
 */
function ChildComplete() {
    const navigate = useNavigate()
    const [childData, setChildData] = useState(null)
    const [showConfetti, setShowConfetti] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('adhara_child')
        if (stored) {
            setChildData(JSON.parse(stored))
        }

        // Hide confetti after animation
        const timer = setTimeout(() => setShowConfetti(false), 5000)
        return () => clearTimeout(timer)
    }, [])

    const handlePlayAgain = () => {
        localStorage.removeItem('adhara_child')
        localStorage.removeItem('adhara_session_signals')
        localStorage.removeItem('adhara_session_complete')
        navigate('/play')
    }

    return (
        <div className="child-complete">
            {/* Confetti */}
            {showConfetti && (
                <div className="confetti-container">
                    {Array(30).fill(null).map((_, i) => (
                        <span
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#AA96DA'][Math.floor(Math.random() * 5)]
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="complete-content">
                {/* Trophy */}
                <div className="trophy">
                    <span className="trophy-emoji">🏆</span>
                </div>

                {/* Message */}
                <h1 className="complete-title">Great Job!</h1>
                <p className="complete-subtitle">
                    {childData?.name ? `${childData.name}, you're a` : "You're a"} superstar! ⭐
                </p>

                {/* Stars */}
                <div className="stars-row">
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                </div>

                {/* Mascot goodbye */}
                <div className="mascot-goodbye">
                    <span className="mascot-emoji">🐻</span>
                    <div className="speech-bubble">
                        <p>You did amazing! See you next time! 👋</p>
                    </div>
                </div>

                {/* Action */}
                <button className="play-again-button" onClick={handlePlayAgain}>
                    Play Again 🎮
                </button>
            </div>
        </div>
    )
}

export default ChildComplete
