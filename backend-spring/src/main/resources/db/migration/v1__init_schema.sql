CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CRÉATION DES TYPES (ENUMS & TYPES DÉDIÉS)
-- ==========================================

-- Users
CREATE TYPE user_role AS ENUM ('ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD', 'COLLABORATOR');
-- 6 rôles exacts
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- Certifications
CREATE TYPE cert_difficulty AS ENUM ('FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
-- 4 niveaux
CREATE TYPE cert_priority AS ENUM ('MANDATORY', 'HIGH', 'NORMAL', 'ADVANCED');
-- 4 priorités

-- Trainings
CREATE TYPE training_type AS ENUM ('UDEMY_BUSINESS', 'INTERNAL', 'EXTERNAL', 'CONFERENCE');
-- 4 types exacts
CREATE TYPE training_priority AS ENUM ('MANDATORY', 'OPTIONAL');
-- 2 priorités exactes

-- Assignments (Cycles de vie spécifiques)
-- 9 états : PENDING_APPROVAL -> APPROVED -> PLANNED -> IN_PROGRESS -> EXAM_SCHEDULED -> COMPLETED / FAILED (+ CANCELLED, EXPIRED)
CREATE TYPE status_certification AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'PLANNED', 'IN_PROGRESS', 'EXAM_SCHEDULED', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- 6 états : PENDING_APPROVAL -> APPROVED -> PLANNED -> IN_PROGRESS -> COMPLETED (+ CANCELLED)
CREATE TYPE status_training AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Clé polymorphique
CREATE TYPE item_type_enum AS ENUM ('CERTIFICATION', 'TRAINING');

-- Support (Certificates, Notifications)
CREATE TYPE certificate_status AS ENUM ('PENDING_VALIDATION', 'VALID', 'REJECTED', 'EXPIRED');

CREATE TYPE notification_type AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- ==========================================
-- 2. CRÉATION DES TABLES (Par ordre de dépendance)
-- ==========================================

-- ------------------------------------------
-- BLOC : SQUADS & USERS / AUTH
-- ------------------------------------------

CREATE TABLE squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    color_hex VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    squad_id UUID REFERENCES squads (id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE refresh_tokens (
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, token_hash)
);

-- ------------------------------------------
-- BLOC : HIÉRARCHIE (VIOLET)
-- ------------------------------------------

CREATE TABLE manager_assignments (
    manager_id UUID REFERENCES users (id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES users (id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
    PRIMARY KEY (manager_id, collaborator_id)
);

CREATE TABLE squad_lead_assignments (
    lead_id UUID REFERENCES users (id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads (id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, squad_id)
);

-- ------------------------------------------
-- BLOC : CATALOGUE (JAUNE)
-- ------------------------------------------

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100),
    difficulty cert_difficulty,
    priority cert_priority,
    exam_cost_usd NUMERIC(10, 2),
    training_cost_usd NUMERIC(10, 2),
    validity_months INTEGER,
    official_url TEXT,
    exam_provider_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE certification_squads (
    certification_id UUID REFERENCES certifications (id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads (id) ON DELETE CASCADE,
    priority SMALLINT CHECK (priority BETWEEN 1 AND 5),
    PRIMARY KEY (certification_id, squad_id)
);

CREATE TABLE trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    title VARCHAR(255) NOT NULL,
    type training_type,
    provider VARCHAR(100),
    priority training_priority,
    duration_hours NUMERIC(6, 2),
    cost_usd NUMERIC(10, 2),
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE training_squads (
    training_id UUID REFERENCES trainings (id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads (id) ON DELETE CASCADE,
    priority SMALLINT CHECK (priority BETWEEN 1 AND 5),
    PRIMARY KEY (training_id, squad_id)
);

-- ------------------------------------------
-- BLOC : ASSIGNMENTS (ROUGE) & PROGRESSION
-- ------------------------------------------

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    item_type item_type_enum NOT NULL,
    item_id UUID NOT NULL,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    status_certification status_certification,
    status_training status_training,
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    exam_at TIMESTAMP WITH TIME ZONE,
    training_progress_percentage SMALLINT CHECK (
        training_progress_percentage BETWEEN 0 AND 100
    ),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_assignments_polymorphic ON assignments (item_type, item_id);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    assignment_id UUID REFERENCES assignments (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    status certificate_status
);

CREATE TABLE certification_ratings (
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    certification_id UUID REFERENCES certifications (id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments (id) ON DELETE SET NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, certification_id)
);

-- ------------------------------------------
-- BLOC : SUPPORT (GRIS)
-- ------------------------------------------

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    type notification_type,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. AUTOMATISATION DES TIMESTAMPS (UPDATED_AT)
-- ==========================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_squads BEFORE UPDATE ON squads FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_certifications BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_trainings BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_assignments BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();