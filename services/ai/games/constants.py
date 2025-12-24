"""
Game Constants and Enums

Central source of truth for game IDs and constants.
"""
from enum import Enum


class GameMode(str, Enum):
    """
    All available game modes IDs.
    Matches the Implementation Plan 15 Games.
    """
    
    # Phase 1: Foundation (Recall & Vocabulary)
    FREE_RECALL_SCORE = "FREE_RECALL_SCORE"
    CLOZE_SPRINT = "CLOZE_SPRINT"
    SRS_ARENA = "SRS_ARENA"
    
    # Phase 2: Conceptual Understanding
    CONCEPT_LINKING = "CONCEPT_LINKING"
    ANALOGY_MAKER = "ANALOGY_MAKER"
    FEYNMAN_TEACHER = "FEYNMAN_TEACHER"
    
    # Phase 3: Application & Synthesis
    SITUATION_SIM = "SITUATION_SIM"
    WHAT_IF_SCENARIO = "WHAT_IF_SCENARIO"
    PROBLEM_SOLVER = "PROBLEM_SOLVER"
    
    # Phase 4: Creative & Complex
    SOCRATIC_DEFENSE = "SOCRATIC_DEFENSE"
    DEBATE_MASTER = "DEBATE_MASTER"
    BOSS_FIGHT_VOCAB = "BOSS_FIGHT_VOCAB"
    
    # Phase 5: Specialized
    TOOL_WORD_HUNT = "TOOL_WORD_HUNT"
    MISCONCEPTION_HUNT = "MISCONCEPTION_HUNT"
    RECOMMENDATION_ENGINE = "RECOMMENDATION_ENGINE"


class GameIntent(str, Enum):
    """Game pedagogical intent"""
    RECALL = "recall"
    UNDERSTANDING = "understanding"
    APPLICATION = "application"
    ANALYSIS = "analysis"
    CREATION = "creation"


class GameDifficulty(int, Enum):
    """Game difficulty levels"""
    EASY = 1
    MEDIUM = 2
    HARD = 3
