CREATE TYPE application_status AS ENUM ('Pending', 'Rejected', 'Successful');

CREATE TABLE applications (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status application_status NOT NULL DEFAULT 'Pending',
    private_status application_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT FK_applications_campaigns
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_applications_users
        FOREIGN KEY(user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IDX_applications_campaign on applications(campaign_id);
CREATE UNIQUE INDEX IDX_applications_user on applications(user_id);

CREATE TABLE application_roles (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    campaign_role_id BIGINT NOT NULL,
    preference INTEGER NOT NULL,
    CONSTRAINT FK_application_roles_applications
        FOREIGN KEY(application_id)
            REFERENCES applications(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_application_roles_campaign_roles
        FOREIGN KEY(campaign_role_id)
            REFERENCES campaign_roles(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_application_roles_application on application_roles(application_id);
CREATE INDEX IDX_application_roles_campaign_role on application_roles(campaign_role_id);

CREATE TABLE answers (
  id BIGINT PRIMARY KEY,
  application_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_answers_applications
      FOREIGN KEY(application_id)
          REFERENCES applications(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
  CONSTRAINT FK_answers_questions
      FOREIGN KEY(question_id)
          REFERENCES questions(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IDX_answers_application on answers(application_id);
CREATE INDEX IDX_answers_question on answers(question_id);

CREATE TABLE short_answer_answers (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    answer_id BIGINT NOT NULL,
    CONSTRAINT FK_short_answer_answers_answers
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_short_answer_answers_answer on short_answer_answers(answer_id);

CREATE TABLE multi_option_answer_options (
    id BIGSERIAL PRIMARY KEY,
    option_id BIGINT NOT NULL,
    answer_id BIGINT NOT NULL,
    CONSTRAINT FK_multi_option_answer_options_question_options
        FOREIGN KEY(option_id)
            REFERENCES multi_option_question_options(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT FK_multi_option_answer_options_answers
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IDX_multi_option_answer_options_question_option on multi_option_answer_options(option_id);
CREATE UNIQUE INDEX IDX_multi_option_answer_options_answer on multi_option_answer_options(answer_id);

CREATE TABLE ranking_answer_rankings (
    id BIGSERIAL PRIMARY KEY,
    option_id BIGINT NOT NULL,
    rank INTEGER NOT NULL,
    answer_id BIGINT NOT NULL,
    CONSTRAINT FK_ranking_answer_rankings_question_options
        FOREIGN KEY(option_id)
            REFERENCES multi_option_question_options(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT FK_ranking_answer_rankings_answers
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_ranking_answer_rankings_question_option on multi_option_answer_options(option_id);
CREATE INDEX IDX_ranking_answer_rankings_answer on multi_option_answer_options(answer_id);

CREATE TABLE application_ratings (
    id BIGINT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    rater_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_application_ratings_applications
        FOREIGN KEY(application_id)
            REFERENCES applications(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_application_ratings_users
        FOREIGN KEY(rater_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_application_ratings_application on application_ratings(application_id);
CREATE INDEX IDX_application_ratings_user on application_ratings(rater_id);