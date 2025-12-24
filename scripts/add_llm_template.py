#!/usr/bin/env python3
"""
Batch add LLM integration to remaining games
"""

TEMPLATE = '''"""{{GAME_NAME}}"""
from typing import List, Dict, Any
import logging
from games.base import BaseGame

logger = logging.getLogger(__name__)

{{REST_OF_FILE}}

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Evaluate using LLM with fallback"""
        # Try LLM evaluation first
        try:
            if self.llm_service:
                return await self._llm_evaluate(round_data, answer)
            else:
                raise ValueError("LLM service not available")
        except Exception as e:
            logger.warning(f"LLM evaluation failed for {{GAME_ID}}, using fallback: {e}")
            return self._heuristic_evaluate(round_data, answer)
    
    async def _llm_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Use LLM to evaluate answer"""
        prompt = f\"\"\"{{EVALUATION_PROMPT}}\"\"\"
        
        result = await self.llm_service.predict_json(
            prompt=prompt,
            schema={{
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "feedback": {"type": "string"}
                },
                "required": ["score", "feedback"]
            }},
            temperature=0.7
        )
        
        score = result.get("score", 0)
        return {
            'score': int(score),
            'max_score': 100,
            'feedback': result.get("feedback", "Avaliado."),
            'correct': score >= 70,
            'breakdown': {'llm_score': score}
        }
    
    def _heuristic_evaluate(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """Fallback heuristic - EXISTING LOGIC COPIED HERE"""
        {{EXISTING_HEURISTIC}}
'''

print("Template ready for manual application")
