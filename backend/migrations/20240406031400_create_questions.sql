CREATE TYPE question_type AS ENUM ('ShortAnswer', 'MultiChoice', 'MultiSelect', 'DropDown');

CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    common BOOLEAN NOT NULL,
    required BOOLEAN,
    question_type question_type NOT NULL,
    campaign_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_questions_campaigns
       FOREIGN KEY(campaign_id)
           REFERENCES campaigns(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

CREATE TABLE multi_option_question_options (
    id BIGINT PRIMARY KEY,
    text TEXT NOT NULL,
    question_id BIGINT NOT NULL,
    CONSTRAINT FK_multi_option_question_options_questions
       FOREIGN KEY(question_id)
           REFERENCES questions(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

CREATE INDEX IDX_multi_option_question_options_questions on multi_option_question_options (question_id);