# Guia de Deploy em Produção - AprendeAI

## 📋 Pré-requisitos

- Docker & Docker Compose instalados no servidor
- Domínio configurado (ex: aprendeai.com)
- Certificado SSL (recomendado: Let's Encrypt)

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
# Database
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI_123
DB_NAME=aprendeai

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASS=SUA_SENHA_RABBITMQ_456

# API
JWT_SECRET=GERE_UM_SECRET_ALEATORIO_789
NODE_ENV=production

# Frontend
API_URL=https://api.seudominio.com

# AI Service (Opcional)
# OPENAI_API_KEY=sk-...
```

**CRÍTICO**: Nunca commite o `.env` no Git!

## 🚀 Deploy

### 1. Build e Start

```bash
docker-compose -f infra/docker-compose.prod.yml up -d --build
```

### 2. Rodar Migrações

```bash
docker-compose -f infra/docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 3. (Opcional) Seed

```bash
docker-compose -f infra/docker-compose.prod.yml exec api npx ts-node prisma/seed.ts
```

## 📊 Monitoramento

### Verificar Status

```bash
docker-compose -f infra/docker-compose.prod.yml ps
```

### Logs

```bash
# Todos os serviços
docker-compose -f infra/docker-compose.prod.yml logs -f

# API apenas
docker-compose -f infra/docker-compose.prod.yml logs -f api
```

## 🔄 Atualização

```bash
# Pull latest code
git pull origin main

# Rebuild e restart
docker-compose -f infra/docker-compose.prod.yml up -d --build
```

## 🛡️ Segurança

- ✅ Senhas fortes em todas as variáveis
- ✅ JWT_SECRET único e aleatório
- ✅ HTTPS obrigatório (configure reverse proxy)
- ✅ Firewall configurado (portas 80, 443 apenas)
- ⚠️ NÃO exponha portas do DB/RabbitMQ publicamente

## 🌐 Nginx Reverse Proxy (Recomendado)

```nginx
# /etc/nginx/sites-available/aprendeai
server {
    listen 80;
    server_name aprendeai.com www.aprendeai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aprendeai.com www.aprendeai.com;

    ssl_certificate /etc/letsencrypt/live/aprendeai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aprendeai.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📈 Performance

- Use `pm2` ou similar para process management
- Configure auto-scaling se necessário
- Monitore com Prometheus/Grafana
- Logs centralizados (ELK stack)
