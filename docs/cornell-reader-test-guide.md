# Cornell Reader V1 - Roteiro de Testes Manuais

## 🎯 Objetivo

Validar todas as funcionalidades do Cornell Reader V1 (frontend + backend) através de testes manuais sistemáticos.

**Tempo estimado:** 45-60 minutos

---

## 📋 Pré-requisitos

### Backend

- [ ] PostgreSQL rodando via Docker (`docker ps | grep postgres`)
- [ ] API rodando (`npm run start:dev` em `services/api`)
- [ ] Database populado com seed (`npx prisma db seed`)

### Frontend

- [ ] Frontend rodando (`npm run dev` em `frontend`)
- [ ] Browser aberto (Chrome/Firefox recomendado)
- [ ] DevTools abertos (F12) para logs

### Credenciais

```
Email: maria@example.com
Password: demo123
```

---

## 🧪 Roteiro de Testes

### Fase 1: Backend API (15 min)

#### 1.1 Autenticação

**Objetivo:** Validar login e obtenção de token

```bash
# Via Postman/Thunder/Insomnia
POST http://localhost:3000/auth/login
Body: {
  "email": "maria@example.com",
  "password": "demo123"
}
```

**✅ Sucesso esperado:**

- Status: 200
- Response contém `access_token`
- Response contém `user.id`, `user.name`, `user.email`

**💾 Ação:** Copie o `access_token` para usar nos próximos testes

---

#### 1.2 Listar Conteúdos

**Objetivo:** Obter lista de conteúdos do usuário

```bash
GET http://localhost:3000/api/contents/my-contents
Headers: Authorization: Bearer {seu_token}
```

**✅ Sucesso esperado:**

- Status: 200
- Array com 3 conteúdos:
  1. "Photosynthesis..." (PDF)
  2. "Animal Cell Structure" (IMAGE)
  3. "Climate Change..." (ARTICLE)

**💾 Ação:** Copie o primeiro `id` (será usado como `{contentId}`)

---

#### 1.3 Obter Cornell Notes

**Objetivo:** Buscar/criar Cornell notes

```bash
GET http://localhost:3000/api/contents/{contentId}/cornell
Headers: Authorization: Bearer {seu_token}
```

**✅ Sucesso esperado:**

- Status: 200
- Response contém:
  - `cuesJson` (array de cues)
  - `notesJson` (array de notes)
  - `summaryText` (string)
  - `createdAt`, `updatedAt`

---

#### 1.4 Atualizar Cornell Notes

**Objetivo:** Salvar modificações

```bash
PUT http://localhost:3000/api/contents/{contentId}/cornell
Headers:
  Authorization: Bearer {seu_token}
  Content-Type: application/json
Body: {
  "cuesJson": [{
    "id": "test-cue-1",
    "prompt": "What is the test question?",
    "linkedHighlightIds": []
  }],
  "notesJson": [{
    "id": "test-note-1",
    "body": "This is a test note.",
    "linkedHighlightIds": []
  }],
  "summaryText": "Test summary updated via API"
}
```

**✅ Sucesso esperado:**

- Status: 200
- Response mostra dados atualizados
- `updatedAt` é mais recente que `createdAt`

---

#### 1.5 Listar Highlights

**Objetivo:** Obter highlights existentes

```bash
GET http://localhost:3000/api/contents/{contentId}/highlights
Headers: Authorization: Bearer {seu_token}
```

**✅ Sucesso esperado:**

- Status: 200
- Array com highlights do seed data
- Cada highlight tem: `id`, `kind`, `targetType`, `anchorJson`, `colorKey`

---

#### 1.6 Criar Highlight

**Objetivo:** Adicionar novo highlight

```bash
POST http://localhost:3000/api/contents/{contentId}/highlights
Headers:
  Authorization: Bearer {seu_token}
  Content-Type: application/json
Body: {
  "kind": "TEXT",
  "targetType": "PDF",
  "pageNumber": 1,
  "anchorJson": {
    "type": "PDF_TEXT",
    "position": {
      "boundingRect": {"x1": 100, "y1": 200, "x2": 400, "y2": 220, "width": 300, "height": 20},
      "rects": [{"x1": 100, "y1": 200, "x2": 400, "y2": 220, "width": 300, "height": 20, "pageNumber": 1}],
      "pageNumber": 1
    },
    "quote": "Test highlight text"
  },
  "colorKey": "yellow",
  "commentText": "Testing highlight creation",
  "tagsJson": ["test"]
}
```

**✅ Sucesso esperado:**

- Status: 201
- Response contém highlight criado com `id`

**💾 Ação:** Copie o `id` do highlight criado

---

#### 1.7 Deletar Highlight

**Objetivo:** Remover highlight

```bash
DELETE http://localhost:3000/api/highlights/{highlightId}
Headers: Authorization: Bearer {seu_token}
```

**✅ Sucesso esperado:**

- Status: 200
- Response: `{ "message": "Highlight deleted successfully" }`

---

### ✅ Checklist Fase 1 - Backend

- [ ] Login retorna token válido
- [ ] Listar conteúdos retorna 3 items
- [ ] GET cornell notes funciona (cria se não existe)
- [ ] PUT cornell notes salva corretamente
- [ ] GET highlights retorna array
- [ ] POST highlight cria novo
- [ ] DELETE highlight remove

**Se todos ✅:** Backend está funcionando! Prossiga para Fase 2.

---

### Fase 2: Frontend - Navegação (10 min)

#### 2.1 Acessar Aplicação

1. Abra `http://localhost:3000`
2. Faça login com `maria@example.com` / `demo123`

**✅ Sucesso esperado:**

- Login bem-sucedido
- Redirecionamento para dashboard

---

#### 2.2 Navegar para Reader

1. No dashboard, encontre um conteúdo (ex: "Photosynthesis")
2. Clique em botão "Read" ou similar
3. URL deve ser: `http://localhost:3000/reader/{contentId}`

**✅ Sucesso esperado:**

- Loading spinner aparece brevemente
- Cornell Reader carrega com layout 3-colunas
- Top bar mostra título do conteúdo

---

### Fase 3: Frontend - Layout (10 min)

#### 3.1 Verificar Layout

**Objetivo:** Validar estrutura visual

**✅ Verificar:**

- [ ] Top bar (64px altura)
  - [ ] Título à esquerda
  - [ ] Botão "Study Mode" ou "Original View" no centro-direita
  - [ ] Indicador "Saved" à direita
- [ ] Coluna esquerda (320px)
  - [ ] Título "Cues & Questions"
  - [ ] Botão "+" para adicionar
- [ ] Coluna central (flex)
  - [ ] Viewer ocupando todo o espaço
- [ ] Coluna direita (320px)
  - [ ] Título "Notes"
  - [ ] Botão "+" para adicionar
- [ ] Rodapé (192px)
  - [ ] Título "Summary"
  - [ ] Textarea grande
  - [ ] Character count no canto inferior direito

**📸 Screenshot:** Tire print do layout completo

---

#### 3.2 Testar Top Bar

**a) Mode Toggle**

1. Clique no botão de mode (ex: "Study Mode")
2. Observe mudança para "Original View"
3. Clique novamente

**✅ Sucesso esperado:**

- Botão alterna texto e ícone
- Badge no viewer muda (blue → green ou vice-versa)
- Layout preserva estado

**b) Save Status**

1. Observe indicador inicial: "🟢 All changes saved"
2. Faça modificação em qualquer campo
3. Aguarde 1 segundo

**✅ Sucesso esperado:**

- Muda para "🔵 Saving..." (spinner azul)
- Após ~500ms: "🟢 Saved Xs ago"

---

### Fase 4: Frontend - Cornell Notes (15 min)

#### 4.1 Cues Editor

**a) Adicionar Cue**

1. Clique no botão "+" em "Cues & Questions"

**✅ Sucesso esperado:**

- Nova caixa "Cue 1" aparece
- Textarea vazio com placeholder
- Focus automático no textarea

**b) Escrever Cue**

1. Digite: "What is photosynthesis?"
2. Aguarde 1 segundo

**✅ Sucesso esperado:**

- Texto salvo (veja "Saving..." → "Saved")
- Character count atualiza (se existir)

**c) Adicionar Segundo Cue**

1. Clique "+" novamente
2. Digite: "Where does photosynthesis occur?"

**✅ Sucesso esperado:**

- "Cue 2" aparece abaixo
- Numeração automática correta

**d) Deletar Cue**

1. Hover sobre primeira cue
2. Clique no botão 🗑️ (trash)

**✅ Sucesso esperado:**

- Cue deletada
- "Cue 2" renumerado para "Cue 1"
- Autosave dispara

---

#### 4.2 Notes Editor

**a) Adicionar Note**

1. Clique no botão "+" em "Notes"

**✅ Sucesso esperado:**

- Nova caixa "Note 1" (fundo azul claro)
- Textarea com 3 rows
- Placeholder: "Write your notes here..."

**b) Escrever Note**

1. Digite: "Plants convert light energy into chemical energy stored in glucose."

**✅ Sucesso esperado:**

- Texto salvo após 1s
- Note permanece visível

**c) Múltiplas Notes**

1. Adicione 2 mais notes
2. Escreva conteúdo diferente em cada

**✅ Sucesso esperado:**

- Numeração "Note 1", "Note 2", "Note 3"
- Scroll vertical aparece se necessário
- Todas salvas independentemente

---

#### 4.3 Summary Editor

**a) Escrever Summary**

1. Clique na textarea "Summary" (fundo amarelo)
2. Digite: "Photosynthesis is the process by which plants use sunlight to create energy from CO2 and water, producing oxygen as a byproduct."

**✅ Sucesso esperado:**

- Texto salvo após 1s
- Character count atualiza: "150 characters"
- Background amarelo preservado

---

### Fase 5: Frontend - Viewers (15 min)

#### 5.1 PDF Viewer

**a) Verificar Rendering**

1. Se o conteúdo for PDF, verifique:

**✅ Sucesso esperado:**

- PDF renderizado com clareza
- Background escuro (gray-900)
- Documento centralizado com sombra

**b) Page Navigation**

1. Clique "Next" no toolbar
2. Clique "Previous"

**✅ Sucesso esperado:**

- Navegação funciona
- Contador atualiza: "Page 2 of 5"
- Botões desabilitam nos extremos

**c) Zoom**

1. Clique botão "-" (zoom out)
2. Clique botão "+" (zoom in)

**✅ Sucesso esperado:**

- Zoom altera: "100%" → "120%" → "140%"
- Documento escala corretamente
- Min: 50%, Max: 300%

**d) Rotation**

1. Clique botão de rotação (↻)

**✅ Sucesso esperado:**

- Documento roda 90°
- Sucessivos cliques: 0° → 90° → 180° → 270° → 0°

---

#### 5.2 Image Viewer

**Nota:** Navegue para um conteúdo IMAGE do seed data

**a) Verificar Rendering**
**✅ Sucesso esperado:**

- Imagem carregada no canvas Konva
- Dimensões exibidas no toolbar
- Background escuro

**b) Zoom com Mouse Wheel**

1. Scroll do mouse para cima (zoom in)
2. Scroll para baixo (zoom out)

**✅ Sucesso esperado:**

- Zoom suave
- Zoom focado no cursor
- Porcentagem atualiza no toolbar

**c) Pan (Drag)**

1. Click e arraste a imagem

**✅ Sucesso esperado:**

- Imagem move conforme drag
- Cursor muda para "grab"

**d) Fit to Screen**

1. Dê zoom excessivo
2. Clique botão "⊡" (Fit to screen)

**✅ Sucesso esperado:**

- Imagem volta para escala 100%
- Posição reseta para (0,0)

**e) Area Selection (Study Mode)**

1. Certifique-se que está em "Study Mode"
2. Click e arraste sobre área da imagem

**✅ Sucesso esperado:**

- Retângulo azul aparece durante drag
- Badge "Study Mode - Click and drag to highlight" visível
- Ao soltar: seleção some (ainda não cria highlight no backend)

---

### Fase 6: Integração (10 min)

#### 6.1 Autosave End-to-End

**a) Modificar → Salvar → Recarregar**

1. Adicione uma cue: "Test autosave"
2. Aguarde "Saved" aparecer
3. Recarregue página (F5)

**✅ Sucesso esperado:**

- Após reload, cue "Test autosave" ainda existe
- Dados persistiram no banco

**b) Multiple Changes**

1. Adicione 2 cues
2. Adicione 1 note
3. Edite summary
4. Aguarde 2 segundos

**✅ Sucesso esperado:**

- Status muda: saved → saving → saved
- Apenas 1 request PUT ao backend (debounce funcionando)
- Verifique no Network tab: somente 1 chamada `/cornell`

---

#### 6.2 Mode Toggle Persistence

**a) Toggle Durante Editing**

1. Está editando uma note
2. Click "Original View"
3. Click "Study Mode" de volta

**✅ Sucesso esperado:**

- Conteúdo da note preservado
- Nenhum dado perdido
- Autosave continua funcionando

---

#### 6.3 Offline Behavior

**a) Simular Offline**

1. Abra DevTools → Network
2. Throttling: "Offline"
3. Tente editar uma note

**✅ Sucesso esperado:**

- Status muda para "🟠 Offline - changes will sync"
- Edição continua funcionando localmente
- Ao restaurar conexão: salva automaticamente

---

### Fase 7: Edge Cases (10 min)

#### 7.1 Empty States

**a) Cornell Notes Vazio**

1. Navegue para conteúdo sem notes (se possível)
2. Observe colunas vazias

**✅ Sucesso esperado:**

- Mensagem "No cues yet" com botão "+ Add your first cue"
- Mensagem "No notes yet" com botão "+ Add your first note"
- Summary vazio com placeholder

---

#### 7.2 Long Content

**a) Texto Longo**

1. Digite 500 caracteres no summary

**✅ Sucesso esperado:**

- Character count: "500 characters"
- Textarea expande ou scroll vertical aparece
- Autosave funciona normalmente

**b) Muitas Cues**

1. Adicione 10+ cues

**✅ Sucesso esperado:**

- Coluna esquerda tem scroll
- Todas cues visíveis com scroll
- Performance OK (sem lag)

---

#### 7.3 Invalid Content ID

**a) URL Inválida**

1. Navegue para `/reader/invalid-uuid-123`

**✅ Sucesso esperado:**

- Mensagem de erro: "Content Not Found"
- Botão "Go Back" funciona
- Nenhum crash

---

### Fase 8: Performance (5 min)

#### 8.1 Debounce Validation

**a) Rapid Typing**

1. Digite rapidamente em uma note (mash keyboard)
2. Pare e aguarde

**✅ Sucesso esperado:**

- "Saving..." aparece apenas UMA vez após parar
- Não dispara múltiplos saves
- Final "Saved" confirma único save

---

#### 8.2 Page Load Time

**a) Initial Load**

1. Abra devTools → Network
2. Recarregue página do reader
3. Observe waterfall

**✅ Sucesso esperado:**

- Total load time < 3 segundos
- API calls: `/contents/{id}`, `/cornell`, `/highlights`
- PDF/Image asset carrega progressivamente

---

## ✅ Checklist Geral

### Backend API

- [ ] Login funcionando
- [ ] GET conteúdos retorna lista
- [ ] GET cornell notes retorna/cria
- [ ] PUT cornell notes salva
- [ ] GET highlights lista
- [ ] POST highlight cria
- [ ] DELETE highlight remove

### Frontend Layout

- [ ] 3-colunas renderiza corretamente
- [ ] Top bar mostra título, toggle, status
- [ ] Cues column funciona
- [ ] Notes column funciona
- [ ] Summary editor funciona
- [ ] Scroll em colunas quando necessário

### Frontend Viewers

- [ ] PDF renderiza
- [ ] PDF zoom/pan/rotate funciona
- [ ] Image renderiza
- [ ] Image zoom/pan funciona
- [ ] Image area selection funciona (visual)
- [ ] DOCX mostra placeholder

### Integração

- [ ] Autosave dispara após 1s
- [ ] Reload preserva dados
- [ ] Mode toggle funciona
- [ ] Offline detection funciona
- [ ] Loading states aparecem
- [ ] Error states funcionam

### Performance

- [ ] Debounce funciona (1 save apenas)
- [ ] Sem memory leaks
- [ ] Scroll suave
- [ ] Typing responsivo

---

## 🐛 Bugs Conhecidos (Reportar se Encontrar)

### Esperados (Não implementados em V1)

- Highlights não são criados no backend (onClick)
- Highlight comments não abrem modal
- Link cue ↔ highlight não funciona
- DOCX rendering é placeholder

### NÃO Esperados (Reportar!)

- [ ] Autosave não dispara
- [ ] Data loss após reload
- [ ] PDF não renderiza
- [ ] Crash ao editar notes
- [ ] Performance lenta
- [ ] Memory leak

---

## 📊 Relatório de Testes

Após completar, preencha:

```
Data: __/__/____
Testado por: ________________
Ambiente:
  - OS: ________________
  - Browser: ________________
  - Node version: ________________

Resultados:
  - Backend: __ / 7 testes ✅
  - Frontend Layout: __ / 6 testes ✅
  - Frontend Viewers: __ / 6 testes ✅
  - Integração: __ / 4 testes ✅
  - Performance: __ / 2 testes ✅

Total: __ / 25 testes (___%)

Bugs encontrados: ____________________
__________________________________________
__________________________________________

Status: ✅ APROVADO | ⚠️ APROVADO COM RESSALVAS | ❌ REPROVADO
```

---

## 🎯 Critérios de Aprovação

**✅ APROVADO se:**

- Backend: 7/7 ✅
- Frontend total: >= 21/25 ✅
- Nenhum bug crítico (crash, data loss)

**⚠️ APROVADO COM RESSALVAS se:**

- Frontend: 18-20/25 ✅
- Bugs menores aceitáveis (styling, UX)

**❌ REPROVADO se:**

- Backend: < 6/7
- Frontend: < 18/25
- Bugs críticos existem

---

## 📝 Notas Finais

- Este roteiro cobre **V1** apenas
- Features de V2 (highlight creation, comments) não são testadas
- Performance em PDFs grandes (>50 páginas) não é validada
- Mobile não é coberto neste roteiro

**Boa sorte nos testes!** 🚀
