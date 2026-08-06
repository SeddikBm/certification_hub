"""
Graph assembly matching 1-to-1 with the Architecture Diagram:

  scan -> parse -> compare_bdd -+--(NON: Mismatch BDD)---------------------------> rejected_outcome -> END
                                |
                                +--(OUI: Conforme BDD)--> detect_url -+--(NON: Pas d'URL)--> pending_approval_outcome -> END
                                                                      |
                                                                      +--(OUI: URL)--------> scrape -> compare_site -+--(OUI)--> approved_outcome -> END
                                                                                                                      |
                                                                                                                      +--(NON)-> rejected_outcome -> END
"""

from __future__ import annotations

from functools import lru_cache

from langgraph.graph import END, StateGraph

from app.graph.nodes.compare_bdd import compare_bdd_node, route_after_bdd
from app.graph.nodes.compare_site import compare_site_node, route_after_site
from app.graph.nodes.outcomes import (
    approved_outcome_node,
    pending_approval_outcome_node,
    rejected_outcome_node,
)
from app.graph.nodes.parse import parse_node
from app.graph.nodes.route import detect_url_node, route_by_url
from app.graph.nodes.scan import scan_node
from app.graph.nodes.scrape import scrape_node
from app.schemas.state import GraphState


@lru_cache
def build_validation_graph():
    graph = StateGraph(GraphState)

    # Core nodes
    graph.add_node("scan", scan_node)
    graph.add_node("parse", parse_node)
    graph.add_node("compare_bdd", compare_bdd_node)
    graph.add_node("detect_url", detect_url_node)
    graph.add_node("scrape", scrape_node)
    graph.add_node("compare_site", compare_site_node)

    # Outcome terminal nodes
    graph.add_node("approved_outcome", approved_outcome_node)
    graph.add_node("pending_approval_outcome", pending_approval_outcome_node)
    graph.add_node("rejected_outcome", rejected_outcome_node)

    # Sequential edges
    graph.set_entry_point("scan")
    graph.add_edge("scan", "parse")
    graph.add_edge("parse", "compare_bdd")

    # Conditional Decision 1: Données conformes ?
    graph.add_conditional_edges(
        "compare_bdd",
        route_after_bdd,
        {"detect_url": "detect_url", "rejected_outcome": "rejected_outcome"},
    )

    # Conditional Decision 2: URL officielle détectée ?
    graph.add_conditional_edges(
        "detect_url",
        route_by_url,
        {"scrape": "scrape", "pending_approval_outcome": "pending_approval_outcome"},
    )

    graph.add_edge("scrape", "compare_site")

    # Conditional Decision 3: Données du site conformes au certificat ?
    graph.add_conditional_edges(
        "compare_site",
        route_after_site,
        {"approved_outcome": "approved_outcome", "rejected_outcome": "rejected_outcome"},
    )

    # Terminal edges
    graph.add_edge("approved_outcome", END)
    graph.add_edge("pending_approval_outcome", END)
    graph.add_edge("rejected_outcome", END)

    return graph.compile()

