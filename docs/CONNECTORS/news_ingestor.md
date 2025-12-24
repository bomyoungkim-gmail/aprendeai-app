# News Ingestor

Este worker monitora feeds RSS configurados e ingere notícias automaticamente para a plataforma.

## Objetivo

Manter o sistema atualizado com as últimas notícias de fontes confiáveis, permitindo que usuários recebam conteúdo fresco para aprendizado de idiomas ou tópicos específicos.

## Fontes

- Qualquer URL de RSS Feed válido (XML/Atom).
- Exemplos: BBC, CNN, TechCrunch, etc.
- Configuração via Banco de Dados (tabela `Source` ou similar - _verificar implementação real_).

## Funcionamento

1.  Worker acorda periodicamente (cron ou trigger RabbitMQ).
2.  Lê lista de feeds ativos.
3.  Faz parsing do XML do RSS.
4.  Verifica se o item (URL) já foi importado (de-duplicação via hash ou URL).
5.  Se novo:
    - Extrai título, resumo, link e data.
    - Publica mensagem na fila `content.process` para que o texto completo seja baixado e analisado.

## Dados Extraídos

```json
{
  "title": "New Tech Released",
  "link": "https://techcrunch.com/...",
  "pubDate": "2024-01-20T10:00:00Z",
  "contentSnippet": "Resumo curto do RSS...",
  "guid": "unique-id-from-rss"
}
```

## Riscos

- **RSS Inválido**: Feeds podem mudar de formato ou quebrar. Worker deve ter tratamento de erro robusto (não crashar o processo).
- **Volume**: Alguns feeds publicam centenas de itens por dia. O sistema de de-duplicação é consultado frequentemente.

## Como Testar

Verificar logs de processamento:

```bash
docker-compose logs -f news_ingestor
```

Forçar ingestão (se houver comando manual implementado):
_Geralmente via trigger na API administrativa ou reinício do container._
