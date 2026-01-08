# O "Arsenal" do Transfer Graph

Este documento lista as capacidades ("tools") disponíveis no sub-agente `TransferGraph` e fornece um guia técnico para implementar novas funcionalidades de intervenção pedagógica.

## 1. Ferramentas Disponíveis (11 Tools)

Estas ferramentas são ativadas cirurgicamente pelo `DecisionService` (intents) para resolver problemas específicos durante a leitura.

| Tool                  | Função Pedagógica                                             | Implementação               |
| :-------------------- | :------------------------------------------------------------ | :-------------------------- |
| **Analogy**           | Cria analogias estruturais para explicar conceitos complexos. | `analogy_node.py`           |
| **Morphology**        | Decompõe palavras em morfemas (etimologia/estrutura).         | `morphology_node.py`        |
| **Tier 2**            | Ensina vocabulário acadêmico com exemplos de uso robustos.    | `tier2_node.py`             |
| **Bridging**          | "Missão de Resgate" para conectar com conceitos anteriores.   | `bridging_node.py`          |
| **High Road**         | Abstração e transferência para domínios distantes.            | `high_road_node.py`         |
| **Mission Feedback**  | Corrige/comenta missões enviadas pelo usuário.                | `mission_feedback_node.py`  |
| **Metacognition**     | Promove auto-regulação ("O que funcionou hoje?").             | `metacognition_node.py`     |
| **PKM**               | Gera notas atômicas estruturadas (Obsidian-ready).            | `pkm_node.py`               |
| **Iceberg**           | Análise sistêmica (Eventos > Padrões > Estruturas).           | `iceberg_node.py`           |
| **Connection Circle** | Visualiza conexões sistêmicas de variáveis.                   | `connection_circle_node.py` |
| **Hugging**           | Suporte emocional e encorajamento ("Acolhimento").            | `hugging_node.py`           |

---

## 2. Arquitetura Técnica

O sistema não usa "Function Calling" nativo de LLMs. Ele usa **Grafo Deterministico com Prompts Estruturados**.

**Fluxo de Execução:**

1. **DecisionService (NestJS):** Detecta necessidade -> Envia `TransferIntent`.
2. **Router (`transfer_graph.py`):** Recebe Intent -> Encaminha para o Node específico.
3. **Node (`*_node.py`):**
   - Carrega Prompt Template.
   - Invoca LLM (geralmente Tier `FAST`).
   - Recebe JSON.
4. **Parser:** Valida JSON e formata resposta Markdown.
5. **Frontend:** Exibe resposta.

---

## 3. Guia de Implementação: Nova Tool

Exemplo prático: Criando uma tool de **Entendimento de Sentença** (`SENTENCE_ANALYSIS`).

### Passo 1: Definir Intenção

Arquivo: `educator/transfer_state.py`

```python
TransferIntent = Literal[
    ...,
    "SENTENCE_ANALYSIS"  # Novo
]
```

### Passo 2: Criar Prompt & Schema

Arquivo: `educator/prompts/transfer_prompts.py`

```python
SENTENCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a linguistic expert analyzing sentence structure.

{style_instructions}

Target length: ~{max_tokens} tokens.

Output ONLY valid JSON matching this schema:
{{
  "main_clause": "string (the core subject-verb-object)",
  "subordinate_clauses": [
    {{"text": "string", "function": "string"}}
  ],
  "simplification": "string (rewrite in simple terms)"
}}"""),
    ("user", """Sentence: {sentence}
Analyze syntax. Output JSON only.""")
])
```

### Passo 3: Implementar o Node

Arquivo: `educator/nodes/transfer/sentence_node.py`

```python
from educator.transfer_state import TransferState
from educator.prompts.transfer_prompts import SENTENCE_PROMPT
from llm_factory import llm_factory
import json

def handle(state: TransferState) -> TransferState:
    metadata = state.get('transfer_metadata', {})
    sentence = metadata.get('selected_text')

    # Tier FAST é rápido e barato para tarefas mecânicas
    llm = llm_factory.get_llm(tier="FAST")
    chain = SENTENCE_PROMPT | llm

    try:
        response = chain.invoke({"sentence": sentence, "max_tokens": 500})
        data = json.loads(response.content)

        # Formata resposta visual
        formatted = f"🧩 **Análise:**\n\n**Núcleo:** {data['main_clause']}\n\n_{data['simplification']}_"

        return {
            **state,
            "response_text": formatted,
            "structured_output": data,
            "current_node": "sentence_analysis"
        }
    except Exception:
        return {**state, "response_text": "Falha na análise."}
```

### Passo 4: Registrar no Grafo

Arquivo: `educator/transfer_graph.py`

```python
from educator.nodes.transfer.sentence_node import handle as sentence_handle

# ... dentro de create_transfer_graph():
workflow.add_node("sentence_analysis", sentence_handle)

# Na config de conditional_edges:
{
    ...,
    "SENTENCE_ANALYSIS": "sentence_analysis"
}

workflow.add_edge("sentence_analysis", END)
```
