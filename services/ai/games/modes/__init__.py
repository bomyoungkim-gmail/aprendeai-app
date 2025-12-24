"""
Game Modes Package

All game mode implementations.
"""

# Phase 1: Foundation
from .free_recall import FreeRecallGame
from .cloze_sprint import CloseSprintGame
from .srs_arena import SrsArenaGame

# Phase 2: Conceptual
from .feynman_teacher import FeynmanTeacherGame
from .concept_linking import ConceptLinkingGame
from .analogy_maker import AnalogyMakerGame

# Phase 3: Application
from .situation_sim import SituationSimGame
from .problem_solver import ProblemSolverGame
from .what_if import WhatIfScenarioGame

# Phase 4: Complex
from .boss_fight import BossFightGame
from .debate_master import DebateMasterGame
from .socratic_defense import SocraticDefenseGame

# Phase 5: Specialized
from .tool_word_hunt import ToolWordHuntGame
from .misconception_hunt import MisconceptionHuntGame
from .recommendation import RecommendationGame

__all__ = [
    # Phase 1
    'FreeRecallGame',
    'CloseSprintGame',
    'SrsArenaGame',
    # Phase 2
    'FeynmanTeacherGame',
    'ConceptLinkingGame',
    'AnalogyMakerGame',
    # Phase 3
    'SituationSimGame',
    'ProblemSolverGame',
    'WhatIfScenarioGame',
    # Phase 4
    'BossFightGame',
    'DebateMasterGame',
    'SocraticDefenseGame',
    # Phase 5
    'ToolWordHuntGame',
    'MisconceptionHuntGame',
    'RecommendationGame',
]

# Game modules in this directory will be auto-discovered by the registry
# Each module should define a class implementing the GameModule protocol
