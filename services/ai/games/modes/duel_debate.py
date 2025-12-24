from typing import Dict, Any, List
import logging
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from games.base import BaseGame
from llm_factory import LLMFactory, TIER_CHEAP

logger = logging.getLogger(__name__)

class DuelDebateGame(BaseGame):
    """
    Duel Debate Game Mode (Multiplayer)
    
    Two players are presented with a controversial question based on the reading.
    They both submit answers, and the AI judges who had the better argument.
    """
    
    GAME_ID = "DUEL_DEBATE"
    GAME_NAME = "Duelo de Debates"
    DIFFICULTY_RANGE = (3, 5)
    DURATION_MIN = 15
    REQUIRES_CONTENT = True
    GAME_INTENT = "group_sync" # Multiplayer
    
    def __init__(self):
        super().__init__()
        self.llm_factory = LLMFactory()
        # Use TIER_CHEAP (Gemini Flash) for evaluation
        self.llm = self.llm_factory.get_cheap_llm(temperature=0.3) 
        
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """
        Generate a debate topic.
        """
        content = state.get('content_slice', '')
        
        prompt = ChatPromptTemplate.from_template(
            """
            Based on the provided educational content, create a controversial debate topic or question 
            that has two reasonable sides.
            
            Content: {content}
            
            Output strictly in JSON:
            {{
                "topic": "The debate question/statement",
                "side_a": "Brief description of Side A",
                "side_b": "Brief description of Side B"
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({
                "content": content[:2000]
            })
            
            return {
                "game_mode": self.GAME_ID,
                "prompt": f"⚔️ **Duelo de Debates**\n\n**Tópico:** {result['topic']}\n\nDesafie um amigo! Quem tem o melhor argumento?",
                "metadata": {
                    "topic": result['topic'],
                    "auto_sides": result
                },
                "expected_format": "json_dual_input" # Custom format hinting FE to collect 2 inputs
            }
            
        except Exception as e:
            logger.error(f"Error creating duel round: {e}")
            return {
                "game_mode": self.GAME_ID,
                "prompt": "Erro ao criar tópico de duelo.",
                "metadata": {},
                "step": "error"
            }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """
        Compare two answers.
        Expected 'answer' format: JSON string '{"player_a": "...", "player_b": "..."}'
        """
        topic = round_data['metadata'].get('topic', 'General Topic')
        
        # Parse inputs
        try:
            inputs = json.loads(answer)
            arg_a = inputs.get('player_a', '')
            arg_b = inputs.get('player_b', '')
        except:
            # Fallback if single string passed (unexpected)
            arg_a = answer
            arg_b = "No argument provided."
        
        prompt = ChatPromptTemplate.from_template(
            """
            Judge a debate between two students on the topic: "{topic}".
            
            Argument A: "{arg_a}"
            Argument B: "{arg_b}"
            
            1. Evaluate clarity, logic, and use of evidence for BOTH.
            2. Decide a winner (or tie).
            3. Provide constructive feedback for both.
            
            Output strictly in JSON:
            {{
                "score_a": 0-100,
                "score_b": 0-100,
                "winner": "A" or "B" or "TIE",
                "reasoning": "Why the winner won",
                "feedback_a": "Feedback for A",
                "feedback_b": "Feedback for B"
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "topic": topic,
                "arg_a": arg_a,
                "arg_b": arg_b
            })
            
            winner_text = "🤝 Empate!"
            if result['winner'] == 'A':
                winner_text = "🏆 Vencedor: Jogador A"
            elif result['winner'] == 'B':
                winner_text = "🏆 Vencedor: Jogador B"
            
            feedback_text = (
                f"{winner_text}\n\n"
                f"**Motivo:** {result['reasoning']}\n\n"
                f"**Feedback A ({result['score_a']}):** {result['feedback_a']}\n"
                f"**Feedback B ({result['score_b']}):** {result['feedback_b']}"
            )
            
            return {
                "score": max(result['score_a'], result['score_b']), # Return max score as round score
                "max_score": 100,
                "feedback": feedback_text,
                "correct": True, # Debate is always "valid" completion
                "breakdown": result
            }
            
        except Exception as e:
            logger.error(f"Error evaluating duel: {e}")
            return {
                "score": 0,
                "max_score": 0,
                "feedback": "Erro ao julgar o duelo.",
                "correct": False,
                "breakdown": {}
            }
