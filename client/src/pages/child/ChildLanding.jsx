import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildLanding.css'

/**
 * Child Landing Page - CocomeloN-style animated start screen
 * Colorful, bouncy, friendly - designed for kids
 */
function ChildLanding() {
    const navigate = useNavigate()
    const [isAnimating, setIsAnimating] = useState(false)
    const [showStars, setShowStars] = useState(false)

    useEffect(() => {
        // Create floating bubbles/stars animation
        const interval = setInterval(() => {
            setShowStars(prev => !prev)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    const handleStart = () => {
        setIsAnimating(true)
        // Play a fun sound effect (optional in real implementation)
        setTimeout(() => {
            navigate('/play/register')
        }, 600)
    }

    const handleAdminClick = () => {
        navigate('/admin-login')
    }

    return (
        <div className="child-landing">
            {/* Floating decorations */}
            <div className="decorations">
                <span className="star star-1">⭐</span>
                <span className="star star-2">🌟</span>
                <span className="star star-3">✨</span>
                <span className="cloud cloud-1">☁️</span>
                <span className="cloud cloud-2">☁️</span>
                <span className="rainbow">🌈</span>
            </div>

            {/* Admin corner button */}
            <button
                className="admin-corner"
                onClick={handleAdminClick}
            >
                👩‍🏫
            </button>

            {/* Main content */}
            <div className="landing-content">
                {/* Mascot */}
                <div className="mascot">
                    <span className="mascot-emoji">🦋</span>
                </div>

                {/* Title with fun font */}
                <h1 className="title">
                    <span className="letter" style={{ '--delay': '0' }}>A</span>
                    <span className="letter" style={{ '--delay': '1' }}>D</span>
                    <span className="letter" style={{ '--delay': '2' }}>H</span>
                    <span className="letter" style={{ '--delay': '3' }}>A</span>
                    <span className="letter" style={{ '--delay': '4' }}>R</span>
                    <span className="letter" style={{ '--delay': '5' }}>A</span>
                </h1>

                <p className="subtitle">Let's Learn & Play Together! 🎈</p>

                {/* Big animated START button */}
                <button
                    className={`start-button ${isAnimating ? 'clicked' : ''}`}
                    onClick={handleStart}
                >
                    <span className="button-text">START</span>
                    <span className="button-icon">🚀</span>
                    <div className="button-shine"></div>
                </button>

                {/* Friendly instruction */}
                <p className="hint">Press the button to begin! 👆</p>
            </div>

            {/* Bottom decorations */}
            <div className="bottom-decor">
                <span>🌻</span>
                <span>🌸</span>
                <span>🌼</span>
                <span>🌺</span>
                <span>🌷</span>
            </div>
        </div>
    )
}

export default ChildLanding
