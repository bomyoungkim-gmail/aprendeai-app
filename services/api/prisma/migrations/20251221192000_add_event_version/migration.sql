-- Stage: Add event_version column to session_events
-- Phase 0: MVP-Hardening - Event Schema Registry
-- Enables schema versioning for event payloads
ALTER TABLE session_events
ADD COLUMN event_version INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN session_events.event_version IS 'JSON Schema version for payloadJson validation';