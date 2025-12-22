# Quick Start Guide - Prompt-Only Reading

## For Users

### Starting Your First Reading Session

1. **Login** to your account
2. **Navigate** to Dashboard
3. **Click** "Start Reading" or select a content
4. **You'll see** two panels:
   - Left: Text with Cornell notes (optional)
   - Right: Chat with AI Educator

### Having Your First Conversation

#### PRE Phase (Before Reading)

**AI asks**: "What's your goal for this reading?"

- **You answer**: "I want to understand the main concepts"
- **AI asks**: "What do you predict will be in the text?"
- **You answer**: "I think it's about learning techniques"
- **AI proposes**: Target words to focus on
- **You**: Click "Confirm" or suggest others

#### DURING Phase (While Reading)

**Mark unknown words**:

- Type: `/mark unknown: inferir, evidência`
- **AI**: Acknowledges and tracks them

**Checkpoints**:

- **AI asks**: "What's the main idea so far?"
- **You answer**: Your understanding
- **AI**: Provides feedback or scaffolding

**Quick shortcuts**:

- Click 💡 icon for command menu
- Use quick reply buttons

#### POST Phase (After Reading)

**Free recall**:

- **AI asks**: "What did you learn?"
- **You**: Write 2-3 sentences

**Quiz**:

- **AI**: Asks comprehension questions
- **You**: Answer based on the text

**Vocabulary review**:

- **AI**: Helps with words you marked
- **You**: Practice using them

**Production task**:

- **AI**: Asks you to apply what you learned
- **You**: Create something new

### Tips

✅ **Use keyboard shortcuts**: Enter to send, Shift+Enter for new line  
✅ **Click quick replies**: Faster than typing  
✅ **Use commands**: `/mark`, `/checkpoint`, etc.  
✅ **Don't worry about mistakes**: AI is patient  
✅ **Take your time**: No rush, this is learning

---

## For Developers

### Setup (5 minutes)

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../services/api && npm install
cd ../services/ai && pip install -r requirements.txt

# 2. Configure environment
cp services/ai/.env.example services/ai/.env
# Edit .env with your OPENAI_API_KEY

# 3. Start services
# Terminal 1: AI Service
cd services/ai && python main.py

# Terminal 2: NestJS API
cd services/api && npm run start:dev

# Terminal 3: Frontend
cd frontend && npm run dev

# 4. Visit http://localhost:3000
```

### Testing Your Changes

```bash
# E2E tests
cd frontend
npx playwright test __tests__/e2e/prompt-session.spec.ts

# Watch mode (interactive)
npx playwright test --ui

# Specific test
npx playwright test -g "should complete full PRE"
```

### Making Changes

**Add a new command**:

1. Edit `ShortcutsMenu.tsx` - add to SHORTCUTS array
2. Edit `QuickCommandParser` (backend) - add parsing logic
3. Test with E2E test

**Change AI responses**:

1. Edit phase nodes in `services/ai/educator/nodes/`
2. Restart AI service
3. Test flow

**Modify UI**:

1. Edit components in `frontend/components/reading/`
2. Update CSS in `prompt-console.css`
3. Hot reload shows changes immediately

### Deployment

```bash
# Build production
cd frontend && npm run build

# Set environment
export ENV=production
export OPENAI_API_KEY=...

# Start services
docker-compose up -d
```

---

## Troubleshooting

**Q: AI not responding?**  
A: Check AI service logs: `docker logs ai-service`  
Verify OPENAI_API_KEY is set

**Q: Messages stuck as "sending"?**  
A: Check network tab in browser  
Verify `/sessions/:id/prompt` endpoint is reachable

**Q: CSS not loading?**  
A: Check CSS import in PromptConsole.tsx  
Clear Next.js cache: `rm -rf .next`

**Q: TypeScript errors?**  
A: Restart TS server or run `npm run dev`

---

## Next Steps

- Read [Full Documentation](../docs/prompt-interface.md)
- Try [E2E Tests](../frontend/__tests__/e2e/prompt-session.spec.ts)
- Check [Architecture](../docs/architecture.md)
