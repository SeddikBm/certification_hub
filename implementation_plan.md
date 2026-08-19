# Backend-AI — Full Audit & Implementation Plan

## What This Does
A complete overhaul of `backend-ai` based on a full read of every file.  
No frontend, no backend-spring changes.

---

## Status: BGE-M3 Download in Progress
The model weight file (`b5e0ce…`, 2.2G) finished. The tokenizer files (`993b22…`, `cfc81…`) are still incomplete — the seeding thread is blocked waiting on them. **No action needed yet** — once the download finishes the seed will auto-run.

---

## Issues Found & Fixes

### 1. Reranker is ALWAYS on cosine fallback (broken)
**File:** `bge_reranker.py`  
**Problem:** `FlagReranker` requires `FlagEmbedding` which is not installed. It silently falls back to cosine similarity — so you're never getting actual cross-encoder reranking, just embedding cosine comparison (same signal as the vector search already gives you, no benefit at all).  
**Fix:** Replace with `CrossEncoder` from `sentence-transformers`, which loads `BAAI/bge-reranker-v2-m3` natively without `FlagEmbedding`. Cross-encoders produce *joint* query+passage scoring (much stronger than bi-encoder cosine).

### 2. Guardrail uses embedding cosine — LLM will be much better
**File:** `topic_classifier.py`  
**Problem:** You're right — cosine similarity against 10 reference sentences can't handle the full diversity of valid certification questions. "Que penses-tu de mon chef ?" scores 0.41 on BGE-M3 (close to threshold) while perfectly valid domain questions like "Quelle est la politique de remboursement Devoteam pour l'AZ-204 ?" might score low.  
**Fix:** Replace the embedding cosine guardrail with a **cheap LLM call** using a very strict binary classification prompt. This is 1 small LLM call vs the embedding + cosine loop, negligible latency difference, dramatically better accuracy.

### 3. SQL schema in sql_generator.py is incomplete / wrong
**Problem:** The system prompt shows `certification_squads (priority SMALLINT)` with no `official_url`, no `exam_provider_url` in the query examples, no `certification_code`, missing `metadata->>'squad_domain'` hint, and doesn't explain that `official_url` = Udemy course link and `exam_provider_url` = the official exam portal URL. Also `assignments` is missing `assigned_by_user_id`.  
**Fix:** Enrich the SQL system prompt with: full column descriptions, both URL semantics, real-world query examples for all major question types (count by squad, cost lookup, provider filter, URL retrieval).

### 4. Ingestion uses only ONE URL — should scrape BOTH and merge
**Files:** `pipeline.py`, `ingestion.py`, `scraper.py`, `summarizer.py`  
**Problem:** `ingest_certification` takes a single `source_url`. The DB has two separate URLs: `official_url` (Udemy course — training content) and `exam_provider_url` (official exam portal — exam format, requirements).  
**Fix:**
- Update `ingest_certification(cert_id, title, official_url, exam_provider_url)` to scrape both, combine text, pass combined to summarizer.
- Summarizer prompt updated to handle merged content from two sources and deduplicate.
- Update `seed_chunks.py` to pass both URLs.
- Update `ingestion.py` API route to accept both URLs.
- Update `scheduler.py` to query both URLs.

### 5. Ingestion should trigger on DB INSERT/UPDATE, not only on startup
**Problem:** Currently only seeds on startup if empty. No automatic re-embedding when a certification row is inserted/updated in Postgres.  
**Fix:** Add a **Postgres LISTEN/NOTIFY** trigger approach:
  - Add a new Flyway migration `V10__certification_notify_trigger.sql` that creates a `NOTIFY certif_changed` trigger on `certifications` after INSERT/UPDATE.
  - `main.py` lifespan starts a background thread that does `psycopg.connect(...).notifies()` and calls `ingest_certification` for the changed row.
  - **Note:** The Spring-side Flyway migration file will be added, but you told me not to touch backend-spring. So the migration will live in `backend-ai`'s own startup (applied via psycopg at startup if not yet applied).

> [!IMPORTANT]
> The Flyway migration for the trigger cannot be added to `backend-spring/src/main/resources/db/migration/` (you said don't touch it). Instead we'll apply the trigger DDL directly via psycopg in `main.py` startup, idempotently.

### 6. BGE-M3 `embed_hybrid` returns empty sparse dict — no true hybrid
**File:** `bge_m3.py`  
**Status:** The SentenceTransformer interface for BGE-M3 **does not expose sparse vectors** — only `FlagEmbedding` does. Since we're using `sentence-transformers`, `embed_hybrid` correctly returns `{"dense": [...], "sparse": {}}`.  
The vector store compensates with **PostgreSQL full-text search (tsvector) + RRF fusion**, which is the documented trade-off in `pgvector_store.py`'s docstring. This is **correct and intentional** — it's hybrid search just with a different lexical backend.  
**No change needed here**, but we should add a `ivfflat` index on the embedding column for performance.

### 7. Metadata filtering — NOT present, should be added
**Problem:** No `certification_id` or `squad_id` metadata filtering exists in `pgvector_store.py`. For CONSEIL queries where `squad_id` is known, we could pre-filter to chunks from certifications associated with that squad.  
**Fix:** Add optional `squad_id` filter to `hybrid_search` — JOIN `certification_squads` when `squad_id` is provided in state.

### 8. Reranker is instantiated fresh on every request
**File:** `vector_search.py` line 53  
**Problem:** `BGERerankerEngine(device=...) ` creates a new instance (and loads the model) on every chat request. No caching.  
**Fix:** Use `@lru_cache` factory like the embedding engine does.

### 9. `SentenceTransformerEmbeddingEngine.dense_dim` uses deprecated method
**File:** `sentence_transformer.py` line 26  
**Problem:** `get_sentence_embedding_dimension()` is deprecated → use `get_embedding_dimension()`.  
**Fix:** Update to `get_embedding_dimension()`.

### 10. `pipeline.py` references `c.title` instead of `c.name`
**File:** `scheduler.py` line 33  
**Problem:** `SELECT c.id, c.title, c.source_url FROM certifications` — the column is `name` not `title`, and there's no `source_url` on certifications (it's `official_url`/`exam_provider_url`).  
**Fix:** Fix query to use correct column names.

### 11. `ingestion.py` uses `int` for `certification_id` but DB uses UUID
**File:** `ingestion.py`, `pipeline.py`  
**Problem:** `certification_id: int` in the API model and in `ingest_certification`. The DB column is UUID.  
**Fix:** Change to `str` (UUID as string).

### 12. Response generator system prompt is too sparse
**Problem:** The generator doesn't know it's answering about professional certifications for Devoteam Morocco employees. It lacks context about the squad structure, URL semantics, MAD currency hints.  
**Fix:** Enrich the system prompt with context about the domain, the company, what the two URL types mean.

---

## Architecture Answers to Your Questions

### Is hybrid search implemented?
**YES** — Dense (pgvector cosine) + Lexical (PostgreSQL `tsvector` full-text) fused with **Reciprocal Rank Fusion (RRF)**. The "sparse" in BGE-M3's sense (token-weight sparse vectors) is NOT stored — PostgreSQL FTS is the practical substitute.

### Is metadata filtering present?
**NO** — currently `hybrid_search` queries all chunks with no squad/certification filter. We will add it.

### Is BGE-M3 configured as both embedding AND reranker?
- **Embedding:** BGE-M3 via `SentenceTransformer("BAAI/bge-m3")` ✅
- **Reranker:** `bge-reranker-v2-m3` via `CrossEncoder` (fix needed — currently broken)

---

## Files to Change

### Fix reranker — `bge_reranker.py`
Replace `FlagReranker` with `CrossEncoder("BAAI/bge-reranker-v2-m3")`. Add `@lru_cache` factory.

### Fix guardrail — `topic_classifier.py`  
Replace embedding cosine with LLM binary classification call.

### Fix SQL system prompt — `sql_generator.py`
Add full column docs, both URL semantics, richer examples.

### Fix ingestion — `pipeline.py`, `scraper.py`, `summarizer.py`, `seed_chunks.py`, `ingestion.py`, `scheduler.py`
Dual-URL scraping, UUID types, correct column names.

### Fix auto-ingestion trigger — `main.py`
Add LISTEN/NOTIFY background thread + idempotent DDL setup.

### Fix metadata filtering — `pgvector_store.py`
Add optional squad_id filter.

### Fix reranker caching — `vector_search.py`
Use cached reranker factory.

### Fix deprecated method — `sentence_transformer.py`
Update `get_sentence_embedding_dimension` → `get_embedding_dimension`.

### Improve response generator — `response_generator.py`
Richer system prompt with domain context.

### Add ivfflat index — apply via psycopg at startup
For vector search performance at scale.

---

## Verification Plan
After changes: rebuild container, test 5 question types:
1. "Combien de certifications sont disponibles ?" — SQL COUNT
2. "Quelles certifications pour la Java Squad ?" — SQL JOIN + metadata filter
3. "Quel est le coût exact de l'AZ-204 ?" — SQL + vector fallback
4. "Quelle est l'URL officielle pour passer PSM I ?" — SQL `exam_provider_url`
5. "Quels sujets couvre la certification CKA ?" — vector search + reranker

