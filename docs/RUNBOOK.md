# Runbook Operacional

Este documento descreve procedimentos para manter, monitorar e recuperar o sistema AprendeAI.

## 🏥 Verificação de Saúde

### Comandos Rápidos

1.  **Status dos Containers**:

    ```bash
    docker-compose ps
    ```

    _Esperado: Todos com status "Up" (healthy)._

2.  **Logs em Tempo Real**:

    ```bash
    docker-compose logs -f --tail=100 api
    docker-compose logs -f --tail=100 ai
    ```

3.  **Fila de Mensagens**:
    Verifique se há acúmulo de mensagens não processadas.
    - Acesse RabbitMQ Management: http://localhost:15672
    - Verifique filas: `news.fetch`, `content.process`.

## 🐛 Como Depurar Falhas

### Filtrar Logs por Job/Request

Se você tiver um ID de erro ou Job ID:

```bash
docker-compose logs | grep "JOB-12345"
```

### Reprocessar Mensagens (DLQ)

Se mensgens forem para a DLQ (Dead Letter Queue):

1.  Acesse RabbitMQ Management.
2.  Vá na fila `dlq` correspondente.
3.  Use a função "Move messages" (shovel) para mover de volta à fila original para retry manual.

## 🔄 Rotinas Operacionais

### Limpeza de Artifacts

Arquivos temporários de upload podem acumular.

```bash
# Exemplo (ajustar path real)
find ./uploads -mtime +7 -delete
```

### Reiniciar Serviço Travado

Se o `ai-service` parar de responder (timeout):

```bash
docker-compose restart ai
```

## 🚨 Playbooks de Incidentes

### 1. RabbitMQ Indisponível

**Sintoma**: Logs da API mostram `ECONNREFUSED` na porta 5672.
**Ação**:

1.  Verifique logs do RabbitMQ: `docker-compose logs rabbitmq`.
2.  Se erro for partição de disco/memória, reinicie o container.
3.  A API e Workers devem reconectar automaticamente.

### 2. Workers Parados

**Sintoma**: Jobs ficam em `PENDING` no banco e filas crescem.
**Ação**:

1.  Verifique se o worker específico está rodando (`docker-compose ps`).
2.  Verifique logs de erro no worker (`docker-compose logs news_ingestor`).
3.  Se houver erro de parsing repetitivo, identifique a mensagem "venenosa" na fila e remova-a (ou mova para DLQ).

### 3. AI Service Timeout/Lentidão

**Sintoma**: Erros 504 no frontend ou workers falhando ao chamar AI.
**Ação**:

1.  Verifique carga no container AI.
2.  Verifique latência das chaves de API externas (OpenAI/Anthropic).
3.  Considere escalar o timeout nos clientes HTTP ou reiniciar o serviço python.
