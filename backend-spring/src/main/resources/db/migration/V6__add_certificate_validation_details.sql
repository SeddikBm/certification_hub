-- Ajout du champ validation_details pour stocker les résultats de la validation IA
-- Ce champ JSONB stocke: decision, scores (name, title, date, overall), reasons, source, extracted

ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS validation_details JSONB;

-- Index GIN pour les requêtes sur le JSON de validation
CREATE INDEX IF NOT EXISTS idx_certificates_validation_details
    ON certificates USING gin (validation_details);
