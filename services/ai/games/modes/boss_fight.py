"""BOSS_FIGHT_VOCAB"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class BossFightGame(BaseGame):
    """Boss Fight - Multi-round vocabulary battle"""
    
    GAME_ID = "BOSS_FIGHT_VOCAB"
    GAME_NAME = "Boss Fight de Vocabulário"
    GAME_INTENT = "recall"
    REQUIRES_CONTENT = False
    DIFFICULTY_RANGE = (2, 5)
    DURATION_MIN = 8
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock vocabulary - would come from content
        word = "Eloquent"
        definition = "Fluent and persuasive in speaking or writing"
        
        round_num = state.get('round', 1)
        total_rounds = 3
        boss_hp = state.get('boss_hp', 100)
        player_lives = state.get('lives', 3)
        
        prompt = f"""⚔️ **Boss Fight - Round {round_num}/{total_rounds}**

👹 Boss HP: {boss_hp}/100  |  ❤️ Suas Vidas: {player_lives}/3

**Palavra**: {word}
**Definição**: {definition}

**Seu Ataque**: Use "{word}" em uma frase que demonstre seu significado!"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'word': word,
                'definition': definition,
                'round': round_num,
                'total_rounds': total_rounds,
                'boss_hp': boss_hp,
                'player_lives': player_lives
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate vocabulary usage with LLM"""
        word = round_data['data']['word']
        definition = round_data['data']['definition']
        
        try:
            return await self._llm_evaluate(word, definition, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(word, answer)
    
    async def _llm_evaluate(self, word: str, definition: str, sentence: str) -> Dict[str, Any]:
        """LLM evaluates vocabulary usage"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie o uso desta palavra de vocabulário:

PALAVRA: {word}
DEFINIÇÃO: {definition}
FRASE DO ALUNO: {sentence}

Critérios (0-100):
1. Usou a palavra corretamente? (50%)
2. Demonstra compreensão do significado? (30%)
3. Contexto apropriado? (20%)

JSON:
- score (0-100)
- feedback
- correct_usage (boolean)
- demonstrates_meaning (boolean)
- damage_to_boss (0-50) - quanto de dano causou baseado na qualidade"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "correct_usage": {"type": "boolean"},
                    "demonstrates_meaning": {"type": "boolean"},
                    "damage_to_boss": {"type": "integer", "minimum": 0, "maximum": 50}
                },
                "required": ["score", "feedback", "damage_to_boss"]
            },
            temperature=0.7
        )
        
        score = result.get("score", 0)
        damage = result.get("damage_to_boss", 0)
        
        return {
            'score': int(score * 1.5),  # Scale to 150
            'max_score': 150,
            'feedback': f"⚔️ Dano causado: {damage} HP! {result.get('feedback', '')}",
            'correct': score >= 60,
            'breakdown': {
                'llm_score': score,
                'damage': damage,
                'correct_usage': result.get('correct_usage', False),
                'demonstrates_meaning': result.get('demonstrates_meaning', False)
            }
        }
    
    def _heuristic_evaluate(self, word: str, answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        word_in_answer = word.lower() in answer.lower()
        is_sentence = len(answer.split()) >= 5
        
        score = 0
        damage = 0
        
        if word_in_answer:
            score += 75
            damage += 25
        if is_sentence:
            score += 75
            damage += 25
            
        return {
            'score': score,
            'max_score': 150,
            'feedback': f"⚔️ Dano causado: {damage} HP! " + ("✅ Bom uso!" if score >= 105 else "💡 Use a palavra em contexto."),
            'correct': score >= 90,
            'breakdown': {
                'damage': damage,
                'word_used': word_in_answer,
                'is_sentence': is_sentence,
                'method': 'heuristic'
            }
        }
