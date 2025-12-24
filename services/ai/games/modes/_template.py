"""
Game Module Template

Copy this file to create a new game:
    cp _template.py my_game.py

Then:
1. Update GAME_ID, GAME_NAME, etc
2. Implement create_round()
3. Implement evaluate_answer()
4. Optionally override get_quick_replies()
5. Test with: pytest tests/games/test_my_game.py
6. Done! Auto-discovered by registry.

NOTE: This template has NO GAME_ID to prevent auto-discovery.
"""
from typing import Dict, Any, List
import logging
from ..base import BaseGame

logger = logging.getLogger(__name__)


class TemplateGame(BaseGame):
    """
    Template game - replace with your implementation.
    
    DELETE THIS CLASS or rename file to start with __ to prevent registry discovery.
    """
    
    # === REQUIRED: Game metadata ===
    # GAME_ID = "TEMPLATE_GAME"  # Uncomment and change this!
    GAME_NAME = "Template Game"  # Display name
    DIFFICULTY_RANGE = (1, 5)  # Min/max difficulty
    DURATION_MIN = 5  # Typical duration in minutes
    REQUIRES_CONTENT = True  # Needs active reading content?
    GAME_INTENT = "solo"  # "solo" | "group_sync" | "group_async"
    
    # === OPTIONAL: Configuration ===
    CONFIG = {
        # Put declarative config here (not hard-coded logic)
        'max_attempts': 3,
        'scoring': {
            'correct': 10,
            'partial': 5,
        }
    }
    
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """
        Create a new game round.
        
        Args:
            state: Pedagogical state with:
                - content_slice: str (current text chunk)
                - target_words: List[str]
                - phase: str ("PRE"|"DURING"|"POST")
                - ... (see EducatorState)
            difficulty: 1-5 (use self.validate_difficulty())
        
        Returns:
            Round spec dict with:
                - game_mode: str (must be self.GAME_ID)
                - prompt: str (question/task for user)
                - difficulty: int
                - expected_format: str (how user should respond)
                - metadata: dict (game-specific data)
        """
        difficulty = self.validate_difficulty(difficulty)
        
        logger.info(
            f"Creating {self.GAME_ID} round",
            extra={
                'game_id': self.GAME_ID,
                'difficulty': difficulty,
            }
        )
        
        # TODO: Implement your round creation logic
        
        prompt = "Your game prompt here..."
        
        round_spec = {
            'game_mode': self.GAME_ID,
            'prompt': prompt,
            'difficulty': difficulty,
            'expected_format': "texto livre / A/B/C / etc",
            'metadata': {
                # Game-specific data
                'attempts_remaining': self.CONFIG['max_attempts'],
            }
        }
        
        return round_spec
    
    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """
        Evaluate user's answer.
        
        Args:
            round_data: Round spec from create_round()
            answer: User's text response
        
        Returns:
            Evaluation dict with:
                - score: int (points earned)
                - max_score: int (maximum possible)
                - feedback: str (explanation for user)
                - correct: bool (whether answer was correct)
                - breakdown: dict (detailed scoring info)
        """
        logger.info(
            f"Evaluating {self.GAME_ID} answer",
            extra={
                'game_id': self.GAME_ID,
                'answer_length': len(answer),
            }
        )
        
        # TODO: Implement your scoring logic
        # For simple games: heuristic rules
        # For complex games: LLM-based evaluation
        
        score = 0
        max_score = 10
        feedback = "Feedback here..."
        
        result = {
            'score': score,
            'max_score': max_score,
            'feedback': feedback,
            'correct': score >= (max_score * 0.6),  # 60% threshold
            'breakdown': {
                # Detailed scoring info
                'word_count': len(answer.split()),
            }
        }
        
        return result
    
    def get_quick_replies(self, round_data: Dict[str, Any]) -> List[str]:
        """
        Get context-specific quick reply options.
        
        Optional - can use default from BaseGame.
        """
        return [
            "Opção 1",
            "Opção 2",
            "Não sei",
        ]
