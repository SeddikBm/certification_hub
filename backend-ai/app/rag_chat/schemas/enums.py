from __future__ import annotations

from enum import Enum


class Intent(str, Enum):
    ANALYTIQUE = "ANALYTIQUE"  # factual/counting question about the user's own data
    CONSEIL = "CONSEIL"  # advisory/semantic question about which certification to pursue


class RetrievalSource(str, Enum):
    SQL = "SQL"
    VECTOR_STORE = "VECTOR_STORE"
    VECTOR_STORE_PLUS_LIVE_SCRAPE = "VECTOR_STORE_PLUS_LIVE_SCRAPE"
    NONE = "NONE"
