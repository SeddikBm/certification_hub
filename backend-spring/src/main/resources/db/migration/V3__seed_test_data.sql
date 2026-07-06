-- ==============================================================================
-- SCRIPT DE SEED (Jeu de données initial pour test RLS)
-- ==============================================================================

-- 1. Création des 5 Squads
INSERT INTO
    squads (
        id,
        name,
        description,
        color_hex
    )
VALUES (
        'a0000000-0000-0000-0000-000000000001',
        '.NET Squad',
        'Équipe .NET',
        '#5C2D91'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'Java Squad',
        'Équipe Java',
        '#E76F00'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'DevOps Squad',
        'Équipe DevOps',
        '#0078D4'
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        'Data Squad',
        'Équipe Data / AI',
        '#00A36C'
    ),
    (
        'a0000000-0000-0000-0000-000000000005',
        'QA-Testing',
        'Équipe Qualité',
        '#D13438'
    );

-- 2. Création des Utilisateurs (1 Admin + 3 Utilisateurs test)
INSERT INTO
    users (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        squad_id
    )
VALUES (
        'f1111111-1111-1111-1111-111111111111',
        'admin@devoteam.com',
        'fake_hash',
        'Super',
        'Admin',
        'ADMIN',
        NULL
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'cm@devoteam.com',
        'fake_hash',
        'Career',
        'Manager',
        'CAREER_MANAGER',
        NULL
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'lead@devoteam.com',
        'fake_hash',
        'Tech',
        'Lead',
        'SQUAD_LEAD',
        'a0000000-0000-0000-0000-000000000002'
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        'collab@devoteam.com',
        'fake_hash',
        'Jean',
        'Collaborateur',
        'COLLABORATOR',
        'a0000000-0000-0000-0000-000000000002'
    );

-- 3. Configuration de la Hiérarchie
-- Le CM gère le collaborateur
INSERT INTO
    manager_assignments (
        manager_id,
        collaborator_id,
        assigned_by_id
    )
VALUES (
        'f2222222-2222-2222-2222-222222222222',
        'f4444444-4444-4444-4444-444444444444',
        'f1111111-1111-1111-1111-111111111111'
    );
-- Le Lead gère la squad Java
INSERT INTO
    squad_lead_assignments (lead_id, squad_id)
VALUES (
        'f3333333-3333-3333-3333-333333333333',
        'a0000000-0000-0000-0000-000000000002'
    );

-- 4. Création de 10 Certifications
INSERT INTO
    certifications (
        id,
        code,
        name,
        provider,
        difficulty,
        priority
    )
VALUES (
        'c0000000-0000-0000-0000-000000000001',
        'AZ-900',
        'Azure Fundamentals',
        'Microsoft',
        'FOUNDATIONAL',
        'MANDATORY'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'AZ-204',
        'Developing Solutions for Azure',
        'Microsoft',
        'INTERMEDIATE',
        'HIGH'
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'AWS-CPE',
        'AWS Cloud Practitioner',
        'AWS',
        'FOUNDATIONAL',
        'MANDATORY'
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        'AWS-SAA',
        'AWS Solutions Architect',
        'AWS',
        'ADVANCED',
        'HIGH'
    ),
    (
        'c0000000-0000-0000-0000-000000000005',
        'CKA',
        'Certified Kubernetes Admin',
        'CNCF',
        'ADVANCED',
        'HIGH'
    ),
    (
        'c0000000-0000-0000-0000-000000000006',
        'CKAD',
        'Certified Kubernetes App Dev',
        'CNCF',
        'INTERMEDIATE',
        'NORMAL'
    ),
    (
        'c0000000-0000-0000-0000-000000000007',
        'DP-900',
        'Azure Data Fundamentals',
        'Microsoft',
        'FOUNDATIONAL',
        'NORMAL'
    ),
    (
        'c0000000-0000-0000-0000-000000000008',
        'AI-900',
        'Azure AI Fundamentals',
        'Microsoft',
        'FOUNDATIONAL',
        'NORMAL'
    ),
    (
        'c0000000-0000-0000-0000-000000000009',
        'PSM-I',
        'Professional Scrum Master I',
        'Scrum.org',
        'FOUNDATIONAL',
        'MANDATORY'
    ),
    (
        'c0000000-0000-0000-0000-000000000010',
        'ISTQB-F',
        'ISTQB Foundation Level',
        'ISTQB',
        'FOUNDATIONAL',
        'MANDATORY'
    );

-- 5. Création de 5 Formations
INSERT INTO
    trainings (
        id,
        title,
        type,
        provider,
        priority
    )
VALUES (
        'e0000000-0000-0000-0000-000000000001',
        'Clean Code Course',
        'UDEMY_BUSINESS',
        'Udemy',
        'OPTIONAL'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'DevSecOps Basics',
        'INTERNAL',
        'Devoteam',
        'MANDATORY'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Git Advanced',
        'UDEMY_BUSINESS',
        'Udemy',
        'OPTIONAL'
    ),
    (
        'e0000000-0000-0000-0000-000000000004',
        'Agile Mindset',
        'INTERNAL',
        'Devoteam',
        'MANDATORY'
    ),
    (
        'e0000000-0000-0000-0000-000000000005',
        'LangGraph & Agents',
        'EXTERNAL',
        'DeepLearning.AI',
        'OPTIONAL'
    );

-- 6. Création des Assignations (Pour tester les vues)
-- Assignation 1 : Pour le Collaborateur (Créée par l'Admin)
INSERT INTO
    assignments (
        id,
        item_type,
        item_id,
        user_id,
        assigned_by_user_id,
        status_certification
    )
VALUES (
        'b0000000-0000-0000-0000-000000000001',
        'CERTIFICATION',
        'c0000000-0000-0000-0000-000000000002',
        'f4444444-4444-4444-4444-444444444444',
        'f1111111-1111-1111-1111-111111111111',
        'IN_PROGRESS'
    );

-- Assignation 2 : Pour le Squad Lead
INSERT INTO
    assignments (
        id,
        item_type,
        item_id,
        user_id,
        assigned_by_user_id,
        status_certification
    )
VALUES (
        'b0000000-0000-0000-0000-000000000002',
        'CERTIFICATION',
        'c0000000-0000-0000-0000-000000000005',
        'f3333333-3333-3333-3333-333333333333',
        'f1111111-1111-1111-1111-111111111111',
        'PLANNED'
    );

-- Assignation 3 : Un autre collaborateur fictif (pour prouver que CM/Collab ne le voient pas)
INSERT INTO
    users (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role
    )
VALUES (
        'f9999999-9999-9999-9999-999999999999',
        'other@devoteam.com',
        'fake',
        'Other',
        'Guy',
        'COLLABORATOR'
    );

INSERT INTO
    assignments (
        id,
        item_type,
        item_id,
        user_id,
        status_certification
    )
VALUES (
        'b0000000-0000-0000-0000-000000000003',
        'CERTIFICATION',
        'c0000000-0000-0000-0000-000000000001',
        'f9999999-9999-9999-9999-999999999999',
        'COMPLETED'
    );