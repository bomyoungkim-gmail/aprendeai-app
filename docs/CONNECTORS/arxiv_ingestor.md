# Arxiv Ingestor

Este worker consome pedidos para baixar e indexar papers do Arxiv.org.

## Objetivo

Baixar metadados (título, abstract, autores) e o PDF completo de papers científicos.

## Fontes

- API Pública do Arxiv (`http://export.arxiv.org/api/query`)
- PDFs diretos (`http://arxiv.org/pdf/`)

## Dados Extraídos

```json
{
  "title": "Attention Is All You Need",
  "summary": "The dominant sequence transduction models...",
  "authors": ["Vaswani", "Shazeer"],
  "published": "2017-06-12",
  "pdfUrl": "http://arxiv.org/pdf/1706.03762v5",
  "rawText": "..." // Extraído do PDF
}
```

## Riscos

- A API do Arxiv pede respeito aos rate limits (máx 1 request a cada 3 segundos).
- PDFs muito grandes podem estourar memória na extração de texto.

## Como Testar

Ver logs do worker:

```bash
docker-compose logs -f arxiv_ingestor
```

Enfileirar teste (via API mock ou script):
`verify-fullstack.ps1` já testa o fluxo geral se houver mocks.
