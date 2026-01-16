import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import FrictionIndicator from '../components/Results/FrictionIndicator'
import CategoryBreakdown from '../components/Results/CategoryBreakdown'
import RecommendationCard from '../components/Results/RecommendationCard'
import { getLearnerById, frictionExplanations, calculateOverallFriction } from '../data/mockData'

function Results() {
    const { id } = useParams()

    // Get learner data or generate from assessment
    let learner = getLearnerById(id)

    // If new assessment, try to get data from session storage
    if (id === 'new') {
        const assessmentData = sessionStorage.getItem('lastAssessment')
        if (assessmentData) {
            const data = JSON.parse(assessmentData)

            // Calculate friction level based on interactions
            const hesitationScore = Math.min(data.wordClicks * 5, 100)
            const timeScore = Math.min(data.timeElapsed / 2, 100)
            const accuracyScore = 100 - (data.correctAnswers / data.totalQuestions) * 100

            const readingFriction = Math.round((hesitationScore + timeScore) / 2)
            const attentionFriction = Math.round(timeScore * 0.7 + hesitationScore * 0.3)
            const memoryFriction = Math.round(accuracyScore)

            const avgScore = (readingFriction + attentionFriction + memoryFriction) / 3
            const level = avgScore < 30 ? 'low' : avgScore < 60 ? 'medium' : 'high'

            learner = {
                id: 'new',
                name: 'New Assessment',
                lastActivity: 'Just now',
                frictionLevel: level,
                scores: {
                    reading: readingFriction,
                    attention: attentionFriction,
                    memory: memoryFriction
                }
            }
        }
    }

    if (!learner) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Learner Not Found</h1>
                <Link to="/" className="btn-primary">
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    const overallFriction = calculateOverallFriction(learner.scores)
    const explanation = frictionExplanations[learner.frictionLevel]

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">{learner.name}</h1>
                    <p className="text-slate-600 mt-1">
                        Friction Analysis Report
                    </p>
                </div>

                <div className="flex gap-2">
                    <button className="btn-secondary inline-flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="btn-secondary inline-flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>

            {/* Friction Indicator */}
            <div className="mb-6">
                <FrictionIndicator
                    level={learner.frictionLevel}
                    percentage={overallFriction}
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <CategoryBreakdown scores={learner.scores} />

                {/* Recommendations */}
                <div>
                    <RecommendationCard
                        frictionLevel={learner.frictionLevel}
                        explanation={explanation}
                    />
                </div>
            </div>
        </div>
    )
}

export default Results
