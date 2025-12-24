"""
Automated Grading & Feedback System

Uses LLM to grade open-ended responses with pedagogical rubrics.
Provides detailed feedback highlighting strengths and areas for improvement.
"""
import logging
from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from llm_factory import LLMFactory

logger = logging.getLogger(__name__)

class AutoGrader:
    """
    Automated grading system for essays, short answers, and open-ended responses.
    """
    
    # Default rubric criteria
    DEFAULT_RUBRIC = {
        "content": {
            "weight": 0.4,
            "description": "Correctness and depth of understanding"
        },
        "clarity": {
            "weight": 0.2,
            "description": "Clear expression and organization"
        },
        "examples": {
            "weight": 0.2,
            "description": "Use of relevant examples and evidence"
        },
        "creativity": {
            "weight": 0.2,
            "description": "Original thinking and insights"
        }
    }
    
    def __init__(self):
        self.llm_factory = LLMFactory()
        # Use TIER_SMART for accurate grading
        self.llm = self.llm_factory.get_smart_llm(temperature=0.3)
    
    async def grade_response(
        self,
        question: str,
        student_answer: str,
        expected_answer: Optional[str] = None,
        rubric: Optional[Dict[str, Any]] = None,
        max_score: int = 100,
        grade_level: str = "8_EF"
    ) -> Dict[str, Any]:
        """
        Grade an open-ended response.
        
        Args:
            question: The question/prompt
            student_answer: Student's response
            expected_answer: Model answer (optional)
            rubric: Custom rubric (optional, uses default if not provided)
            max_score: Maximum possible score
            grade_level: Student level for appropriate expectations
            
        Returns:
            Detailed grading with score, feedback, and suggestions
        """
        rubric = rubric or self.DEFAULT_RUBRIC
        
        prompt = ChatPromptTemplate.from_template(
            """Você é um professor experiente avaliando uma resposta de aluno.
            
QUESTÃO:
{question}

RESPOSTA DO ALUNO:
{student_answer}

{expected_section}

RUBRICA DE AVALIAÇÃO:
{rubric_description}

Nível do Aluno: {grade_level}
Pontuação Máxima: {max_score}

TAREFA:
1. Avalie a resposta usando a rubrica fornecida
2. Para cada critério, atribua pontuação (0-100) e justifique
3. Identifique pontos fortes e áreas de melhoria
4. Forneça feedback construtivo e encorajador
5. Sugira próximos passos para aprendizado

Output estritamente em JSON:
{{
    "overall_score": 0-{max_score},
    "score_percentage": 0.0-100.0,
    "criteria_scores": {{
        "criterion_name": {{
            "score": 0-100,
            "weight": 0.0-1.0,
            "reasoning": "justificativa detalhada"
        }}
    }},
    "strengths": ["ponto forte 1", "ponto forte 2"],
    "areas_for_improvement": ["área 1", "área 2"],
    "detailed_feedback": "feedback narrativo completo",
    "suggestions": ["sugestão de próximo passo 1", "sugestão 2"],
    "grade_letter": "A|B|C|D|F",
    "encouragement": "mensagem encorajadora personalizada"
}}
            """
        )
        
        # Build rubric description
        rubric_desc = "\n".join([
            f"- {name.upper()} ({data['weight']*100}%): {data['description']}"
            for name, data in rubric.items()
        ])
        
        # Build expected answer section
        expected_section = ""
        if expected_answer:
            expected_section = f"RESPOSTA ESPERADA (para referência):\n{expected_answer}\n"
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "question": question,
                "student_answer": student_answer,
                "expected_section": expected_section,
                "rubric_description": rubric_desc,
                "grade_level": grade_level,
                "max_score": max_score
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error grading response: {e}")
            return {
                "overall_score": 0,
                "score_percentage": 0.0,
                "detailed_feedback": "Erro ao avaliar resposta. Por favor, tente novamente.",
                "error": str(e)
            }
    
    async def grade_essay(
        self,
        prompt: str,
        essay: str,
        word_count_target: Optional[int] = None,
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Grade a full essay with additional writing-specific criteria.
        
        Args:
            prompt: Essay prompt/assignment
            essay: Student's essay
            word_count_target: Expected word count (optional)
            focus_areas: Specific areas to evaluate (optional)
            
        Returns:
            Comprehensive essay evaluation
        """
        essay_rubric = {
            "thesis": {"weight": 0.25, "description": "Clear thesis statement and central argument"},
            "organization": {"weight": 0.20, "description": "Logical structure and flow"},
            "evidence": {"weight": 0.25, "description": "Use of supporting evidence and examples"},
            "language": {"weight": 0.15, "description": "Grammar, vocabulary, and style"},
            "conclusion": {"weight": 0.15, "description": "Effective conclusion and summary"}
        }
        
        grading = await self.grade_response(
            question=prompt,
            student_answer=essay,
            rubric=essay_rubric,
            max_score=100
        )
        
        # Add word count analysis
        word_count = len(essay.split())
        grading["word_count"] = word_count
        
        if word_count_target:
            grading["word_count_target"] = word_count_target
            grading["word_count_met"] = abs(word_count - word_count_target) / word_count_target < 0.2
        
        return grading
    
    async def quick_check(
        self,
        question: str,
        answer: str,
        correct_answer: str
    ) -> Dict[str, Any]:
        """
        Quick correctness check for short answers.
        
        Args:
            question: The question
            answer: Student's answer
            correct_answer: Expected correct answer
            
        Returns:
            Simple correct/incorrect with explanation
        """
        prompt = ChatPromptTemplate.from_template(
            """Verifique se a resposta do aluno está correta.
            
Questão: {question}
Resposta do Aluno: {answer}
Resposta Correta: {correct_answer}

Seja flexível - aceite respostas semanticamente equivalentes mesmo que com palavras diferentes.

Output em JSON:
{{
    "is_correct": true/false,
    "similarity_score": 0.0-1.0,
    "explanation": "explicação breve",
    "student_understanding": "completo|parcial|incorreto"
}}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "question": question,
                "answer": answer,
                "correct_answer": correct_answer
            })
            return result
        except Exception as e:
            logger.error(f"Error in quick check: {e}")
            return {
                "is_correct": False,
                "explanation": "Erro na verificação",
                "error": str(e)
            }


# Singleton
auto_grader = AutoGrader()
