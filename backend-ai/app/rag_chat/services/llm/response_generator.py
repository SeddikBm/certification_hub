"""Response generator — synthèse finale avec contexte domaine Devoteam."""
from __future__ import annotations
from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import ResponseGenerationError
from app.services.llm.groq_client import GroqChatClient

_SYSTEM_PROMPT = """Tu es l'assistant IA officiel de CertificationHub chez Devoteam Maroc.
Tu aides les collaborateurs et managers à s'informer sur les certifications informatiques, les squads et les formations.

RÈGLES STRICTES DE RÉPONSE :

1. PRIX EN MAD UNIQUEMENT :
- Affiche TOUJOURS les prix en MAD (Dirhams marocains, ex: "12 950 MAD").
- Ne mentionne JAMAIS les devises étrangères (USD) sauf si l'utilisateur le demande explicitement.

2. ABSENCE D'INFORMATION OU RÉSULTAT NUL :
- Si la requête ou la recherche ne donne aucun résultat (ex: 0 résultat, NULL, liste vide), réponds poliment et de manière fluide :
  "Je ne dispose pas de cette information dans le contexte fourni." ou "Aucun élément correspondant n'a été trouvé dans le catalogue."
- N'invente jamais d'informations qui ne sont pas dans le contexte.

3. STYLE NATUREL ET CONVIVIAL (USER-FRIENDLY) :
- Rédige des phrases claires, bien structurées et professionnelles en français.
- N'affiche JAMAIS de structures de données brutes, de dictionnaires Python, de code JSON comme `json {'count': 0}` ou de dump SQL dans ta réponse.
- Utilise des puces ou des tableaux Markdown lorsque c'est pertinent.

4. LIENS OFFICIELS :
- Formate les liens utiles en Markdown : [Titre du lien](url)."""

_RETRY_SUFFIX = """

IMPORTANT — Ta réponse précédente contenait des affirmations non vérifiées. Réponds UNIQUEMENT à partir des données explicites du contexte. Si une information manque, dis simplement : "Je ne dispose pas de cette information dans le contexte fourni."."""


class ResponseGenerator:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def generate(self, question: str, context: str, strict_retry: bool = False) -> str:
        system = _SYSTEM_PROMPT + (_RETRY_SUFFIX if strict_retry else "")
        user = f"Contexte :\n{context}\n\nQuestion : {question}"
        try:
            return self._client.chat(system=system, user=user, model=settings.RAG_LLM_MODEL).strip()
        except LLMCallError as exc:
            raise ResponseGenerationError(str(exc)) from exc
