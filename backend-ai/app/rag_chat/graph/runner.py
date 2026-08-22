import time
import uuid
import logging

from app.rag_chat.graph.builder import build_chat_graph
from app.rag_chat.schemas.chat import ChatRequest, ChatResponse, ChatTraceItem, SourceInfo
from app.rag_chat.schemas.enums import Intent, RetrievalSource
from app.rag_chat.schemas.state import GraphState

from app.rag_chat.services.memory.session_memory import append_thread_message, get_thread_history

logger = logging.getLogger(__name__)


def run_chat(request: ChatRequest) -> ChatResponse:
    start_time = time.time()
    thread_id = request.thread_id or uuid.uuid4().hex
    history = get_thread_history(thread_id)

    initial_state: GraphState = {
        "message": request.message,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "user_name": request.user_name,
        "squad_id": request.squad_id,
        "thread_id": thread_id,
        "history": history,
        "reasons": [],
    }

    graph = build_chat_graph()
    final_state: GraphState = graph.invoke(initial_state)

    answer = final_state.get("answer", "Je n'ai pas pu obtenir de réponse.")
    append_thread_message(thread_id, "user", request.message)
    append_thread_message(thread_id, "assistant", answer)
    chunks = final_state.get("vector_chunks", [])
    
    # Map sources
    sources: list[SourceInfo] = []
    for c in chunks:
        title = c.certification_title
        if c.section:
            title = f"{title} - {c.section}"
        sources.append(
            SourceInfo(
                type="vector_db",
                title=title,
                url=c.source_url,
                score=c.score,
            )
        )

    if final_state.get("sql_rows"):
        sources.append(
            SourceInfo(
                type="sql_database",
                title="Base CertificationHub (SQL)",
                score=1.0,
            )
        )

    if final_state.get("scraped_content"):
        sources.append(
            SourceInfo(
                type="web_scraper",
                title="Page officielle en temps réel",
                score=0.9,
            )
        )

    latency_ms = int((time.time() - start_time) * 1000)
    trace = _build_trace(final_state, len(chunks))
    logger.info("[CHAT][TRACE] thread=%s intent=%s trace=%s", thread_id, final_state.get("intent"),
                [(item.type, item.status) for item in trace])
    logger.info("[CHAT][RESPONSE] thread=%s source=%s chunks=%d answer_chars=%d latency_ms=%d",
                thread_id, final_state.get("source", RetrievalSource.NONE), len(chunks), len(answer), latency_ms)

    return ChatResponse(
        thread_id=thread_id,
        on_topic=final_state.get("on_topic", True),
        intent=final_state.get("intent"),
        source=final_state.get("source", RetrievalSource.NONE),
        answer=answer,
        response=answer,
        sources=sources,
        suggestedActions=[],
        latencyMs=latency_ms,
        grounded=final_state.get("grounded", False),
        retrieved_chunks=chunks,
        reasons=final_state.get("reasons", []),
        trace=trace,
    )


def _build_trace(final_state: GraphState, chunk_count: int) -> list[ChatTraceItem]:
    """Expose transparent thought steps and tools used like DeepSeek / ChatGPT."""
    trace: list[ChatTraceItem] = []

    # If Off-topic or Greeting (Guardrail direct response)
    if not final_state.get("on_topic", True):
        return [
            ChatTraceItem(
                type="guardrail",
                label="Garde-Fou Thématique & Salutation",
                detail="Message d'accueil ou question générale / hors périmètre des certifications IT. Prise en charge et orientation directe.",
                status="salutation / orientation",
            )
        ]

    intent = final_state.get("intent")

    # Step 1: Intent & Routing
    if intent == Intent.ANALYTIQUE:
        trace.append(ChatTraceItem(
            type="intent",
            label="Intention détectée : Analytique & Données",
            detail="La question porte sur des données précises (statistiques, affectations, prix ou catalogue). Routage vers le moteur Text-to-SQL.",
            status="validé",
        ))
        sql = final_state.get("sql_query")
        rows = len(final_state.get("sql_rows") or [])
        if sql:
            trace.append(ChatTraceItem(
                type="sql",
                label="Requête SQL générée & vérifiée (sqlglot)",
                detail=sql,
                status=f"{rows} ligne(s) trouvée(s)",
            ))
        else:
            trace.append(ChatTraceItem(
                type="sql",
                label="Requête SQL",
                detail=final_state.get("sql_error") or "Requête non exécutée.",
                status="erreur",
            ))
    else:
        best_score = 0.0
        chunks = final_state.get("vector_chunks") or []
        if chunks:
            best_score = chunks[0].score

        trace.append(ChatTraceItem(
            type="intent",
            label="Intention détectée : Conseil & Contenu Sémantique",
            detail="La question porte sur le syllabus, les compétences, la préparation ou les conseils de certification. Routage vers la recherche RAG hybride.",
            status="validé",
        ))
        trace.append(ChatTraceItem(
            type="vector",
            label="Recherche Vectorielle (pgvector 2048d) & Reranking",
            detail=f"Recherche dense + lexicale FTS. Extraction et reranking des Top-{chunk_count} chunks les plus pertinents (Score max: {best_score:.2f}).",
            status="pertinence validée",
        ))
        if final_state.get("scraped_content"):
            trace.append(ChatTraceItem(
                type="web",
                label="Recherche Web live complémentaire",
                detail="Extraction en direct sur les portails officiels de certification pour enrichir le contexte.",
                status="terminée",
            ))

    # Step: Groundedness
    grounded = final_state.get("grounded", True)
    trace.append(ChatTraceItem(
        type="groundedness",
        label="Vérification d'ancrage factuel (Groundedness Check)",
        detail="Contrôle de conformité de la synthèse pour garantir l'absence d'hallucinations.",
        status="conforme" if grounded else "ajusté",
    ))

    return trace
