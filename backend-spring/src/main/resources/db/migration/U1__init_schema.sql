-- 1. SUPPRESSION DES TRIGGERS ET FONCTIONS
DROP TRIGGER IF EXISTS set_timestamp_assignments ON assignments;

DROP TRIGGER IF EXISTS set_timestamp_trainings ON trainings;

DROP TRIGGER IF EXISTS set_timestamp_certifications ON certifications;

DROP TRIGGER IF EXISTS set_timestamp_users ON users;

DROP TRIGGER IF EXISTS set_timestamp_squads ON squads;

DROP FUNCTION IF EXISTS trigger_set_timestamp ();

-- 2. SUPPRESSION DES TABLES (Ordre inverse des dépendances)
DROP TABLE IF EXISTS audit_logs CASCADE;

DROP TABLE IF EXISTS notifications CASCADE;

DROP TABLE IF EXISTS certification_ratings CASCADE;

DROP TABLE IF EXISTS certificates CASCADE;

DROP TABLE IF EXISTS assignments CASCADE;

DROP TABLE IF EXISTS training_squads CASCADE;

DROP TABLE IF EXISTS trainings CASCADE;

DROP TABLE IF EXISTS certification_squads CASCADE;

DROP TABLE IF EXISTS certifications CASCADE;

DROP TABLE IF EXISTS squad_lead_assignments CASCADE;

DROP TABLE IF EXISTS manager_assignments CASCADE;

DROP TABLE IF EXISTS refresh_tokens CASCADE;

DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS squads CASCADE;

-- 3. SUPPRESSION DES TYPES / ENUMS
DROP TYPE IF EXISTS notification_type;

DROP TYPE IF EXISTS certificate_status;

DROP TYPE IF EXISTS item_type_enum;

DROP TYPE IF EXISTS status_training;

DROP TYPE IF EXISTS status_certification;

DROP TYPE IF EXISTS training_priority;

DROP TYPE IF EXISTS training_type;

DROP TYPE IF EXISTS cert_priority;

DROP TYPE IF EXISTS cert_difficulty;

DROP TYPE IF EXISTS user_status;

DROP TYPE IF EXISTS user_role;

-- Note : L'extension "uuid-ossp" n'est pas supprimée car elle
-- pourrait être utilisée par d'autres schémas ou bases de données.
-- Si vous souhaitez vraiment la supprimer, décommentez la ligne suivante :
-- DROP EXTENSION IF EXISTS "uuid-ossp";