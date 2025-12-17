# Funcionalidades Implementadas

Atualmente, o projeto encontra-se na fase de "Skeleton" (Esqueleto), com as fundações técnicas estabelecidas.

## Infraestrutura

- **Dockerização Completa**: Todos os serviços (Frontend, Backend, IA, Bancos) rodam em containers isolados.
- **Orquestração Local**: `docker-compose` configurado para subir todo o ambiente com um comando.
- **Banco de Dados**: Instância PostgreSQL e Redis configuradas e persistentes via volumes.

## Backend (API)

- **Estrutura NestJS**: Aplicação iniciada com suporte a módulos.
- **ORM Prisma**: Conexão configurada e Serviço Prisma criado.
- **Modelagem de Dados**:
  - Tabelas de Usuários e Instituições (Multi-tenant).
  - Tabelas de Conteúdos e Versões (Logica de simplificação).
  - Tabelas de Biblioteca e Leitura (Método Cornell).
  - Tabelas de Avaliação (Perguntas e Respostas).

## Serviço de IA

- **API FastAPI**: Servidor Python rodando na porta 8000.
- **Endpoints Stubs**: Rotas definidas para `/simplify`, `/translate` e `/generate-assessment` (prontas para receber lógica).

## Workers

- **Ingestão**: Estrutura básica de consumidores RabbitMQ para Notícias e arXiv.
- **Processador**: Worker dedicado para orquestrar chamadas pesadas à IA.

## Frontend

- **Next.js 14**: Configurado com App Router.
- **Tailwind CSS**: Estilização configurada.
- **Componentes Base**: Exemplo de botão e layout responsivo.
