"""
Scaffolding Node - Calculates scaffolding level and fading instructions.

AGENT SCRIPT C: Dynamic support based on mastery state.
"""

from educator.transfer_state import TransferState
import logging

logger = logging.getLogger(__name__)

# Max tokens per scaffolding level
MAX_TOKENS_MAP = {
    3: 400,  # Novice: Detailed explanations
    2: 250,  # Apprentice: Moderate detail
    1: 120,  # Practitioner: Concise (Fading active)
    0: 0     # Expert: Minimal/Help on demand only
}

# Style instructions per level (Fading rules)
SCAFFOLDING_TEMPLATES = {
    3: """Provide detailed explanations with examples. Use analogies freely to aid understanding. 
Suggest next steps and offer proactive guidance.""",
    
    2: """Be helpful but concise. Provide examples when needed. 
Balance explanation with learner autonomy.""",
    
    1: """EXTREMELY CONCISE. Prefer questions to explanations. 
DO NOT generate long analogies unless explicitly requested.
DO NOT introduce new domains or concepts without being asked.
Encourage learner to think independently.""",
    
    0: """Minimal intervention. Provide only what is explicitly requested.
Assume high competence. Help on demand only."""
}


def calculate_scaffolding_level(mastery_state: dict, user_profile: dict) -> int:
    """
    Calculate effective scaffolding level (0-3) based on mastery state.
    
    Args:
        mastery_state: User's mastery data (e.g., concept scores)
        user_profile: Learner profile with schooling level, etc.
    
    Returns:
        int: 0 (Expert) to 3 (Novice)
    """
    # Default to medium support if no mastery data
    if not mastery_state:
        return 2
    
    # Extract mastery score (0.0 to 1.0)
    # Assuming mastery_state has a 'score' or 'average_mastery' field
    mastery_score = mastery_state.get('score') or mastery_state.get('average_mastery', 0.5)
    
    # Map mastery to scaffolding level (inverse relationship)
    if mastery_score >= 0.8:
        return 0  # Expert
    elif mastery_score >= 0.6:
        return 1  # Practitioner (Fading)
    elif mastery_score >= 0.3:
        return 2  # Apprentice
    else:
        return 3  # Novice


def handle(state: TransferState) -> TransferState:
    """
    Calculate scaffolding level and inject fading instructions.
    
    This node runs BEFORE intent routing to enrich state with context-aware settings.
    """
    logger.info("Scaffolding node executing")
    
    user_profile = state.get('user_profile', {})
    transfer_metadata = state.get('transfer_metadata', {})
    
    # Extract mastery state (could be in user_profile or transfer_metadata)
    mastery_state = user_profile.get('mastery_state_json') or transfer_metadata.get('mastery_state', {})
    
    # Calculate level
    scaffolding_level = calculate_scaffolding_level(mastery_state, user_profile)
    max_tokens = MAX_TOKENS_MAP.get(scaffolding_level, 250)
    style_instructions = SCAFFOLDING_TEMPLATES.get(scaffolding_level, SCAFFOLDING_TEMPLATES[2])
    
    logger.info(f"Scaffolding: Level={scaffolding_level}, MaxTokens={max_tokens}")
    
    return {
        **state,
        "scaffolding_level": scaffolding_level,
        "max_tokens": max_tokens,
        "style_instructions": style_instructions,
        "current_node": "scaffolding"
    }
