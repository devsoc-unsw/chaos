-- Your SQL goes here

CREATE TYPE question_types AS ENUM ('ShortAnswer', 'MultiSelect');

ALTER TABLE IF EXISTS questions
    ADD COLUMN question_type question_types DEFAULT 'ShortAnswer';
