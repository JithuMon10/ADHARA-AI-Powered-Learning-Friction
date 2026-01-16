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
