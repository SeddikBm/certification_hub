-- ==============================================================================
-- 1. FONCTIONS UTILITAIRES POUR LE CONTEXTE UTILISATEUR
-- ==============================================================================

-- Récupère l'ID de l'utilisateur connecté via la variable de session 'app.current_user_id'
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Récupère le rôle de l'utilisateur de manière sécurisée (Security Definer évite la boucle infinie RLS)
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS text AS $$
DECLARE
    v_role text;
BEGIN
    -- On interroge directement la table users par son ID sans RLS pour éviter la boucle infinie.
    -- (auth_user_role() est appelé dans les polices RLS de la table users)
    SELECT role::text INTO v_role FROM users WHERE id = auth_user_id();
    RETURN v_role;
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
-- ------------------------------------------------------------------------------

-- Users (Lecture selon la hiérarchie pour respecter US-04.1)
CREATE POLICY select_users ON users FOR SELECT USING (
    auth_user_role() IN ('ADMIN', 'DIRECTOR', 'TRAINING_MANAGER')
    OR id = auth_user_id()
    OR (auth_user_role() = 'CAREER_MANAGER' AND id IN (SELECT collaborator_id FROM manager_assignments WHERE manager_id = auth_user_id()))
    OR (auth_user_role() = 'SQUAD_LEAD' AND squad_id IN (SELECT squad_id FROM squad_lead_assignments WHERE lead_id = auth_user_id()))
);

CREATE POLICY admin_insert_users ON users FOR INSERT WITH CHECK (auth_user_role() = 'ADMIN');

CREATE POLICY admin_or_self_update_users ON users FOR UPDATE USING (
    auth_user_role() = 'ADMIN' OR id = auth_user_id()
) WITH CHECK (
    auth_user_role() = 'ADMIN' OR id = auth_user_id()
);

CREATE POLICY admin_delete_users ON users FOR DELETE USING (auth_user_role() = 'ADMIN');

-- Squads
CREATE POLICY admin_all_squads ON squads FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY read_all_squads ON squads FOR SELECT USING (true);

-- Refresh Tokens
CREATE POLICY user_own_tokens ON refresh_tokens FOR ALL USING (user_id = auth_user_id());


-- ------------------------------------------------------------------------------
-- BLOC : HIÉRARCHIE
-- ------------------------------------------------------------------------------

-- Manager Assignments
CREATE POLICY admin_all_manager_assignments ON manager_assignments FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY read_manager_assignments ON manager_assignments FOR SELECT USING (true);

-- Squad Lead Assignments
CREATE POLICY admin_all_sl_assignments ON squad_lead_assignments FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY read_sl_assignments ON squad_lead_assignments FOR SELECT USING (true);


-- ------------------------------------------------------------------------------
-- BLOC : CATALOGUE (Certifications & Trainings)
-- ------------------------------------------------------------------------------

-- Certifications & Trainings
CREATE POLICY admin_tm_crud_certifications ON certifications FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));
CREATE POLICY read_catalog_certifications ON certifications FOR SELECT USING (true);

CREATE POLICY admin_tm_crud_trainings ON trainings FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));
CREATE POLICY read_catalog_trainings ON trainings FOR SELECT USING (true);

-- Pivot Tables (certification_squads & training_squads)
CREATE POLICY admin_tm_crud_cert_squads ON certification_squads FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));
CREATE POLICY read_cert_squads ON certification_squads FOR SELECT USING (true);

CREATE POLICY admin_tm_crud_train_squads ON training_squads FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));
CREATE POLICY read_train_squads ON training_squads FOR SELECT USING (true);


-- ------------------------------------------------------------------------------
-- BLOC : ASSIGNMENTS (Créer et Voir les assignations)
-- ------------------------------------------------------------------------------

-- ADMIN et TM : Accès total
CREATE POLICY admin_tm_all_assignments ON assignments 
    FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));

-- DIRECTEUR : Lecture seule sur tout
CREATE POLICY director_read_assignments ON assignments 
    FOR SELECT USING (auth_user_role() = 'DIRECTOR');

-- CAREER MANAGER : CRUD sur les assignations de ses collaborateurs
CREATE POLICY cm_crud_assignments ON assignments 
    FOR ALL USING (
        auth_user_role() = 'CAREER_MANAGER' AND 
        user_id IN (SELECT collaborator_id FROM manager_assignments WHERE manager_id = auth_user_id())
    );

-- SQUAD LEAD : Lecture seule sur les membres de ses squads
CREATE POLICY sl_read_assignments ON assignments 
    FOR SELECT USING (
        auth_user_role() = 'SQUAD_LEAD' AND 
        user_id IN (
            SELECT u.id FROM users u 
            JOIN squad_lead_assignments sla ON u.squad_id = sla.squad_id 
            WHERE sla.lead_id = auth_user_id()
        )
    );

-- COLLABORATEUR / PROPRE PERSONNE : Lecture et gestion de ses propres assignations
CREATE POLICY user_own_assignments ON assignments 
    FOR ALL USING (user_id = auth_user_id());


-- ------------------------------------------------------------------------------
-- BLOC : CERTIFICATES (Upload certificat)
-- ------------------------------------------------------------------------------

-- ADMIN et TM : Gestion de tous les certificats
CREATE POLICY admin_tm_all_certificates ON certificates 
    FOR ALL USING (auth_user_role() IN ('ADMIN', 'TRAINING_MANAGER'));

-- DIRECTEUR : Lecture seule sur tout
CREATE POLICY director_read_certificates ON certificates 
    FOR SELECT USING (auth_user_role() = 'DIRECTOR');

-- COLLABORATEUR : Accès total à ses propres certificats (Upload, Delete, Read)
CREATE POLICY collab_crud_certificates ON certificates 
    FOR ALL USING (user_id = auth_user_id());

-- CAREER MANAGER : Lecture des certificats de ses collaborateurs
CREATE POLICY cm_read_certificates ON certificates 
    FOR SELECT USING (
        auth_user_role() = 'CAREER_MANAGER' AND 
        user_id IN (SELECT collaborator_id FROM manager_assignments WHERE manager_id = auth_user_id())
    );

-- SQUAD LEAD : Lecture des certificats de ses membres de squad
CREATE POLICY sl_read_certificates ON certificates 
    FOR SELECT USING (
        auth_user_role() = 'SQUAD_LEAD' AND 
        user_id IN (
            SELECT u.id FROM users u 
            JOIN squad_lead_assignments sla ON u.squad_id = sla.squad_id 
            WHERE sla.lead_id = auth_user_id()
        )
    );


-- ------------------------------------------------------------------------------
-- BLOC : RATINGS (Avis sur les certifications)
-- ------------------------------------------------------------------------------
CREATE POLICY read_all_ratings ON certification_ratings FOR SELECT USING (true);
CREATE POLICY collab_own_ratings ON certification_ratings FOR ALL USING (user_id = auth_user_id());


-- ------------------------------------------------------------------------------
-- BLOC : SUPPORT (Notifications & Audit Logs)
-- ------------------------------------------------------------------------------

-- Notifications
CREATE POLICY admin_all_notifications ON notifications FOR ALL USING (auth_user_role() = 'ADMIN');

CREATE POLICY user_own_notifications ON notifications FOR ALL USING (user_id = auth_user_id());

CREATE POLICY insert_notifications ON notifications FOR INSERT WITH CHECK (
    auth_user_role() IN ('ADMIN', 'CAREER_MANAGER', 'TRAINING_MANAGER', 'SQUAD_LEAD')
    OR user_id = auth_user_id()
);

-- Audit Logs
CREATE POLICY admin_read_audit ON audit_logs FOR SELECT USING (auth_user_role() = 'ADMIN');
CREATE POLICY insert_all_audit ON audit_logs FOR INSERT WITH CHECK (true);


-- ==============================================================================
-- 4. AUTOMATISATION DE L'AUDIT SUR LES ASSIGNATIONS (Dernier point)
-- ==============================================================================

-- Fonction Security Definer pour insérer l'audit (bypasse le RLS sur la table audit_logs)
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE
    v_entity_id UUID;
    v_changes JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_entity_id := OLD.id;
        v_changes := jsonb_build_object('deleted_data', to_jsonb(OLD));
    ELSIF TG_OP = 'INSERT' THEN
        v_entity_id := NEW.id;
        v_changes := jsonb_build_object('inserted_data', to_jsonb(NEW));
    ELSE -- UPDATE
        v_entity_id := NEW.id;
        v_changes := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
    END IF;

    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
    VALUES (auth_user_id(), TG_OP, TG_TABLE_NAME, v_entity_id, v_changes);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création du trigger d'audit sur les assignments
CREATE TRIGGER audit_assignments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();
