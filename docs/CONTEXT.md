Problem Statement: Develop an AI-Based Software Model for Early Detection of Learning Disabilities

our solution

# ADHARA — Build Context

> This document defines the scope and constraints for all development work on ADHARA.  
> All contributors and AI assistants **must** read and follow this context.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| Name | ADHARA |
| Type | Hackathon Prototype |
| Goal | Demonstration, not production |
| Event | AI Samasya – ICGAIFE 3.0 |
| Organizer | Government of Kerala, IHRD |

---

## Problem Statement

**The Challenge:**
In Kerala, classrooms average 35+ students. Teachers cannot observe every child's struggle in real-time, especially during digital learning. When learning moved online, we gained convenience but lost visibility.

**The Cost of Inaction:**
- Students who struggle silently go unnoticed
- Problems surface only after grades drop
- Late intervention = harder to help

**Our Response:**
ADHARA bridges this gap by surfacing behavioral patterns that indicate a child may need support — before their grades reveal the problem.

---

## Target User

| User | Role in ADHARA | Priority |
|------|----------------|----------|
| **Teacher** | Primary user — views dashboard, reviews flagged students | 🔴 Primary |
| School Counselor | Reviews students with persistent friction | 🟡 Secondary |
| Parent | Receives summary reports (future) | 🟢 Future |

> **For this demo:** We focus on the **Teacher** as the primary user.

---

## User Journey

```
Step 1: Student uses a learning activity (quiz, reading task)
            ↓
Step 2: ADHARA silently logs interaction patterns
        (time taken, retries, pauses, corrections)
            ↓
Step 3: Rule-based engine calculates friction indicators
            ↓
Step 4: Teacher dashboard shows:
        "Learner 01: High Reading Friction — Review Suggested"
            ↓
Step 5: Teacher decides next steps (human judgment)
```

---

## Sample Scenario

> **Meet Arjun**
>
> Arjun is a 4th grader. His grades are average — nothing alarming.
>
> But ADHARA notices something: Arjun takes 3x longer on reading tasks. He re-reads sentences repeatedly. He often pauses mid-paragraph.
>
> ADHARA flags: *"Reading Friction — High. Human review suggested."*
>
> The teacher talks to Arjun. Discovers he's been squinting at the screen. A simple eye checkup reveals he needs glasses.
>
> **Early detection. Simple solution. No diagnosis needed.**

---

## Problem Statement

**The Challenge:**
In Kerala, classrooms average 35+ students. Teachers cannot observe every child's struggle in real-time, especially during digital learning. When learning moved online, we gained convenience but lost visibility.

**The Cost of Inaction:**
- Students who struggle silently go unnoticed
- Problems surface only after grades drop
- Late intervention = harder to help

**Our Response:**
ADHARA bridges this gap by surfacing behavioral patterns that indicate a child may need support — before their grades reveal the problem.

---

## Target User

| User | Role in ADHARA | Priority |
|------|----------------|----------|
| **Teacher** | Primary user — views dashboard, reviews flagged students | 🔴 Primary |
| School Counselor | Reviews students with persistent friction | 🟡 Secondary |
| Parent | Receives summary reports (future) | 🟢 Future |

> **For this demo:** We focus on the **Teacher** as the primary user.

---

## User Journey

```
Step 1: Student uses a learning activity (quiz, reading task)
            ↓
Step 2: ADHARA silently logs interaction patterns
        (time taken, retries, pauses, corrections)
            ↓
Step 3: Rule-based engine calculates friction indicators
            ↓
Step 4: Teacher dashboard shows:
        "Learner 01: High Reading Friction — Review Suggested"
            ↓
Step 5: Teacher decides next steps (human judgment)
```

---

## Sample Scenario

> **Meet Arjun**
>
> Arjun is a 4th grader. His grades are average — nothing alarming.
>
> But ADHARA notices something: Arjun takes 3x longer on reading tasks. He re-reads sentences repeatedly. He often pauses mid-paragraph.
>
> ADHARA flags: *"Reading Friction — High. Human review suggested."*
>
> The teacher talks to Arjun. Discovers he's been squinting at the screen. A simple eye checkup reveals he needs glasses.
>
> **Early detection. Simple solution. No diagnosis needed.**

---

## Core Definition

ADHARA:

- Detects **learning friction indicators**
- Based on **interaction behavior**
- Provides **explainable summaries**
- Requires **human review**
- Does **not** diagnose learning disabilities

> If any output implies diagnosis, it is incorrect and must be fixed.

---

## Constraints

### Forbidden

| Category | Description |
|----------|-------------|
| Medical Terms | Do not mention or classify medical conditions |
| Labels | Do not reference dyslexia, ADHD, dyscalculia, etc. |
| Biometrics | Do not use webcam, face/eye tracking, or sensory data |
| Claims | Do not state accuracy percentages |
| Data | Do not use real user data or scrape datasets |
| Scope | Do not introduce ML training pipelines or expand beyond MVP |

### Required

| Requirement | Description |
|-------------|-------------|
| Synthetic Data | Use only simulated/fake data |
| Fake Users | Use demo identifiers (Student A, Learner 01) |
| Simple Logic | Use rules/thresholds, not trained models |
| Demo Stability | Prioritize working demo over completeness |

---

## System Specification

### Input (Simulated)

The system processes mocked or manually entered data:

- Timestamps
- Retries / Corrections
- Idle durations
- Task completion flags
- Mouse hesitation events (optional)

### Processing

1. Derive behavioral signals from interaction data
2. Aggregate into learning friction indicators
3. Map to categories:

| Category | Description |
|----------|-------------|
| Reading Friction | Difficulty with text-based tasks |
| Attention Friction | Signs of disengagement or distraction |
| Memory / Consistency Friction | Inconsistent responses or repeated errors |

Use **rules or thresholds**, not trained ML models.

### Output Format

```
Friction Level:   Low / Medium / High
Explanation:      [Plain English summary]
Recommendation:   Human review suggested
```

**Never output:** diagnostic labels, medical recommendations, or treatment suggestions.

---

## AI Usage Policy

| Permitted | Not Permitted |
|-----------|---------------|
| Summarizing detected patterns | Predicting disorders |
| Generating human-readable explanations | Making decisions |
| | Replacing human judgment |

**Explainability takes priority over intelligence.**

---

## Demo Requirements

### Assumptions

- Scripted inputs
- Predictable outputs
- Single happy path

### Requirements

- Must run without errors
- Must show results immediately
- Avoid randomness unless controlled

---

## Code Guidelines

- Keep files small and readable
- Add comments explaining **why**, not just how
- Use clear variable names (`hesitation_score`, not `x1`)
- Avoid premature optimization

---

## Language Rules

### Forbidden Terms

Do not use these words in any output or documentation:

```
diagnosis, disability, medical, clinical,
treatment, patient, accuracy %, DSM, ICD
```

### Approved Terms

Use these instead:

```
early screening, learning friction, behavioral indicators,
interaction patterns, human review, educational support
```

> If language violates these rules, fix it immediately.

---

## North Star

> **ADHARA detects learning friction early so humans can support learners sooner.**

All code, logic, and outputs must align with this mission.

---

## Team

| Member | Role |
|--------|------|
| Jithendra V Anand | Team Lead |
| Bhavith Madhav | Developer |
| Giridhar B Kumar | Developer |
| Aravind Lal | Developer |

---

*Last Updated: January 2026*
