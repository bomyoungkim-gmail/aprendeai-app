# Cornell Reader API - Collections Multi-Tool

Coleções da API do Cornell Reader disponíveis para **3 ferramentas** diferentes!

---

## 📦 Arquivos Disponíveis

### 🟦 Postman

- `cornell-reader-api.postman_collection.json`
- `cornell-reader-local.postman_environment.json`
- 📄 [POSTMAN_README.md](./POSTMAN_README.md) - Guia completo

### 🟪 Insomnia

- `cornell-reader-api.insomnia.json` (collection + environment em 1 arquivo)

### ⚡ Thunder Client (VS Code)

- `cornell-reader-api.thunder.json`
- `cornell-reader-local.thunder-env.json`

---

## 🚀 Quick Start

### Postman (Desktop/Web)

```bash
# 1. Abra Postman
# 2. Import → File
# 3. Selecione cornell-reader-api.postman_collection.json
# 4. Selecione cornell-reader-local.postman_environment.json
# 5. Ative environment "Cornell Reader - Local Dev"
# 6. Execute "Login" primeiro
```

**Leia mais:** [POSTMAN_README.md](./POSTMAN_README.md)

---

### Insomnia

```bash
# 1. Abra Insomnia
# 2. Application → Preferences → Data → Import Data
# 3. Selecione cornell-reader-api.insomnia.json
# 4. Selecione environment "Local Development" (dropdown superior direito)
# 5. Execute "Login" primeiro
```

#### Configurar Variáveis:

1. Clique no dropdown de environment
2. Clique em **"Manage Environments"**
3. Edite "Local Development"
4. Após **Login**, copie `access_token` da resposta
5. Cole em `token` no environment
6. Após **List My Contents**, copie primeiro `id`
7. Cole em `contentId` no environment

**Sintaxe de variáveis:** `{{ _.variableName }}`

---

### Thunder Client (VS Code Extension)

#### Instalação:

```bash
# No VS Code
# 1. Extensions (Ctrl+Shift+X)
# 2. Procure "Thunder Client"
# 3. Install
```

#### Import:

```bash
# 1. Abra Thunder Client (ícone de raio na sidebar)
# 2. Collections → Menu (⋮) → Import
# 3. Selecione cornell-reader-api.thunder.json
# 4. Env → Menu (⋮) → Import
# 5. Selecione cornell-reader-local.thunder-env.json
# 6. Ative environment "Cornell Reader - Local"
```

#### Usar:

1. Execute **"Login"**
2. Copie `access_token` da resposta
3. Edite environment (Env → Cornell Reader - Local → Edit)
4. Cole token em `token`
5. Execute **"List My Contents"**
6. Copie primeiro `id` e cole em `contentId`

**Sintaxe de variáveis:** `{{variableName}}`

#### Auto-Save Token (Thunder Client):

Thunder Client suporta **Tests** para salvar automaticamente:

1. Click no request "Login"
2. Aba "Tests"
3. Já configurado: `Set Env Variable: token = json.access_token`

---

## 🔄 Comparação de Ferramentas

| Recurso                  | Postman          | Insomnia        | Thunder Client    |
| ------------------------ | ---------------- | --------------- | ----------------- |
| **Plataforma**           | Desktop/Web      | Desktop         | VS Code Extension |
| **Auto-save vars**       | ✅ Sim (scripts) | ❌ Manual       | ✅ Sim (tests)    |
| **Collection Runner**    | ✅ Sim           | ✅ Sim          | ✅ Sim            |
| **Colaboração**          | ✅ Cloud         | ✅ Cloud (pago) | ❌ Arquivo local  |
| **Performance**          | Médio            | Rápido          | Muito rápido      |
| **Curva de aprendizado** | Média            | Baixa           | Muito baixa       |
| **Integração IDE**       | ❌ Não           | ❌ Não          | ✅ Nativo VS Code |
| **Offline**              | ✅ Desktop sim   | ✅ Sim          | ✅ Sim            |

### Recomendação:

- **Iniciantes:** Thunder Client (mais simples, integrado ao VS Code)
- **Time/Colaboração:** Postman (melhor documentação e compartilhamento)
- **Desenvolvedores Solo:** Insomnia ou Thunder Client

---

## 📋 Fluxo de Teste Recomendado

Independente da ferramenta, siga esta ordem:

1. ✅ **Login** → Salva token
2. ✅ **List My Contents** → Salva contentId e fileId
3. ✅ **Get or Create Cornell Notes**
4. ✅ **Update Cornell Notes**
5. ✅ **List Highlights**
6. ✅ **Create Highlight (PDF)** → Salva highlightId
7. ✅ **Update Highlight**
8. ✅ **Get File View URL**
9. ✅ **Delete Highlight**

---

## 🔑 Variáveis de Environment

Todas as tools usam as mesmas variáveis:

| Variável      | Valor Inicial         | Preenchido Por                |
| ------------- | --------------------- | ----------------------------- |
| `baseUrl`     | http://localhost:3000 | Manual                        |
| `email`       | maria@example.com     | Manual                        |
| `password`    | demo123               | Manual                        |
| `token`       | (vazio)               | **Login** response            |
| `contentId`   | (vazio)               | **List Contents** response    |
| `fileId`      | (vazio)               | **List Contents** response    |
| `highlightId` | (vazio)               | **Create Highlight** response |

---

## 🐛 Troubleshooting Comum

### Token não funciona em nenhuma tool

```bash
# Verifique se API está rodando
curl http://localhost:3000/health

# Ou
npm run start:dev
```

### "Variable not found" erro

- **Postman:** Use `{{variableName}}`
- **Insomnia:** Use `{{ _.variableName }}`
- **Thunder:** Use `{{variableName}}`

### Import falha

- Verifique se o arquivo JSON está válido
- Tente importar via "Import from File" não "Import from URL"
- Certifique-se que está na raiz doprojeto ao buscar arquivo

---

## 📚 Recursos Adicionais

### Postman

- [Documentação](https://learning.postman.com/)
- [Variables](https://learning.postman.com/docs/sending-requests/variables/)
- [Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)

### Insomnia

- [Documentação](https://docs.insomnia.rest/)
- [Environment Variables](https://docs.insomnia.rest/insomnia/environment-variables)
- [Request Chaining](https://docs.insomnia.rest/insomnia/chaining-requests)

### Thunder Client

- [Documentação](https://github.com/rangav/thunder-client-support)
- [Collections](https://github.com/rangav/thunder-client-support#collections)
- [Environments](https://github.com/rangav/thunder-client-support#environments)

---

## ✅ Checklist de Setup

- [ ] Escolhi minha ferramenta (Postman/Insomnia/Thunder)
- [ ] Instalei a ferramenta
- [ ] Importei a collection
- [ ] Importei o environment
- [ ] Selecionei/ativei o environment
- [ ] API está rodando (localhost:3000)
- [ ] Database populado (npx prisma db seed)
- [ ] Executei "Login" com sucesso
- [ ] Token salvo (automático ou manual)
- [ ] Testei pelo menos 3 endpoints

**Status:** ⏳ Pronto para testar!

---

## 💡 Dicas

1. **Use Collection Runner** para rodar todos os testes de uma vez
2. **Salve responses** para comparar mudanças
3. **Documente** seus próprios casos de teste adicionando requests
4. **Versione** as collections junto com o código
5. **Compartilhe** via git para colaborar com o time

---

**Última atualização:** 2024-12-18  
**Versão da API:** v1.0.0  
**Endpoint Base:** http://localhost:3000
