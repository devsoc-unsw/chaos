CREATE TYPE user_role AS ENUM ('User', 'SuperUser');

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    zid TEXT,
    name TEXT NOT NULL,
    degree_name TEXT,
    degree_starting_year INTEGER,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IDX_users_email_lower on users ((lower(email)));

CREATE TABLE organisations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE organisation_admins (
    id SERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT FK_organisation_admins_organisation
        FOREIGN KEY(organisation_id)
            REFERENCES organisations(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_organisation_admins_organisation on organisation_admins (organisation_id);

CREATE TABLE campaigns (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    cover_image TEXT,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_campaigns_organisations
       FOREIGN KEY(organisation_id)
           REFERENCES organisations(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

CREATE TABLE campaign_roles (
    id SERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    min_available INTEGER,
    max_available INTEGER,
    finalised BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_campaign_roles_campaign
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_campaign_roles_campaign on campaign_roles (campaign_id);

CREATE TYPE question_type AS ENUM ('ShortAnswer', 'MultiChoice', 'MultiSelect', 'DropDown');

CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    common BOOLEAN NOT NULL,
    required BOOLEAN NOT NULL,
    question_type question_type NOT NULL,
    campaign_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_questions_campaigns
       FOREIGN KEY(campaign_id)
           REFERENCES campaigns(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

CREATE TABLE multi_option_question_options (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    question_id BIGINT NOT NULL,
    rank INTEGER NOT NULL,
    CONSTRAINT FK_multi_option_question_options_questions
       FOREIGN KEY(question_id)
           REFERENCES questions(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE,
    UNIQUE (text, question_id)
);

CREATE INDEX IDX_multi_option_question_options_questions on multi_option_question_options (question_id);

CREATE TYPE application_status AS ENUM ('Pending', 'Rejected', 'Successful');

CREATE TABLE applications (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status application_status NOT NULL,
    private_status application_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
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

CREATE INDEX IDX_application_roles_applications on application_roles (application_id);
CREATE INDEX IDX_application_roles_campaign_roles on application_roles (campaign_role_id);

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

CREATE INDEX IDX_answers_applications on answers (application_id);
CREATE INDEX IDX_answers_questions on answers (question_id);

CREATE TABLE short_answer_answers (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    answer_id INTEGER NOT NULL,
    CONSTRAINT FK_short_answer_answers_answers
      FOREIGN KEY(answer_id)
          REFERENCES answers(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
);

CREATE INDEX IDX_short_answer_answers_answers on short_answer_answers (answer_id);

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

CREATE INDEX IDX_multi_option_answer_options_question_options on multi_option_answer_options (option_id);
CREATE INDEX IDX_multi_option_answer_options_answers on multi_option_answer_options (answer_id);

CREATE TABLE application_ratings (
    id SERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    rater_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
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

CREATE INDEX IDX_application_ratings_applications on application_ratings (application_id);
CREATE INDEX IDX_application_ratings_users on application_ratings (rater_id);
