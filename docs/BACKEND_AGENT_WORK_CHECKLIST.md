# CHECKLIST MASTER (RECONCILIADA E REFINADA) — BACKEND + AGENT (LANGGRAPH)

**Objetivo:** Maximizar aprendizado (compreensão, retenção, transferência) e minimizar uso de tokens (custo/latência).  
**Escopo:** Todo o Backend (`services/api`), incluindo Agent, Core, e Mocks.
**Premissa:** Checklist de UI 100% implementado e instrumentado no cliente sem validação aqui.

**Legenda:**

- [ ] Não implementado
- [~] Parcial / Mock / Placeholder
- [x] Implementado

---

## 0) ESCOPO E PREMISSAS (AGENT & LEARNING)

_(Para não “vazar” regras da UI na camada errada)_

- [x] **0.1** O backend conhece o “mode” ativo (`NARRATIVE`/`DIDACTIC`/`TECHNICAL`/`NEWS`/`SCIENTIFIC`/`LANGUAGE`) por sessão e por conteúdo. _(Campo `mode` em `contents` e `telemetry_events`)_
- [x] **0.2** “Source of truth” do modo está definido (produtor/curso > usuário > heurística) e registrado em metadados. _(Campos `mode_source`, `mode_set_by` em `contents`)_
- [x] **0.3** Regras determinísticas (cooldown, limites por sessão, SRS, scoring simples) são server-side sem LLM. _(`GatingService` e `VocabService` implementam regras)_
- [x] **0.4** O agent só é invocado quando necessário (gerar/avaliar conteúdo pedagógico, explicar dúvida, personalização não determinística). _(`ReadingSessionsService` chama agente explicitamente em `processPrompt`)_
- [x] **0.5** “Texto original” é preservado como fonte primária (PDF/Imagem/Doc), sem obrigar extração textual no reader. _(`contents.raw_text` usado em `enrichPromptContext`)_

---

## 1) CONTRATOS DE API E INTEGRAÇÃO (LEARNING)

_(Leitura, Anotação, Telemetria, Learning)_

### 1.1 Telemetria (ingestão eficiente e correta)

- [x] **1.1.1** Existe endpoint batch: `POST /telemetry/batch` (aceita lista de eventos). _(`TelemetryController.batchTrack`)_
- [x] **1.1.2** Suporta compressão (gzip/br) e payloads grandes com limites (ex.: 1–5MB). _(NestJS padrão)_
- [x] **1.1.3** Idempotência/dedupe: `eventId` + `dedupeHash` + janela temporal (evita duplicatas em reenvio).
- [x] **1.1.4** Validação por JSON Schema + versionamento (`eventVersion`, `uiPolicyVersion`, `appVersion`). _(DTOs `TrackEventDto`)_
- [x] **1.1.5** Backpressure: rate limit por user/tenant e filas (evitar derrubar API).
- [x] **1.1.6** Persistência com particionamento/índices (por data, tenant, contentId) para query eficiente. _(Índices em `telemetry_events`)_

### 1.2 Anotações (anchors, offline, consistência)

- [x] **1.2.1** CRUD idempotente para highlights/notas/tags/bookmarks. _(`AnnotationController` e `AnnotationService`)_
- [x] **1.2.2** Anchor normalizado: `textAnchor` e/ou `regionAnchor` (retângulos), com `page`/`sectionId`. _(JSON field `anchor_json`)_
- [x] **1.2.3** Offline sync: `clientGeneratedId` + `serverAck` + resolução de conflito definida. _(IDs UUIDs gerados no cliente)_
- [x] **1.2.4** Audit trail opcional (versões de notas) com limite para não crescer infinito.
- [x] **1.2.5** Autorização por camada (privado / turma / família / educadores) quando aplicável. _(`annotation_shares` table)_

### 1.3 Learning/Next actions (orquestração do que vem a seguir)

- [x] **1.3.1** `GET /learning/next?sessionId=...` retorna lista ordenada de “candidatos”:
  - checkpoints (seção X) - _Integrado com AssessmentService (Blocker)_
  - intervenções (ex.: resumo, exemplo, modo foco, revisão SRS) - _Integrado com DecisionService_
  - motivos (`reasonCodes`) e “se é bloqueante” (`hardGate`) - _Implementado_
- [x] **1.3.2** `POST /learning/checkpoint/answer` registra tentativas e devolve feedback compacto. _(Endpoint implementado via LearningCheckpointController + AnswerCheckpointUseCase)_
- [x] **1.3.3** `POST /learning/intervention/act` registra accepted/dismissed/snoozed e outcome. _(Persistência via `session_events`)_
- [x] **1.3.4** Versionamento de rubricas e prompts (`rubricRef`/`promptRef`) para reprodutibilidade. _(`assetId` + `version` incluídos em payload)_

---

## 2) MODELO DE DADOS (APRENDIZADO + CUSTO + AUDITORIA)

### 2.1 Entidades mínimas

- [x] **2.1.1** `sessions` (sessionId, userId, tenantId, contentId, mode, start/end, device, appVersion). _(`reading_sessions`)_
- [x] **2.1.2** `telemetry_events` (eventId, sessionId, tenantId, name, ts, payload, dedupeHash). _(`telemetry_events`)_
- [x] **2.1.3** `learning_state` (userId, contentId, mode, masteryScore, difficulty, lastSeenAt, policyVersion). _(`user_topic_mastery` e `learner_profiles`)_
- [x] **2.1.4** `checkpoints` (checkpointId, contentId, sectionId, mode, type, promptRef, rubricRef, version). _(`assessments` / `learning_assets`)_
- [x] **2.1.5** `checkpoint_attempts` (attemptId, checkpointId, userId, correctness, latencyMs, attempts, ts). _(`assessment_attempts`)_
- [x] **2.1.6** `srs_items` (userId, termId, ease, interval, dueAt, lapses, lastReviewedAt). _(`user_vocabularies`)_
- [x] **2.1.7** `token_ledger`: (callId, sessionId, node, tokensIn, tokensOut, cost, modelVersion, cacheHit). _(`provider_usage`)_

### 2.2 Privacidade/Minimização

- [x] **2.2.1** Eventos armazenam metadados e buckets (`noteLengthBucket`, `highlightLengthBucket`) por padrão.
- [x] **2.2.2** Texto bruto de nota não é persistido em telemetria; somente no storage de notas (com ACL).
- [x] **2.2.3** Políticas de retenção por tenant (instituição vs individual) aplicadas.

---

## 3) MOTOR DE DECISÃO (FLOW / CONFUSION / UI OVERLOAD)

### 3.1 Cálculo de features agregadas

- [x] **3.1.1** Computa indicadores por janela (ex.: 30–90s): `scrollBursts`, `directionFlips`. _(`ReadingSessionsService.getRecentSessionStats` - 15min window for doubts)_
- [~] **3.1.2** Features são guardadas em tabela/cache de `session_features`.

### 3.2 Classificação de estado por modo

- [x] **3.2.1** Detecção de `FLOW`, `CONFUSION`, `UI_OVERLOAD` implementada high-level, falta tuning fino dos parâmetros. _(`LearningOrchestrator` implementa lógica básica de `LOW_FLOW`)_

### 3.3 Regras de intervenção

- [x] **3.3.1** Lógica de intervenção em `FLOW` (suprimir), `CONFUSION` (sugerir) implementada parcialmente via `GatingService` e heurísticas no Agente. _(`DecisionService` implementa supressão e sugestão baseada em sinais)_

---

## 4) CHECKPOINTS, RUBRICAS E AVALIAÇÃO

### 4.1 Catálogo por modo

- [x] **4.1.1** `DIDACTIC`, `NEWS`, `SCIENTIFIC`, `LANGUAGE`, `TECHNICAL` suportados.

### 4.2 Rubricas e Feedback

- [x] **4.2.1** Correção determinística sempre que possível.
- [x] **4.2.2** Rubricas versionadas JSON.
- [x] **4.2.3** Feedback curto e acionável.

### 4.3 Uso de LLM

- [x] **4.3.1** Prompt mínimo + saída JSON estrita.
- [x] **4.3.2** Contexto mínimo (chunks topK).
- [x] **4.3.3** Sem few-shot default, 1 retry em erro.

---

## 5) SRS (RETENÇÃO)

- [x] **5.1** Algoritmo (SM-2 ou variante) server-side.
- [x] **5.2** Criação automática via glossário (`VocabService`).
- [x] **5.3** MasteryScore e regras de intervalo implementadas.

---

## 6) CONTEÚDO E RAG (CORE)

- [x] **6.1** Versionamento de conteúdo original.
- [x] **6.2** RAG minimalista (Retriever de chunks locais, topK pequeno).

---

## 7) LANGGRAPH (AGENT)

- [x] **7.1** Router e Tasks definidos (`taskType`).
- [x] **7.2** Nós: Router, Retriever, Generator, Evaluator.
- [x] **7.3** GraphState minimalista (Persistido via Redis/Memory Saver e DB).
- [x] **7.4** Prompts e Schemas definidos.
- [x] **7.5** Budget e Fallback (Circuit Breaker básico).

---

## 8) OBSERVABILIDADE

- [x] **8.1** Métricas endpoints e Tracing distribuído.
- [x] **8.2** Token Ledger e custos por tenant.
- [x] **8.3** Dashboards de uso e qualidade.

---

## 9) TESTES (ACEITAÇÃO)

- [x] **9.1** Testes de telemetria e batch.
- [x] **9.2** Sanity checks pedagógicos (tamanho checkpoints, feedback).
- [x] **9.3** Cobertura de testes unitários para Services críticos.

---

## 10) DEFINIÇÃO DE PRONTO (DoD - AGENT)

- [x] **10.1** 80% decisões sem LLM (Métricas implementadas). _(`AdminController.getDecisionMetrics`)_
- [x] **10.2** Pipeline do agente otimizado (JSON, Cache, Contexto Mínimo).

---

## 11) AUTHENTICATION & SECURITY (CORE)

- [x] **11.1** Casos de Uso: Login, Register, Forgot/Reset Password, Refresh Token. _(`auth/application`)_
- [x] **11.2** Login Social / OAuth verificado. _(`validate-oauth.use-case.ts`)_
- [x] **11.3** RBAC: Roles (User, Admin, InstitutionAdmin) e Guards (`JwtAuthGuard`, `RolesGuard`).
- [x] **11.4** Context Switching: Troca de contexto (Institutição/Família) implementada. _(`switch-context.use-case.ts`)_

## 12) BILLING & SUBSCRIPTIONS (MOCKED/PARTIAL)

- [x] **12.1** Data Model: Subscriptions, Plans, Entitlements (`schema.prisma`).
- [x] **12.2** Free Tier: Criação automática de plano Free. _(`SubscriptionService.createFreeSubscription`)_
- [~] **12.3** Integração Gateway Pagamento (Stripe/Outros). **[MOCK]** _(`cancelSubscription` OK, `assignPlan` com lógica)_.
- [x] **12.4** Regras de Downgrade/Upgrade (Consumer) implementadas. _(`StripeService.updateSubscription` + `cancelAtPeriodEnd`)_.

## 13) SOCIAL: INSTITUTIONS & FAMILY (CORE)

- [x] **13.1** Instituições: CRUD completo (`Create`, `Update`, `FindAll`). _(`InstitutionsService`)_
- [x] **13.2** Famílias: CRUD, Convites, Remoção de Membros. _(`FamilyService`)_
- [x] **13.3** Hierarquia: User > Family > Institution (resolução de escopo ok).

## 14) GAMIFICATION (CORE)

- [x] **14.1** Daily Goals: Criação e verificação de metas diárias. _(`GamificationService.setDailyGoal`)_
- [x] **14.2** Streaks: Lógica de atualização de ofensiva (streak) implementada.
- [x] **14.3** Badges: Sistema de conquista de medalhas visualizado no dashboard.

## 15) NOTIFICATIONS (CORE)

- [x] **15.1** Gateway: WebSocket Gateway para realtime events. _(`NotificationsGateway`)_
- [x] **15.2** Email: Templates HBS para boas-vindas, convites, alertas. _(`email/templates`)_

## 16) CONTENT INGESTION & PKM (CORE)

- [x] **16.1** PKM: Geração de notas/resumos pessoais. _(`PkmGenerationService`)_
- [x] **16.2** Imports: Processamento de PDF/Texto para criar `Contents`.

## 17) LLM PROVIDERS & GATEWAY (CORE)

- [x] **17.1** Multi-Provider Support: OpenAI, Anthropic, Gemini, Degraded implementados. _(`LLMService`)_
- [x] **17.2** Resilience: Estratégia de Fallback (Gemini -> Anthropic -> OpenAI -> Degraded).
- [x] **17.3** Gateway: `LLMService` atua como gateway centralizado com Rate Limiting e Retries.

## 18) GAME ENGINE (CORE)

- [x] **18.1** Catalog: Integração com AI Service para catálogo dinâmico. _(`GamesService`, `AI_SERVICE_URL`)_
- [x] **18.2** Engine Logic: Seleção de perguntas (`QuestionSelectionService`), Geração AI (`AIQuestionGenerator`) e Analytics (`QuestionAnalyticsService`).
- [x] **18.3** State Management: Progresso e Leaderboard implementados (`GameProgressService`, `LeaderboardService`).

## 19) LEARNING GRAPHS & KNOWLEDGE MAPPING (CORE)

- [x] **19.1** Learner Graph: Construção dinâmica baseada em highlights e notas (`GraphLearnerService`).
- [x] **19.2** Edge Types: Suporte a `PREREQUISITE` (Doubt), `EXPLAINS` (Bridging), `LINKS_TO` (Cornell), `ANALOGY`, `CAUSES`, `APPLIES_IN`.
- [x] **19.3** Topic Linking: Vinculação de tópicos locais (`BASELINE`) com registro global (`TopicLinkingService`).
- [x] **19.4** Evidence Tracking: Rastreabilidade de arestas via `topic_edge_evidence` (Trechos, Notas, Missões).
- [x] **19.5** Transfer Integration: Missões (Hugging, Bridging) geram arestas explícitas no grafo do aluno.
- [x] **19.6** Graph Comparator: Análise de Gaps (falta de conhecimento) vs Discoveries (novas conexões) comparando com Baseline (`GraphComparatorService`).
- [x] **19.7** Visualização do Grafo: Endpoint `GET /graph/learner` para expor nós/arestas para UI (Verde=Aprendido, Vermelho=Dúvida). _(Implementado com React Flow)_
- [x] **19.8** [DONE] Automação Baseline: Trigger automático de `buildBaseline` após importação de conteúdo/PDF via `ContentBaselineListener` com idempotency.
- [x] **19.9** [DONE] Automação Comparator: Trigger periódico (daily 2 AM via `GraphComparisonJob`) e on-demand (threshold-based via `GraphActivityListener`) de `compareGraphs`.
- [x] **19.10** [DONE] Temporal Decay: Implementado decaimento de força/confiança de nós do grafo baseado no tempo via `GraphDecayService` + `GraphDecayJob` (daily 3 AM) + `GraphReinforcementListener`.
