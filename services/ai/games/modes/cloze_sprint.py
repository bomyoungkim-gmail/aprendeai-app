"""CLOZE_SPRINT"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class CloseSprintGame(BaseGame):
    """Cloze Sprint - Fill-in-blank speed challenge"""
    
    GAME_ID = "CLOZE_SPRINT"
    GAME_NAME = "Sprint de Lacunas"
    GAME_INTENT = "recall"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 3
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock cloze text - would come from content
        sentence = "A ___ é o processo pelo qual plantas produzem ___ usando luz solar."
        blanks = [
            {"id": 0, "correct": "fotossíntese", "alternatives": ["fotossintese", "fotossintesis"]},
            {"id": 1, "correct": "alimento", "alternatives": ["glicose", "energia"]},
        ]
        
        prompt = f"""⚡ **Sprint de Lacunas - Complete Rápido!**

{sentence}

**Complete as lacunas** (você tem 30 segundos):
1. ___ = ?
2. ___ = ?"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'sentence': sentence,
                'blanks': blanks,
                'time_limit': 30
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate cloze answers with LLM for flexibility"""
        blanks = round_data['data']['blanks']
        sentence = round_data['data']['sentence']
        
        try:
            return await self._llm_evaluate(sentence, blanks, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(blanks, answer)
    
    async def _llm_evaluate(self, sentence: str, blanks: List[Dict], user_answer: str) -> Dict[str, Any]:
        """LLM evaluates cloze answers with semantic understanding"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        correct_answers = [b['correct'] for b in blanks]
        
        prompt = f"""Avalie as respostas para estas lacunas:

FRASE: {sentence}
RESPOSTAS ESPERADAS: {', '.join(correct_answers)}
RESPOSTA DO ALUNO: {user_answer}

Critérios (0-100):
1. Semanticamente corretas? (70%)
2. Fazem sentido no contexto? (30%)

Seja flexível com sinônimos e variações válidas.

JSON:
- score (0-100)
- feedback
- blank_scores (array de scores por lacuna, 0-100 cada)
- semantic_match (boolean)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "blank_scores": {"type": "array", "items": {"type": "number"}},
                    "semantic_match": {"type": "boolean"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.5
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.2),  # Scale to 120
            'max_score': 120,
            'feedback': f"⚡ {result.get('feedback', 'Lacunas avaliadas!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'blank_scores': result.get('blank_scores', []),
                'semantic_match': result.get('semantic_match', False)
            }
        }
    
    def _heuristic_evaluate(self, blanks: List[Dict], answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        answer_lower = answer.lower()
        
        correct_count = 0
        for blank in blanks:
            # Check if correct answer or any alternative is present
            if blank['correct'].lower() in answer_lower:
                correct_count += 1
            elif any(alt.lower() in answer_lower for alt in blank.get('alternatives', [])):
                correct_count += 0.8  # Partial credit for alternatives
                
        score = int((correct_count / len(blanks)) * 120)
        
        return {
            'score': score,
            'max_score': 120,
            'feedback': f"⚡ Você acertou {int(correct_count)}/{len(blanks)} lacunas! " +
                       ("✅ Rápido e preciso!" if score >= 84 else "💡 Continue praticando!"),
            'correct': score >= 84,
            'breakdown': {
                'correct_count': correct_count,
                'total_blanks': len(blanks),
                'method': 'heuristic'
            }
        }
