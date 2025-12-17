# Plano de Implementação

O desenvolvimento do monorepo AprendeAI segue as seguintes fases:

## Fase 1: Skeleton e Infraestrutura (Concluído ✅)

- [x] Estruturação do Monorepo.
- [x] Configuração do Docker e Docker Compose.
- [x] Definição do Schema do Banco de Dados (Prisma).
- [x] Criação dos serviços vazios (API, AI, Workers, Frontend).

## Fase 2: Serviços Core (Em Andamento 🚧)

- [ ] **API**: Implementar autenticação (Login/Register).
- [ ] **API**: CRUD de Instituições e Turmas.
- [ ] **API**: CRUD de Conteúdos.
- [ ] **Frontend**: Telas de Login e Dashboard básico.

## Fase 3: Ingestão e IA (Próximos Passos)

- [ ] **Workers**: Implementar busca de notícias (NewsAPI/RSS).
- [ ] **Workers**: Implementar integração com arXiv.
- [ ] **IA**: Implementar endpoint `/simplify` com LangChain.
- [ ] **IA**: Implementar endpoint `/generate-assessment`.
- [ ] **Integração**: Conectar Workers -> RabbitMQ -> IA -> API -> DB.

## Fase 4: Funcionalidades de Estudo

- [ ] **Frontend**: Interface de Leitura com Método Cornell.
- [ ] **API**: Salvar e recuperar notas Cornell.
- [ ] **API**: Sistema de Avaliações (Assessments).

## Fase 5: Analytics e Polimento

- [ ] **API**: Dashboards de analytics.
- [ ] **Frontend**: Gráficos e visualização de progresso.
- [ ] **Deploy**: Preparação para AWS (ECS/RDS).
