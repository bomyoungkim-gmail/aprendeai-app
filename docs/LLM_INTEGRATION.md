# LLM Integration Guide for Games

Este documento mapeia onde cada jogo precisa de chamadas LLM reais (atualmente usando mocks).

## Priority Integration Points

### High Priority (Core Gameplay)

#### 1. CONCEPT_LINKING (Taboo)

**File**: `modes/concept_linking.py`
**Location**: `_mock_llm_generation()` method
**Task**: Generate forbidden words list

```python
# Current (Mock):
mocks = {"Democracy": {"forbidden": ["Vote", "Government"]}}

# Replace with:
prompt = f"For '{word}', generate 3-4 synonyms that would make describing it too easy."
response = await self.llm_service.predict_json(prompt)
forbidden = response["forbidden_words"]
```

#### 2. MISCONCEPTION_HUNT

**File**: `modes/misconception_hunt.py`
**Location**: `_generate_statements()` method
**Task**: Generate plausible false statement

```python
# Replace mock with LLM that creates 1 subtle error among 3 statements
```

#### 3. DEBATE_MASTER

**File**: `modes/debate_master.py`
**Location**: `_generate_counterargument()` and `evaluate_answer()`
**Tasks**:

1. Generate intelligent counterargument to user's thesis
2. Evaluate argument strength (logic, evidence, fallacy detection)

#### 4. SOCRATIC_DEFENSE

**File**: `modes/socratic_defense.py`
**Location**: Progressive question generation
**Task**: Generate level 2-5 questions dynamically based on user's previous answer

#### 5. FEYNMAN_TEACHER

**File**: `modes/feynman_teacher.py`
**Location**: `evaluate_answer()`
**Task**: Semantic check if explanation covers key concepts (beyond keyword matching)

### Medium Priority (Enhancement)

#### 6. ANALOGY_MAKER

**Location**: `evaluate_answer()`
**Task**: Check if rewrite preserves meaning AND simplifies appropriately

#### 7. WHAT_IF_SCENARIO

**Location**: `evaluate_answer()`
**Task**: Semantic similarity check for predicted consequences

#### 8. PROBLEM_SOLVER

**Location**: `generate_round()`
**Task**: Generate quiz questions from content context

### Low Priority (Already Functional)

- FREE_RECALL_SCORE: Uses embeddings (may already be integrated)
- CLOZE_SPRINT: Pattern-based (works with current impl)
- SRS_ARENA: Retrieval-based (works with MasteryTracker)
- BOSS_FIGHT_VOCAB: Uses LLM for validation (may be integrated)
- SITUATION_SIM: Rule-based (regex sufficient for MVP)
- TOOL_WORD_HUNT: Quote matching (works)
- RECOMMENDATION_ENGINE: Data-driven (no LLM needed)

## Implementation Pattern

```python
# Standard LLM Call Pattern
class YourGame(BaseGameMode):
    async def some_method(self):
        # Construct prompt
        prompt = self._build_prompt(context)

        # Call LLM (assuming llm_service injected)
        if hasattr(self, 'llm_service'):
            response = await self.llm_service.predict_json(prompt)
            return response
        else:
            # Fallback to mock for testing
            return self._mock_response()
```

## Testing Strategy

1. **Unit Tests**: Continue using mocks (fast, deterministic)
2. **Integration Tests**: Add `@pytest.mark.llm` for real LLM calls
3. **Use VCR.py**: Record/replay LLM responses for CI

## Estimated Effort

- **High Priority (5 games)**: ~2-3 days (detailed prompting + validation)
- **Medium Priority (3 games)**: ~1 day
- **Total**: ~1 week for full LLM integration
