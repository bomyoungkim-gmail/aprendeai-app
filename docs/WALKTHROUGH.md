# Walkthrough do MVP AprendeAI

Este documento descreve o fluxo funcional implementado até o momento (Fase 1-6).

## 1. Infraestrutura e Serviços

O projeto roda inteiramente em Docker.

- **Frontend**: Next.js (Porta 3000)
- **API**: NestJS (Porta 4000)
- **AI Service**: FastAPI (Porta 8000)
- **Banco de Dados**: PostgreSQL
- **Mensageria**: RabbitMQ

## 2. Fluxo do Usuário (Frontend)

### Login

1. Acesse `http://localhost:3000/login`.
2. Insira as credenciais (usuário deve ser criado via endpoint de registro na API ou seed).
3. Redireciona para `/dashboard`.

### Dashboard

- Visão geral com estatísticas.
- Menu lateral para navegação.

### Biblioteca

- Acessível em `/dashboard/library`.
- Lista todos os conteúdos cadastrados no banco.
- Exibe ícones diferenciando tipos (ARXIV vs NEWS).

### Leitor de Conteúdo

- Ao clicar em um conteúdo, abre `/dashboard/library/[id]`.
- **Abas**: Permite alternar entre o texto "Original" e versoes criadas (ex: "Simplificado (5_EF)").
- **Botão "Simplificar (IA)"**: Dispara uma tarefa para o backend (API -> RabbitMQ -> Worker -> AI). A IA cria uma versão simplificada em PT-BR. Após processamento, ao recarregar a página, uma nova aba aparece.
- **Botão "Gerar Questões"**: Dispara tarefa para criar uma avaliação.

## 3. Fluxo de Dados (Backend & AI)

1. **Ingestão**:
   - Workers (`news_ingestor`, `arxiv_ingestor`) buscam dados periodicamente e salvam via API.
2. **Processamento**:
   - Quando o usuário pede simplificação, a API coloca mensagem na fila `content.process`.
   - O worker `content_processor` pega a mensagem.
   - Chama o serviço de IA (`POST /simplify`).
   - A IA retorna JSON com texto simplificado.
   - O worker salva a nova versão via API (`POST /content/:id/versions`).

## 4. Gamificação e Analytics (Novo)

### Progresso e Hábitos

- No **Dashboard**, visualize seu _Streak_ (dias consecutivos) e _Meta Diária_.
- Estude um conteúdo na **Biblioteca** por pelo menos 1 minuto para ver a barra de meta avançar.
- Clique em "Concluir Leitura" para registrar a atividade.

### Pontos Fortes e Fracos

- Acesse `/dashboard/progress`.
- Veja gráficos de barras indicando suas habilidades mais fortes e as que precisam de atenção.
- Veja a "Nuvem de Vocabulário" com as palavras que você já domina.

## Próximos Passos

- Implementar interface para _responder_ as avaliações geradas.
- Melhorar a editor de notas (Cornell).
