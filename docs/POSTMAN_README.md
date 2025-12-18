# Cornell Reader API - Postman Collection

## 📦 Arquivos

- `cornell-reader-api.postman_collection.json` - Collection completa com todos os endpoints
- `cornell-reader-local.postman_environment.json` - Environment para desenvolvimento local

---

## 🚀 Como Usar

### 1. Importar no Postman

#### Opção A: Via Postman Desktop

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Selecione **File** ou arraste os 2 arquivos JSON
4. Importe ambos: Collection + Environment

#### Opção B: Via CLI

```bash
# Se tiver Postman CLI instalado
postman collection import docs/cornell-reader-api.postman_collection.json
postman environment import docs/cornell-reader-local.postman_environment.json
```

---

### 2. Configurar Environment

1. No Postman, selecione o environment **"Cornell Reader - Local Dev"** (dropdown no canto superior direito)
2. Clique no ícone de "olho" 👁️ ao lado do dropdown
3. Verifique as variáveis:
   - ✅ `baseUrl`: http://localhost:3000
   - ✅ `email`: maria@example.com
   - ✅ `password`: demo123
   - ⏳ `token`: (vazio, será preenchido automaticamente)
   - ⏳ `contentId`: (vazio, será preenchido automaticamente)

---

### 3. Executar Testes

#### Fluxo Recomendado (Primeira Vez)

1. **Iniciar API**

   ```bash
   cd services/api
   npm run start:dev
   ```

2. **Executar na Ordem:**

   | #   | Request                               | Ação Automática                  |
   | --- | ------------------------------------- | -------------------------------- |
   | 1   | **1. Authentication → Login**         | Salva `token` automaticamente ✅ |
   | 2   | **2. Contents → List My Contents**    | Salva `contentId` e `fileId` ✅  |
   | 3   | **3. Cornell Notes → Get or Create**  | -                                |
   | 4   | **3. Cornell Notes → Update**         | -                                |
   | 5   | **4. Highlights → List**              | -                                |
   | 6   | **4. Highlights → Create (PDF Text)** | Salva `highlightId` ✅           |
   | 7   | **4. Highlights → Update**            | -                                |
   | 8   | **5. Files → Get View URL**           | -                                |

3. **Scripts Automáticos:**
   - ✅ Login salva token em `{{token}}`
   - ✅ List Contents salva primeiro ID em `{{contentId}}`
   - ✅ Create Highlight salva ID em `{{highlightId}}`
   - ✅ Todas as requisições subsequentes usam essas variáveis

---

### 4. Executar Collection Runner

Para rodar todos os testes de uma vez:

1. Clique na Collection **"Cornell Reader V1 API"**
2. Clique em **Run** (ou botão ▶️)
3. Selecione todos os requests (exceto pasta "6. Error Cases" na primeira vez)
4. Clique em **Run Cornell Reader V1 API**
5. Observe os resultados:
   - ✅ Verde = Sucesso
   - ❌ Vermelho = Falha (verifique logs)

---

## 📋 Requests Disponíveis

### 1. Authentication (1 request)

- `POST /auth/login` - Login e obtenção de token JWT

### 2. Contents (2 requests)

- `GET /api/contents/my-contents` - Listar conteúdos do usuário
- `GET /api/contents/:id` - Obter conteúdo por ID

### 3. Cornell Notes (2 requests)

- `GET /api/contents/:id/cornell` - Buscar/criar Cornell notes
- `PUT /api/contents/:id/cornell` - Atualizar Cornell notes

### 4. Highlights (5 requests)

- `GET /api/contents/:id/highlights` - Listar highlights
- `POST /api/contents/:id/highlights` - Criar highlight (PDF Text)
- `POST /api/contents/:id/highlights` - Criar highlight (Image Area)
- `PUT /api/highlights/:id` - Atualizar highlight
- `DELETE /api/highlights/:id` - Deletar highlight

### 5. Files (1 request)

- `GET /api/files/:id/view-url` - Obter URL de visualização

### 6. Error Cases (3 requests)

- `GET` sem auth - Teste 401 Unauthorized
- `GET` content inexistente - Teste 404 Not Found
- `POST` com DTO inválido - Teste 400 Bad Request

**Total: 14 requests**

---

## 🔧 Customizações

### Adicionar Novo Usuário

Edite o environment e adicione:

```json
{
  "key": "teacherEmail",
  "value": "joao@example.com",
  "type": "default"
},
{
  "key": "teacherPassword",
  "value": "demo123",
  "type": "secret"
}
```

### Testar em Staging/Produção

Duplique o environment e mude:

```json
{
  "key": "baseUrl",
  "value": "https://api.aprendeai.com",
  "type": "default"
}
```

---

## 🐛 Troubleshooting

### Token não está sendo salvo

1. Verifique se o environment está selecionado
2. Abra Console do Postman (View → Show Postman Console)
3. Execute Login novamente
4. Procure por: `✅ Token saved: eyJhbGciOiJS...`

### "contentId is not defined"

Execute primeiro: **2. Contents → List My Contents**

### "Cannot connect to localhost:3000"

Verifique se a API está rodando:

```bash
npm run start:dev
```

### Erro 401 mesmo após login

1. Certifique-se que o environment está ativo
2. Verifique se `{{token}}` tem valor (não está vazio)
3. Execute Login novamente

---

## 📊 Tests e Assertions

Alguns requests já incluem **test scripts** automáticos:

```javascript
// Exemplo: Login
pm.test("Status is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Token is present", () => {
  const response = pm.response.json();
  pm.expect(response.access_token).to.exist;
});
```

Para adicionar mais assertions, vá em **Tests** tab de cada request.

---

## 🔐 Segurança

⚠️ **Importante:**

- Arquivos JSON estão em `.gitignore` (não committar tokens reais!)
- Use environment separado para staging/prod
- Nunca compartilhe tokens em screenshots/logs
- Tokens de dev expiram após X horas (configurável em JWT_SECRET)

---

## 📚 Recursos

- [Postman Learning Center](https://learning.postman.com/)
- [Variáveis e Ambientes](https://learning.postman.com/docs/sending-requests/variables/)
- [Test Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Collection Runner](https://learning.postman.com/docs/running-collections/intro-to-collection-runs/)

---

## ✅ Checklist de Uso

- [ ] Postman instalado (Desktop ou Web)
- [ ] Collection importada
- [ ] Environment importado e selecionado
- [ ] API rodando em localhost:3000
- [ ] Database populado (npm prisma db seed)
- [ ] Login executado com sucesso
- [ ] Token salvo em variável
- [ ] Todos os requests testados
- [ ] Collection Runner executado sem erros

**Status:** ⏳ Pronto para uso!
