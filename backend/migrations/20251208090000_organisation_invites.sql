CREATE TABLE organisation_invites (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by_organisation_id BIGINT REFERENCES organisations(id) ON DELETE SET NULL
);

CREATE INDEX IDX_organisation_invites_code ON organisation_invites (code);
CREATE INDEX IDX_organisation_invites_organisation_id ON organisation_invites (organisation_id);
CREATE INDEX IDX_organisation_invites_email ON organisation_invites (email);