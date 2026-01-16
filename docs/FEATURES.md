# ADHARA — Features & Technical Documentation

> **AI-Assisted Early Warning System for Learning Friction Detection**  
> Version: Demo Build (January 2026)

---

## 🎯 Overview

ADHARA is an AI-powered learning friction detection system that analyzes student interaction patterns to identify signs of struggle early — before grades reveal the problem.

**Core Philosophy:**
- ✅ Detect behavioral friction, not diagnose disabilities
- ✅ AI suggests, humans decide
- ✅ Privacy-first design
- ✅ Explainable results with plain-English reasons

---

## 📦 Current Features

### 1. 🖱️ Advanced Mouse Interaction Tracker

**File:** `mouse-tracker-demo.html`  
**URL:** http://localhost:5500/mouse-tracker-demo.html

#### What It Tracks

| Metric | Description | Range |
|--------|-------------|-------|
| **Tremor Index** | Micro-movement variance + direction oscillation | 0-1 (higher = more tremor) |
| **Micro-Jitter** | High-frequency direction changes | 0-1 |
| **Velocity Variance** | Speed consistency during movement | 0-1 |
| **Acceleration** | Sudden speed changes | 0-1 |
| **Direction Changes** | Count of significant direction shifts | Integer |
| **Hesitations** | Count of micro-pauses (>50ms) | Integer |
| **Smoothness Score** | Inverse of acceleration variance | 0-1 (higher = smoother) |
| **Curvature Index** | Average direction change per movement | 0-1 |
| **Path Efficiency** | Straight-line vs actual path ratio | 0-100% |
| **Micro-Pauses** | Small hesitations without significant movement | Integer |

#### Technical Implementation
- **Sampling Rate:** 60 FPS using `requestAnimationFrame`
- **Analysis Window:** 10 samples for micro-tremor detection
- **Friction Levels:** STABLE (green) → MODERATE (yellow) → ELEVATED (red)

#### AI Integration (Ollama/Qwen)
- Runs every **2.5 seconds** during tracking
- Analyzes all metrics to determine:
  - Is this normal controlled movement?
  - Signs of uncertainty or hesitation?
  - Abnormal tremor or anxiety-like patterns?
- Provides verdict: **NORMAL** / **UNCERTAIN** / **ABNORMAL**

#### How It Works
```
Mouse Movement → 60 FPS Sampling → Metric Calculation
                                        ↓
                              Tremor Detection Window
                                        ↓
                              Friction Level Calculation
                                        ↓
                              Ollama AI Analysis (every 2.5s)
                                        ↓
                              Real-time Verdict Display
```

---

### 2. 👁️ Face & Eye Mood Analyzer

**File:** `face-mood-analyzer.html`  
**URL:** http://localhost:5500/face-mood-analyzer.html

#### What It Detects

| Expression | Emoji | Indicates |
|------------|-------|-----------|
| Happy | 😊 | Engagement, enjoyment |
| Sad | 😢 | Disengagement, frustration |
| Angry | 😠 | High frustration |
| Surprised | 😲 | Confusion, unexpected content |
| Fearful | 😨 | Anxiety, stress |
| Disgusted | 🤢 | Aversion to content |
| Neutral | 😐 | Normal focused state |

#### Eye Tracking Features

| Metric | Description | Normal Range |
|--------|-------------|--------------|
| **Blink Rate** | Blinks per minute | 15-20/min |
| **Gaze Stability** | How steady the eye focus is | Stable / Moderate / Unstable |
| **Left/Right Eye State** | Open or closed indicators | Visual dots |

#### Sudden Change Detection
- Detects sudden spikes in **surprise** or **fear** (>50% confidence)
- Shows visual alert banner on video
- Logs all sudden changes with timestamps

#### Technical Implementation
- Uses **face-api.js** for face detection + expression recognition
- Single face tracking (largest/closest face only)
- Eye Aspect Ratio (EAR) formula for blink detection
- Gaze variance calculation for stability

#### AI Integration
- Runs every **2.5 seconds** during camera feed
- Receives context:
  - Current expression + confidence
  - All expression scores
  - Blink rate, gaze stability
  - Recent emotion trend
  - Recent sudden change alerts
- Provides educational-context summary with teacher recommendations

---

### 3. � Speech Analyzer

**File:** `speech-analyzer-demo.html`  
**URL:** http://localhost:5500/speech-analyzer-demo.html

#### What It Tracks

| Metric | Description |
|--------|-------------|
| **Words/Min** | Speech rate compared to age baseline |
| **Filler Words** | "um", "uh", "like", "you know", etc. |
| **Stammers** | Repeated words indicating hesitation |
| **Long Pauses** | Extended silence during speech |
| **Silence Ratio** | Percentage of time spent silent |
| **Word Count** | Total words spoken |

#### Age-Based Baselines

| Age Group | Expected WPM | Avg Pauses | Filler Tolerance |
|-----------|--------------|------------|------------------|
| 6-8 | 100 WPM | 800ms | 5 |
| 9-11 | 120 WPM | 500ms | 3 |
| 12-14 | 140 WPM | 400ms | 2 |
| 15+ | 150 WPM | 300ms | 1 |

#### Technical Implementation
- Uses **Web Speech API** for speech-to-text
- Real-time waveform visualization via **Canvas**
- Volume level meter for audio feedback
- Automatic filler word highlighting in transcript
- Detection log tracks all speech events

#### AI Integration
- Runs every **3 seconds** during recording
- Analyzes speech patterns against age baselines
- Provides friction assessment: **Low/Medium/High**
- Fallback local analysis if AI unavailable

---

### 4. �🏃 React Web Application

**Directory:** `client/`  
**Run:** `npm run dev` (from project root)

#### Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing Page | Welcome page with feature overview |
| `/user/dashboard` | User Dashboard | Shows available tasks and completed results |
| `/user/reading-task` | Reading Task | Reading comprehension with mouse tracking |
| `/user/complete` | Results Page | Shows quiz score, reading time, friction analysis |
| `/admin/dashboard` | Admin Dashboard | Teacher view of all students |

#### Current Task: Reading Assessment
1. Student reads a passage
2. Mouse movements are tracked during reading
3. Quiz questions test comprehension
4. Results show:
   - Quiz score
   - Reading time
   - Friction level (from mouse tracking)
   - Detailed metrics breakdown

---

## 🛠️ Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Recharts | Data visualization |
| Lucide React | Icons |
| Chart.js | Live charts (demos) |
| face-api.js | Face detection |

### AI/Backend
| Technology | Purpose |
|------------|---------|
| Ollama | Local LLM runtime |
| Qwen 2.5 (7B) | Language model for analysis |

### Requirements
- Node.js 18+
- Ollama with Qwen model installed
- Modern browser with webcam (for face analyzer)

---

## 🚀 How to Run

### 1. Start Ollama with CORS enabled
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

### 2. Start the local server (for demos)
```bash
cd ADHARA-AI-Powered-Learning-Friction
npx serve -p 5500 .
```

### 3. Access the demos
- Mouse Tracker: http://localhost:5500/mouse-tracker-demo.html
- Face Analyzer: http://localhost:5500/face-mood-analyzer.html

### 4. Start React app (optional)
```bash
npm run dev
```
Access at: http://localhost:3000

---

## 📊 Expected Output Examples

### Mouse Tracker
```
Friction Level: MODERATE
AI Analysis: "The mouse movement shows moderate velocity variance 
and occasional micro-jitter, suggesting the user may be experiencing 
some hesitation. The path efficiency of 65% indicates indirect 
movement patterns."
Verdict: ⚠️ Signs of Uncertainty
```

### Face Analyzer
```
Current Expression: Neutral (78%)
Blink Rate: 22/min (slightly elevated)
Gaze Stability: Moderate
AI Analysis: "The student appears focused but with slightly elevated 
blink rate which may suggest mild fatigue. Recommend a short break 
if this pattern continues."
```

---

## 🔮 Future Features (Roadmap)

| Feature | Status | Description |
|---------|--------|-------------|
| Keyboard Pattern Tracking | 🔜 Planned | Typing speed, corrections, pauses |
| Voice/Speech Analysis | 🔜 Planned | Reading fluency, hesitations |
| Multi-student Dashboard | 🔜 Planned | Teacher view of entire class |
| PDF/JSON Export | 🔜 Planned | Export results for reports |
| Backend API | 🔜 Planned | Data persistence, analytics |
| Multi-language Support | 🔜 Planned | Malayalam, English, Hindi |

---

## ⚠️ Important Notes

1. **Demo Only**: This is a prototype for demonstration. Expression detection accuracy varies per individual.

2. **Not Diagnostic**: ADHARA detects behavioral patterns, NOT learning disabilities. Always require human review.

3. **Privacy**: Demo uses only local processing. No data is sent externally.

4. **CORS**: When opening HTML demos directly (file://), Ollama won't connect. Always use localhost server.

---

## 📁 Project Structure

```
ADHARA-AI-Powered-Learning-Friction/
├── client/                    # React web application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks (useMouseTracker)
│   │   └── utils/             # Utility functions
│   └── package.json
├── docs/                      # Documentation
│   └── FEATURES.md            # This file
├── mouse-tracker-demo.html    # Standalone mouse tracker demo
├── face-mood-analyzer.html    # Standalone face analyzer demo
└── package.json               # Root package.json
```

---

*Built with ❤️ by Team ADHARA for AI Samasya – ICGAIFE 3.0*
