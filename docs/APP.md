# Documentação APP

A camada APP é responsável pela interação com o usuário e gerenciamento de dados transacionais.

## Componentes

### 1. Backend API (`services/api`)

- **Tech**: NestJS, Prisma (ORM).
- **Porta**: 4000.
- **Autenticação**: JWT, Passport strategies (Google/Microsoft em `src/auth/strategies`).
- **Integração com Core**:
  - Usa `AmqpConnection` para publicar em filas.
  - Usa `HttpService` para chamar `ai-service` (síncrono, quando necessário).

### 2. Frontend (`frontend`)

- **Tech**: Next.js (React), TailwindCSS.
- **Porta**: 3000.
- **Rendering**: SSR/CSR.

## Entidades Principais

- **Content**: Artigos, vídeos ou papers importados.
- **ReadingSession**: Sessão de estudo ativa do usuário.
- **Flashcards/Quizzes**: Gerados a partir do conteúdo.

## Configuração de Integrações

Configurações sensíveis devem estar no `.env`:

- `GOOGLE_CLIENT_ID` / `SECRET`: Para login social.
- `OPENAI_API_KEY`: Usado pelo backend/AI service.
