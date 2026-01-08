from typing import List, Dict, Any, Optional
import logging

from .schemas import InteractionContext, EducatorResponse, ContentPedagogicalData
from .guardrails import PolicyGuardrails

logger = logging.getLogger(__name__)

class EducatorService:
    """
    Core service for the 'Educator' agent.
    Orchestrates the pedagogical response based on user interaction and context.
    """

    def __init__(self):
        # Initialize guardrails (domain service)
        self.guardrails = PolicyGuardrails()
        # We might inject repositories here for context loading

    async def process_interaction(self, context: InteractionContext) -> EducatorResponse:
        """
        Main entry point for processing a user interaction.
        """
        logger.info(f"Processing interaction: {context.interaction_type} for user {context.user_id}")

        # === GUARDRAILS CHECK (Script 06) ===
        # Extract policy and user message from context
        policy_dict = context.data.get("decision_policy", {})
        user_message = context.data.get('message', '') or context.data.get('text', '')
        
        # Check policy guardrails before processing
        refusal = self.guardrails.check_guardrails(
            user_message=user_message,
            policy_dict=policy_dict,
            context_data=context.data
        )
        
        if refusal:
            # Guardrail triggered - log event and return refusal
            if refusal.get('payload', {}).get('event'):
                event = refusal['payload']['event']
                logger.info(f"Guardrail triggered: {event['payloadJson']['reason']}")
                # TODO: Emit event to telemetry system
            
            return EducatorResponse(
                response_type=refusal['response_type'],
                content=refusal['content'],
                payload=refusal.get('payload')
            )
        
        # === CONTINUE WITH NORMAL PROCESSING ===
        
        # === CONTENT MODE INSTRUCTIONS (Script 02) ===
        # Extract content mode and get corresponding instructions
        from educator.prompts.mode_prompts import get_mode_instructions
        
        content_mode = context.data.get('content_mode', 'TECHNICAL')
        mode_instructions = get_mode_instructions(content_mode)
        
        # Inject mode instructions into context for use by handlers
        context.data['mode_instructions'] = mode_instructions
        logger.info(f"Content mode: {content_mode}")
        
        # 1. Load Pedagogical Context (TODO: Integrate with ContentPedagogicalData)
        pedagogical_data = await self._load_pedagogical_context(context.content_id)
        
        # 2. Determine Strategy based on context and interaction
        # For MVP, we will mostly return basic chat responses or confirmations
        
        if context.interaction_type == 'question':
            return await self._handle_question(context, pedagogical_data)
        elif context.interaction_type == 'chat':
             return await self._handle_chat(context, pedagogical_data)
        elif context.interaction_type == 'game_result':
             return await self._handle_game_result(context)
        
        # Default fallback
        return EducatorResponse(
            response_type='text',
            content="Recebi sua interação. (Educator v1)"
        )

    async def _load_pedagogical_context(self, content_id: str) -> ContentPedagogicalData:
        """
        Fetches the pre-computed pedagogical data for the content.
        """
        # Placeholder for DB fetch using existing logic
        # For now returns mock data matching the schema
        return ContentPedagogicalData(
            content_id=content_id,
            summary="This is a mock summary of the content.",
            key_concepts=[
                {"term": "Mock Concept", "definition": "A fake concept for testing", "related_concepts": []}
            ]
        )

    async def _handle_question(self, context: InteractionContext, ped_data: ContentPedagogicalData) -> EducatorResponse:
        """
        Logic for handling specific questions.
        """
        question_text = context.data.get('text', '')
        
        # Here we would call the LLM chain with:
        # - Pedagogical Context (Summary, Concepts)
        # - The Question
        # - Reading Context (Selection)
        
        return EducatorResponse(
            response_type='text',
            content=f"Analisando sua dúvida: '{question_text}'... (Simulação de resposta)"
        )

    async def _handle_chat(self, context: InteractionContext, ped_data: ContentPedagogicalData) -> EducatorResponse:
        """
        General chat logic.
        """
        message = context.data.get('message', '')
        selection = context.data.get('selection', '') # Context from UI
        
        response_text = f"Entendi. Você perguntou sobre '{message}'."
        if selection:
             response_text += f"\nContexto selecionado: '{selection[:50]}...'"
             
        return EducatorResponse(
            response_type='text',
            content=response_text
        )

    async def _handle_game_result(self, context: InteractionContext) -> EducatorResponse:
        """
        Process game results to update user knowledge state.
        """
        result_data = context.data.get('result', {})
        score = result_data.get('score', 0)
        max_score = result_data.get('max_score', 100)
        
        # Logic to update student profile would go here (e.g., KnowledgeTracer)
        
        return EducatorResponse(
            response_type='confirmation',
            content=f"Resultado processado. Score: {score}/{max_score}. Nível de dificuldade ajustado.",
            payload={"new_mastery_level": "intermediate"} # Mock payload
        )
