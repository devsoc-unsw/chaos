CREATE TABLE organisations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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