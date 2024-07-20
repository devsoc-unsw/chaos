CREATE TABLE organisations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TYPE organisation_role AS ENUM ('User', 'Admin');

CREATE TABLE organisation_members (
    id SERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role organisation_role DEFAULT 'User' NOT NULL,
    CONSTRAINT FK_organisation_members_organisation
        FOREIGN KEY(organisation_id)
            REFERENCES organisations(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
);

CREATE INDEX IDX_organisation_admins_organisation on organisation_members (organisation_id);
