CREATE TABLE campaigns (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    cover_image UUID,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_campaigns_organisations
       FOREIGN KEY(organisation_id)
           REFERENCES organisations(id)
           ON DELETE CASCADE
           ON UPDATE CASCADE,
    UNIQUE (organisation_id, slug)
);

CREATE TABLE campaign_roles (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    min_available INTEGER NOT NULL,
    max_available INTEGER NOT NULL,
    finalised BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_campaign_roles_campaign
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_campaign_roles_campaign on campaign_roles(campaign_id);