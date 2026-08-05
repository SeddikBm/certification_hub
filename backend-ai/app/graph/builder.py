"""
Graph assembly.

Topology:

    scan -> parse -> early_match -+-> detect_trusted_url -+-> scrape -+
                                  |   (no trusted URL)     |          |
                                  +----(name mismatch)-----+----------+-> fuzzy_match -> evaluate -> END

early_match runs a cheap, network-free comparison against the expected
person (from Spring Boot) right after parsing — "comparer d'abord": if the
extracted name clearly isn't the expected person, there's no point
spending a network call verifying that someone else's real certificate is
real, so it skips straight past URL-detection/scraping to fuzzy_match
(and from there, evaluate — which will see early_reject and explain why).
Otherwise it proceeds to the normal detect_trusted_url -> scrape path.

We don't attach a checkpointer: each validation run is a single, complete
request/response — there's no multi-turn conversation or human-in-the-loop
*inside* the graph to resume (the "manual review" loop in the diagram is a
separate, outside process — Career Manager acts on the PENDING_REVIEW
result via the Spring Boot UI, not by resuming this graph). If you later
want the graph itself to pause and wait for a human decision using
LangGraph's `interrupt()`, add a PostgresSaver checkpointer here — the node
functions don't need to change.
"""

from __future__ import annotations

from functools import lru_cache

from langgraph.graph import END, StateGraph

from app.graph.nodes.early_match import early_match_node, route_by_early_match
from app.graph.nodes.evaluate import evaluate_node
from app.graph.nodes.fuzzy_match import fuzzy_match_node
from app.graph.nodes.parse import parse_node
from app.graph.nodes.route import detect_trusted_url_node, route_by_url
from app.graph.nodes.scan import scan_node
from app.graph.nodes.scrape import scrape_node
from app.schemas.state import GraphState


@lru_cache
def build_validation_graph():
    graph = StateGraph(GraphState)

    graph.add_node("scan", scan_node)
    graph.add_node("parse", parse_node)
    graph.add_node("early_match", early_match_node)
    graph.add_node("detect_trusted_url", detect_trusted_url_node)
    graph.add_node("scrape", scrape_node)
    graph.add_node("fuzzy_match", fuzzy_match_node)
    graph.add_node("evaluate", evaluate_node)

    graph.set_entry_point("scan")
    graph.add_edge("scan", "parse")
    graph.add_edge("parse", "early_match")
    graph.add_conditional_edges(
        "early_match",
        route_by_early_match,
        {"detect_trusted_url": "detect_trusted_url", "fuzzy_match": "fuzzy_match"},
    )
    graph.add_conditional_edges(
        "detect_trusted_url",
        route_by_url,
        {"scrape": "scrape", "fuzzy_match": "fuzzy_match"},
    )
    graph.add_edge("scrape", "fuzzy_match")
    graph.add_edge("fuzzy_match", "evaluate")
    graph.add_edge("evaluate", END)

    return graph.compile()
