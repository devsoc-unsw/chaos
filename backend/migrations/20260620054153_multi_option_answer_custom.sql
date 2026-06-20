-- Add custom value column
ALTER TABLE multi_option_answer_options
    ADD COLUMN custom_value TEXT DEFAULT NULL;

-- Remove not null constraint from option ID
ALTER TABLE multi_option_answer_options
    ALTER COLUMN option_id
        DROP NOT NULL;

-- References the wrong table
DROP INDEX idx_ranking_answer_rankings_question_option;
DROP INDEX idx_ranking_answer_rankings_answer;

-- Re-add the last two indices, referencing the correct table
CREATE INDEX IDX_ranking_answer_rankings_question_option on ranking_answer_rankings (option_id);
CREATE INDEX IDX_ranking_answer_rankings_answer on ranking_answer_rankings (answer_id);
