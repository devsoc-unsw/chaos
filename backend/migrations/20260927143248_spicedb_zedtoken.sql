-- Single-row table holding the newest SpiceDB ZedToken observed by the ETL
-- pipeline. Permission checks read it as their `AtLeastAsFresh` freshness
-- boundary. Only the single ETL leader writes here, so last-wins is monotonic.
-- Deliberately excluded from the `spicedb_sync` publication: it is ETL-owned
-- state, not source data.
CREATE TABLE spicedb_zedtoken (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    token TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT spicedb_zedtoken_single_row CHECK (id)
);
