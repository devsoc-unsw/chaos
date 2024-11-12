-- This file should undo anything in `up.sql`
ALTER TABLE IF EXISTS answers
    DROP COLUMN answer_type;
