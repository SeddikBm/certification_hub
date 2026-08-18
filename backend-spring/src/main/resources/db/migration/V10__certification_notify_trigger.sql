-- ============================================================================
-- V10: Postgres NOTIFY trigger — fires whenever a certification row is
--      inserted or updated, so the backend-ai service can re-ingest it
--      automatically via LISTEN/NOTIFY without polling.
--
-- Payload: JSON with {"id": "<uuid>", "operation": "INSERT"|"UPDATE"}
-- Channel: certif_changed
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_certification_changed()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'certif_changed',
        json_build_object(
            'id',        NEW.id::text,
            'operation', TG_OP
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certif_changed ON certifications;

CREATE TRIGGER trg_certif_changed
    AFTER INSERT OR UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_certification_changed();
