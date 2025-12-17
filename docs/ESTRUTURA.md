# Estrutura da Aplicação

O projeto é um Monorepo organizado da seguinte forma:

```
/
├── db/                     # Banco de Dados
│   ├── migrations/         # Migrações do Prisma (SQL)
│   └── schema.prisma       # Definição dos modelos de dados
│
├── docs/                   # Documentação do projeto
│
├── frontend/               # Aplicação Web (Next.js)
│   ├── app/                # Rotas e páginas (App Router)
│   ├── components/         # Componentes React reutilizáveis
│   └── lib/                # Utilitários e configurações
│
├── infra/                  # Infraestrutura
│   ├── docker/             # Dockerfiles para cada serviço
│   └── docker-compose.yml  # Orquestração local
│
└── services/               # Serviços de Backend
    ├── api/                # API Principal (NestJS)
    │   └── src/            # Código fonte da API (Módulos, Services, Controllers)
    │
    ├── ai/                 # Serviço de IA (FastAPI/Python)
    │   └── main.py         # Entrypoint da API Python
    │
    └── workers/            # Workers de Segundo Plano
        ├── news_ingestor/  # Ingestão de Notícias
        ├── arxiv_ingestor/ # Ingestão do arXiv
        └── content_processor/ # Processamento de Conteúdo (Chamadas à IA)
```

## Fluxo de Dados Básico

1. **Frontend** comunica-se com a **API (NestJS)** via REST.
2. **API** lê/escreve no **PostgreSQL** e pode publicar mensagens no **RabbitMQ**.
3. **Workers** escutam o **RabbitMQ**, processam dados (buscando notícias ou chamando a IA) e salvam no banco ou notificam a API.
4. **Serviço de IA** é uma API stateless chamada pelos Workers ou pela API principal para processamento de texto on-demand.
