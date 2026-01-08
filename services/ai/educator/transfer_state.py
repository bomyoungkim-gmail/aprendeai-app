"""
Transfer Graph State - Specialized state for transfer learning tasks.

This state extends EducatorState to support just-in-time pedagogical interventions
triggered by the DecisionService (Control Plane).
"""

from typing import TypedDict, Optional, Dict, List, Literal


# Transfer Intent Types (all specialized nodes)
TransferIntent = Literal[
    "HUGGING",           # Generality prompts
    "BRIDGING",          # Lateral connections
    "ANALOGY",           # Structural analogies
    "TIER2",             # Vocabulary expansion
    "MORPHOLOGY",        # Word structure analysis
    "ICEBERG",           # Deep structure analysis
    "CONNECTION_CIRCLE", # Relationship mapping
    "PKM",               # Atomic note generation
    "MISSION_FEEDBACK",  # Rich feedback on attempts
    "METACOGNITION",      # Self-regulation prompts
    "SENTENCE_ANALYSIS",  # Tool: Sentence Analysis (New)
    "HIGH_ROAD"          # Transfer missions
]


class TransferState(TypedDict):
    """
    State for Transfer Graph (Just-in-Time interventions).
    
    This is a specialized state that can be used standalone or merged with EducatorState
    depending on the entry point.
    """
    
    # === INPUT (from DecisionService via NestJS) ===
    intent: TransferIntent
    user_id: str
    session_id: str
    content_id: str
    
    # === CONTEXT DATA ===
    transfer_metadata: Optional[Dict]  # section_transfer_metadata from DB
    mission_data: Optional[Dict]       # Rubric, template, user attempt
    user_profile: Optional[Dict]       # Schooling level, language proficiency
    
    # === PROCESSING ===
    current_node: Optional[str]        # Current node being executed
    scaffolding_level: Optional[int]   # 0-3: Expert to Novice (AGENT SCRIPT C)
    max_tokens: Optional[int]          # Dynamic token limit based on level (AGENT SCRIPT C)
    style_instructions: Optional[str]  # Fading instructions for LLM (AGENT SCRIPT C)
    
    # === OUTPUT ===
    response_text: str                 # Generated response/feedback
    structured_output: Optional[Dict]  # Structured data (e.g., PKM draft, rubric scores)
    events_to_write: List[Dict]        # Events for telemetry
    
    # === TELEMETRY ===
    tokens_used: Optional[int]
    model_used: Optional[str]
