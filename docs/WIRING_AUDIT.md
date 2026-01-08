# Auditoria de Wiring: Frontend ↔ Backend

Este documento lista as conexões e desconexões entre a interface do usuário (Frontend) e as capacidades do Backend/API.

---

## ✅ Itens Corrigidos & Conectados (Jan 2026)

| Componente       | Feature                     | Status           | Detalhe                                                                                                              |
| :--------------- | :-------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| **AIChatPanel**  | **Quick Replies**           | ✅ **Conectado** | Botões de resposta rápida renderizados corretamente e acionando API.                                                 |
| **AIChatPanel**  | **Structured Output**       | ✅ **Conectado** | Componentes como `SentenceAnalysisView` renderizam JSONs complexos.                                                  |
| **OpsCoach**     | **Prompt Interpolation**    | ✅ **Conectado** | Prompts agora injetam dados dinâmicos: `{LEARNER}` (User), `{DAYS}` (SRS), `{XP}` (Gamification), `{MIN}` (Session). |
| **SRS**          | **Next Review Calculation** | ✅ **Conectado** | Variável `{DAYS}` expõe lógica de revisão espaçada diretamente nos prompts do chat.                                  |
| **Gamification** | **XP & Stats**              | ✅ **Conectado** | `GameDashboard` consome `/api/games/progress`. Backend e Frontend linkados. (Visualização simplificada aceita).      |
| **Gamification** | **XP & Stats**              | ✅ **Conectado** | `GameDashboard` consome `/api/games/progress`. Backend e Frontend linkados. (Visualização simplificada aceita).      |
| **Analytics**    | **Real Data**               | ✅ **Conectado** | Dashboard consome `session_outcomes` e `daily_activities`. Score de Compreensão visível.                             |

---

## 1. Gaps de Acionamento (Frontend → Backend)

Elementos de UI que existem mas não chamam o Backend corretamente.

| Componente            | Feature            | Status             | Detalhe Técnico                                                                                                                      |
| :-------------------- | :----------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **TextSelectionMenu** | **Transfer Tools** | ⚙️ **Intencional** | Opção de design para não poluir o menu. Ferramentas complexas (`Analogia`, `Morfologia`) devem ser acionadas via Chat/Quick Replies. |
| **NoteCard**          | **AI Enhancement** | ⚠️ **Parcial**     | Botão "AI" nas notas desconectado de intents ricos (`PKM`, `TIER2`).                                                                 |
| **Dashboard**         | **Real Analytics** | ✅ **Conectado**   | Gráficos usam mocks. Backend tem tabela `session_outcomes` populada (score, frustração), mas Frontend não consome.                   |

## 2. Capacidades Invisíveis (Backend → Frontend)

Recursos poderosos do Backend que chegam ao usuário de forma indireta (texto/chat) ou não chegam.

| Serviço            | Feature                 | Status              | Detalhe Técnico                                                                                                                             |
| :----------------- | :---------------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Transfer Graph** | **Pedagogical Tools**   | ✅ **Via Chat**     | Ferramentas (`SCAFFOLDING`, `FEEDBACK`) funcionam e entregam valor via texto no chat.                                                       |
| **Resurrection**   | **Context Recovery**    | ✅ **Via Texto**    | Backend sabe onde usuário parou e avisa via prompt de abertura. Sem indicador visual de progresso.                                          |
| **Gating Service** | **Comprehension Score** | 🛑 **Desconectado** | Backend calcula `comprehension_score` (tabela `session_outcomes`), mas variável `{COMP}` ainda não está ativa nos prompts (mvp: undefined). |

---

## 3. Plano de Correção (Próximos Passos)

### Prioridade 1: Unificação de Dashboards (Opcional)

- **Ação:** Trazer um resumo de XP/Badge do `GameDashboard` para o `OpsDashboard`.
- **Efeito:** Usuário vê progresso de gamificação na tela inicial.

### Prioridade 3: Conectar Analytics Real

- **Ação:** Ligar gráficos do Dashboard à tabela `session_outcomes` e `daily_activities`.
- **Efeito:** Mostrar dados reais de estudo para o usuário.
