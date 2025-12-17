# Tecnologias Utilizadas

Este projeto utiliza uma stack moderna e robusta, focada em performance, escalabilidade e facilidade de manutenção.

## Frontend

- **React 18**: Biblioteca principal para construção da interface.
- **Next.js 14**: Framework React para renderização (SSR/SSG), roteamento e otimizações.
- **Tailwind CSS**: Framework de utilitários CSS para estilização rápida e responsiva.
- **TanStack Query (React Query)**: Gerenciamento de estado servidor (caching, fetching).
- **Zustand**: Gerenciamento de estado global leve.
- **Radix UI**: Componentes "headless" acessíveis para a base de UI.
- **Lucide React**: Biblioteca de ícones.

## Backend (API de Negócio)

- **Node.js (LTS)**: Runtime JavaScript.
- **NestJS**: Framework progressivo para construção de aplicações server-side eficientes e escaláveis.
- **TypeScript**: Linguagem base para tipagem estática e segurança.
- **Prisma**: ORM moderno para interação com banco de dados.
- **Passport.js**: Middleware de autenticação (JWT).

## Serviço de IA / NLP

- **Python 3.12**: Linguagem para processamento de IA.
- **FastAPI**: Framework web moderno e rápido para construção de APIs em Python.
- **LangChain**: Framework para orquestração de LLMs e fluxos de IA.

## Workers (Processamento Assíncrono)

- **Node.js**: Scripts leves para consumo de filas.
- **RabbitMQ**: Broker de mensagens para comunicação assíncrona entre serviços.

## Banco de Dados e Infraestrutura

- **PostgreSQL 16**: Banco de dados relacional (com suporte a pgvector planejado).
- **Redis**: Armazenamento em memória para cache e filas.
- **Docker**: Containerização de todos os serviços.
- **Docker Compose**: Orquestração local dos containers.
