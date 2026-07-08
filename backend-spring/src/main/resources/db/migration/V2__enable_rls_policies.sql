-- ==============================================================================
-- 1. FONCTIONS UTILITAIRES POUR LE CONTEXTE UTILISATEUR
-- ==============================================================================

-- Récupère l'ID de l'utilisateur connecté via la variable de session 'app.current_user_id'
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Récupère le rôle de l'utilisateur de manière sécurisée (Security Definer évite la boucle infinie RLS)
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS text AS $$
DECLARE
    v_role text;
BEGIN
    SELECT rôle::text INTO v_role FROM users WHERE id = auth_user_id();
    RETURN v_role;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. ACTIVATION DU RLS SUR TOUTES LES TABLES
-- ==============================================================================

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE manager_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE squad_lead_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE certification_squads ENABLE ROW LEVEL SECURITY;

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

ALTER TABLE training_squads ENABLE ROW LEVEL SECURITY;

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

ALTER TABLE certification_ratings ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLITIQUES DE SÉCURITÉ (POLICIES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BLOC : SQUADS & USERS (CRUD Utilisateurs & Hiérarchie)
-- Matrice : ADMIN = Oui (CRUD) | Autres = Non (mais lecture autorisée) | COLLAB = Self only pour l'édition
-- ------------------------------------------------------------------------------

-- Users
CREATE POLICY admin_all_users ON users FOR ALL USING (auth_user_role () = 'ADMIN');

CREATE POLICY read_all_users ON users FOR SELECT USING (true);
-- Tout le monde peut voir les profils (nécessaire pour l'UI)
CREATE POLICY collab_update_self ON users
FOR UPDATE
    USING (id = auth_user_id ());

-- Squads
CREATE POLICY admin_all_squads ON squads FOR ALL USING (auth_user_role () = 'ADMIN');

CREATE POLICY read_all_squads ON squads FOR SELECT USING (true);

-- Refresh Tokens (Technique : L'utilisateur ne gère que les siens)
CREATE POLICY user_own_tokens ON refresh_tokens FOR ALL USING (user_id = auth_user_id ());

-- ------------------------------------------------------------------------------
-- BLOC : HIÉRARCHIE (Gérer hiérarchie CM)
-- Matrice : ADMIN = Oui | Autres = Non (Lecture seule)
-- ------------------------------------------------------------------------------

-- Manager Assignments (CM)
CREATE POLICY admin_all_manager_assignments ON manager_assignments FOR ALL USING (auth_user_role () = 'ADMIN');

CREATE POLICY read_manager_assignments ON manager_assignments FOR
SELECT USING (true);

-- Squad Lead Assignments (SL)
CREATE POLICY admin_all_sl_assignments ON squad_lead_assignments FOR ALL USING (auth_user_role () = 'ADMIN');

CREATE POLICY read_sl_assignments ON squad_lead_assignments FOR
SELECT USING (true);

-- ------------------------------------------------------------------------------
-- BLOC : CATALOGUE (Certifications & Trainings)
-- Matrice : ADMIN & TM = Oui (CRUD) | DIR, CM, SL, COLLAB = Lecture
-- ------------------------------------------------------------------------------

-- Certifications & Trainings
CREATE POLICY admin_tm_crud_catalog ON certifications FOR ALL USING (
    auth_user_role () IN ('ADMIN', 'TRAINING_MANAGER')
);

CREATE POLICY read_catalog_certifications ON certifications FOR
SELECT USING (true);

CREATE POLICY admin_tm_crud_trainings ON trainings FOR ALL USING (
    auth_user_role () IN ('ADMIN', 'TRAINING_MANAGER')
);

CREATE POLICY read_catalog_trainings ON trainings FOR
SELECT USING (true);

-- Pivot Tables (certification_squads & training_squads)
CREATE POLICY admin_tm_crud_cert_squads ON certification_squads FOR ALL USING (
    auth_user_role () IN ('ADMIN', 'TRAINING_MANAGER')
);

CREATE POLICY read_cert_squads ON certification_squads FOR
SELECT USING (true);

CREATE POLICY admin_tm_crud_train_squads ON training_squads FOR ALL USING (
    auth_user_role () IN ('ADMIN', 'TRAINING_MANAGER')
);

CREATE POLICY read_train_squads ON training_squads FOR
SELECT USING (true);

-- ------------------------------------------------------------------------------
-- BLOC : ASSIGNMENTS (Créer et Voir les assignations)
-- Matrice Créer : ADMIN=Oui, TM=Oui, CM=Ses collabs, Autres=Non
-- Matrice Voir  : ADMIN/TM/DIR=Tous, CM=Ses collabs, SL=Son squad, COLLAB=Les siens
-- ------------------------------------------------------------------------------

-- ADMIN et TM : Accès total (Lecture + Création/Modification pour tout le monde)
CREATE POLICY admin_tm_all_assignments ON assignments FOR ALL USING (
    auth_user_role () IN ('ADMIN', 'TRAINING_MANAGER')
);

-- DIRECTEUR : Lecture seule sur tout
CREATE POLICY director_read_assignments ON assignments FOR
SELECT USING (
        auth_user_role () = 'DIRECTOR'
    );

-- CAREER MANAGER : CRUD sur ses collaborateurs assignés
CREATE POLICY cm_crud_assignments ON assignments FOR ALL USING (
    auth_user_role () = 'CAREER_MANAGER'
    AND user_id IN (
        SELECT collaborator_id
        FROM manager_assignments
        WHERE
            manager_id = auth_user_id ()
    )
);

-- SQUAD LEAD : Lecture seule sur les membres de ses squads
CREATE POLICY sl_read_assignments ON assignments FOR
SELECT USING (
        auth_user_role () = 'SQUAD_LEAD'
        AND user_id IN (
            SELECT u.id
            FROM
                users u
                JOIN squad_lead_assignments sla ON u.squad_id = sla.squad_id
            WHERE
                sla.lead_id = auth_user_id ()
        )
    );

-- COLLABORATEUR : Gère ses propres assignations (Lecture + Mise à jour des statuts/progression)
-- Note: FOR ALL lui permet de modifier son statut (IN_PROGRESS, COMPLETED) mais votre backend doit
-- bloquer l'INSERT s'il ne peut pas s'auto-assigner de formations.
CREATE POLICY collab_own_assignments ON assignments FOR ALL USING (user_id = auth_user_id ());

-- ------------------------------------------------------------------------------
-- BLOC : CERTIFICATES (Upload certificat)
-- Matrice : COLLAB = Les siens (Upload) | Autres = Lecture selon leur scope
-- ------------------------------------------------------------------------------

-- COLLABORATEUR : Accès total à ses propres certificats (Upload, Delete, Read)
CREATE POLICY collab_crud_certificates ON certificates FOR ALL USING (user_id = auth_user_id ());

-- ADMIN, TM, DIRECTOR : Lecture de tous les certificats
CREATE POLICY global_read_certificates ON certificates FOR
SELECT USING (
        auth_user_role () IN (
            'ADMIN', 'TRAINING_MANAGER', 'DIRECTOR'
        )
    );

-- CAREER MANAGER : Lecture des certificats de ses collaborateurs
CREATE POLICY cm_read_certificates ON certificates FOR
SELECT USING (
        auth_user_role () = 'CAREER_MANAGER'
        AND user_id IN (
            SELECT collaborator_id
            FROM manager_assignments
            WHERE
                manager_id = auth_user_id ()
        )
    );

-- SQUAD LEAD : Lecture des certificats de ses membres de squad
CREATE POLICY sl_read_certificates ON certificates FOR
SELECT USING (
        auth_user_role () = 'SQUAD_LEAD'
        AND user_id IN (
            SELECT u.id
            FROM
                users u
                JOIN squad_lead_assignments sla ON u.squad_id = sla.squad_id
            WHERE
                sla.lead_id = auth_user_id ()
        )
    );

-- ------------------------------------------------------------------------------
-- BLOC : RATINGS (Avis sur les certifications)
-- ------------------------------------------------------------------------------
-- Les collaborateurs gèrent leurs propres avis, tout le monde peut les lire.
CREATE POLICY read_all_ratings ON certification_ratings FOR
SELECT USING (true);

CREATE POLICY collab_own_ratings ON certification_ratings FOR ALL USING (user_id = auth_user_id ());

-- ------------------------------------------------------------------------------
-- BLOC : SUPPORT (Notifications & Audit Logs)
-- ------------------------------------------------------------------------------

-- Notifications
CREATE POLICY admin_all_notifications ON notifications FOR ALL USING (auth_user_role () = 'ADMIN');

CREATE POLICY user_own_notifications ON notifications FOR ALL USING (user_id = auth_user_id ());

-- Audit Logs (Lecture Admin uniquement, l'insertion doit être forcée en by-passant RLS via un trigger Security Definer ou le backend)
CREATE POLICY admin_read_audit ON audit_logs FOR
SELECT USING (auth_user_role () = 'ADMIN');

-- -- 1. Créer la fonction d'audit en SECURITY DEFINER
-- CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
-- BEGIN
--     -- Cette insertion passera TOUJOURS, car SECURITY DEFINER ignore le RLS de l'utilisateur
--     INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
--     VALUES (auth_user_id(), TG_OP, TG_TABLE_NAME, NEW.id);

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- 2. L'attacher aux tables que tu veux surveiller
-- CREATE TRIGGER audit_assignments_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON assignments
--     FOR EACH ROW EXECUTE FUNCTION log_audit_event();