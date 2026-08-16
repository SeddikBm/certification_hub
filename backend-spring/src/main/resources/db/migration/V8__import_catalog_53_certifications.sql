-- ==============================================================================
-- IMPORT CATALOGUE : 53 CERTIFICATIONS, 5 SQUADS & LIAISONS UDEMY/OFFICIELLES
-- Généré automatiquement depuis Plan_Formation_IT_2025_2027_PRODUCTION_v1.0.xlsm
-- ==============================================================================

BEGIN;

-- 1. Création / Mise à jour des 5 Squads
INSERT INTO squads (id, name, description, color_hex)
VALUES ('a0000000-0000-0000-0000-000000000001', '.NET Squad', 'Équipe .NET', '#5C2D91')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    updated_at = NOW();
INSERT INTO squads (id, name, description, color_hex)
VALUES ('a0000000-0000-0000-0000-000000000002', 'Java Squad', 'Équipe Java', '#E76F00')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    updated_at = NOW();
INSERT INTO squads (id, name, description, color_hex)
VALUES ('a0000000-0000-0000-0000-000000000003', 'DevOps Squad', 'Équipe DevOps', '#0078D4')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    updated_at = NOW();
INSERT INTO squads (id, name, description, color_hex)
VALUES ('a0000000-0000-0000-0000-000000000004', 'Data Squad', 'Équipe Data / AI', '#00A36C')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    updated_at = NOW();
INSERT INTO squads (id, name, description, color_hex)
VALUES ('a0000000-0000-0000-0000-000000000005', 'QA-Testing', 'Équipe Qualité & Test', '#D13438')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    updated_at = NOW();

-- 2. Insertion / Mise à jour des 53 Certifications
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PSM-I',
    'Professional Scrum Master I',
    'Scrum.org',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    200.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/complete-agile-scrum-master-training-exam-simulator/',
    'https://www.scrum.org/assessments/professional-scrum-master-i-certification',
    '{"price_mad": 2000.0, "preparation_hours": 40, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PSPO-I',
    'Professional Scrum Product Owner I',
    'Scrum.org',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    200.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/product-owner-course/',
    'https://www.scrum.org/assessments/professional-scrum-product-owner-i-certification',
    '{"price_mad": 2000.0, "preparation_hours": 40, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SA',
    'SAFe 6 Agilist',
    'Scaled Agile',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    995.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/safe-agilist-6-leading-safe/',
    'https://scaledagile.com/training/leading-safe/',
    '{"price_mad": 9950.0, "preparation_hours": 16, "business_value": "HAUTE", "level": "Lead", "category": "RECOMMANDE", "version": "6.0", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'RTE',
    'SAFe Release Train Engineer',
    'Scaled Agile',
    'EXPERT'::cert_difficulty,
    'NORMAL'::cert_priority,
    1295.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/master-safe-60-release-train-engineer-safe-rte-essentials/',
    'https://scaledagile.com/training/safe-release-train-engineer/',
    '{"price_mad": 12950.0, "preparation_hours": 24, "business_value": "HAUTE", "level": "Expert", "category": "OPTIONNEL", "version": "6.0", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PAL-I',
    'Professional Agile Leadership',
    'Scrum.org',
    'ADVANCED'::cert_difficulty,
    'NORMAL'::cert_priority,
    200.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/the-ultimate-agile-leader-certification-training/',
    'https://www.scrum.org/assessments/professional-agile-leadership-certification',
    '{"price_mad": 2000.0, "preparation_hours": 16, "business_value": "HAUTE", "level": "Manager", "category": "OPTIONNEL", "version": "2024", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'ITIL4-F',
    'ITIL 4 Foundation',
    'PeopleCert / Axelos',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    383.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/service-management-itil-4/',
    'https://www.axelos.com/certifications/itil-service-management/itil-4-foundation',
    '{"price_mad": 3830.0, "preparation_hours": 20, "business_value": "MOYENNE", "level": "Senior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "Agile", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'OCP-21',
    'Oracle Certified Professional: Java SE 21 Developer',
    'Oracle',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    245.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/ocp11_from_oca8/',
    'https://education.oracle.com/oracle-certified-professional-java-se-17-developer/trackp_OCPJSE17',
    '{"price_mad": 2450.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Java", "squads_affected": "Java"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SPRING-PRO',
    'Spring Professional Certification',
    'VMware / Broadcom',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    250.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/open-badges/1435269161',
    'https://spring.io/certifications',
    '{"price_mad": 2500.0, "preparation_hours": 100, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "v6.1", "squad_domain": "Java", "squads_affected": "Java"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AZ-900',
    'Microsoft Azure Fundamentals',
    'Microsoft',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    99.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/az900-azure/',
    'https://learn.microsoft.com/certifications/azure-fundamentals/',
    '{"price_mad": 990.0, "preparation_hours": 20, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": ".NET", "squads_affected": ".NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AZ-204',
    'Microsoft Azure Developer Associate',
    'Microsoft',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/70532-azure/',
    'https://learn.microsoft.com/certifications/azure-developer/',
    '{"price_mad": 1650.0, "preparation_hours": 60, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": ".NET", "squads_affected": ".NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AZ-104',
    'Microsoft Azure Administrator Associate',
    'Microsoft',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/70533-azure/',
    'https://learn.microsoft.com/certifications/azure-administrator/',
    '{"price_mad": 1650.0, "preparation_hours": 50, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": ".NET", "squads_affected": ".NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AZ-305',
    'Microsoft Azure Solutions Architect Expert',
    'Microsoft',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/az301-azure/',
    'https://learn.microsoft.com/certifications/azure-solutions-architect/',
    '{"price_mad": 1650.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Lead", "category": "RECOMMANDE", "version": "2024", "squad_domain": ".NET", "squads_affected": ".NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AZ-400',
    'Microsoft DevOps Engineer Expert',
    'Microsoft',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/azure100/',
    'https://learn.microsoft.com/certifications/devops-engineer/',
    '{"price_mad": 1650.0, "preparation_hours": 70, "business_value": "HAUTE", "level": "Lead", "category": "RECOMMANDE", "version": "2024", "squad_domain": ".NET", "squads_affected": ".NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'VCP-DCV',
    'VMware Certified Professional - DCV',
    'VMware',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    250.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/vsphere8vcp/',
    'https://www.vmware.com/learning/certification/vcp-dcv.html',
    '{"price_mad": 2500.0, "preparation_hours": 100, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'RHCSA',
    'Red Hat Certified System Administrator',
    'Red Hat',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    500.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/unofficial-linux-redhat-certified-system-administrator-rhcsa/',
    'https://www.redhat.com/en/services/certification/rhcsa',
    '{"price_mad": 5000.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "EX200", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'RHCE',
    'Red Hat Certified Engineer',
    'Red Hat',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    500.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/linux-red-hat-certified-engineer-rhce-ex294/',
    'https://www.redhat.com/en/services/certification/rhce',
    '{"price_mad": 5000.0, "preparation_hours": 100, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "EX294", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'LFCS',
    'Linux Foundation Certified System Administrator',
    'Linux Foundation',
    'FOUNDATIONAL'::cert_difficulty,
    'HIGH'::cert_priority,
    445.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/linux-foundation-certified-systems-administrator-lfcs/',
    'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/',
    '{"price_mad": 4450.0, "preparation_hours": 60, "business_value": "MOYENNE", "level": "Junior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'GITLAB-PROF',
    'GitLab Certified CI/CD Professional',
    'GitLab',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    650.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/gitlab-ci-pipelines-ci-cd-and-devops-for-beginners/',
    'https://about.gitlab.com/services/education/gitlab-cicd-associate/',
    '{"price_mad": 6500.0, "preparation_hours": 40, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CJE',
    'Jenkins Engineer',
    'CloudBees',
    'INTERMEDIATE'::cert_difficulty,
    'NORMAL'::cert_priority,
    150.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/jenkins-from-zero-to-hero/',
    'https://www.cloudbees.com/jenkins/certification',
    '{"price_mad": 1500.0, "preparation_hours": 50, "business_value": "MOYENNE", "level": "Senior", "category": "OPTIONNEL", "version": "2024", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PCA',
    'Prometheus Certified Associate',
    'CNCF',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    250.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/prometheus-course/',
    'https://training.linuxfoundation.org/certification/prometheus-certified-associate/',
    '{"price_mad": 2500.0, "preparation_hours": 40, "business_value": "MOYENNE", "level": "Senior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CCNA',
    'Cisco CCNA',
    'Cisco',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    300.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/ccna-complete/',
    'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html',
    '{"price_mad": 3000.0, "preparation_hours": 120, "business_value": "MOYENNE", "level": "Senior", "category": "RECOMMANDE", "version": "200-301", "squad_domain": "DevOps", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CKAD',
    'Certified Kubernetes Application Developer',
    'CNCF',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    445.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/certified-kubernetes-application-developer/',
    'https://www.cncf.io/certification/ckad/',
    '{"price_mad": 4450.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "1.29", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CKA',
    'Certified Kubernetes Administrator',
    'CNCF',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    445.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/',
    'https://www.cncf.io/certification/cka/',
    '{"price_mad": 4450.0, "preparation_hours": 100, "business_value": "HAUTE", "level": "Lead", "category": "RECOMMANDE", "version": "1.29", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CKS',
    'Certified Kubernetes Security Specialist',
    'CNCF',
    'EXPERT'::cert_difficulty,
    'NORMAL'::cert_priority,
    445.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/certified-kubernetes-security-specialist-certification/',
    'https://www.cncf.io/certification/cks/',
    '{"price_mad": 4450.0, "preparation_hours": 120, "business_value": "HAUTE", "level": "Expert", "category": "OPTIONNEL", "version": "1.29", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'TERRAFORM-003',
    'HashiCorp Terraform Associate',
    'HashiCorp',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    70.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/terraform-beginner-to-advanced/',
    'https://www.hashicorp.com/certification/terraform-associate',
    '{"price_mad": 700.0, "preparation_hours": 50, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "003", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SAA-C03',
    'AWS Solutions Architect Associate',
    'AWS',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    150.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
    'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    '{"price_mad": 1500.0, "preparation_hours": 60, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "C03", "squad_domain": "Cloud", "squads_affected": "DevOps, Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SAP-C02',
    'AWS Solutions Architect Professional',
    'AWS',
    'EXPERT'::cert_difficulty,
    'NORMAL'::cert_priority,
    300.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/aws-solutions-architect-professional/',
    'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
    '{"price_mad": 3000.0, "preparation_hours": 150, "business_value": "HAUTE", "level": "Expert", "category": "OPTIONNEL", "version": "C02", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'DVA-C02',
    'AWS Developer Associate',
    'AWS',
    'INTERMEDIATE'::cert_difficulty,
    'NORMAL'::cert_priority,
    150.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/aws-certified-developer-associate-dva-c01/',
    'https://aws.amazon.com/certification/certified-developer-associate/',
    '{"price_mad": 1500.0, "preparation_hours": 50, "business_value": "MOYENNE", "level": "Senior", "category": "OPTIONNEL", "version": "C02", "squad_domain": "Cloud", "squads_affected": "DevOps, .NET, Java"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'ACE',
    'Google Cloud Associate Engineer',
    'Google Cloud',
    'INTERMEDIATE'::cert_difficulty,
    'NORMAL'::cert_priority,
    125.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/google-cloud-associate-engineer/',
    'https://cloud.google.com/certification/cloud-engineer',
    '{"price_mad": 1250.0, "preparation_hours": 50, "business_value": "MOYENNE", "level": "Senior", "category": "OPTIONNEL", "version": "2024", "squad_domain": "Cloud", "squads_affected": "DevOps"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'TOGAF-10',
    'TOGAF 10 Enterprise Architecture Foundation',
    'The Open Group',
    'EXPERT'::cert_difficulty,
    'NORMAL'::cert_priority,
    595.00,
    0.00,
    60,
    'http://devoteamlearning.udemy.com/course/togaf-10-ea-foundation/',
    'https://www.opengroup.org/certifications/togaf',
    '{"price_mad": 5950.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Expert", "category": "OPTIONNEL", "version": "10", "squad_domain": "Architecture", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AI-900',
    'Microsoft Azure AI Fundamentals',
    'Microsoft',
    'FOUNDATIONAL'::cert_difficulty,
    'HIGH'::cert_priority,
    99.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/ai900-azure/',
    'https://learn.microsoft.com/certifications/azure-ai-fundamentals/',
    '{"price_mad": 990.0, "preparation_hours": 20, "business_value": "HAUTE", "level": "Junior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "IA", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'AI-102',
    'Microsoft Azure AI Engineer Associate',
    'Microsoft',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/ai102-azure/',
    'https://learn.microsoft.com/certifications/azure-ai-engineer/',
    '{"price_mad": 1650.0, "preparation_hours": 60, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "IA", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SY0-701',
    'CompTIA Security+',
    'CompTIA',
    'FOUNDATIONAL'::cert_difficulty,
    'NORMAL'::cert_priority,
    425.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/securityplus/',
    'https://www.comptia.org/certifications/security',
    '{"price_mad": 4250.0, "preparation_hours": 50, "business_value": "HAUTE", "level": "Junior", "category": "OPTIONNEL", "version": "2024", "squad_domain": "Securite", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CEH',
    'Certified Ethical Hacker',
    'EC-Council',
    'ADVANCED'::cert_difficulty,
    'NORMAL'::cert_priority,
    950.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/ceh-practical-complete-course-exam/',
    'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/',
    '{"price_mad": 9500.0, "preparation_hours": 100, "business_value": "MOYENNE", "level": "Lead", "category": "OPTIONNEL", "version": "v13", "squad_domain": "Securite", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PMP',
    'Project Management Professional',
    'PMI',
    'ADVANCED'::cert_difficulty,
    'NORMAL'::cert_priority,
    555.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/pmp-certification-exam-prep-course-pmbok-6th-edition/',
    'https://www.pmi.org/certifications/project-management-pmp',
    '{"price_mad": 5550.0, "preparation_hours": 100, "business_value": "HAUTE", "level": "Manager", "category": "OPTIONNEL", "version": "7th Ed", "squad_domain": "Management", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'PRINCE2-P',
    'Prince2 Practitioner',
    'PeopleCert / Axelos',
    'ADVANCED'::cert_difficulty,
    'NORMAL'::cert_priority,
    400.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/intro-project-management/',
    'https://www.axelos.com/certifications/propath/prince2-project-management/prince2-practitioner',
    '{"price_mad": 4000.0, "preparation_hours": 40, "business_value": "MOYENNE", "level": "Manager", "category": "OPTIONNEL", "version": "2023", "squad_domain": "Management", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CSM',
    'Certified ScrumMaster',
    'Scrum Alliance',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    995.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/scrumrealworld/',
    'https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster',
    '{"price_mad": 9950.0, "preparation_hours": 16, "business_value": "HAUTE", "level": "Manager", "category": "RECOMMANDE", "version": "2024", "squad_domain": "Management", "squads_affected": "Tous"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'DCEA',
    'Databricks Certified Data Engineer Associate',
    'Databricks',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    200.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/databricks-certified-data-engineer-associate/',
    'https://www.databricks.com/learn/certification/data-engineer-associate',
    '{"price_mad": 2000.0, "preparation_hours": 60, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CCDAK',
    'Confluent Certified Developer for Apache Kafka',
    'Confluent',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    150.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/apache-kafka/',
    'https://www.confluent.io/certification/',
    '{"price_mad": 1500.0, "preparation_hours": 50, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CCAAK',
    'Confluent Certified Administrator for Apache Kafka',
    'Confluent',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    150.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/apache-kafka/',
    'https://www.confluent.io/certification/',
    '{"price_mad": 1500.0, "preparation_hours": 45, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CDP-0011',
    'Cloudera Data Platform Generalist',
    'Cloudera',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    295.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/cloudera-hadoop-training/',
    'https://www.cloudera.com/about/training/certification.html',
    '{"price_mad": 2950.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CAOP',
    'Cloudera Administrator on premises',
    'Cloudera',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    295.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/cloudera-hadoop-training/',
    'https://www.cloudera.com/about/training/certification.html',
    '{"price_mad": 2950.0, "preparation_hours": 70, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CDE',
    'Cloudera Data Engineer',
    'Cloudera',
    'ADVANCED'::cert_difficulty,
    'MANDATORY'::cert_priority,
    400.00,
    0.00,
    24,
    'https://devoteamlearning.udemy.com/course/cloudera-hadoop-training/',
    'https://www.cloudera.com/about/training/certification.html',
    '{"price_mad": 4000.0, "preparation_hours": 90, "business_value": "HAUTE", "level": "Lead", "category": "OBLIGATOIRE", "version": "2024", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'DAS-C01',
    'AWS Certified Data Engineer – Associate',
    'AWS',
    'ADVANCED'::cert_difficulty,
    'HIGH'::cert_priority,
    150.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/aws-data-analytics/',
    'https://aws.amazon.com/certification/certified-data-engineer-associate/',
    '{"price_mad": 1500.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Lead", "category": "RECOMMANDE", "version": "C01", "squad_domain": "Data", "squads_affected": "Data"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'DP-203',
    'Azure Data Engineer Associate',
    'Microsoft',
    'INTERMEDIATE'::cert_difficulty,
    'NORMAL'::cert_priority,
    165.00,
    0.00,
    12,
    'https://devoteamlearning.udemy.com/course/data-engineering-on-microsoft-azure/',
    'https://learn.microsoft.com/certifications/azure-data-engineer/',
    '{"price_mad": 1650.0, "preparation_hours": 70, "business_value": "HAUTE", "level": "Senior", "category": "OPTIONNEL", "version": "2024", "squad_domain": "Data", "squads_affected": "Data, .NET"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CTFL',
    'ISTQB Certified Tester Foundation Level',
    'ISTQB',
    'FOUNDATIONAL'::cert_difficulty,
    'MANDATORY'::cert_priority,
    229.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/istqb-foundation-training/',
    'https://www.istqb.org/certifications/certified-tester-foundation-level',
    '{"price_mad": 2290.0, "preparation_hours": 40, "business_value": "HAUTE", "level": "Junior", "category": "OBLIGATOIRE", "version": "v4.0", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CT-TAE',
    'ISTQB Test Automation Engineer',
    'ISTQB',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    249.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/istqb-test-automation-engineer/',
    'https://www.istqb.org/certifications/test-automation-engineer',
    '{"price_mad": 2490.0, "preparation_hours": 50, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "v1.0", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'SELENIUM',
    'Selenium WebDriver with Java',
    'Selenium',
    'INTERMEDIATE'::cert_difficulty,
    'MANDATORY'::cert_priority,
    0.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/selenium-real-time-examplesinterview-questions/',
    'https://www.selenium.dev/',
    '{"price_mad": 0.0, "preparation_hours": 60, "business_value": "HAUTE", "level": "Senior", "category": "OBLIGATOIRE", "version": "4.x", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CT-AT',
    'ISTQB Agile Tester',
    'ISTQB',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    199.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/istqb-agile-tester-certification/',
    'https://www.istqb.org/certifications/agile-tester',
    '{"price_mad": 1990.0, "preparation_hours": 30, "business_value": "HAUTE", "level": "Senior", "category": "RECOMMANDE", "version": "v2014", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CYPRESS',
    'Cypress End-to-End Testing',
    'Cypress',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    0.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/cypress-io-master-class/',
    'https://www.cypress.io/',
    '{"price_mad": 0.0, "preparation_hours": 40, "business_value": "MOYENNE", "level": "Senior", "category": "RECOMMANDE", "version": "v13", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'POSTMAN',
    'Postman API Testing',
    'Postman',
    'FOUNDATIONAL'::cert_difficulty,
    'HIGH'::cert_priority,
    0.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/postman-the-complete-guide/',
    'https://www.postman.com/',
    '{"price_mad": 0.0, "preparation_hours": 20, "business_value": "MOYENNE", "level": "Junior", "category": "RECOMMANDE", "version": "2024", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'JMETER',
    'Apache JMeter Performance Testing',
    'Apache',
    'INTERMEDIATE'::cert_difficulty,
    'HIGH'::cert_priority,
    0.00,
    0.00,
    NULL,
    'https://devoteamlearning.udemy.com/course/learn-jmeter-from-scratch-performance-load-testing-tool/',
    'https://jmeter.apache.org/',
    '{"price_mad": 0.0, "preparation_hours": 30, "business_value": "MOYENNE", "level": "Senior", "category": "RECOMMANDE", "version": "5.x", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();
INSERT INTO certifications (
    code, name, provider, difficulty, priority,
    exam_cost_usd, training_cost_usd, validity_months,
    official_url, exam_provider_url, metadata
)
VALUES (
    'CTAL-TM',
    'ISTQB Advanced Level Test Manager',
    'ISTQB',
    'ADVANCED'::cert_difficulty,
    'NORMAL'::cert_priority,
    249.00,
    0.00,
    36,
    'https://devoteamlearning.udemy.com/course/istqb-advanced-test-manager/',
    'https://www.istqb.org/certifications/test-manager',
    '{"price_mad": 2490.0, "preparation_hours": 80, "business_value": "HAUTE", "level": "Lead", "category": "OPTIONNEL", "version": "v2012", "squad_domain": "QA-Testing", "squads_affected": "QA-Testing"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    difficulty = EXCLUDED.difficulty,
    priority = EXCLUDED.priority,
    exam_cost_usd = EXCLUDED.exam_cost_usd,
    validity_months = EXCLUDED.validity_months,
    official_url = EXCLUDED.official_url,
    exam_provider_url = EXCLUDED.exam_provider_url,
    metadata = EXCLUDED.metadata,
    deleted_at = NULL,
    updated_at = NOW();

-- 3. Liaisons certification_squads
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 1
FROM certifications c
WHERE c.code = 'PSM-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 1
FROM certifications c
WHERE c.code = 'PSM-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 1
FROM certifications c
WHERE c.code = 'PSM-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'PSM-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 1
FROM certifications c
WHERE c.code = 'PSM-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'PSPO-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'PSPO-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'PSPO-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'PSPO-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'PSPO-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'SA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'SA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'SA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'SA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'SA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'RTE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'RTE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'RTE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'RTE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'RTE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'PAL-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'PAL-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'PAL-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'PAL-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'PAL-I'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'ITIL4-F'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'ITIL4-F'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'ITIL4-F'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'ITIL4-F'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'ITIL4-F'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 1
FROM certifications c
WHERE c.code = 'OCP-21'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 1
FROM certifications c
WHERE c.code = 'SPRING-PRO'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 1
FROM certifications c
WHERE c.code = 'AZ-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 1
FROM certifications c
WHERE c.code = 'AZ-204'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 1
FROM certifications c
WHERE c.code = 'AZ-104'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'AZ-305'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'AZ-400'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 1
FROM certifications c
WHERE c.code = 'VCP-DCV'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 1
FROM certifications c
WHERE c.code = 'RHCSA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'RHCE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'LFCS'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 1
FROM certifications c
WHERE c.code = 'GITLAB-PROF'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'CJE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'PCA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'CCNA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 1
FROM certifications c
WHERE c.code = 'CKAD'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'CKA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'CKS'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'TERRAFORM-003'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'SAA-C03'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'SAA-C03'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'SAP-C02'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'DVA-C02'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'DVA-C02'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'DVA-C02'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'ACE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'TOGAF-10'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'TOGAF-10'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'TOGAF-10'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'TOGAF-10'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'TOGAF-10'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-900'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-102'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-102'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-102'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-102'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'AI-102'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'SY0-701'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'SY0-701'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'SY0-701'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'SY0-701'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'SY0-701'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'CEH'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'CEH'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'CEH'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'CEH'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'CEH'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'PMP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'PMP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'PMP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'PMP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'PMP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'PRINCE2-P'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 5
FROM certifications c
WHERE c.code = 'PRINCE2-P'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 5
FROM certifications c
WHERE c.code = 'PRINCE2-P'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'PRINCE2-P'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'PRINCE2-P'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 3
FROM certifications c
WHERE c.code = 'CSM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000002'::uuid, 3
FROM certifications c
WHERE c.code = 'CSM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000003'::uuid, 3
FROM certifications c
WHERE c.code = 'CSM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'CSM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'CSM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'DCEA'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'CCDAK'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'CCAAK'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'CDP-0011'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'CAOP'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 1
FROM certifications c
WHERE c.code = 'CDE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 3
FROM certifications c
WHERE c.code = 'DAS-C01'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000004'::uuid, 5
FROM certifications c
WHERE c.code = 'DP-203'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000001'::uuid, 5
FROM certifications c
WHERE c.code = 'DP-203'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 1
FROM certifications c
WHERE c.code = 'CTFL'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 1
FROM certifications c
WHERE c.code = 'CT-TAE'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 1
FROM certifications c
WHERE c.code = 'SELENIUM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'CT-AT'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'CYPRESS'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'POSTMAN'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 3
FROM certifications c
WHERE c.code = 'JMETER'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;
INSERT INTO certification_squads (certification_id, squad_id, priority)
SELECT c.id, 'a0000000-0000-0000-0000-000000000005'::uuid, 5
FROM certifications c
WHERE c.code = 'CTAL-TM'
ON CONFLICT (certification_id, squad_id) DO UPDATE SET
    priority = EXCLUDED.priority;

COMMIT;
