# Referência da API

A API segue padrões RESTful. Abaixo estão os endpoints principais.

> **Nota**: A documentação Swagger completa está disponível em `/api/docs` quando o servidor está rodando.

## Autenticação

### Login

`POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"password"}'
```

**Resposta**:

```json
{ "accessToken": "eyJ..." }
```

## Conteúdo

### Criar Conteúdo (URL)

`POST /api/v1/contents`

```json
{
  "url": "https://example.com/article",
  "type": "ARTICLE"
}
```

### Listar Conteúdos

`GET /api/v1/contents`

## Sessões de Leitura

### Iniciar Sessão

`POST /api/v1/sessions/start`
Body: `{ "contentId": "..." }`

### Interagir (Chat)

`POST /api/v1/sessions/:id/prompt`
Body: `{ "message": "Explique este parágrafo" }`
