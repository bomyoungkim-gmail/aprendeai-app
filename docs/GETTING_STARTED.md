# Getting Started

## Pré-requisitos

- **Docker Desktop** (com suporte a containers Linux)
- **Node.js 18+** (para desenvolvimento local)
- **Python 3.10+** (para AI service se rodar fora do Docker)
- **PostgreSQL Client** (opcional, para debug)

## Estrutura do Repositório

```
aprendeai-app/
├── frontend/             # Next.js App (Port 3000)
├── services/
│   ├── api/             # NestJS Backend (Port 4000)
│   ├── ai/              # Python FastAPI AI Service (Port 8001)
│   └── workers/         # Background Workers
│       ├── news_ingestor/
│       ├── arxiv_ingestor/
│       ├── content_processor/
│       └── extraction_worker/
├── infra/               # Configurações Docker/Infra
└── scripts/             # Scripts utilitários
```

## Setup Inicial (Docker Compose)

O método recomendado para rodar a stack completa é via Docker Compose.

1.  **Clone o repositório**

    ```bash
    git clone https://github.com/seu-org/aprendeai-app.git
    cd aprendeai-app
    ```

2.  **Configurar Variáveis de Ambiente**
    Copie o exemplo para criar seu `.env`:

    ```bash
    cp .env.example .env.docker
    # Ajuste as variáveis em .env.docker se necessário (chaves de API, etc)
    ```

3.  **Subir a Stack**

    ```bash
    docker-compose up -d --build
    ```

    Isso subirá:

    - Postgres (5432)
    - Redis (6379)
    - RabbitMQ (5672/15672)
    - Backend API (4000)
    - AI Service (8001)
    - Workers (background)
    - Frontend (não listado no compose padrão para dev, rodar localmente ou verificar se está no compose)

    _Nota: Se o frontend não estiver no compose, rodar localmente:_

    ```bash
    cd frontend
    npm install
    npm run dev
    # Acessar em http://localhost:3000
    ```

## Smoke Test (Verificação)

Utilize o script PowerShell incluído para validar a saúde de todos os serviços.

**Windows (PowerShell):**

```powershell
./verify-fullstack.ps1
```

**Verificação Manual (Curl):**

1.  **Backend API Health:**

    ```bash
    curl http://localhost:4000/health
    ```

2.  **AI Service Health:**

    ```bash
    curl http://localhost:8001/health
    ```

3.  **RabbitMQ Management:**
    Acesse `http://localhost:15672` (User: `guest`, Pass: `guest`)

## Desenvolvimento Local (Híbrido)

Se deseja rodar serviços específicos localmente:

1.  Suba apenas infra:
    ```bash
    docker-compose up -d postgres redis rabbitmq
    ```
2.  Rode a API:
    ```bash
    cd services/api
    npm install
    npm run start:dev
    ```
