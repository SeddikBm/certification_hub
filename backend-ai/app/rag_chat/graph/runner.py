from __future__ import annotations

import uuid

from app.rag_chat.graph.builder import build_chat_graph
from app.rag_chat.schemas.chat import ChatRequest, ChatResponse
from app.rag_chat.schemas.enums import RetrievalSource
from app.rag_chat.schemas.state import GraphState


def run_chat(request: ChatRequest) -> ChatResponse:
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

    return ChatResponse(
        thread_id=thread_id,
        on_topic=final_state.get("on_topic", True),
        intent=final_state.get("intent"),
        source=final_state.get("source", RetrievalSource.NONE),
        answer=final_state["answer"],
        grounded=final_state.get("grounded", False),
        retrieved_chunks=final_state.get("vector_chunks", []),
        reasons=final_state.get("reasons", []),
    )
