import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChildRegister.css'

/**
 * Child Registration - Fun name/age/gender input
 * Friendly, animated form for kids
 */
function ChildRegister() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: ''
    })
    const [mascotMessage, setMascotMessage] = useState("Hi friend! What's your name? 👋")

    const handleNameSubmit = () => {
        if (formData.name.trim()) {
            setMascotMessage(`Nice to meet you, ${formData.name}! 🎉 How old are you?`)
            setStep(2)
        }
    }

    const handleAgeSelect = (age) => {
        setFormData(prev => ({ ...prev, age }))
        setMascotMessage(`${age} years old! Awesome! 🌟 Are you a boy or a girl?`)
        setStep(3)
    }

    const handleGenderSelect = (gender) => {
        setFormData(prev => ({ ...prev, gender }))

        // Store child info in localStorage
        const childData = {
            ...formData,
            gender,
            sessionId: Date.now(),
            startTime: new Date().toISOString()
        }
        localStorage.setItem('adhara_child', JSON.stringify(childData))
        localStorage.setItem('adhara_session_signals', '[]')

        // Navigate to game
        setMascotMessage(`Let's play some fun games, ${formData.name}! 🚀`)
        setTimeout(() => {
            navigate('/play/activity')
        }, 1000)
    }

    const AgeButton = ({ age }) => (
        <button
            className="age-button"
            onClick={() => handleAgeSelect(age)}
        >
            {age}
        </button>
    )

    return (
        <div className="child-register">
            {/* Decorations */}
            <div className="decorations">
                <span className="balloon balloon-1">🎈</span>
                <span className="balloon balloon-2">🎈</span>
                <span className="balloon balloon-3">🎈</span>
            </div>

            <div className="register-content">
                {/* Mascot with speech bubble */}
                <div className="mascot-section">
                    <div className="mascot-bubble">
                        <p>{mascotMessage}</p>
                    </div>
                    <div className="mascot">
                        <span className="mascot-emoji">🐻</span>
                    </div>
                </div>

                {/* Step 1: Name */}
                {step === 1 && (
                    <div className="input-section fade-in">
                        <input
                            type="text"
                            placeholder="Type your name here..."
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="name-input"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                        />
                        <button
                            className="next-button"
                            onClick={handleNameSubmit}
                            disabled={!formData.name.trim()}
                        >
                            Next ➡️
                        </button>
                    </div>
                )}

                {/* Step 2: Age */}
                {step === 2 && (
                    <div className="age-section fade-in">
                        <p className="section-label">Pick your age:</p>
                        <div className="age-grid">
                            {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(age => (
                                <AgeButton key={age} age={age} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Gender */}
                {step === 3 && (
                    <div className="gender-section fade-in">
                        <p className="section-label">I am a...</p>
                        <div className="gender-buttons">
                            <button
                                className="gender-button boy"
                                onClick={() => handleGenderSelect('boy')}
                            >
                                <span className="gender-icon">👦</span>
                                <span>Boy</span>
                            </button>
                            <button
                                className="gender-button girl"
                                onClick={() => handleGenderSelect('girl')}
                            >
                                <span className="gender-icon">👧</span>
                                <span>Girl</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Progress indicator */}
                <div className="progress-dots">
                    <span className={`dot ${step >= 1 ? 'active' : ''}`}></span>
                    <span className={`dot ${step >= 2 ? 'active' : ''}`}></span>
                    <span className={`dot ${step >= 3 ? 'active' : ''}`}></span>
                </div>
            </div>
        </div>
    )
}

export default ChildRegister
