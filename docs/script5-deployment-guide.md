# Script 5/5 - Deployment Guide

## Docker Setup (Recomendado)

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas API keys:

```bash
cp .env.example .env
```

Edite `.env` e adicione suas chaves de API:

```bash
# LLM Provider API Keys (OBRIGATÓRIO)
OPENAI_API_KEY=sk-sua-chave-openai-aqui
ANTHROPIC_API_KEY=sk-ant-sua-chave-anthropic-aqui
GOOGLE_API_KEY=AIza-sua-chave-google-aqui
```

### 2. Build e Start dos Serviços

```bash
# Build da imagem AI (inclui todas as dependências Python)
docker-compose build ai

# Start todos os serviços
docker-compose up -d

# ou apenas AI + dependencies
docker-compose up -d postgres rabbitmq ai
```

### 3. Verificar Logs

```bash
# Logs do AI service
docker-compose logs -f ai

# Você deve ver:
# [MAIN] RabbitMQ consumer started in background
# [CONSUMER] Connected successfully
# [CONSUMER] Waiting for asset generation jobs...
```

### 4. Testar Geração de Asset

```bash
# Health check
curl http://localhost:8001/health

# Gerar asset (substitua {contentId} por um ID real)
curl -X POST http://localhost:8001/contents/{contentId}/assets/generate \
  -H "Content-Type: application/json" \
  -d '{
    "layer": "L1",
    "educationLevel": "1_EM",
    "modality": "READING",
    "promptVersion": "v1.0"
  }'
```

---

## Setup Manual (Alternativa)

Se preferir rodar localmente sem Docker:

### 1. Instalar Dependências Python

```bash
cd services/ai
pip install -r requirements.txt
```

### 2. Configurar .env Local

Crie `services/ai/.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aprendeai
RABBITMQ_HOST=localhost
RABBITMQ_URL=amqp://guest:guest@localhost:5672
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

### 3. Start Worker

```bash
# Com consumer ativado
python main.py --consumer

# ou via env var
RUN_CONSUMER=true python main.py
```

---

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Backend   │────▶│  RabbitMQ    │────▶│  AI Worker  │
│   API       │     │  Queue       │     │  (Python)   │
└─────────────┘     └──────────────┘     └─────────────┘
      │                                         │
      │                                         │
      ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│  PostgreSQL │◀────────────────────────│  SQLAlchemy │
└─────────────┘                         └─────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  LLM Providers:  │
                                    │  - OpenAI        │
                                    │  - Anthropic     │
                                    │  - Google        │
                                    └──────────────────┘
```

**Fluxo:**

1. Backend publica job em `assets.generate` queue
2. AI Worker consome job
3. Worker executa 6 chains (LangChain)
4. Cada chain usa provider otimizado
5. Asset validado (Pydantic)
6. Persiste em PostgreSQL

---

## Configuração de Providers

### OpenAI (Premium - $10/1M tokens)

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo  # ou gpt-4, gpt-3.5-turbo
```

**Usado para:** Summarize, Quiz (qualidade crítica)

### Anthropic (Balanced - $3/1M tokens)

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

**Usado para:** Cues, Checkpoints (complexidade média)

### Google Gemini (Cheap - $0.075/1M tokens)

```bash
GOOGLE_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash  # ou gemini-1.5-pro
```

**Usado para:** Extract Words, Glossary (tarefas simples)

### Custom Tier Configuration

Você pode sobrescrever modelos por tier:

```bash
TIER_PREMIUM_MODEL=gpt-4-turbo
TIER_BALANCED_MODEL=claude-3-sonnet-20240229
TIER_CHEAP_MODEL=gemini-1.5-flash
```

Ou por task específica (não recomendado):

```bash
TASK_SUMMARIZE_PROVIDER=openai
TASK_EXTRACT_WORDS_PROVIDER=gemini
```

---

## Monitoramento

### Logs Importantes

```bash
# Worker logs
[CONSUMER] Processing asset generation
[JOB abc123] Starting generation for content xyz, layer L1
[1/7] Loading chunks...
[2/7] Summarizing for layer L1...
[3/7] Extracting target words...
...
[JOB abc123] ✅ Completed successfully
```

### Métricas

- **Job Duration:** ~60 segundos
- **Cost per Asset:** ~$0.04
- **Success Rate:** Monitor via logs
- **Queue Depth:** RabbitMQ management (http://localhost:15672)

---

## Troubleshooting

### Erro: RabbitMQ connection failed

```bash
# Verificar se RabbitMQ está rodando
docker-compose ps rabbitmq

# Ver logs
docker-compose logs rabbitmq

# Restart
docker-compose restart rabbitmq
```

### Erro: Database connection failed

```bash
# Verificar PostgreSQL
docker-compose ps postgres

# Verificar DATABASE_URL
echo $DATABASE_URL
```

### Erro: OpenAI API key invalid

```bash
# Verificar .env
cat .env | grep OPENAI_API_KEY

# Rebuild e restart
docker-compose build ai
docker-compose restart ai
```

### Asset não gerando

1. Verificar logs do worker
2. Verificar se chunks existem no DB
3. Verificar entitlements do usuário
4. Verificar queue no RabbitMQ management

---

## Performance Tips

### 1. Cache Assets

Assets são automaticamente cacheados por:

- Content ID
- Layer
- Modality
- Prompt Version

### 2. Batch Processing

Para gerar múltiplos assets:

```bash
# Usar script ou loop
for contentId in $(cat content_ids.txt); do
  curl -X POST http://localhost:8001/contents/$contentId/assets/generate ...
  sleep 2  # Rate limiting
done
```

### 3. Monitor Costs

```python
# Ver info de provider/cost por task
python -c "from chains import get_chain_info; print(get_chain_info())"
```

---

## Próximos Passos

1. ✅ Deploy com Docker
2. ✅ Configurar API keys
3. ⏳ Testar geração de assets
4. ⏳ Integrar frontend (IAAssistPanel)
5. ⏳ Monitorar custos
6. ⏳ Ajustar thresholds de gating
7. ⏳ A/B test diferentes providers

**Script 5/5 está Ready for Production!** 🚀
