# ADHARA

**AI-Assisted Early Warning System for Learning Friction Detection**

> ADHARA detects learning friction early so humans can support learners sooner.

---

## Overview

ADHARA is a prototype early warning system that identifies **learning friction** during normal learning activities. It supports educators by flagging behavioral indicators before academic failure occurs.

> **Note:** ADHARA is not a diagnostic or medical tool. It supports early educational screening only and requires human review for all findings.

---

## Problem

Learning difficulties are often identified too late—after repeated academic failure. Teachers and parents lack tools to detect early behavioral signals during learning itself.

---

## Solution

ADHARA passively observes learning interactions and flags friction indicators:

- Hesitation patterns
- Repeated retries
- Response inconsistency
- Disengagement signals

The system categorizes findings into friction levels and provides explainable summaries for human review.

---

## Features

| Feature | Description |
|---------|-------------|
| Early Detection | Identifies learning friction indicators before failure |
| Explainable Output | Human-readable explanations, no black-box predictions |
| Privacy-First | Synthetic demo data only, no real user data |
| Human-in-the-Loop | All recommendations require human review |

---

## System Workflow

### Input (Simulated)

- Timestamps
- Retries / Corrections
- Idle durations
- Task completion flags
- Mouse hesitation events (optional)

### Processing

1. Derive behavioral signals from interaction data
2. Aggregate into friction indicators
3. Categorize into: **Reading** | **Attention** | **Memory/Consistency**

### Output

```
Friction Level: Low / Medium / High
Explanation:    [Plain English summary]
Recommendation: Human review suggested
```

---

## Data Policy

All data in this prototype is **synthetic and simulated** for demonstration purposes. No real user data is collected or processed.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CONTEXT.md](./CONTEXT.md) | Build constraints, language rules, and development guidelines |

---

## Tech Stack

*To be defined.*

---

## Team

| Name | Role |
|------|------|
| Jithendra V Anand | Team Lead |
| Bhavith Madhav | Developer |
| Giridhar B Kumar | Developer |
| Aravind Lal | Developer |

---

## Event

**AI Samasya – ICGAIFE 3.0**  
Government of Kerala | IHRD

---

## License

*TBD*
