"""
Adaptive Learning Engine

Models learner progress and dynamically adjusts difficulty and content recommendations.
Uses Bayesian Knowledge Tracing-style approach simplified for practical use.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class LearnerModel:
    """
    Models a learner's knowledge state and skill progression.
    """
    
    # Skill level constants
    SKILL_NOVICE = 1
    SKILL_BEGINNER = 2
    SKILL_INTERMEDIATE = 3
    SKILL_ADVANCED = 4
    SKILL_EXPERT = 5
    
    def __init__(self):
        pass
    
    def calculate_skill_level(self, performance_history: List[Dict[str, Any]]) -> int:
        """
        Calculate current skill level based on recent performance.
        
        Args:
            performance_history: List of recent scores/attempts
            Format: [{"score": 85, "max_score": 100, "timestamp": ...}, ...]
        
        Returns:
            Skill level (1-5)
        """
        if not performance_history:
            return self.SKILL_NOVICE
        
        # Take last 10 attempts
        recent = performance_history[-10:]
        
        # Calculate average performance percentage
        total_percent = 0
        for attempt in recent:
            score = attempt.get("score", 0)
            max_score = attempt.get("max_score", 100)
            percent = (score / max_score * 100) if max_score > 0 else 0
            total_percent += percent
        
        avg_percent = total_percent / len(recent)
        
        # Map to skill level
        if avg_percent >= 90:
            return self.SKILL_EXPERT
        elif avg_percent >= 75:
            return self.SKILL_ADVANCED
        elif avg_percent >= 60:
            return self.SKILL_INTERMEDIATE
        elif avg_percent >= 40:
            return self.SKILL_BEGINNER
        else:
            return self.SKILL_NOVICE
    
    def is_improving(self, performance_history: List[Dict[str, Any]]) -> bool:
        """Check if learner is showing improvement trend."""
        if len(performance_history) < 4:
            return True  # Not enough data, assume positive
        
        # Compare recent half vs earlier half
        mid = len(performance_history) // 2
        early = performance_history[:mid]
        late = performance_history[mid:]
        
        def avg_score(group):
            if not group:
                return 0
            total = sum(item.get("score", 0) / item.get("max_score", 1) for item in group)
            return total / len(group)
        
        return avg_score(late) > avg_score(early)
    
    def detect_struggle_topics(self, topic_performance: Dict[str, List[float]]) -> List[str]:
        """
        Identify topics where learner is struggling.
        
        Args:
            topic_performance: {"math": [0.6, 0.5, 0.7], "science": [0.9, 0.95]}
        
        Returns:
            List of topic names where average < 0.65
        """
        struggling = []
        for topic, scores in topic_performance.items():
            if scores:
                avg = sum(scores) / len(scores)
                if avg < 0.65:
                    struggling.append(topic)
        return struggling


class AdaptiveLearningEngine:
    """
    Main adaptive learning engine.
    Adjusts difficulty and generates personalized learning paths.
    """
    
    def __init__(self, llm_factory=None):
        self.learner_model = LearnerModel()
        
        # Use LLM for advanced path generation
        if llm_factory:
            from llm_factory import LLMFactory
            self.llm_factory = llm_factory or LLMFactory()
            self.llm = self.llm_factory.get_smart_llm()
        else:
            self.llm = None
    
    def recommend_difficulty(self, user_history: List[Dict[str, Any]]) -> int:
        """
        Recommend difficulty level (1-5) based on user performance.
        
        Args:
            user_history: Recent game/assessment results
        
        Returns:
            Recommended difficulty (1-5)
        """
        skill_level = self.learner_model.calculate_skill_level(user_history)
        is_improving = self.learner_model.is_improving(user_history)
        
        # If improving, challenge with current skill level or +1
        # If not improving, step back to previous level
        if is_improving:
            return min(5, skill_level + 1)
        else:
            return max(1, skill_level - 1)
    
    async def generate_learning_path(
        self,
        user_id: str,
        performance_data: Dict[str, Any],
        learning_goals: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized learning path.
        
        Args:
            user_id: User identifier
            performance_data: {
                "recent_scores": [...],
                "topic_performance": {"math": [0.8, 0.9]},
                "completed_content": ["content_id1", "content_id2"],
                "time_spent_minutes": 45
            }
            learning_goals: Optional list of topics to focus on
        
        Returns:
            Learning path with recommended next actions
        """
        recent_scores = performance_data.get("recent_scores", [])
        topic_perf = performance_data.get("topic_performance", {})
        
        # Analyze current state
        skill_level = self.learner_model.calculate_skill_level(recent_scores)
        struggling_topics = self.learner_model.detect_struggle_topics(topic_perf)
        recommended_difficulty = self.recommend_difficulty(recent_scores)
        
        # Generate path (rule-based fallback if no LLM)
        if not self.llm:
            next_actions = self._generate_rule_based_path(
                skill_level,
                struggling_topics,
                recommended_difficulty,
                learning_goals
            )
        else:
            # Use LLM for more sophisticated path generation
            next_actions = await self._generate_llm_based_path(
                skill_level,
                struggling_topics,
                recommended_difficulty,
                performance_data,
                learning_goals
            )
        
        return {
            "user_id": user_id,
            "current_skill_level": skill_level,
            "recommended_difficulty": recommended_difficulty,
            "struggling_topics": struggling_topics,
            "next_actions": next_actions,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _generate_rule_based_path(
        self,
        skill_level: int,
        struggling_topics: List[str],
        difficulty: int,
        goals: Optional[List[str]]
    ) -> List[Dict[str, str]]:
        """Generate learning path using simple rules."""
        actions = []
        
        # Prioritize struggling topics
        for topic in struggling_topics[:2]:  # Focus on top 2
            actions.append({
                "type": "review",
                "topic": topic,
                "game_mode": "TOOL_WORD_HUNT",
                "difficulty": max(1, difficulty - 1),  # Easier for review
                "reason": f"Reinforce understanding of {topic}"
            })
        
        # Add challenge for growth
        if skill_level >= 3:
            actions.append({
                "type": "challenge",
                "game_mode": "ROLEPLAY_DISCOVERY",
                "difficulty": difficulty,
                "reason": "Practice application with roleplay"
            })
        
        # Suggest new topics if mastering current
        if skill_level >= 4 and not struggling_topics:
            actions.append({
                "type": "explore",
                "game_mode": "DUEL_DEBATE",
                "difficulty": difficulty,
                "reason": "Ready for advanced peer debates"
            })
        
        return actions
    
    async def _generate_llm_based_path(
        self,
        skill_level: int,
        struggling_topics: List[str],
        difficulty: int,
        performance_data: Dict[str, Any],
        goals: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """Generate learning path using LLM reasoning."""
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser
        
        prompt = ChatPromptTemplate.from_template(
            """
            Act as an expert adaptive learning AI tutor.
            
            Student Profile:
            - Current Skill Level: {skill_level}/5
            - Recommended Difficulty: {difficulty}/5
            - Struggling Topics: {struggling_topics}
            - Learning Goals: {goals}
            - Recent Performance: {performance_summary}
            
            Generate a personalized learning path with 3-4 specific next actions.
            Each action should include game mode, topic, difficulty, and pedagogical reasoning.
            
            Output strictly in JSON:
            {{
                "next_actions": [
                    {{
                        "type": "review|challenge|explore",
                        "game_mode": "TOOL_WORD_HUNT|ROLEPLAY_DISCOVERY|DUEL_DEBATE|etc",
                        "topic": "specific topic or null",
                        "difficulty": 1-5,
                        "reason": "pedagogical reasoning"
                    }}
                ]
            }}
            """
        )
        
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({
                "skill_level": skill_level,
                "difficulty": difficulty,
                "struggling_topics": struggling_topics or "None",
                "goals": goals or "General improvement",
                "performance_summary": str(performance_data)[:500]
            })
            return result.get("next_actions", [])
        except Exception as e:
            logger.error(f"LLM path generation failed: {e}")
            return self._generate_rule_based_path(skill_level, struggling_topics, difficulty, goals)


# Singleton
adaptive_engine = AdaptiveLearningEngine()
