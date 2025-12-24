from typing import List, Dict, Any
import logging
import random
from games.base import BaseGame

logger = logging.getLogger(__name__)

class ConceptLinkingGame(BaseGame):
    """
    CONCEPT_LINKING (Taboo Style)
    
    Pedagogical Goal: Flexibilidade Semântica.
    Mechanic: Describe a target word/concept WITHOUT using specific forbidden words.
    """
    
    GAME_ID = "CONCEPT_LINKING"
    GAME_NAME = "Taboo de Conceitos"
    GAME_INTENT = "understanding"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 3
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """Generates a Taboo-style card"""
        difficulty = self.validate_difficulty(difficulty)
        
        target_words = state.get('target_words', [])
        if not target_words:
            target_words = [{"text": "Democracy", "context": "Political System"}]
            
        target = target_words[0] if isinstance(target_words[0], dict) else {"text": target_words[0]}
        word = target.get("text", target_words[0])
        
        # Generate forbidden words (mock for now)
        forbidden = self._mock_llm_generation(word)["forbidden"]
        
        prompt = f"""📝 **Taboo de Conceitos**

Descreva a palavra **{word}** SEM usar estas palavras proibidas:
{', '.join([f'**{w.upper()}**' for w in forbidden])}

Sua descrição deve fazer alguém entender o que é **{word}** sem mencionar as palavras proibidas."""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'target_word': word,
                'forbidden_words': [w.lower() for w in forbidden],
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Check if description avoids forbidden words + evaluate quality"""
        target = round_data['data']['target_word']
        forbidden = round_data['data']['forbidden_words']
        
        # Rule Check: Did they use forbidden words?
        normalized_input = answer.lower()
        violations = [w for w in forbidden if w in normalized_input]
        
        if violations:
            return {
                'score': 0,
                'max_score': 100,
                'feedback': f"❌ Você usou uma palavra proibida: **{violations[0].upper()}**. Tente novamente sem usar {', '.join(forbidden)}!",
                'correct': False,
                'breakdown': {'violations': violations, 'method': 'rule_check'}
            }
        
        # No violations - evaluate quality with LLM
        try:
            return await self._llm_evaluate(target, answer, forbidden)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(target, answer)
    
    async def _llm_evaluate(self, target: str, description: str, forbidden: List[str]) -> Dict[str, Any]:
        """LLM evaluates description quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie esta descrição de Taboo:

PALAVRA-ALVO: {target}
PALAVRAS PROIBIDAS: {', '.join(forbidden)}
DESCRIÇÃO: {description}

Critérios (0-100):
1. A descrição permite identificar a palavra-alvo? (50%)
2. Clareza e precisão (30%)
3. Criatividade na evasão das proibidas (20%)

JSON com:
- score (0-100)
- feedback
- identifiable (true/false)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "identifiable": {"type": "boolean"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score),
            'max_score': 100,
            'feedback': f"✅ {result.get('feedback', 'Descrição válida!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'identifiable': result.get('identifiable', False)
            }
        }
    
    def _heuristic_evaluate(self, target: str, answer: str) -> Dict[str, Any]:
        """Fallback: Check if answer is substantial"""
        is_good = len(answer.split()) >= 5
        
        if is_good:
            return {
                'score': 100,
                'max_score': 100,
                'feedback': f"✅ Excelente! Você descreveu '{target}' perfeitamente sem usar as palavras proibidas.",
                'correct': True,
                'breakdown': {'word_count': len(answer.split()), 'method': 'heuristic'}
            }
        else:
            return {
                'score': 50,
                'max_score': 100,
                'feedback': "⚠️ Muito breve. Tente ser mais descritivo (pelo menos 5 palavras).",
                'correct': False,
                'breakdown': {'word_count': len(answer.split()), 'method': 'heuristic'}
            }
    
    def _mock_llm_generation(self, word: str) -> Dict:
        """Generate forbidden words"""
        defaults = {
            "Democracy": ["vote", "election", "government", "people"],
            "Internet": ["web", "network", "computer", "online"],
        }
        return {"forbidden": defaults.get(word, ["related", "thing", "stuff", "item"])}
