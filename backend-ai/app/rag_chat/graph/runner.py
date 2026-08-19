import time
import uuid
import logging

from app.rag_chat.graph.builder import build_chat_graph
from app.rag_chat.schemas.chat import ChatRequest, ChatResponse, ChatTraceItem, SourceInfo
from app.rag_chat.schemas.enums import Intent, RetrievalSource
from app.rag_chat.schemas.state import GraphState

logger = logging.getLogger(__name__)


def run_chat(request: ChatRequest) -> ChatResponse:
    start_time = time.time()
    thread_id = request.thread_id or uuid.uuid4().hex

    initial_state: GraphState = {
        "message": request.message,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "user_name": request.user_name,
        "squad_id": request.squad_id,
        "thread_id": thread_id,
        "reasons": [],
    }

    graph = build_chat_graph()
    final_state: GraphState = graph.invoke(initial_state)

    answer = final_state.get("answer", "Je n'ai pas pu obtenir de réponse.")
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

    # Dynamic suggestions
    suggestions = [
        "Quelles certifications sont prioritaires pour ma squad ?",
        "Quel est le format de l'examen PSM I ?",
        "Combien coûte la certification AZ-204 ?",
    ]
    if final_state.get("intent") == Intent.ANALYTIQUE:
        suggestions = [
            "Combien de certifications ai-je validées ?",
            "Quelles certifications en cours dans ma squad ?",
            "Quels sont les examens planifiés ?",
        ]

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
        suggestedActions=suggestions,
        latencyMs=latency_ms,
        grounded=final_state.get("grounded", False),
        retrieved_chunks=chunks,
        reasons=final_state.get("reasons", []),
        trace=trace,
    )


def _build_trace(final_state: GraphState, chunk_count: int) -> list[ChatTraceItem]:
    """Expose tools used, not hidden reasoning, so the UI can be transparent."""
    if final_state.get("intent") == Intent.ANALYTIQUE:
        sql = final_state.get("sql_query")
        if sql:
            rows = len(final_state.get("sql_rows") or [])
            return [ChatTraceItem(
                type="sql",
                label="Requête SQL exécutée",
                detail=sql,
                status=f"{rows} résultat(s)",
            )]
        return [ChatTraceItem(
            type="sql",
            label="Recherche analytique SQL",
            detail="La requête n'a pas pu être exécutée de façon sûre.",
            status="indisponible",
        )]

    trace = [ChatTraceItem(
        type="vector",
        label="Recherche vectorielle RAG",
        detail=f"{chunk_count} extrait(s) pertinents retrouvés dans les certifications indexées.",
        status="terminée",
    )]
    if final_state.get("scraped_content"):
        trace.append(ChatTraceItem(
            type="web",
            label="Complément depuis les sites officiels",
            detail="La base indexée a été complétée avec les pages officielles disponibles.",
            status="terminée",
        ))
    return trace
