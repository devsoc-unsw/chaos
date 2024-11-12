CREATE TABLE organisations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE organisation_role AS ENUM ('User', 'Admin');

CREATE TABLE organisation_members (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role organisation_role NOT NULL DEFAULT 'User',
    CONSTRAINT FK_organisation_members_organisation
        FOREIGN KEY(organisation_id)
            REFERENCES organisations(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
);


CREATE INDEX IDX_organisation_admins_organisation on organisation_members(organisation_id);
