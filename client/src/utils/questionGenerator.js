/**
 * ADHARA Adaptive Question System v4.0
 * 
 * Features:
 * - PHASE 1: 5-7 baseline questions (1-2 per domain)
 * - Mid-session AI analysis to detect patterns
 * - PHASE 2: 0-8 targeted follow-up questions (only if concerns detected)
 * - Maximum 15 questions total
 * - Early termination for normal learners
 * 
 * Session Flow:
 * 1. Baseline questions → Collect initial data
 * 2. AI Analysis → Determine focus areas
 * 3. Follow-up (if needed) → Deep probe problem areas
 * 4. Final Analysis → Generate clinical report
 */

export const MAX_TRIES = 3
export const BASELINE_QUESTION_COUNT = 6  // 5-7 baseline
export const MAX_FOLLOWUP_QUESTIONS = 8   // Maximum additional questions
export const MAX_TOTAL_QUESTIONS = 15     // Hard cap

// ============ QUESTION POOLS BY DOMAIN ============

export const QUESTION_POOLS = {
    // ============ READING & WORDS (Dyslexia Indicators) ============
    reading: {
        domain: 'reading',
        displayName: 'Reading & Words',
        clinicalName: 'Phonological Processing',
        icon: '📖',
        baseline: [
            { id: 'base_letter_b', type: 'letter', difficulty: 1, question: "Which letter is this?", showLetter: 'b', options: ['b', 'd', 'p', 'q'], correct: 'b' },
            { id: 'base_rhyme_cat', type: 'rhyming', difficulty: 1, question: "Which word rhymes with CAT?", targetWord: 'CAT', options: ['HAT', 'DOG', 'CUP', 'SUN'], correct: 'HAT' }
        ],
        followUp: [
            { id: 'fu_letter_d', type: 'letter', difficulty: 1, question: "Which letter is this?", showLetter: 'd', options: ['b', 'd', 'p', 'q'], correct: 'd' },
            { id: 'fu_letter_p', type: 'letter', difficulty: 1, question: "Which letter is this?", showLetter: 'p', options: ['b', 'd', 'p', 'q'], correct: 'p' },
            { id: 'fu_rhyme_ball', type: 'rhyming', difficulty: 1, question: "Which word rhymes with BALL?", targetWord: 'BALL', options: ['TALL', 'BOOK', 'BIRD', 'MILK'], correct: 'TALL' },
            { id: 'fu_rhyme_tree', type: 'rhyming', difficulty: 1, question: "Which word rhymes with TREE?", targetWord: 'TREE', options: ['BEE', 'CAR', 'DOG', 'TOY'], correct: 'BEE' },
            { id: 'fu_sound_sun', type: 'sound', difficulty: 1, question: "Which word starts like SUN?", targetWord: 'SUN', options: ['SOCK', 'MOON', 'BALL', 'CAR'], correct: 'SOCK' },
            { id: 'fu_sound_ball', type: 'sound', difficulty: 1, question: "Which word starts like BALL?", targetWord: 'BALL', options: ['BAT', 'CAT', 'DOG', 'FISH'], correct: 'BAT' }
        ]
    },

    // ============ NUMBERS & COUNTING (Dyscalculia Indicators) ============
    math: {
        domain: 'math',
        displayName: 'Numbers & Counting',
        clinicalName: 'Numerical Cognition',
        icon: '🔢',
        baseline: [
            { id: 'base_count_4', type: 'counting', difficulty: 1, question: "How many stars?", displayItems: '⭐⭐⭐⭐', count: 4, options: [3, 4, 5, 6], correct: 4 },
            { id: 'base_add_2_3', type: 'math', difficulty: 1, question: "What is 2 + 3?", options: [4, 5, 6, 7], correct: 5 }
        ],
        followUp: [
            { id: 'fu_count_5', type: 'counting', difficulty: 1, question: "How many hearts?", displayItems: '❤️❤️❤️❤️❤️', count: 5, options: [4, 5, 6, 7], correct: 5 },
            { id: 'fu_count_6', type: 'counting', difficulty: 1, question: "How many circles?", displayItems: '🔵🔵🔵🔵🔵🔵', count: 6, options: [5, 6, 7, 8], correct: 6 },
            { id: 'fu_add_4_2', type: 'math', difficulty: 1, question: "What is 4 + 2?", options: [5, 6, 7, 8], correct: 6 },
            { id: 'fu_sub_5_2', type: 'math', difficulty: 1, question: "What is 5 - 2?", options: [2, 3, 4, 5], correct: 3 },
            { id: 'fu_qty_1', type: 'quantity', difficulty: 1, question: "Which group has MORE?", options: ['🟢🟢🟢🟢🟢 (5)', '🔵🔵🔵 (3)'], correct: '🟢🟢🟢🟢🟢 (5)' },
            { id: 'fu_seq_1', type: 'pattern', difficulty: 1, question: "What comes next? 2, 4, 6, ?", options: [7, 8, 9, 10], correct: 8 }
        ]
    },

    // ============ FOCUS & ATTENTION (ADHD Indicators) ============
    attention: {
        domain: 'attention',
        displayName: 'Focus & Attention',
        clinicalName: 'Executive Function',
        icon: '🧠',
        baseline: [
            { id: 'base_mem_3', type: 'workingMemory', difficulty: 1, question: "Remember the numbers!", sequence: [3, 7, 2], options: ['3, 7, 2', '7, 3, 2', '2, 7, 3', '3, 2, 7'], correct: '3, 7, 2' }
        ],
        followUp: [
            { id: 'fu_mem_4', type: 'workingMemory', difficulty: 1, question: "Remember the numbers!", sequence: [5, 1, 9], options: ['5, 1, 9', '1, 5, 9', '9, 1, 5', '5, 9, 1'], correct: '5, 1, 9' },
            { id: 'fu_mem_5', type: 'workingMemory', difficulty: 2, question: "Remember the numbers!", sequence: [4, 1, 8, 5], options: ['4, 1, 8, 5', '1, 4, 8, 5', '4, 8, 1, 5', '5, 8, 1, 4'], correct: '4, 1, 8, 5' },
            { id: 'fu_stroop_1', type: 'stroop', difficulty: 2, question: "What COLOR is this word? (not what it says!)", word: 'BLUE', displayColor: 'red', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 'Red' },
            { id: 'fu_stroop_2', type: 'stroop', difficulty: 2, question: "What COLOR is this word?", word: 'GREEN', displayColor: 'yellow', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 'Yellow' }
        ]
    },

    // ============ VISUAL PATTERNS (Visual Processing) ============
    visual: {
        domain: 'visual',
        displayName: 'Visual Patterns',
        clinicalName: 'Visual Processing',
        icon: '👁️',
        baseline: [
            { id: 'base_pattern_1', type: 'pattern', difficulty: 1, question: "What comes next? 🔴 🔵 🔴 🔵 ?", options: ['🔴', '🔵', '🟢', '🟡'], correct: '🔴' }
        ],
        followUp: [
            { id: 'fu_pattern_2', type: 'pattern', difficulty: 1, question: "What comes next? ⭐ ⭐ 🌙 ⭐ ⭐ 🌙 ?", options: ['⭐', '🌙', '☀️', '🌟'], correct: '⭐' },
            { id: 'fu_match_1', type: 'matching', difficulty: 1, question: "Which shape is DIFFERENT?", shapes: ['🔵', '🔵', '🔵', '🟢'], options: ['1st', '2nd', '3rd', '4th'], correct: '4th', correctIndex: 3 },
            { id: 'fu_match_2', type: 'matching', difficulty: 1, question: "Find the odd one out:", shapes: ['⭐', '⭐', '🌙', '⭐'], options: ['1st', '2nd', '3rd', '4th'], correct: '3rd', correctIndex: 2 }
        ]
    },

    // ============ LISTENING & SPEAKING (Auditory Processing) ============
    listening: {
        domain: 'listening',
        displayName: 'Listening & Speaking',
        clinicalName: 'Auditory Processing',
        icon: '👂',
        baseline: [
            { id: 'base_voice_check', type: 'verbal', difficulty: 1, question: "Say this word out loud:", word: "HELLO 👋", instruction: "Click the microphone and say 'HELLO'" },
            { id: 'base_sound_diff', type: 'soundMatch', difficulty: 1, question: "Which word sounds DIFFERENT?", options: ['CAT', 'BAT', 'HAT', 'BALL'], correct: 'BALL' }
        ],
        followUp: [
            { id: 'fu_sound_diff_2', type: 'soundMatch', difficulty: 1, question: "Which word sounds DIFFERENT?", options: ['PEN', 'TEN', 'HEN', 'DOG'], correct: 'DOG' },
            { id: 'fu_sound_diff_3', type: 'soundMatch', difficulty: 1, question: "Which word sounds DIFFERENT?", options: ['CAKE', 'LAKE', 'CAR', 'MAKE'], correct: 'CAR' },
            { id: 'fu_verbal_1', type: 'verbal', difficulty: 1, question: "Say this word out loud:", word: "ELEPHANT 🐘", instruction: "Click the microphone and say the word" }
        ]
    }
}

/**
 * Generate baseline session (Phase 1: 5-7 questions)
 * These are the initial screening questions before AI analysis
 * Voice check is always placed at position 2
 */
export function generateBaselineSession() {
    const questions = []
    let voiceQuestion = null

    // Take baseline questions from each domain
    Object.values(QUESTION_POOLS).forEach(pool => {
        pool.baseline.forEach(q => {
            const question = {
                ...q,
                domain: pool.domain,
                domainName: pool.displayName,
                clinicalName: pool.clinicalName,
                icon: pool.icon,
                phase: 'baseline',
                maxTries: MAX_TRIES
            }

            // Separate voice check question
            if (q.type === 'verbal') {
                voiceQuestion = question
            } else {
                questions.push(question)
            }
        })
    })

    // Shuffle non-voice questions
    const shuffled = shuffleArray(questions)

    // Insert voice check at position 2 (index 1) if available
    if (voiceQuestion) {
        shuffled.splice(1, 0, voiceQuestion)
    }

    return shuffled
}

/**
 * Generate follow-up questions based on AI analysis
 * @param {object} aiRecommendation - AI analysis result with focusDomains and additionalQuestions
 */
export function generateFollowUpQuestions(aiRecommendation) {
    const { focusDomains = [], additionalQuestions = 0 } = aiRecommendation
    const questions = []

    if (additionalQuestions === 0 || focusDomains.length === 0) {
        return questions
    }

    // Prioritize questions from focus domains
    const questionsPerDomain = Math.ceil(additionalQuestions / focusDomains.length)

    focusDomains.forEach(domainKey => {
        const pool = QUESTION_POOLS[domainKey]
        if (!pool) return

        const shuffledFollowUp = shuffleArray([...pool.followUp])
        const selected = shuffledFollowUp.slice(0, questionsPerDomain)

        selected.forEach(q => {
            questions.push({
                ...q,
                domain: pool.domain,
                domainName: pool.displayName,
                clinicalName: pool.clinicalName,
                icon: pool.icon,
                phase: 'followup',
                maxTries: MAX_TRIES
            })
        })
    })

    // Limit to requested number
    return shuffleArray(questions).slice(0, Math.min(additionalQuestions, MAX_FOLLOWUP_QUESTIONS))
}

/**
 * Analyze baseline responses and generate AI recommendation
 * This is the mid-session analysis that determines adaptive path
 */
export function analyzeBaselineForAI(responses, behavioralData) {
    const domainStats = {}

    // Calculate per-domain statistics
    responses.forEach(r => {
        const domain = r.domain || 'unknown'
        if (!domainStats[domain]) {
            domainStats[domain] = {
                total: 0,
                correct: 0,
                avgTime: 0,
                times: [],
                hesitations: 0,
                retries: 0
            }
        }

        domainStats[domain].total++
        if (r.correct) domainStats[domain].correct++
        if (r.responseTimeMs) domainStats[domain].times.push(r.responseTimeMs)
        if (r.hesitated) domainStats[domain].hesitations++
        if (r.tries > 1) domainStats[domain].retries += r.tries - 1
    })

    // Calculate averages
    Object.values(domainStats).forEach(stats => {
        stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        stats.avgTime = stats.times.length > 0
            ? Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length)
            : 0
    })

    // Identify concern areas (accuracy < 70% or high hesitation)
    const concernDomains = []
    const watchDomains = []

    Object.entries(domainStats).forEach(([domain, stats]) => {
        if (stats.accuracy < 50 || stats.retries >= 2) {
            concernDomains.push(domain)
        } else if (stats.accuracy < 80 || stats.hesitations > 0 || stats.avgTime > 8000) {
            watchDomains.push(domain)
        }
    })

    // Determine overall risk level
    let overallRisk = 'NORMAL'
    let continueSession = false
    let additionalQuestions = 0
    let rationale = ''

    if (concernDomains.length >= 2) {
        overallRisk = 'CONCERN'
        continueSession = true
        additionalQuestions = 8
        rationale = `Multiple domains showing significant patterns: ${concernDomains.join(', ')}. Extended screening recommended.`
    } else if (concernDomains.length === 1) {
        overallRisk = 'WATCH'
        continueSession = true
        additionalQuestions = 5
        rationale = `Pattern detected in ${concernDomains[0]}. Additional probing recommended.`
    } else if (watchDomains.length >= 2) {
        overallRisk = 'WATCH'
        continueSession = true
        additionalQuestions = 4
        rationale = `Minor variations in ${watchDomains.join(', ')}. Brief follow-up recommended.`
    } else if (watchDomains.length === 1) {
        overallRisk = 'NORMAL'
        continueSession = true
        additionalQuestions = 2
        rationale = `Slight hesitation in ${watchDomains[0]}. Quick verification recommended.`
    } else {
        overallRisk = 'NORMAL'
        continueSession = false
        additionalQuestions = 0
        rationale = 'All domains within normal range. Session complete.'
    }

    // Include behavioral data in analysis
    if (behavioralData) {
        const { stressRatio = 0, hesitationCount = 0 } = behavioralData
        if (stressRatio > 0.3) {
            overallRisk = overallRisk === 'NORMAL' ? 'WATCH' : overallRisk
            additionalQuestions = Math.max(additionalQuestions, 3)
            continueSession = true
            rationale += ' Elevated stress indicators observed.'
        }
    }

    return {
        overallRisk,
        continueSession,
        focusDomains: [...concernDomains, ...watchDomains],
        additionalQuestions: Math.min(additionalQuestions, MAX_FOLLOWUP_QUESTIONS),
        rationale,
        domainStats,
        timestamp: new Date().toISOString()
    }
}

/**
 * Generate clinical screening context for final AI analysis
 */
export function generateClinicalContext(allResponses, aiMidSessionAnalysis, behavioralData) {
    const domainResults = {}

    // Compile all responses by domain
    allResponses.forEach(r => {
        const domain = r.domain || 'unknown'
        if (!domainResults[domain]) {
            const pool = QUESTION_POOLS[domain]
            domainResults[domain] = {
                displayName: pool?.displayName || domain,
                clinicalName: pool?.clinicalName || domain,
                icon: pool?.icon || '📋',
                baselineResponses: [],
                followUpResponses: [],
                totalQuestions: 0,
                totalCorrect: 0,
                avgResponseTime: 0,
                times: [],
                patterns: []
            }
        }

        if (r.phase === 'baseline') {
            domainResults[domain].baselineResponses.push(r)
        } else {
            domainResults[domain].followUpResponses.push(r)
        }

        domainResults[domain].totalQuestions++
        if (r.correct) domainResults[domain].totalCorrect++
        if (r.responseTimeMs) domainResults[domain].times.push(r.responseTimeMs)
    })

    // Calculate statistics and identify patterns
    Object.entries(domainResults).forEach(([domain, data]) => {
        data.accuracy = data.totalQuestions > 0
            ? Math.round((data.totalCorrect / data.totalQuestions) * 100)
            : 0
        data.avgResponseTime = data.times.length > 0
            ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
            : 0

        // Identify specific patterns
        if (domain === 'reading') {
            const letterErrors = allResponses.filter(r =>
                r.domain === 'reading' && r.type === 'letter' && !r.correct
            )
            if (letterErrors.length > 0) {
                data.patterns.push('Letter reversal difficulty observed (b/d/p/q confusion)')
            }
            const rhymeErrors = allResponses.filter(r =>
                r.domain === 'reading' && r.type === 'rhyming' && !r.correct
            )
            if (rhymeErrors.length > 0) {
                data.patterns.push('Phonological awareness difficulty (rhyming)')
            }
        }

        if (domain === 'math') {
            const countingErrors = allResponses.filter(r =>
                r.domain === 'math' && r.type === 'counting' && !r.correct
            )
            if (countingErrors.length > 0) {
                data.patterns.push('Counting accuracy difficulty')
            }
            const mathErrors = allResponses.filter(r =>
                r.domain === 'math' && r.type === 'math' && !r.correct
            )
            if (mathErrors.length > 0) {
                data.patterns.push('Basic arithmetic difficulty')
            }
        }

        if (domain === 'attention') {
            const memoryErrors = allResponses.filter(r =>
                r.domain === 'attention' && r.type === 'workingMemory' && !r.correct
            )
            if (memoryErrors.length > 0) {
                data.patterns.push('Working memory difficulty (digit span)')
            }
            if (data.avgResponseTime > 10000) {
                data.patterns.push('Extended processing time observed')
            }
        }

        // Calculate confidence level
        data.confidence = calculateDomainConfidence(data)
        data.status = determineStatus(data.accuracy, data.patterns.length)
    })

    return {
        domainResults,
        midSessionAnalysis: aiMidSessionAnalysis,
        behavioralSummary: behavioralData,
        sessionType: aiMidSessionAnalysis?.continueSession ? 'ADAPTIVE' : 'BASELINE_ONLY',
        totalQuestions: allResponses.length,
        overallAccuracy: allResponses.length > 0
            ? Math.round((allResponses.filter(r => r.correct).length / allResponses.length) * 100)
            : 0
    }
}

// ============ HELPER FUNCTIONS ============

function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

function calculateDomainConfidence(domainData) {
    const { totalQuestions, accuracy, patterns } = domainData

    // More questions = higher confidence
    let confidence = Math.min(totalQuestions * 15, 60)

    // Clear results (very high or very low accuracy) = higher confidence
    if (accuracy >= 90 || accuracy <= 30) {
        confidence += 25
    } else if (accuracy >= 80 || accuracy <= 50) {
        confidence += 15
    }

    // Patterns identified = higher confidence in assessment
    confidence += patterns.length * 5

    return Math.min(confidence, 95)
}

function determineStatus(accuracy, patternCount) {
    if (accuracy >= 85 && patternCount === 0) return 'TYPICAL'
    if (accuracy >= 70 && patternCount <= 1) return 'WATCH'
    return 'ELEVATED'
}
