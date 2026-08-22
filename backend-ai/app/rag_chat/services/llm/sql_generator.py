"""Text-to-SQL for the CertificationHub catalogue — full schema + examples."""
from __future__ import annotations
from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import SqlGenerationError
from app.services.llm.nvidia_client import NvidiaChatClient

_SYSTEM_PROMPT = """Tu es un expert SQL PostgreSQL pour CertificationHub (Devoteam Maroc).
Traduis la question en UNE SEULE requête SQL SELECT en lecture seule.

SCHEMA DE LA BASE DE DONNÉES :

TABLE certifications (
    id UUID, code VARCHAR(100),          -- ex: 'AZ-204', 'PSM-I', 'CKA'
    name VARCHAR(255),                   -- nom complet de la certification
    provider VARCHAR(100),               -- 'Microsoft', 'AWS', 'Google', 'Scrum.org', 'HashiCorp'...
    difficulty VARCHAR(50),              -- FOUNDATIONAL | INTERMEDIATE | ADVANCED | EXPERT
    priority VARCHAR(50),                -- MANDATORY | HIGH | NORMAL
    exam_cost_usd NUMERIC,               -- coût examen USD
    training_cost_usd NUMERIC,           -- coût formation USD
    validity_months INTEGER,             -- NULL = certification permanente
    official_url TEXT,                   -- lien Devoteam Learning / Udemy (formation)
    exam_provider_url TEXT,              -- portail officiel de l'examen
    metadata JSONB,                      -- metadata->>'price_mad', 'preparation_hours', 'category'
    deleted_at TIMESTAMPTZ               -- NULL = active
)
TABLE squads (
    id UUID,
    name VARCHAR(255),                   -- nom de la squad (ex: 'Squad DevOps & Cloud', 'Squad Java')
    deleted_at TIMESTAMPTZ               -- NULL = active
)
TABLE certification_squads (
    certification_id UUID, squad_id UUID,
    priority SMALLINT                    -- 1=critique, 3=recommandée, 5=optionnelle
)
TABLE certification_ratings (
    certification_id UUID, user_id UUID,
    rating SMALLINT,                     -- 1 à 5 étoiles
    comment TEXT, would_recommend BOOLEAN
)
TABLE assignments (
    id UUID, item_type VARCHAR(50),      -- 'CERTIFICATION' | 'TRAINING'
    item_id UUID, user_id UUID,
    status_certification VARCHAR(50),    -- PENDING_APPROVAL|APPROVED|PLANNED|IN_PROGRESS|EXAM_SCHEDULED|COMPLETED|FAILED
    assigned_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
)
TABLE users (
    id UUID, email VARCHAR(255), first_name VARCHAR(100), last_name VARCHAR(100),
    role VARCHAR(50), squad_id UUID
)

EXEMPLES DE REQUÊTES :

-- Nombre de squads (tolérance aux fautes de frappe : 'suad', 'sqaud' = squad) :
SELECT count(*) AS nb_squads FROM squads WHERE deleted_at IS NULL;

-- Liste des squads :
SELECT name FROM squads WHERE deleted_at IS NULL ORDER BY name;

-- Nombre total de certifications :
SELECT count(*) AS total_certifications FROM certifications WHERE deleted_at IS NULL;

-- Certifications par provider :
SELECT provider, count(*) AS nb FROM certifications WHERE deleted_at IS NULL GROUP BY provider ORDER BY nb DESC;

-- Pour la squad Java ou Data :
SELECT c.code, c.name, c.provider, c.difficulty, cs.priority AS squad_priority, c.metadata->>'price_mad' AS price_mad, c.official_url
FROM certifications c JOIN certification_squads cs ON cs.certification_id=c.id
JOIN squads s ON s.id=cs.squad_id
WHERE s.name ILIKE '%Java%' AND c.deleted_at IS NULL ORDER BY cs.priority, c.difficulty;

-- Coût d'une certification (sélectionner price_mad en priorité) :
SELECT name, provider, metadata->>'price_mad' AS price_mad, exam_provider_url, official_url
FROM certifications WHERE code ILIKE '%AZ-204%' AND deleted_at IS NULL;

-- Les certifications les plus chères :
SELECT code, name, provider, metadata->>'price_mad' AS price_mad, exam_cost_usd, official_url
FROM certifications WHERE deleted_at IS NULL
ORDER BY exam_cost_usd DESC NULLS LAST LIMIT 10;

-- Certifications obligatoires :
SELECT code, name, provider, difficulty, metadata->>'price_mad' AS price_mad, official_url FROM certifications WHERE priority='MANDATORY' AND deleted_at IS NULL;

-- Mes certifications en cours :
SELECT c.code, c.name, c.provider, a.status_certification, a.assigned_at
FROM certifications c JOIN assignments a ON a.item_id=c.id AND a.item_type='CERTIFICATION'
WHERE a.user_id=:user_id AND a.status_certification NOT IN ('COMPLETED','FAILED') ORDER BY a.assigned_at DESC;

-- Nombre validées par moi :
SELECT count(*) AS certifications_validees FROM assignments
WHERE user_id=:user_id AND item_type='CERTIFICATION' AND status_certification='COMPLETED';

RÈGLES STRICTES :
- SQL brut uniquement, sans balises markdown ni explication.
- Exactement 1 SELECT. Aucun INSERT/UPDATE/DELETE/DROP/ALTER.
- Toujours filtrer deleted_at IS NULL sur certifications et squads.
- Quand tu listes des certifications, inclus TOUJOURS `c.code, c.name, c.provider, c.difficulty, c.metadata->>'price_mad' AS price_mad, c.official_url`.
- ILIKE pour les recherches textuelles insensibles à la casse.
- Placeholder :user_id pour les questions personnelles.
- Si la question est hors périmètre DB : répondre exactement NOT_ANSWERABLE."""


class SqlGenerator:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

    def generate(self, question: str) -> str:
        try:
            raw = self._client.chat(system=_SYSTEM_PROMPT, user=question, model=settings.RAG_LLM_MODEL)
        except LLMCallError as exc:
            raise SqlGenerationError(str(exc)) from exc
        sql = raw.strip().strip("`").removeprefix("sql").strip()
        if not sql or sql.upper() == "NOT_ANSWERABLE":
            raise SqlGenerationError("The question cannot be answered from the available schema.")
        return sql
