from typing import Dict, Any, List
import logging
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from games.base import BaseGame
from llm_factory import LLMFactory, TIER_CHEAP

logger = logging.getLogger(__name__)

class RoleplayGame(BaseGame):
    """
    Roleplay Game Mode (Powered by Gemini)
    
    The AI adopts a persona based on the study content and challenges the user.
    Designed for low-latency, low-cost interactions using Gemini 1.5 Flash.
    """
    
    GAME_ID = "ROLEPLAY_DISCOVERY"
    GAME_NAME = "Desafio de Roleplay"
    DIFFICULTY_RANGE = (1, 5)
    DURATION_MIN = 10
    REQUIRES_CONTENT = True
    GAME_INTENT = "duo"
    
    def __init__(self):
        super().__init__()
        self.llm_factory = LLMFactory()
        # Use TIER_CHEAP (Gemini Flash) for this high-volume conversational game
        self.llm = self.llm_factory.get_cheap_llm(temperature=0.7) 
        
    def create_round(self, state: Dict[str, Any], difficulty: int) -> Dict[str, Any]:
        """
        Generate a persona and opening line based on content.
        """
        content = state.get('content_slice', '')
        learner_lang = state.get('learner_profile', {}).get('language', 'PT')
        
        prompt = ChatPromptTemplate.from_template(
            """
            Analyze the following educational content and create a 'Persona' to roleplay with the student.
            The persona should be relevant to the text (e.g., a scientist mentioned, a skeptic, an affected citizen, or a Socratic teacher).
            
            Content: {content}
            Difficulty: {difficulty}/5
            Language: {language}
            
            Output strictly in JSON:
            {{
                "persona_name": "Name/Title",
                "persona_description": "Brief description of who you are and your stance.",
                "opening_line": "Your first immersive message to the student to start the debate/roleplay.",
                "learning_objective": "What you want to test/teach the student."
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({
                "content": content[:2000], # Limit context
                "difficulty": difficulty,
                "language": learner_lang
            })
            
            return {
                "game_mode": self.GAME_ID,
                "prompt": f"🎭 **Roleplay: {result['persona_name']}**\n\n{result['persona_description']}\n\n---\n\n**{result['persona_name']} diz:**\n\n\"{result['opening_line']}\"",
                "metadata": {
                    "persona": result,
                    "turn_count": 0
                },
                "step": "active",
                "expected_format": "chat"
            }
            
        except Exception as e:
            logger.error(f"Error creating roleplay round: {e}")
            return {
                "game_mode": self.GAME_ID,
                "prompt": "Erro ao iniciar o Roleplay. Tente novamente.",
                "metadata": {},
                "step": "error"
            }

    async def evaluate_answer(self, round_data: Dict[str, Any], answer: str) -> Dict[str, Any]:
        """
        Continue the roleplay conversation.
        """
        persona = round_data['metadata'].get('persona', {})
        turn_count = round_data['metadata'].get('turn_count', 0)
        
        prompt = ChatPromptTemplate.from_template(
            """
            You are currently roleplaying as: {persona_name}.
            Description: {persona_description}
            Objective: {learning_objective}
            
            User's reply: "{user_answer}"
            
            1. Evaluate if the user made a good point (score 0-100).
            2. Stay in character completely. Respond to the user naturally.
            3. If the user successfully defended their point or turn count > 5, conclude the chat. Otherwise, continue challenging them.
            
            Output strictly in JSON:
            {{
                "score": 0-100,
                "character_response": "Your in-character response",
                "is_concluded": boolean,
                "feedback_meta": "Brief out-of-character feedback for the system"
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "persona_name": persona.get('persona_name', 'Unknown'),
                "persona_description": persona.get('persona_description', ''),
                "learning_objective": persona.get('learning_objective', ''),
                "user_answer": answer
            })
            
            # Update turn count logic would happen in state management, but here we just return result
            is_final = result.get('is_concluded', False) or turn_count >= 5
            
            response_text = f"**{persona.get('persona_name')} diz:**\n\n{result['character_response']}"
            
            if is_final:
                response_text += "\n\n🏁 **Fim do Roleplay**"
            
            return {
                "score": result.get('score', 0),
                "max_score": 100,
                "feedback": response_text,
                "correct": result.get('score', 0) > 70,
                "breakdown": {
                    "meta_feedback": result.get('feedback_meta'),
                    "concluded": is_final
                }
            }
            
        except Exception as e:
            logger.error(f"Error evaluating roleplay: {e}")
            return {
                "score": 0,
                "max_score": 0,
                "feedback": "Erro ao processar resposta do roleplay.",
                "correct": False,
                "breakdown": {}
            }
            
    def get_next_step(self, current_step: str) -> str:
        # In a real implementation, this would read from the evaluation result 'concluded' flag
        # For simplicity in this demo, we handle it via the feedback loop or client state
        return "complete" # Simplified for now, usually would check middleware state

    def get_quick_replies(self, round_data: Dict[str, Any]) -> List[str]:
        return ["Concordo com você", "Discordo, pois...", "Pode explicar melhor?"]
