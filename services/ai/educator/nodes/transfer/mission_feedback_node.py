"""
Mission Feedback Node - Provides rich, rubric-based feedback on transfer attempts.

This is the core node for grading user submissions against mission rubrics.
"""

from educator.transfer_state import TransferState
from educator.policies.decision_policy import parse_decision_policy
from llm_factory import llm_factory
from langchain.prompts import ChatPromptTemplate
import logging
import json

logger = logging.getLogger(__name__)


def handle(state: TransferState) -> TransferState:
    """
    Generate rubric-based feedback for a mission attempt.
    
    Args:
        state: Must contain mission_data with rubric and user_attempt
        
    Returns:
        Updated state with feedback and structured scores
    """
    logger.info("Mission Feedback node executing")
    
    # Check decision_policy gate
    policy_dict = state.get("decision_policy", {})
    policy = parse_decision_policy(policy_dict)
    
    if not policy.features.missionFeedbackEnabled:
        logger.info("Mission feedback disabled by decision_policy")
        return {
            **state,
            "response_text": "⚠️ Feedback de missões está desabilitado no momento.",
            "current_node": "mission_feedback",
        }
    
    mission_data = state.get('mission_data', {})
    
    if not mission_data:
        logger.warning("No mission_data provided")
        return {
            **state,
            "response_text": "Erro: Dados da missão não encontrados.",
            "current_node": "mission_feedback"
        }
    
    rubric = mission_data.get('rubric', {})
    user_attempt = mission_data.get('user_attempt', '')
    mission_type = mission_data.get('mission_type', 'GENERIC')
    template = mission_data.get('template', '')
    
    # Build feedback prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert educator providing constructive feedback on transfer learning tasks.

Your feedback should:
- Be specific and actionable
- Highlight strengths before weaknesses
- Reference the rubric criteria explicitly
- Encourage growth mindset
- Be warm and supportive"""),
        ("user", """Mission Type: {mission_type}
Template/Prompt: {template}

Rubric Criteria:
{rubric}

Student Response:
{user_attempt}

Provide:
1. Overall assessment (what they did well)
2. Specific feedback per rubric criterion
3. Concrete suggestions for improvement
4. Numerical scores (0-100) for each criterion

Format your response as:
## Strengths
[What they did well]

## Feedback by Criterion
[Criterion 1]: [Score]/100 - [Feedback]
[Criterion 2]: [Score]/100 - [Feedback]

## Suggestions
[Actionable next steps]""")
    ])
    
    # Get LLM (SMART tier for quality feedback)
    llm = llm_factory.get_llm(tier="SMART")
    
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "mission_type": mission_type,
            "template": template,
            "rubric": json.dumps(rubric, indent=2),
            "user_attempt": user_attempt
        })
        
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # TODO: Parse scores from response for structured_output
        # For now, return raw feedback
        
        logger.info(f"Feedback generated for mission type: {mission_type}")
        
        return {
            **state,
            "response_text": response_text,
            "current_node": "mission_feedback",
            "structured_output": {
                "mission_type": mission_type,
                "feedback_generated": True
            },
            "events_to_write": [
                {
                    "type": "MISSION_FEEDBACK_GENERATED",
                    "mission_type": mission_type,
                    "user_id": state['user_id']
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Feedback generation failed: {e}")
        return {
            **state,
            "response_text": "Desculpe, não consegui gerar feedback no momento. Tente novamente.",
            "current_node": "mission_feedback"
        }
