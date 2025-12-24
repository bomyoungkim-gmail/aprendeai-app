from fastapi import APIRouter, Depends
from typing import Dict, Any
from utils.ab_manager import ab_test_manager

router = APIRouter(prefix="/experiments", tags=["experiments"])

@router.get("/")
async def get_experiments_status() -> Dict[str, Any]:
    """Get status of current A/B experiments"""
    return {
        "status": "active",
        "experiments": {
            "game_eval_tool_word_hunt": {
                "name": "LLM vs Heuristic Evaluation",
                "split_ratio": 0.5,
                "active": True,
                "variants": ["A_VARIANT_HEURISTIC", "B_VARIANT_LLM"],
                # In a real app, we'd fetch these counts from Redis/DB
                "stats_mock": {
                    "total_participants": 1240,
                    "variant_a": 615,
                    "variant_b": 625,
                    "conversion_rate_a": 0.32,
                    "conversion_rate_b": 0.45 
                }
            },
            "roleplay_persona_test": {
                "name": "Persona Consistency Check",
                "split_ratio": 0.1,
                "active": True,
                "variants": ["CONTROL", "EXPERIMENTAL_GEMINI"],
                "stats_mock": {
                    "total_participants": 150,
                    "variant_a": 135,
                    "variant_b": 15,
                    "avg_score_a": 75,
                    "avg_score_b": 82
                }
            }
        }
    }
