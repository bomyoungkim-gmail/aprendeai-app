"""TOOL_WORD_HUNT"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame
from utils.ab_manager import ab_manager

logger = logging.getLogger(__name__)

class ToolWordHuntGame(BaseGame):
    """Tool Word Hunt - Find and analyze word usage"""
    
    GAME_ID = "TOOL_WORD_HUNT"
    GAME_NAME = "Caça-Palavras Analítico"
    GAME_INTENT = "analysis"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (2, 4)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        # Mock content - would come from reading material
        text = """A ironia da situação não foi perdida para ninguém. Ironicamente, 
                 o mesmo processo que previne erros também cria complexidade."""
        
        target_word = "ironicamente"
        
        # Personalization
        learner = state.get('learner_profile', {})
        lang = learner.get('language', 'PT')
        
        intro = "🔍 **Caça-Palavras Analítico**" if lang == 'PT' else "🔍 **Analytical Word Hunt**"
        instruction = f"Encontre a palavra '{target_word}'" if lang == 'PT' else f"Find the word '{target_word}'"
        
        prompt = f"""{intro}

{instruction}

"{text}"

**Sua Tarefa** (Language: {lang}):
1. Copie a frase completa onde a palavra aparece
2. Explique o significado da palavra nesse contexto
3. Por que o autor usou essa palavra especificamente?"""
        
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'user_id': state.get('user_id'), # Pass user_id for A/B testing
            'data': {
                'text': text,
                'target_word': target_word,
                'expected_quote': "Ironicamente, o mesmo processo"
            }
        }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate with A/B testing (LLM vs Heuristic)"""
        target = round_data['data']['target_word']
        text = round_data['data']['text']
        user_id = round_data.get('user_id')
        
        # A/B Test Logic
        is_llm_group = ab_manager.should_use_llm("game_eval_tool_word_hunt", user_id)
        
        if is_llm_group:
            try:
                result = await self._llm_evaluate(target, text, answer)
                result['experiment_group'] = 'B_VARIANT_LLM'
                return result
            except Exception as e:
                logger.warning(f"LLM failed in A/B test: {e}")
                # Fallback considered part of Control for reliability, or separate bucket
                result = self._heuristic_evaluate(round_data, answer)
                result['experiment_group'] = 'B_VARIANT_LLM_FALLBACK'
                return result
        else:
            # Control Group (Heuristic)
            result = self._heuristic_evaluate(round_data, answer)
            result['experiment_group'] = 'A_VARIANT_HEURISTIC'
            return result
    
    async def _llm_evaluate(self, target_word: str, text: str, analysis: str) -> Dict[str, Any]:
        """LLM evaluates word analysis quality"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie esta análise de uso de palavra:

PALAVRA-ALVO: {target_word}
TEXTO: {text}
ANÁLISE DO ALUNO: {analysis}

Critérios (0-100):
1. Encontrou a citação correta? (30%)
2. Explicou o significado adequadamente? (40%)
3. Analisou o motivo do uso? (30%)

JSON:
- score (0-100)
- feedback
- found_quote (boolean)
- meaning_clear (boolean)
- analyzed_purpose (boolean)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "found_quote": {"type": "boolean"},
                    "meaning_clear": {"type": "boolean"},
                    "analyzed_purpose": {"type": "boolean"}
                },
                "required": ["score", "feedback"]
            },
            temperature=0.6
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 1.1),  # Scale to 110
            'max_score': 110,
            'feedback': f"🔍 {result.get('feedback', 'Análise avaliada!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'found_quote': result.get('found_quote', False),
                'meaning_clear': result.get('meaning_clear', False),
                'analyzed_purpose': result.get('analyzed_purpose', False)
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic"""
        target = round_data['data']['target_word']
        expected_quote = round_data['data']['expected_quote']
        
        has_quote = expected_quote.lower() in answer.lower()
        has_explanation = len(answer.split()) > 15
        mentions_target = target.lower() in answer.lower()
        
        score = 0
        if has_quote:
            score += 33
        if has_explanation:
            score += 44
        if mentions_target:
            score += 33
            
        return {
            'score': score,
            'max_score': 110,
            'feedback': f"🔍 " + ("✅ Citação encontrada! " if has_quote else "💡 Inclua a citação. ") +
                       ("Boa explicação!" if has_explanation else "Explique mais."),
            'correct': score >= 77,
            'breakdown': {
                'has_quote': has_quote,
                'has_explanation': has_explanation,
                'method': 'heuristic'
            }
        }
