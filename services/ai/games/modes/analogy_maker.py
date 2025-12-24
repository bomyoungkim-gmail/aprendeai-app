"""ANALOGY_MAKER"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class AnalogyMakerGame(BaseGame):
    """Analogy Maker - Creative comparison"""
    
    GAME_ID = "ANALOGY_MAKER"
    GAME_NAME = "Criador de Analogias"
    GAME_INTENT = "creation"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 4
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        concept = state.get('concept', 'Neurônio')
        
        prompt = f"""🎨 **Criador de Analogias**

Crie uma analogia criativa para explicar: **{concept}**

Exemplo: "Um neurônio é como uma estação de trem, recebendo sinais de várias direções e decidindo para onde enviar a mensagem."

**Sua analogia**: (seja criativo!)"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'concept': concept
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate analogy quality using LLM"""
        concept = round_data['data']['concept']
        
        try:
            return await self._llm_evaluate(concept, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(answer)
    
    async def _llm_evaluate(self, concept: str, analogy: str) -> Dict[str, Any]:
        """LLM evaluation of analogy quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie a qualidade desta analogia:

CONCEITO: {concept}
ANALOGIA: {analogy}

Critérios (0-100):
1. Criatividade (30%)
2. Clareza da comparação (30%)
3. Ajuda a entender o conceito (25%)
4. Originalidade (15%)

Retorne JSON com:
- score (0-100)
- feedback (encorajador)
- creativity_level ("baixa", "média", "alta")
- improvements (sugestões)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "creativity_level": {"type": "string", "enum": ["baixa", "média", "alta"]},
                    "improvements": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.8
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.5),  # Scale to 150
            'max_score': 150,
            'feedback': f"🎨 {result.get('feedback', 'Analogia recebida!')}",
            'correct': score >= 60,
            'breakdown': {
                'llm_score': score,
                'creativity': result.get('creativity_level', 'média'),
                'improvements': result.get('improvements', [])
            }
        }
    
    def _heuristic_evaluate(self, answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        word_count = len(answer.split())
        is_sufficient = word_count >= 10
        has_comparison = any(w in answer.lower() for w in ["como", "igual", "semelhante", "parecido"])
        
        score = 0
        if is_sufficient:
            score += 75
        if has_comparison:
            score += 75
            
        return {
            'score': score,
            'max_score': 150,
            'feedback': f"🎨 Analogia {'criativa' if score >= 100 else 'registrada'}! " + 
                       (f"✅ Tem {word_count} palavras e comparação clara." if score >= 100 
                        else "💡 Tente expandir e usar 'como' ou 'parecido com'."),
            'correct': score >= 90,
            'breakdown': {'word_count': word_count, 'has_comparison': has_comparison, 'method': 'heuristic'}
        }
