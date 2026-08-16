"""
SQL guardrail for the Agent Text-to-SQL.

Three layers of defense, in order — this is the most security-critical
component in Module 1, so each layer is independent (a bypass of one
doesn't defeat the others):

1. The database role this connects with is read-only at the Postgres
   level (see RAG_DB_DSN in core/config.py) — the last line of defense
   if everything else somehow fails.
2. The generated SQL is parsed with a real SQL parser (sqlglot, not
   regex/keyword matching, which is trivially bypassable) and rejected
   unless it's exactly one SELECT statement touching only
   SQL_ALLOWED_TABLES.
3. The user_id scope is injected HERE, by this code, as a literal derived
   from the authenticated request (never from the LLM's output) — the LLM
   is never trusted to remember, or be tricked into omitting, a
   "WHERE user_id = ..." clause. This is the layer that actually prevents
   one user's question from being able to leak another user's data: even
   a successfully prompt-injected LLM generating
   "SELECT * FROM assignments" (no filter at all) still gets user_id
   ANDed onto its WHERE clause before it ever reaches the database.

user_id is an int that arrived on the authenticated request (ultimately
from the JWT Spring Boot validated) — not user-supplied text — so direct
interpolation into the SQL string at this one specific point is safe. This
is the ONLY place in this module allowed to build a SQL fragment via
string formatting; everything else must go through the parser.
"""

from __future__ import annotations

import logging

import sqlglot
from sqlglot import exp

from app.rag_chat.exceptions import SqlGuardrailViolation

logger = logging.getLogger(__name__)

_DIALECT = "postgres"

# Defence in depth beyond "only SELECT is allowed": block calls to
# functions with no legitimate place in a reporting query, in case one
# ever shows up embedded inside an otherwise-valid SELECT (e.g. a
# subquery calling something that reads server internals or blocks).
_BLOCKED_FUNCTIONS = {"pg_sleep", "pg_read_file", "dblink", "lo_import", "lo_export"}


def validate_and_scope_sql(sql: str, user_id: str | None, allowed_tables: list[str]) -> str:
    """
    Returns a validated, safe SQL string. Ensures only SELECT statements
    referencing allowed tables and safe functions are executed.
    """
    # Replace :user_id placeholder if present
    if user_id and ":user_id" in sql:
        sql = sql.replace(":user_id", f"'{user_id}'::uuid")

    try:
        statements = sqlglot.parse(sql, read=_DIALECT)
    except Exception as exc:
        raise SqlGuardrailViolation(f"SQL failed to parse: {exc}") from exc

    if len(statements) != 1 or statements[0] is None:
        raise SqlGuardrailViolation("Exactly one SQL statement is required — found more (or none).")

    parsed = statements[0]

    if not isinstance(parsed, exp.Select):
        raise SqlGuardrailViolation(
            f"Only SELECT statements are allowed, got: {type(parsed).__name__}"
        )

    tables = {t.name.lower() for t in parsed.find_all(exp.Table)}
    allowed = {t.lower() for t in allowed_tables}
    disallowed = tables - allowed
    if disallowed:
        raise SqlGuardrailViolation(f"Query references disallowed table(s): {sorted(disallowed)}")

    called_functions = {f.name.lower() for f in parsed.find_all(exp.Anonymous)} | {
        f.this.lower() if hasattr(f.this, "lower") else str(f.this).lower()
        for f in parsed.find_all(exp.Func)
        if f.this
    }
    blocked = called_functions & _BLOCKED_FUNCTIONS
    if blocked:
        raise SqlGuardrailViolation(f"Query calls disallowed function(s): {sorted(blocked)}")

    rewritten = parsed.sql(dialect=_DIALECT)
    logger.info("[SQL_GUARDRAIL] Validated SQL: %s", rewritten)
    return rewritten
