from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class FeynmanTeacherGame(BaseGame):
    """FEYNMAN_TEACHER (Teach-Back)"""
    
    GAME_ID = "FEYNMAN_TEACHER"
    GAME_NAME = "Professor Feynman"
    GAME_INTENT = "creation"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        concept = state.get('concept', 'Photosynthesis')
        
        prompt = f"""👨‍🏫 **Professor Feynman**

Eu sou um estudante confuso. Acabei de ouvir sobre **{concept}**, mas não entendi nada.

**Você pode me explicar como funciona?** Use palavras simples como se estivesse ensinando para um amigo."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'concept': concept,
                'key_facts': ["Sunlight", "Carbon Dioxide", "Sugar"]
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate explanation using LLM with fallback"""
        concept = round_data['data']['concept']
        
        # Try LLM evaluation first
        try:
            return await self._llm_evaluate(concept, answer)
        except Exception as e:
            logger.warning(f"LLM evaluation failed, using fallback: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, concept: str, explanation: str) -> Dict[str, Any]:
        """Use LLM to evaluate explanation quality"""
        if not self.llm_service:
            raise ValueError("LLM service not available")
        
        prompt = f"""Você é um avaliador de explicações pedagógicas. Avalie a seguinte explicação de "{concept}":

EXPLICAÇÃO DO ALUNO:
{explanation}

Avalie em uma escala de 0-100 baseado em:
1. Simplicidade (evita jargão técnico?)
2. Clareza (fácil de entender?)
3. Completude (cobre os pontos principais?)
4. Analogias (usa exemplos do dia-a-dia?)

Retorne JSON com:
- score (0-100)
- feedback (mensagem encorajadora)
- strengths (lista de pontos fortes)
- improvements (lista de sugestões)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "strengths": {"type": "array", "items": {"type": "string"}},
                    "improvements": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        feedback = result.get("feedback", "Boa tentativa!")
        
        return {
            'score': int(score * 2),  # Scale to 200 max
            'max_score': 200,
            'feedback': f"💡 {feedback}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'strengths': result.get("strengths", []),
                'improvements': result.get("improvements", [])
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic evaluation"""
        facts = round_data['data']['key_facts']
        found_facts = [f for f in facts if f.lower() in answer.lower()]
        coverage = len(found_facts) / len(facts)
        
        if coverage >= 0.6:
            return {
                'score': 200,
                'max_score': 200,
                'feedback': f"💡 Ah, agora entendi! Você mencionou {', '.join(found_facts)} e tudo fez sentido. Obrigado, professor!",
                'correct': True,
                'breakdown': {'facts_covered': found_facts, 'coverage': coverage, 'method': 'heuristic'}
            }
        else:
            missing = [f for f in facts if f not in found_facts]
            return {
                'score': 50,
                'max_score': 200,
                'feedback': f"🤔 Ainda estou confuso sobre: **{missing[0]}**. Pode explicar essa parte?",
                'correct': False,
                'breakdown': {'facts_covered': found_facts, 'missing': missing, 'method': 'heuristic'}
            }
