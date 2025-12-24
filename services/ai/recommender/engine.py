import logging
from typing import Dict, List, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from llm_factory import LLMFactory

logger = logging.getLogger(__name__)

class ContentRecommender:
    """
    AI-driven Content Recommender.
    Analyzes user profile and recent history to suggest the next best study topic or game mode.
    """
    
    def __init__(self):
        self.llm_factory = LLMFactory()
        # Use TIER_SMART (GPT-4o/Gemini Pro) for reasoning capability
        self.llm = self.llm_factory.get_smart_llm()
        
    async def get_recommendations(self, profile: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate recommendations.
        
        Args:
            profile: User profile (age, level, interests)
            history: Recent interactions (game results, topics studied)
            
        Returns:
            Dict with 'recommendations': List of suggested actions
        """
        prompt = ChatPromptTemplate.from_template(
            """
            Act as an expert localized education mentor.
            Analyze the student's profile and recent activity to recommend the next best step.
            
            Profile: {profile}
            Recent History: {history}
            
            Task:
            1. Identify weak spots or areas of interest based on history.
            2. Suggest 3 specific actions (e.g., "Play Word Hunt on History", "Read about Photosynthesis").
            3. Pick the best suitable Game Mode for each.
            
            Output strictly in JSON:
            {{
                "analysis": "Brief analysis of student state",
                "recommendations": [
                    {{
                        "title": "Action Title",
                        "description": "Why this?",
                        "suggested_game_mode": "GAME_ID (e.g., TOOL_WORD_HUNT, ROLEPLAY_DISCOVERY)",
                        "topic_suggestion": "Specific topic"
                    }}
                ]
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            # Safe stringify
            profile_str = str(profile)[:1000]
            history_str = str(history)[:2000]
            
            result = await chain.ainvoke({
                "profile": profile_str,
                "history": history_str
            })
            return result
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {
                "analysis": "Unavailable",
                "recommendations": []
            }

# Singleton
recommender = ContentRecommender()
