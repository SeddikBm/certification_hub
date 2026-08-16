"""
Text-to-SQL generation.

Deliberately dumb and narrow: this only turns natural language into a
candidate SQL string. It has NO authority to decide what's safe to run —
that's exclusively app.rag_chat.services.sql.guardrail's job, called right
after this in text_to_sql_node. Splitting generation from validation this
way means the guardrail's logic doesn't change no matter how the prompt
here evolves.
"""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import SqlGenerationError
from app.services.llm.groq_client import GroqChatClient

_SYSTEM_PROMPT = """Tu es un expert SQL PostgreSQL pour la plateforme CertificationHub.
Tu traduis une question en une SEULE requête SQL SELECT en lecture seule.

Schéma de la base de données PostgreSQL (utilise UNIQUEMENT ces tables et colonnes) :
- certifications (
    id UUID, 
    code VARCHAR(100), 
    name VARCHAR(255), 
    provider VARCHAR(100), 
    difficulty VARCHAR(50), -- 'FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
    priority VARCHAR(50),   -- 'MANDATORY', 'HIGH', 'NORMAL'
    exam_cost_usd NUMERIC, 
    training_cost_usd NUMERIC, 
    validity_months INTEGER, -- NULL si permanente
    official_url TEXT, 
    exam_provider_url TEXT,
    metadata JSONB -- ex: metadata->>'price_mad', metadata->>'preparation_hours', metadata->>'business_value'
  )
- squads (id UUID, name VARCHAR(255), description TEXT, color_hex VARCHAR(7))
- certification_squads (certification_id UUID, squad_id UUID, priority SMALLINT) -- priority: 1 (P1), 3 (P3), 5 (P5)
- certification_ratings (certification_id UUID, user_id UUID, rating SMALLINT, comment TEXT, would_recommend BOOLEAN)
- assignments (
    id UUID, 
    item_type VARCHAR(50), -- 'CERTIFICATION', 'TRAINING'
    item_id UUID, -- référence certifications(id) quand item_type='CERTIFICATION'
    user_id UUID, 
    status_certification VARCHAR(50), -- 'PENDING_APPROVAL', 'APPROVED', 'PLANNED', 'IN_PROGRESS', 'EXAM_SCHEDULED', 'COMPLETED', 'FAILED'
    assigned_at TIMESTAMPTZ, 
    completed_at TIMESTAMPTZ
  )
- users (id UUID, email VARCHAR(255), first_name VARCHAR(100), last_name VARCHAR(100), role VARCHAR(50), squad_id UUID)

Règles strictes :
- Renvoie UNIQUEMENT la requête SQL brute, sans balises markdown ```sql, sans explication.
- Exactement UN seul SELECT. Aucun INSERT/UPDATE/DELETE/DROP/ALTER.
- Fais des jointures appropriées (ex: INNER JOIN certification_squads cs ON c.id = cs.certification_id INNER JOIN squads s ON s.id = cs.squad_id).
- Si la question porte sur les certifications de l'utilisateur connecté ("mes certifications", "combien j'ai validé"), fais une jointure sur assignments (a.item_type = 'CERTIFICATION' AND a.item_id = c.id) avec filtre a.user_id = :user_id.
- Utilise ILIKE pour les recherches textuelles insensibles à la casse (ex: provider ILIKE '%AWS%' ou name ILIKE '%Scrum%').
- Si la question est purement pédagogique/théorique et ne peut pas être répondue par des données SQL, renvoie exactement: NOT_ANSWERABLE
"""


class SqlGenerator:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def generate(self, question: str) -> str:
        try:
            raw = self._client.chat(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
        except LLMCallError as exc:
            raise SqlGenerationError(str(exc)) from exc

        sql = raw.strip().strip("`").removeprefix("sql").strip()
        if not sql or sql.upper() == "NOT_ANSWERABLE":
            raise SqlGenerationError("The question cannot be answered from the available schema.")
        return sql
