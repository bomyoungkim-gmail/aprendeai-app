"""
LangChain chains for AI asset generation
Each chain optimized with task-specific LLM provider
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from llm_factory import LLMFactory

# ============================================================================
# CHAIN 1: SUMMARIZE (Premium - GPT-4)
# ============================================================================

SUMMARIZE_TEMPLATE = """You are an expert educator adapting content for students.

Task: Summarize and adapt the following text for layer {layer} (complexity level).
Target audience: {education_level}

Layer Guidelines:
- L1: Simplified vocabulary, short sentences (10-15 words), concrete examples, avoid abstractions
- L2: Standard vocabulary, moderate complexity sentences (15-25 words), some abstract concepts  
- L3: Original/advanced vocabulary, complex sentences, abstract thinking, nuanced concepts

Original Text:
{text}

Instructions:
1. Adapt vocabulary and sentence structure to the target layer
2. Maintain factual accuracy
3. Preserve key concepts and ideas
4. Use clear, engaging language
5. Format output in clean markdown

Output: Adapted text in markdown format (h1 title, paragraphs, lists as needed)"""

summarize_chain = (
    ChatPromptTemplate.from_template(SUMMARIZE_TEMPLATE)
    | LLMFactory.create_for_task('summarize')
    | StrOutputParser()
)

# ============================================================================
# CHAIN 2: EXTRACT WORDS (Cheap - Gemini Flash)
# ============================================================================

EXTRACT_WORDS_TEMPLATE = """From the following text, extract 5-10 key vocabulary words that students should learn.

Education level: {education_level}
Text: {text}

Selection criteria:
- Important for comprehension
- Challenging but learnable for this level
- Frequently used in similar contexts
- Mix of verbs, nouns, adjectives

Output format (JSON only, no markdown):
{{
  "words": ["word1", "word2", "word3", ...]
}}"""

extract_words_chain = (
    ChatPromptTemplate.from_template(EXTRACT_WORDS_TEMPLATE)
    | LLMFactory.create_for_task('extract_words')
    | JsonOutputParser()
)

# ============================================================================
# CHAIN 3: BUILD GLOSSARY (Cheap - Gemini Flash)
# ============================================================================

GLOSSARY_TEMPLATE = """Create educational definitions for these vocabulary words.

Words: {words}
Context: {text}
Education level: {education_level}

For each word provide:
1. Definition: Clear, simple explanation appropriate for the education level
2. Example: Sentence using the word in context (different from the original text)

Output format (JSON only, no markdown):
{{
  "glossary": [
    {{
      "word": "example",
      "definition": "A sample or illustration used to explain something",
      "example": "The teacher used a simple example to explain the concept."
    }}
  ]
}}"""

glossary_chain = (
    ChatPromptTemplate.from_template(GLOSSARY_TEMPLATE)
    | LLMFactory.create_for_task('glossary')
    | JsonOutputParser()
)

# ============================================================================
# CHAIN 4: CREATE CUES (Balanced - Claude Sonnet)
# ============================================================================

CUES_TEMPLATE = """Generate Cornell-style cue questions for this text.

Text: {text}
Target words: {target_words}
Education level: {education_level}

Cornell cue guidelines:
- 5-8 concise questions
- Focus on main ideas and key concepts
- Questions should prompt recall and understanding
- Mix factual recall with conceptual questions
- Reference target vocabulary where appropriate

Output format (JSON only, no markdown):
{{
  "cues": [
    {{
      "id": "cue1",
      "prompt": "What is the main purpose of...?",
      "hint": "Think about the first paragraph"
    }}
  ]
}}"""

cues_chain = (
    ChatPromptTemplate.from_template(CUES_TEMPLATE)
    | LLMFactory.create_for_task('cues')
    | JsonOutputParser()
)

# ============================================================================
# CHAIN 5: CREATE CHECKPOINTS (Balanced - Claude Sonnet)
# ============================================================================

CHECKPOINTS_TEMPLATE = """Create comprehension checkpoint questions for monitoring understanding.

Text: {text}
Education level: {education_level}

Checkpoint guidelines:
- 3-5 strategic questions
- Place at key moments in the text
- Short answer or quick response format
- Test understanding of main ideas
- Progressive difficulty

Output format (JSON only, no markdown):
{{
  "checkpoints": [
    {{
      "id": "check1",
      "question": "Explain in your own words what happens when...?",
      "expected_response_type": "short_answer"
    }}
  ]
}}"""

checkpoints_chain = (
    ChatPromptTemplate.from_template(CHECKPOINTS_TEMPLATE)
    | LLMFactory.create_for_task('checkpoints')
    | JsonOutputParser()
)

# ============================================================================
# CHAIN 6: CREATE POST QUIZ (Premium - GPT-4)
# ============================================================================

QUIZ_TEMPLATE = """Create a post-reading comprehension quiz.

Text: {text}
Target words: {target_words}
Education level: {education_level}

Quiz guidelines:
- 5 multiple choice questions
- 4 options each (A, B, C, D)
- Mix of factual recall and conceptual understanding
- Include at least 2 questions about target vocabulary
- Provide clear explanations for correct answers

Output format (JSON only, no markdown):
{{
  "quiz_post": [
    {{
      "id": "q1",
      "question": "What is the main idea of the text?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correct_answer": "Option A text",
      "explanation": "This is correct because..."
    }}
  ]
}}"""

quiz_chain = (
    ChatPromptTemplate.from_template(QUIZ_TEMPLATE)
    | LLMFactory.create_for_task('quiz')
    | JsonOutputParser()
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_chain_info():
    """Get information about all chains and their providers."""
    tasks = ['summarize', 'extract_words', 'glossary', 'cues', 'checkpoints', 'quiz']
    return [LLMFactory.get_task_info(task) for task in tasks]


if __name__ == "__main__":
    # Test chains info
    print("Chain Configuration:")
    print("=" * 50)
    for info in get_chain_info():
        print(f"{info['task']:20} | {info['tier']:10} | {info['provider']:10} | {info['model']}")
