# Plano de Implementação: Tool SENTENCE_ANALYSIS

Este plano detalha a implementação da funcionalidade de análise de sentença, priorizando robustez no backend (NestJS) e evitando conflitos com o Engine pedagógico existente.

## 1. Backend Logic (NestJS)

### A. Atualização de Contrato (Type Safety)

Arquivo: `services/api/src/ai-service/dto/transfer-task.dto.ts`

- **Ação:** Adicionar `SENTENCE_ANALYSIS` ao enum/type `TransferIntent`.
- **Por quê:** Garante que o TypeScript valide o envio dessa intenção entre DecisionService e EducatorService.

### B. Detecção de Intenção (Gatilho Robusto)

Arquivo: `services/api/src/decision/application/decision.service.ts`

- **Problema Atual:** O `DecisionService` foca em sinais (Doubt Spike, Low Flow) ou ações explícitas (botões). Não há parser de texto nativo.
- **Solução Padronizada:** Implementar um `IntentDetectorHelper` (ou método privado `detectChatIntent`) dentro do `DecisionService`.
- **Regex:** `/(analise|sintaxe|oração|sentence|structure)/i`
- **Regra de Negócio (Guardrail):**
  - Só dispara se houver `regex match` **E** (`context.selection` não nulo **OU** texto do chat > 10 caracteres).
  - Se disparar, retorna `explicitUserAction: 'USER_ASKS_SENTENCE_ANALYSIS'`.

### B.1. Fallback Proativo (Quick Replies)

- Se o usuário enviar texto (> 10 chars) **SEM** comando explícito:
  - O `DecisionService` deve instruir o `Educator` a retornar **Quick Replies**:
    - `[Analisar Sintaxe]` -> Dispara intent `SENTENCE_ANALYSIS`
    - `[Criar Nota]`
    - `[Explicar Termos]`
  - Isso resolve o problema de discoverability sem ser intrusivo.

### C. Mapeamento de Ação

Arquivo: `services/api/src/decision/application/decision.service.ts`

- Método: `handleExplicitActionProposal`
- **Código:**
  ```typescript
  case 'USER_ASKS_SENTENCE_ANALYSIS':
    return {
      action: 'CALL_AGENT', // ou ASSIGN_MISSION dependendo da arquitetura
      channelHint: 'CACHED_LLM',
      reason: 'USER_EXPLICIT_ASK',
      payload: { intent: 'SENTENCE_ANALYSIS' }
    };
  ```

---

## 2. Python (Transfer Graph)

### A. Transfer State

Arquivo: `educator/transfer_state.py`

- Adicionar `SENTENCE_ANALYSIS` ao `TransferIntent`.

### B. Node Implementation (Sem Conflitos)

Arquivo: `educator/nodes/transfer/sentence_node.py`

- **Conflito Evitado:** Não substituir `style_instructions`.
- **Implementação:**

  ```python
  # Captura estilo global do Engine (ScaffoldingNode)
  global_instructions = state.get('style_instructions', '')

  # Adiciona instruções específicas da tarefa
  task_instructions = """
  Task specific: Analyze syntax. Identify main clause.
  """

  # Combina para o Prompt
  final_instructions = f"{global_instructions}\n\n{task_instructions}"
  ```

- **Guardrail:** Se `selected_text` vazio, retornar mensagem amigável instruindo o uso da ferramenta de seleção (✨).

---

## 3. Resumo do Fluxo

1. **User:** Seleciona texto -> Clica em "IA" -> Digita "Analise a sintaxe".
2. **Backend (Controller):** Recebe POST `/chat`.
3. **Backend (Decision):**
   - `detectChatIntent` vê regex "sintaxe".
   - Confirma presença de seleção.
   - Retorna action `USER_ASKS_SENTENCE_ANALYSIS`.
4. **Backend (Execution):** Chama `executeTransferTask('SENTENCE_ANALYSIS')`.
5. **Python (Router):** Roteia para `sentence_node`.
6. **Python (Node):**
   - Aplica Prompt + Scaffolding Global.
   - Gera JSON estruturado.
   - Retorna Markdown formatado.
7. **Frontend:** Exibe resposta.

## 4. Checklist de Execução

- [ ] (Backend) Atualizar DTO `TransferIntent`
- [ ] (Backend) Implementar Regex Trigger no `DecisionService`
- [ ] (Backend) Mapear Ação `USER_ASKS_SENTENCE_ANALYSIS`
- [ ] (Python) Criar `sentence_node.py` e registrar no Grafo
- [ ] (Python) Criar Prompt e Schema
- [ ] (E2E) Testar com e sem seleção de texto
