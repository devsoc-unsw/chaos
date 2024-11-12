-- Your SQL goes here

ALTER TABLE IF EXISTS answers
    ADD COLUMN answer_type question_types DEFAULT 'ShortAnswer';