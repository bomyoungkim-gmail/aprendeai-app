# [ADR-0002] Separação API vs Workers

- **Status**: Aceito
- **Data**: 2024-01-15
- **Contexto**: O processamento de artigos e PDFs pode demorar segundos ou minutos. Bloquear a API REST durante esse tempo causaria timeouts no frontend e falta de escalabilidade.
- **Decisão**: Desacoplar a ingestão usando RabbitMQ e Workers especializados. A API apenas aceita o pedido e retorna "202 Accepted" ou cria o recurso em estado "PENDING".
- **Consequências**:
  - (+) API resiliente e rápida.
  - (+) Workers podem escalar horizontalmente independentemente da API.
  - (-) Maior complexidade operacional (manter RabbitMQ).
  - (-) UX precisa lidar com estados assíncronos (Polling/Websocket).
