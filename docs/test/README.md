# Testes no AprendeAI

## Como Rodar

### Localmente (Unit/Integration)

**Backend API:**

```bash
cd services/api
npm test        # Unit
npm run test:e2e # Integration
```

**Frontend:**

```bash
cd frontend
npm test        # Unit (se houver)
npx playwright test # E2E (requer serviços rodando)
```

**AI Service:**

```bash
cd services/ai
pytest
```

### Smoke Test (Todas as Peças)

```powershell
./verify-fullstack.ps1
```

Este script checa portas, saúde HTTP e endpoints básicos.

## CI/CD

Os testes rodam no GitHub Actions. Veja `.github/workflows` para detalhes dos jobs atuais.
