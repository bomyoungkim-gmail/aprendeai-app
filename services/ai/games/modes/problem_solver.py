"""PROBLEM_SOLVER"""
from typing import List, Dict, Any
import logging
import time
from games.base import BaseGame

logger = logging.getLogger(__name__)

class ProblemSolverGame(BaseGame):
    """Problem Solver - Quiz with reasoning"""
    
    GAME_ID = "PROBLEM_SOLVER"
    GAME_NAME = "Solucionador de Problemas"
    GAME_INTENT = "application"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 4)
    DURATION_MIN = 3
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock question - would come from content
        question = "Se a fotossíntese parar, o que acontece com o oxigênio?  "
        options = ["A) Aumenta", "B) Diminui", "C) Sem mudança"]
        correct = "B"
        
        prompt = f"""🧩 **Solucionador de Problemas**

{question}

Opções:
{chr(10).join(options)}

**Escolha E explique brevemente seu raciocínio.**"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'question': question,
                'options': options,
                'correct_answer': correct,
                'start_time': time.time(),
                'time_limit': 60
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate answer correctness + reasoning with LLM"""
        correct = round_data['data']['correct_answer']
        question = round_data['data']['question']
        
        # Extract letter choice (A, B, or C)
        choice = None
        for letter in ['A', 'B', 'C', 'D']:
            if letter in answer.upper()[:5]:  # Check first 5 chars
                choice = letter
                break
        
        is_correct = choice == correct
        
        # If wrong, return immediately
        if not is_correct:
            return {
                'score': 0,
                'max_score': 100,
                'feedback': f"❌ Incorreto. A resposta correta era: **{correct}**",
                'correct': False,
                'breakdown': {'chosen': choice, 'correct': correct}
            }
        
        # Correct answer - evaluate reasoning with LLM
        try:
            return await self._llm_evaluate_reasoning(question, answer, correct)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(choice, correct, answer)
    
    async def _llm_evaluate_reasoning(self, question: str, answer: str, correct: str) -> Dict[str, Any]:
        """LLM evaluates quality of reasoning"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie a qualidade do raciocínio nesta resposta correta:

PERGUNTA: {question}
RESPOSTA CORRETA: {correct}
RESPOSTA DO ALUNO: {answer}

O aluno acertou a resposta. Avalie a qualidade da explicação (0-100):
1. Raciocínio claro e lógico (60%)
2. Evidências ou exemplos (40%)

JSON:
- score (0-100)
- feedback
- reasoning_quality ("fraca", "boa", "excelente")"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "reasoning_quality": {"type": "string", "enum": ["fraca", "boa", "excelente"]}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.6
        )
        
        score = result.get("score", 70)  # Default 70 for correct answer
        
        return {
            'score': int(score),
            'max_score': 100,
            'feedback': f"✅ Correto! {result.get('feedback', '')}",
            'correct': True,
            'breakdown': {
                'llm_score': score,
                'reasoning_quality': result.get('reasoning_quality', 'boa')
            }
        }
    
    def _heuristic_evaluate(self, choice: str, correct: str, answer: str) -> Dict[str, Any]:
        """Fallback: Give points for correct + explanation length"""
        has_explanation = len(answer.split()) > 5
        
        score = 70  # Base for correct
        if has_explanation:
            score += 30  # Bonus for explaining
            
        return {
            'score': score,
            'max_score': 100,
            'feedback': f"✅ Correto! " + ("Boa explicação!" if has_explanation else "💡 Adicione explicação para mais pontos."),
            'correct': True,
            'breakdown': {'has_explanation': has_explanation, 'method': 'heuristic'}
        }
