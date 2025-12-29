CREATE TABLE organisation_invites (
    code TEXT PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_organisation_invites_org_email ON organisation_invites (organisation_id, email);


