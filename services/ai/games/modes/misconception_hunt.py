"""MISCONCEPTION_HUNT"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class MisconceptionHuntGame(BaseGame):
    """Misconception Hunt - Identify errors"""
    
    GAME_ID = "MISCONCEPTION_HUNT"
    GAME_NAME = "Caçador de Erros"
    GAME_INTENT = "analysis"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (2, 4)
    DURATION_MIN = 6
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock statements
        statements = [
            {"text": "Antibióticos curam resfriados.", "is_misconception": True, "why": "Resfriados são virais"},
            {"text": "A gravidade puxa objetos para baixo.", "is_misconception": False, "why": "Correto"},
            {"text": "Usamos apenas 10% do nosso cérebro.", "is_misconception": True, "why": "Mito popular  "},
        ]
        
        misconception = [s for s in statements if s['is_misconception']][0]
        
        prompt = f"""🔍 **Caçador de Erros**

Qual destas afirmações contém um ERRO ou EQUÍVOCO?

1. {statements[0]['text']}
2. {statements[1]['text']}
3. {statements[2]['text']}

**Identifique o erro E explique por que está errado.**"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'statements': statements,
                'correct_misconception': misconception
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate error identification + explanation with LLM"""
        correct_misc = round_data['data']['correct_misconception']
        
        try:
            return await self._llm_evaluate(correct_misc, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(correct_misc, answer)
    
    async def _llm_evaluate(self, misconception: Dict, answer: str) -> Dict[str, Any]:
        """LLM evaluates identification + explanation"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie esta identificação de erro conceitual:

AFIRMAÇÃO INCORRETA: {misconception['text']}
MOTIVO: {misconception['why']}
RESPOSTA DO ALUNO: {answer}

Critérios (0-100):
1. Identificou corretamente o erro? (50%)
2. Explicou o motivo? (30%)
3. Qualidade da explicação? (20%)

JSON:
- score (0-100)
- feedback
- identified_correctly (boolean)
- explanation_quality ("fraca", "boa", "excelente")"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "identified_correctly": {"type": "boolean"},
                    "explanation_quality": {"type": "string", "enum": ["fraca", "boa", "excelente"]}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.6
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.3),  # Scale to 130
            'max_score': 130,
            'feedback': f"🔍 {result.get('feedback', 'Avaliado!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'identified': result.get('identified_correctly', False),
                'explanation_quality': result.get('explanation_quality', 'boa')
            }
        }
    
    def _heuristic_evaluate(self, misconception: Dict, answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        # Check if answer mentions the misconception
        misc_text = misconception['text'].lower()
        answer_lower = answer.lower()
        
        # Simple keyword matching
        identified = any(word in answer_lower for word in misc_text.split()[:3])
        has_explanation = len(answer.split()) > 10
        
        score = 0
        if identified:
            score += 65
        if has_explanation:
            score += 65
            
        return {
            'score': score,
            'max_score': 130,
            'feedback': f"🔍 " + ("✅ Erro identificado!" if identified else "❌ Erro não identificado.") + 
                       (" Boa explicação!" if has_explanation else " 💡 Explique melhor."),
            'correct': score >= 91,
            'breakdown': {'identified': identified, 'explained': has_explanation, 'method': 'heuristic'}
        }
