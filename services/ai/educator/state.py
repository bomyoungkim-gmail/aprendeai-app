"""
Educator State Definition

TypedDict for LangGraph state management.
All nodes receive and return this state structure.
"""

from typing import TypedDict, List, Optional, Dict


class EducatorState(TypedDict):
    """
    State for Educator Agent LangGraph.
    
    Flow:
    1. Input: prompt_message, context
    2. Processing: parsed_events, current_phase
    3. Output: next_prompt, quick_replies, events_to_write
    """
    
    # === INPUT ===
    prompt_message: Dict  # PromptMessageDto from NestJS
    context: Dict  # ContextPack from context_builder
    
    # === PROCESSING ===
    current_phase: str  # PRE | DURING | POST | GAME
    user_text: str  # Extracted from prompt_message
    parsed_events: List[Dict]  # Events parsed from quick commands
    
    # === GAME-SPECIFIC (added for games integration) ===
    game_mode: Optional[str]  # Current game mode ID (e.g., "BOSS_FIGHT_VOCAB")
    game_round_data: Optional[Dict]  # Current game round spec
    game_metadata: Optional[Dict]  # Game-specific metadata
    
    # === OUTPUT ===
    next_prompt: str  # Agent's next question/instruction
    quick_replies: List[str]  # Quick reply options for user
    events_to_write: List[Dict]  # SessionEvents to persist in NestJS
    hil_request: Optional[Dict]  # Human-in-loop request (if needed)
