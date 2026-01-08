"""
Unit tests for DecisionPolicyV1 (Pydantic)

Tests parse_decision_policy and merge_policies functions.
"""

import pytest
from educator.policies.decision_policy import (
    DecisionPolicyV1,
    parse_decision_policy,
    merge_policies,
)


class TestParseDecisionPolicy:
    def test_returns_full_defaults_for_none(self):
        """Should return full defaults when raw is None"""
        policy = parse_decision_policy(None)

        assert policy.version == 1
        assert policy.features.transferGraphEnabled is True
        assert policy.extraction.allowTextExtraction is False
        assert policy.scaffolding.thresholds.masteryHigh == 0.8
        assert policy.budgeting.strategy == "DETERMINISTIC_FIRST"
        assert policy.limits.maxSelectedTextChars == 900

    def test_returns_full_defaults_for_empty_dict(self):
        """Should return full defaults when raw is empty dict"""
        policy = parse_decision_policy({})

        assert policy.version == 1
        assert policy.features.pkmEnabled is True
        assert policy.limits.maxQuickReplies == 4

    def test_parses_partial_override(self):
        """Should parse partial override and fill missing fields with defaults"""
        raw = {
            "features": {
                "transferGraphEnabled": False,
            }
        }

        policy = parse_decision_policy(raw)

        assert policy.features.transferGraphEnabled is False
        assert policy.features.sentenceAnalysisEnabled is True  # default
        assert policy.extraction.allowTextExtraction is False  # default

    def test_fallback_to_defaults_on_invalid_schema(self):
        """Should fallback to defaults on invalid schema"""
        raw = {
            "features": {
                "transferGraphEnabled": "invalid",  # should be boolean
            }
        }

        policy = parse_decision_policy(raw)

        # Should use defaults
        assert policy.features.transferGraphEnabled is True

    def test_ignores_unknown_keys(self):
        """Should ignore unknown keys"""
        raw = {
            "unknownKey": "value",
            "features": {
                "transferGraphEnabled": False,
            },
        }

        policy = parse_decision_policy(raw)

        assert policy.features.transferGraphEnabled is False
        assert not hasattr(policy, "unknownKey")


class TestMergePolicies:
    def test_merges_global_institution_family_hierarchy(self):
        """Should merge GLOBAL < INSTITUTION < FAMILY hierarchy"""
        global_policy = parse_decision_policy({})

        institution_policy = parse_decision_policy(
            {
                "features": {
                    "transferGraphEnabled": False,
                },
                "limits": {
                    "maxSelectedTextChars": 1200,
                },
            }
        )

        family_policy = parse_decision_policy(
            {
                "limits": {
                    "maxSelectedTextChars": 500,
                }
            }
        )

        merged = merge_policies(global_policy, institution_policy, family_policy)

        # FAMILY overrides INSTITUTION
        assert merged.limits.maxSelectedTextChars == 500
        # INSTITUTION overrides GLOBAL
        assert merged.features.transferGraphEnabled is False
        # GLOBAL defaults preserved
        assert merged.features.sentenceAnalysisEnabled is True
        assert merged.scaffolding.thresholds.masteryHigh == 0.8

    def test_deep_merges_nested_objects(self):
        """Should deep merge nested objects"""
        global_policy = parse_decision_policy({})

        family_policy = parse_decision_policy(
            {
                "scaffolding": {
                    "thresholds": {
                        "masteryHigh": 0.9,
                    }
                }
            }
        )

        merged = merge_policies(global_policy, family_policy)

        # FAMILY overrides masteryHigh
        assert merged.scaffolding.thresholds.masteryHigh == 0.9
        # Other thresholds from GLOBAL
        assert merged.scaffolding.thresholds.masteryLow == 0.5
        assert merged.scaffolding.thresholds.consistencyHigh == 3

    def test_handles_single_policy(self):
        """Should handle single policy (no merge needed)"""
        global_policy = parse_decision_policy({})

        merged = merge_policies(global_policy)

        assert merged.model_dump() == global_policy.model_dump()

    def test_revalidates_after_merge(self):
        """Should re-validate after merge"""
        global_policy = parse_decision_policy({})

        institution_policy = parse_decision_policy(
            {
                "limits": {
                    "maxSelectedTextChars": 1200,
                    "maxChatMessageChars": 3000,
                }
            }
        )

        merged = merge_policies(global_policy, institution_policy)

        # Ensure all fields are present and valid
        assert merged.version == 1
        assert merged.limits.maxSelectedTextChars == 1200
        assert merged.limits.maxChatMessageChars == 3000
        assert merged.limits.maxQuickReplies == 4  # from global
