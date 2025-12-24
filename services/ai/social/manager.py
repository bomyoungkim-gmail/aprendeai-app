"""
Social Features Service

Manages friend relationships, challenges, and social leaderboards.

NOTE: For production, add these models to schema.prisma:
```prisma
model Friendship {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation("UserFriendships", fields: [userId], references: [id])
  friendId    String   @map("friend_id")
  friend      User     @relation("FriendOf", fields: [friendId], references: [id])
  status      String   // "pending", "accepted", "blocked"
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@unique([userId, friendId])
  @@map("friendships")
}

model Challenge {
  id            String   @id @default(uuid())
  challengerId  String   @map("challenger_id")
  challenger    User     @relation("ChallengesSent", fields: [challengerId], references: [id])
  challengedId  String   @map("challenged_id")
  challenged    User     @relation("ChallengesReceived", fields: [challengedId], references: [id])
  gameMode      String   @map("game_mode")
  status        String   // "pending", "accepted", "completed", "declined"
  winnerId      String?  @map("winner_id")
  challengerScore Int? @map("challenger_score")
  challengedScore Int? @map("challenged_score")
  createdAt     DateTime @default(now()) @map("created_at")
  completedAt   DateTime? @map("completed_at")
  
  @@map("challenges")
}
```
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)

class SocialManager:
    """
    Manages social features.
    Currently uses in-memory storage - replace with DB queries in production.
    """
    
    def __init__(self):
        # In-memory storage (would be Redis or DB in production)
        self.friendships = {}  # {user_id: [friend_id1, friend_id2]}
        self.challenges = []  # List of challenge dicts
        self.friend_requests = []  # List of pending requests
    
    def send_friend_request(self, from_user_id: str, to_user_id: str) -> Dict[str, Any]:
        """Send a friend request."""
        # Check if already friends
        if to_user_id in self.friendships.get(from_user_id, []):
            return {"success": False, "error": "Already friends"}
        
        # Check if request already exists
        existing = [
            r for r in self.friend_requests
            if (r["from_user"] == from_user_id and r["to_user"] == to_user_id)
        ]
        if existing:
            return {"success": False, "error": "Request already sent"}
        
        request = {
            "id": f"req_{len(self.friend_requests)}",
            "from_user": from_user_id,
            "to_user": to_user_id,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        self.friend_requests.append(request)
        
        return {"success": True, "request": request}
    
    def accept_friend_request(self, request_id: str) -> Dict[str, Any]:
        """Accept a friend request."""
        request = next((r for r in self.friend_requests if r["id"] == request_id), None)
        if not request:
            return {"success": False, "error": "Request not found"}
        
        if request["status"] != "pending":
            return {"success": False, "error": "Request already processed"}
        
        # Add friendship (bidirectional)
        from_user = request["from_user"]
        to_user = request["to_user"]
        
        if from_user not in self.friendships:
            self.friendships[from_user] = []
        if to_user not in self.friendships:
            self.friendships[to_user] = []
        
        self.friendships[from_user].append(to_user)
        self.friendships[to_user].append(from_user)
        
        request["status"] = "accepted"
        
        return {"success": True, "friendship": {"user1": from_user, "user2": to_user}}
    
    def get_friends(self, user_id: str) -> List[str]:
        """Get list of friend IDs."""
        return self.friendships.get(user_id, [])
    
    def send_challenge(
        self,
        challenger_id: str,
        challenged_id: str,
        game_mode: str = "DUEL_DEBATE"
    ) -> Dict[str, Any]:
        """Send a game challenge to another user."""
        # Check if users are friends (optional)
        friends = self.get_friends(challenger_id)
        if challenged_id not in friends:
            # Allow challenges to non-friends too
            pass
        
        challenge = {
            "id": f"challenge_{len(self.challenges)}",
            "challenger_id": challenger_id,
            "challenged_id": challenged_id,
            "game_mode": game_mode,
            "status": "pending",
            "winner_id": None,
            "challenger_score": None,
            "challenged_score": None,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": None
        }
        self.challenges.append(challenge)
        
        return {"success": True, "challenge": challenge}
    
    def accept_challenge(self, challenge_id: str) -> Dict[str, Any]:
        """Accept a challenge."""
        challenge = next((c for c in self.challenges if c["id"] == challenge_id), None)
        if not challenge:
            return {"success": False, "error": "Challenge not found"}
        
        if challenge["status"] != "pending":
            return {"success": False, "error": "Challenge already processed"}
        
        challenge["status"] = "accepted"
        
        return {
            "success": True,
            "challenge": challenge,
            "message": "Challenge accepted! Both players can now submit answers."
        }
    
    def submit_challenge_result(
        self,
        challenge_id: str,
        user_id: str,
        score: int
    ) -> Dict[str, Any]:
        """Submit score for a challenge."""
        challenge = next((c for c in self.challenges if c["id"] == challenge_id), None)
        if not challenge:
            return {"success": False, "error": "Challenge not found"}
        
        # Store score
        if user_id == challenge["challenger_id"]:
            challenge["challenger_score"] = score
        elif user_id == challenge["challenged_id"]:
            challenge["challenged_score"] = score
        else:
            return {"success": False, "error": "User not part of this challenge"}
        
        # Check if both have submitted
        if challenge["challenger_score"] is not None and challenge["challenged_score"] is not None:
            # Determine winner
            if challenge["challenger_score"] > challenge["challenged_score"]:
                challenge["winner_id"] = challenge["challenger_id"]
            elif challenge["challenged_score"] > challenge["challenger_score"]:
                challenge["winner_id"] = challenge["challenged_id"]
            else:
                challenge["winner_id"] = "tie"
            
            challenge["status"] = "completed"
            challenge["completed_at"] = datetime.utcnow().isoformat()
        
        return {"success": True, "challenge": challenge}
    
    def get_leaderboard(
        self,
        scope: str = "global",
        friend_ids: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get leaderboard.
        
        Args:
            scope: "global" or "friends"
            friend_ids: List of friend IDs (for friends scope)
            limit: Number of entries
        
        Returns:
            Ranked list of users
        
        NOTE: Mock implementation - would query actual game data from DB
        """
        # Mock leaderboard data
        mock_scores = {
            "user_1": {"xp": 15000, "games_won": 45, "streak": 12},
            "user_2": {"xp": 12500, "games_won": 38, "streak": 8},
            "user_3": {"xp": 18000, "games_won": 52, "streak": 15},
        }
        
        # If friends scope, filter
        if scope == "friends" and friend_ids:
            mock_scores = {uid: data for uid, data in mock_scores.items() if uid in friend_ids}
        
        # Sort by XP
        ranked = sorted(
            [{"user_id": uid, **data} for uid, data in mock_scores.items()],
            key=lambda x: x["xp"],
            reverse=True
        )
        
        # Add rank
        for idx, entry in enumerate(ranked[:limit], start=1):
            entry["rank"] = idx
        
        return ranked[:limit]


# Singleton
social_manager = SocialManager()
