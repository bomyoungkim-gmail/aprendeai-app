"""WHAT_IF_SCENARIO"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class WhatIfScenarioGame(BaseGame):
    """What-If Scenario - Predict consequences"""
    
    GAME_ID = "WHAT_IF_SCENARIO"
    GAME_NAME = "Cenário E Se?"
    GAME_INTENT = "application"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (2, 4)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        concept = state.get('concept', 'gravity')
        scenario = f"E se a {concept} da Terra diminuísse pela metade?"
        
        prompt = f"""🔮 **Cenário E Se?**

{scenario}

Liste pelo menos 3 consequências científicas deste cenário hipotético."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'scenario': scenario,
                'key_consequences': ['atmosphere', 'orbit', 'weight']
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate prediction quality with LLM"""
        scenario = round_data['data']['scenario']
        
        try:
            return await self._llm_evaluate(scenario, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, scenario: str, predictions: str) -> Dict[str, Any]:
        """LLM evaluates prediction quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie as previsões para este cenário hipotético:

CENÁRIO: {scenario}
PREVISÕES: {predictions}

Critérios (0-100):
1. Cientificamente plausíveis? (40%)
2. Abrangência (múl tiplas consequências)? (30%)
3. Profundidade de análise? (30%)

JSON:
- score (0-100)
- feedback
- plausibility ("baixa", "média", "alta")
- count_consequences (número)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "plausibility": {"type": "string", "enum": ["baixa", "média", "alta"]},
                    "count_consequences": {"type": "integer"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.2),  # Scale to 120
            'max_score': 120,
            'feedback': f"🔮 {result.get('feedback', 'Previsões analisadas!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'plausibility': result.get('plausibility', 'média'),
                'consequences_found': result.get('count_consequences', 0)
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        consequences = round_data['data']['key_consequences']
        found = [c for c in consequences if any(word in answer.lower() for word in c.split())]
        coverage = len(found) / len(consequences)
        
        score = int(coverage * 120)
        
        return {
            'score': score,
            'max_score': 120,
            'feedback': f"🔮 Você identificou {len(found)}/{len(consequences)} consequências-chave!",
            'correct': coverage >= 0.6,
            'breakdown': {'coverage': coverage, 'found': found, 'method': 'heuristic'}
        }
