# AprendeAI - Plataforma de Aprendizagem Adaptativa

Bem-vindo ao repositório do AprendeAI App.

## 📚 Documentação

A documentação completa está disponível na pasta `docs/`.

### 🚀 Começando

- [Getting Started](docs/GETTING_STARTED.md): Setup, instalação e como rodar.
- [Arquitetura](docs/ARCHITECTURE.md): Diagramas e visão geral do sistema.
- [Runbook](docs/RUNBOOK.md): Guia operacional, debug e verificação de saúde.

### 🧩 Componentes

- [App (Frontend & API)](docs/APP.md): Detalhes da aplicação de usuário.
- [Core (Workers & AI)](docs/CORE.md): Detalhes dos serviços de processamento.
- [Games System](docs/GAMES_SYSTEM.md): Engine de jogos educativos AI-powered.
- [Conectores](docs/CONNECTORS/README.md): Documentação dos ingestores (News, Arxiv, etc).

### 📖 Referência

- [Deployment Guide](docs/DEPLOYMENT.md): Guia de produção.
- [API Reference](docs/REFERENCE/api.md)
- [Database Schema](docs/REFERENCE/database.md)

* [Mensageria (Events)](docs/REFERENCE/messages.md)
* [ADRs (Design Decisions)](docs/ADRs/0001-template.md)

### 🧪 Qualidade

- [Test Strategy](docs/test/strategy.md): Como testamos.
- [Política de Documentação](docs/DOCUMENTATION_POLICY.md): Regras para manter este repo são.

---

## Estrutura Rápida

- `frontend/`: Aplicação Next.js
- `services/`: Microsserviços (API, AI, Workers)
- `infra/`: Configurações Docker/K8s
- `docs/`: Documentação do Projeto

Para iniciar agora mesmo:

```bash
cp .env.example .env.docker
docker-compose up -d --build
./verify-fullstack.ps1
```
