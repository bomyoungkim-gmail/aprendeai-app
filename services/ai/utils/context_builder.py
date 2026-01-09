"""
Context Pack Builder

Assembles ContextPack for Educator Agent by calling NestJS API.
This ensures we don't duplicate database access and maintain single source of truth.
"""

from typing import Dict
from .nestjs_client import nestjs_client
import asyncio
import logging
from educator.policies.decision_policy import parse_decision_policy
from educator.prompts.mode_prompts import get_mode_instructions  # Script 02

logger = logging.getLogger(__name__)


class ContextPackBuilder:
    """Builds ContextPack from PromptMessage using NestJS API"""
    
    async def build(self, prompt_message: Dict) -> Dict:
        """
        Build minimal but sufficient context for Educator Agent.
        
        Args:
            prompt_message: {
                "threadId": "...",
                "readingSessionId": "...",
                "actorRole": "LEARNER",
                "text": "...",
                "metadata": {
                    "uiMode": "PRE",
                    "contentId": "...",
                    ...
                }
            }
        
        Returns:
            ContextPack: {
                "learner": {...},
                "session": {...},
                "vocabFocus": {...},
                "content": {...},
                "decision_policy": {...}  # DecisionPolicyV1
            }
        """
        try:
            # Extract IDs from prompt message
            session_id = prompt_message['readingSessionId']
            metadata = prompt_message.get('metadata', {})
            
            # Get session first (contains userId and contentId)
            session = await nestjs_client.get_session(session_id)
            user_id = session['userId']
            content_id = session['contentId']
            
            # Parallel fetch for efficiency
            learner, vocab, content, highlights_list = await asyncio.gather(
                nestjs_client.get_learner_profile(user_id),
                nestjs_client.get_vocab_focus(user_id, limit=50),
                nestjs_client.get_content_metadata(content_id),
                nestjs_client.get_cornell_highlights(content_id, user_id),
                return_exceptions=True
            )
            
            # Handle potential errors
            if isinstance(learner, Exception):
                logger.error(f"Failed to fetch learner profile: {learner}")
                learner = {"educationLevel": "MEDIO", "age": None, "preferredLanguages": ["PT"]}
            
            if isinstance(vocab, Exception):
                logger.error(f"Failed to fetch vocab: {vocab}")
                vocab = {"dueWords": [], "totalDue": 0}
            
            if isinstance(content, Exception):
                logger.error(f"Failed to fetch content: {content}")
                content = {"title": "Unknown", "originalLanguage": "PT"}
            
            # Assemble ContextPack
            # Extract content mode (Script 02: RB-CONTENT-MODE)
            content_mode = content.get('mode', 'TECHNICAL')  # Default to TECHNICAL
            mode_instructions = get_mode_instructions(content_mode)
            
            # Structure highlights
            highlights = {"doubts": [], "evidence": [], "mainItems": []}
            if not isinstance(highlights_list, Exception):
                 for h in highlights_list:
                     h_type = h.get('type')
                     h_text = h.get('text') or h.get('selected_text') or ""
                     h_comment = h.get('comment_text') or ""
                     
                     item = {"text": h_text, "note": h_comment, "id": h.get('id')}
                     
                     if h_type == 'DOUBT':
                         highlights['doubts'].append(item)
                     elif h_type == 'EVIDENCE':
                         highlights['evidence'].append(item)
                     elif h_type == 'MAIN_IDEA':
                         highlights['mainItems'].append(item)
            
            context_pack = {
                "learner": {
                    "educationLevel": learner.get('educationLevel', 'MEDIO'),
                    "age": learner.get('age'),
                    "language": learner.get('preferredLanguages', ['PT'])[0] if learner.get('preferredLanguages') else 'PT',
                },
                "session": {
                    "id": session['id'],
                    "phase": session['phase'],
                    "contentId": content_id,
                    "goalStatement": session.get('goalStatement'),
                    "predictionText": session.get('predictionText'),
                    "targetWords": session.get('targetWordsJson', []),
                    "assetLayer": session.get('assetLayer', 'L1'),
                },
                "vocabFocus": {
                    "dueWords": vocab.get('dueWords', [])[:5],  # Top 5 most urgent
                    "totalDue": vocab.get('totalDue', 0),
                    "hasBlockers": vocab.get('totalDue', 0) > 10,  # If >10 words due, it's blocking
                },
                "content": {
                    "title": content.get('title', 'Unknown'),
                    "language": content.get('originalLanguage', 'PT'),
                    "difficulty": content.get('difficulty', 'medium'),
                    "mode": content_mode,
                    "highlights": highlights, # Enriched highlights
                },
                # Script 02: Mode-specific system instructions
                "modeInstructions": mode_instructions,
                # Parse and validate decision_policy (if present in session data)
                # Falls back to defaults if not present or invalid
                "decision_policy": parse_decision_policy(
                    session.get('decision_policy')
                ).model_dump(),
                # SCRIPT 03: Scaffolding & Fading
                # Extract scaffolding state from session (sent by NestJS Context Builder)
                "scaffolding": {
                    "level": session.get('scaffolding_level', 2),  # Default L2
                    "behavior": session.get('scaffolding_behavior', {}),
                    "systemPromptOverride": session.get('system_prompt_override', ''),
                },
            }
            
            logger.debug(f"Built context pack for session {session_id}")
            return context_pack
            
        except Exception as e:
            logger.error(f"Failed to build context pack: {e}")
            raise


# Global instance
context_builder = ContextPackBuilder()
