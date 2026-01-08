"""
DecisionPolicyV1 Schema (Pydantic)

Canonical schema for decision_policy_json used by institution_policies and family_policies.
Defines feature gates, extraction policies, scaffolding thresholds, budgeting, and limits.

Hierarchy: GLOBAL (hardcoded defaults) < INSTITUTION < FAMILY

This schema MUST match the TypeScript Zod schema exactly (decision-policy.schema.ts).
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
import logging

logger = logging.getLogger(__name__)


class Features(BaseModel):
    transferGraphEnabled: bool = True
    sentenceAnalysisEnabled: bool = True
    pkmEnabled: bool = True
    gamesEnabled: bool = True
    missionFeedbackEnabled: bool = True
    huggingEnabled: bool = True


class Extraction(BaseModel):
    # TODO: only allowTextExtraction remains schema-only, as extraction logic is not yet centralized in Educator
    allowTextExtraction: bool = False
    allowOcr: bool = False
    selectionRequiredForPdfImage: bool = True


class DefaultLevelByMode(BaseModel):
    DIDACTIC: int = Field(default=2, ge=0, le=3)
    TECHNICAL: int = Field(default=1, ge=0, le=3)
    NARRATIVE: int = Field(default=1, ge=0, le=3)
    NEWS: int = Field(default=1, ge=0, le=3)
    SCIENTIFIC: int = Field(default=1, ge=0, le=3)
    LANGUAGE: int = Field(default=2, ge=0, le=3)


class Thresholds(BaseModel):
    masteryHigh: float = Field(default=0.8, ge=0.0, le=1.0)
    masteryLow: float = Field(default=0.5, ge=0.0, le=1.0)
    consistencyHigh: int = Field(default=3, ge=1, le=10)
    cooldownMinTurns: int = Field(default=2, ge=0, le=20)


class Scaffolding(BaseModel):
    fadingEnabled: bool = True
    defaultLevelByMode: DefaultLevelByMode = Field(default_factory=DefaultLevelByMode)
    thresholds: Thresholds = Field(default_factory=Thresholds)


class MonthlyTokenBudgetByScope(BaseModel):
    INSTITUTION: Optional[int] = None
    FAMILY: Optional[int] = None
    USER: Optional[int] = None


class Budgeting(BaseModel):
    strategy: Literal["DETERMINISTIC_FIRST", "FAST_FIRST"] = "DETERMINISTIC_FIRST"
    allowSmartTier: bool = False
    monthlyTokenBudgetByScope: MonthlyTokenBudgetByScope = Field(
        default_factory=MonthlyTokenBudgetByScope
    )


class Limits(BaseModel):
    maxSelectedTextChars: int = Field(default=900, ge=200, le=5000)
    maxChatMessageChars: int = Field(default=2000, ge=200, le=20000)
    maxQuickReplies: int = Field(default=4, ge=0, le=10)
    maxEventsToWritePerTurn: int = Field(default=25, ge=5, le=200)


class DecisionPolicyV1(BaseModel):
    version: Literal[1] = 1
    features: Features = Field(default_factory=Features)
    extraction: Extraction = Field(default_factory=Extraction)
    scaffolding: Scaffolding = Field(default_factory=Scaffolding)
    budgeting: Budgeting = Field(default_factory=Budgeting)
    limits: Limits = Field(default_factory=Limits)


def parse_decision_policy(raw: dict | None) -> DecisionPolicyV1:
    """
    Parse and validate decision_policy_json with fallback to defaults.
    
    Args:
        raw: Raw JSON object from database
        
    Returns:
        Validated DecisionPolicyV1 with all defaults applied
    """
    try:
        return DecisionPolicyV1.model_validate(raw or {})
    except Exception as e:
        logger.warning(f"Invalid decision_policy, using defaults: {e}")
        return DecisionPolicyV1()


def merge_policies(*policies: DecisionPolicyV1) -> DecisionPolicyV1:
    """
    Merge decision policies from multiple scopes.
    
    Hierarchy: GLOBAL < INSTITUTION < FAMILY
    Later policies override earlier ones (deep merge).
    
    Args:
        policies: Policies to merge, in order of precedence (lowest to highest)
        
    Returns:
        Merged and re-validated DecisionPolicyV1
    """
    if not policies:
        return DecisionPolicyV1()
    
    base = policies[0].model_dump()
    for p in policies[1:]:
        incoming = p.model_dump(exclude_unset=True)
        base = _deep_merge(base, incoming)
    return DecisionPolicyV1.model_validate(base)


def _deep_merge(a: dict, b: dict) -> dict:
    """Deep merge two dictionaries (b overrides a)."""
    out = dict(a)
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out
