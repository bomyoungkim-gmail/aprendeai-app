# TODO: OAuth Setup Steps

## PENDING ACTIONS

### 1. Apply Prisma Migration ⏳

```bash
cd services/api
npx prisma migrate dev --name add_oauth_fields
```

**Status:** Running now...

---

### 2. Register OAuth Strategies in AuthModule 📝

**File:** `src/auth/auth.module.ts`

**Action:** Uncomment these lines after migration completes:

```typescript
// Imports (top of file)
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';

// Providers array
providers: [
  AuthService,
  LocalStrategy,
  JwtStrategy,
  GoogleStrategy,      // Uncomment
  MicrosoftStrategy,   // Uncomment
],
```

---

### 3. Setup OAuth Apps 🔐

#### A. Google Cloud Console

**URL:** https://console.cloud.google.com/

**Steps:**

1. Create new project: "AprendeAI"
2. Enable APIs:
   - Navigate to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google+ API" and enable it
3. Create OAuth credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Name: "AprendeAI"
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)
4. Copy credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
   ```

---

#### B. Microsoft Azure Portal

**URL:** https://portal.azure.com/

**Steps:**

1. Navigate to Azure Active Directory
2. App registrations → "New registration"
   - Name: "AprendeAI"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI (Web): `http://localhost:8000/auth/microsoft/callback`
3. After creation, note the "Application (client) ID"
4. Go to "Certificates & secrets" → "New client secret"
   - Description: "AprendeAI Backend"
   - Expires: 24 months
   - Copy the secret VALUE (not ID)
5. Copy credentials to `.env`:
   ```env
   MICROSOFT_CLIENT_ID=your-application-id
   MICROSOFT_CLIENT_SECRET=your-client-secret-value
   MICROSOFT_CALLBACK_URL=http://localhost:8000/auth/microsoft/callback
   ```

---

### 4. Frontend Implementation 💻

**Files to create:**

**`frontend/app/auth/callback/page.tsx`**
**`frontend/components/auth/OAuthButtons.tsx`** (optional)

Update `frontend/app/login/page.tsx` with OAuth buttons.

---

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Strategies registered in AuthModule
- [ ] Google OAuth app created
- [ ] Microsoft OAuth app created
- [ ] Environment variables added
- [ ] Backend restarts without errors
- [ ] Frontend OAuth buttons added
- [ ] Test Google login flow
- [ ] Test Microsoft login flow
- [ ] Test account linking
