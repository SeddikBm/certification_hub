-- ==============================================================================
-- PRÉREQUIS POUR TESTER LE RLS
-- ==============================================================================
-- L'utilisateur par défaut 'certif_user' est un Superuser (BYPASSRLS).
-- Par conséquent, PostgreSQL ignore complètement le Row Level Security pour lui !
-- Pour tester correctement, nous devons exécuter ces requêtes avec un rôle normal :

RESET ROLE;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_rls_user') THEN
    CREATE ROLE test_rls_user NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO test_rls_user;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO test_rls_user;

-- On bascule la session sur ce rôle normal pour activer le RLS
SET ROLE test_rls_user;
-- ==============================================================================

-- On simule la connexion de l'ADMIN
SET app.current_user_id = 'f1111111-1111-1111-1111-111111111111';

-- L'admin interroge les assignations
SELECT id, user_id, status_certification FROM assignments;
-- RÉSULTAT ATTENDU : 3 lignes (Il voit l'assignation du Collab, du Lead, et de l'Autre)

-- On simule la connexion du COLLABORATEUR (Jean)
SET app.current_user_id = 'f4444444-4444-4444-4444-444444444444';

-- Le collaborateur interroge les assignations
SELECT id, user_id, status_certification FROM assignments;
-- RÉSULTAT ATTENDU : 1 seule ligne (Celle avec user_id = u4444444... (Jean))

-- On simule la connexion du CAREER MANAGER
SET app.current_user_id = 'f2222222-2222-2222-2222-222222222222';

-- Le CM interroge les assignations
SELECT id, user_id, status_certification FROM assignments;
-- RÉSULTAT ATTENDU : 1 ligne (Celle de Jean, car le CM est relié à Jean via manager_assignments)
-- Il ne voit PAS l'assignation du Squad Lead, ni celle du gars "Other".

-- On simule la connexion du SQUAD LEAD
SET app.current_user_id = 'f3333333-3333-3333-3333-333333333333';

-- Le Squad Lead interroge les assignations
SELECT id, user_id, status_certification FROM assignments;
-- RÉSULTAT ATTENDU : 2 lignes (La sienne, et celle de Jean car Jean est dans la squad Java a0000000-0000-0000-0000-000000000002 gérée par ce Lead).

RESET app.current_user_id;