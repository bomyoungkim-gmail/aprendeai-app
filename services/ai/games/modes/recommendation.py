"""RECOMMENDATION_ENGINE"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class RecommendationGame(BaseGame):
    """Recommendation Engine - Content curation"""
    
    GAME_ID = "RECOMMENDATION_ENGINE"
    GAME_NAME = "Motor de Recomendações"
    GAME_INTENT = "synthesis"
    REQUIRES_CONTENT = False
    DIFFICULTY_RANGE = (2, 4)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock user profile
        profile = "Estudante de biologia, nível médio, gosta de ecologia"
        
        games = [
            "Resumo de Texto",
            "Quiz de Matemática",
            "Simulador de Ecossistemas",
            "História Mundial",
        ]
        
        prompt = f"""💡 **Motor de Recomendações**

**Perfil do Usuário**: {profile}

**Jogos Disponíveis**:
{chr(10).join([f'{i+1}. {g}' for i, g in enumerate(games)])}

**Sua Tarefa**: Recomende os 2 MELHORES jogos para este perfil E explique por quê."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'profile': profile,
                'games': games,
                'recommended_game': 'Simulador de Ecossistemas'
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate recommendation quality with LLM"""
        profile = round_data['data']['profile']
        games = round_data['data']['games']
        
        try:
            return await self._llm_evaluate(profile, games, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, profile: str, games: List[str], recommendation: str) -> Dict[str, Any]:
        """LLM evaluates recommendation quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie a qualidade desta recomendação de jogos:

PERFIL: {profile}
JOGOS DISPONÍVEIS: {', '.join(games)}
RECOMENDAÇÃO: {recommendation}

Critérios (0-100):
1. Relevância para o perfil (50%)
2. Justificativa clara (30%)
3. Considera múltiplos fatores (20%)

JSON:
- score (0-100)
- feedback
- relevance ("baixa", "média", "alta")
- well_justified (boolean)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "relevance": {"type": "string", "enum": ["baixa", "média", "alta"]},
                    "well_justified": {"type": "boolean"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score),
            'max_score': 100,
            'feedback': f"💡 {result.get('feedback', 'Recomendação avaliada!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'relevance': result.get('relevance', 'média'),
                'justified': result.get('well_justified', False)
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        recommended = round_data['data']['recommended_game']
        
        choice = answer.strip().lower()
        matches_best = recommended.lower() in choice
        has_justification = len(answer.split()) > 10
        
        score = 0
        if matches_best:
            score += 50
        if has_justification:
            score += 50
            
        return {
            'score': score,
            'max_score': 100,
            'feedback': f"💡 " + ("✅ Boa escolha!" if matches_best else "💡 Considere o perfil do usuário.") + 
                       (" Justificativa clara!" if has_justification else ""),
            'correct': score >= 70,
            'breakdown': {'matches_best': matches_best, 'justified': has_justification, 'method': 'heuristic'}
        }
