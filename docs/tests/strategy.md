# Estratégia de Testes

## Visão Geral

O projeto utiliza uma estratégia de testes em camadas (Pirâmide de Testes).

1.  **Unit Tests**: Jest (API/Workers) e Pytest (AI). Rápidos, isolados.
2.  **Integration Tests**: Testes de API supertest (com DB de teste).
3.  **E2E Tests**: Playwright (Frontend -> Backend real).

## Estrutura

- `frontend/tests/e2e`: Testes Playwright (User monitoring flows).
- `services/api/test`: Testes de integração NestJS.
- `services/ai/tests`: Testes unitários do serviço Python.

## Mocks e Drivers

- **Selenium**: Usado pelos workers de scraping. Em testes, usamos mocks ou uma instância headless local.
- **RabbitMQ**: Unit tests mockam a conexão AMQP. Integration tests podem usar container real.

## Smoke Tests

O script `verify-fullstack.ps1` na raiz serve como smoke test rápido pós-deploy/start.
