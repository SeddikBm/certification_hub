-- ==============================================================================
-- V5 : Correction du typo dans la fonction auth_user_role()
-- Le nom de colonne était 'rôle' (avec accent) au lieu de 'role'
-- Ce bug rendait TOUTES les politiques RLS inopérantes car
-- auth_user_role() retournait toujours NULL
-- ==============================================================================

CREATE OR REPLACE FUNCTION auth_user_role() RETURNS text AS $$
DECLARE
    v_role text;
BEGIN
    SELECT role::text INTO v_role FROM users WHERE id = auth_user_id();
    RETURN v_role;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
