"""
Thread session memory for multi-turn conversations.
Keeps recent user/assistant turns in memory keyed by thread_id.
"""
from __future__ import annotations

import threading
from collections import deque

_MAX_MESSAGES_PER_THREAD = 10
_MAX_THREADS = 1000

_lock = threading.Lock()
_memory: dict[str, deque[dict[str, str]]] = {}


def get_thread_history(thread_id: str) -> list[dict[str, str]]:
    """Returns a list of {'role': 'user'|'assistant', 'content': str} for the given thread."""
    if not thread_id:
        return []
    with _lock:
        queue = _memory.get(thread_id)
        if not queue:
            return []
        return list(queue)


def append_thread_message(thread_id: str, role: str, content: str) -> None:
    """Appends a message to the thread history."""
    if not thread_id or not content.strip():
        return
    with _lock:
        if thread_id not in _memory:
            if len(_memory) >= _MAX_THREADS:
                # Evict oldest thread
                oldest_key = next(iter(_memory))
                del _memory[oldest_key]
            _memory[thread_id] = deque(maxlen=_MAX_MESSAGES_PER_THREAD)
        _memory[thread_id].append({"role": role, "content": content.strip()})


def clear_thread_history(thread_id: str) -> None:
    """Clears history for a specific thread."""
    if not thread_id:
        return
    with _lock:
        _memory.pop(thread_id, None)
