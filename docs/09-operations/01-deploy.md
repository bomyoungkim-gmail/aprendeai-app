# Deployment Guide

**Purpose:** Deployment strategy for Staging and Production  
**Audience:** Ops | Dev  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants

- Master branch maps to **Staging** (auto-deploy)
- Tags (vX.Y.Z) map to **Production** (manual approval)
- Zero-downtime deployments
- Database migrations run _before_ app code update

## Architecture

See [Architecture at a Glance](../00-overview/03-architecture-at-a-glance.md).

**AWS Stack:**

- **ECS Fargate**: API, Frontend (SSR), Workers
- **RDS**: PostgreSQL (Primary + Replica)
- **ElastiCache**: Redis
- **Amazon MQ**: RabbitMQ
- **S3**: Static assets (PDFs)
- **CloudFront**: CDN for frontend/assets

## CI/CD Pipeline (GitHub Actions)

### 1. Build & Test

Triggers: Push to `main`, `develop`

- Lint code
- Run Unit Tests
- Run Integration Tests
- Build Docker Images

### 2. Deploy to Staging

Triggers: Push to `main` (after Build success)

- Push Docker images to ECR (`:staging`)
- Run DB Migrations (Prisma)
- Update ECS Service (Staging Cluster)
- Run E2E Smoke Tests

### 3. Deploy to Production

Triggers: Release Tag (`v*`)

- Push Docker images to ECR (`:prod` + `:v1.0.0`)
- **Manual Gate**: Approve in GitHub Actions
- Run DB Migrations
- Update ECS Service (Prod Cluster)

## Dockerfiles

**Backend (`services/api/Dockerfile`):**

- Multi-stage build
- Base: `node:20-alpine`
- Prod: `node dist/main`
- Optimizes for size (excludes devDeps)

**Frontend (`frontend/Dockerfile`):**

- Multi-stage build
- Base: `node:20-alpine`
- Output: Next.js standalone build
- Expose 3000

## Environment Variables

Managed via AWS Secrets Manager.

**Crucial Production Vars:**

- `NODE_ENV=production`
- `DATABASE_URL`: RDS endpoint (pooled)
- `JWT_SECRET`: Rotated secure secret
- `CORS_ORIGIN`: `https://cornellreader.com`

## Database Migrations

Prisma migrations run via an ephemeral ECS task (Migration Runner) before the main service updates.

```bash
# In pipeline
npx prisma migrate deploy
```

**Rollback Strategy:**

- We do NOT automate DB rollbacks.
- Strategy: Forward-only fix (revert code, create new migration to revert DB changes).
- Backups: RDS Automated Backups (Point-in-time recovery) enabled.

## Monitoring & Logs

- **CloudWatch Logs**: All container stdout/stderr
- **CloudWatch Metrics**: CPU, Memory, Request Count, Latency
- **Health Checks**: `/health` endpoint on API checks DB/Redis connection.

## Runbook: Manual Rollback (Code)

If a bad deploy creates bugs (but valid DB):

1. Identify stable image tag (e.g. `v1.0.1`).
2. Update ECS Service definition to use `v1.0.1`.
3. Force new deployment.

## Related

- [Local Dev](./00-local-dev.md)
- [Testing Strategy](../08-testing/00-testing-strategy.md)
