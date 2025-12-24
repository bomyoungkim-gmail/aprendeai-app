# Documentando Conectores

Esta pasta contém a documentação específica para cada conector/ingestor do sistema.

## Template de Documentação

Ao criar um novo conector, crie um arquivo `<nome_conector>.md` com:

### Objetivo

O que este conector faz? (Ex: Scrape de CNN, API do Youtube).

### Fontes Autorizadas

URLs ou APIs alvo.

### Dados Extraídos

Schema do JSON extraído (ex: Título, Autor, Corpo, Data).

### Riscos e Limitações

- Possui Rate Limit?
- Requer proxy?
- Bloqueia IPs de datacenter?

### Como Testar

Comando para disparar um teste manual (ex: enviar msg para fila).
