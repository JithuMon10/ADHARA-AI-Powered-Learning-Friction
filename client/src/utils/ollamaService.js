/**
 * ADHARA Ollama Service
 * 
 * Handles communication with local Ollama instance
 * for friction analysis using qwen2.5-coder:7b
 */

// Read the system prompt from the markdown file
import systemPromptMd from '../../data/llm_system_prompt.md?raw'

const OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'qwen2.5-coder:7b'

/**
 * Extract the core system prompt from the markdown file
 * Removes markdown formatting for cleaner LLM input
 */
function extractSystemPrompt() {
    // The full markdown is too long, extract key sections
    return `You are an AI assistant for ADHARA, a learning friction detection system.

Your role: Analyze user interaction patterns and compare them against age-appropriate baselines to identify learning friction.

FRICTION THRESHOLDS:
- < 30% deviation = Low Friction
- 30-70% deviation = Medium Friction  
- > 70% deviation = High Friction

AGE BASELINES (Hesitation ms / Jitter / Corrections / Idle Motion ms / Speed Variance):
- 6-8: 2500 / 0.4 / 3 / 4000 / 0.5
- 9-11: 1800 / 0.3 / 2 / 3000 / 0.4
- 12-14: 1200 / 0.2 / 1.5 / 2000 / 0.3
- 15+: 800 / 0.15 / 1 / 1500 / 0.25

OUTPUT FORMAT (use exactly this format):
Friction Level: [Low | Medium | High]

Category Breakdown:
- Reading Friction: [X]%
- Attention Friction: [X]%
- Memory Friction: [X]%

Explanation:
[2-3 sentences comparing observed patterns to baseline]

Recommendation: Human review suggested

RULES:
- Never use: diagnosis, disability, medical, clinical, treatment
- Always use: learning friction, behavioral indicators, interaction patterns
- Always end with "Human review suggested"
- Keep explanations simple and non-technical`
}

/**
 * Check if Ollama is running and accessible
 * @returns {Promise<boolean>}
 */
export async function checkOllamaConnection() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET',
        })
        return response.ok
    } catch (error) {
        console.error('[OllamaService] Connection failed:', error.message)
        return false
    }
}

/**
 * Get available models from Ollama
 * @returns {Promise<string[]>}
 */
export async function getAvailableModels() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`)
        if (!response.ok) return []

        const data = await response.json()
        return data.models?.map(m => m.name) || []
    } catch (error) {
        console.error('[OllamaService] Failed to get models:', error.message)
        return []
    }
}

/**
 * Analyze friction using Ollama
 * @param {object} liveMetrics - Metrics from mouse tracker
 * @param {string} ageGroup - Age group (e.g., '9-11')
 * @param {string} model - Ollama model to use
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeFriction(liveMetrics, ageGroup, model = DEFAULT_MODEL) {
    const systemPrompt = extractSystemPrompt()

    const userPrompt = `Analyze these interaction metrics for a learner in age group ${ageGroup}:

LIVE METRICS:
- Hesitation Time: ${liveMetrics.hesitationMs || liveMetrics.hesitationTime || 0} ms
- Jitter Score: ${liveMetrics.jitterScore || liveMetrics.mouseJitterScore || 0}
- Corrections: ${liveMetrics.corrections || liveMetrics.correctionCount || 0}
- Idle Motion Time: ${liveMetrics.idleMotionMs || liveMetrics.idleWithMotionTime || 0} ms
- Speed Variance: ${liveMetrics.speedVariance || 0}
- Task Duration: ${liveMetrics.taskDurationSec || Math.round((liveMetrics.sessionDuration || 0) / 1000)} seconds

Compare these to the ${ageGroup} baseline and provide your friction assessment.`

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: 0.3, // Lower temperature for more consistent output
                    top_p: 0.9,
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`Ollama returned ${response.status}`)
        }

        const data = await response.json()
        return parseOllamaResponse(data.response)

    } catch (error) {
        console.error('[OllamaService] Analysis failed:', error.message)
        return {
            success: false,
            error: error.message,
            fallback: true,
        }
    }
}

/**
 * Analyze with streaming response (for real-time display)
 * @param {object} liveMetrics - Metrics from mouse tracker
 * @param {string} ageGroup - Age group
 * @param {function} onToken - Callback for each token
 * @param {string} model - Ollama model
 * @returns {Promise<object>}
 */
export async function analyzeFrictionStream(liveMetrics, ageGroup, onToken, model = DEFAULT_MODEL) {
    const systemPrompt = extractSystemPrompt()

    const userPrompt = `Analyze these interaction metrics for age group ${ageGroup}:
- Hesitation: ${liveMetrics.hesitationMs || 0}ms
- Jitter: ${liveMetrics.jitterScore || 0}
- Corrections: ${liveMetrics.corrections || 0}
- Idle Motion: ${liveMetrics.idleMotionMs || 0}ms
- Speed Variance: ${liveMetrics.speedVariance || 0}

Provide friction assessment.`

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: userPrompt,
                system: systemPrompt,
                stream: true,
                options: { temperature: 0.3 },
            }),
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(Boolean)

            for (const line of lines) {
                try {
                    const json = JSON.parse(line)
                    if (json.response) {
                        fullResponse += json.response
                        onToken?.(json.response)
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }

        return parseOllamaResponse(fullResponse)

    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Parse Ollama response into structured data
 * @param {string} response - Raw LLM response
 * @returns {object}
 */
function parseOllamaResponse(response) {
    try {
        const levelMatch = response.match(/Friction Level:\s*(Low|Medium|High)/i)
        const readingMatch = response.match(/Reading Friction:\s*(\d+)%?/i)
        const attentionMatch = response.match(/Attention Friction:\s*(\d+)%?/i)
        const memoryMatch = response.match(/Memory Friction:\s*(\d+)%?/i)
        const explanationMatch = response.match(/Explanation:\s*\n?([\s\S]*?)(?=\n\s*Recommendation:|$)/i)

        return {
            success: true,
            frictionLevel: levelMatch ? levelMatch[1].toLowerCase() : 'unknown',
            categories: {
                reading: readingMatch ? parseInt(readingMatch[1]) : 0,
                attention: attentionMatch ? parseInt(attentionMatch[1]) : 0,
                memory: memoryMatch ? parseInt(memoryMatch[1]) : 0,
            },
            explanation: explanationMatch ? explanationMatch[1].trim() : '',
            recommendation: 'Human review suggested',
            rawResponse: response,
        }
    } catch (error) {
        return {
            success: false,
            error: 'Failed to parse response',
            rawResponse: response,
        }
    }
}

export default {
    checkOllamaConnection,
    getAvailableModels,
    analyzeFriction,
    analyzeFrictionStream,
}
