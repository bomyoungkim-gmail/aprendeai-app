# AprendeAI - Manual de Início Local

**Última Atualização:** 2025-12-23  
**Versão da Plataforma:** 3.0  
**Público-Alvo:** Desenvolvedores e testadores

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Iniciando a Aplicação](#iniciando-a-aplicação)
4. [Testando a Aplicação](#testando-a-aplicação)
5. [Reportando Bugs](#reportando-bugs)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário

| Software       | Versão Mínima | Link de Download                           | Verificação        |
| -------------- | ------------- | ------------------------------------------ | ------------------ |
| Node.js        | 18.x          | https://nodejs.org                         | `node --version`   |
| npm            | 9.x           | (incluído com Node)                        | `npm --version`    |
| Python         | 3.11+         | https://python.org                         | `python --version` |
| Docker Desktop | 4.x           | https://docker.com/products/docker-desktop | `docker --version` |
| Git            | 2.x           | https://git-scm.com                        | `git --version`    |

### Hardware Recomendado

- **RAM:** 8GB mínimo (16GB recomendado)
- **CPU:** 4 cores mínimo
- **Disco:** 10GB espaço livre
- **Internet:** Conexão estável para download de dependências

### Contas Necessárias (Opcionais)

- **OpenAI:** Para funcionalidades de IA (necessário para AI Service)
  - Obter em: https://platform.openai.com/api-keys
  - Variável: `OPENAI_API_KEY`
- **Anthropic (Claude):** Opcional, para provider alternativo

  - Obter em: https://console.anthropic.com/
  - Variável: `ANTHROPIC_API_KEY`

- **Google (Gemini):** Opcional, para provider alternativo
  - Obter em: https://makersuite.google.com/app/apikey
  - Variável: `GOOGLE_API_KEY`

---

## 📦 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/aprendeai-app.git
cd aprendeai-app
```

### 2. Configurar Variáveis de Ambiente

#### Backend API (.env)

Criar arquivo `.env` na raiz do projeto:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aprendeai"
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=aprendeai

# Redis
REDIS_URL="redis://localhost:6379"

# RabbitMQ
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Email (opcional para testes locais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

#### AI Service (.env.docker ou services/ai/.env)

```bash
# LLM Provider (escolha um)
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=AIza...

# Provider Configuration
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/aprendeai"

# RabbitMQ
RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672"
RABBITMQ_HOST=rabbitmq

# Redis (para Games System)
REDIS_URL="redis://redis:6379"

# Port
PORT=8001
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Instalar Dependências

#### Backend API

```bash
cd services/api
npm install

# Gerar Prisma Client
npx prisma generate
```

#### Frontend

```bash
cd ../../frontend
npm install
```

#### AI Service

```bash
cd ../services/ai
pip install -r requirements.txt
```

### 4. Configurar Banco de Dados

```bash
# Voltar para services/api
cd ../services/api

# Run migrations
npx prisma migrate deploy

# (Opcional) Seed inicial
npx prisma db seed
```

---

## 🚀 Iniciando a Aplicação

### Opção 1: Docker Compose (Recomendado)

**Vantagens:** Tudo configurado, workers incluídos  
**Desvantagens:** Mais lento para rebuild

#### Iniciar Todos os Serviços

```bash
# Na raiz do projeto
docker-compose up -d
```

#### Verificar Status dos Containers

```bash
docker ps
```

**Containers Esperados:**

- `socrates-postgres` - Banco de dados
- `socrates-redis` - Cache
- `socrates-rabbitmq` - Message queue
- `socrates-api` - Backend API
- `socrates-ai` - AI Service
- `socrates-frontend` - Frontend Next.js
- `socrates-extraction-worker` - Worker de extração
- `socrates-news-ingestor` - Worker de notícias
- `socrates-arxiv-ingestor` - Worker Arxiv
- `socrates-content-processor` - Worker de processamento

#### Verificar Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f api
docker-compose logs -f ai
docker-compose logs -f frontend
```

#### Acessar a Aplicação

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **AI Service:** http://localhost:8001
- **RabbitMQ Management:** http://localhost:15672 (guest/guest)

---

### Opção 2: Execução Manual (Desenvolvimento)

**Vantagens:** Hot reload, desenvolvimento mais rápido  
**Desvantagens:** Precisa iniciar cada serviço manualmente

#### 1. Iniciar Infraestrutura (Docker)

```bash
# Apenas infra (postgres, redis, rabbitmq)
docker-compose up -d postgres redis rabbitmq
```

#### 2. Backend API

```bash
# Terminal 1
cd services/api
npm run start:dev
```

**Verificação:** http://localhost:4000/health deve retornar `{"status":"ok"}`

#### 3. AI Service

```bash
# Terminal 2
cd services/ai
python main.py
```

**Verificação:** http://localhost:8001/health deve retornar `{"status":"healthy"}`

#### 4. Frontend

```bash
# Terminal 3
cd frontend
npm run dev
```

**Verificação:** http://localhost:3000 deve abrir a aplicação

#### 5. Workers (Opcional)

```bash
# Terminal 4 - Extraction Worker
cd services/workers/extraction_worker
npm install
npm start

# Terminal 5 - News Ingestor
cd services/workers/news_ingestor
npm install
npm start

# (Repita para outros workers conforme necessário)
```

---

## 🧪 Testando a Aplicação

### 1. Teste de Fumaça (Smoke Test)

#### Verificar que todos os serviços estão rodando

```bash
# Health checks
curl http://localhost:4000/health
curl http://localhost:8001/health
curl http://localhost:3000/api/health
```

**Resultado Esperado:** Status 200 OK para todos

---

### 2. Teste de Funcionalidades Básicas

#### A. Criar Conta e Login

1. Abrir http://localhost:3000
2. Clicar em "Registrar"
3. Preencher:
   - Nome: "Teste Usuario"
   - Email: "teste@exemplo.com"
   - Senha: "senha123"
4. Fazer login

**Resultado Esperado:** Redirecionado para `/dashboard`

---

#### B. Upload de Conteúdo

1. No dashboard, clicar em "Fazer Upload"
2. Selecionar um arquivo PDF/DOCX
3. Preencher título e idioma
4. Submeter

**Resultado Esperado:**

- Upload bem-sucedido
- Mensagem de processamento
- Arquivo aparece em "Minha Biblioteca"

**Verificar nos Logs:**

```bash
# Backend deve mostrar job enqueue
docker-compose logs api | grep "content.extract"

# Worker deve processar
docker-compose logs extraction_worker | grep "Processing"
```

---

#### C. Criar Sessão de Leitura

1. Clicar em um conteúdo
2. Clicar "Iniciar Leitura"
3. Sistema deve abrir `/reading/[sessionId]`
4. Digite uma mensagem para o tutor IA

**Resultado Esperado:**

- IA responde em ~3-5 segundos
- Quick replies aparecem
- Conversa é persistida

---

#### D. Testar AI Games System

1. Clicar em "Jogos" na sidebar
2. Verificar 6 cards de jogos
3. Selecionar "Recordação Livre"
4. (Gameplay depende de integração futura)

**Resultado Esperado:**

- Página `/games` carrega
- 6 jogos visíveis com gradientes
- Stats overview visible (Estrelas, Streak, Completos)

**Verificar Backend:**

```bash
# Games system health
curl http://localhost:8001/games/health
```

---

### 3. Testes Automatizados

#### Backend Unit Tests

```bash
cd services/api
npm test
```

**Resultado Esperado:** Todos os testes passam

---

#### AI Games Tests

```bash
cd services/ai
pytest tests/games/ -v
```

**Resultado Esperado:** 89/89 testes passando

---

#### Frontend E2E Tests

```bash
cd frontend
npx playwright test
```

**Resultado Esperado:** Testes críticos passam (family plan, auth, etc.)

---

### 4. Teste de Workers

#### Extraction Worker

```bash
# 1. Fazer upload de um PDF via UI

# 2. Verificar logs
docker-compose logs extraction_worker

# 3. Verificar no banco
docker exec -it socrates-postgres psql -U postgres -d aprendeai -c "SELECT * FROM \"ContentChunk\" LIMIT 5;"
```

**Resultado Esperado:** Chunks gerados e salvos

---

#### News Ingestor

```bash
# 1. Publicar mensagem na fila (via RabbitMQ Management UI)
# http://localhost:15672 → Queues → news.fetch → Publish Message

# Payload:
{
  "url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  "lang": "EN"
}

# 2. Verificar logs
docker-compose logs news_ingestor
```

**Resultado Esperado:** RSS processado, conteúdos criados

---

## 🐛 Reportando Bugs

### Onde Reportar

**GitHub Issues:** https://github.com/seu-usuario/aprendeai-app/issues

### Template de Bug Report

Ao criar uma issue, incluir:

```markdown
## 🐛 Descrição do Bug

[Descrição clara e concisa do problema]

## 📋 Passos para Reproduzir

1. Ir para '...'
2. Clicar em '...'
3. Scroll até '...'
4. Ver erro

## ✅ Comportamento Esperado

[O que deveria acontecer]

## ❌ Comportamento Atual

[O que está acontecendo]

## 📸 Screenshots

[Se aplicável, adicionar screenshots]

## 🖥️ Ambiente

- **OS:** [Windows 11 / macOS Sonoma / Ubuntu 22.04]
- **Browser:** [Chrome 120 / Firefox 121 / Safari 17]
- **Node Version:** [18.x]
- **Docker Version:** [4.x]

## 📝 Logs Relevantes
```

[Colar logs do terminal/docker]

```

## 🔍 Contexto Adicional

[Qualquer informação extra que possa ajudar]
```

---

### Prioridades de Bugs

**P0 - Crítico (Fix ASAP)**

- Aplicação não inicia
- Dados perdidos
- Vulnerabilidade de segurança

**P1 - Alto (Fix esta semana)**

- Funcionalidade principal quebrada
- Erro em produção

**P2 - Médio (Fix próxima sprint)**

- Bug em feature secundária
- Problema de UX

**P3 - Baixo (Backlog)**

- Melhorias cosméticas
- Edge cases raros

---

### Como Coletar Logs Úteis

#### Logs do Docker

```bash
# Todos os serviços
docker-compose logs --tail=100 > logs.txt

# Serviço específico
docker-compose logs api --tail=50 > api-logs.txt
```

#### Logs do Browser

1. Abrir DevTools (F12)
2. Console tab
3. Filtrar por "error"
4. Screenshot ou copiar stack trace

#### Logs do Banco de Dados

```bash
# Verificar últimas queries
docker exec -it socrates-postgres psql -U postgres -d aprendeai -c "SELECT query FROM pg_stat_activity WHERE state = 'active';"
```

#### Estado da Aplicação

```bash
# Health checks
curl http://localhost:4000/health -v
curl http://localhost:8001/health -v

# Container status
docker ps -a

# Resource usage
docker stats --no-stream
```

---

## 🔧 Troubleshooting

### Problema: Containers não iniciam

**Sintoma:** `docker-compose up` falha

**Soluções:**

```bash
# 1. Limpar containers antigos
docker-compose down -v

# 2. Rebuild forçado
docker-compose build --no-cache

# 3. Verificar portas em uso
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :5432

# 4. Aumentar recursos do Docker Desktop
# Settings → Resources → Memory: 6GB+
```

---

### Problema: API não conecta no banco

**Sintoma:** `Connection refused` ou `ECONNREFUSED`

**Soluções:**

```bash
# 1. Verificar se Postgres está rodando
docker ps | grep postgres

# 2. Testar conexão manual
docker exec -it socrates-postgres psql -U postgres -d aprendeai

# 3. Verificar DATABASE_URL no .env
echo $DATABASE_URL

# 4. Rodar migrations
cd services/api
npx prisma migrate deploy
```

---

### Problema: AI Service retorna 500

**Sintoma:** Erros ao conversar com tutor IA

**Soluções:**

```bash
# 1. Verificar API key
echo $OPENAI_API_KEY

# 2. Testar endpoint diretamente
curl -X POST http://localhost:8001/educator/turn \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'

# 3. Verificar logs
docker-compose logs ai | grep ERROR

# 4. Verificar saldo da API OpenAI
# https://platform.openai.com/usage
```

---

### Problema: Frontend mostra tela branca

**Sintoma:** `http://localhost:3000` carrega em branco

**Soluções:**

```bash
# 1. Verificar logs do Next.js
docker-compose logs frontend

# 2. Rebuild
cd frontend
rm -rf .next
npm run build
npm run dev

# 3. Verificar Browser Console (F12)
# Look for errors

# 4. Limpar cache do browser
# Ctrl+Shift+Delete
```

---

### Problema: Worker não processa jobs

**Sintoma:** Upload feito mas chunks não aparecem

**Soluções:**

```bash
# 1. Verificar se RabbitMQ está rodando
curl http://localhost:15672

# 2. Verificar fila
# http://localhost:15672 → Queues → content.extract
# Deve haver mensagens

# 3. Verificar logs do worker
docker-compose logs extraction_worker

# 4. Reiniciar worker
docker-compose restart extraction_worker
```

---

## 📚 Recursos Adicionais

- **Documentação Técnica:** `/docs/ARCHITECTURE.md`
- **Gaps & Roadmap:** `/docs/implementation-gaps-roadmap.md`
- **Container Status:** `/docs/container-services-status.md`
- **API Reference:** `/docs/api-reference.md` (se disponível)

---

## 🆘 Suporte

**Dúvidas de Desenvolvimento:**

- Abrir Issue no GitHub
- Tag: `question`

**Bugs Críticos:**

- Abrir Issue Priority P0
- Mencionar @maintainers

**Melhorias/Features:**

- Abrir Discussion no GitHub
- Tag: `enhancement`

---

**Última Revisão:** 2025-12-23  
**Próxima Atualização:** Conforme necessário
