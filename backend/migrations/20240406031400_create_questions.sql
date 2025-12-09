CREATE TYPE question_type AS ENUM ('ShortAnswer', 'MultiChoice', 'MultiSelect', 'DropDown', 'Ranking');

CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    common BOOLEAN NOT NULL,
    required BOOLEAN NOT NULL,
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

CREATE UNIQUE INDEX IDX_questions_campaign on questions(campaign_id);

CREATE TABLE multi_option_question_options (
    id BIGINT PRIMARY KEY,
    text TEXT NOT NULL,
    question_id BIGINT NOT NULL,
    display_order INTEGER NOT NULL,
    CONSTRAINT FK_multi_option_question_options_questions
       FOREIGN KEY(question_id)
           REFERENCES questions(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
       DEFERRABLE INITIALLY DEFERRED,
    UNIQUE (question_id, display_order)
);

CREATE INDEX IDX_multi_option_question_options_question on multi_option_question_options(question_id);

CREATE TABLE question_roles (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT FK_question_roles_questions
        FOREIGN KEY(question_id)
            REFERENCES questions(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT FK_question_roles_roles
        FOREIGN KEY(role_id)
            REFERENCES campaign_roles(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            DEFERRABLE INITIALLY DEFERRED,
    UNIQUE (question_id, role_id)
);

CREATE INDEX IDX_question_roles_question on question_roles(question_id);
CREATE INDEX IDX_question_roles_role on question_roles(role_id);