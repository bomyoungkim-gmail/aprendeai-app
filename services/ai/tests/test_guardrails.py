"""
Unit tests for Policy Guardrails (Script 06)

Tests all guardrail rules:
1. OCR disabled by default
2. Full text extraction disabled by default
3. "Summarize all" triggers guided plan
4. Selection-based work always allowed
5. Proper event logging
"""

import pytest
from educator.guardrails import PolicyGuardrails


class TestPolicyGuardrails:
    """Test suite for PolicyGuardrails domain service."""
    
    def setup_method(self):
        """Initialize guardrails for each test."""
        self.guardrails = PolicyGuardrails()
    
    # === OCR Tests ===
    
    def test_ocr_disabled_blocks_request(self):
        """OCR request should be blocked when allowOcr=False (default)."""
        user_message = "Por favor, leia esta imagem"
        policy_dict = {}  # Default policy (allowOcr=False)
        context_data = {'has_image': True}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is not None, "Should return refusal"
        assert result['response_type'] == 'text'
        assert 'OCR' in result['content']
        assert result['payload']['reason'] == 'OCR_DISABLED'
        assert result['payload']['event']['payloadJson']['kind'] == 'GUARDRAIL_LIMIT'
    
    def test_ocr_enabled_allows_request(self):
        """OCR request should pass when allowOcr=True."""
        user_message = "Por favor, leia esta imagem"
        policy_dict = {'extraction': {'allowOcr': True}}
        context_data = {'has_image': True}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is None, "Should pass through (no refusal)"
    
    def test_ocr_pattern_detection(self):
        """Various OCR-related phrases should be detected."""
        test_cases = [
            "fazer ocr nesta página",
            "extrair texto da imagem",
            "ler a foto",
            "texto da imagem"
        ]
        
        policy_dict = {}  # Default (OCR disabled)
        context_data = {}
        
        for message in test_cases:
            result = self.guardrails.check_guardrails(
                user_message=message,
                policy_dict=policy_dict,
                context_data=context_data
            )
            assert result is not None, f"Should block OCR request: '{message}'"
            assert result['payload']['reason'] == 'OCR_DISABLED'
    
    # === Full Text Extraction Tests ===
    
    def test_summarize_all_blocked_by_default(self):
        """'Summarize all' should be blocked when allowTextExtraction=False."""
        user_message = "Resuma tudo deste documento"
        policy_dict = {}  # Default (allowTextExtraction=False)
        context_data = {}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is not None, "Should return guided plan"
        assert result['response_type'] == 'text'
        assert 'Selecione trechos por seção' in result['content']
        assert 'consolidando' in result['content']
        assert result['payload']['reason'] == 'NO_FULL_TEXT'
        assert result['payload']['guided_workflow'] is True
        assert result['payload']['event']['payloadJson']['kind'] == 'GUARDRAIL_LIMIT'
    
    def test_summarize_all_allowed_with_text(self):
        """'Summarize all' should pass when policy allows and text is available."""
        user_message = "Resuma tudo"
        policy_dict = {'extraction': {'allowTextExtraction': True}}
        context_data = {'full_text': 'This is the full document text...'}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is None, "Should pass through when policy allows and text available"
    
    def test_summarize_all_allowed_but_no_text_safety(self):
        """'Summarize all' should trigger guided plan even if allowed but no text."""
        user_message = "Resuma tudo"
        policy_dict = {'extraction': {'allowTextExtraction': True}}
        context_data = {}  # No full_text available
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is not None, "Should return guided plan (safety fallback)"
        assert 'Selecione trechos' in result['content']
    
    def test_summarize_all_pattern_detection(self):
        """Various 'summarize all' phrases should be detected."""
        test_cases = [
            "resuma tudo",
            "resumo do documento",
            "resuma o texto todo",
            "fazer um resumo de tudo",
            "quero um resumo do texto inteiro",
            "me dê um resumo completo"
        ]
        
        policy_dict = {}  # Default (extraction disabled)
        context_data = {}
        
        for message in test_cases:
            result = self.guardrails.check_guardrails(
                user_message=message,
                policy_dict=policy_dict,
                context_data=context_data
            )
            assert result is not None, f"Should block: '{message}'"
            assert result['payload']['reason'] == 'NO_FULL_TEXT'
    
    # === Selection-Based Work (Always Allowed) ===
    
    def test_selection_based_work_always_allowed(self):
        """Explaining selected text should always pass, even with strict policy."""
        user_message = "Explique este trecho"
        policy_dict = {}  # Strict default policy
        context_data = {'selection': 'This is the selected text...'}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is None, "Selection-based work should always be allowed"
    
    def test_question_about_selection_allowed(self):
        """Questions about selection should pass."""
        user_message = "O que significa isso?"
        policy_dict = {}
        context_data = {'selection': 'Selected text', 'message': user_message}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is None, "Should pass - not a 'summarize all' request"
    
    # === Event Logging ===
    
    def test_refusal_includes_event_structure(self):
        """All refusals should include proper event structure for logging."""
        user_message = "resuma tudo"
        policy_dict = {}
        context_data = {}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert 'payload' in result
        assert 'event' in result['payload']
        event = result['payload']['event']
        assert event['eventType'] == 'PROMPT_RECEIVED'
        assert 'payloadJson' in event
        assert event['payloadJson']['kind'] == 'GUARDRAIL_LIMIT'
        assert 'reason' in event['payloadJson']
    
    # === Edge Cases ===
    
    def test_empty_message_passes(self):
        """Empty message should pass through."""
        result = self.guardrails.check_guardrails(
            user_message="",
            policy_dict={},
            context_data={}
        )
        
        assert result is None, "Empty message should pass"
    
    def test_case_insensitive_detection(self):
        """Pattern detection should be case-insensitive."""
        user_message = "RESUMA TUDO"
        policy_dict = {}
        context_data = {}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is not None, "Should detect uppercase patterns"
    
    def test_multiple_guardrails_first_wins(self):
        """If multiple guardrails trigger, first check (OCR) should win."""
        user_message = "Faça OCR e resuma tudo"
        policy_dict = {}  # Both OCR and extraction disabled
        context_data = {'has_image': True}
        
        result = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context_data
        )
        
        assert result is not None
        # OCR check comes first, so should return OCR_DISABLED
        assert result['payload']['reason'] == 'OCR_DISABLED'
