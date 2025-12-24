"""SITUATION_SIM"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class SituationSimGame(BaseGame):
    """Situation Simulator - Multi-step problem solving"""
    
    GAME_ID = "SITUATION_SIM"
    GAME_NAME = "Simulador de Situações"
    GAME_INTENT = "application"
    REQUIRES_CONTENT = False
    DIFFICULTY_RANGE = (2, 4)
    DURATION_MIN = 7
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        situation = "Você encontrou um erro crítico em produção. Clientes afetados. O que você faz?"
        stage = state.get('stage', 1)
        total_stages = 3
        
        prompt = f"""🎮 **Simulador de Situações - Etapa {stage}/{total_stages}**

{situation}

**Escolha sua ação** (descreva em 2-3 linhas):"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'situation': situation,
                'stage': stage,
                'total_stages': total_stages,
                'correct_pattern': 'investigate'  # Expected approach
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate decision quality with LLM"""
        situation = round_data['data']['situation']
        stage = round_data['data']['stage']
        
        try:
            return await self._llm_evaluate(situation, stage, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, situation: str, stage: int, decision: str) -> Dict[str, Any]:
        """LLM evaluates decision quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie esta decisão em uma simulação de situação:

SITUAÇÃO: {situation}
ETAPA: {stage}/3
DECISÃO DO JOGADOR: {decision}

Critérios (0-100):
1. Adequação à situação (40%)
2. Considera consequências (30%)
3. Praticidade (20%)
4. Criatividade (10%)

JSON:
- score (0-100)
- feedback (construtivo)
- decision_quality ("fraca", "adequada", "excelente")
- risks_considered (boolean)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "decision_quality": {"type": "string", "enum": ["fraca", "adequada", "excelente"]},
                    "risks_considered": {"type": "boolean"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.5),  # Scale to 150
            'max_score': 150,
            'feedback': f"🎮 {result.get('feedback', 'Decisão avaliada!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'quality': result.get('decision_quality', 'adequada'),
                'risks_considered': result.get('risks_considered', False)
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        pattern = round_data['data']['correct_pattern']
        stage = round_data['data']['stage']
        total = round_data['data']['total_stages']
        
        matches_pattern = pattern.lower() in answer.lower()
        has_detail = len(answer.split()) >= 15
        
        score = 0
        if matches_pattern:
            score += 75
        if has_detail:
            score += 75
            
        return {
            'score': score,
            'max_score': 150,
            'feedback': f"🎮 Etapa {stage}/{total}: " + ("✅ Boa decisão!" if score >= 100 else "💡 Considere mais detalhes."),
            'correct': score >= 105,
            'breakdown': {'matches_pattern': matches_pattern, 'detailed': has_detail, 'method': 'heuristic'}
        }
