# AprendeAI - Plataforma Educacional de Leitura e Vocabulário

**AprendeAI** é uma plataforma focada no enriquecimento de vocabulário e compreensão de textos em múltiplos idiomas (PT-BR, EN, KO), utilizando inteligência artificial para personalizar o aprendizado. A aplicação é voltada para instituições escolares, professores, alunos e usuários autodidatas.

## 🚀 Visão Geral

O sistema permite a ingestão de conteúdos reais (notícias, artigos científicos do arXiv) e materiais didáticos, processando-os com IA para gerar:

- Simplificações de texto adaptadas ao nível escolar.
- Traduções contextuais.
- Avaliações de compreensão automáticas.
- Ferramentas de estudo ativo (Método Cornell).

## 🛠 Stack Tecnológica

O projeto é um **Monorepo** composto por:

- **Frontend**: Next.js 14, React 18, Tailwind CSS.
- **Backend API**: NestJS (Node.js), Prisma ORM, PostgreSQL.
- **AI Service**: Python (FastAPI), LangChain.
- **Workers**: Node.js, RabbitMQ para processamento assíncrono.
- **Infraestrutura**: Docker, Docker Compose, AWS-ready.

## 📂 Estrutura do Projeto

- `/frontend`: Aplicação Web.
- `/services/api`: API principal de negócio.
- `/services/ai`: Serviço de NLP e IA.
- `/services/workers`: Workers de ingestão e processamento.
- `/infra`: Configurações de Docker e deploy.
- `/docs`: Documentação detalhada.

## 📖 Documentação Completa

Para detalhes técnicos, guias de instalação e arquitetura, consulte a pasta [docs](./docs/):

- [Guia de Início Rápido (Local & Prod)](./docs/README.md)
- [Tecnologias Utilizadas](./docs/TECNOLOGIA.md)
- [Arquitetura e Estrutura](./docs/ESTRUTURA.md)
- [Plano de Implementação](./docs/PLANO_IMPLEMENTACAO.md)

## ⚡ Como Rodar Localmente

Certifique-se de ter o Docker instalado e execute:

```bash
docker-compose up --build
```

Isso iniciará todos os serviços (Frontend, API, IA, Banco de Dados, etc).

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
