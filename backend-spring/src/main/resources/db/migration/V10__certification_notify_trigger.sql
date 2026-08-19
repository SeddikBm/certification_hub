-- V10: NOTIFY trigger so backend-ai auto re-ingests on INSERT/UPDATE
CREATE OR REPLACE FUNCTION notify_certification_changed()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'certif_changed',
        json_build_object('id', NEW.id::text, 'operation', TG_OP)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certif_changed ON certifications;
CREATE TRIGGER trg_certif_changed
    AFTER INSERT OR UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION notify_certification_changed();
