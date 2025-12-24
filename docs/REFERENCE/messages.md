# Referência de Mensageria (RabbitMQ)

## Filas e Tópicos

| Fila                 | Routing Key       | Payload Exemplo                           | Descrição                        |
| -------------------- | ----------------- | ----------------------------------------- | -------------------------------- |
| `news.fetch`         | `ingestion.news`  | `{"url": "...", "source": "cnn"}`         | Trigger para News Ingestor.      |
| `arxiv.fetch`        | `ingestion.arxiv` | `{"arxivId": "2301.12345"}`               | Trigger para Arxiv Ingestor.     |
| `content.process`    | `content.process` | `{"contentId": "uuid", "rawText": "..."}` | Texto bruto para análise AI.     |
| `extraction.process` | `extraction`      | `{"filePath": "/tmp/file.pdf"}`           | Arquivo local para OCR/Extração. |

## Políticas

- **Idempotência**: Os consumers devem verificar se o trabalho já foi feito (ex: checar status no DB) antes de processar, para lidar com redeliveries.
- **Retry**: Default de 3 tentativas com backoff exponencial antes de DLQ.
