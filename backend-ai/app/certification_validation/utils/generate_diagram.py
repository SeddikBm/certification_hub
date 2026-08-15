import sys
from pathlib import Path

# Ensure backend-ai root directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.graph.builder import graph


def export_diagrams():
    # Option 1: Save as PNG image
    try:
        png_data = graph.get_graph().draw_mermaid_png()
        with open("validation_graph.png", "wb") as f:
            f.write(png_data)
        print(" Saved PNG diagram to backend_ai/validation_graph.png")
    except Exception as e:
        print(f" Could not generate PNG (requires pygraphviz/grandalf or internet): {e}")

    # Option 2: Save as raw Mermaid Markdown string (Works 100% locally without external tools)
    mermaid_code = graph.get_graph().draw_mermaid()
    with open("validation_graph.mmd", "w") as f:
        f.write(mermaid_code)
    print(" Saved Mermaid syntax to backend_ai/validation_graph.mmd")

if __name__ == "__main__":
    export_diagrams()