"""SOCRATIC_DEFENSE"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class SocraticDefenseGame(BaseGame):
    """Socratic Defense - Deep questioning"""
    
    GAME_ID = "SOCRATIC_DEFENSE"
    GAME_NAME = "Defesa Socrática"
    GAME_INTENT = "analysis"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (2, 5)
    DURATION_MIN = 6
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        claim = state.get('claim', 'A inteligência artificial vai substituir todos os empregos.')
        probing_q = "Por que você acredita nisso? Que evidências você tem?"
        
        prompt = f"""🤔 **Defesa Socrática**

**Afirmação**: "{claim}"

**Questão Socrática**: {probing_q}

Responda com profundidade, incluindo evidências e considerando múltiplas perspectivas."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'claim': claim,
                'probing_question': probing_q,
                'level': difficulty
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate thinking depth using LLM with fallback"""
        claim = round_data['data']['claim']
        question = round_data['data']['probing_question']
        
        # Try LLM evaluation first
        try:
            return await self._llm_evaluate(claim, question, answer)
        except Exception as e:
            logger.warning(f"LLM evaluation failed, using fallback: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, claim: str, question: str, answer: str) -> Dict[str, Any]:
        """Use LLM to evaluate depth of thinking"""
        if not self.llm_service:
            raise ValueError("LLM service not available")
        
        prompt = f"""Você é um professor socrático. Avalie a profundidade de pensamento desta resposta:

AFIRMAÇÃO:
{claim}

PERGUNTA FEITA:
{question}

RESPOSTA DO ALUNO:
{answer}

Avalie em 0-100 baseado em:
1. Profundidade de raciocínio (40%)
2. Evidências apresentadas (30%)
3. Consideração de múltiplas perspectivas (20%)
4. Autocrítica e nuance (10%)

Retorne JSON com:
- score (0-100)
- feedback (mensagem encorajadora)
- depth_level ("superficial", "moderado", "profundo")
- improvements (sugestões)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "depth_level": {"type": "string", "enum": ["superficial", "moderado", "profundo"]},
                    "improvements": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["score", "feedback", "depth_level"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        feedback = result.get("feedback", "Pensamento recebido.")
        depth = result.get("depth_level", "moderado")
        
        return {
            'score': int(score * 1.8),  # Scale to 180 max
            'max_score': 180,
            'feedback': f"🤔 {feedback}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'depth_level': depth,
                'improvements': result.get("improvements", [])
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic evaluation"""
        level = round_data['data']['level']
        word_count = len(answer.split())
        has_nuance = any(w in answer.lower() for w in ["depende", "porém", "embora", "contexto", "às vezes"])
        
        score = 0
        if word_count >= 30:
            score += 90
        elif word_count >= 15:
            score += 60
        else:
            score += 30
            
        if has_nuance:
            score += 90
        
        return {
            'score': score,
            'max_score': 180,
            'feedback': f"🤔 Resposta com {word_count} palavras. " + ("✅ Mostra nuance!" if has_nuance else "💡 Adicione mais nuance e múltiplas perspectivas."),
            'correct': score >= 120,
            'breakdown': {'word_count': word_count, 'has_nuance': has_nuance, 'method': 'heuristic'}
        }
