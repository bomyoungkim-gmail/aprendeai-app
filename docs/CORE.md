# Documentação CORE

O CORE compreende os serviços de processamento assíncrono e inteligência artificial que suportam a aplicação.

## Módulos

### 1. AI Service (`services/ai`)

- **Tech**: Python, FastAPI, LangChain.
- **Responsabilidade**: Processamento de Linguagem Natural (NLP), geração de embeddings, chat RAG.
- **games System**: Contém a engine de jogos educacionais. Veja [Documentação do Sistema de Jogos](GAMES_SYSTEM.md) para detalhes completos.
- **Porta**: 8001.
- **Principais Endpoints**:
  - `POST /educator/turn`: Processa turno de chat educativo.
  - `POST /games/*`: Endpoints da engine de jogos.
  - `POST /simplify`: Simplifica textos complexos.
  - `POST /generate-assessment`: Cria quizzes baseados em conteúdo.

### 2. Workers (`services/workers`)

Serviços Node.js autônomos.

| Serviço             | Fila RabbitMQ        | Função                                            |
| ------------------- | -------------------- | ------------------------------------------------- |
| `news_ingestor`     | `news.fetch`         | Monitora RSS feeds e extrai novas notícias.       |
| `arxiv_ingestor`    | `arxiv.fetch`        | Busca papers no Arxiv API e baixa PDFs/Metadados. |
| `content_processor` | `content.process`    | Orquestra análise de conteúdo (chama AI service). |
| `extraction_worker` | `extraction.process` | OCR e extração de texto de arquivos (PDF/Img).    |

## Interface de Workers

Os workers seguem um padrão comum:

1.  Conectam no RabbitMQ ao iniciar.
2.  Configuram `prefetch` (geralmente 1) para evitar sobrecarga.
3.  Processam a mensagem.
4.  **Ack** se sucesso, **Nack** (com requeue ou DLQ) se falha.

Exemplo de estrutura de mensagem (`content.process`):

```json
{
  "contentId": "uuid-1234",
  "text": "Conteúdo bruto...",
  "options": {
    "generateSummary": true
  }
}
```

## Persistência

- **Postgres**: Estado final dos Jobs e Conteúdos processados.
- **Redis**: Cache de respostas da AI e controle de rate-limit.
- **Sistema de Arquivos**: PDFs baixados e assets temporários (em `uploads/` ou volume Docker).
