# Graph Automation - Environment Configuration

## Required Environment Variables

Add these to your `.env` file:

```bash
# ============================================
# GRAPH AUTOMATION CONFIGURATION
# ============================================

# Temporal Decay Settings (Item 19.10)
# Half-life in days for confidence decay
# Default: 14 days (2 weeks)
# Range: 1-365
GRAPH_DECAY_HALF_LIFE=14

# Minimum confidence threshold
# Nodes below this value won't decay further
# Default: 0.2 (20%)
# Range: 0.0-1.0
GRAPH_MIN_CONFIDENCE=0.2

# Periodic Comparison Settings (Item 19.9)
# Number of graph updates before triggering on-demand comparison
# Default: 5
# Range: 1-100
GRAPH_COMPARISON_ACTIVITY_THRESHOLD=5

# Internal API Security
# Secret for Python worker to call internal endpoints
# Generate with: openssl rand -hex 32
# CRITICAL: Change this in production!
INTERNAL_API_SECRET=change-me-in-production-use-openssl-rand-hex-32

# ============================================
# PYTHON WORKER CONFIGURATION (if separate service)
# ============================================

# API URL for callbacks
API_URL=http://localhost:3000

# Same secret as above
INTERNAL_API_SECRET=change-me-in-production-use-openssl-rand-hex-32
```

---

## Configuration Validation

The application validates configuration on startup:

### GraphDecayService

- `GRAPH_DECAY_HALF_LIFE` must be > 0
- `GRAPH_MIN_CONFIDENCE` must be between 0 and 1

**Startup Logs:**

```
[GraphDecayService] GraphDecayService initialized: halfLife=14d, minConfidence=0.2
```

**Error Example:**

```
Error: GRAPH_DECAY_HALF_LIFE must be greater than 0
```

---

## Recommended Values by Environment

### Development

```bash
GRAPH_DECAY_HALF_LIFE=7          # Faster decay for testing
GRAPH_MIN_CONFIDENCE=0.2
GRAPH_COMPARISON_ACTIVITY_THRESHOLD=3  # More frequent comparisons
INTERNAL_API_SECRET=dev-secret-not-for-production
```

### Staging

```bash
GRAPH_DECAY_HALF_LIFE=14
GRAPH_MIN_CONFIDENCE=0.2
GRAPH_COMPARISON_ACTIVITY_THRESHOLD=5
INTERNAL_API_SECRET=<generate-unique-secret>
```

### Production

```bash
GRAPH_DECAY_HALF_LIFE=14
GRAPH_MIN_CONFIDENCE=0.2
GRAPH_COMPARISON_ACTIVITY_THRESHOLD=5
INTERNAL_API_SECRET=<generate-unique-secret>
```

---

## Tuning Guide

### Decay Half-Life

**Shorter (7-10 days):**

- ✅ Faster forgetting curve
- ✅ Encourages more frequent review
- ❌ May be too aggressive for casual learners

**Medium (14-21 days):**

- ✅ Balanced approach (recommended)
- ✅ Aligns with spaced repetition research
- ✅ Good for most use cases

**Longer (30+ days):**

- ✅ More forgiving for infrequent users
- ❌ May not reflect actual knowledge retention
- ❌ Slower adaptation to learning patterns

### Minimum Confidence

**Lower (0.1-0.15):**

- ✅ Allows more decay before floor
- ❌ May retain "forgotten" knowledge too long

**Medium (0.2-0.3):**

- ✅ Balanced (recommended)
- ✅ Prevents complete knowledge loss
- ✅ Allows meaningful decay

**Higher (0.4-0.5):**

- ✅ More conservative
- ❌ May not reflect true forgetting
- ❌ Less dynamic graph evolution

### Activity Threshold

**Lower (1-3):**

- ✅ More frequent comparisons
- ✅ Faster feedback to users
- ❌ Higher computational cost
- ❌ May trigger too often

**Medium (5-10):**

- ✅ Balanced (recommended)
- ✅ Good trade-off between freshness and cost
- ✅ Suitable for most users

**Higher (15+):**

- ✅ Lower computational cost
- ❌ Less frequent feedback
- ❌ May miss important changes

---

## Monitoring Configuration

Add these metrics to your monitoring dashboard:

```typescript
// Example: Datadog, Prometheus, etc.
{
  "graph.decay.half_life": process.env.GRAPH_DECAY_HALF_LIFE,
  "graph.decay.min_confidence": process.env.GRAPH_MIN_CONFIDENCE,
  "graph.comparison.threshold": process.env.GRAPH_COMPARISON_ACTIVITY_THRESHOLD,
}
```

Track:

- Average nodes decayed per job
- Comparison trigger frequency
- Configuration changes over time

---

## Security Best Practices

### INTERNAL_API_SECRET

1. **Generate Strong Secrets**

   ```bash
   openssl rand -hex 32
   ```

2. **Never Commit to Git**
   - Add to `.gitignore`
   - Use environment-specific configs

3. **Rotate Regularly**
   - Change every 90 days
   - Update both API and Python worker simultaneously

4. **Use Secrets Management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Secret Manager

---

## Deployment Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Generate `INTERNAL_API_SECRET`
- [ ] Set appropriate values for environment
- [ ] Verify configuration validation on startup
- [ ] Test decay job manually
- [ ] Test comparison job manually
- [ ] Monitor logs for configuration warnings
- [ ] Document any custom values in runbook
