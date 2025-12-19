# Glossário - Cornell Reader

**Purpose:** Define all key terms used throughout the codebase and documentation  
**Audience:** All  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

---

## Core Concepts

### Cornell Notes

Sistema de anotações estruturado em três seções:

- **Main Notes (Notas):** Conteúdo principal durante leitura
- **Cue Column (Cues):** Perguntas-chave e palavras de gatilho
- **Summary (Resumo):** Síntese do aprendido

### Dual-Mode Cornell

Dois modos de visualização:

- **Reading Mode:** Visualização para leitura e revisão
- **Editing Mode:** Modo de edição com autosave

### Highlight

Marcação de texto no conteúdo source com:

- **highlightedText:** Texto selecionado
- **anchorJson:** Coordenadas para recriar posição (PDF/DOCX/IMAGE)
- **linkedNoteId:** ID da nota Cornell vinculada
- **color/type:** Estilo visual (DEFINITION, EXAMPLE, IMPORTANT)

### Source View

Visualização do conteúdo original (PDF, DOCX, imagem) com:

- Highlights aplicados
- Navegação para notas vinculadas
- Seleção para criar novos highlights

---

## Study System

### Study Session

Sessão de estudo com 4 fases:

- **PRE:** Objetivos, predições, target words
- **DURING:** Leitura + quiz + highlights
- **POST:** Production tasks + summary
- **FINISHED:** Sessão completa com outcomes

### Session Phases

- **PRE:** Preparação antes da leitura
- **DURING:** Leitura ativa com interações
- **POST:** Consolidação e produção
- **FINISHED:** Estado final após validação DoD

### Definition of Done (DoD)

Requisitos para finalizar sessão:

1. Cornell summary preenchido (trim() > 0)
2. Pelo menos 1 quiz/checkpoint respondido
3. Pelo menos 1 production task submetido

### Target Words

Palavras-alvo que o usuário quer aprender na sessão

### Production Task

Tarefa criativa no POST (exemplo próprio, aplicação prática)

---

## Content & Chunks

### Content

Documento uploadado pelo usuário (PDF, DOCX, imagem, texto)

### Chunk

Fragmento de texto extraído do content para processamento:

- **chunkIndex:** Ordem sequencial
- **text:** Texto do fragmento
- **embedding:** Vetor semântico (opcional)

### Extraction

Processo de converter content em chunks processáveis

### Raw Text

Texto completo extraído do content original

---

## Study Layers

### L1 (Basic Layer)

Camada básica disponível para todos:

- Quiz automático
- Checkpoints
- Cornell notes manual

### L2 (Intermediate Layer)

Camada intermediária com AI assist:

- Sugestões de cues
- Glossário gerado
- Feedback em production tasks

**Eligibility:**

- 3+ sessões finalizadas
- Comprehension média ≥ 60
- Frustration média ≤ 50

### L3 (Advanced Layer)

Camada avançada com AI completo:

- Summaries gerados
- Target words sugeridos
- Quiz personalizado

**Eligibility:**

- 5+ sessões finalizadas
- Comprehension média ≥ 75
- Production média ≥ 70
- Frustration média ≤ 40

### Gating

Sistema que determina elegibilidade para L2/L3 baseado em desempenho histórico

---

## SRS (Spaced Repetition System)

### SRS

Sistema de repetição espaçada para vocabulário

### SRS Stages

Estágios do SRS:

- **NEW:** Palavra nova
- **D1:** Due in 1 day
- **D3:** Due in 3 days
- **D7:** Due in 7 days
- **D14:** Due in 14 days
- **D30:** Due in 30 days
- **D60:** Due in 60 days
- **MASTERED:** Due in 180 days

### Attempt Result

Resultado de revisão de vocabulário:

- **FAIL:** Reset para D1, lapse++
- **HARD:** Regride 1 estágio (floor D1)
- **OK:** Avança 1 estágio
- **EASY:** Avança 2 estágios (skip)

### due_at

Data/hora em que item de vocabulário deve ser revisado

### Lapse Count

Contador de vezes que palavra foi marcada como FAIL

### Review Queue

Fila de itens de vocabulário devido para revisão (where due_at <= NOW)

### Daily Review Cap

Limite diário de itens para revisão (padrão: 20)

---

## Scoring & Outcomes

### Comprehension Score

Score 0-100 baseado em:

- Acertos em quiz (peso 60%)
- Acertos em checkpoints (peso 40%)

### Production Score

Score 0-100 baseado em:

- Qualidade de production tasks
- Uso de target words
- Aplicação de conceitos

### Frustration Index

Índice 0-100 calculado por:

- Unknown word rate (palavras desconhecidas / 100 palavras)
- Time variance (desvio do tempo esperado)
- Menor = melhor experiência

### Session Outcome

Resultado calculado após sessão:

- comprehensionScore
- productionScore
- frustrationIndex
- timeSpent
- wordsLearned

---

## AI & Workers

### Worker

Serviço background (RabbitMQ) para processamento assíncrono

### RabbitMQ

Message broker para filas de jobs

### LangChain

Framework para orquestração de LLM chains

### LangGraph

Framework para workflows de AI com estados e grafos

### Prompt

Template de instrução para LLM

### Schema (Pydantic)

Validação de output estruturado do LLM

### Multi-Provider Strategy

Suporte para OpenAI, Anthropic, Google Gemini com seleção por task

### AI Guardrails

Validações e limites para outputs de AI:

- Schema validation
- Content filtering
- Cost limits

---

## Data & Auth

### Prisma Schema

Definição do modelo de dados (ORM)

### Migration

Alteração versionada no schema do banco

### Entitlement

Permissão/recurso que usuário tem acesso

### Usage Event

Registro de uso de recurso (para billing/limits)

### JWT

JSON Web Token para autenticação

### Session Token

Token de sessão do usuário logado

---

## Technical Terms

### Payload JSON

Campo JSON genérico para dados estruturados

### Anchor JSON

JSON com coordenadas para localizar highlight:

- `{ pageNumber, coords: [x1, y1, x2, y2] }` (PDF)
- `{ paragraphIndex, charStart, charEnd }` (DOCX)
- `{ x, y, width, height }` (IMAGE)

### Event Type

Tipo de evento registrado em SessionEvent:

- QUIZ_RESPONSE
- CHECKPOINT_RESPONSE
- MARK_UNKNOWN_WORD
- PRODUCTION_SUBMIT
- ...

### Asset Layer

Tipo de asset AI gerado (L1, L2, L3)

### Asset Modality

Modalidade do asset (VISUAL, AUDIO, INTERACTIVE)

---

## Abbreviations

- **SRS:** Spaced Repetition System
- **DoD:** Definition of Done
- **PR:** Pull Request
- **ADR:** Architecture Decision Record
- **E2E:** End-to-End
- **CI/CD:** Continuous Integration/Deployment
- **LLM:** Large Language Model
- **JWT:** JSON Web Token

---

## Related Docs

- [Business Rules Index](../02-business-rules/00-rules-index.md)
- [Study Sessions](../02-business-rules/01-study-sessions.md)
- [SRS System](../02-business-rules/02-srs.md)
- [Gating Layers](../02-business-rules/03-gating-layers.md)
