# 📚 Documentação do Projeto - Índice

**Última Atualização:** 2025-12-20

---

## 🚀 Início Rápido

- **[Manual Start Guide](manual_start_guide.md)** - Como iniciar API e Frontend manualmente
  - Comandos passo-a-passo
  - Troubleshooting comum
  - Verificação de saúde dos serviços

---

## ⚙️ Configuração

### Variáveis de Ambiente

- **[ENV Resolution Summary](env_resolution_summary.md)** - Resumo da configuração ENV
  - Estrutura de arquivos
  - Fixes aplicados
  - Validação completa
- **[ENV Conflicts Analysis](env_conflicts_analysis.md)** - Análise detalhada de conflitos
  - Problemas identificados
  - Matriz de conflitos
  - Soluções recomendadas

### Arquitetura

- **[CORS & Frontend URL Explained](cors_frontend_explained.md)** - Por que CORS e Frontend usam :3000
  - Fluxo de requisição
  - Casos de uso
  - Analogias e exemplos

---

## 🔍 Investigações e Troubleshooting

- **[RabbitMQ Investigation Report](rabbitmq_investigation_report.md)** - Investigação completa do RabbitMQ
  - Status dos containers
  - Root cause analysis
  - Plano de recuperação

---

## 📋 Documentação Original

- **[Implementation Gaps & Roadmap](implementation-gaps-roadmap.md)** - Status geral do projeto
  - 100%+ Production Ready
  - 14 sistemas principais completos
  - Estatísticas da sessão

---

## 🎯 Quick Links

| Documento                                                            | Propósito                 | Quando Usar                         |
| -------------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| [manual_start_guide.md](manual_start_guide.md)                       | Iniciar serviços          | Sempre que precisar rodar o app     |
| [env_resolution_summary.md](env_resolution_summary.md)               | Entender configuração ENV | Problemas com variáveis de ambiente |
| [cors_frontend_explained.md](cors_frontend_explained.md)             | Entender CORS             | Erros de CORS no browser            |
| [rabbitmq_investigation_report.md](rabbitmq_investigation_report.md) | Debug RabbitMQ            | Problemas com message queue         |

---

## 📁 Estrutura do Projeto

```
aprendeai-app/
├── docs/                           # Esta pasta - Documentação
│   ├── INDEX.md                    # Este arquivo
│   ├── manual_start_guide.md       # Guia de início
│   ├── env_resolution_summary.md   # Configuração ENV
│   ├── cors_frontend_explained.md  # CORS explicado
│   └── ...
├── services/
│   ├── api/                        # Backend NestJS
│   │   └── .env.local             # Config ativa (não commitado)
│   └── ai/                         # Serviço AI Python
├── frontend/                       # Frontend Next.js
│   └── .env.local                 # Config ativa (não commitado)
├── .env                            # Docker Compose vars
└── docker-compose.yml              # Orquestração de containers
```

---

## 🔧 Comandos Úteis

### Iniciar Desenvolvimento

```bash
# Docker services
docker compose up -d postgres redis rabbitmq

# API (Terminal 1)
cd services/api && npm run start:dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### Verificação

```bash
# Health check
curl http://localhost:4000/health

# Status containers
docker ps | grep socrates
```

### Troubleshooting

```bash
# Ver logs da API
docker logs socrates-api --tail 50

# Reiniciar serviços Docker
docker compose restart postgres redis rabbitmq
```

---

**Desenvolvido por:** AprendeAI Team  
**Versão:** 1.0.0  
**Status:** Production Ready ✅
