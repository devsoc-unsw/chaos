CREATE TYPE application_status AS ENUM ('Pending', 'Rejected', 'Successful');

CREATE TABLE applications (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT PRIMARY KEY,
    status application_status NOT NULL,
    private_status application_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE application_roles (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    campaign_role_id INTEGER NOT NULL,
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

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
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
);

CREATE TABLE short_answer_answers (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    answer_id INTEGER NOT NULL,
    CONSTRAINT FK_multi_option_answer_options_answers
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE TABLE multi_option_answer_options (
    id SERIAL PRIMARY KEY,
    option_id BIGINT NOT NULL,
    answer_id INTEGER NOT NULL,
    CONSTRAINT FK_multi_option_answer_options_question_options
        FOREIGN KEY(option_id)
            REFERENCES multi_option_question_options(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_multi_option_answer_options_answers
       FOREIGN KEY(answer_id)
           REFERENCES answers(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

CREATE TABLE application_ratings (
    id SERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    rater_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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
