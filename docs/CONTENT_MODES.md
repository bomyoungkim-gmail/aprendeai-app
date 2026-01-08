# Content Modes & Educator Behavior Guide

## 1. User-Facing Documentation: Mode Behaviors

The "Educator" adapts its teaching style based on the type of content being studied. Below are the available modes and their distinct behaviors:

| Mode           | Used For...                                      | Educator Behavior                                                                                                                                                                |
| :------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TECHNICAL**  | Manuals, specs, documentation, how-tos.          | **Precise & Direct.** Focuses on clear definitions and step-by-step explanations. Avoids unnecessary interruption. Less Socratic, more instructional.                            |
| **DIDACTIC**   | Textbooks, course materials (`SCHOOL_MATERIAL`). | **Scaffolding & Socratic.** Uses frequent distinct checks, guided discovery questions, and breaks complex ideas into small steps.                                                |
| **NARRATIVE**  | Fiction, stories, biographies, history books.    | **Flow-Preserving.** Minimizes interruptions to maintain immersion. Checks for understanding only at key plot points or chapter breaks. Focuses on characters, plot, and themes. |
| **NEWS**       | News articles, current events.                   | **Context & Fact-Checking.** Focuses on context, causal relationships, defining domain terms, and evaluating sources/data.                                                       |
| **SCIENTIFIC** | Research papers (`ARXIV`), technical reports.    | **Methodical & Critical.** Emphasizes hypothesis, methodology, evidence evaluation, variables, and statistical reasoning.                                                        |
| **LANGUAGE**   | Language learning texts.                         | **Linguistic Focus.** Concentrates on vocabulary, morphology, syntax, pronunciation, and usage patterns.                                                                         |

---

## 2. Frontend Integration Guide: UI Override

The frontend can override the automatically detected mode for a specific session. This is useful if a user wants to read a "News Article" with a "Language Learning" focus, for example.

### How to use

When starting a session via `POST /sessions`, include the `uiMode` field in the payload.

**Endpoint:** `POST /sessions`

**Payload:**

```json
{
  "contentId": "uuid-of-content",
  "uiMode": "LANGUAGE", // Optional. enum: [TECHNICAL, DIDACTIC, NARRATIVE, NEWS, SCIENTIFIC, LANGUAGE]
  "persistUiMode": true // Optional. If true, saves this preference to the database for future sessions.
}
```

**Behavior:**

1. **Priority**: `uiMode` overrides any heuristic or previously inferred mode.
2. **Persistence**: If `persistUiMode` is true, the content's mode in the database is updated to this new value (source: `USER`).

---

## 3. Backend Logic: Heuristics & Inference

If no mode is explicitly set by the Producer or User, the system infers it from the `ContentType` and content analysis.

### Default Mappings

- **ARXIV** → `SCIENTIFIC`
- **NEWS** → `NEWS`
- **SCHOOL_MATERIAL** → `DIDACTIC`
- **VIDEO/AUDIO** → Inherits from transcript or defaults to `TECHNICAL`

### Narrative Heuristic (for Articles/Text)

For generic types like `ARTICLE`, `TEXT`, or `WEB_CLIP`, the system analyzes the `raw_text` to detect narrative structures.

**Logic:**

- **Metric**: Dialogue Density.
- **Algorithm**: Calculates the percentage of characters belonging to dialogue (content within quotation marks `"` or `'`).
- **Threshold**: If `> 1%` of the text is dialogue, it classifies as `NARRATIVE`.
- **Fallback**: If below threshold, defaults to `TECHNICAL`.

_Note: This heuristic is a lightweight check designed to distinguish stories/fiction from expository articles without heavy ML costs._
