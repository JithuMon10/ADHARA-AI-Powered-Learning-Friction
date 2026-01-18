# ADHARA
### AI-Powered Learning Friction Detection System

<div align="center">

*Precision AI for early detection of learning difficulties through multimodal behavioral analysis*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)

</div>

---

## 🎯 Overview

**ADHARA** (AI-Driven Holistic Assessment for Developmental Recognition and Assistance) is an intelligent early warning system that detects learning friction patterns in children. By analyzing behavioral signals across multiple modalities, ADHARA helps educators identify potential learning difficulties like **Dyslexia**, **Dyscalculia**, and **ADHD** before they become persistent challenges.

> 💡 **Why ADHARA?** Traditional assessments only measure results. ADHARA analyzes the *process* of learning—capturing hesitation, stress, attention patterns, and cognitive load in real-time.

### ✨ Key Features

- 🧠 **Adaptive Learning Sessions** - Questions adjust in real-time based on performance patterns
- 👁️ **Face & Emotion Analysis** - Detects stress, confusion, and engagement through webcam
- 🖱️ **Mouse Dynamics Tracking** - Analyzes hesitation, jitter, and interaction velocity
- 🎤 **Speech Analysis** - Monitors fluency, stammering, and verbal hesitation patterns
- 📊 **AI-Powered Reports** - Generates clinical-grade analysis using local LLM (Ollama)
- 🔒 **Privacy-First** - All processing happens locally, no data leaves the machine

---

## 📈 Multimodal Analysis

ADHARA captures four distinct behavioral streams to create a comprehensive friction profile:

| Data Stream | What We Measure | Technology |
|:------------|:----------------|:-----------|
| **Vision** | Gaze tracking, blink rate, attention drift | face-api.js |
| **Emotion** | Micro-expressions, stress detection, engagement | TensorFlow.js |
| **Motor** | Mouse velocity, hesitation patterns, jitter | Custom tracking |
| **Voice** | Fluency, filler words, stammering, pauses | Web Speech API |

---

## 🛠️ Installation & Setup Guide

### Prerequisites
Before you begin, ensure you have the following installed:
1. **Node.js** (v18 or higher) - [Download Here](https://nodejs.org/)
2. **Git** - [Download Here](https://git-scm.com/)

### 1. Close the Repository
```bash
git clone https://github.com/JithuMon10/ADHARA-AI-Powered-Learning-Friction.git
cd ADHARA-AI-Powered-Learning-Friction
```

### 2. Install Frontend Dependencies
**Important:** You must move into the `client` directory before installing dependencies.
```bash
cd client
npm install
```

### 3. Start the Application
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 🤖 Setting Up AI Analysis (Ollama)

For the detailed "Clinical Analysis Report" to work generates, you need **Ollama** running locally. The app works without it, but the "Analysis" tab will be disabled.

### Recommended Model: Qwen 2.5 7B
We recommend using **Qwen 2.5 7B** for the best balance of performance and reasoning quality for behavior analysis.

### Minimum System Requirements
To run the 7B model locally, your system should meet these specs:
- **RAM:** 8GB minimum (16GB recommended)
- **CPU:** Modern Quad-core processor (Intel i5/Ryzen 5 or newer)
- **GPU (No exceptions):** NVIDIA GPU with 6GB+ VRAM or Apple Silicon (M1/M2/M3) for faster generation
- **Storage:** ~10GB free space

### Setup Steps
1. **Download Ollama** from [ollama.ai](https://ollama.ai).
2. **Install the Model**: Open your terminal/command prompt and run:
   ```bash
   ollama pull qwen2.5:7b
   ```
3. **Run Ollama Server**: You must allow generic origins for the browser to access it:
   ```bash
   # Linux/Mac
   OLLAMA_ORIGINS="*" ollama serve

   # Windows PowerShell
   $env:OLLAMA_ORIGINS="*"; ollama serve
   ```

---

## ❓ Troubleshooting

**"Module not found" or "Vite not found"**
> ❌ Error: `'vite' is not recognized` or `missing module face-api.js`
>
> ✅ **Fix:** You likely forgot to `cd client`. Run:
> ```bash
> cd client
> npm install
> npm run dev
> ```

**"AI Analysis is offline" / "Click to generate analysis" does nothing**
> ❌ The button is disabled or says "AI Offline".
>
> ✅ **Fix:** Ensure Ollama is running with `OLLAMA_ORIGINS="*"`. The app needs this to bypass CORS restrictions locally.

**Webcam not working**
> ❌ Browser blocks camera access.
>
> ✅ **Fix:** Check permissions in your browser address bar. Ensure no other app (Zoom/Teams) is using the camera.

---

## 🏗️ Architecture

```
ADHARA/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Child activity & Teacher dashboard
│   │   └── utils/            # Analysis modules
│   │       ├── faceAnalysis.js      # Emotion & gaze detection
│   │       ├── speechAnalysis.js    # Voice pattern analysis
│   │       └── disorderDetection.js # Clinical pattern matching
│   └── public/models/        # TensorFlow face detection models
├── data/                     # Baseline datasets
└── docs/                     # Documentation
```

---

## 🎓 Use Cases

| Application | Description |
|-------------|-------------|
| **Schools** | Early screening for learning difficulties |
| **Special Education** | Progress monitoring and intervention planning |
| **Research** | Behavioral data collection for cognitive studies |
| **Parents** | At-home learning pattern awareness |

---

## 👨‍💻 Team

<div align="center">

| Jithendra V Anand | Aravind Lal |
|:---:|:---:|
| <img src="https://github.com/JithuMon10.png" width="100" style="border-radius:50%"> | <img src="https://github.com/mfscpayload-690.png" width="100" style="border-radius:50%"> |
| [![GitHub](https://img.shields.io/badge/GitHub-JithuMon10-181717?style=flat&logo=github)](https://github.com/JithuMon10) | [![GitHub](https://img.shields.io/badge/GitHub-mfscpayload--690-181717?style=flat&logo=github)](https://github.com/mfscpayload-690) |
| Lead Developer | Contributor |

</div>

---

## 📄 License

This project is open-source and available under the MIT License.

---

<div align="center">

**Built with ❤️ for early intervention in education**

⭐ **Star this repo if you find it useful!** ⭐

</div>
