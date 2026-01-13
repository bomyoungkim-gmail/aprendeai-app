export type EventsToWriteInput = Record<string, any>;

export interface NormalizedEventToWrite {
  eventType: string;
  payloadJson: Record<string, any>;
  domain?: string;
}

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function normalizeEventsToWrite(
  events: EventsToWriteInput[] | undefined | null,
): NormalizedEventToWrite[] {
  if (!Array.isArray(events)) return [];

  const out: NormalizedEventToWrite[] = [];

  for (const raw of events) {
    if (!isPlainObject(raw)) continue;

    // Normalize eventType
    const eventType = (raw.eventType ??
      raw.type ??
      raw.event_type ??
      raw.event) as string | undefined;
    if (!eventType || typeof eventType !== "string" || !eventType.trim())
      continue;

    // Normalize payloadJson
    let payloadJson = (raw.payloadJson ??
      raw.payload_json ??
      raw.payload ??
      raw.data ??
      raw.meta) as Record<string, any> | undefined;

    if (!isPlainObject(payloadJson)) payloadJson = {};

    // Normalize domain (optional)
    const domain =
      typeof raw.domain === "string" && raw.domain.trim()
        ? raw.domain.trim()
        : undefined;

    out.push({
      eventType: eventType.trim(),
      payloadJson,
      ...(domain ? { domain } : {}),
    });
  }

  return out;
}
