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

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/JithuMon10/ADHARA-AI-Powered-Learning-Friction.git
cd ADHARA-AI-Powered-Learning-Friction

# Install dependencies
cd client
npm install

# Start the development server
npm run dev
```

### AI Analysis (Optional)
For AI-powered report generation, install and run Ollama:
```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2

# Run with CORS enabled
OLLAMA_ORIGINS="*" ollama serve
```

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

## 📊 How It Works

1. **Child Session** - Engaging, game-like activities designed to not feel like tests
2. **Baseline Assessment** - 6-8 questions across cognitive domains (reading, math, attention)
3. **AI Mid-Analysis** - Real-time pattern detection adjusts question flow dynamically
4. **Follow-up Probing** - Targeted questions for areas showing friction
5. **Report Generation** - Comprehensive clinical-grade analysis for educators

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
