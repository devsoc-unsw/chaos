-- Add migration script here
ALTER TABLE QUESTIONS
ADD COLUMN answer_limit integer;