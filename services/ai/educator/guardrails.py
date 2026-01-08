"""
Policy Guardrails - Domain Service

Enforces policy-based guardrails for the Educator agent per Script 06.

Rules:
1. Educator CANNOT:
   - Generate full document summary without user-provided text
   - Perform OCR without explicit consent (default: disabled)

2. Educator CAN:
   - Explain/summarize selected text (context.selection)
   - Create incremental summaries from multiple selections
   - Use annotations (MAIN_IDEA/DOUBT) from backend

3. "Summarize All" → Guided plan response
4. Log all refusals as PROMPT_RECEIVED(kind="GUARDRAIL_LIMIT")

This is a pure domain service with no framework dependencies.
"""

from typing import Optional
import logging
import re

logger = logging.getLogger(__name__)


class PolicyGuardrails:
    """
    Domain service for enforcing policy-based guardrails.
    
    This class is pure business logic with no framework dependencies,
    following clean architecture principles.
    """
    
    # Patterns for detecting "summarize all" intent
    SUMMARIZE_ALL_PATTERNS = [
        r"resuma?\s+(tudo|o\s+documento|o\s+texto\s+todo|completo)",
        r"resumo\s+(do\s+documento|completo|geral)",
        r"fazer\s+um\s+resumo\s+de\s+tudo",
        r"quero\s+um\s+resumo\s+do\s+texto\s+inteiro",
        r"me\s+d[eê]\s+um\s+resumo\s+de\s+tudo"
    ]
    
    # OCR detection patterns
    OCR_PATTERNS = [
        r"\bocr\b",
        r"ler\s+(a\s+)?imagem",
        r"extrair\s+texto\s+da\s+imagem",
        r"texto\s+da\s+foto"
    ]
    
    def check_guardrails(
        self,
        user_message: str,
        policy_dict: dict,
        context_data: dict
    ) -> Optional[dict]:
        """
        Check all policy guardrails before processing interaction.
        
        Args:
            user_message: User's message text
            policy_dict: Decision policy dictionary
            context_data: Context data (selection, has_image, full_text, etc.)
        
        Returns:
            dict with refusal response if guardrail triggers, None if all checks pass
            
        Response dict structure:
            {
                'response_type': 'text',
                'content': '<refusal message>',
                'payload': {
                    'guardrail_triggered': True,
                    'reason': '<reason code>',
                    'event': {
                        'eventType': 'PROMPT_RECEIVED',
                        'payloadJson': {
                            'kind': 'GUARDRAIL_LIMIT',
                            'reason': '<reason code>'
                        }
                    }
                }
            }
        """
        
        # Parse policy (with defaults)
        from educator.policies.decision_policy import parse_decision_policy
        policy = parse_decision_policy(policy_dict)
        
        # 1. OCR Check
        ocr_refusal = self._check_ocr(user_message, context_data, policy)
        if ocr_refusal:
            return ocr_refusal
        
        # 2. Full Text Extraction / "Summarize All" Check
        summary_refusal = self._check_full_summary(user_message, context_data, policy)
        if summary_refusal:
            return summary_refusal
        
        return None  # All checks passed
    
    def _check_ocr(
        self,
        user_message: str,
        context_data: dict,
        policy
    ) -> Optional[dict]:
        """Check if OCR is requested but disabled by policy."""
        
        has_image = context_data.get('has_image', False)
        message_lower = user_message.lower()
        
        # Detect OCR intent
        is_ocr_request = any(
            re.search(pattern, message_lower, re.IGNORECASE)
            for pattern in self.OCR_PATTERNS
        )
        
        # Additional heuristic: if has_image and user says "ler"
        if has_image and 'ler' in message_lower:
            is_ocr_request = True
        
        if is_ocr_request and not policy.extraction.allowOcr:
            logger.info("OCR request blocked by policy (allowOcr=False)")
            return {
                'response_type': 'text',
                'content': "⚠️ A extração de texto de imagens (OCR) está desabilitada no momento.",
                'payload': {
                    'guardrail_triggered': True,
                    'reason': 'OCR_DISABLED',
                    'event': {
                        'eventType': 'PROMPT_RECEIVED',
                        'payloadJson': {
                            'kind': 'GUARDRAIL_LIMIT',
                            'reason': 'OCR_DISABLED'
                        }
                    }
                }
            }
        
        return None
    
    def _check_full_summary(
        self,
        user_message: str,
        context_data: dict,
        policy
    ) -> Optional[dict]:
        """
        Check if user is requesting full document summary.
        
        Logic:
        - Detect "summarize all" intent
        - If allowTextExtraction is FALSE (default):
          - Respond with guided plan (select sections → consolidate)
        - If allowTextExtraction is TRUE:
          - Pass through (allow, but verify full text is available)
        """
        
        message_lower = user_message.lower()
        selection = context_data.get('selection', '').strip()
        
        # Detect "summarize all" intent
        is_summarize_all = any(
            re.search(pattern, message_lower, re.IGNORECASE)
            for pattern in self.SUMMARIZE_ALL_PATTERNS
        )
        
        if not is_summarize_all:
            return None  # Not a "summarize all" request
        
        # User wants full summary
        if not policy.extraction.allowTextExtraction:
            # RULE: Cannot summarize without extraction permission
            logger.info("Full summary request blocked by policy (allowTextExtraction=False)")
            return self._create_guided_plan_response()
        
        # Policy allows extraction, but verify we have the text
        # (Safety check - if full text not provided, still guide user)
        full_text_available = (
            context_data.get('full_text') or 
            context_data.get('document_text')
        )
        
        if not full_text_available and not selection:
            # Even with permission, we don't have the text
            logger.info("Full summary requested but no text available (safety fallback)")
            return self._create_guided_plan_response()
        
        return None  # Pass through - policy allows and text is available
    
    def _create_guided_plan_response(self) -> dict:
        """
        Create the standard "guided plan" response for "summarize all" requests.
        
        Per Script 06:
        a) "Selecione trechos por seção" (✨)
        b) "eu vou consolidando e criando o resumo final"
        """
        
        response_text = """📚 **Para criar um resumo completo:**

a) **Selecione trechos por seção** usando o botão ✨ (ou copie e cole aqui)
b) **Eu vou consolidando** as ideias principais e criando o resumo final

💡 *Dica: Você pode enviar várias seleções ao longo da leitura, e eu mantenho o contexto para criar um resumo incremental.*"""
        
        return {
            'response_type': 'text',
            'content': response_text,
            'payload': {
                'guardrail_triggered': True,
                'reason': 'NO_FULL_TEXT',
                'guided_workflow': True,
                'event': {
                    'eventType': 'PROMPT_RECEIVED',
                    'payloadJson': {
                        'kind': 'GUARDRAIL_LIMIT',
                        'reason': 'NO_FULL_TEXT'
                    }
                }
            }
        }
