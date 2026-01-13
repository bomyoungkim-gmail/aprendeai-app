"""
Sentence Analysis Node - Analyzes syntactic structure of user sentences.
Part of Transfer Graph.
"""

from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import SENTENCE_PROMPT, SENTENCE_REPAIR_PROMPT
from llm_factory import llm_factory
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Optional, Literal
import logging
import json

logger = logging.getLogger(__name__)

# --- Pydantic Models ---

# SCRIPT 11 Legacy Models
class SubClause(BaseModel):
    text: str
    function: str
    connector: str = ""

class RewriteLayered(BaseModel):
    L1: str = ""
    L2: str = ""
    L3: str = ""

# SCRIPT 04 New Models
class ClauseDetail(BaseModel):
    """SCRIPT 04: Detailed clause structure with dependency tree"""
    id: str = Field(description="Unique clause identifier")
    text: str = Field(description="Clause text")
    type: Literal["MAIN", "SUBORDINATE", "COORDINATE"] = Field(description="Clause type")
    head_verb: Optional[str] = Field(default=None, description="Main verb of clause")
    connective: Optional[str] = Field(default=None, description="Connector word (e.g., 'embora')")
    parent_id: Optional[str] = Field(default=None, description="ID of parent clause (for subordinates)")

class SentenceStructure(BaseModel):
    """SCRIPT 04: Sentence-level structure"""
    original_text: str = Field(description="Original sentence text")
    clauses: List[ClauseDetail] = Field(default_factory=list, description="List of clauses in sentence")

class SentenceAnalysisOutput(BaseModel):
    """Combined output model supporting SCRIPT 04 + SCRIPT 11/05 fields"""
    
    # SCRIPT 04 Required Fields
    sentences: List[SentenceStructure] = Field(default_factory=list, description="SCRIPT 04: Sentence breakdown")
    main_proposition: str = Field(default="", description="SCRIPT 04: Core proposition")
    supporting_propositions: List[str] = Field(default_factory=list, description="SCRIPT 04: Supporting ideas")
    summary_1line: str = Field(default="", description="SCRIPT 04: One-line summary")
    rewrite_suggestions: List[str] = Field(default_factory=list, description="SCRIPT 04: Alternative phrasings")
    
    # SCRIPT 11 Legacy Fields (backward compatibility)
    main_clause: str = Field(default="", description="SCRIPT 11: Main clause text")
    main_idea: str = Field(default="", description="SCRIPT 11: Main idea paraphrase")
    subordinate_clauses: List[SubClause] = Field(default_factory=list, description="SCRIPT 11: Subordinate clauses")
    connectors: List[str] = Field(default_factory=list, description="SCRIPT 11: Connector words")
    simplification: str = Field(default="", description="SCRIPT 11: Simplified rewrite")
    rewrite_layered: RewriteLayered = Field(default_factory=RewriteLayered, description="SCRIPT 11: Layered rewrites")
    
    # SCRIPT 05 Fields
    quick_replies: List[str] = Field(default_factory=list, description="SCRIPT 05: Mode-specific next actions")
    
    # Metadata
    confidence: float = Field(default=0.5, description="Confidence score (0-1)")


# --- Portuguese Connector Map (Heuristic Fallback) ---
CONNECTOR_MAP_PT = {
    "porque": "CAUSE",
    "pois": "CAUSE",
    "já que": "CAUSE",
    "se": "CONDITION",
    "caso": "CONDITION",
    "quando": "TIME/CONDITION",
    "embora": "CONTRAST",
    "mas": "CONTRAST",
    "ainda assim": "CONTRAST",
    "para que": "PURPOSE",
    "de modo que": "CONSEQUENCE",
    "sendo que": "SPECIFICATION",
    "em especial": "SPECIFICATION",
}


# --- Helper Functions ---
def _get_language_code(state: TransferState) -> str:
    """Extract language code from state with fallback."""
    md = state.get("transfer_metadata") or {}
    return md.get("language_code") or (state.get("user_profile") or {}).get("language_code") or "pt-BR"


def _get_text_input(state: TransferState) -> tuple[str, str]:
    """
    Extract text input with priority: selected_text > typed_text.
    
    Returns:
        (text, source) where source is "CHAT_SELECTION" | "CHAT_PASTE" | "NONE"
    """
    md = state.get("transfer_metadata") or {}
    selected = (md.get("selected_text") or "").strip()
    typed = (md.get("typed_text") or "").strip()
    
    if selected:
        return selected, "CHAT_SELECTION"
    if typed:
        return typed, "CHAT_PASTE"
    return "", "NONE"


def _normalize_for_analysis(text: str, max_chars: int = 900) -> str:
    """Normalize whitespace and truncate if too long."""
    text = " ".join(text.split())
    if len(text) > max_chars:
        return text[:max_chars].rsplit(" ", 1)[0] + "…"
    return text


def _heuristic_fallback(sentence: str) -> SentenceAnalysisOutput:
    """Simple regex-based fallback when LLM fails."""
    lowered = sentence.lower()
    connectors = []
    
    for c, fn in CONNECTOR_MAP_PT.items():
        if c in lowered:
            connectors.append(c)
    
    return SentenceAnalysisOutput(
        main_clause=sentence,
        main_idea="(Análise simplificada) A frase contém uma ideia principal e detalhes introduzidos por conectivos.",
        subordinate_clauses=[SubClause(text="(detalhe não segmentado)", function="UNKNOWN", connector="")],
        connectors=connectors,
        simplification=sentence,
        confidence=0.2  # Low confidence
    )


def _format_response(data: SentenceAnalysisOutput, scaffolding_level: int) -> str:
    """Generate markdown response with scaffolding-specific practice prompts."""
    # Format subordinate clauses
    if data.subordinate_clauses:
        subs_md = "\n".join([
            f"- **{c.function}** ({c.connector}): {c.text}" if c.connector else f"- **{c.function}**: {c.text}"
            for c in data.subordinate_clauses
        ])
    else:
        subs_md = "- (nenhuma oração de apoio detectada)"
    
    # Scaffolding-specific practice prompt
    practice = ""
    if scaffolding_level >= 2:
        practice = (
            "\n\n**Checagem rápida:** copie e cole aqui só o trecho que você acha que é a *oração principal*."
        )
    elif scaffolding_level == 1:
        practice = "\n\nSe quiser, eu quebro em 2 frases simples."
    
    return (
        "🧩 **Análise de sentença**\n\n"
        f"**Núcleo (oração principal):** {data.main_clause}\n\n"
        f"**Ideia central (paráfrase):** {data.main_idea}\n\n"
        f"**Orações de apoio (detalhes):**\n{subs_md}\n\n"
        f"**Reescrita mais simples:** {data.simplification}"
        f"{practice}"
    )




def _generate_exercise_instructions(mode: str, scaffolding_level: int) -> str:
    """
    Q2 IMPLEMENTATION: Generate mode-specific exercise instructions.
    
    Args:
        mode: Content mode (DIDACTIC, TECHNICAL, NARRATIVE, NEWS)
        scaffolding_level: User's scaffolding level (1-3)
    
    Returns:
        Exercise instructions as markdown text
    """
    base_instructions = {
        "DIDACTIC": (
            "📝 **Modo Prática - Didático**\n\n"
            "Vamos praticar! Escolha um exercício:\n\n"
            "1. **Identificar a oração principal**: Copie e cole apenas a parte que contém a ideia central.\n"
            "2. **Reescrever com outro conectivo**: Troque o conectivo (ex: 'embora' → 'apesar de') mantendo o sentido.\n"
            "3. **Simplificar**: Reescreva a frase em 2 frases simples, sem conectivos complexos.\n\n"
            "💡 **Dica**: Comece pelo exercício 1 se você está começando!"
        ),
        "TECHNICAL": (
            "📝 **Modo Prática - Técnico**\n\n"
            "Exercícios de precisão sintática:\n\n"
            "1. **Mapear dependências**: Desenhe a árvore de dependências entre as cláusulas.\n"
            "2. **Classificar conectivos**: Identifique o tipo de cada conectivo (causal, condicional, concessivo, etc.).\n"
            "3. **Análise de verbos**: Liste todos os verbos e suas funções sintáticas.\n\n"
            "💡 **Dica**: Use terminologia gramatical precisa nas suas respostas."
        ),
        "NARRATIVE": (
            "📝 **Modo Prática - Narrativo**\n\n"
            "Exercícios de interpretação contextual:\n\n"
            "1. **Intenção do autor**: Explique por que o autor escolheu essa estrutura sintática.\n"
            "2. **Efeito estilístico**: Como a complexidade da frase afeta o ritmo da narrativa?\n"
            "3. **Reescrita criativa**: Reescreva mantendo o estilo, mas mudando a ênfase.\n\n"
            "💡 **Dica**: Considere o contexto literário e o tom da obra."
        ),
        "NEWS": (
            "📝 **Modo Prática - Notícias**\n\n"
            "Exercícios de análise jornalística:\n\n"
            "1. **Identificar causa/efeito**: Separe as cláusulas em causas e consequências.\n"
            "2. **Extrair fatos**: Liste apenas os fatos objetivos, removendo opiniões.\n"
            "3. **Resumo factual**: Reescreva em 1 frase com apenas informações essenciais.\n\n"
            "💡 **Dica**: Foque em quem, o quê, quando, onde, por quê."
        )
    }
    
    # Get mode-specific instructions or default
    instructions = base_instructions.get(mode, base_instructions["DIDACTIC"])
    
    # Add scaffolding-specific guidance
    if scaffolding_level >= 2:
        instructions += "\n\n🎯 **Seu nível**: Você pode tentar os exercícios mais complexos!"
    elif scaffolding_level == 1:
        instructions += "\n\n🌱 **Seu nível**: Comece pelos exercícios mais simples e vá progredindo!"
    
    return instructions


def _generate_quick_replies(mode: str, scaffolding_level: int) -> List[str]:
    """
    Generate mode-specific quick replies (SCRIPT 05).
    
    Args:
        mode: Content mode (DIDACTIC, TECHNICAL, NARRATIVE, NEWS)
        scaffolding_level: User's scaffolding level (1-3)
    
    Returns:
        List of 2-3 quick reply suggestions
    """
    if mode == "DIDACTIC":
        return ["Faça 2 exercícios", "Reescreva com outro conectivo", "Eu quero tentar"]
    elif mode == "TECHNICAL":
        return ["Defina termos-chave", "Explique relação entre cláusulas", "Eu quero tentar"]
    elif mode == "NARRATIVE":
        return ["Qual a intenção do autor?", "Explique contexto (sem spoilers)", "Eu quero tentar"]
    elif mode == "NEWS":
        return ["Identifique causa/efeito", "Quais os números chave?", "Eu quero tentar"]
    else:
        # Default fallback
        return ["Continuar", "Fazer exercício", "Eu quero tentar"]


def _extract_verb(text: str) -> Optional[str]:
    """
    SCRIPT 04: Extract main verb from clause (simple heuristic).
    
    Args:
        text: Clause text
    
    Returns:
        Main verb or None
    """
    # Simple heuristic: find common Portuguese verb endings
    # This is a fallback - LLM should provide better results
    words = text.lower().split()
    verb_endings = ['ar', 'er', 'ir', 'ou', 'ei', 'ia', 'va', 'sse']
    
    for word in words:
        if any(word.endswith(ending) for ending in verb_endings):
            return word
    
    return None


def _calculate_max_depth(data: SentenceAnalysisOutput) -> int:
    """
    SCRIPT 04: Calculate maximum clause nesting depth.
    
    Args:
        data: SentenceAnalysisOutput object
    
    Returns:
        Maximum depth (1 for simple sentence with only main clause)
    """
    if not data.sentences:
        # Fallback to legacy structure
        return 1 if not data.subordinate_clauses else 2
    
    max_depth = 0
    for sentence_struct in data.sentences:
        # Build depth map
        depth_map = {}
        
        # Find all main clauses (depth 1)
        for clause in sentence_struct.clauses:
            if clause.type == "MAIN":
                depth_map[clause.id] = 1
        
        # Calculate depth for subordinate clauses
        for clause in sentence_struct.clauses:
            if clause.type in ["SUBORDINATE", "COORDINATE"] and clause.parent_id:
                parent_depth = depth_map.get(clause.parent_id, 0)
                depth_map[clause.id] = parent_depth + 1
        
        # Get max depth for this sentence
        if depth_map:
            sentence_max = max(depth_map.values())
            max_depth = max(max_depth, sentence_max)
    
    return max_depth if max_depth > 0 else 1


def _convert_to_script04_structure(data: SentenceAnalysisOutput, sentence: str) -> None:
    """
    SCRIPT 04: Convert legacy SCRIPT 11 structure to SCRIPT 04 format.
    Populates SCRIPT 04 fields if LLM didn't provide them.
    
    Args:
        data: SentenceAnalysisOutput object to update
        sentence: Original sentence text
    """
    # Populate sentences array if empty
    if not data.sentences:
        clauses = []
        
        # Main clause
        if data.main_clause:
            clauses.append(ClauseDetail(
                id="1",
                text=data.main_clause,
                type="MAIN",
                head_verb=_extract_verb(data.main_clause),
                connective=None,
                parent_id=None
            ))
        
        # Subordinate clauses
        for i, sub in enumerate(data.subordinate_clauses):
            clauses.append(ClauseDetail(
                id=str(i + 2),
                text=sub.text,
                type="SUBORDINATE",
                head_verb=_extract_verb(sub.text),
                connective=sub.connector if sub.connector else None,
                parent_id="1"  # All subordinates link to main clause
            ))
        
        data.sentences = [SentenceStructure(
            original_text=sentence,
            clauses=clauses
        )]
    
    # Populate main_proposition if empty
    if not data.main_proposition and data.main_idea:
        data.main_proposition = data.main_idea
    
    # Populate supporting_propositions if empty
    if not data.supporting_propositions and data.subordinate_clauses:
        data.supporting_propositions = [sub.text for sub in data.subordinate_clauses]
    
    # Populate summary_1line if empty
    if not data.summary_1line and data.simplification:
        data.summary_1line = data.simplification
    
    # Populate rewrite_suggestions if empty
    if not data.rewrite_suggestions:
        suggestions = []
        if data.rewrite_layered.L1:
            suggestions.append(data.rewrite_layered.L1)
        if data.rewrite_layered.L2 and data.rewrite_layered.L2 != data.rewrite_layered.L1:
            suggestions.append(data.rewrite_layered.L2)
        if data.rewrite_layered.L3 and data.rewrite_layered.L3 != data.rewrite_layered.L2:
            suggestions.append(data.rewrite_layered.L3)
        data.rewrite_suggestions = suggestions if suggestions else [data.simplification]


def handle(state: TransferState) -> TransferState:
    """Analyze sentence structure (chat-only)."""
    logger.info("Sentence Analysis node executing")
    
    # 0) Initialize events list
    events = list(state.get("events_to_write") or [])
    
    # 1) Extract text from chat (selection or paste) - PRIORITY LOGIC
    raw_text, source = _get_text_input(state)
    
    if not raw_text:
        # Missing text: return instruction, no LLM call
        events.append({
            "eventType": "PROMPT_RECEIVED",
            "payloadJson": {
                "kind": "SENTENCE_ANALYSIS_NEEDS_TEXT",
                "reason": "missing_selected_or_typed_text"
            }
        })
        return {
            **state,
            "current_node": "sentence_analysis",
            "response_text": "Para eu analisar a sentença, selecione uma frase (✨ IA) ou cole o trecho aqui no chat.",
            "structured_output": None,
            "events_to_write": events
        }
    
    # 2) Normalize and prepare context
    scaffolding_level = int(state.get("scaffolding_level") or 1)
    max_tokens = int(state.get("max_tokens") or 500)
    style_instructions = (state.get("style_instructions") or "").strip()
    language_code = _get_language_code(state)
    
    md = state.get("transfer_metadata") or {}
    mode = md.get("mode", "DIDACTIC")
    
    sentence = _normalize_for_analysis(raw_text, max_chars=900)
    text_len = len(sentence)
    
    # 2b) Q2 IMPLEMENTATION: Detect exercise mode intent ("Eu quero tentar")
    exercise_keywords = ["tentar", "exercício", "praticar", "fazer exercício"]
    is_exercise_request = any(keyword in sentence.lower() for keyword in exercise_keywords)
    
    if is_exercise_request:
        # Return exercise instructions instead of analysis
        exercise_instructions = _generate_exercise_instructions(mode, scaffolding_level)
        events.append({
            "eventType": "PROMPT_RECEIVED",
            "payloadJson": {
                "kind": "EXERCISE_MODE_REQUESTED",
                "mode": mode,
                "scaffolding_level": scaffolding_level
            }
        })
        return {
            **state,
            "current_node": "sentence_analysis",
            "response_text": exercise_instructions,
            "structured_output": None,
            "events_to_write": events,
            "quick_replies": ["Voltar para análise", "Outro exercício"]
        }
    
    # 3) Emit REQUESTED event
    events.append({
        "eventType": "PROMPT_RECEIVED",
        "payloadJson": {
            "kind": "SENTENCE_ANALYSIS_REQUESTED",
            "source": source,
            "text_len": text_len,
            "language_code": language_code,
            "scaffolding_level": scaffolding_level
        }
    })
    
    # 4) Call LLM (cheap LLM) and validate with Pydantic
    llm = llm_factory.get_cheap_llm()
    chain = SENTENCE_PROMPT | llm
    
    data_obj: Optional[SentenceAnalysisOutput] = None
    model_used = "FAST"
    
    try:
        # Initial LLM call
        raw = chain.invoke({
            "sentence": sentence,
            "mode": mode,
            "language_code": language_code,
            "scaffolding_level": scaffolding_level,
            "style_instructions": style_instructions,
            "max_tokens": max_tokens
        }).content
        
        # Clean markdown wrappers
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        data_obj = SentenceAnalysisOutput.parse_raw(cleaned)
        
    except Exception as e:
        logger.warning(f"Initial parse failed, attempting repair: {e}")
        # 4b) Repair attempt (1 retry)
        try:
            repair_chain = SENTENCE_REPAIR_PROMPT | llm
            repaired = repair_chain.invoke({
                "bad_json": raw if "raw" in locals() else "",
                "sentence": sentence,
                "schema": SentenceAnalysisOutput.schema_json()
            }).content
            cleaned_repair = repaired.replace("```json", "").replace("```", "").strip()
            data_obj = SentenceAnalysisOutput.parse_raw(cleaned_repair)
        except Exception:
            # 4c) Heuristic fallback
            logger.warning("Repair failed, using heuristic fallback")
            data_obj = _heuristic_fallback(sentence)
    
    # 5) Generate quick replies if LLM didn't provide them (SCRIPT 05)
    if not data_obj.quick_replies:
        data_obj.quick_replies = _generate_quick_replies(mode, scaffolding_level)
    
    # 5b) Populate SCRIPT 04 fields if LLM didn't provide them
    _convert_to_script04_structure(data_obj, sentence)
    
    # 6) Format response using helper
    response_text = _format_response(data_obj, scaffolding_level)
    structured_output = data_obj.dict()
    
    # 7) Emit telemetry events
    clauses_count = 1 + len(data_obj.subordinate_clauses)
    
    events.append({
        "eventType": "PROMPT_RECEIVED",
        "payloadJson": {
            "kind": "TRANSFER_TOOL_USED",
            "tool": "SENTENCE_ANALYSIS",
            "confidence": data_obj.confidence,
            "clauses_count": clauses_count,
            "connectors_count": len(data_obj.connectors),
            "model_used": model_used,
            "scaffolding_level": scaffolding_level,
            "text_len": text_len
        }
    })
    
    # Calculate SCRIPT 04 metrics
    n_sentences = len(data_obj.sentences) if data_obj.sentences else 1
    max_depth = _calculate_max_depth(data_obj)
    
    events.append({
        "eventType": "PROMPT_RECEIVED",
        "payloadJson": {
            "kind": "SENTENCE_ANALYSIS_COMPLETED",
            "confidence": data_obj.confidence,
            "clauses_count": clauses_count,
            "mode": mode,  # SCRIPT 05
            "scaffolding_level": scaffolding_level,  # SCRIPT 05
            "n_sentences": n_sentences,  # SCRIPT 04
            "max_depth": max_depth  # SCRIPT 04
        }
    })
    
    # 8) Return updated state with quick_replies (SCRIPT 05)
    return {
        **state,
        "current_node": "sentence_analysis",
        "response_text": response_text,
        "structured_output": structured_output,
        "events_to_write": events,
        "quick_replies": data_obj.quick_replies,  # SCRIPT 05
        "model_used": model_used
    }
