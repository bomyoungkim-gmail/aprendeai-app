# Cornell Reader V1 - Walkthrough de Testes Backend

## 🎯 Objetivo

Testar todos os endpoints do Cornell Reader backend para validar:

- ✅ Autenticação JWT
- ✅ Criação e listagem de conteúdo
- ✅ Cornell Notes (CRUD)
- ✅ Highlights (CRUD)
- ✅ File URLs de visualização

---

## 📋 Pré-requisitos

### 1. API Rodando

```bash
cd services/api
npm run start:dev
```

✅ **Verificar:** Console deve mostrar `Nest application successfully started`

### 2. Database Populado

```bash
npx prisma db seed
```

✅ **Verificar:** Deve mostrar "🎉 Seed completed successfully!"

### 3. Ferramenta de Teste

Escolha uma:

- **Opção A:** curl (linha de comando)
- **Opção B:** Postman (GUI)
- **Opção C:** Insomnia (GUI)
- **Opção D:** REST Client (VS Code extension)

---

## 🔐 Etapa 1: Autenticação

### Objetivo

Obter JWT token para acessar endpoints protegidos.

### 1.1 Login com Usuário Demo

**Endpoint:** `POST /auth/login`

#### curl:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "demo123"
  }'
```

#### Postman:

```
Method: POST
URL: http://localhost:3000/auth/login
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "email": "maria@example.com",
  "password": "demo123"
}
```

#### ✅ Resposta Esperada:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "Maria Silva",
    "email": "maria@example.com",
    "role": "STUDENT"
  }
}
```

### 1.2 Salvar Token

**IMPORTANTE:** Copie o `access_token` e use em todas as requisições seguintes!

```bash
# Salvar em variável (bash)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ou criar arquivo .token
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." > .token
```

---

## 📄 Etapa 2: Listar Conteúdos do Usuário

### Objetivo

Obter lista de conteúdos que o usuário possui.

**Endpoint:** `GET /contents/my-contents`

#### curl:

```bash
curl -X GET http://localhost:3000/api/contents/my-contents \
  -H "Authorization: Bearer $TOKEN"
```

#### Postman:

```
Method: GET
URL: http://localhost:3000/api/contents/my-contents
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ✅ Resposta Esperada:

```json
[
  {
    "id": "content-uuid-1",
    "title": "Photosynthesis: Converting Light to Energy",
    "type": "PDF",
    "sourceUrl": "https://example.com/photosynthesis-lesson.pdf",
    "createdAt": "2024-12-18T...",
    "file": {
      "id": "file-uuid-1",
      "originalFilename": "Photosynthesis - Biology Lesson.pdf",
      "mimeType": "application/pdf"
    }
  },
  {
    "id": "content-uuid-2",
    "title": "Animal Cell Structure",
    "type": "IMAGE",
    ...
  },
  {
    "id": "content-uuid-3",
    "title": "Climate Change and Its Effects on Ecosystems",
    "type": "ARTICLE",
    ...
  }
]
```

### 💾 Salvar Content ID

Copie o primeiro `id` para usar nos testes seguintes:

```bash
export CONTENT_ID="content-uuid-1"
```

---

## 📝 Etapa 3: Obter/Criar Cornell Notes

### Objetivo

Buscar Cornell notes existentes ou criar entry vazio se não existir.

**Endpoint:** `GET /contents/:id/cornell`

#### curl:

```bash
curl -X GET http://localhost:3000/api/contents/$CONTENT_ID/cornell \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ Resposta Esperada:

```json
{
  "id": "cornell-uuid-1",
  "contentId": "content-uuid-1",
  "userId": "user-uuid",
  "cuesJson": [
    {
      "id": "cue-1",
      "prompt": "What are the two stages of photosynthesis?",
      "linked_highlight_ids": ["hl-1"]
    },
    {
      "id": "cue-2",
      "prompt": "Where does the light-dependent reaction occur?",
      "linked_highlight_ids": ["hl-2"]
    }
  ],
  "notesJson": [
    {
      "id": "note-1",
      "body": "Light-dependent reactions happen in thylakoid membranes...",
      "linked_highlight_ids": ["hl-2"]
    },
    {
      "id": "note-2",
      "body": "Calvin cycle (light-independent) uses ATP and NADPH...",
      "linked_highlight_ids": ["hl-1"]
    }
  ],
  "summaryText": "Photosynthesis has two main stages...",
  "createdAt": "2024-12-18T...",
  "updatedAt": "2024-12-18T..."
}
```

---

## ✏️ Etapa 4: Atualizar Cornell Notes

### Objetivo

Modificar cues, notes e summary de um conteúdo.

**Endpoint:** `PUT /contents/:id/cornell`

#### curl:

```bash
curl -X PUT http://localhost:3000/api/contents/$CONTENT_ID/cornell \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cuesJson": [
      {
        "id": "cue-new-1",
        "prompt": "What is the chemical formula of glucose?",
        "linked_highlight_ids": []
      },
      {
        "id": "cue-new-2",
        "prompt": "Why is chlorophyll green?",
        "linked_highlight_ids": []
      }
    ],
    "notesJson": [
      {
        "id": "note-new-1",
        "body": "C6H12O6 (6 carbons, 12 hydrogens, 6 oxygens)",
        "linked_highlight_ids": []
      },
      {
        "id": "note-new-2",
        "body": "Absorbs red/blue light, reflects green wavelengths",
        "linked_highlight_ids": []
      }
    ],
    "summaryText": "Updated summary: Photosynthesis produces glucose (C6H12O6) using light energy captured by chlorophyll."
  }'
```

#### Postman:

```
Method: PUT
URL: http://localhost:3000/api/contents/{CONTENT_ID}/cornell
Headers:
  Authorization: Bearer {TOKEN}
  Content-Type: application/json
Body (raw JSON):
{
  "cuesJson": [...],
  "notesJson": [...],
  "summaryText": "..."
}
```

#### ✅ Resposta Esperada:

```json
{
  "id": "cornell-uuid-1",
  "cuesJson": [...], // Updated
  "notesJson": [...], // Updated
  "summaryText": "Updated summary...",
  "updatedAt": "2024-12-18T12:45:00.000Z" // Newer timestamp
}
```

---

## 🖍️ Etapa 5: Listar Highlights

### Objetivo

Obter todos os highlights de um conteúdo.

**Endpoint:** `GET /contents/:id/highlights`

#### curl:

```bash
curl -X GET http://localhost:3000/api/contents/$CONTENT_ID/highlights \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ Resposta Esperada:

```json
[
  {
    "id": "hl-1",
    "contentId": "content-uuid-1",
    "kind": "TEXT",
    "targetType": "PDF",
    "pageNumber": 1,
    "anchorJson": {
      "type": "PDF_TEXT",
      "position": { ... },
      "quote": "The Calvin cycle occurs in the stroma of chloroplasts"
    },
    "colorKey": "yellow",
    "commentText": "Important: Location of Calvin cycle",
    "tagsJson": ["photosynthesis", "calvin-cycle"],
    "createdAt": "2024-12-18T..."
  },
  {
    "id": "hl-2",
    "kind": "TEXT",
    "targetType": "PDF",
    "pageNumber": 2,
    "colorKey": "green",
    ...
  }
]
```

---

## ➕ Etapa 6: Criar Novo Highlight

### Objetivo

Adicionar highlight de texto em um PDF.

**Endpoint:** `POST /contents/:id/highlights`

#### curl:

```bash
curl -X POST http://localhost:3000/api/contents/$CONTENT_ID/highlights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "TEXT",
    "targetType": "PDF",
    "pageNumber": 3,
    "anchorJson": {
      "type": "PDF_TEXT",
      "position": {
        "boundingRect": {
          "x1": 150,
          "y1": 300,
          "x2": 500,
          "y2": 320,
          "width": 350,
          "height": 20
        },
        "rects": [{
          "x1": 150,
          "y1": 300,
          "x2": 500,
          "y2": 320,
          "width": 350,
          "height": 20,
          "pageNumber": 3
        }],
        "pageNumber": 3
      },
      "quote": "ATP synthase converts ADP to ATP using proton gradient"
    },
    "colorKey": "blue",
    "commentText": "Key concept for cellular respiration!",
    "tagsJson": ["ATP", "energy", "important"]
  }'
```

#### Postman:

```
Method: POST
URL: http://localhost:3000/api/contents/{CONTENT_ID}/highlights
Headers:
  Authorization: Bearer {TOKEN}
  Content-Type: application/json
Body (raw JSON):
{
  "kind": "TEXT",
  "targetType": "PDF",
  "pageNumber": 3,
  "anchorJson": { ... },
  "colorKey": "blue",
  "commentText": "Key concept!",
  "tagsJson": ["ATP"]
}
```

#### ✅ Resposta Esperada:

```json
{
  "id": "hl-new-uuid",
  "contentId": "content-uuid-1",
  "userId": "user-uuid",
  "kind": "TEXT",
  "targetType": "PDF",
  "pageNumber": 3,
  "anchorJson": { ... },
  "colorKey": "blue",
  "commentText": "Key concept for cellular respiration!",
  "tagsJson": ["ATP", "energy", "important"],
  "createdAt": "2024-12-18T12:50:00.000Z",
  "updatedAt": "2024-12-18T12:50:00.000Z"
}
```

### 💾 Salvar Highlight ID

```bash
export HIGHLIGHT_ID="hl-new-uuid"
```

---

## 🔄 Etapa 7: Atualizar Highlight

### Objetivo

Modificar comentário, cor ou tags de um highlight existente.

**Endpoint:** `PUT /highlights/:id`

#### curl:

```bash
curl -X PUT http://localhost:3000/api/highlights/$HIGHLIGHT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "colorKey": "red",
    "commentText": "SUPER IMPORTANT! Review before exam!",
    "tagsJson": ["ATP", "energy", "important", "exam"]
  }'
```

#### ✅ Resposta Esperada:

```json
{
  "id": "hl-new-uuid",
  "colorKey": "red", // Changed
  "commentText": "SUPER IMPORTANT! Review before exam!", // Updated
  "tagsJson": ["ATP", "energy", "important", "exam"], // Added "exam"
  "updatedAt": "2024-12-18T12:55:00.000Z" // Newer
}
```

---

## 🗑️ Etapa 8: Deletar Highlight

### Objetivo

Remover um highlight.

**Endpoint:** `DELETE /highlights/:id`

#### curl:

```bash
curl -X DELETE http://localhost:3000/api/highlights/$HIGHLIGHT_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ Resposta Esperada:

```json
{
  "message": "Highlight deleted successfully"
}
```

#### Verificar Remoção:

```bash
# Listar novamente - highlight removido não deve aparecer
curl -X GET http://localhost:3000/api/contents/$CONTENT_ID/highlights \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Etapa 9: Obter URL de Visualização de Arquivo

### Objetivo

Gerar signed URL (se S3) ou URL local para visualizar arquivo.

**Endpoint:** `GET /files/:id/view-url`

### 9.1 Obter File ID do Conteúdo

```bash
curl -X GET http://localhost:3000/api/contents/$CONTENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

Copie o `file.id` da resposta.

### 9.2 Gerar View URL

```bash
export FILE_ID="file-uuid-1"

curl -X GET http://localhost:3000/api/files/$FILE_ID/view-url \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ Resposta Esperada:

```json
{
  "url": "http://localhost:3000/uploads/photosynthesis-lesson.pdf",
  "expiresAt": "2024-12-18T18:00:00.000Z"
}
```

---

## 🔍 Etapa 10: Testar Fluxo Completo

### Cenário: Estudante Maria lê artigo e faz anotações

#### 10.1 Login

```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","password":"demo123"}' \
  | jq -r '.access_token')
```

#### 10.2 Listar Conteúdos

```bash
CONTENT_ID=$(curl -X GET http://localhost:3000/api/contents/my-contents \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[0].id')
```

#### 10.3 Abrir Cornell Notes

```bash
curl -X GET http://localhost:3000/api/contents/$CONTENT_ID/cornell \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 10.4 Criar Highlight

```bash
HIGHLIGHT_ID=$(curl -X POST http://localhost:3000/api/contents/$CONTENT_ID/highlights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind":"TEXT",
    "targetType":"PDF",
    "pageNumber":1,
    "anchorJson":{"type":"PDF_TEXT","position":{"pageNumber":1},"quote":"Test"},
    "colorKey":"yellow",
    "commentText":"My note"
  }' | jq -r '.id')
```

#### 10.5 Atualizar Cornell Notes Linkando Highlight

```bash
curl -X PUT http://localhost:3000/api/contents/$CONTENT_ID/cornell \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cuesJson\": [{
      \"id\":\"cue1\",
      \"prompt\":\"What is this?\",
      \"linked_highlight_ids\":[\"$HIGHLIGHT_ID\"]
    }],
    \"notesJson\": [{
      \"id\":\"note1\",
      \"body\":\"Important concept\",
      \"linked_highlight_ids\":[\"$HIGHLIGHT_ID\"]
    }],
    \"summaryText\":\"Summary of content\"
  }" | jq
```

#### ✅ Sucesso!

Cornell notes agora tem highlight linkado!

---

## 📊 Etapa 11: Validações e Casos de Erro

### 11.1 Sem Autenticação (401)

```bash
curl -X GET http://localhost:3000/api/contents/my-contents
# Expected: {"statusCode":401,"message":"Unauthorized"}
```

### 11.2 Token Inválido (401)

```bash
curl -X GET http://localhost:3000/api/contents/my-contents \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized
```

### 11.3 Conteúdo Não Encontrado (404)

```bash
curl -X GET http://localhost:3000/api/contents/non-existent-uuid/cornell \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"statusCode":404,"message":"Content not found"}
```

### 11.4 DTO Inválido (400)

```bash
curl -X POST http://localhost:3000/api/contents/$CONTENT_ID/highlights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"INVALID_KIND"}'
# Expected: {"statusCode":400,"message":"Validation failed",...}
```

---

## ✅ Checklist de Testes

### Autenticação

- [ ] Login com credenciais corretas retorna token
- [ ] Login com senha errada retorna 401
- [ ] Endpoints protegidos retornam 401 sem token

### Conteúdos

- [ ] Listar conteúdos retorna array
- [ ] Obter conteúdo por ID retorna objeto completo
- [ ] Conteúdo não existente retorna 404

### Cornell Notes

- [ ] GET em conteúdo sem notes cria entry vazio
- [ ] GET em conteúdo com notes retorna dados corretos
- [ ] PUT atualiza cues/notes/summary
- [ ] updatedAt é modificado após PUT

### Highlights

- [ ] GET retorna lista de highlights
- [ ] POST cria novo highlight
- [ ] PUT atualiza highlight existente
- [ ] DELETE remove highlight
- [ ] Highlight deletado não aparece em GET

### File URLs

- [ ] GET view-url retorna URL válida
- [ ] URL gerada tem expiração (se S3)

### Validações

- [ ] DTO inválido retorna 400 com mensagens claras
- [ ] Usuário só acessa próprios conteúdos
- [ ] Tags JSON aceita array de strings
- [ ] AnchorJson aceita objetos complexos

---

## 🎯 Resumo de Testes

| Categoria     | Testes | Status      |
| ------------- | ------ | ----------- |
| Auth          | 3      | ⏳ Pendente |
| Contents      | 3      | ⏳ Pendente |
| Cornell Notes | 4      | ⏳ Pendente |
| Highlights    | 5      | ⏳ Pendente |
| Files         | 2      | ⏳ Pendente |
| Validations   | 6      | ⏳ Pendente |
| **TOTAL**     | **23** | **⏳**      |

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Reiniciar containers
docker-compose restart postgres
```

### Erro: "Table does not exist"

```bash
# Aplicar migrations
npx prisma db push

# Ou resetar banco
npx prisma migrate reset
```

### Erro: "User not found" no seed

```bash
# Rodar seed novamente
npx prisma db seed
```

### API não responde

```bash
# Verificar se API está rodando
lsof -i :3000

# Verificar logs
npm run start:dev
```

---

## 📝 Notas Finais

- Todos os timestamps são em UTC
- IDs são UUIDs v4
- JSON fields aceitam objetos/arrays aninhados
- Soft delete não implementado (DELETE é permanente)
- Rate limiting não configurado (dev only)

**Tempo estimado de teste completo:** 30-45 minutos  
**Testes automáticos:** Considere criar suite E2E com Jest/Supertest
