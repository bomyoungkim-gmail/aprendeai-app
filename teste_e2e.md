# Roteiro de Testes E2E - Validação Manual

## Visão Geral

Este documento contém o roteiro completo de testes End-to-End (E2E) para validação manual de todas as funcionalidades implementadas no AprendeAI. Os testes estão organizados por Sprint e feature.

---

## Pré-requisitos

### Ambiente de Teste

- **Backend**: `npm run start:dev` em `services/api`
- **Frontend**: `npm run dev` em `frontend`
- **Navegador**: Chrome/Chromium (recomendado para consistência)
- **Dados de Teste**: Conta de usuário válida

### Comandos para Executar Testes Automatizados

```bash
# Todos os testes E2E
npx playwright test

# Testes específicos por Sprint
npx playwright test tests/e2e/sprint1-cornell-persistence.spec.ts
npx playwright test tests/e2e/sprint2-ux-analytics.spec.ts
npx playwright test tests/e2e/sprint3-session-flow.spec.ts
npx playwright test tests/e2e/sprint4-review-srs.spec.ts
npx playwright test tests/e2e/sprint5-modes.spec.ts
npx playwright test tests/e2e/sprint6-complete.spec.ts

# Modo UI (interativo)
npx playwright test --ui

# Modo headed (visualizar navegador)
npx playwright test --headed

# Modo debug
npx playwright test --debug
```

---

## Sprint 1: Cornell Notes Persistence

### Teste 1.1: Autosave da Coluna de Cues

**Objetivo**: Verificar que as cues são salvas automaticamente

**Passos**:

1. Fazer login na aplicação
2. Navegar para `/reader/[contentId]`
3. Abrir a aba "Favoritos" (Cues)
4. Adicionar uma nova cue: "Qual é o conceito principal?"
5. Aguardar 2 segundos (debounce)
6. Recarregar a página (F5)
7. Abrir novamente a aba "Favoritos"

**Resultado Esperado**: A cue adicionada deve estar presente após o reload

---

### Teste 1.2: Persistência do Summary

**Objetivo**: Verificar que o resumo é salvo e recuperado

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Abrir a aba "Síntese"
3. Digitar no campo de resumo: "Este artigo discute..."
4. Aguardar 2 segundos
5. Recarregar a página
6. Abrir a aba "Síntese"

**Resultado Esperado**: O texto do resumo deve estar presente

---

### Teste 1.3: Edições Concorrentes

**Objetivo**: Verificar que múltiplas seções podem ser editadas simultaneamente

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Adicionar uma cue: "Pergunta 1"
3. Adicionar uma nota no stream
4. Editar o summary: "Resumo inicial"
5. Aguardar salvamento
6. Recarregar a página

**Resultado Esperado**: Todas as edições devem estar presentes

---

### Teste 1.4: Indicador de Save Status

**Objetivo**: Verificar que o indicador de status é exibido corretamente

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Observar o header superior
3. Adicionar uma nova cue
4. Observar o indicador mudar para "Salvando..."
5. Aguardar conclusão

**Resultado Esperado**:

- Indicador mostra "Salvando..." durante o save
- Indicador mostra "Salvo" após conclusão
- Timestamp "Última alteração" é atualizado

---

### Teste 1.5: Tratamento de Erros

**Objetivo**: Verificar retry em caso de falha

**Passos**:

1. Desconectar a internet (modo offline)
2. Navegar para `/reader/[contentId]`
3. Adicionar uma cue
4. Observar indicador de erro
5. Reconectar internet
6. Aguardar retry automático

**Resultado Esperado**: Sistema deve fazer retry e salvar com sucesso

---

## Sprint 2: UX & Analytics

### Teste 2.1: Navegação Responsiva

**Objetivo**: Verificar que a navegação funciona em diferentes tamanhos de tela

**Passos**:

1. Redimensionar janela para mobile (375px)
2. Navegar pela aplicação
3. Testar menu hamburguer
4. Redimensionar para tablet (768px)
5. Redimensionar para desktop (1920px)

**Resultado Esperado**: Interface se adapta corretamente a cada tamanho

---

### Teste 2.2: Dark Mode

**Objetivo**: Verificar alternância entre temas

**Passos**:

1. Fazer login
2. Clicar no botão de tema (lua/sol)
3. Verificar mudança de cores
4. Recarregar página

**Resultado Esperado**:

- Tema muda instantaneamente
- Preferência é persistida

---

### Teste 2.3: Analytics Dashboard

**Objetivo**: Verificar exibição de métricas

**Passos**:

1. Navegar para `/analytics`
2. Verificar KPIs no topo:
   - Usuários Ativos
   - Conteúdos Lidos
   - Taxa de Conclusão
   - Tempo Médio
3. Verificar gráfico de uso por modo
4. Verificar heatmap de confusão

**Resultado Esperado**: Todas as métricas são exibidas corretamente

---

### Teste 2.4: Filtro de Data Range

**Objetivo**: Verificar filtro de período

**Passos**:

1. Navegar para `/analytics`
2. Clicar no seletor de período
3. Selecionar "Últimos 7 dias"
4. Verificar atualização dos dados
5. Selecionar "Último mês"

**Resultado Esperado**: Dados são filtrados corretamente

---

### Teste 2.5: Export CSV

**Objetivo**: Verificar exportação de dados

**Passos**:

1. Navegar para `/analytics`
2. Clicar em "Exportar CSV"
3. Verificar download do arquivo
4. Abrir arquivo CSV

**Resultado Esperado**: Arquivo contém dados formatados corretamente

---

## Sprint 3: Session Flow

### Teste 3.1: Fluxo Completo de Sessão

**Objetivo**: Verificar ciclo completo de uma sessão de estudo

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Ler conteúdo por 5 minutos
3. Adicionar highlights e notas
4. Completar um bloco de leitura
5. Responder quiz de checkpoint
6. Preencher summary
7. Finalizar sessão
8. Verificar estatísticas de conclusão

**Resultado Esperado**: Todos os passos funcionam sem erros

---

### Teste 3.2: Validação de DoD (Definition of Done)

**Objetivo**: Verificar que não é possível finalizar sem completar requisitos

**Passos**:

1. Iniciar sessão
2. Ler conteúdo
3. Tentar finalizar bloco SEM preencher summary
4. Verificar mensagem de erro
5. Preencher summary
6. Finalizar com sucesso

**Resultado Esperado**: Sistema bloqueia finalização sem summary

---

### Teste 3.3: Quiz de Checkpoint

**Objetivo**: Verificar funcionamento do quiz

**Passos**:

1. Completar um bloco de leitura
2. Responder quiz apresentado
3. Verificar feedback imediato
4. Verificar pontuação
5. Continuar para próximo bloco

**Resultado Esperado**: Quiz funciona e fornece feedback

---

### Teste 3.4: Estatísticas de Sessão

**Objetivo**: Verificar exibição de stats ao final

**Passos**:

1. Completar uma sessão inteira
2. Verificar tela de conclusão
3. Verificar métricas:
   - Tempo total
   - Blocos completados
   - Pontuação do quiz
   - Highlights criados

**Resultado Esperado**: Todas as estatísticas são exibidas

---

## Sprint 4: Review SRS (Spaced Repetition System)

### Teste 4.1: Fila de Revisão

**Objetivo**: Verificar exibição de itens para revisão

**Passos**:

1. Navegar para `/review`
2. Verificar lista de vocabulário para revisão
3. Verificar contagem de itens
4. Verificar próxima data de revisão

**Resultado Esperado**: Itens são listados corretamente

---

### Teste 4.2: Revisão com Resultado OK

**Objetivo**: Verificar progressão normal

**Passos**:

1. Iniciar revisão de um item
2. Responder corretamente
3. Clicar em "OK"
4. Verificar próxima data de revisão
5. Verificar que item avançou de estágio

**Resultado Esperado**: Item progride para próximo estágio (D1 → D3 → D7)

---

### Teste 4.3: Revisão com Resultado FAIL

**Objetivo**: Verificar reset para D1

**Passos**:

1. Iniciar revisão de um item em D7
2. Responder incorretamente
3. Clicar em "FAIL"
4. Verificar que item voltou para D1

**Resultado Esperado**: Item reseta para D1

---

### Teste 4.4: Revisão com Resultado EASY

**Objetivo**: Verificar pulo de estágio

**Passos**:

1. Iniciar revisão de um item em D1
2. Responder corretamente
3. Clicar em "EASY"
4. Verificar que item pulou para D7

**Resultado Esperado**: Item pula estágios

---

### Teste 4.5: Daily Cap

**Objetivo**: Verificar limite diário de revisões

**Passos**:

1. Completar 20 revisões
2. Tentar fazer mais revisões
3. Verificar mensagem de limite atingido

**Resultado Esperado**: Sistema respeita limite de 20 revisões/dia

---

### Teste 4.6: Navegação entre Itens

**Objetivo**: Verificar navegação na fila

**Passos**:

1. Iniciar revisão
2. Usar botões "Anterior" e "Próximo"
3. Verificar navegação suave
4. Verificar contador de progresso

**Resultado Esperado**: Navegação funciona corretamente

---

### Teste 4.7: Summary de Conclusão

**Objetivo**: Verificar resumo ao final da sessão

**Passos**:

1. Completar todas as revisões disponíveis
2. Verificar tela de conclusão
3. Verificar estatísticas:
   - Total revisado
   - Acertos
   - Erros
   - Tempo total

**Resultado Esperado**: Summary é exibido com dados corretos

---

## Sprint 1: Content Mode & Telemetry

### Teste 1.1: Content Mode Indicator

**Objetivo**: Verificar exibição do indicador de modo

**Passos**:

1. Fazer login na aplicação
2. Navegar para `/reader/[contentId]`
3. Observar o header superior
4. Localizar o indicador de modo (badge colorido)
5. Verificar que mostra o modo correto (ex: "NARRATIVE")

**Resultado Esperado**: Indicador é exibido com cor e texto corretos

---

### Teste 1.2: Content Mode Selector

**Objetivo**: Verificar mudança manual de modo

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Clicar no indicador de modo
3. Selecionar modo diferente (ex: DIDACTIC)
4. Verificar que UI atualiza
5. Verificar que comportamentos mudam

**Resultado Esperado**:

- Modo muda instantaneamente
- UI reflete novo modo
- Telemetria registra `CHANGE_MODE`

---

### Teste 1.3: Telemetry - View Content

**Objetivo**: Verificar tracking de visualização

**Passos**:

1. Abrir DevTools → Network
2. Navegar para `/reader/[contentId]`
3. Filtrar por `/telemetry/batch`
4. Verificar payload do request

**Resultado Esperado**:

- Request contém evento `VIEW_CONTENT`
- Payload inclui `contentId`, `mode`, `timestamp`

---

### Teste 1.4: Telemetry - Scroll Depth

**Objetivo**: Verificar tracking de scroll

**Passos**:

1. Abrir conteúdo longo
2. Rolar até 50% da página
3. Aguardar 2 segundos
4. Verificar Network tab

**Resultado Esperado**: Evento `SCROLL_DEPTH` com `depth: 50`

---

### Teste 1.5: Telemetry - Time Spent

**Objetivo**: Verificar tracking de tempo ativo

**Passos**:

1. Abrir conteúdo
2. Permanecer ativo (movendo mouse) por 30 segundos
3. Verificar Network tab

**Resultado Esperado**: Evento `TIME_SPENT` com duração aproximada

---

### Teste 1.6: Telemetry Batching

**Objetivo**: Verificar agrupamento de eventos

**Passos**:

1. Realizar múltiplas ações rapidamente:
   - Scroll
   - Criar highlight
   - Adicionar nota
2. Verificar Network tab
3. Contar requests para `/telemetry/batch`

**Resultado Esperado**:

- Eventos são agrupados (não 1 request por evento)
- Batch enviado a cada 10 segundos ou 50 eventos

---

## Sprint 2: UX Core & Analytics

### Teste 2.1: Adaptive UI - Auto-Hide

**Objetivo**: Verificar ocultação automática da UI

**Passos**:

1. Navegar para conteúdo em modo NARRATIVE
2. Não mover o mouse por 2 segundos
3. Verificar que header e sidebar desaparecem
4. Mover o mouse
5. Verificar que UI reaparece

**Resultado Esperado**: UI se oculta e reaparece suavemente

---

### Teste 2.2: Undo/Redo - Highlights

**Objetivo**: Verificar desfazer/refazer highlights

**Passos**:

1. Criar um highlight
2. Pressionar `Ctrl+Z`
3. Verificar que highlight desaparece
4. Pressionar `Ctrl+Shift+Z`
5. Verificar que highlight reaparece

**Resultado Esperado**: Undo/Redo funciona corretamente

---

### Teste 2.3: Undo/Redo - Notes

**Objetivo**: Verificar desfazer/refazer notas

**Passos**:

1. Criar uma nota no stream
2. Pressionar `Ctrl+Z`
3. Verificar que nota é removida
4. Pressionar `Ctrl+Shift+Z`
5. Verificar que nota retorna

**Resultado Esperado**: Undo/Redo funciona para notas

---

### Teste 2.4: Undo/Redo - Limite de Stack

**Objetivo**: Verificar limite de histórico

**Passos**:

1. Criar 25 highlights (mais que o limite de 20)
2. Pressionar `Ctrl+Z` 25 vezes
3. Verificar que apenas os últimos 20 são desfeitos

**Resultado Esperado**: Stack respeita limite de 20 ações

---

### Teste 2.5: Table of Contents (TOC)

**Objetivo**: Verificar navegação por TOC

**Passos**:

1. Navegar para conteúdo com seções
2. Abrir aba "Sumário" na sidebar
3. Verificar lista de seções
4. Clicar em uma seção
5. Verificar navegação para a seção

**Resultado Esperado**: TOC permite navegação rápida

---

### Teste 2.6: TOC - Highlight de Seção Atual

**Objetivo**: Verificar indicação de seção ativa

**Passos**:

1. Abrir TOC
2. Rolar pelo conteúdo
3. Observar TOC
4. Verificar que seção atual é destacada

**Resultado Esperado**: Seção ativa é visualmente destacada

---

### Teste 2.7: Analytics - Daily Reading Time

**Objetivo**: Verificar gráfico de tempo de leitura

**Passos**:

1. Navegar para `/analytics`
2. Localizar gráfico "Tempo de Leitura Diário"
3. Verificar barras para últimos 7 dias
4. Verificar tooltips ao passar mouse

**Resultado Esperado**: Gráfico exibe dados corretamente

---

### Teste 2.8: Analytics - Mode Distribution

**Objetivo**: Verificar gráfico de distribuição de modos

**Passos**:

1. Navegar para `/analytics`
2. Localizar gráfico de pizza "Distribuição por Modo"
3. Verificar fatias coloridas
4. Verificar percentuais

**Resultado Esperado**: Gráfico mostra distribuição de uso

---

## Sprint 3: Heuristics & Advanced Persistence

### Teste 3.1: Flow State Detection

**Objetivo**: Verificar detecção de estado de flow

**Passos**:

1. Navegar para conteúdo
2. Ler continuamente por 3 minutos sem interrupções
3. Observar indicador de flow (✨ sparkle)
4. Verificar que intervenções são bloqueadas

**Resultado Esperado**:

- Indicador de flow aparece
- Sistema não interrompe durante flow

---

### Teste 3.2: Confusion Detection

**Objetivo**: Verificar detecção de confusão

**Passos**:

1. Navegar para conteúdo
2. Rolar rapidamente para cima e para baixo (5+ vezes em 10s)
3. Verificar que sistema detecta confusão
4. Verificar oferta de ajuda

**Resultado Esperado**: Sistema oferece suporte quando detecta confusão

---

### Teste 3.3: Resume Logic - Toast

**Objetivo**: Verificar toast de retomada

**Passos**:

1. Navegar para conteúdo
2. Rolar até página 5
3. Aguardar salvamento automático
4. Fechar e reabrir o conteúdo
5. Verificar toast "Continuar de onde parou?"

**Resultado Esperado**: Toast aparece com opção de retomar

---

### Teste 3.4: Resume Logic - Navigation

**Objetivo**: Verificar navegação ao aceitar retomada

**Passos**:

1. Com toast de retomada visível
2. Clicar em "Continuar"
3. Verificar que navega para última posição
4. Verificar scroll correto

**Resultado Esperado**: Navegação para posição salva funciona

---

### Teste 3.5: Bookmarks - Criação

**Objetivo**: Verificar criação de bookmark

**Passos**:

1. Navegar para página 3
2. Clicar em "Adicionar Bookmark"
3. Digitar nome: "Conceito Importante"
4. Salvar
5. Verificar que bookmark aparece na lista

**Resultado Esperado**: Bookmark é criado e listado

---

### Teste 3.6: Bookmarks - Navegação

**Objetivo**: Verificar navegação via bookmark

**Passos**:

1. Com bookmark criado na página 3
2. Navegar para página 1
3. Abrir lista de bookmarks
4. Clicar no bookmark
5. Verificar navegação para página 3

**Resultado Esperado**: Navegação via bookmark funciona

---

### Teste 3.7: Bookmarks - Exclusão

**Objetivo**: Verificar remoção de bookmark

**Passos**:

1. Abrir lista de bookmarks
2. Clicar em "Excluir" em um bookmark
3. Confirmar exclusão
4. Verificar que bookmark foi removido

**Resultado Esperado**: Bookmark é excluído corretamente

---

### Teste 3.8: Offline Telemetry - Buffer

**Objetivo**: Verificar buffer local de eventos

**Passos**:

1. Abrir DevTools → Application → Local Storage
2. Desconectar internet
3. Realizar ações (scroll, highlights)
4. Verificar localStorage
5. Verificar chave `telemetry_buffer`

**Resultado Esperado**: Eventos são armazenados localmente

---

### Teste 3.9: Offline Telemetry - Auto-Sync

**Objetivo**: Verificar sincronização automática

**Passos**:

1. Com eventos em buffer (do teste anterior)
2. Reconectar internet
3. Aguardar 5 segundos
4. Verificar Network tab
5. Verificar localStorage

**Resultado Esperado**:

- Eventos são enviados automaticamente
- Buffer é limpo após sync

---

### Teste 3.10: Connectivity Indicator

**Objetivo**: Verificar indicador de conectividade

**Passos**:

1. Observar footer da aplicação
2. Desconectar internet
3. Verificar indicador "Modo Offline"
4. Reconectar internet
5. Verificar indicador "Sincronizando..."
6. Aguardar conclusão
7. Verificar indicador "Conectado"

**Resultado Esperado**: Indicador reflete estado de conexão

---

## Sprint 4: Pedagogical Interventions

### Teste 4.1: Intervention Engine - Flow Blocking

**Objetivo**: Verificar que intervenções respeitam flow

**Passos**:

1. Entrar em estado de flow (ler por 3 min)
2. Aguardar tempo de intervenção
3. Verificar que nenhuma intervenção aparece
4. Sair do flow (parar de ler)
5. Aguardar
6. Verificar que intervenção pode aparecer

**Resultado Esperado**: Intervenções não aparecem durante flow

---

### Teste 4.2: Intervention Engine - Cooldown

**Objetivo**: Verificar cooldown entre intervenções

**Passos**:

1. Receber uma intervenção
2. Dispensar ou completar
3. Aguardar menos de 5 minutos
4. Verificar que nova intervenção não aparece
5. Aguardar completar 5 minutos
6. Verificar que nova intervenção pode aparecer

**Resultado Esperado**: Cooldown de 5 minutos é respeitado

---

### Teste 4.3: Intervention Engine - Session Limit

**Objetivo**: Verificar limite por sessão

**Passos**:

1. Navegar para conteúdo em modo NARRATIVE (limite: 1)
2. Receber primeira intervenção
3. Completar
4. Aguardar e verificar que não há mais intervenções

**Resultado Esperado**: Limite de 1 intervenção é respeitado

---

### Teste 4.4: Intervention Engine - Aggressiveness Reduction

**Objetivo**: Verificar redução de agressividade

**Passos**:

1. Receber intervenção
2. Dispensar
3. Receber segunda intervenção
4. Dispensar
5. Verificar que frequência diminui (×0.5)

**Resultado Esperado**: Sistema se torna menos agressivo após dispensas

---

### Teste 4.5: Blocking Checkpoint - DIDACTIC Mode

**Objetivo**: Verificar checkpoint bloqueante

**Passos**:

1. Navegar para conteúdo em modo DIDACTIC
2. Aguardar checkpoint automático
3. Verificar que não pode continuar sem responder
4. Tentar rolar/navegar
5. Verificar bloqueio
6. Responder checkpoint
7. Verificar desbloqueio

**Resultado Esperado**: Checkpoint bloqueia até ser respondido

---

### Teste 4.6: Blocking Checkpoint - Non-Blocking Modes

**Objetivo**: Verificar que checkpoint não bloqueia em outros modos

**Passos**:

1. Navegar para conteúdo em modo NARRATIVE
2. Verificar que checkpoints não aparecem ou são opcionais
3. Verificar que pode continuar lendo

**Resultado Esperado**: Checkpoints não bloqueiam em NARRATIVE

---

### Teste 4.7: Checkpoint - Telemetry

**Objetivo**: Verificar tracking de checkpoint

**Passos**:

1. Responder um checkpoint
2. Verificar Network tab
3. Verificar evento `CHECKPOINT_ANSWERED`
4. Verificar payload:
   - score
   - latencyMs
   - attempts
   - isBlocking

**Resultado Esperado**: Telemetria completa é enviada

---

### Teste 4.8: DIDACTIC Flow - PRE Phase

**Objetivo**: Verificar fase de ativação

**Passos**:

1. Navegar para conteúdo em modo DIDACTIC
2. Verificar checkpoint PRE automático
3. Responder checkpoint
4. Verificar transição para fase READING

**Resultado Esperado**: Fase PRE ativa conhecimento prévio

---

### Teste 4.9: DIDACTIC Flow - READING Phase

**Objetivo**: Verificar mid-checks

**Passos**:

1. Estar em fase READING
2. Ler até boundary de seção
3. Verificar mid-check
4. Responder
5. Continuar leitura

**Resultado Esperado**: Mid-checks aparecem em boundaries

---

### Teste 4.10: DIDACTIC Flow - Scaffolding

**Objetivo**: Verificar ajuste de UI baseado em performance

**Passos**:

1. Responder checkpoint com score < 50%
2. Verificar que UI persiste 1.5× mais tempo
3. Responder checkpoint com score ≥ 90%
4. Verificar que UI desaparece 2× mais rápido

**Resultado Esperado**: UI se adapta à performance

---

### Teste 4.11: DIDACTIC Flow - POST Phase

**Objetivo**: Verificar fase de síntese

**Passos**:

1. Completar leitura em modo DIDACTIC
2. Verificar tela POST
3. Tentar submeter com síntese < 50 caracteres
4. Verificar erro
5. Escrever síntese adequada (50+ chars)
6. Preencher auto-avaliação (1-5)
7. Submeter

**Resultado Esperado**:

- Síntese mínima é exigida
- Auto-avaliação é capturada

---

### Teste 4.12: POST Phase - AI Suggestion

**Objetivo**: Verificar sugestão de IA para síntese

**Passos**:

1. Estar na fase POST
2. Clicar em "Sugestão de IA"
3. Aguardar carregamento
4. Verificar que sugestão aparece
5. Opcionalmente aceitar sugestão

**Resultado Esperado**: IA fornece sugestão de síntese

---

## Sprint 5: Content Modes

### Teste 5.1: Modo NARRATIVE

**Objetivo**: Verificar comportamento do modo narrativo

**Passos**:

1. Navegar para conteúdo em modo NARRATIVE
2. Verificar UI simplificada
3. Verificar ausência de intervenções pedagógicas
4. Verificar TOC visível
5. Verificar export disponível

**Resultado Esperado**: Modo narrativo funciona como esperado

---

### Teste 5.2: Modo TECHNICAL

**Objetivo**: Verificar features técnicas

**Passos**:

1. Navegar para conteúdo em modo TECHNICAL
2. Verificar TOC expandido
3. Verificar export de código
4. Verificar syntax highlighting
5. Verificar snippets de código

**Resultado Esperado**: Features técnicas estão presentes

---

### Teste 5.3: Modo NEWS

**Objetivo**: Verificar modo de notícias

**Passos**:

1. Navegar para conteúdo em modo NEWS
2. Verificar limite de 280 caracteres em anotações
3. Tentar criar anotação longa
4. Verificar mensagem de erro

**Resultado Esperado**: Limite de caracteres é respeitado

---

### Teste 5.4: Modo SCIENTIFIC

**Objetivo**: Verificar features científicas

**Passos**:

1. Navegar para conteúdo em modo SCIENTIFIC
2. Verificar detecção de seções IMRaD
3. Verificar filtro por seção
4. Verificar glossário de termos
5. Clicar em termo científico
6. Verificar popover de definição

**Resultado Esperado**: Features científicas funcionam

---

### Teste 5.5: Modo LANGUAGE

**Objetivo**: Verificar features de aprendizado de idiomas

**Passos**:

1. Navegar para conteúdo em modo LANGUAGE
2. Verificar vocabulary triage
3. Verificar checkpoints de vocabulário
4. Verificar quiz de tradução

**Resultado Esperado**: Features de idiomas estão presentes

---

### Teste 5.6: Modo DIDACTIC

**Objetivo**: Verificar intervenções pedagógicas

**Passos**:

1. Navegar para conteúdo em modo DIDACTIC
2. Ler conteúdo por 3 minutos
3. Verificar checkpoint automático
4. Responder quiz
5. Verificar scaffolding (ajuda gradual)

**Resultado Esperado**: Intervenções aparecem automaticamente

---

### Teste 5.7: Telemetria de Modos

**Objetivo**: Verificar tracking de eventos

**Passos**:

1. Navegar entre diferentes modos
2. Realizar ações em cada modo
3. Verificar no backend que eventos foram registrados
4. Verificar analytics dashboard

**Resultado Esperado**: Eventos são trackados corretamente

---

## Sprint 6: Offline & Accessibility

### Teste 6.1: Sincronização Offline (I2.1)

**Objetivo**: Verificar salvamento offline

**Passos**:

1. Navegar para `/reader/[contentId]`
2. Desconectar internet (modo offline)
3. Verificar indicador "Offline" no canto superior
4. Adicionar uma anotação
5. Verificar que anotação foi salva localmente
6. Verificar contador de operações pendentes

**Resultado Esperado**:

- Indicador mostra "Offline"
- Anotação é salva em IndexedDB
- Contador mostra "1 operação pendente"

---

### Teste 6.2: Auto-Sync ao Reconectar (I2.2)

**Objetivo**: Verificar sincronização automática

**Passos**:

1. Com operações pendentes do teste anterior
2. Reconectar internet
3. Observar indicador mudar para "Sincronizando..."
4. Aguardar conclusão
5. Verificar indicador "Online"
6. Verificar contador zerado

**Resultado Esperado**:

- Sync automático é iniciado
- Operações são enviadas ao servidor
- Indicador volta para "Online"

---

### Teste 6.3: Ajuste de Fonte (I3.1)

**Objetivo**: Verificar controles de acessibilidade

**Passos**:

1. Navegar para qualquer página
2. Clicar no botão de acessibilidade (ícone de pessoa)
3. Clicar em "Aumentar fonte" (A+)
4. Verificar aumento do texto
5. Clicar em "Diminuir fonte" (A-)
6. Verificar diminuição do texto

**Resultado Esperado**: Tamanho da fonte muda instantaneamente

---

### Teste 6.4: Atalhos de Teclado (I3.5)

**Objetivo**: Verificar keyboard shortcuts

**Passos**:

1. Navegar para qualquer página
2. Pressionar `Ctrl + +` (ou `Cmd + +` no Mac)
3. Verificar aumento da fonte
4. Pressionar `Ctrl + -`
5. Verificar diminuição da fonte
6. Pressionar `Ctrl + 0`
7. Verificar reset para tamanho padrão

**Resultado Esperado**: Atalhos funcionam corretamente

---

### Teste 6.5: Modo de Alto Contraste (I3.2)

**Objetivo**: Verificar toggle de contraste

**Passos**:

1. Abrir painel de acessibilidade
2. Ativar "Alto Contraste"
3. Verificar mudança nas cores
4. Verificar legibilidade melhorada
5. Desativar "Alto Contraste"

**Resultado Esperado**: Cores mudam para alto contraste

---

### Teste 6.6: Focus Mode (I3.3)

**Objetivo**: Verificar modo de foco

**Passos**:

1. Abrir painel de acessibilidade
2. Ativar "Modo Foco"
3. Verificar que elementos de distração são ocultados
4. Verificar que apenas conteúdo principal é visível
5. Desativar "Modo Foco"

**Resultado Esperado**: UI é simplificada para reduzir distrações

---

### Teste 6.7: Reduced Motion

**Objetivo**: Verificar redução de animações

**Passos**:

1. Abrir painel de acessibilidade
2. Ativar "Movimento Reduzido"
3. Navegar pela aplicação
4. Verificar que animações são minimizadas
5. Verificar que transições são instantâneas

**Resultado Esperado**: Animações são desabilitadas ou reduzidas

---

### Teste 6.8: Persistência de Configurações (I3.4)

**Objetivo**: Verificar salvamento de preferências

**Passos**:

1. Configurar acessibilidade:
   - Fonte: Grande
   - Alto Contraste: Ativo
   - Modo Foco: Ativo
2. Recarregar página (F5)
3. Verificar que configurações foram mantidas

**Resultado Esperado**: Todas as configurações são persistidas

---

### Teste 6.9: Analytics Dashboard - KPIs (I4.1)

**Objetivo**: Verificar exibição de métricas

**Passos**:

1. Navegar para `/analytics`
2. Verificar cards de KPI:
   - Usuários Ativos: número > 0
   - Conteúdos Lidos: número > 0
   - Taxa de Conclusão: percentual
   - Tempo Médio: minutos

**Resultado Esperado**: Todos os KPIs são exibidos

---

### Teste 6.10: Analytics - Filtro de Data (I4.2)

**Objetivo**: Verificar filtro por período

**Passos**:

1. Navegar para `/analytics`
2. Selecionar "Últimos 7 dias"
3. Verificar atualização dos dados
4. Selecionar "Último mês"
5. Verificar nova atualização

**Resultado Esperado**: Dados são filtrados corretamente

---

### Teste 6.11: Analytics - Export CSV (I4.3)

**Objetivo**: Verificar exportação

**Passos**:

1. Navegar para `/analytics`
2. Clicar em "Exportar CSV"
3. Verificar download
4. Abrir arquivo
5. Verificar formato dos dados

**Resultado Esperado**: CSV contém dados corretos

---

### Teste 6.12: Confusion Heatmap

**Objetivo**: Verificar visualização de confusão

**Passos**:

1. Navegar para `/analytics`
2. Localizar seção "Heatmap de Confusão"
3. Verificar seções coloridas:
   - Verde: baixa confusão
   - Amarelo: média confusão
   - Vermelho: alta confusão
4. Verificar contagem de eventos por seção

**Resultado Esperado**: Heatmap é exibido com cores corretas

---

### Teste 6.13: Glossário - Click em Termo (G5.3)

**Objetivo**: Verificar popover de definição

**Passos**:

1. Navegar para `/reader/scientific-article?mode=SCIENTIFIC`
2. Localizar termo científico (ex: "mitochondria")
3. Clicar no termo
4. Verificar que popover aparece
5. Verificar conteúdo:
   - Título: nome do termo
   - Definição: texto explicativo
   - Fonte: PubMed/Wikipedia/Wiktionary

**Resultado Esperado**: Popover é exibido com definição

---

### Teste 6.14: Glossário - Loading State

**Objetivo**: Verificar estado de carregamento

**Passos**:

1. Navegar para artigo científico
2. Clicar em termo científico
3. Observar skeleton loader
4. Aguardar carregamento da definição

**Resultado Esperado**: Loading state é exibido

---

### Teste 6.15: Glossário - Fechar Popover

**Objetivo**: Verificar fechamento do popover

**Passos**:

1. Abrir popover de glossário
2. Clicar no botão "X" (fechar)
3. Verificar que popover desaparece
4. Clicar fora do popover
5. Verificar que também fecha

**Resultado Esperado**: Popover fecha corretamente

---

### Teste 6.16: Filtro de Seções IMRaD (G5.4)

**Objetivo**: Verificar filtro por seção

**Passos**:

1. Navegar para artigo científico
2. Abrir aba "Stream" (Highlights & Notas)
3. Verificar componente de filtro de seções
4. Verificar seções disponíveis:
   - Todas
   - Abstract
   - Introduction
   - Methods
   - Results
   - Discussion
   - Conclusion
5. Clicar em "Methods"
6. Verificar que apenas anotações da seção Methods são exibidas

**Resultado Esperado**: Filtro funciona corretamente

---

### Teste 6.17: Contagem de Anotações por Seção

**Objetivo**: Verificar contador de anotações

**Passos**:

1. Navegar para artigo científico
2. Abrir filtro de seções
3. Verificar número ao lado de cada seção
4. Verificar que número corresponde à quantidade de anotações

**Resultado Esperado**: Contadores são precisos

---

## Testes de Integração

### Teste INT-1: Fluxo Completo de Usuário

**Objetivo**: Simular jornada completa de um estudante

**Passos**:

1. Fazer login
2. Upload de novo conteúdo (PDF)
3. Aguardar processamento
4. Abrir conteúdo no reader
5. Criar highlights e notas
6. Adicionar cues
7. Escrever summary
8. Completar sessão de estudo
9. Fazer revisão SRS
10. Verificar analytics

**Resultado Esperado**: Toda a jornada funciona sem erros

---

### Teste INT-2: Mudança de Modos

**Objetivo**: Verificar transição entre modos

**Passos**:

1. Abrir conteúdo em modo NARRATIVE
2. Mudar para modo DIDACTIC
3. Verificar que intervenções aparecem
4. Mudar para modo SCIENTIFIC
5. Verificar que glossário e seções aparecem

**Resultado Esperado**: Transições são suaves e features corretas aparecem

---

### Teste INT-3: Offline → Online → Offline

**Objetivo**: Verificar robustez do sistema offline

**Passos**:

1. Iniciar online
2. Criar anotações
3. Desconectar (offline)
4. Criar mais anotações
5. Reconectar (online)
6. Aguardar sync
7. Desconectar novamente
8. Verificar que todas as anotações estão presentes

**Resultado Esperado**: Sistema mantém consistência

---

## Checklist de Validação Final

### Funcionalidades Core

- [ ] Login/Logout funciona
- [ ] Upload de conteúdo funciona
- [ ] Viewer de PDF funciona
- [ ] Highlights funcionam
- [ ] Notas funcionam
- [ ] Cues funcionam
- [ ] Summary funciona
- [ ] Autosave funciona

### Sprint 1

- [ ] Persistência de cues
- [ ] Persistência de summary
- [ ] Edições concorrentes
- [ ] Indicador de save status
- [ ] Tratamento de erros

### Sprint 2

- [ ] Navegação responsiva
- [ ] Dark mode
- [ ] Analytics dashboard
- [ ] Filtro de data range
- [ ] Export CSV

### Sprint 3

- [ ] Fluxo de sessão completo
- [ ] Validação de DoD
- [ ] Quiz de checkpoint
- [ ] Estatísticas de sessão

### Sprint 4

- [ ] Fila de revisão SRS
- [ ] Resultado OK (progressão)
- [ ] Resultado FAIL (reset)
- [ ] Resultado EASY (pulo)
- [ ] Daily cap
- [ ] Navegação entre itens
- [ ] Summary de conclusão

### Sprint 5

- [ ] Modo NARRATIVE
- [ ] Modo TECHNICAL
- [ ] Modo NEWS
- [ ] Modo SCIENTIFIC
- [ ] Modo LANGUAGE
- [ ] Modo DIDACTIC
- [ ] Telemetria de modos

### Sprint 6

- [ ] Sincronização offline
- [ ] Auto-sync ao reconectar
- [ ] Ajuste de fonte
- [ ] Atalhos de teclado
- [ ] Alto contraste
- [ ] Focus mode
- [ ] Reduced motion
- [ ] Persistência de configurações
- [ ] Analytics KPIs
- [ ] Analytics filtro de data
- [ ] Analytics export CSV
- [ ] Confusion heatmap
- [ ] Glossário - click em termo
- [ ] Glossário - loading state
- [ ] Glossário - fechar popover
- [ ] Filtro de seções IMRaD
- [ ] Contagem de anotações por seção

---

## Relatório de Bugs

### Template para Reportar Bugs

```markdown
**Título**: [Descrição curta do bug]

**Severidade**: Crítico / Alto / Médio / Baixo

**Passos para Reproduzir**:

1.
2.
3.

**Resultado Esperado**:

**Resultado Atual**:

**Screenshots/Vídeos**:

**Ambiente**:

- OS:
- Navegador:
- Versão:

**Informações Adicionais**:
```

---

## Notas Importantes

1. **Dados de Teste**: Alguns testes requerem dados específicos. Certifique-se de ter conteúdo de teste adequado.

2. **Tempo de Execução**: O conjunto completo de testes manuais pode levar 2-3 horas.

3. **Priorização**: Se o tempo for limitado, priorize:

   - Testes de funcionalidades core
   - Testes de Sprint 6 (mais recentes)
   - Testes de integração

4. **Automação**: Sempre que possível, execute os testes automatizados primeiro:

   ```bash
   npx playwright test
   ```

5. **Documentação**: Documente todos os bugs encontrados usando o template fornecido.

---

## Comandos Úteis

```bash
# Limpar cache do navegador
npx playwright test --headed --project=chromium

# Gerar relatório HTML
npx playwright show-report

# Executar teste específico
npx playwright test -g "nome do teste"

# Modo debug (passo a passo)
npx playwright test --debug

# Capturar screenshots
npx playwright test --screenshot=on

# Capturar vídeos
npx playwright test --video=on
```

---

**Última Atualização**: 2026-01-01  
**Versão**: 1.0  
**Responsável**: Equipe de QA
