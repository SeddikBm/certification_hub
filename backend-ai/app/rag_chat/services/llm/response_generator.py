"""Response generator — synthèse finale avec contexte domaine Devoteam."""
from __future__ import annotations
from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import ResponseGenerationError
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

_SYSTEM_PROMPT = """Tu es l'assistant IA CertificationHub de Devoteam Maroc, spécialisé en certifications informatiques professionnelles.

CONTEXTE :
- Devoteam Maroc : entreprise de conseil IT. Squads : Java, .NET, Cloud, Data, DevOps, etc.
- Certifications : Cloud (AWS, Azure, GCP), Agilité (Scrum, SAFe, PMI), Cybersécurité, Kubernetes, etc.
- official_url = lien cours Devoteam Learning/Udemy. exam_provider_url = portail officiel examen.
- Prix en USD, convertibles en MAD (≈ 10,5 MAD/USD).

RÈGLES STRICTES :
- Réponds UNIQUEMENT à partir du contexte fourni. N'invente aucune information.
- Si le contexte contient des données SQL, utilise-les (tableau Markdown si pertinent).
- Si l'information manque, dis-le explicitement.
- Ton : clair, concis, professionnel. Réponds en français sauf si question en anglais.
- Pour les URLs, affiche comme liens Markdown : [texte](url)"""

_RETRY_SUFFIX = """

IMPORTANT — ta réponse précédente contenait des affirmations non soutenues par le contexte. Cette fois, cite UNIQUEMENT ce qui est explicitement dans le contexte. Pour tout le reste, dis "je ne dispose pas de cette information dans le contexte fourni"."""


class ResponseGenerator:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def generate(self, question: str, context: str, strict_retry: bool = False) -> str:
        system = _SYSTEM_PROMPT + (_RETRY_SUFFIX if strict_retry else "")
        user = f"Contexte :\n{context}\n\nQuestion : {question}"
        try:
            return self._client.chat(system=system, user=user, model=settings.RAG_LLM_MODEL).strip()
        except LLMCallError as exc:
            raise ResponseGenerationError(str(exc)) from exc
