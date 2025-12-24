"""
AI Content Generator

Generates complete educational lessons from text prompts using LLMs.
Creates structured content including explanations, examples, exercises, and assessments.
"""
import logging
from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from llm_factory import LLMFactory

logger = logging.getLogger(__name__)

class LessonGenerator:
    """
    Generates complete educational lessons using AI.
    """
    
    def __init__(self):
        self.llm_factory = LLMFactory()
        # Use TIER_SMART for high-quality content generation
        self.llm = self.llm_factory.get_smart_llm(temperature=0.7)
    
    async def generate_lesson(
        self,
        topic: str,
        grade_level: str = "8_EF",
        language: str = "pt-BR",
        lesson_duration: int = 45,
        learning_objectives: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete lesson plan.
        
        Args:
            topic: The subject/topic to teach (e.g., "Fotossíntese")
            grade_level: Target schooling level
            language: Language for content
            lesson_duration: Duration in minutes
            learning_objectives: Optional specific objectives
            
        Returns:
            Complete lesson structure
        """
        prompt = ChatPromptTemplate.from_template(
            """
            Create a comprehensive, engaging educational lesson plan.
            
            Topic: {topic}
            Grade Level: {grade_level}
            Language: {language}
            Duration: {duration} minutes
            Learning Objectives: {objectives}
            
            Generate a complete lesson with:
            1. Title: Catchy, student-friendly title
            2. Introduction: Hook to engage students (2-3 paragraphs)
            3. Core Content: Main explanation with examples (structured sections)
            4. Key Concepts: List of important terms and definitions
            5. Practice Exercises: 3-5 exercises of varying difficulty
            6. Assessment Questions: 5 multiple-choice questions
            7. Extension Activities: Optional advanced exploration
            8. Summary: Recap of main points
            9. Suggested Games: Which AprendeAI game modes fit best
            
            Make it pedagogically sound, age-appropriate, and engaging.
            Use real-world examples and analogies students can relate to.
            
            Output strictly in JSON:
            {{
                "title": "...",
                "introduction": "...",
                "core_content": [
                    {{"section_title": "...", "content": "...", "examples": ["..."]}}
                ],
                "key_concepts": {{"term": "definition"}},
                "practice_exercises": [
                    {{"question": "...", "difficulty": 1-5, "hint": "..."}}
                ],
                "assessment": [
                    {{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0-3, "explanation": "..."}}
                ],
                "extension_activities": ["..."],
                "summary": "...",
                "suggested_games": ["TOOL_WORD_HUNT", "ROLEPLAY_DISCOVERY", etc],
                "estimated_duration_minutes": 45
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "topic": topic,
                "grade_level": grade_level,
                "language": language,
                "duration": lesson_duration,
                "objectives": learning_objectives or "General understanding of the topic"
            })
            
            # Add metadata
            result["metadata"] = {
                "generated_by": "ai",
                "topic": topic,
                "grade_level": grade_level,
                "language": language
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating lesson: {e}")
            raise
    
    async def generate_unit_plan(
        self,
        unit_title: str,
        topics: List[str],
        grade_level: str = "8_EF",
        total_weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Generate a multi-week unit plan with progression.
        
        Args:
            unit_title: Overall unit title (e.g., "Células e Sistemas Corporais")
            topics: List of topics to cover
            grade_level: Target level
            total_weeks: Duration in weeks
            
        Returns:
            Structured unit plan with weekly breakdown
        """
        prompt = ChatPromptTemplate.from_template(
            """
            Create a comprehensive multi-week unit plan for education.
            
            Unit: {unit_title}
            Topics to Cover: {topics}
            Grade Level: {grade_level}
            Duration: {weeks} weeks
            
            Design a progressive learning path with:
            1. Unit Overview & Learning Goals
            2. Weekly Breakdown:
               - Week theme
               - Topics covered
               - Key activities
               - Assessment checkpoints
            3. Scaffolding Strategy (how concepts build on each other)
            4. Differentiation Tips (for diverse learners)
            5. Final Project/Assessment
            
            Output strictly in JSON:
            {{
                "unit_title": "...",
                "unit_overview": "...",
                "learning_goals": ["..."],
                "weekly_plans": [
                    {{
                        "week": 1,
                        "theme": "...",
                        "topics": ["..."],
                        "activities": ["..."],
                        "assessment": "..."
                    }}
                ],
                "scaffolding_notes": "...",
                "differentiation_tips": ["..."],
                "final_assessment": {{
                    "type": "project|exam|presentation",
                    "description": "...",
                    "rubric": {{"criteria": "description"}}
                }}
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "unit_title": unit_title,
                "topics": ", ".join(topics),
                "grade_level": grade_level,
                "weeks": total_weeks
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating unit plan: {e}")
            raise
    
    async def generate_from_curriculum(
        self,
        curriculum_text: str,
        grade_level: str
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple lessons from curriculum standards.
        
        Args:
            curriculum_text: Official curriculum or standards text
            grade_level: Target level
            
        Returns:
            List of lesson outlines
        """
        prompt = ChatPromptTemplate.from_template(
            """
            Analyze this curriculum/standards document and generate lesson topics.
            
            Curriculum: {curriculum}
            Grade Level: {grade_level}
            
            Extract key topics and create lesson outlines for each.
            
            Output strictly in JSON:
            {{
                "lessons": [
                    {{
                        "topic": "...",
                        "subtopics": ["..."],
                        "prerequisite_knowledge": ["..."],
                        "estimated_duration_minutes": 45,
                        "complexity_level": 1-5
                    }}
                ]
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "curriculum": curriculum_text[:5000],  # Limit length
                "grade_level": grade_level
            })
            
            return result.get("lessons", [])
            
        except Exception as e:
            logger.error(f"Error generating from curriculum: {e}")
            raise


# Singleton
lesson_generator = LessonGenerator()
