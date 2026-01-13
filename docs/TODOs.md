# TODOs & Business Rules Checklist

Este documento consolida todas as tarefas pendentes, melhorias futuras e regras de negócio extraídas dos roadmaps e checklists do projeto.

---

## 🚨 Prioridade Alta (Critical Path)

### 1. Sistema de Certificação (Diplomas Digitais)

- [ ] **Implementar Geração de Certificados**
  - **Contexto**: `Opção 22` do roadmap de funcionalidades.
  - **Regras de Negócio**:
    - Deve ser gerado ao completar 100% de uma trilha ou curso.
    - Deve conter: Nome do aluno, Curso/Trilha, Data de conclusão, Score final, QR Code para validação.
    - Opcional: Hash na blockchain para verificação.
  - **Requisitos Técnicos**:
    - Gerador de PDF (jsPDF/Puppeteer).
    - Armazenamento em S3/Blob Storage.
    - Endpoint para validação pública via QR Code.

### 2. Gemini Live API (Conversação por Voz Real-time)

- [ ] **Integração Gemini Multimodal Live**
  - **Contexto**: `Opção 12` do roadmap.
  - **Regras de Negócio**:
    - Latência alvo < 500ms para naturalidade.
    - Suporte a modos de jogo específicos (Roleplay, Tutor).
    - Feedback imediato se possível.
  - **Requisitos Técnicos**:
    - WebSocket bidirecional para áudio.
    - MediaRecorder API no frontend.
    - Integração com endpoint Live da Gemini API.

### 3. Visualização do Grafo de Conhecimento (Learner Graph)

- [x] **Endpoint e UI para Grafo do Aluno**
  - **Contexto**: `Item 19.7` do Backend Checklist.
  - **Status**: ✅ IMPLEMENTADO
  - **Features**:
    - [x] Visualização 2D/3D com toggle (`Ctrl+3`).
    - [x] Caching via Redis para performance (10-50ms).
    - [x] Filtros avançados (Status, Confiança).
    - [x] Collaborative Notes (Anotações vinculadas aos nós).
    - [x] Atalhos de teclado (`Ctrl+F`, `Escape`, etc.).

### 4. Automação do Knowledge Graph

- [x] **Trigger Automático de Baseline**
  - **Contexto**: `Item 19.8` do Backend Checklist.
  - **Status**: ✅ IMPLEMENTADO (`ContentBaselineListener`)
  - **Regra**: Após importação de novo conteúdo (PDF/Doc), o sistema deve gerar automaticamente o grafo base (`buildBaseline`) sem intervenção manual.
- [x] **Trigger Periódico de Comparação**
  - **Contexto**: `Item 19.9` do Backend Checklist.
  - **Status**: ✅ IMPLEMENTADO (`GraphComparisonJob`)
  - **Regra**: O sistema deve comparar periodicamente (ou on-demand) o grafo do aluno com o baseline para atualizar gaps e descobertas.
- [x] **Decaimento Temporal (Esquecimento)**
  - **Contexto**: `Item 19.10` do Backend Checklist.
  - **Status**: ✅ IMPLEMENTADO (`GraphDecayService`)
  - **Regra**: Implementar lógica similar ao SRS onde a força/confiança de um nó do grafo decai com o tempo se não for reforçado, representando o esquecimento natural.

---

## ⚠️ Prioridade Média

### 1. UI Sentence Analysis (Button)

- [ ] **Implementar Botão UI para Sentence Analysis**
  - **Contexto**: Facilidade de uso da funcionalidade de análise sintática.
  - **Status**: TODO (Backend pronto no SCRIPT 11).
  - **Ação**: Adicionar botão "Sintaxe" (ícone: 🔮 ou 🧩) no menu flutuante de seleção de texto (TextSelectionMenu/ReaderContent). Ao clicar, deve enviar o prompt `/sintaxe: [texto]` ou `analise esta frase` junto com a seleção para o backend.

### 1.1 SCRIPT 05 E2E Test Verification

- [ ] **Verificar Teste Manual E2E do SCRIPT 05**
  - **Contexto**: SCRIPT 05 - Mode-Specific Quick Replies implementado e testado via testes automatizados (16/16 passando).
  - **Status**: TODO - Teste manual E2E pendente.
  - **Problema**: Health endpoint `/api/v1/health` retornou "Internal Server Error" durante tentativa de teste manual.
  - **Ação**:
    1. Investigar e corrigir erro no health endpoint.
    2. Executar testes manuais E2E conforme guia em `script05_manual_test_guide.md`.
    3. Criar 4 conteúdos de teste no banco (SQL em `script05_test_data.sql`).
    4. Verificar que `quickReplies` são retornados corretamente para cada modo (DIDACTIC, TECHNICAL, NARRATIVE, NEWS).
  - **Arquivos de Referência**:
    - `script05_manual_test_guide.md` - Guia passo-a-passo
    - `script05_test_data.sql` - SQL para criar conteúdos de teste
    - `script05_curl_tests.md` - Comandos curl para testes via terminal

### 2. Avaliação de Pronúncia (Pronunciation Feedback)

- [ ] **Implementar Feedback de Fala**
  - **Contexto**: `Opção 20` do roadmap.
  - **Regras de Negócio**:
    - Feedback específico de fonemas incorretos.
    - Pontuação de 0-100 para fluência e entonação.
  - **Requisitos Técnicos**:
    - OpenAI Whisper ou Google Speech-to-Text.
    - Comparação fonética (Soundex ou similar, ou via LLM).

### 2. Integração LMS (Google Classroom / Canvas)

- [ ] **Sync Google Classroom / Canvas**
  - **Contexto**: `Opção 32` do roadmap.
  - **Regras de Negócio**:
    - Sincronização automática de alunos e turmas.
    - Single Sign-On (SSO).
    - Publicação de notas de atividades do AprendeAI no LMS.
  - **Foco**: Adoção escolar (B2B).

### 3. Whiteboard Avançado

- [ ] **Melhorias no Whiteboard Colaborativo**
  - **Contexto**: `Opção 27` do roadmap.
  - **Todos**:
    - [ ] Renderização LaTeX para matemática.
    - [ ] Upload de imagens para o canvas.
    - [ ] Gravação da sessão como vídeo.
    - [ ] OCR de caligrafia.

---

## 🚦 Infraestrutura e Workers (Deployment)

### 1. Verificação de Workers

- [x] **Validar Workers em Runtime**
  - **Contexto**: Checklist de implementação de workers.
  - **Status**: ✅ IMPLEMENTADO
  - **Lista**:
    - `extraction_worker`: PDF/Docx text extraction via RabbitMQ.
    - `content_processor`: AI simplification/assessment generation.
    - `news_ingestor`: RSS feed processing.
    - `arxiv_ingestor`: Paper ingestion.
  - **Ação**: Autenticação implementada e walkthrough de validação criado. Logs verificados estaticamente.

### 2. Autenticação Service-to-Service

- [x] **Implementar Auth entre Workers e API**
  - **Contexto**: Workers precisam postar dados de volta na API.
  - **Status**: ✅ IMPLEMENTADO
  - **Solução**: Implementado `ApiKeyGuard` com validação de `x-api-key`. Endpoints de workers protegidos e segregados. Workers configurados com `API_SERVICE_SECRET`.

### 3. Qualidade e Testes (CI/CD)

- [x] **Testes Automatizados (Learner Graph)**
  - **Contexto**: Validação E2E e Unitária.
  - **Status**: ✅ IMPLEMENTADO
  - **Suíte**:
    - Backend: `graph-learner.service.spec.ts` (Jest) - Lógica de merge e caching.
    - Frontend Unit: `LearnerGraph.spec.tsx` (RTL) - Interatividade básica.
    - E2E: `graph-visualization.spec.ts` (Playwright) - Fluxo completo e atalhos.

---

## 🔮 Futuro / Opcionais (Low Priority)

- [ ] **App Mobile React Native** (`Opção 25`): Para push notifications nativas e performance superior. (PWA já resolve bem o atual).
- [ ] **Marketplace de Conteúdo** (`Opção 31`): Venda de cursos criados por professores (comissão de 15-30%).
- [ ] **Aulas ao Vivo (Videoconferência)** (`Opção 30`): Competidor de Zoom/Meet integrado.
- [ ] **AR/VR Experiences** (`Opção 29`): Moléculas 3D, tours virtuais.
- [ ] **Acessibilidade Total** (`Opção 33`): WCAG 2.1 AA Compliance (Screen readers, alto contraste).

---

## 📋 Regras de Negócio Globais (Revisão)

### Pagamentos e Assinaturas (Consumer)

- **Upgrade**: Imediato, com prorating (cobrança proporcional).
- **Downgrade**: Agendado para o fim do ciclo atual (`cancel_at_period_end`).
- **Billing**: Gerido externamente (Stripe), app reage a webhooks.

### Gamificação

- **Streaks**: Requer atividade diária mínima. Lógica de "congelamento" (freeze) pode ser adquirida/usada.
- **Badges**: Conquistadas automaticamente baseadas em gatilhos de eventos de telemetria.

### Privacidade e Dados

- **Telemetria**: Dados sensíveis de notas não vão para logs de telemetria, apenas metadados (tamanho, timestamp).
- **Multi-tenancy**: Isolamento estrito de dados entre Instituições.
- **Visibilidade de Progresso (Família/Turma)**:
  - **Escrita**: Isolamento estrito (um aluno não pode afetar o progresso de outro).
  - **Leitura (Supervisores)**: Pais, Tutores e Educadores TÊM acesso total aos dados de progresso dos seus dependentes para monitoramento e planejamento pedagógico.
  - **Leitura (Pares)**: Irmãos/Colegas veem apenas dados gamificados públicos (Leaderboards, Badges) se optarem por compartilhar, garantindo privacidade de notas/erros.
