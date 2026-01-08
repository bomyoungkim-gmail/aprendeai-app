# Diagnóstico Técnica: Tool SENTENCE_ANALYSIS

Análise de viabilidade e riscos do script proposto para implementação da nova tool no `TransferGraph`.

## 🛡️ Veredito Geral: APROVADO COM RESSALVAS

O plano é tecnicamente sólido e respeita a arquitetura de Grafo Determinístico + Scaffolding. No entanto, há **três pontos críticos** que precisam de ajuste para não quebrar o Backend (NestJS).

---

## 🏗️ Análise por Camada

### 1. Python (Transfer Graph) - ✅ Sólido

- **State & Intent:** A adição em `transfer_state.py` está correta.
- **Prompt:** O esquema JSON proposto é robusto e segue o padrão.
- **Node:** A lógica Pydantic + Validated JSON é excelente (melhor que o `json.loads` cru usado em `tier2_node.py`).
- **Scaffolding:** O script propõe uma função `style_instructions_by_level`.
  - ⚠️ **Alerta:** O `scaffolding_node.py` JÁ injeta uma string `style_instructions` genérica no state.
  - **Recomendação:** Não ignore a instrução global. Concatene a instrução específica da tool com a global:
    ```python
    # No Sentence Node:
    global_style = state.get('style_instructions', '')
    local_style = style_instructions_by_level(level, mode)
    final_style = f"{global_style}\n\nSPECIFIC RULES:\n{local_style}"
    ```

### 2. Backend (DecisionService) - ⚠️ Requer Contrato

- **DTO:** O script diz "sem novos endpoints", mas se o Backend for enviar o string `SENTENCE_ANALYSIS` no campo `intent`, o TypeScript vai reclamar se o tipo `TransferIntent` não for atualizado.
  - 📝 **Ação Necessária:** Atualizar `services/api/src/ai-service/dto/transfer-task.dto.ts` (ou local equivalente) adicionando o novo Enum Value.
- **Gatilho (Regex):** Para o passo 5 funcionar ("Disparar somente..."), você precisará de uma lógica de **Intent Detection** no `decision.service.ts`.
  - Atualmente, isso é feito via `QuickCommandParser` ou heurística simples.
  - **Recomendação:** Adicionar regex simples: `/(analise|sintaxe|oração)/i` + presença de seleção.

### 3. Frontend (Chat) - ✅ Transparente

- Como a tool opera 100% via chat (`response_text` + `quick_replies`), **nenhuma alteração de UI é necessária**. O chat renderiza Markdown e botões automaticamente.

---

## 🔍 Pontos de Atenção (Guardrails)

| Risco Detectado            | Mitigação Proposta                                                              | Status        |
| :------------------------- | :------------------------------------------------------------------------------ | :------------ |
| **Alucinação de Texto**    | O script força o uso de `context.selection`. Se vazio, aborta.                  | ✅ Seguro     |
| **Quebra de JSON**         | O script propõe um `Repair Prompt` (auto-correção).                             | ✅ Excelente  |
| **Conflito de Fading**     | O script define regras de Fading próprias que podem conflitar com as do Engine. | ⚠️ Ajustar    |
| **Erro de Tipo no NestJS** | Backend falhará se o Enum não for atualizado.                                   | ⚠️ Bloqueante |

## 🚀 Plano de Ação Refinado

1.  **Backend TS:** Adicionar `SENTENCE_ANALYSIS` ao `TransferIntent` (DTO).
2.  **Backend Logic:** Implementar detecção de gatilho no `DecisionService`.
3.  **Python:** Seguir o script, mas integrar `style_instructions` global com local.
4.  **Testes:** Validar com frases ambíguas para testar o Guardrail de seleção.

**Conclusão:** O script está 90% pronto. Apenas cuide da sincronia de DTOs TypeScript/Python.
