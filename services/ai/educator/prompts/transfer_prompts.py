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
  "usage_examples": ["string", "string"] (2 examples showing word in context)
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
