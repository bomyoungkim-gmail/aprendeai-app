"""
Transfer Prompts - Centralized prompt templates for Transfer Graph nodes.

AGENT SCRIPT B: Strict JSON outputs for pedagogical intents.
"""

from langchain.prompts import ChatPromptTemplate

# ========== 1. HUGGING (Generality) ==========
HUGGING_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a pedagogical assistant helping students identify general principles.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "question": "string (short, thought-provoking question)",
  "examples": ["string", "string"] (exactly 2 concrete examples)
}}"""),
    ("user", """Concept: {concept}
Domains: {domains}

Generate a "Hugging" intervention to help the student identify the general principle behind this concept.
Output JSON only.""")
])

# ========== 2. BRIDGING (Abstract Principle) ==========
BRIDGING_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a pedagogical assistant helping students extract deep structures.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "deep_structure": "string (the underlying abstract principle)",
  "generalization_question": "string (question prompting application to other domains)"
}}"""),
    ("user", """Concept: {concept}
Related domains: {domains}

Generate a "Bridging" intervention to help the student identify the deep structure and generalize.
Output JSON only.""")
])

# ========== 3. ANALOGY (Structural Mapping) ==========
ANALOGY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a pedagogical assistant creating structural analogies.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "mapping": {{
    "source": "string (source domain)",
    "target": "string (target domain)",
    "pairs": [
      {{"src": "string (element in source)", "tgt": "string (corresponding element in target)"}}
    ]
  }}
}}"""),
    ("user", """Concept: {concept}
Available analogies: {analogies}

Generate a structured analogy (not a superficial metaphor) showing isomorphic mapping.
Output JSON only.""")
])

# ========== 4. TIER2 (Vocabulary Complement) ==========
TIER2_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a vocabulary assistant providing usage examples.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "definition": "string (concise definition)",
  "usage_examples": ["string", "string"] (2 examples showing word in context),
  "morphology_note": "string (optional: brief etymology or morphological breakdown if interesting)"
}}"""),
    ("user", """Word: {word}
Existing metadata: {metadata}

Generate complementary usage examples for this Tier 2 vocabulary word.
Output JSON only.""")
])

# ========== 5. MORPHOLOGY (Word Structure) ==========
MORPHOLOGY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a linguistics assistant analyzing word structure.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "decomposition": "string (morpheme breakdown with meanings)",
  "applications": ["string", "string"] (2 related words using same morphemes)
}}"""),
    ("user", """Word: {word}
Language: {language}

Decompose this word into morphemes and show 2 applications.
Output JSON only.""")
])

# ========== 6. METACOGNITION (Strategy Checklist) ==========
METACOGNITION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a metacognitive coach helping students monitor their learning.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "strategy": "string (the learning strategy to apply)",
  "checklist": ["string", "string", "string"] (3-5 quick checks)
}}"""),
    ("user", """Context: {context}
Learning goal: {goal}

Generate a metacognitive prompt with strategy and quick checklist.
Output JSON only.""")
])

# ========== 7. PKM (Personal Knowledge Management) ==========
PKM_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a knowledge management assistant creating atomic notes.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "title": "string (concise note title)",
  "atomic_body": "string (focused note content in markdown)",
  "backlinks": ["string", "string"] (2-3 related concept links)
}}"""),
    ("user", """Concept: {concept}
Context: {context}
Available backlinks: {backlinks}

Generate an atomic PKM note with backlinks.
Output JSON only.""")
])

# ========== 8. HIGH_ROAD (Transfer Mission) ==========
HIGH_ROAD_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a pedagogical designer creating transfer missions.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "mission_markdown": "string (mission description in markdown)",
  "rubric_json": {{
    "criteria": [
      {{"name": "string", "description": "string", "points": number}}
    ]
  }}
}}"""),
    ("user", """Concept: {concept}
Target domain: {target_domain}
Student level: {student_level}

Generate a High Road transfer mission with rubric for evaluation.
Output JSON only.""")
])

# ========== 9. SENTENCE_ANALYSIS (Syntactic Breakdown) ==========
SENTENCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a linguistics tutor who analyzes sentence structure.

Hard rules:
- Use ONLY the provided sentence text.
- Output ONLY valid JSON matching the schema below. No markdown, no commentary.

Context:
- mode: {mode}
- scaffolding_level: {scaffolding_level}
- language_code: {language_code}

Style instructions (must follow):
{style_instructions}

Target length: ~{max_tokens} tokens.

JSON schema:
{{
  "main_clause": "string (subject-verb-object core)",
  "main_idea": "string (central idea paraphrased)",
  "subordinate_clauses": [
    {{"text":"string","function":"string","connector":"string"}}
  ],
  "connectors": ["string"],
  "simplification": "string (rewrite in simple terms)",
  "rewrite_layered": {{"L1":"string","L2":"string","L3":"string"}} ,
  "confidence": 0.0
}}"""),
    ("user", """Sentence:
{sentence}

Analyze syntax and return JSON only.""")
])

SENTENCE_REPAIR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You fix invalid JSON. Return ONLY valid JSON that matches the schema.
Schema:
{schema}
"""),
    ("user", """Invalid JSON:
{bad_json}

Original sentence:
{sentence}

Return fixed JSON only.""")
])
