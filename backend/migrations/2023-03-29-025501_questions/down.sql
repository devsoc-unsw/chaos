-- This file should undo anything in `up.sql`

ALTER TABLE IF EXISTS questions
    DROP COLUMN question_type;

DROP TYPE question_types;