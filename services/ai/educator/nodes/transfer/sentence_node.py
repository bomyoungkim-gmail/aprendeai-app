"""
Sentence Analysis Node - Analyzes syntactic structure of user sentences.
Part of Transfer Graph.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import SENTENCE_PROMPT, SENTENCE_REPAIR_PROMPT
from educator.policies.decision_policy import parse_decision_policy
from llm_factory import llm_factory
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Optional
import logging
import json

logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class SubClause(BaseModel):
    text: str
    function: str
    connector: str = ""

class RewriteLayered(BaseModel):
    L1: str = ""
    L2: str = ""
    L3: str = ""

class SentenceAnalysisOutput(BaseModel):
    main_clause: str
    main_idea: str
    subordinate_clauses: List[SubClause] = Field(default_factory=list)
    connectors: List[str] = Field(default_factory=list)
    simplification: str
    rewrite_layered: RewriteLayered = Field(default_factory=RewriteLayered)
    confidence: float = 0.5


def handle(state: TransferState) -> TransferState:
    """Analyze sentence structure."""
    logger.info("Sentence Analysis node executing")
    
    # Check decision_policy gate
    policy_dict = state.get("decision_policy", {})
    policy = parse_decision_policy(policy_dict)
    
    if not policy.features.sentenceAnalysisEnabled:
        logger.info("Sentence analysis disabled by decision_policy")
        return {
            **state,
            "response_text": "⚠️ A análise de sentenças está desabilitada no momento.",
            "current_node": "sentence_analysis",
        }
    
    md = state.get("transfer_metadata", {})
    # Use selected_text or fallback concept
    sentence = (md.get("selected_text") or md.get("concept") or "").strip()
    
    if not sentence or len(sentence) < 5:
        return {
            **state,
            "response_text": "⚠️ Para analisar a sintaxe, por favor **selecione um trecho** no texto (botão ✨) ou cole a frase aqui.",
            "current_node": "sentence_analysis",
        }

    # Configuration
    scaffolding_level = int(state.get("scaffolding_level", 2)) # Default to apprentice
    mode = md.get("mode", "DIDACTIC")
    language_code = md.get("language_code", "pt-BR")
    max_tokens = int(state.get("max_tokens", 500))
    
    # Combined Style Instructions (Global + Local)
    global_style = state.get('style_instructions', '')
    local_style = "Focus on syntactic clarity. Identify the subject-verb core."
    if scaffolding_level >= 2:
        local_style += " Explain the function of support clauses."
    final_style = f"{global_style}\n\n{local_style}"

    # Execution
    llm = llm_factory.get_llm(tier="FAST")
    chain = SENTENCE_PROMPT | llm
    
    try:
        raw_response = chain.invoke({
            "sentence": sentence,
            "mode": mode,
            "scaffolding_level": scaffolding_level,
            "language_code": language_code,
            "style_instructions": final_style,
            "max_tokens": max_tokens
        })
        raw_content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
        
        # Validating & Repairing
        data = None
        try:
            # Try direct parse
            # We assume LLM strictly followed JSON output. 
            # Often it wraps in ```json ... ``` so we clean it.
            cleaned = raw_content.replace("```json", "").replace("```", "").strip()
            data = SentenceAnalysisOutput.parse_raw(cleaned)
        except Exception as e:
            logger.warning(f"Initial parse failed, attempting repair: {e}")
            # Repair loop
            repair_chain = SENTENCE_REPAIR_PROMPT | llm
            repair_response = repair_chain.invoke({
                "bad_json": raw_content,
                "sentence": sentence,
                "schema": SentenceAnalysisOutput.schema_json()
            })
            cleaned_repair = repair_response.content.replace("```json", "").replace("```", "").strip()
            try:
                data = SentenceAnalysisOutput.parse_raw(cleaned_repair)
            except Exception:
                # Ultimate Fallback
                data = SentenceAnalysisOutput(
                    main_clause=sentence,
                    main_idea="Não consegui analisar com precisão.",
                    simplification=sentence,
                    confidence=0.1
                )

        # Formatting Response (Markdown)
        clauses_md = ""
        if data.subordinate_clauses:
            clauses_md = "\n".join([f"- **{c.function}** ({c.connector}): _{c.text}_" for c in data.subordinate_clauses])
        else:
            clauses_md = "_Nenhuma oração subordinada relevante identificada._"

        practice_q = ""
        if scaffolding_level >= 2:
            practice_q = "\n\n🧠 **Checagem:** Qual parte da frase contém a informação mais importante?"

        response_text = (
            f"🧩 **Análise de Sentença**\n\n"
            f"**Núcleo (Oração Principal):**\n> {data.main_clause}\n\n"
            f"**Ideia Central:** {data.main_idea}\n\n"
            f"**Estrutura de Apoio:**\n{clauses_md}\n\n"
            f"**Reescrita Simples:**\n{data.simplification}"
            f"{practice_q}"
        )

        # Quick Replies
        quick_replies = []
        if scaffolding_level <= 1:
             # Advanced users
            quick_replies = ["Resumir mais", "Ver conectivos"]
        else:
             # Novice users
            quick_replies = ["Explique o núcleo", "Simplificar mais"]

        # Telemetry events
        events_to_write = state.get("events_to_write", [])
        events_to_write.append({
            "eventType": "PROMPT_RECEIVED",
            "payloadJson": {
                "kind": "SENTENCE_ANALYSIS_COMPLETED",
                "confidence": data.confidence,
                "clauses_count": len(data.subordinate_clauses)
            }
        })

        return {
            **state,
            "response_text": response_text,
            "structured_output": data.dict(),
            "quick_replies": quick_replies,
            "events_to_write": events_to_write,
            "current_node": "sentence_analysis"
        }

    except Exception as e:
        logger.error(f"Sentence analysis failed: {e}", exc_info=True)
        return {
            **state,
            "response_text": "Desculpe, tive dificuldade técnica para analisar essa frase específica.",
            "current_node": "sentence_analysis"
        }
