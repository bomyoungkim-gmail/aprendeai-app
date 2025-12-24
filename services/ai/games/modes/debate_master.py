"""DEBATE_MASTER"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class DebateMasterGame(BaseGame):
    """Debate Master - Argumentative Defense"""
    
    GAME_ID = "DEBATE_MASTER"
    GAME_NAME = "Mestre do Debate"
    GAME_INTENT = "analysis"
    REQUIRES_CONTENT = False
    DIFFICULTY_RANGE = (2, 5)
    DURATION_MIN = 7
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        thesis = state.get("user_thesis", "Energia renovável deve substituir fósseis até 2030.")
        counterargument = "Mas os custos de infraestrutura são astronômicos e quebrariam economias."
        
        prompt = f"""🎭 **Mestre do Debate**

**Sua Posição**: "{thesis}"

**Contra-argumento da IA**: {counterargument}

**Seu Turno**: Defenda sua posição com pelo menos 2 argumentos lógicos ou evidências."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'thesis': thesis,
                'counterargument': counterargument
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate argument using LLM with fallback"""
        thesis = round_data['data']['thesis']
        counterargument = round_data['data']['counterargument']
        
        # Try LLM evaluation first
        try:
            return await self._llm_evaluate(thesis, counterargument, answer)
        except Exception as e:
            logger.warning(f"LLM evaluation failed, using fallback: {e}")
            return self._heuristic_evaluate(answer)
    
    async def _llm_evaluate(self, thesis: str, counterargument: str, argument: str) -> Dict[str, Any]:
        """Use LLM to evaluate debate argument"""
        if not self.llm_service:
            raise ValueError("LLM service not available")
        
        prompt = f"""Você é um juiz de debates. Avalie a qualidade deste argumento:

TESE DO DEBATEDOR:
{thesis}

CONTRA-ARGUMENTO APRESENTADO:
{counterargument}

DEFESA DO DEBATEDOR:
{argument}

Avalie em 0-100 baseado em:
1. Refutação eficaz do contra-argumento (40%)
2. Evidências ou lógica (30%)
3. Coerência e clareza (20%)
4. Persuasão (10%)

Retorne JSON com:
- score (0-100)
- feedback (mensagem construtiva)
- strengths (pontos fortes)
- improvements (sugestões)"""

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
        feedback = result.get("feedback", "Argumento recebido.")
        
        return {
            'score': int(score * 1.5),  # Scale to 150 max
            'max_score': 150,
            'feedback': f"🎭 {feedback}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'strengths': result.get("strengths", []),
                'improvements': result.get("improvements", [])
            }
        }
    
    def _heuristic_evaluate(self, answer: str) -> Dict[str, Any]:
        """Fallback heuristic evaluation"""
        has_substance = len(answer.split()) > 20
        addresses_counter = any(kw in answer.lower() for kw in ["porém", "no entanto", "mas", "evidência"])
        
        score = 0
        feedback_parts = []
        
        if has_substance:
            score += 75
            feedback_parts.append("✅ Argumento substancial")
        else:
            feedback_parts.append("⚠️ Muito breve - adicione mais evidências")
            
        if addresses_counter:
            score += 75
            feedback_parts.append("✅ Refutou o contra-argumento")
        else:
            feedback_parts.append("💡 Tente refutar o ponto da IA diretamente")
        
        is_correct = score >= 100
        
        return {
            'score': score,
            'max_score': 150,
            'feedback': ("🏆 **Defesa Forte!**\n" if is_correct else "🤔 **Precisa Fortalecer**\n") + "\n".join(feedback_parts),
            'correct': is_correct,
            'breakdown': {'substance': has_substance, 'refutation': addresses_counter, 'method': 'heuristic'}
        }
