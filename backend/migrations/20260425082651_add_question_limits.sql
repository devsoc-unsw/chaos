-- Add migration script here
ALTER TABLE QUESTIONS
ADD COLUMN short_answer_word_limit integer,
ADD COLUMN multi_select_choice_limit integer;