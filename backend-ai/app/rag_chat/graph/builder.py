"""
Graph assembly for Module 1 — RAG chat.

Topology:

    guardrail -+-> off_topic_response -> END
               |
               +-> rewrite -> route -+-> text_to_sql -----------------+
                                     |                                |
                                     +-> vector_search -> grade -+    |
                                                    (suffisant)  |    |
                                                                 +----+-> generate -> groundedness -+-> END
                                                    (insuffisant)|                        ^          |
                                                                 +-> web_scrape ----------+          |
                                                                                                       |
                                                                 regenerate <--(non groundé, 1 essai)-+

Same rationale as app.certification_validation.graph.builder for skipping
a checkpointer: each chat turn is currently a complete request/response.
If/when multi-turn memory is wired up (thread_id is already in the state
and API contract, see README), add a PostgresSaver checkpointer here keyed
by thread_id — no node needs to change for that.
"""

from __future__ import annotations

from functools import lru_cache

from langgraph.graph import END, StateGraph

from app.rag_chat.graph.nodes.generate import generate_node, regenerate_node
from app.rag_chat.graph.nodes.grade_retrieval import grade_retrieval_node, route_by_retrieval_grade
from app.rag_chat.graph.nodes.groundedness import groundedness_node, route_by_groundedness
from app.rag_chat.graph.nodes.guardrail import guardrail_node, off_topic_response_node, route_by_guardrail
from app.rag_chat.graph.nodes.rewrite import rewrite_node
from app.rag_chat.graph.nodes.route import route_by_intent, route_node
from app.rag_chat.graph.nodes.text_to_sql import text_to_sql_node
from app.rag_chat.graph.nodes.vector_search import vector_search_node
from app.rag_chat.graph.nodes.web_scrape import web_scrape_node
from app.rag_chat.schemas.state import GraphState


@lru_cache
def build_chat_graph():
    graph = StateGraph(GraphState)

    graph.add_node("guardrail", guardrail_node)
    graph.add_node("off_topic_response", off_topic_response_node)
    graph.add_node("rewrite", rewrite_node)
    graph.add_node("route", route_node)
    graph.add_node("text_to_sql", text_to_sql_node)
    graph.add_node("vector_search", vector_search_node)
    graph.add_node("grade_retrieval", grade_retrieval_node)
    graph.add_node("web_scrape", web_scrape_node)
    graph.add_node("generate", generate_node)
    graph.add_node("groundedness", groundedness_node)
    graph.add_node("regenerate", regenerate_node)

    graph.set_entry_point("guardrail")
    graph.add_conditional_edges(
        "guardrail", route_by_guardrail, {"rewrite": "rewrite", "off_topic_response": "off_topic_response"}
    )
    graph.add_edge("off_topic_response", END)

    graph.add_edge("rewrite", "route")
    graph.add_conditional_edges(
        "route", route_by_intent, {"text_to_sql": "text_to_sql", "vector_search": "vector_search"}
    )

    graph.add_edge("text_to_sql", "generate")

    graph.add_edge("vector_search", "grade_retrieval")
    graph.add_conditional_edges(
        "grade_retrieval", route_by_retrieval_grade, {"generate": "generate", "web_scrape": "web_scrape"}
    )
    graph.add_edge("web_scrape", "generate")

    graph.add_edge("generate", "groundedness")
    graph.add_conditional_edges(
        "groundedness", route_by_groundedness, {"done": END, "regenerate": "regenerate"}
    )
    graph.add_edge("regenerate", "groundedness")  # bounded by route_by_groundedness's attempt-count check

    return graph.compile()
