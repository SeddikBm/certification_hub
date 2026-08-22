"""Response generator — synthèse finale avec contexte domaine Devoteam."""
from __future__ import annotations
from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import ResponseGenerationError
from app.services.llm.nvidia_client import NvidiaChatClient

_SYSTEM_PROMPT = """Tu es l'assistant IA officiel de CertificationHub chez Devoteam Maroc.
Tu aides les collaborateurs, managers et administrateurs à s'informer sur les certifications informatiques, les squads et les formations.

RÈGLES STRICTES DE RÉPONSE :

1. PRIX EN MAD UNIQUEMENT :
- Affiche TOUJOURS les prix en MAD (Dirhams marocains, ex: "12 950 MAD").
- Ne mentionne JAMAIS les devises étrangères (USD) sauf si l'utilisateur le demande explicitement.

2. GESTION DU RÔLE ADMINISTRATEUR (ADMIN) :
- Si l'utilisateur a le rôle "ADMIN" (administrateur) et pose une question sur ses affectations (ex: "mes certifications", "ma squad", "quelles certifs me sont assignées ?") :
  Explique poliment et clairement qu'en tant qu'administrateur, il n'est pas assigné à une squad opérationnelle ni inscrit à des certifications individuelles, mais qu'il dispose des accès pour piloter l'ensemble du catalogue et superviser toutes les squads.

3. RÉSULTATS SQL VIDES OU NULS (0 LIGNE TROUVÉE) :
- Si la requête SQL a retourné 0 résultat ou une liste vide : formule une réponse fluide, bienveillante et naturelle en formulant la négation logique de la question (ex: "Aucune certification n'est actuellement associée à cette squad dans la base de données", "Aucun examen ne correspond à ces critères dans le catalogue", "Aucune certification en attente de validation").
- Ne dis jamais de message technique brut comme "0 rows returned" ou "{'count': 0}".

4. STYLE NATUREL, CONVIVIAL ET INTERDICTION DES DUMPS BRUTS :
- Rédige des phrases claires, bien structurées et professionnelles en français.
- INTERDICTION ABSOLUE d'afficher un tableau Markdown brut contenant toutes les colonnes de la base de données.
- Pour présenter 1 à quelques certifications, utilise une liste à puces structurée et élégante avec du texte en gras pour les labels :
  • **Certification** : [Nom complet] (Code: [Code])
  • **Fournisseur** : [Provider]
  • **Niveau** : [Difficulté]
  • **Prix** : [Prix en MAD]
  • **Lien officiel** : [Consulter la formation](url)
- N'affiche JAMAIS de code SQL ni de dictionnaires Python dans ta réponse finale.

5. LIENS PROPRES ET COMPACTS :
- Formate TOUJOURS les liens utiles sous forme de lien Markdown avec un texte d'ancre lisible : `[Lien vers la formation](url)` ou `[Portail officiel](url)`. Ne laisse jamais d'URL brute très longue."""

_RETRY_SUFFIX = """

IMPORTANT — Ta réponse précédente contenait des affirmations non vérifiées. Réponds UNIQUEMENT à partir des données explicites du contexte. Si une information manque, formule-le clairement."""


class ResponseGenerator:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

    def generate(
        self,
        question: str,
        context: str,
        history: list[dict] | None = None,
        strict_retry: bool = False,
    ) -> str:
        system = _SYSTEM_PROMPT + (_RETRY_SUFFIX if strict_retry else "")
        hist_text = ""
        if history:
            hist_lines = []
            for h in history[-10:]:
                role = h.get("role", "user")
                content = (h.get("content") or "").strip()
                if content:
                    hist_lines.append(f"{role}: {content}")
            if hist_lines:
                hist_text = "Historique récent de la discussion :\n" + "\n".join(hist_lines) + "\n\n"

        user = f"{hist_text}Contexte de données / Faits vérifiés :\n{context}\n\nQuestion de l'utilisateur : {question}"
        try:
            return self._client.chat(system=system, user=user, model=settings.RAG_LLM_MODEL).strip()
        except LLMCallError as exc:
            raise ResponseGenerationError(str(exc)) from exc
