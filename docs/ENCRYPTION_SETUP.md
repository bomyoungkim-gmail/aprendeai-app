# Encryption Setup

## Master Key Configuration

Add this to your `.env` file:

```bash
# CRITICAL: Never commit this to git!
ADMIN_MASTER_KEY=9gKpxS5pmi6tSnBdfOyXGagfe7d3HHYQyPnUa8ZIn5tE=
```

## Generate New Master Key

If you need to generate a new master key:

```bash
docker-compose exec api node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Security Notes

1. **Never commit** ADMIN_MASTER_KEY to git
2. Use secret management service in production (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Rotate periodically (recommend every 90 days)
4. Store backup securely offline

## Key Rotation

To rotate the master key, you'll need to:

1. Generate new key
2. Re-encrypt all secrets with new key
3. Update ADMIN_MASTER_KEY in environment
4. Restart API

Contact admin for key rotation procedure.
