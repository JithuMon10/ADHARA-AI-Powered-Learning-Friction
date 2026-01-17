/**
 * Face Analysis Utility - Using face-api.js
 * 
 * Features:
 * - Emotion detection (7 emotions: happy, sad, angry, disgusted, fearful, surprised, neutral)
 * - Blink detection via eye aspect ratio
 * - Gaze direction (looking at screen vs away)
 * - Head pose estimation (yaw, pitch, roll)
 * - Face presence tracking
 */

import * as faceapi from 'face-api.js'

// Model loading state
let modelsLoaded = false
let loadingPromise = null

// Analysis configuration
const CONFIG = {
    detectionInterval: 1000, // Analyze every 1 second
    blinkThreshold: 0.2,     // Eye aspect ratio threshold for blink
    gazeOffsetThreshold: 30, // Degrees off-center before considered "looking away"
    emotionConfidenceThreshold: 0.3
}

// Baseline reference for comparison (from baseline_dataset.json)
const BASELINES = {
    "6-8": { avgBlinkRate: 18, avgGazeStability: 0.6 },
    "9-11": { avgBlinkRate: 16, avgGazeStability: 0.7 },
    "12-14": { avgBlinkRate: 15, avgGazeStability: 0.75 },
    "15+": { avgBlinkRate: 14, avgGazeStability: 0.8 }
}

/**
 * Load face-api.js models from CDN
 */
export async function loadFaceModels() {
    if (modelsLoaded) return true
    if (loadingPromise) return loadingPromise

    loadingPromise = (async () => {
        try {
            // Use CDN for models (more reliable)
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model'

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ])

            console.log('✅ Face-api.js models loaded')
            modelsLoaded = true
            return true
        } catch (err) {
            console.error('❌ Failed to load face models:', err)
            return false
        }
    })()

    return loadingPromise
}

/**
 * Calculate Eye Aspect Ratio (EAR) for blink detection
 * Using landmarks around the eye
 */
function calculateEAR(eye) {
    // Eye landmarks: 6 points around each eye
    // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    const p1 = eye[0], p2 = eye[1], p3 = eye[2]
    const p4 = eye[3], p5 = eye[4], p6 = eye[5]

    const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2))
    const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2))
    const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2))

    if (horizontal === 0) return 0
    return (vertical1 + vertical2) / (2 * horizontal)
}

/**
 * Estimate head pose from face landmarks
 * Returns yaw (left-right), pitch (up-down), roll (tilt)
 */
function estimateHeadPose(landmarks) {
    const nose = landmarks.getNose()
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const jaw = landmarks.getJawOutline()

    // Nose tip position relative to face center
    const noseTip = nose[3]
    const faceCenter = {
        x: (leftEye[0].x + rightEye[3].x) / 2,
        y: (leftEye[0].y + rightEye[3].y) / 2
    }

    // Eye line for roll calculation
    const eyeLineAngle = Math.atan2(
        rightEye[0].y - leftEye[3].y,
        rightEye[0].x - leftEye[3].x
    ) * (180 / Math.PI)

    // Yaw estimation (horizontal head turn)
    const noseOffset = noseTip.x - faceCenter.x
    const faceWidth = rightEye[3].x - leftEye[0].x
    const yaw = (noseOffset / faceWidth) * 60 // Approximate degrees

    // Pitch estimation (vertical head tilt)
    const jawBottom = jaw[8]
    const faceHeight = jawBottom.y - faceCenter.y
    const pitch = ((noseTip.y - faceCenter.y) / faceHeight) * 30

    return {
        yaw: Math.round(yaw),
        pitch: Math.round(pitch),
        roll: Math.round(eyeLineAngle)
    }
}

/**
 * Estimate gaze direction
 */
function estimateGaze(landmarks, videoWidth, videoHeight) {
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    // Eye center positions
    const leftCenter = {
        x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
    }
    const rightCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
    }

    // Average eye position
    const eyeCenter = {
        x: (leftCenter.x + rightCenter.x) / 2,
        y: (leftCenter.y + rightCenter.y) / 2
    }

    // Distance from video center (normalized)
    const screenCenter = { x: videoWidth / 2, y: videoHeight / 2 }
    const offsetX = ((eyeCenter.x - screenCenter.x) / screenCenter.x) * 100
    const offsetY = ((eyeCenter.y - screenCenter.y) / screenCenter.y) * 100

    const isLookingAtScreen = Math.abs(offsetX) < 30 && Math.abs(offsetY) < 30

    return {
        offsetX: Math.round(offsetX),
        offsetY: Math.round(offsetY),
        isLookingAtScreen
    }
}

/**
 * Analyze a single video frame
 */
export async function analyzeFace(videoElement) {
    if (!modelsLoaded || !videoElement) return null

    try {
        const detection = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()

        if (!detection) {
            return {
                faceDetected: false,
                timestamp: Date.now()
            }
        }

        const landmarks = detection.landmarks
        const expressions = detection.expressions

        // Get eye landmarks for blink detection
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()

        const leftEAR = calculateEAR(leftEye)
        const rightEAR = calculateEAR(rightEye)
        const avgEAR = (leftEAR + rightEAR) / 2
        const isBlinking = avgEAR < CONFIG.blinkThreshold

        // Head pose
        const headPose = estimateHeadPose(landmarks)

        // Gaze direction
        const gaze = estimateGaze(landmarks, videoElement.videoWidth, videoElement.videoHeight)

        // Dominant emotion
        const emotionEntries = Object.entries(expressions)
        const dominantEmotion = emotionEntries.reduce((max, curr) =>
            curr[1] > max[1] ? curr : max
        )

        return {
            faceDetected: true,
            timestamp: Date.now(),

            // Emotions
            emotions: {
                dominant: dominantEmotion[0],
                confidence: dominantEmotion[1],
                all: {
                    happy: expressions.happy,
                    sad: expressions.sad,
                    angry: expressions.angry,
                    disgusted: expressions.disgusted,
                    fearful: expressions.fearful,
                    surprised: expressions.surprised,
                    neutral: expressions.neutral
                }
            },

            // Blink detection
            blink: {
                leftEAR,
                rightEAR,
                avgEAR,
                isBlinking
            },

            // Head pose
            headPose,

            // Gaze
            gaze,

            // Face box
            faceBox: {
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height
            }
        }
    } catch (err) {
        console.error('Face analysis error:', err)
        return null
    }
}

/**
 * Face Analysis Session Tracker
 * Accumulates data over a session for summary statistics
 */
export class FaceAnalysisSession {
    constructor() {
        this.reset()
    }

    reset() {
        this.startTime = Date.now()
        this.samples = []
        this.blinkCount = 0
        this.lastBlinkState = false
        this.emotionHistory = []
        this.gazeOnScreenSamples = 0
        this.totalSamples = 0
        this.facePresenceSamples = 0
    }

    addSample(analysis) {
        if (!analysis) return

        this.samples.push(analysis)
        this.totalSamples++

        if (analysis.faceDetected) {
            this.facePresenceSamples++

            // Track blinks (detect transition from not-blinking to blinking)
            if (analysis.blink.isBlinking && !this.lastBlinkState) {
                this.blinkCount++
            }
            this.lastBlinkState = analysis.blink.isBlinking

            // Track emotion
            if (analysis.emotions.confidence > CONFIG.emotionConfidenceThreshold) {
                this.emotionHistory.push({
                    emotion: analysis.emotions.dominant,
                    confidence: analysis.emotions.confidence,
                    timestamp: analysis.timestamp
                })
            }

            // Track gaze
            if (analysis.gaze.isLookingAtScreen) {
                this.gazeOnScreenSamples++
            }
        }
    }

    getSummary() {
        const durationMs = Date.now() - this.startTime
        const durationMin = durationMs / 60000

        // Blink rate per minute
        const blinkRate = durationMin > 0 ? Math.round(this.blinkCount / durationMin) : 0

        // Face presence percentage
        const facePresence = this.totalSamples > 0
            ? (this.facePresenceSamples / this.totalSamples * 100).toFixed(1)
            : 0

        // Gaze stability (% time looking at screen)
        const gazeStability = this.facePresenceSamples > 0
            ? (this.gazeOnScreenSamples / this.facePresenceSamples).toFixed(2)
            : 0

        // Emotion distribution
        const emotionCounts = {}
        this.emotionHistory.forEach(e => {
            emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1
        })
        const totalEmotions = this.emotionHistory.length
        const emotionDistribution = {}
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
            emotionDistribution[emotion] = ((count / totalEmotions) * 100).toFixed(1)
        })

        // Dominant emotion overall
        const dominantEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'

        // Frustration/stress indicators
        const negativeEmotions = ['angry', 'sad', 'fearful', 'disgusted']
        const negativeCount = negativeEmotions.reduce((sum, e) => sum + (emotionCounts[e] || 0), 0)
        const stressRatio = totalEmotions > 0 ? (negativeCount / totalEmotions).toFixed(2) : 0

        // Recent emotions (last 5)
        const recentEmotions = this.emotionHistory.slice(-5).map(e => e.emotion)

        return {
            durationMs,
            totalSamples: this.totalSamples,
            faceDetectedSamples: this.facePresenceSamples,
            facePresencePercent: parseFloat(facePresence),

            blinkCount: this.blinkCount,
            blinkRatePerMin: blinkRate,

            gazeStability: parseFloat(gazeStability),
            gazeOnScreenPercent: parseFloat((gazeStability * 100).toFixed(1)),

            dominantEmotion,
            emotionDistribution,
            recentEmotions,
            stressRatio: parseFloat(stressRatio),

            // Raw data for AI analysis
            rawEmotionHistory: this.emotionHistory.slice(-50) // Last 50 samples
        }
    }
}

export { BASELINES }
