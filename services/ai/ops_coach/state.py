"""
OpsCoach State Definition
Parallel to EducatorState but for operational coaching (dashboard flow)
"""

from typing import TypedDict, List, Dict, Any, Optional


class OpsCoachState(TypedDict):
    """
    State for OpsCoach agent - handles operational algorithm
    (meta → plan → execute → telemetry → audit → recovery)
    
    Much lighter context than Educator (no text retrieval!)
    """
    # Input (from NestJS)
    learner_id: str
    prompt_text: str
    ui_mode: str  # "PLAN" | "EXECUTE" | "AUDIT"
    
    # Processing
    ops_context: Dict[str, Any]  # Compact: profile + weekly_plan + time_summary
    current_phase: str  # BOOT | PLAN | EXECUTE | LOG | CLOSE | AUDIT | RECOVERY
    
    # Output (to NestJS) - REUSE existing DTOs!
    next_prompt: str
    quick_replies: List[str]
    events_to_write: List[Dict[str, Any]]
    hil_request: Optional[Dict[str, Any]]  # Human-in-loop request
