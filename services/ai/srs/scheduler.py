"""
Spaced Repetition System (SRS)

Implements SM-2 algorithm for optimal review scheduling based on Ebbinghaus forgetting curve.
Maximizes long-term retention while minimizing study time.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class SRSCard:
    """Represents a single concept/card in the SRS system."""
    
    def __init__(self, card_id: str, content: str, topic: str):
        self.card_id = card_id
        self.content = content
        self.topic = topic
        self.ease_factor = 2.5  # Initial ease (SM-2 default)
        self.interval = 0  # Days until next review
        self.repetitions = 0  # Number of successful reviews
        self.next_review = datetime.utcnow()
        self.last_reviewed = None
        self.review_history: List[Dict[str, Any]] = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize card data."""
        return {
            "card_id": self.card_id,
            "content": self.content,
            "topic": self.topic,
            "ease_factor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "next_review": self.next_review.isoformat(),
            "last_reviewed": self.last_reviewed.isoformat() if self.last_reviewed else None,
            "review_history": self.review_history
        }


class SM2Scheduler:
    """
    SM-2 (SuperMemo 2) Algorithm Implementation
    
    Quality ratings:
    0 - Again (complete blackout, didn't remember)
    1 - Hard (incorrect but remembered something)
    2 - Good (correct with effort)
    3 - Easy (perfect recall)
    """
    
    @staticmethod
    def calculate_next_review(
        card: SRSCard,
        quality: int
    ) -> tuple[datetime, float, int]:
        """
        Calculate next review date using SM-2 algorithm.
        
        Args:
            card: The SRS card
            quality: Performance rating (0-3)
            
        Returns:
            (next_review_date, new_ease_factor, new_interval)
        """
        # Quality must be 0-3
        quality = max(0, min(3, quality))
        
        # Update ease factor
        new_ease = card.ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
        new_ease = max(1.3, new_ease)  # Minimum ease factor
        
        # Calculate interval
        if quality < 2:
            # Failed - reset to beginning
            new_interval = 0
            new_repetitions = 0
        else:
            if card.repetitions == 0:
                new_interval = 1  # First success: review tomorrow
            elif card.repetitions == 1:
                new_interval = 6  # Second success: review in 6 days
            else:
                # Subsequent reviews: multiply previous interval by ease factor
                new_interval = round(card.interval * new_ease)
            
            new_repetitions = card.repetitions + 1
        
        # Calculate next review date
        next_review = datetime.utcnow() + timedelta(days=new_interval)
        
        return next_review, new_ease, new_interval, new_repetitions


class SpacedRepetitionSystem:
    """
    Main SRS engine managing cards and reviews.
    """
    
    def __init__(self, db_client=None):
        """Initialize with optional database client."""
        self.db = db_client
        # In-memory storage (use DB in production)
        self.user_cards: Dict[str, Dict[str, SRSCard]] = defaultdict(dict)
    
    def create_card(
        self,
        user_id: str,
        content: str,
        topic: str,
        card_id: Optional[str] = None
    ) -> SRSCard:
        """Create a new SRS card for a concept."""
        if not card_id:
            card_id = f"card_{len(self.user_cards[user_id])}_{int(datetime.utcnow().timestamp())}"
        
        card = SRSCard(card_id, content, topic)
        self.user_cards[user_id][card_id] = card
        
        return card
    
    def review_card(
        self,
        user_id: str,
        card_id: str,
        quality: int,
        time_spent_seconds: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process a card review and update scheduling.
        
        Args:
            user_id: User identifier
            card_id: Card identifier
            quality: Performance rating (0=Again, 1=Hard, 2=Good, 3=Easy)
            time_spent_seconds: Time spent on review
            
        Returns:
            Updated card data with next review info
        """
        card = self.user_cards[user_id].get(card_id)
        if not card:
            raise ValueError(f"Card {card_id} not found for user {user_id}")
        
        # Calculate new schedule using SM-2
        next_review, new_ease, new_interval, new_reps = SM2Scheduler.calculate_next_review(card, quality)
        
        # Update card
        card.ease_factor = new_ease
        card.interval = new_interval
        card.repetitions = new_reps if quality >= 2 else 0
        card.next_review = next_review
        card.last_reviewed = datetime.utcnow()
        
        # Record review
        card.review_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "quality": quality,
            "time_spent_seconds": time_spent_seconds,
            "interval_after": new_interval,
            "ease_after": new_ease
        })
        
        return {
            "card_id": card_id,
            "next_review": next_review.isoformat(),
            "interval_days": new_interval,
            "ease_factor": new_ease,
            "repetitions": card.repetitions,
            "quality_rating": quality,
            "message": self._get_feedback_message(quality, new_interval)
        }
    
    def get_due_cards(
        self,
        user_id: str,
        limit: int = 20,
        topic: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get cards due for review today.
        
        Args:
            user_id: User identifier
            limit: Maximum cards to return
            topic: Filter by topic (optional)
            
        Returns:
            List of due cards sorted by priority
        """
        now = datetime.utcnow()
        due_cards = []
        
        for card in self.user_cards[user_id].values():
            if topic and card.topic != topic:
                continue
            
            if card.next_review <= now:
                # Calculate priority (overdue cards first)
                days_overdue = (now - card.next_review).days
                priority = days_overdue * 10 + (10 - card.ease_factor)
                
                due_cards.append({
                    "card": card.to_dict(),
                    "priority": priority,
                    "days_overdue": days_overdue
                })
        
        # Sort by priority (most urgent first)
        due_cards.sort(key=lambda x: x["priority"], reverse=True)
        
        return [item["card"] for item in due_cards[:limit]]
    
    def get_upcoming_reviews(
        self,
        user_id: str,
        days_ahead: int = 7
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get review schedule for next N days.
        
        Returns:
            {"2024-01-20": [card1, card2], "2024-01-21": [card3]}
        """
        now = datetime.utcnow()
        end_date = now + timedelta(days=days_ahead)
        
        schedule = defaultdict(list)
        
        for card in self.user_cards[user_id].values():
            if now <= card.next_review <= end_date:
                date_key = card.next_review.strftime('%Y-%m-%d')
                schedule[date_key].append(card.to_dict())
        
        return dict(schedule)
    
    def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get user's SRS statistics."""
        cards = list(self.user_cards[user_id].values())
        
        if not cards:
            return {"total_cards": 0}
        
        now = datetime.utcnow()
        
        due_count = sum(1 for c in cards if c.next_review <= now)
        mature_count = sum(1 for c in cards if c.interval >= 21)  # 3+ weeks
        
        total_reviews = sum(len(c.review_history) for c in cards)
        
        # Calculate average retention
        recent_reviews = []
        for card in cards:
            recent_reviews.extend(card.review_history[-10:])  # Last 10 per card
        
        if recent_reviews:
            good_reviews = sum(1 for r in recent_reviews if r["quality"] >= 2)
            retention_rate = good_reviews / len(recent_reviews)
        else:
            retention_rate = 0
        
        return {
            "total_cards": len(cards),
            "due_today": due_count,
            "mature_cards": mature_count,
            "total_reviews": total_reviews,
            "retention_rate": round(retention_rate, 2),
            "avg_ease_factor": round(sum(c.ease_factor for c in cards) / len(cards), 2)
        }
    
    def _get_feedback_message(self, quality: int, interval: int) -> str:
        """Get encouraging feedback based on performance."""
        messages = {
            0: f"Não se preocupe! Vamos revisar novamente em breve.",
            1: f"Quase lá! Próxima revisão em {interval} dia(s).",
            2: f"Bom trabalho! Você verá isso novamente em {interval} dia(s).",
            3: f"Perfeito! Revisar em {interval} dia(s)."
        }
        return messages.get(quality, "Revisão agendada!")


# Singleton
srs_system = SpacedRepetitionSystem()
