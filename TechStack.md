# Tech Stack - AprendeAI

Este documento descreve todas as tecnologias, frameworks e ferramentas utilizadas no projeto AprendeAI. É essencial para novos desenvolvedores que precisam dar manutenção na aplicação.

---

## 📋 Visão Geral

AprendeAI é uma aplicação full-stack de educação com:

- **Frontend**: Next.js (React) com TypeScript
- **Backend**: NestJS (Node.js) com TypeScript
- **Database**: PostgreSQL com Prisma ORM
- **Infraestrutura**: Docker, Redis, RabbitMQ

---

## 🎨 Frontend

### Core Framework

- **Next.js 14** - Framework React com SSR/SSG
  - App Router (não Pages Router)
  - Server Components e Client Components
  - API Routes para endpoints internos
- **React 18** - Biblioteca UI
  - Hooks modernos (useState, useEffect, useMemo, useCallback)
  - Context API para estado global
- **TypeScript 5.7** - Tipagem estática

### State Management

- **Zustand** - Estado global leve e performático
  - Stores em `frontend/stores/`
  - Padrão: `auth-store`, `heuristics-store`
- **TanStack Query (React Query)** - Cache e sincronização de dados
  - Queries e mutations
  - Invalidação automática de cache
  - Hooks em `frontend/hooks/`

### Styling

- **Tailwind CSS 3.4** - Utility-first CSS
  - Configuração em `tailwind.config.ts`
  - Classes customizadas em `globals.css`
- **Framer Motion** - Animações e transições
- **Lucide React** - Ícones SVG modernos
- **next-themes** - Dark mode / Light mode

### UI Components

- **Headless UI** - Componentes acessíveis sem estilo
- **React Hook Form** - Formulários com validação
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **React Hot Toast** - Notificações alternativas

### Visualização de Conteúdo

- **PDF.js (pdfjs-dist)** - Renderização de PDFs
  - `@react-pdf-viewer/*` - Componentes React para PDF
  - Highlight, search, anotações
- **Mammoth** - Conversão de DOCX para HTML
- **React Player** - Player de vídeo/áudio
- **Konva / React Konva** - Canvas para anotações em imagens

### Testing

- **Jest** - Test runner para testes unitários
- **Testing Library** - Testes de componentes React
- **Playwright** - Testes E2E
  - Configuração em `playwright.config.ts`
  - Testes em `frontend/tests/e2e/`

### Build & Dev Tools

- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Husky** - Git hooks
- **lint-staged** - Lint apenas em arquivos staged

---

## ⚙️ Backend

### Core Framework

- **NestJS 11** - Framework Node.js enterprise
  - Arquitetura modular com decorators
  - Dependency Injection (DI)
  - Middleware, Guards, Interceptors, Pipes
- **Node.js 20+** - Runtime JavaScript
- **TypeScript 5.7** - Tipagem estática

### Database & ORM

- **PostgreSQL** - Banco de dados relacional
- **Prisma 5.22** - ORM moderno
  - Schema em `services/api/prisma/schema.prisma`
  - Migrations em `services/api/prisma/migrations/`
  - Client auto-gerado com tipos TypeScript
  - Seed scripts para dados iniciais

### Authentication & Authorization

- **Passport.js** - Estratégias de autenticação
  - JWT (JSON Web Tokens)
  - Google OAuth 2.0
  - Microsoft OAuth
  - Local (email/password)
- **bcrypt** - Hashing de senhas
- **@nestjs/jwt** - Geração e validação de tokens

### API & Validation

- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de objetos
- **Swagger / OpenAPI** - Documentação automática da API
  - Acessível em `/api/docs` quando rodando

### Background Jobs & Queues

- **BullMQ** - Filas de jobs com Redis
  - Workers para processamento assíncrono
  - Retry automático
  - Agendamento de tarefas
- **@nestjs/schedule** - Cron jobs

### Real-time Communication

- **Socket.IO** - WebSockets para comunicação real-time
  - Chat em grupo
  - Notificações ao vivo
  - Sincronização de sessões

### External Services & AI

- **OpenAI SDK** - Integração com GPT-4
- **Google Generative AI** - Gemini API
- **Anthropic SDK** - Claude API
- **Stripe** - Pagamentos e assinaturas

### File Processing

- **Multer** - Upload de arquivos
- **fluent-ffmpeg** - Processamento de vídeo/áudio
- **PDFKit** - Geração de PDFs
- **unpdf** - Extração de texto de PDFs

### Caching & Performance

- **Redis (ioredis)** - Cache em memória
- **@nestjs/cache-manager** - Gerenciamento de cache

### Messaging

- **RabbitMQ (amqplib)** - Message broker
  - Comunicação entre serviços
  - Event-driven architecture

### Monitoring & Logging

- **Winston** - Logging estruturado
- **Sentry** - Error tracking e monitoring
- **@nestjs/throttler** - Rate limiting

### Email

- **Nodemailer** - Envio de emails
- **Handlebars** - Templates de email

### Testing

- **Jest** - Test runner
- **Supertest** - Testes de API HTTP
- **@nestjs/testing** - Utilitários para testes NestJS

---

## 🗄️ Database Schema

### Prisma Schema

- **Localização**: `services/api/prisma/schema.prisma`
- **Convenção**: snake_case para tabelas e colunas
- **Enums**: Definidos no schema, sincronizados com frontend

### Principais Modelos

- `users` - Usuários do sistema
- `contents` - Conteúdos (PDF, vídeo, artigos)
- `highlights` - Anotações e destaques
- `families` - Planos familiares
- `institutions` - Instituições educacionais
- `subscriptions` - Assinaturas e pagamentos
- `game_results` - Resultados de jogos educacionais

### Migrations

- Versionadas em `services/api/prisma/migrations/`
- Executar: `npx prisma migrate dev`
- Gerar client: `npx prisma generate`

---

## 🐳 Infraestrutura

### Docker

- **docker-compose.yml** - Orquestração de serviços
- **Serviços**:
  - PostgreSQL (porta 5432)
  - Redis (porta 6379)
  - RabbitMQ (porta 5672, UI: 15672)

### Ambiente de Desenvolvimento

```bash
# Subir infraestrutura
docker-compose up -d

# Backend
cd services/api
npm run start:dev  # Porta 4000

# Frontend
cd frontend
npm run dev  # Porta 3000
```

---

## 📦 Estrutura de Pastas

```
aprendeai-app/
├── frontend/                 # Aplicação Next.js
│   ├── app/                 # App Router (páginas)
│   ├── components/          # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   ├── stores/             # Zustand stores
│   ├── services/           # API clients
│   └── tests/              # Testes (unit, integration, e2e)
│
├── services/api/            # Backend NestJS
│   ├── src/                # Código fonte
│   │   ├── auth/          # Módulo de autenticação
│   │   ├── cornell/       # Módulo Cornell Notes
│   │   ├── users/         # Módulo de usuários
│   │   └── ...            # Outros módulos
│   ├── prisma/            # Schema e migrations
│   └── test/              # Testes
│
├── browser-extension/       # Extensão do navegador
├── docs/                   # Documentação
├── scripts/                # Scripts utilitários
└── docker-compose.yml      # Orquestração Docker
```

---

## 🔑 Variáveis de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aprendeai
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🧪 Testing

### Frontend

```bash
npm run test:unit           # Testes unitários (Jest)
npm run test:integration    # Testes de integração
npm run test:e2e           # Testes E2E (Playwright)
npm run test:e2e:ui        # Playwright UI mode
```

### Backend

```bash
npm run test:unit          # Testes unitários
npm run test:integration   # Testes de integração
npm run test:all          # Todos os testes
```

---

## 📚 Recursos de Aprendizado

### Next.js

- [Documentação Oficial](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### NestJS

- [Documentação Oficial](https://docs.nestjs.com)
- [Fundamentals](https://docs.nestjs.com/fundamentals/custom-providers)

### Prisma

- [Documentação](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### TypeScript

- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🚀 Comandos Essenciais

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar migrations
cd services/api && npx prisma migrate dev

# Iniciar dev servers
npm run dev  # Frontend
cd services/api && npm run start:dev  # Backend

# Type checking
npm run type-check
```

### Build & Deploy

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd services/api && npm run build

# Rodar em produção
npm run start:prod
```

---

## 📝 Convenções de Código

### Naming

- **Arquivos**: kebab-case (`user-profile.tsx`)
- **Componentes**: PascalCase (`UserProfile`)
- **Funções/variáveis**: camelCase (`getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Database**: snake_case (`user_id`, `created_at`)

### TypeScript

- Sempre tipar explicitamente parâmetros de funções
- Evitar `any` - usar `unknown` quando necessário
- Preferir interfaces para objetos, types para unions
- Usar enums para valores fixos

### React

- Componentes funcionais com hooks
- Props tipadas com interfaces
- Evitar prop drilling - usar Context ou Zustand
- Memoização consciente (useMemo, useCallback)

---

## 🔧 Troubleshooting

### Problemas Comuns

**Erro de conexão com banco**:

```bash
docker-compose up -d postgres
npx prisma migrate dev
```

**Cache do Next.js**:

```bash
rm -rf .next
npm run dev
```

**Tipos do Prisma desatualizados**:

```bash
npx prisma generate
```

**Porta em uso**:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 📞 Suporte

Para dúvidas sobre a tech stack:

1. Consulte a documentação oficial da tecnologia
2. Verifique os arquivos em `/docs`
3. Revise o código existente para padrões
4. Consulte `BoasPraticas.txt` para guidelines

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0
