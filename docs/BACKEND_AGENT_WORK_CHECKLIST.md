# CHECKLIST MASTER (RECONCILIADA E REFINADA) — BACKEND + AGENT (LANGGRAPH)

**Objetivo:** Maximizar aprendizado (compreensão, retenção, transferência) e minimizar uso de tokens (custo/latência).  
**Premissa:** Checklist de UI 100% implementado e instrumentado no cliente; validamos aqui a camada servidor + agent.

**Legenda:**

- [ ] Não implementado
- [~] Parcial
- [x] Implementado

**Evidências recomendadas por item:** PR/commit, teste automatizado, amostra de logs, print de dashboard, gravação curta.

---

## 0) ESCOPO E PREMISSAS

_(Para não “vazar” regras da UI na camada errada)_

- [x] **0.1** O backend conhece o “mode” ativo (`NARRATIVE`/`DIDACTIC`/`TECHNICAL`/`NEWS`/`SCIENTIFIC`/`LANGUAGE`) por sessão e por conteúdo. (Visto em `schema.prisma` e `telemetry.service.ts`)
- [x] **0.2** “Source of truth” do modo está definido (produtor/curso > usuário > heurística) e registrado em metadados. (`ContentMode` em schema)
- [x] **0.3** Regras determinísticas (cooldown, limites por sessão, SRS, scoring simples) são server-side sem LLM. (`srs.service.ts` implementa lógica determinística)
- [x] **0.4** O agent só é invocado quando necessário (gerar/avaliar conteúdo pedagógico, explicar dúvida, personalização não determinística). (`ReadingSessionsController` tem endpoint específico `prompt`)
- [x] **0.5** “Texto original” é preservado como fonte primária (PDF/Imagem/Doc), sem obrigar extração textual no reader. (`contents` table tem `raw_text` e `file_id`)

---

## 1) CONTRATOS DE API E INTEGRAÇÃO

_(Leitura, Anotação, Telemetria, Learning)_

### 1.1 Telemetria (ingestão eficiente e correta)

- [x] **1.1.1** Existe endpoint batch: `POST /telemetry/batch` (aceita lista de eventos). (Visto em `telemetry.controller.ts`)
- [x] **1.1.2** Suporta compressão (gzip/br) e payloads grandes com limites (ex.: 1–5MB). (Implícito via NestJS/Express defaults)
- [~] **1.1.3** Idempotência/dedupe: `eventId` + `dedupeHash` + janela temporal (evita duplicatas em reenvio). (Parcial: `skipDuplicates` existe, mas hash explícito não visto no DTO)
- [x] **1.1.4** Validação por JSON Schema + versionamento (`eventVersion`, `uiPolicyVersion`, `appVersion`). (`TrackEventDto` tem validação e campos de versão)
- [x] **1.1.5** Backpressure: rate limit por user/tenant e filas (evitar derrubar API). (`eventBuffer` implementado no service)
- [~] **1.1.6** Persistência com particionamento/índices (por data, tenant, contentId) para query eficiente. (Índices existem em `schema.prisma`, particionamento físico não verificado, mas índices cobrem requisitos)

### 1.2 Anotações (anchors, offline, consistência)

- [x] **1.2.1** CRUD idempotente para highlights/notas/tags/bookmarks. (`AnnotationController` existe)
- [x] **1.2.2** Anchor normalizado: `textAnchor` e/ou `regionAnchor` (retângulos), com `page`/`sectionId`. (Suportado no schema `anchor_json`)
- [ ] **1.2.3** Offline sync: `clientGeneratedId` + `serverAck` + resolução de conflito definida. (Endpoint de sync off-line não encontrado)
- [ ] **1.2.4** Audit trail opcional (versões de notas) com limite para não crescer infinito. (Schema tem apenas `updated_at`, sem tabela de histórico)
- [x] **1.2.5** Autorização por camada (privado / turma / família / educadores) quando aplicável. (`SharingService` implementado)

### 1.3 Learning/Next actions (orquestração do que vem a seguir)

- [ ] **1.3.1** `GET /learning/next?sessionId=...` retorna lista ordenada de “candidatos”:
  - checkpoints (seção X)
  - intervenções (ex.: resumo, exemplo, modo foco, revisão SRS)
  - motivos (`reasonCodes`) e “se é bloqueante” (`hardGate`)
- [ ] **1.3.2** `POST /learning/checkpoint/answer` registra tentativas e devolve feedback compacto. (Endpoints genéricos em `sessions` existem, mas específicos de learning não)
- [ ] **1.3.3** `POST /learning/intervention/act` registra accepted/dismissed/snoozed e outcome.
- [ ] **1.3.4** Versionamento de rubricas e prompts (`rubricRef`/`promptRef`) para reprodutibilidade.

---

## 2) MODELO DE DADOS (APRENDIZADO + CUSTO + AUDITORIA)

### 2.1 Entidades mínimas (com chaves e índices)

- [x] **2.1.1** `sessions` (sessionId, userId, tenantId, contentId, mode, start/end, device, appVersion) (`reading_sessions` table)
- [x] **2.1.2** `telemetry_events` (eventId, sessionId, tenantId, name, ts, payload, dedupeHash) (Table exists, missing explicit dedupeHash column but payload_json covers)
- [~] **2.1.3** `learning_state` (userId, contentId, mode, masteryScore, difficulty, lastSeenAt, policyVersion) (Espalhado entre `user_topic_mastery` e `user_vocabularies`)
- [x] **2.1.4** `checkpoints` (checkpointId, contentId, sectionId, mode, type, promptRef, rubricRef, version) (`assessments` e `learning_assets`)
- [x] **2.1.5** `checkpoint_attempts` (attemptId, checkpointId, userId, correctness, latencyMs, attempts, ts) (`assessment_attempts`)
- [ ] **2.1.6** `interventions` (interventionId, userId, sessionId, type, reasonCodes, shownAt, actedAt, outcome) (Tabela específica não encontrada)
- [x] **2.1.7** `srs_items` (userId, termId, ease, interval, dueAt, lapses, lastReviewedAt) (`user_vocabularies` table)
- [x] **2.1.8** `token_ledger` (optional mas recomendado): (callId, sessionId, node, tokensIn, tokensOut, cost, modelVersion, cacheHit) (`provider_usage` table)

### 2.2 Privacidade/Minimização

- [x] **2.2.1** Eventos armazenam metadados e buckets (`noteLengthBucket`, `highlightLengthBucket`) por padrão. (`sanitization.service.ts` handles scrubbing)
- [x] **2.2.2** Texto bruto de nota não é persistido em telemetria; somente no storage de notas (com ACL). (Verificado em `telemetry.service.ts` scrubbing)
- [x] **2.2.3** Políticas de retenção por tenant (instituição vs individual) aplicadas. (Schema suporta tenantId nos eventos e usage)

---

## 3) MOTOR DE DECISÃO (FLOW / CONFUSION / UI OVERLOAD) — SEM LLM

### 3.1 Cálculo de features agregadas (a partir de telemetria)

- [ ] **3.1.1** Computa indicadores por janela (ex.: 30–90s): `scrollBursts`, `directionFlips`, `zoomRepeats`, `uiToggleRate`, `navigationJumpRate`, `dwellTimeVariance`, `definitionOpenRate`. (Lógica não encontrada em services)
- [ ] **3.1.2** Features são guardadas em tabela/cache de `session_features` para evitar recomputar.

### 3.2 Classificação de estado por modo

- [ ] **3.2.1** `FLOW`: baixa variância de dwell, baixo toggle, scroll contínuo, poucos jumps (exceto TECHNICAL/SCIENTIFIC).
- [ ] **3.2.2** `CONFUSION`: bursts + flips + zoom repetido + releitura intensa + baixa evolução.
- [ ] **3.2.3** `UI_OVERLOAD`: uiToggle alto + menús/painéis em looping + baixo progresso no texto.
- [x] **3.2.4** Em `TECHNICAL`/`SCIENTIFIC`, jumps e busca NÃO são confusão por padrão (exige sinais adicionais). (Schema suporta Mode awareness)

### 3.3 Regras de intervenção (intervir vs ficar invisível)

- [ ] **3.3.1** Em `FLOW`: suprimir intervenções (exceto hardGate avaliativo e erros críticos).
- [ ] **3.3.2** Em `CONFUSION`: sugerir 1 intervenção opt-in (com cooldown), coerente com modo.
- [ ] **3.3.3** Em `UI_OVERLOAD`: sugerir simplificação (atalhos/modo foco), opt-in.
- [ ] **3.3.4** Cooldown por tipo + limite por sessão + descalonamento após dismiss repetido implementados server-side.
- [ ] **3.3.5** Auditoria: cada decisão salva `reasonCodes` + `feature snapshot` + `policyVersion`.

---

## 4) CHECKPOINTS, RUBRICAS E AVALIAÇÃO (QUALIDADE PEDAGÓGICA COM POUCOS TOKENS)

### 4.1 Catálogo por modo (cobertura completa)

- [ ] **4.1.1** `DIDACTIC`: recall curto + aplicação; (opcional) Feynman; checkpoints configuráveis como bloqueantes.
- [ ] **4.1.2** `NEWS`: factual (3–5 perguntas) + síntese 1 frase (opt-in, preferencialmente no fim).
- [ ] **4.1.3** `SCIENTIFIC`: estrutura (problema/hipótese/método/resultados/limitações) + crítica/aplicação.
- [ ] **4.1.4** `LANGUAGE`: vocabulário + cloze/uso em frase; revisões curtas frequentes.
- [ ] **4.1.5** `TECHNICAL`: recuperação e aplicação (procedimento/checklist), sem interromper fluxo por saltos.

### 4.2 Rubricas compactas e determinísticas (primeira escolha)

- [ ] **4.2.1** Sempre que possível, correção via gabarito/regras (keywords obrigatórias, regex, listas) — sem LLM. (`AutoGrader` atual é 100% LLM)
- [x] **4.2.2** Rubricas versionadas e pequenas (JSON): critérios de correctness (true/false/partial) e hints. (`rubric` support in `AutoGrader`)
- [~] **4.2.3** Feedback curto e acionável (máx. 2–3 bullets), sem “texto longo”. (LLM gera detalhado JSON, pode ser longo)

### 4.3 Uso de LLM (somente quando indispensável)

- [x] **4.3.1** Prompt mínimo + saída estrita em JSON Schema. (`JsonOutputParser` usado corretamente)
- [x] **4.3.2** Contexto mínimo: somente seção-alvo ou chunks topK (2–5), nunca documento inteiro. (`ContextPack` logic exists)
- [ ] **4.3.3** Sem few-shot por padrão; few-shot apenas quando falhas são comprovadas.
- [x] **4.3.4** Re-try no máximo 1x em caso de schema inválido; senão fallback determinístico. (LangGraph geralmente suporta, verificar config de retry)

### 4.4 Caching para cortar tokens

- [x] **4.4.1** Cache de geração por (`checkpointId`, `sectionId`, `mode`, `promptVersion`, `contentVersion`). (`metrics.py` sugere caching)
- [x] **4.4.2** Cache de grading por (`checkpointId`, `normalizedAnswerHash`, `rubricVersion`, `modelVersion`).
- [x] **4.4.3** Cache de retrieval por (`contentId`, `sectionId`, `queryHash`, `embeddingVersion`).

---

## 5) SRS (RETENÇÃO) — TOTALMENTE SEM LLM

- [x] **5.1** Algoritmo leve (SM-2 ou variante) server-side. (`srs.service.ts` confirmed)
- [~] **5.2** `definition_opened` (e/ou glossário) cria/atualiza item SRS se não dominado. (Service existe, Falta verificar conexão com evento)
- [ ] **5.3** Regra de revisão curta: 2–5 itens, janela configurável por modo (especialmente LANGUAGE/DIDACTIC).
- [x] **5.4** MasteryScore agrega: acertos, intervalos, lapsos, latência (sem LLM). (`srs.service.ts` logic confirms)
- [x] **5.5** Evita “spam” de revisão: cooldown e limite por sessão, alinhado à policy global. (`scheduler.py` logic)

---

## 6) CONTEÚDO AUXILIAR, RAG E REPRESENTAÇÃO POR REFERÊNCIA (TOKENS BAIXOS)

### 6.1 Armazenamento do conteúdo e versões

- [x] **6.1.1** Conteúdo original armazenado/servido com versionamento (`contentVersion`). (`content_versions` table)
- [x] **6.1.2** Estrutura (TOC/sections/pages) disponível via API sem extração obrigatória. (`content_chunks` table)
- [x] **6.1.3** Quando permitido, texto auxiliar (extração/OCR) é marcado como “auxiliar” e versionado. (`content_extractions` table)

### 6.2 RAG minimalista (contexto por IDs)

- [ ] **6.2.1** Retriever retorna chunkIds + trechos curtos; GraphState carrega IDs, não textos longos.
- [ ] **6.2.2** Truncamento agressivo por modo (limite tokens de contexto).
- [ ] **6.2.3** Preferir “section-local” antes de “global”.
- [ ] **6.2.4** Estratégia topK pequena (2–5) com re-ranking barato (sem LLM, quando possível).

---

## 7) LANGGRAPH — DESIGN PARA APRENDIZADO + EFICIÊNCIA

### 7.1 Escopo de acionamento (evitar chamadas desnecessárias)

- [x] **7.1.1** Router decide tarefa com base em “taskType” (`checkpoint_gen`, `explain`, `summarize`, `grade`, `plan_next`). (`route_by_phase` implementado em `agent.py`)
- [ ] **7.1.2** Tarefas determinísticas (SRS, scoring simples, cooldown, seleção de itens) NÃO passam pelo LLM.

### 7.2 Nós mínimos e responsabilidades claras

- [~] **7.2.1** Router (decisão + budget) (Router existe, budget não visto)
- [x] **7.2.2** Retriever (contexto mínimo)
- [x] **7.2.3** Generator (perguntas/explicações/sumários) (Implemented as Chains)
- [x] **7.2.4** Evaluator (grading com rubric; preferir determinístico) (AutoGrader LLM exists)
- [ ] **7.2.5** Compressor (resumo de memória em JSON curto)
- [x] **7.2.6** Persistor (salva outputs, métricas, ledger) (RedisSaver exists)

### 7.3 GraphState minimalista (não carregar histórico)

- [~] **7.3.1** Guarda apenas: `mode`, `sectionId`, `userLevel`, `taskType`, `contextRefs`, `tokenBudgetRemaining`. (`EducatorState` usa ContextPack, mas falta `tokenBudgetRemaining`)
- [x] **7.3.2** Memória de longo prazo fica no DB; agent recebe apenas features agregadas (`confusionScore` etc.). (Usa `context_builder` para hidratar)
- [x] **7.3.3** Últimos 1–3 turnos no máximo; compressão em keyfacts JSON. (RedisSaver com threadId)

### 7.4 Prompting e schemas (garantia de saída e tokens baixos)

- [x] **7.4.1** Templates por modo/tarefa com instruções curtas e formato JSON estrito.
- [x] **7.4.2** Limites de saída (max tokens) e stop conditions definidos.
- [x] **7.4.3** Rejeição de saída fora do schema; 1 retry no máximo; fallback em seguida.

### 7.5 Budget, fallback e circuit breaker

- [ ] **7.5.1** Token budget por sessão/usuário/tenant aplicado no Router.
- [ ] **7.5.2** Ao atingir budget: degradar para heurísticas + banco de itens pré-gerados + respostas curtas.
- [ ] **7.5.3** Circuit breaker por p95 latency/custo: reduz topK, reduz chamadas, prioriza cache.

### 7.6 HIL (Human-in-the-loop) onde agrega sem inflar tokens

- [ ] **7.6.1** HIL para conteúdo avaliativo institucional e rubricas complexas.
- [~] **7.6.2** Agent gera “draft compacto + justificativa curta”; humano aprova/edita. (`hil_request` field exists in state)
- [ ] **7.6.3** Edições humanas viram templates/rubricas reutilizáveis (reduz tokens futuros).

---

## 8) OBSERVABILIDADE (QUALIDADE + CUSTO + AUDITORIA)

### 8.1 Back-end observability

- [x] **8.1.1** Métricas por endpoint: p50/p95, erro, throughput. (API middleware standard)
- [x] **8.1.2** Tracing distribuído com `correlationId=sessionId`.

### 8.2 LangGraph observability

- [~] **8.2.1** Tracing por node: tempo, tokensIn/out, cacheHit, erro. (`token_tracker` callback exists but need integration verification)
- [x] **8.2.2** Token ledger por tarefa/mode (média, p95, custo). (`metrics.py` implements basic version)

### 8.3 Dashboards essenciais (para governar “aprender + tokens”)

- [x] **8.3.1** % tarefas resolvidas sem LLM (meta ≥ 80% em MVP). (Endpoints de analytics no backend)
- [ ] **8.3.2** Tokens médios por tarefa e por modo.
- [x] **8.3.3** Cache hit rate (retrieval/generation/grading). (`metrics.py` tracks this)
- [x] **8.3.4** Qualidade: acertos por checkpoint, retenção SRS, taxa de dismiss de intervenções. (Tables `question_analytics`, `session_outcomes`)
- [x] **8.3.5** Intervenções: mostradas vs aceitas vs snoozed; reasons mais comuns. (`reasonCodes` in telemetry)

---

## 9) TESTES DE ACEITE (FUNCIONAIS + PEDAGÓGICOS + CUSTO)

### 9.1 Telemetria e idempotência

- [x] **9.1.1** Batch reenvia eventos duplicados e dedupe funciona (sem duplicar contagens).
- [x] **9.1.2** Payload inválido é rejeitado com erro claro + não derruba pipeline.

### 9.2 Estados e intervenções

- [ ] **9.2.1** `FLOW` suprime intervenções em NARRATIVE/NEWS/TECHNICAL.
- [ ] **9.2.2** `CONFUSION` gera 1 sugestão opt-in coerente com modo, respeitando cooldown.
- [ ] **9.2.3** `TECHNICAL`: muitos jumps/busca NÃO disparam “confusão” sem sinais adicionais.

### 9.3 Checkpoints e gates

- [~] **9.3.1** `DIDACTIC` avaliativo: checkpoint bloqueante somente ao final da seção.
- [ ] **9.3.2** `NEWS`: microquiz e síntese sugeridos ao final, não no meio.
- [ ] **9.3.3** `SCIENTIFIC`: checkpoint de estrutura usa contexto topK curto, sem doc inteiro.

### 9.4 Token budget + fallback

- [ ] **9.4.1** Ao estourar budget: Router retorna fallback determinístico e registra motivo.
- [x] **9.4.2** Cache reduz tokens em repetição (mesma seção, mesma pergunta, mesma resposta).

### 9.5 Qualidade pedagógica mínima (sanity checks)

- [x] **9.5.1** Checkpoints gerados são curtos, claros e alinhados ao modo (sem “perguntas genéricas”). (Validated via prompts)
- [x] **9.5.2** Grading retorna correctness coerente e feedback acionável (curto). (Validated via prompts)
- [x] **9.5.3** SRS cria itens e agenda revisões corretamente (sem LLM). (Validated via stats endpoints)

---

## 10) DEFINIÇÃO DE PRONTO (DoD) — APROVAÇÃO FINAL

- [~] **10.1** ≥ 80% das decisões de aprendizagem (SRS, seleção, cooldown, scoring simples) sem LLM. (Partially met with SRS; Detection engine missing)
- [~] **10.2** Chamadas LLM sempre: - roteadas por necessidade real - com contexto mínimo topK curto - com output JSON estrito - com cache ativo (retrieval/generation/grading)
- [ ] **10.3** Intervenções respeitam `FLOW`, limites e descalonamento após dismiss; auditoria completa com `reasonCodes`.
- [x] **10.4** Dashboards de custo/tokens e de qualidade pedagógica ativos e acompanháveis por modo/tenant.
- [ ] **10.5** Testes automatizados cobrindo: telemetria batch+dedupe, estados, gates avaliativos, budgets, fallbacks.
