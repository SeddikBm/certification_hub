"""
Unified diagram generator for CertificationHub AI Microservice.
Exports both Module 1 (RAG Chat Graph) and Module 2 (Certificate Validation Graph)
to Mermaid (.mmd) and PNG formats.
"""
import sys
from pathlib import Path

# Add backend-ai root directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app.certification_validation.graph.builder import graph as validation_graph
from app.rag_chat.graph.builder import build_chat_graph


def export_all_diagrams():
    print(f"Generating workflow diagrams into: {ROOT_DIR}\n")

    # =========================================================================
    # 1. Module 2: Certificate Validation Workflow
    # =========================================================================
    print("--- [Module 2] Certificate Validation Graph ---")
    val_mmd = validation_graph.get_graph().draw_mermaid()
    val_mmd_path = ROOT_DIR / "validation_graph.mmd"
    with open(val_mmd_path, "w", encoding="utf-8") as f:
        f.write(val_mmd)
    print(f" Saved Mermaid syntax -> {val_mmd_path.name}")

    val_png_path = ROOT_DIR / "validation_graph.png"
    try:
        val_png = validation_graph.get_graph().draw_mermaid_png()
        with open(val_png_path, "wb") as f:
            f.write(val_png)
        print(f" Saved PNG diagram    -> {val_png_path.name}")
    except Exception as exc:
        print(f"  Note: PNG generation skipped ({exc})")

    # =========================================================================
    # 2. Module 1: RAG Multi-Turn Hybrid Chat Workflow
    # =========================================================================
    print("\n--- [Module 1] RAG Chat Graph ---")
    chat_graph = build_chat_graph()
    chat_mmd = chat_graph.get_graph().draw_mermaid()
    chat_mmd_path = ROOT_DIR / "rag_chat_graph.mmd"
    with open(chat_mmd_path, "w", encoding="utf-8") as f:
        f.write(chat_mmd)
    print(f" Saved Mermaid syntax -> {chat_mmd_path.name}")

    chat_png_path = ROOT_DIR / "rag_chat_graph.png"
    try:
        chat_png = chat_graph.get_graph().draw_mermaid_png()
        with open(chat_png_path, "wb") as f:
            f.write(chat_png)
        print(f" Saved PNG diagram    -> {chat_png_path.name}")
    except Exception as exc:
        print(f"  Note: PNG generation skipped ({exc})")

    print("\n All diagrams generated successfully!")


if __name__ == "__main__":
    export_all_diagrams()
