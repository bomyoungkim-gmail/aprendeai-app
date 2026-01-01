# Documentação da Aplicação AprendeAI

## Informações Necessárias para Implementação de Regras Pedagógicas

**Versão**: 1.0  
**Data**: Janeiro 2026  
**Objetivo**: Mapear estado atual da aplicação para implementar sistema pedagógico adaptativo

---

## A) Conteúdo e Estrutura

### 1. Content Types Existentes

**Tipos Suportados** (enum `ContentType` no Prisma):

```typescript
enum ContentType {
  PDF,
  IMAGE,
  DOCX,
  VIDEO,
  AUDIO,
  ARTICLE,
  TEXT,
  NEWS,
  ARXIV,
  SCHOOL_MATERIAL,
  WEB_CLIP,
}
```

**Extração Auxiliar por Tipo**:

| ContentType     | Extração de Texto        | TOC/Estrutura        | OCR          | Implementado |
| --------------- | ------------------------ | -------------------- | ------------ | ------------ |
| PDF             | ✅ Sim (`raw_text`)      | ⚠️ Parcial           | ❌ Não       | ✅           |
| DOCX            | ✅ Sim (Mammoth)         | ❌ Não               | N/A          | ✅           |
| IMAGE           | ❌ Não                   | N/A                  | ❌ Planejado | ⚠️           |
| VIDEO           | ⚠️ Transcrição planejada | ❌ Não               | N/A          | ⚠️           |
| AUDIO           | ⚠️ Transcrição planejada | ❌ Não               | N/A          | ⚠️           |
| ARTICLE         | ✅ Sim (web scraping)    | ❌ Não               | N/A          | ✅           |
| TEXT            | ✅ Sim (direto)          | ❌ Não               | N/A          | ✅           |
| NEWS            | ✅ Sim                   | ❌ Não               | N/A          | ✅           |
| ARXIV           | ✅ Sim (PDF)             | ⚠️ Seções detectadas | N/A          | ✅           |
| SCHOOL_MATERIAL | ✅ Sim                   | ❌ Não               | ❌           | ⚠️           |
| WEB_CLIP        | ✅ Sim                   | ❌ Não               | N/A          | ✅           |

**Modelo de Dados**:

```prisma
model contents {
  id                String
  type              ContentType
  raw_text          String        // Texto extraído
  metadata          Json?         // Metadados flexíveis
  file_id           String?       // Referência ao arquivo original

  // Extração estruturada
  content_extractions content_extractions?
}

model content_extractions {
  id         String
  content_id String @unique
  toc_json   Json?   // Table of Contents (quando disponível)
  // Outros campos de extração
}
```

### 2. Representação de "Seção"

**Estado Atual**:

- ❌ **Não existe `sectionId` formal** no schema
- ✅ Existe `pageNumber` para PDFs (campo `page_number` em highlights)
- ⚠️ **TOC parcialmente implementado**:
  - Campo `toc_json` em `content_extractions` (JSON flexível)
  - Detecção de seções para modo SCIENTIFIC (frontend):
    ```typescript
    // frontend/lib/content/section-detector.ts
    detectSections(text, 'SCIENTIFIC') → Section[]
    // Detecta: Abstract, Introduction, Methods, Results, Discussion, Conclusion
    ```

**Granularidade Atual**:

- **PDF**: Por página (`pageNumber`)
- **DOCX**: Por parágrafo via `startPath`/`endPath` (DOM path)
- **Texto/Article**: Por offset de caracteres (`start_offset`, `end_offset`)
- **Vídeo/Áudio**: Por timestamp (`timestamp_ms`)

**Anchor Types** (como identificamos posição):

```typescript
// PDF
interface PDFTextAnchor {
  type: "PDF_TEXT";
  position: {
    pageNumber: number;
    boundingRect: BoundingRect;
    rects: BoundingRect[];
  };
  quote?: string;
}

// DOCX
interface DocxTextAnchor {
  type: "DOCX_TEXT";
  range: {
    startPath: string[]; // Caminho DOM
    startOffset: number;
    endPath: string[];
    endOffset: number;
  };
  quote: string;
}

// Image
interface ImageAreaAnchor {
  type: "IMAGE_AREA";
  rect: { x; y; w; h };
  zoom: number;
  viewport: { width; height };
}
```

### 3. Identificação de "Conceito" por Seção

**Estado Atual**: ❌ **Não implementado sistematicamente**

**O que existe**:

- `tags_json` em highlights (array de strings livre)
- `content_pedagogical_data.vocabulary_triage` (JSON com palavras-chave)
- Detecção heurística de seções IMRAD para artigos científicos

**O que NÃO existe**:

- Taxonomia formal de conceitos
- Mapeamento conceito → seção
- Grafo de dependências entre conceitos
- Extração automática de conceitos por IA

**Recomendação**: Implementar como parte do sistema pedagógico.

### 4. Versionamento de Conteúdo

**Existe**: ✅ **Sim, parcialmente**

```prisma
model content_versions {
  id                     String
  content_id             String
  target_language        Language
  schooling_level_target String
  simplified_text        String    // Versão adaptada
  summary                String?
  vocabulary_glossary    Json?
  created_at             DateTime
}
```

**Limitações**:

- ❌ Não versiona o `raw_text` original
- ❌ Não versiona TOC/sections
- ✅ Versiona apenas **adaptações** (simplificações, traduções)
- ❌ Não há histórico de mudanças (apenas versão atual)

### 5. Restrições de Copyright

**Estado Atual**: ⚠️ **Não formalizado no código**

**O que existe**:

- Campo `scope_type` em `contents`:
  ```prisma
  scope_type ScopeType @default(USER)
  // USER | FAMILY | INSTITUTION
  ```
- Campo `owner_type` e `owner_id` para rastreamento

**O que NÃO existe**:

- Flag explícita de "pode armazenar texto"
- Flag de "pode gerar resumos persistentes"
- Políticas por tenant/instituição
- Watermarking ou DRM

**Recomendação**:

- Adicionar campo `copyright_policy` em `contents`
- Implementar verificação antes de armazenar `raw_text`
- Criar tabela `institution_policies` para regras por tenant

---

## B) Usuários, Perfis e Contexto

### 6. Tipos de Usuário e Permissões

**Tipos de Usuário** (múltiplos papéis por contexto):

```prisma
// Sistema global
enum SystemRole {
  ADMIN, TEACHER, STUDENT, PARENT
}

// Família
enum FamilyRole {
  OWNER, GUARDIAN, CHILD
}

enum FamilyLearningRole {
  EDUCATOR, LEARNER, PEER
}

// Instituição
enum InstitutionRole {
  ADMIN, TEACHER, STUDENT
}

// Grupo de estudo
enum GroupRole {
  OWNER, MOD, MEMBER
}
```

**Modelo de Usuário**:

```prisma
model users {
  id           String
  email        String
  system_role  SystemRole?

  // Contextos
  family_members      family_members[]      // Múltiplas famílias
  institution_members institution_members[] // Múltiplas instituições
  study_group_members study_group_members[] // Múltiplos grupos
}
```

**Permissões por Tenant**:

- ✅ **Família**: Definidas em `family_policies`
  - `privacy_mode`: AGGREGATED_ONLY | FULL_VISIBILITY
  - `tool_words_gate_enabled`: Boolean
  - `daily_review_cap`: Int
- ✅ **Instituição**: Definidas em `institution_members.role`
- ❌ **Não há sistema RBAC/ABAC formal** - permissões são hardcoded

### 7. Nível Escolar/Idade e Objetivo

**Estado Atual**: ⚠️ **Parcialmente implementado**

**O que existe**:

```prisma
model users {
  birthday DateTime?  // Pode calcular idade
  // Não há campo de nível escolar ou objetivo
}

model content_versions {
  schooling_level_target String  // Ex: "ensino_medio", "superior"
}
```

**O que NÃO existe**:

- Campo `education_level` em `users`
- Campo `learning_objective` (ENEM, recreativo, pesquisa)
- Perfil de aprendizado (visual, auditivo, etc.)
- Histórico acadêmico

**Recomendação**: Adicionar `user_profile` table:

```prisma
model user_profiles {
  user_id          String @unique
  education_level  EducationLevel
  learning_goals   Json  // Array de objetivos
  preferred_modes  Json  // Modos preferidos
}
```

### 8. Idioma e Tradução

**Estado Atual**: ✅ **Implementado**

```prisma
enum Language {
  PT, EN, ES, FR, DE, IT, ZH, JA, KO, AR, RU
}

model contents {
  original_language Language
  language_guess    String?
}

model content_versions {
  target_language Language
  simplified_text String  // Texto traduzido/adaptado
}
```

**Suporte a Tradução**:

- ✅ Idioma original rastreado
- ✅ Versões traduzidas em `content_versions`
- ❌ Não há preferência de idioma por usuário no schema
- ❌ Não há pares de tradução pré-definidos

**Recomendação**: Adicionar `preferred_language` em `users`.

---

## C) UI/Reader + Anotações

### 9. Modo Sem Extração - Anchoring

**Tipos de Anchor Suportados**:

✅ **TextAnchor** (range de texto):

```typescript
{
  type: 'PDF_TEXT' | 'DOCX_TEXT',
  position/range: { ... },
  quote: string  // Texto selecionado
}
```

✅ **RegionAnchor** (retângulo espacial):

```typescript
{
  type: 'PDF_AREA' | 'IMAGE_AREA',
  position/rect: { x, y, w, h },
  imageSnapshotKey?: string
}
```

✅ **Ambos suportados** - o campo `kind` em `highlights` define:

```prisma
model highlights {
  kind        HighlightKind  // TEXT | AREA
  anchor_json Json           // Polimórfico
}
```

**Fallback para Conteúdo Sem Extração**:

- PDF sem OCR: Usa coordenadas de página (`PDF_AREA`)
- Imagem: Usa região (`IMAGE_AREA`)
- Vídeo/Áudio: Usa timestamp (`timestamp_ms`)

### 10. Tipos de Anotação

**Tipos Existentes**:

```prisma
model highlights {
  kind         HighlightKind        // TEXT | AREA
  color_key    String               // Cor do highlight
  comment_text String?              // Nota/comentário
  tags_json    String[]             // Tags livres (ex: "QUESTION", "IMPORTANT")

  // Visibilidade
  visibility       AnnotationVisibility  // PRIVATE | GROUP | PUBLIC
  visibility_scope VisibilityScope?      // Granular (CLASS_PROJECT, etc.)

  // Contexto de compartilhamento
  context_type ContextType?  // INSTITUTION | GROUP_STUDY | FAMILY
  context_id   String?
}

// Threads/Comentários
model annotation_comments {
  highlight_id String
  user_id      String
  text         String
  status       AnnotationStatus  // ACTIVE | DELETED
}
```

**Tipos Semânticos** (via `tags_json`):

- `HIGHLIGHT` - Destaque simples
- `NOTE` - Nota pessoal
- `QUESTION` - Dúvida
- `STAR` / `IMPORTANT` - Marcação de importância
- `SUMMARY` - Resumo
- `AI_RESPONSE` - Resposta de IA

**Bookmarks**:

```prisma
model bookmarks {
  id           String
  user_id      String
  content_id   String
  page_number  Int
  scroll_pct   Float?
  label        String?
  color        String?
}
```

**Threads**: ✅ Sim, via `annotation_comments`

### 11. Canvas/Moodboard (Connection Circle / Iceberg)

**Estado Atual**: ❌ **Não implementado**

**O que NÃO existe**:

- Componente de canvas visual
- Grafo de conexões entre conceitos
- Moodboard/Iceberg visual
- Relações espaciais entre anotações

**O que pode ser usado**:

- `highlights` com `kind: AREA` para posicionamento espacial
- `tags_json` para categorização
- Criar novo modelo `concept_maps` se necessário

**Recomendação**: Implementar como feature separada usando Konva (já no stack).

### 12. Ações do Usuário que Geram Eventos

**Sistema de Telemetria Existente**:

```prisma
model telemetry_events {
  id          String
  user_id     String
  content_id  String?
  session_id  String?
  event_type  EventType
  event_data  Json
  timestamp   DateTime
}

enum EventType {
  PAGE_VIEW, CONTENT_OPEN, CONTENT_CLOSE,
  HIGHLIGHT_CREATE, HIGHLIGHT_UPDATE, HIGHLIGHT_DELETE,
  NOTE_CREATE, SCROLL, TIME_SPENT,
  SEARCH, DEFINITION_LOOKUP, MODE_CHANGE,
  // ... outros
}
```

**Eventos Implementados**:

- ✅ `selection` → Capturado no frontend (não persiste diretamente)
- ✅ `highlight` → `HIGHLIGHT_CREATE`
- ✅ `note` → `NOTE_CREATE`
- ✅ `open definition` → `DEFINITION_LOOKUP`
- ✅ `scroll` → `SCROLL` (batch)
- ✅ `time_spent` → `TIME_SPENT`
- ✅ `mode_change` → `MODE_CHANGE`

**Batch + Dedupe**:

```typescript
// frontend/hooks/telemetry/use-telemetry.ts
// Backend: services/api/src/telemetry/telemetry.service.ts
private eventBuffer: TelemetryEvent[] = [];
private readonly FLUSH_INTERVAL = 5000;  // 5s
private readonly MAX_BUFFER_SIZE = 100;
```

---

## D) Telemetria e Métricas

### 13. Eventos Existentes

**Eventos Rastreados**:

```typescript
enum EventType {
  // Navegação
  PAGE_VIEW,
  CONTENT_OPEN,
  CONTENT_CLOSE,

  // Interação
  HIGHLIGHT_CREATE,
  HIGHLIGHT_UPDATE,
  HIGHLIGHT_DELETE,
  NOTE_CREATE,
  BOOKMARK_CREATE,
  SCROLL,
  CLICK,
  SEARCH,

  // Aprendizado
  DEFINITION_LOOKUP,
  QUIZ_ATTEMPT,
  GAME_PLAY,
  MODE_CHANGE,

  // Sessão
  SESSION_START,
  SESSION_END,
  TIME_SPENT,
}
```

**Batch + Dedupe**: ✅ **Implementado**

- Buffer de 100 eventos ou 5 segundos
- Dedupe por `(user_id, content_id, event_type, timestamp_window)`
- Flush automático em `onBeforeUnload`

### 14. Flow/Confusion/UI Overload

**Estado Atual**: ✅ **Implementado (Frontend)**

```typescript
// frontend/lib/heuristics/flow-detector.ts
class FlowDetector {
  detectFlow(metrics: {
    dwellTime: number;
    scrollVelocity: number;
    highlightFrequency: number;
    pauseCount: number;
  }): boolean;
}

// frontend/lib/heuristics/confusion-detector.ts
class ConfusionDetector {
  detectConfusion(signals: {
    backtrackCount: number;
    rehighlightCount: number;
    searchFrequency: number;
    dwellTimeVariance: number;
  }): ConfusionLevel; // LOW | MEDIUM | HIGH
}

// frontend/hooks/heuristics/use-flow-detection.ts
const { isInFlow } = useFlowDetection({ contentId, modeConfig, currentPage });
```

**Métricas Calculadas**:

- ✅ **Flow**: Baseado em dwell time, scroll suave, baixa interrupção
- ✅ **Confusion**: Baseado em backtrack, re-highlight, buscas frequentes
- ⚠️ **UI Overload**: Parcialmente (conta intervenções ativas)

**Armazenamento**: ❌ Não persiste no backend (apenas frontend state)

### 15. Métricas Utilizadas

**Métricas Implementadas**:

```prisma
// Progresso de leitura
model reading_progress {
  user_id       String
  content_id    String
  last_page     Int
  last_scroll_pct Float
  updated_at    DateTime
}

// Resultados de jogos
model game_results {
  user_id    String
  content_id String
  game_type  String
  score      Float
  metadata   Json?
  played_at  DateTime
}

// Sessões de leitura
model reading_sessions {
  id                String
  user_id           String
  content_id        String
  started_at        DateTime
  ended_at          DateTime?
  total_time_ms     Int?
  pages_read        Int?
  highlights_count  Int?
}
```

**Métricas Calculadas**:

- ✅ **Conclusão**: `reading_progress.last_page` vs total de páginas
- ✅ **Acertos**: `game_results.score`
- ❌ **SRS**: Não implementado (não há tabela `srs_cards`)
- ✅ **Dwell Time**: Calculado via `telemetry_events` (TIME_SPENT)
- ✅ **Engagement**: Highlights, notas, tempo total

### 16. SessionId e CorrelationId

**Estado Atual**: ✅ **Implementado**

```prisma
model reading_sessions {
  id String @id  // sessionId consistente
}

model telemetry_events {
  session_id String?  // Referência à sessão
}
```

**Frontend**:

```typescript
// Gerado ao abrir conteúdo
const sessionId = uuid();
// Enviado em todos os eventos de telemetria
```

**Backend**:

- ✅ `session_id` em telemetry_events
- ❌ **Não há `correlationId` para tracing distribuído** (Sentry/OpenTelemetry)

**Recomendação**: Adicionar `correlation_id` para rastreamento end-to-end.

---

## E) Backend de Aprendizado

### 17. SRS (Spaced Repetition System)

**Estado Atual**: ❌ **NÃO IMPLEMENTADO**

**O que NÃO existe**:

- Tabela `srs_cards`
- Algoritmo SM-2 ou similar
- Campos: `ease`, `interval`, `dueAt`, `lapses`
- Agendamento de revisões

**O que pode ser usado como base**:

- `game_results` para histórico de acertos
- `reading_progress` para rastreamento
- `content_pedagogical_data.vocabulary_triage` para palavras-chave

**Recomendação**: Implementar como módulo separado:

```prisma
model srs_cards {
  id           String
  user_id      String
  content_id   String
  card_type    String  // VOCAB | CONCEPT | QUESTION
  front        String
  back         String
  ease_factor  Float   @default(2.5)
  interval     Int     @default(1)
  due_at       DateTime
  lapses       Int     @default(0)
  last_review  DateTime?
}
```

### 18. MasteryScore

**Estado Atual**: ❌ **Não implementado formalmente**

**O que existe**:

- `game_results.score` (por jogo individual)
- ❌ Não há agregação por usuário/conteúdo/seção
- ❌ Não há conceito de "mastery" (apenas scores pontuais)

**Recomendação**: Criar tabela de mastery:

```prisma
model user_mastery {
  user_id     String
  content_id  String
  section_id  String?
  concept_id  String?
  score       Float    // 0-100
  confidence  Float    // 0-1
  last_tested DateTime
  attempts    Int
}
```

### 19. Checkpoints (Quizzes)

**Estado Atual**: ✅ **Parcialmente implementado**

```prisma
model assessments {
  id                String
  content_version_id String
  type              String  // "QUIZ" | "CHECKPOINT"
  questions_json    Json
  rubric_json       Json?
  passing_score     Float?
}

model assessment_attempts {
  id            String
  assessment_id String
  user_id       String
  score         Float
  passed        Boolean
  started_at    DateTime
  completed_at  DateTime?
}

model assessment_answers {
  id                    String
  assessment_attempt_id String
  question_id           String
  user_answer           Json
  is_correct            Boolean
  time_spent_seconds    Int?
}
```

**Tipos de Questão** (via `content_pedagogical_data`):

- ✅ MCQ (Multiple Choice) - `quiz_questions`
- ✅ Recall - `free_recall_prompts`
- ⚠️ Feynman - Planejado (não implementado)
- ⚠️ Aplicação - Planejado

**Rubricas**: ✅ Campo `rubric_json` existe (formato livre)

**Correção**:

- ✅ Automática para MCQ (`is_correct` boolean)
- ❌ Não há correção por IA para respostas abertas

### 20. Tier 2 Words / Glossário

**Estado Atual**: ⚠️ **Parcialmente implementado**

**Glossário**:

```prisma
model glossary_cache {
  term       String @id
  definition Json
  created_at DateTime
}
```

**Serviço de Glossário** (G5.3):

```typescript
// services/api/src/glossary/glossary.service.ts
// Prioridade: PubMed → Wikipedia → Wiktionary
getScientificDefinition(term: string): Promise<Definition>
```

**Tier 2 Words**: ❌ Não há catálogo formal

- `content_pedagogical_data.vocabulary_triage` (JSON livre)
- Não há classificação Tier 1/2/3
- Não há morfologia/etimologia

**Recomendação**: Criar tabela de vocabulário:

```prisma
model vocabulary_catalog {
  word       String @id
  tier       Int     // 1, 2, 3
  frequency  Float
  difficulty Float
  morphology Json?
  etymology  String?
  examples   Json?
}
```

---

## F) LangGraph / IA

### 21. Tarefas que Usam LLM

**Implementado**:

- ✅ **Resumo**: Geração de summaries (via OpenAI/Gemini)
- ✅ **Explicação**: Respostas a perguntas (AI chat)
- ✅ **Geração de questões**: `content_pedagogical_data.quiz_questions`
- ⚠️ **Correção**: Planejado (não automático)
- ⚠️ **Tradução**: Planejado (usa `content_versions`)
- ✅ **Prova**: Geração de assessments

**Providers Configurados**:

```typescript
// services/api/src/ai/
- OpenAI (GPT-4)
- Google Generative AI (Gemini)
- Anthropic (Claude)
```

**Não Implementado**:

- ❌ LangGraph para orquestração complexa
- ❌ Chains/Agents estruturados
- ❌ Correção automática de respostas abertas

### 22. Token Budget

**Estado Atual**: ⚠️ **Parcialmente implementado**

```prisma
model provider_usage {
  id                String
  family_id         String?
  user_id           String?
  provider          String   // "OPENAI" | "GEMINI" | "ANTHROPIC"
  model             String
  input_tokens      Int
  output_tokens     Int
  total_cost_cents  Int
  timestamp         DateTime
}
```

**O que existe**:

- ✅ Rastreamento de uso por família/usuário
- ✅ Contagem de tokens (input/output)
- ✅ Custo em centavos
- ❌ **Não há limite por sessão/tenant**
- ❌ Não há bloqueio ao atingir limite
- ❌ Não há ledger detalhado por chamada (apenas agregado)

**Recomendação**: Adicionar:

```prisma
model ai_call_ledger {
  id            String
  user_id       String
  session_id    String?
  provider      String
  model         String
  prompt_tokens Int
  completion_tokens Int
  cost_cents    Int
  purpose       String  // "SUMMARY" | "QUIZ" | "EXPLANATION"
  timestamp     DateTime
}

model tenant_quotas {
  tenant_id     String
  tenant_type   String  // FAMILY | INSTITUTION
  monthly_limit Int     // tokens
  current_usage Int
  reset_at      DateTime
}
```

### 23. RAG (Retrieval-Augmented Generation)

**Estado Atual**: ❌ **NÃO IMPLEMENTADO**

**O que NÃO existe**:

- Vector store (pgvector, Qdrant, Pinecone)
- Chunking de documentos
- Embeddings armazenados
- Semantic search
- Caching de embeddings

**O que existe como base**:

```prisma
model content_chunks {
  id         String
  content_id String
  chunk_text String
  metadata   Json?
  // Não há campo de embedding
}
```

**Recomendação**: Implementar RAG completo:

```prisma
model content_embeddings {
  id          String
  content_id  String
  chunk_id    String?
  embedding   Vector(1536)  // pgvector
  chunk_text  String
  metadata    Json?

  @@index([embedding], type: IVFFlat)
}
```

### 24. HIL (Human-in-the-Loop)

**Estado Atual**: ❌ **Não implementado**

**O que NÃO existe**:

- Workflow de aprovação de conteúdo
- Revisão de questões por professores
- Sistema de moderação
- Flags de "precisa revisão"

**O que pode ser usado**:

- `assessment_attempts` para feedback
- Roles de `TEACHER` para permissões

**Recomendação**: Criar workflow de aprovação:

```prisma
model content_approvals {
  id          String
  content_id  String
  reviewer_id String
  status      ApprovalStatus  // PENDING | APPROVED | REJECTED
  feedback    String?
  reviewed_at DateTime?
}

enum ApprovalStatus {
  PENDING, APPROVED, REJECTED, NEEDS_REVISION
}
```

---

## G) Integração: Onde Cada Coisa "Mora"

### 25. Autoridade de "Modo"

**Estado Atual**: ✅ **Implementado com hierarquia**

```prisma
model contents {
  mode        ContentMode?
  mode_source String?  // 'PRODUCER' | 'USER' | 'HEURISTIC'
  mode_set_by String?  // userId ou 'SYSTEM'
  mode_set_at DateTime?
}
```

**Hierarquia** (implementada no frontend):

```typescript
// frontend/hooks/content/use-content-mode.ts
effectiveMode =
  content.mode_source === "PRODUCER"
    ? content.mode
    : userPreference ?? heuristicMode ?? content.mode;
```

**Prioridade**:

1. **PRODUCER** (criador do conteúdo) - autoridade máxima
2. **USER** (preferência do usuário) - sobrescreve heurística
3. **HEURISTIC** (detectado automaticamente) - fallback

**Quem decide**:

- PRODUCER: Backend (ao criar conteúdo)
- USER: Frontend (botão de seleção de modo)
- HEURISTIC: Frontend (detector baseado em tipo de conteúdo)

### 26. Autoridade de "HardGate" e Cooldown

**Estado Atual**: ⚠️ **Parcialmente implementado (apenas frontend)**

**HardGate** (bloqueante):

```typescript
// frontend/hooks/pedagogical/use-didactic-flow.ts
const { phase } = useDidacticFlow({
  enabled: mode === ContentMode.DIDACTIC,
  onComplete: () => toast.success("Fluxo concluído!"),
});

// Se phase === 'PRE', bloqueia leitura até completar ativação
```

**Cooldown**:

```typescript
// frontend/hooks/pedagogical/use-interventions.ts
const { shouldShow, config } = useInterventions({
  contentId,
  mode,
  isInFlow,
});

// config.interventionCooldownMs (frontend only)
```

**Problema**: ❌ **Tudo no frontend - pode ser burlado**

**Recomendação**: Mover para backend:

```prisma
model user_intervention_state {
  user_id            String
  content_id         String
  last_intervention  DateTime
  cooldown_until     DateTime?
  phase              String?  // PRE | DURING | POST
  is_blocked         Boolean
}
```

**Autoridade Recomendada**:

- **HardGate**: Backend (valida antes de retornar conteúdo)
- **Cooldown**: Backend (calcula e retorna `can_show_intervention`)

### 27. Políticas Configuráveis

**Estado Atual**: ⚠️ **Parcialmente implementado**

**Por Tenant (Família)**:

```prisma
model family_policies {
  family_id               String
  learner_user_id         String
  timebox_default_min     Int
  daily_min_minutes       Int
  daily_review_cap        Int
  co_reading_days         Int[]
  co_reading_time         String?
  tool_words_gate_enabled Boolean
  privacy_mode            PrivacyMode
}
```

**O que NÃO é configurável**:

- ❌ Políticas por faixa etária
- ❌ Políticas por disciplina/assunto
- ❌ Políticas de intervenção pedagógica
- ❌ Limites de IA por tenant

**Recomendação**: Criar sistema de políticas flexível:

```prisma
model pedagogical_policies {
  id                  String
  tenant_type         String  // FAMILY | INSTITUTION | GLOBAL
  tenant_id           String?
  age_range_min       Int?
  age_range_max       Int?
  subject             String?

  // Políticas
  intervention_config Json
  ai_limits           Json
  content_filters     Json
  assessment_rules    Json
}
```

---

## Resumo Executivo

### ✅ O que está implementado e funciona bem:

1. **Content Types** diversificados com extração de texto
2. **Anchoring** robusto (text + region + timestamp)
3. **Telemetria** com batch e dedupe
4. **Content Modes** com hierarquia de autoridade
5. **Glossário** com cache e APIs externas
6. **Assessments** básicos com MCQ
7. **Multi-tenancy** (família, instituição, grupos)

### ⚠️ O que está parcialmente implementado:

1. **Seções/TOC** - Existe mas não é sistemático
2. **Versionamento** - Apenas para adaptações, não para original
3. **Flow/Confusion** - Detectado no frontend, não persiste
4. **Token Budget** - Rastreado mas sem limites
5. **Políticas** - Apenas para famílias, não extensível

### ❌ O que NÃO está implementado:

1. **SRS** (Spaced Repetition)
2. **MasteryScore** agregado
3. **RAG** (Vector search, embeddings)
4. **HIL** (Human-in-the-Loop)
5. **Tier 2 Words** catalog
6. **Copyright policies** formais
7. **Correlation ID** para tracing
8. **HardGate/Cooldown** no backend
9. **Canvas/Moodboard** visual
10. **Políticas configuráveis** por idade/disciplina

---

## Próximos Passos Recomendados

### Prioridade Alta (P0):

1. Mover **HardGate/Cooldown** para backend
2. Implementar **SRS básico** para vocabulário
3. Adicionar **MasteryScore** agregado
4. Formalizar **políticas de copyright**

### Prioridade Média (P1):

5. Implementar **RAG** com pgvector
6. Criar **Tier 2 Words** catalog
7. Adicionar **HIL** workflow
8. Sistematizar **seções/TOC**

### Prioridade Baixa (P2):

9. Canvas/Moodboard visual
10. Correlation ID para tracing
11. Políticas por idade/disciplina
12. Versionamento completo de conteúdo

---

**Documento mantido por**: Equipe de Desenvolvimento  
**Última revisão**: Janeiro 2026  
**Próxima revisão**: Após implementação de P0
