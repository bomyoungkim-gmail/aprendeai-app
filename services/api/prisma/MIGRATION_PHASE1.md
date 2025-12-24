# Fase 1: Prisma Migration Documentation

## ✅ Completed: Schema Changes

### Models Added/Updated

#### 1. Institution (Updated)

**New Fields:**

- `slug` (String?, unique) - URL-friendly identifier
- `maxMembers` (Int?) - null = unlimited
- `requiresApproval` (Boolean, default: false)
- `ssoEnabled` (Boolean, default: false)

**New Relations:**

- `members` → InstitutionMember[]
- `invites` → InstitutionInvite[]
- `domains` → InstitutionDomain[]
- `pendingUsers` → PendingUserApproval[]
- `ssoConfig` → SSOConfiguration?

#### 2. InstitutionMember (NEW)

Own system (not Family-based) for institutional memberships.

**Fields:**

- `id`, `institutionId`, `userId`
- `role` (UserRole, default: COMMON_USER)
- `status` (MemberStatus, default: ACTIVE)
- `joinedAt`, `leftAt`

**Constraints:**

- Unique: [institutionId, userId]
- Index: [institutionId, status]
- Cascade delete on institution/user removal

#### 3. InstitutionInvite (NEW)

Crypto-secure invitation tokens.

**Fields:**

- `id`, `institutionId`, `email`
- `role` (UserRole)
- `token` (String, unique) - 32-byte crypto hex
- `expiresAt`, `usedAt`
- `invitedBy`, `createdAt`

**Constraints:**

- Unique: token
- Index: [token], [email], [institution Id, email]

#### 4. InstitutionDomain (NEW)

Email domain auto-registration.

**Fields:**

- `id`, `institutionId`
- `domain` (String, unique) - e.g. @escola.edu.br
- `autoApprove` (Boolean, default: false)
- `defaultRole` (UserRole, default: COMMON_USER)
- `createdAt`

**Constraints:**

- Unique: domain
- Index: [domain]

#### 5. PendingUserApproval (NEW)

Manual approval workflow.

**Fields:**

- `id`, `institutionId`, `email`, `name`
- `tempPasswordHash`
- `requestedRole` (UserRole)
- `status` (ApprovalStatus, default: PENDING)
- `reviewedBy`, `reviewedAt`
- `rejectionReason` (Text)
- `createdAt`

**Constraints:**

- Index: [institutionId, status], [email]

#### 6. SSOConfiguration (NEW)

SAML/OAuth2 enterprise authentication.

**Fields:**

- SAML: `entityId`, `ssoUrl`, `certificate`
- OAuth2: `clientId`, `clientSecret`, `authUrl`, `tokenUrl`, `userInfoUrl`
- Mappings: `emailAttribute`, `nameAttribute`, `roleAttribute`, `roleMapping`
- `provider` (SSOProvider), `enabled`

**Constraints:**

- Unique: institutionId (1:1 with Institution)

### User Model Updates

**New Relations:**

- `institutionMemberships` → InstitutionMember[]
- `invitesCreated` → InstitutionInvite[]
- `approvalsReviewed` → PendingUserApproval[]

**New Fields:**

- `ssoSubject` (String?, unique) - SSO provider unique ID
- `ssoProvider` (String?) - SSO provider name

### Enums Added

#### MemberStatus

- `ACTIVE`
- `SUSPENDED`
- `LEFT`

#### ApprovalStatus

- `PENDING`
- `APPROVED`
- `REJECTED`

#### SSOProvider

- `SAML`
- `GOOGLE_WORKSPACE`
- `MICROSOFT_ENTRA` (Azure AD)
- `OKTA`
- `CUSTOM_OIDC`

---

## 📋 Migration Checklist

- [x] Schema models created
- [x] Enums added
- [x] User relations added (all optional)
- [x] Schema formatted
- [x] Committed to git
- [ ] Generate migration SQL (awaiting DB connection)
- [ ] Review migration SQL
- [ ] Test in dev environment
- [ ] Test rollback procedure
- [ ] Validate existing users unaffected

---

## 🔒 Zero Breaking Changes

All changes are **additive only**:

- ✅ All new User fields are nullable/optional
- ✅ New models don't affect existing data
- ✅ Existing Institution records remain valid
- ✅ All new fields have sensible defaults

## Next Steps

When database is available:

```bash
cd services/api
npx prisma migrate dev --name add_institutional_registration
```

This will:

1. Generate migration SQL
2. Apply to development database
3. Regenerate Prisma Client

Then proceed to Phase 2: Backend Services.
