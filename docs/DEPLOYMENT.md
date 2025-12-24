# Guia de Deployment

Este documento descreve as considerações e passos para levar o AprendeAI para um ambiente de produção.

## Estratégia de Hospedagem

A arquitetura containerizada permite flexibilidade. O modelo recomendado é **Docker Swarm** ou **Kubernetes** para orquestração, mas um setup simples com VM única + Docker Compose também funciona para escalas menores.

### Requisitos Mínimos (Prod)

- **CPU**: 2 vCPUs (devido ao AI service e Workers)
- **RAM**: 4GB+ (8GB recomendado se rodar modelos locais)
- **Storage**: SSD rápido (para Postgres e logs)

## Checklist de Produção

### 1. Variáveis de Ambiente (`.env.production`)

Nunca use o `.env.example` em produção.

- `NODE_ENV=production`
- `ENV=production`
- **Segurança**:
  - `JWT_SECRET`: Gere uma string longa e aleatória (`openssl rand -hex 64`).
  - `AI_SERVICE_SECRET`: Para autenticação entre API e AI Service.
  - `DB_PASSWORD` / `RABBITMQ_PASS`: Senhas fortes.
- **URLs**:
  - `FRONTEND_URL`: Domínio real (ex: `https://app.aprendeai.com`)
  - `API_URL`: Domínio da API (ex: `https://api.aprendeai.com`)

### 2. Banco de Dados

- Não use o Postgres do `docker-compose` para persistência crítica se possível. Prefira um **Managed Database** (AWS RDS, Google Cloud SQL, DigitalOcean Managed DB) para backups automáticos e HA.
- Rode as migrations antes de iniciar a API:
  ```bash
  npx prisma migrate deploy
  ```

### 3. Proxy Reverso & SSL

Não exponha as portas 3000/4000/8001 diretamente. Use **Nginx** ou **Traefik** como entrypoint.

- Termine SSL no Proxy (HTTPS -> HTTP interno).
- Configure timeouts longos para endpoints de AI (alguns requests levam >30s).

### 4. Build de Imagens

Não use volumes (`-v .:/app`) em produção. Construa as imagens finais.

```bash
# Exemplo de Build
docker build -t registry.seudominio.com/aprendeai-api:v1 -f infra/docker/api.Dockerfile .
docker build -t registry.seudominio.com/aprendeai-frontend:v1 -f infra/docker/frontend.Dockerfile .
```

## Monitoramento

- **Logs**: Configure o Docker logging driver para enviar logs para um agregador (Elasticsearch, CloudWatch, Datadog) em vez de apenas `json-file`.
- **APM**: O código já possui instrumentação básica. Ative Sentry setando `SENTRY_DSN`.

## Escala (Horizontal)

- **Stateless**: A API e o Frontend são stateless. Podem ter N réplicas.
- **Workers**: Podem ter N réplicas baseadas no tamanho da fila RabbitMQ.
- **AI Service**: Escala depende de GPU/CPU. Pode ser o gargalo.
- **Stateful**: Postgres, Redis e RabbitMQ são os pontos de estado único (clusterizar se necessário).
