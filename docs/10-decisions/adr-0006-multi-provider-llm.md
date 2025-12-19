# ADR-0006 — Multi-Provider LLM Strategy

**Status:** Accepted  
**Date:** 2024-12-18  
**Context:** Need flexible LLM provider strategy for cost, reliability, and capability

## Decision

Implement multi-provider LLM support with task-based routing:

**Providers:**

1. **OpenAI** (GPT-4, GPT-3.5) - Best for complex reasoning
2. **Anthropic** (Claude 3) - Best for long context
3. **Google Gemini** - Cost-effective option

**Routing strategy:**

- Quiz generation → Cost-optimized (Gemini or GPT-3.5)
- Asset generation L3 → High capability (GPT-4 or Claude)
- Extraction → Fast + cheap (GPT-3.5 or Gemini)
- Production feedback → Medium (Claude or GPT-3.5)

**Implementation:**

- LangChain for abstraction
- Config-driven provider selection
- Fallback chain on failure
- Cost tracking per task

## Consequences

**Positive:**

- **Flexibility:** Switch providers without code changes
- **Cost optimization:** Use cheapest for simple tasks
- **Reliability:** Fallback if one provider down
- **Capability matching:** Best model for each task
- **Vendor independence:** Not locked to one provider
- **Experimentation:** Easy to A/B test providers

**Negative:**

- **Complexity:** More moving parts
- **Cost tracking:** Need to monitor multiple bills
- **API key management:** Multiple keys to secure
- **Rate limits:** Different limits per provider
- **Prompt tuning:** May need provider-specific prompts

**Neutral:**

- Can adjust routing without deploy
- LangChain handles most abstraction

## Alternatives Considered

### 1. OpenAI Only

**Rejected because:**

- Vendor lock-in risk
- Single point of failure
- Can't optimize costs
- Rate limits affect all tasks

### 2. Self-Hosted LLM

**Rejected because:**

- High infrastructure cost
- Maintenance burden
- Quality not competitive (yet)
- Latency issues

### 3. Random/Round-Robin Routing

**Rejected because:**

- Wastes money on expensive models for simple tasks
- No capability matching
- Unpredictable quality

## Provider Selection Matrix

| Task             | Provider     | Model           | Reasoning                         |
| ---------------- | ------------ | --------------- | --------------------------------- |
| Quiz (L1)        | Gemini       | gemini-pro      | Simple, high volume, cost matters |
| Quiz (L2/L3)     | OpenAI       | gpt-3.5-turbo   | Better quality, still affordable  |
| Asset Generation | Claude/GPT-4 | claude-3-sonnet | Creative, long context            |
| Extraction       | Gemini       | gemini-pro      | Fast, structured output           |
| Glossary         | OpenAI       | gpt-3.5-turbo   | Balance cost/quality              |
| Feedback         | Claude       | claude-3-sonnet | Nuanced, helpful                  |

## Fallback Chain

**Example for Quiz L2:**

1. Try OpenAI GPT-3.5
2. If fails → Try Gemini
3. If fails → Try GPT-4 (expensive but reliable)
4. If all fail → Return error, fallback to L1

**Example for Asset L3:**

1. Try Claude Sonnet
2. If fails → Try GPT-4
3. If fails → Try GPT-3.5 (degraded)
4. If all fail → Return error

## Cost Management

**Budget per task type:**

- Quiz: $0.001 per generation (target)
- Asset L3: $0.05 per generation (acceptable)
- Extraction: $0.002 per document (target)

**Tracking:**

- Log every API call with: provider, model, tokens, cost
- Daily aggregation
- Alerts if budget exceeded
- Monthly reporting

## Implementation Notes

**Config:**

```typescript
const PROVIDER_CONFIG = {
  quiz_l1: { provider: 'gemini', model: 'gemini-pro', fallback: 'openai' },
  quiz_l2: { provider: 'openai', model: 'gpt-3.5-turbo', fallback: 'gemini' },
  asset_l3: { provider: 'anthropic', model: 'claude-3-sonnet', fallback: 'openai' },
  ...
};
```

**Monitoring:**

- CloudWatch/Datadog for latency
- Cost tracking per provider
- Error rates per provider
- Token usage trends

## Future Considerations

**V2:**

- Add more providers (Cohere, Mistral)
- Dynamic routing based on load
- User preference for provider
- Provider-specific prompt optimization

## Links

- [AI Pipelines](../../07-jobs-and-ai/02-ai-pipelines-langgraph.md)
- [Prompting & Schemas](../../07-jobs-and-ai/03-prompting-and-schemas.md)
- [Cost Controls](../../09-operations/04-cost-controls.md)
