"""SRS_ARENA"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class SrsArenaGame(BaseGame):
    """SRS Arena - Spaced Repetition System flashcards"""
    
    GAME_ID = "SRS_ARENA"
    GAME_NAME = "Arena SRS"
    GAME_INTENT = "recall"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock flashcards - would come from content
        cards = [
            {"front": "O que é mitocôndria?", "back": "Organela produtora de energia (ATP)"},
            {"front": "Qual a função do DNA?", "back": "Armazenar informação genética"},
        ]
        
        card_index = state.get('card_index', 0)
        card = cards[card_index % len(cards)]
        
        prompt = f"""🎴 **Arena SRS - Card {card_index + 1}**

**Pergunta**: {card['front']}

Digite sua resposta de memória:"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'question': card['front'],
                'correct_answer': card['back'],
                'card_index': card_index,
                'total_cards': len(cards)
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate recall accuracy with LLM"""
        question = round_data['data']['question']
        correct = round_data['data']['correct_answer']
        
        try:
            return await self._llm_evaluate(question, correct, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(correct, answer)
    
    async def _llm_evaluate(self, question: str, correct_answer: str, user_answer: str) -> Dict[str, Any]:
        """LLM evaluates recall accuracy"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie a precisão desta resposta de flashcard:

PERGUNTA: {question}
RESPOSTA CORRETA: {correct_answer}
RESPOSTA DO ALUNO: {user_answer}

Critérios (0-100):
1. Factualmente correta? (60%)
2. Completude da resposta? (30%)
3. Clareza? (10%)

JSON:
- score (0-100)
- feedback
- factually_correct (boolean)
- completeness ("parcial", "completa")
- confidence ("baixa", "média", "alta") - quão confiante o aluno parece"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "factually_correct": {"type": "boolean"},
                    "completeness": {"type": "string", "enum": ["parcial", "completa"]},
                    "confidence": {"type": "string", "enum": ["baixa", "média", "alta"]}
                },
                "required": ["score", "feedback", "factually_correct"]
            },
            temperature=0.5  # Lower for factual evaluation
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score),
            'max_score': 100,
            'feedback': f"🎴 {result.get('feedback', 'Resposta avaliada!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'factually_correct': result.get('factually_correct', False),
                'completeness': result.get('completeness', 'parcial'),
                'confidence': result.get('confidence', 'média')
            }
        }
    
    def _heuristic_evaluate(self, correct: str, answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        # Simple keyword matching
        correct_keywords = correct.lower().split()[:5]  # First 5 words
        answer_lower = answer.lower()
        
        matches = sum(1 for kw in correct_keywords if kw in answer_lower and len(kw) > 3)
        score = int((matches / len(correct_keywords)) * 100) if correct_keywords else 0
        
        return {
            'score': score,
            'max_score': 100,
            'feedback': f"🎴 Correspondência: {matches}/{len(correct_keywords)} palavras-chave. " +
                       ("✅ Boa memória!" if score >= 70 else "💡 Revise este card."),
            'correct': score >= 70,
            'breakdown': {
                'keyword_matches': matches,
                'total_keywords': len(correct_keywords),
                'method': 'heuristic'
            }
        }
