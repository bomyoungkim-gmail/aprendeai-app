# Referência de Banco de Dados

## PostgreSQL (Prisma)

Sistema de registro principal. Schema definido em `services/api/prisma/schema.prisma`.

### Tabelas Principais

- `User`: Dados de conta e preferências.
- `Content`: Metadados de conteúdo importado (título, url, status).
- `ReadingSession`: Estado de uma sessão de estudo.
- `Annotation`: Notas e destaques feitos pelo usuário.
- `Flashcard`: Cartões de memória gerados.

### Indices Críticos

- `User.email` (Unique)
- `Content.url` (Para evitar duplicação de ingestão)
- `ReadingSession.userId` (Busca de histórico)

## Redis

Cache e Sessão volátil.

- **Prefixos de Chave**:
  - `auth:token:{id}`: Blacklist de tokens ou refresh tokens.
  - `cache:ai:{hash}`: Cache de respostas da AI para economizar tokens.
  - `queue:*`: Estruturas internas do Bull/RabbitMQ (se aplicável).
