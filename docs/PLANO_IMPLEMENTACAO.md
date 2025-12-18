# Plano de Implementação

O desenvolvimento do monorepo AprendeAI segue as seguintes fases:

## Fase 1: Skeleton e Infraestrutura (Concluído ✅)

- [x] Estruturação do Monorepo.
- [x] Configuração do Docker e Docker Compose.
- [x] Definição do Schema do Banco de Dados (Prisma).
- [x] Criação dos serviços vazios (API, AI, Workers, Frontend).

## Fase 2: Serviços Core (Concluído ✅)

- [x] **API**: Implementar autenticação (Login/Register).
- [x] **API**: CRUD de Instituições e Turmas.
- [x] **API**: CRUD de Conteúdos e Versões.
- [x] **API**: Sistema de Avaliações (Assessments).

## Fase 3: Ingestão e IA (Concluído ✅)

- [x] **Workers**: Implementar busca de notícias (RSS Ingestor).
- [x] **Workers**: Implementar integração com arXiv.
- [x] **IA**: Implementar endpoint `/simplify` com LangChain.
- [x] **IA**: Implementar endpoint `/generate-assessment`.
- [x] **Worker**: `content_processor` consumindo filas e chamando IA.
- [x] **Integração**: Fluxo completo Ingestão -> IA -> Banco.

## Fase 4: Frontend e Experiência do Usuário (Concluído MVP ✅)

- [x] **Infra**: Configuração do Next.js, Tailwind, Axios, Zustand.
- [x] **Auth**: Tela de Login e Proteção de Rotas.
- [x] **Dashboard**: Layout principal e Sidebar.
- [x] **Biblioteca**: Listagem de conteúdos.
- [x] **Leitor**: Visualização de texto, abas de versões (Original/Simplificado).
- [x] **Interação**: Botões para disparar Simplificação e Avaliação via IA.

## Fase 5: Gamificação e Hábitos (Concluído ✅)

### 5.1 Banco de Dados e Backend

- [x] **DB**: Criar tabelas `Streak`, `DailyGoal`, `DailyActivity`, `Badge`, `UserBadge`, `Course`, `Lesson`.
- [x] **API**: Endpoint `/gamification/dashboard` (agregador de status).
- [x] **API**: Lógica de Check-in, Cálculo de Streak e Heartbeat.
- [x] **API**: Sistema de Conquistas (Badges) e Metas.

### 5.2 Frontend (Componentes e Telas)

- [x] **UI**: Componentes `ProgressBar`, `StreakCard`, `DailyGoalCard`, `BadgeToast`.
- [x] **Dashboard**: Atualizar para exibir progresso, meta e streak.
- [x] **Curso/Aula**: Telas de navegação e player de aula (Simplificado no Leitor).
- [x] **Integração**: Conectar eventos de progresso (`/progress`) e conclusão (`/complete`).

## Fase 6: Refinamento e Analytics (Concluído ✅)

### 6.1 Banco de Dados e Backend

- [x] **DB**: Criar tabela `UserVocabulary` (palavra, nível de domínio).
- [x] **DB**: Adicionar `tags` ou `skills` em `AssessmentQuestion` para categorizar erros (ex: Gramática, Interpretação).
- [x] **API**: Endpoint `/analytics/progress` (pontos fortes/fracos).
- [x] **API**: Endpoint `/vocabulary` (lista de palavras dominadas).

### 6.2 Frontend (Analytics)

- [x] **UI**: Página `/dashboard/progress`.
- [x] **UI**: Gráfico de Barras para Pontos Fortes vs Fracos.
- [x] **UI**: Nuvem de Vocabulário Dominado.
- [x] **Integração**: Conectar aos novos endpoints de analytics.
