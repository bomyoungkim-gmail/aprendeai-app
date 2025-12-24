"""FREE_RECALL_SCORE"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

class FreeRecallGame(BaseGame):
    """
    FREE_RECALL_SCORE - Active Recall without prompts
    
    Pedagogical Goal: Strengthen retrieval pathways.
    Mechanic: Write what you remember without re-reading.
    """
    
    GAME_ID = "FREE_RECALL_SCORE"
    GAME_NAME = "Resumo Livre"
    GAME_INTENT = "recall"
    REQUIRES_CONTENT = True
    DIFFICULTY_RANGE = (1, 3)
    DURATION_MIN = 5
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        difficulty = self.validate_difficulty(difficulty)
        
        content_slice = state.get('content_slice', 'Texto sobre fotossíntese...')
        
        # Show title/topic but not full text
        topic = state.get('topic', 'Fotossíntese')
        
        prompt = f"""📝 **Resumo Livre - Sem Consultar!**

Você acabou de ler sobre: **{topic}**

**Sua Tarefa**: Escreva 3-5 linhas resumindo o que você lembra, **SEM OLHAR O TEXTO**.

Dica: Foque nos pontos principais e conceitos-chave."""
        
        # Store reference content for LLM comparison
        return {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'data': {
                'topic': topic,
                'reference_content': content_slice,  # For LLM comparison
                'key_points': state.get('key_points', ['luz', 'CO2', 'glicose', 'oxigênio'])
            }
        }
    
    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate recall quality with LLM"""
        reference = round_data['data']['reference_content']
        topic = round_data['data']['topic']
        
        try:
            return await self._llm_evaluate(topic, reference, answer)
        except Exception as e:
            logger.warning(f"LLM failed: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, topic: str, reference: str, recall: str) -> Dict[str, Any]:
        """LLM evaluates recall accuracy and completeness"""
        if not self.llm_service:
            raise ValueError("LLM not available")
        
        prompt = f"""Avalie a qualidade deste resumo de memória:

TÓPICO: {topic}
TEXTO ORIGINAL: {reference[:500]}...
RESUMO DO ALUNO (sem consultar): {recall}

Critérios (0-100):
1. Acurácia factual (40%)
2. Cobertura dos pontos principais (35%)
3. Coerência e organização (25%)

JSON:
- score (0-100)
- feedback (construtivo)
- accuracy ("baixa", "média", "alta")
- main_points_covered (número estimado)
- factual_errors (lista de erros, se houver)"""

        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"},
                    "accuracy": {"type": "string", "enum": ["baixa", "média", "alta"]},
                    "main_points_covered": {"type": "integer"},
                    "factual_errors": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["score", "feedback", "accuracy"]
            },
            temperature=0.6  # Lower temp for factual evaluation
        )
        
        score = result.get("score", 0)
        
        return {
            'score': int(score * 2),  # Scale to 200
            'max_score': 200,
            'feedback': f"📝 {result.get('feedback', 'Resumo avaliado!')}",
            'correct': score >= 70,
            'breakdown': {
                'llm_score': score,
                'accuracy': result.get('accuracy', 'média'),
                'points_covered': result.get('main_points_covered', 0),
                'errors': result.get('factual_errors', [])
            }
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback: Check key points presence"""
        key_points = round_data['data']['key_points']
        
        # Calculate coverage
        normalized_answer = answer.lower()
        points_found = [p for p in key_points if p.lower() in normalized_answer]
        coverage = len(points_found) / len(key_points) if key_points else 0
        
        word_count = len(answer.split())
        
        # Score: 60% coverage + 40% length
        coverage_score = coverage * 120
        length_score = min(80, word_count * 4)  # Cap at 80 for 20+ words
        score = int(coverage_score + length_score)
        
        return {
            'score': score,
            'max_score': 200,
            'feedback': f"📝 Você mencionou {len(points_found)}/{len(key_points)} pontos-chave. Palavras: {word_count}.",
            'correct': score >= 140,
            'breakdown': {
                'coverage': coverage,
                'points_found': points_found,
                'word_count': word_count,
                'method': 'heuristic'
            }
        }
