# AprendeAI Admin Console

Enterprise-grade admin console with complete control over users, features, secrets, and observability.

## 🚀 Features

- 🔐 **RBAC**: Role-based access control (ADMIN, OPS, SUPPORT)
- 👥 **User Management**: Full CRUD + impersonation
- 🚩 **Feature Flags**: Runtime feature toggles with scoping
- 🔑 **Secret Management**: AES-256-GCM encrypted secrets
- 📊 **Observability**: Real-time metrics, errors, and costs
- ⚙️ **Configuration**: Environment-specific app settings
- 📝 **Audit Trail**: Complete compliance logging

## 📚 API Documentation

Interactive API documentation available at:

```
http://localhost:4000/api/docs
```

- **Swagger UI**: Full interactive documentation
- **7 Admin Tags**: Organized by feature area
- **JWT Authentication**: Bearer token support
- **Try it out**: Test endpoints directly from browser

## 🏗️ Architecture

```
├── services/api/          # NestJS backend
│   ├── src/
│   │   ├── admin/         # Admin console modules
│   │   ├── observability/ # Metrics & tracking
│   │   └── common/        # Shared utilities
│   └── prisma/            # Database schema
├── frontend/              # Next.js 14 frontend
│   └── app/admin/         # Admin pages
└── .github/workflows/     # CI/CD pipelines
```

## 🛠️ Tech Stack

### Backend

- **NestJS** - Enterprise Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **@nestjs/schedule** - Cron jobs
- **Swagger** - API documentation

### Frontend

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Recharts** - Data visualization
- **Zustand** - State management

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+

### Installation

1. **Clone repository**

```bash
git clone https://github.com/yourusername/aprendeai-app.git
cd aprendeai-app
```

2. **Setup environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate master encryption key**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Add to .env as ADMIN_MASTER_KEY
```

4. **Start services**

```bash
docker-compose up -d
```

5. **Run migrations**

```bash
cd services/api
npx prisma db push
npx prisma generate
```

6. **Start development**

```bash
# Backend
cd services/api
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## 🔑 Environment Variables

### Backend (`services/api/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/aprendeai
JWT_SECRET=your-jwt-secret-key
ADMIN_MASTER_KEY=base64-encoded-32-bytes
PORT=4000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 📊 Database Schema

9 core tables:

- `users` - User accounts
- `user_role_assignments` - RBAC mappings
- `audit_logs` - Compliance trail
- `integration_secrets` - Encrypted secrets
- `feature_flags` - Feature toggles
- `app_configs` - Application settings
- `system_metrics` - Performance data
- `error_logs` - Error tracking
- `provider_usage` - API costs
- `background_jobs` - Cron job history

## 🧪 Testing

### Backend Tests

```bash
cd services/api
npm test                 # Unit tests
npm run test:e2e        # E2E tests
npm run test:cov        # Coverage
```

### Frontend Tests

```bash
cd frontend
npm test                # Jest tests
npm run test:e2e       # Playwright E2E
```

## 🚢 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Backend
cd services/api
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

## 📈 CI/CD

GitHub Actions pipeline includes:

- ✅ Linting (ESLint, Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit tests
- ✅ Build verification
- ✅ Database migration checks
- ✅ Docker image builds

Triggers on:

- Push to `main` or `develop`
- Pull requests to `main`

## 🔐 Security Features

- **AES-256-GCM** encryption for secrets
- **JWT** authentication with expiry
- **RBAC** with 4 roles (ADMIN, OPS, SUPPORT, USER)
- **Audit logging** for all sensitive operations
- **Rate limiting** via CORS
- **Input validation** with class-validator
- **SQL injection protection** via Prisma

## 📝 API Endpoints

### Admin Core

- `POST /admin/login` - Admin authentication
- `GET /admin/me` - Current admin info

### User Management (6 endpoints)

- `GET /admin/users` - List users
- `GET /admin/users/:id` - Get user
- `PUT /admin/users/:id/status` - Update status
- `PUT /admin/users/:id/roles` - Assign roles
- `POST /admin/users/:id/impersonate` - Impersonate
- `POST /admin/impersonate/stop` - Stop impersonation

### Secrets Management (5 endpoints)

- `GET /admin/secrets` - List secrets
- `GET /admin/secrets/:id` - Get secret
- `POST /admin/secrets` - Create secret
- `PUT /admin/secrets/:id` - Rotate secret
- `DELETE /admin/secrets/:id` - Delete secret

### Feature Flags (6 endpoints)

- `GET /admin/feature-flags` - List flags
- `GET /admin/feature-flags/:id` - Get flag
- `POST /admin/feature-flags` - Create flag
- `PUT /admin/feature-flags/:id` - Update flag
- `POST /admin/feature-flags/:id/toggle` - Toggle
- `DELETE /admin/feature-flags/:id` - Delete flag

### Observability (10 endpoints)

- `GET /admin/dashboard/overview` - 24h summary
- `GET /admin/dashboard/metrics` - Time-series
- `GET /admin/dashboard/errors` - Error logs
- `GET /admin/dashboard/usage` - Provider usage
- And more...

### Configuration (7 endpoints)

- `GET /admin/config` - List configs
- `GET /admin/config/:id` - Get config
- `POST /admin/config` - Create config
- `PUT /admin/config/:id` - Update config
- `DELETE /admin/config/:id` - Delete config
- `POST /admin/config/validate/:provider` - Test provider
- `GET /admin/config/category/:category` - Query helper

**Total**: 34+ admin endpoints

## 📊 Observability

### Automated Metrics

- Request count & latency (all endpoints)
- Error tracking with stack traces
- Provider usage & costs
- Background job monitoring

### Cron Jobs

- Hourly metrics aggregation
- Daily metrics rollup
- Weekly cleanup (90-day retention)
- Error cleanup (30-day for resolved)
- Usage cleanup (180-day retention)

## 🎨 Frontend Pages

1. **Dashboard** (`/admin`) - KPIs & quick actions
2. **Users** (`/admin/users`) - User management
3. **Secrets** (`/admin/secrets`) - Encrypted secrets
4. **Feature Flags** (`/admin/feature-flags`) - Toggles
5. **Audit Logs** (`/admin/audit`) - Compliance
6. **Observability** (`/admin/observability`) - Metrics
7. **Settings** (`/admin/settings`) - Configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file

## 📞 Support

- Email: support@aprendeai.com
- Docs: https://docs.aprendeai.com
- Issues: https://github.com/yourusername/aprendeai-app/issues

---

**Built with ❤️ by the AprendeAI Team**
