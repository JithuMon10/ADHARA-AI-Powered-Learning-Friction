import { useState } from 'react'

function ReadingTask({ passage, onWordClick, onComplete }) {
    const [selectedWords, setSelectedWords] = useState([])
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState([])
    const [showQuestions, setShowQuestions] = useState(false)

    const words = passage.content.split(/(\s+)/)

    const handleWordClick = (word, index) => {
        if (word.trim()) {
            setSelectedWords([...selectedWords, { word, index, timestamp: Date.now() }])
            onWordClick?.({ word, index })
        }
    }

    const handleStartQuestions = () => {
        setShowQuestions(true)
    }

    const handleAnswer = (questionIndex, answerIndex) => {
        const newAnswers = [...answers]
        newAnswers[questionIndex] = answerIndex
        setAnswers(newAnswers)

        if (questionIndex < passage.questions.length - 1) {
            setCurrentQuestion(questionIndex + 1)
        }
    }

    const handleSubmit = () => {
        onComplete?.({
            wordClicks: selectedWords.length,
            answers: answers,
            correctAnswers: passage.questions.filter((q, i) => answers[i] === q.correct).length
        })
    }

    const allQuestionsAnswered = answers.length === passage.questions.length && answers.every(a => a !== undefined)

    if (showQuestions) {
        const question = passage.questions[currentQuestion]

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Comprehension Questions</h3>
                    <span className="text-sm text-slate-500">
                        Question {currentQuestion + 1} of {passage.questions.length}
                    </span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 mb-6">
                    {passage.questions.map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-colors ${answers[i] !== undefined
                                    ? 'bg-primary-500'
                                    : i === currentQuestion
                                        ? 'bg-primary-300'
                                        : 'bg-slate-200'
                                }`}
                        />
                    ))}
                </div>

                <p className="text-lg text-slate-800 mb-4">{question.text}</p>

                <div className="space-y-3">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(currentQuestion, i)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion] === i
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <span className="font-medium text-slate-600 mr-3">
                                {String.fromCharCode(65 + i)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>

                {allQuestionsAnswered && (
                    <button onClick={handleSubmit} className="btn-primary w-full mt-6">
                        Submit Assessment
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{passage.title}</h3>
                <span className="text-sm text-slate-500">
                    {selectedWords.length} word{selectedWords.length !== 1 ? 's' : ''} highlighted
                </span>
            </div>

            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                Click on any word you find unclear or want to revisit
            </div>

            <div className="leading-relaxed text-slate-700">
                {words.map((word, index) => {
                    if (!word.trim()) return <span key={index}>{word}</span>

                    const isSelected = selectedWords.some(sw => sw.index === index)

                    return (
                        <span
                            key={index}
                            onClick={() => handleWordClick(word, index)}
                            className={`cursor-pointer rounded px-0.5 transition-colors ${isSelected
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'hover:bg-slate-100'
                                }`}
                        >
                            {word}
                        </span>
                    )
                })}
            </div>

            <button onClick={handleStartQuestions} className="btn-primary w-full">
                Continue to Questions
            </button>
        </div>
    )
}

export default ReadingTask
