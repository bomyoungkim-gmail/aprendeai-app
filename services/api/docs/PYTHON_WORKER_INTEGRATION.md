# Python Worker Integration Guide

## Overview

The Python extraction worker needs to emit `extraction.completed` event after successfully processing content. This triggers automatic baseline graph generation.

---

## Option 1: HTTP Callback (Recommended)

### Step 1: Create Internal API Endpoint

Add to `src/extraction/extraction.controller.ts`:

```typescript
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Controller("extraction")
export class ExtractionController {
  constructor(
    private readonly eventEmitter: EventEmitter2
    // ... other dependencies
  ) {}

  /**
   * Internal endpoint for Python worker to trigger extraction.completed event
   * Protected by X-Internal-Secret header
   */
  @Post("internal/completed")
  @UseGuards(InternalSecretGuard) // Implement this guard
  async handleExtractionCompleted(@Body() dto: { contentId: string }) {
    this.eventEmitter.emit("extraction.completed", {
      contentId: dto.contentId,
    });

    return { success: true };
  }
}
```

### Step 2: Create Internal Secret Guard

Add to `src/common/guards/internal-secret.guard.ts`:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers["x-internal-secret"];

    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      throw new UnauthorizedException("Invalid internal secret");
    }

    return true;
  }
}
```

### Step 3: Update Python Worker

Add to your Python extraction worker (after successful extraction):

```python
import requests
import os

def notify_extraction_complete(content_id: str):
    """Notify API that extraction is complete"""
    api_url = os.getenv('API_URL', 'http://localhost:3000')
    internal_secret = os.getenv('INTERNAL_API_SECRET')

    try:
        response = requests.post(
            f'{api_url}/extraction/internal/completed',
            json={'contentId': content_id},
            headers={'X-Internal-Secret': internal_secret},
            timeout=5
        )
        response.raise_for_status()
        print(f"✅ Notified API of extraction completion for {content_id}")
    except Exception as e:
        print(f"⚠️ Failed to notify API: {e}")
        # Don't fail the extraction if notification fails

# Call after successful extraction
def process_content(content_id: str):
    # ... extraction logic ...

    # Save to database
    save_extraction_to_db(content_id, extracted_data)

    # Notify API
    notify_extraction_complete(content_id)
```

### Step 4: Environment Variables

Add to `.env`:

```bash
# Internal API Secret (generate with: openssl rand -hex 32)
INTERNAL_API_SECRET=your-secret-here-change-in-production
```

Add to Python worker `.env`:

```bash
API_URL=http://localhost:3000
INTERNAL_API_SECRET=same-secret-as-api
```

---

## Option 2: RabbitMQ Event (Alternative)

If you prefer event-driven architecture:

### Step 1: Publish to RabbitMQ

Python worker publishes to `extraction.completed` queue:

```python
import pika
import json

def publish_extraction_completed(content_id: str):
    """Publish extraction.completed event to RabbitMQ"""
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost')
    )
    channel = connection.channel()

    channel.exchange_declare(
        exchange='extraction.events',
        exchange_type='topic'
    )

    message = json.dumps({'contentId': content_id})

    channel.basic_publish(
        exchange='extraction.events',
        routing_key='extraction.completed',
        body=message
    )

    connection.close()
    print(f"✅ Published extraction.completed event for {content_id}")
```

### Step 2: Consume in NestJS

Add consumer to `src/queue/queue-consumer.service.ts`:

```typescript
async startExtractionEventConsumer() {
  const queue = 'extraction.completed';

  await this.channel.assertQueue(queue, { durable: true });

  this.channel.consume(queue, async (msg) => {
    if (!msg) return;

    const { contentId } = JSON.parse(msg.content.toString());

    this.eventEmitter.emit('extraction.completed', { contentId });

    this.channel.ack(msg);
  });
}
```

---

## Testing

### Manual Test (HTTP Callback)

```bash
curl -X POST http://localhost:3000/extraction/internal/completed \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: your-secret-here" \
  -d '{"contentId": "test-content-id"}'
```

Expected response:

```json
{ "success": true }
```

Check logs for:

```
[ContentBaselineListener] Extraction completed for content: test-content-id
[ContentBaselineListener] Auto-building baseline for content: test-content-id
```

### Verify Baseline Creation

```sql
SELECT * FROM topic_graphs
WHERE type = 'BASELINE'
  AND content_id = 'test-content-id';
```

---

## Deployment Checklist

- [ ] Add `INTERNAL_API_SECRET` to API `.env`
- [ ] Add `API_URL` and `INTERNAL_API_SECRET` to Python worker `.env`
- [ ] Deploy `InternalSecretGuard`
- [ ] Deploy extraction controller endpoint
- [ ] Update Python worker code
- [ ] Test in DEV environment
- [ ] Verify baseline auto-creation
- [ ] Deploy to STAGING
- [ ] Deploy to PRODUCTION

---

## Monitoring

Add logging to track event flow:

```typescript
// In ContentBaselineListener
this.logger.log(`Extraction completed for content: ${payload.contentId}`);
this.logger.log(`Baseline auto-build triggered for ${payload.contentId}`);
this.logger.log(`Baseline auto-build complete for ${payload.contentId}`);
```

Monitor for:

- Event emission frequency
- Baseline build success rate
- Idempotency check effectiveness
- API endpoint response times

---

## Troubleshooting

### Event not triggering

1. Check Python worker logs for HTTP errors
2. Verify `INTERNAL_API_SECRET` matches in both services
3. Check API logs for incoming requests
4. Verify `EventEmitterModule` is registered

### Baseline not created

1. Check `ContentBaselineListener` logs
2. Verify content has extractions in database
3. Check for existing baseline (idempotency)
4. Verify `GraphBaselineService` is working

### Multiple baselines created

1. Check idempotency logic in `ContentBaselineListener`
2. Verify `findBaseline()` query is correct
3. Add unique constraint if needed

---

## Security Considerations

1. **Never expose internal endpoints publicly**
   - Use firewall rules or API gateway
   - Implement rate limiting

2. **Rotate secrets regularly**
   - Change `INTERNAL_API_SECRET` quarterly
   - Use secrets management (AWS Secrets Manager, etc.)

3. **Validate payload**
   - Check `contentId` format
   - Verify content exists before processing

4. **Audit logging**
   - Log all internal API calls
   - Monitor for suspicious patterns
