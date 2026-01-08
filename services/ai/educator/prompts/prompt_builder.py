"""
Prompt Builder Helper (SCRIPT 03: Scaffolding & Fading)

Provides utilities to build system prompts with scaffolding behavior modifiers.
"""

from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


def build_system_prompt(context_pack: Dict, base_prompt: str = "") -> str:
    """
    Build system prompt with scaffolding override if present.
    
    Args:
        context_pack: Context pack from ContextPackBuilder
        base_prompt: Base system prompt (optional)
    
    Returns:
        Enhanced system prompt with scaffolding instructions
    """
    scaffolding = context_pack.get('scaffolding', {})
    override = scaffolding.get('systemPromptOverride', '')
    
    # If scaffolding override is present, use it
    if override:
        logger.debug(f"Applying scaffolding system prompt override (level: {scaffolding.get('level', 'unknown')})")
        
        # Prepend override to base prompt
        if base_prompt:
            return f"{override}\n\n{base_prompt}"
        return override
    
    # No override, return base prompt
    return base_prompt


def get_scaffolding_level(context_pack: Dict) -> int:
    """
    Extract scaffolding level from context pack.
    
    Args:
        context_pack: Context pack from ContextPackBuilder
    
    Returns:
        Scaffolding level (0-3), defaults to 2
    """
    return context_pack.get('scaffolding', {}).get('level', 2)


def get_scaffolding_behavior(context_pack: Dict) -> Dict:
    """
    Extract scaffolding behavior modifiers from context pack.
    
    Args:
        context_pack: Context pack from ContextPackBuilder
    
    Returns:
        Behavior modifiers dict (may be empty)
    """
    return context_pack.get('scaffolding', {}).get('behavior', {})


def should_use_socratic_mode(context_pack: Dict) -> bool:
    """
    Check if Socratic mode should be used based on scaffolding behavior.
    
    Args:
        context_pack: Context pack from ContextPackBuilder
    
    Returns:
        True if Socratic mode is enabled
    """
    behavior = get_scaffolding_behavior(context_pack)
    return behavior.get('useSocraticMode', False)


def get_quick_replies(context_pack: Dict) -> list:
    """
    Get scaffolding-suggested quick replies.
    
    Args:
        context_pack: Context pack from ContextPackBuilder
    
    Returns:
        List of quick reply suggestions (may be empty)
    """
    behavior = get_scaffolding_behavior(context_pack)
    return behavior.get('quickReplies', [])
