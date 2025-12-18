"""
Pydantic schemas for AI-generated assets
Validates structure of generated educational content
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class GlossaryEntry(BaseModel):
    """Single vocabulary word with definition and example."""
    word: str = Field(..., description="The vocabulary word")
    definition: str = Field(..., description="Clear, student-friendly definition")
    example: str = Field(..., description="Example sentence using the word")


class Cue(BaseModel):
    """Cornell-style cue question."""
    id: str = Field(..., description="Unique identifier for the cue")
    prompt: str = Field(..., description="The cue question")
    hint: Optional[str] = Field(None, description="Optional hint for students")


class Checkpoint(BaseModel):
    """Comprehension checkpoint question."""
    id: str = Field(..., description="Unique identifier")
    question: str = Field(..., description="The checkpoint question")
    expected_response_type: str = Field(
        ..., 
        description="'short_answer' or 'multiple_choice'"
    )


class QuizQuestion(BaseModel):
    """Post-quiz multiple choice question."""
    id: str = Field(..., description="Unique identifier")
    question: str = Field(..., description="The quiz question")
    options: List[str] = Field(..., description="4 answer options")
    correct_answer: str = Field(..., description="The correct answer (exact match to one option)")
    explanation: str = Field(..., description="Explanation of why this is correct")


class GeneratedAsset(BaseModel):
    """Complete AI-generated educational asset."""
    layer: str = Field(..., pattern="^(L1|L2|L3)$", description="Complexity layer")
    title: str = Field(..., description="Title for the adapted content")
    body_markdown: str = Field(..., description="Main adapted content in markdown")
    target_words: List[str] = Field(..., description="5-10 key vocabulary words")
    glossary: List[GlossaryEntry] = Field(..., description="Definitions for target words")
    cues: List[Cue] = Field(..., description="Cornell-style cue questions")
    checkpoints: List[Checkpoint] = Field(..., description="Comprehension checkpoints")
    quiz_post: List[QuizQuestion] = Field(..., description="Post-reading quiz")
    difficulty_estimate: int = Field(..., ge=1, le=10, description="Estimated difficulty 1-10")
    length_estimate: int = Field(..., description="Estimated character count")
    prompt_version: str = Field(..., description="Version of prompts used")


# Example validation
if __name__ == "__main__":
    # Test schema
    asset = GeneratedAsset(
        layer="L1",
        title="Test Asset",
        body_markdown="# Test\n\nContent here",
        target_words=["word1", "word2"],
        glossary=[
            GlossaryEntry(
                word="word1",
                definition="A test word",
                example="This is word1 in a sentence."
            )
        ],
        cues=[Cue(id="c1", prompt="What is word1?", hint=None)],
        checkpoints=[Checkpoint(id="ch1", question="Test?", expected_response_type="short_answer")],
        quiz_post=[
            QuizQuestion(
                id="q1",
                question="What is word1?",
                options=["A", "B", "C", "D"],
                correct_answer="A",
                explanation="Because..."
            )
        ],
        difficulty_estimate=5,
        length_estimate=100,
        prompt_version="v1.0"
    )
    print("Schema validation passed!")
    print(asset.model_dump_json(indent=2))
