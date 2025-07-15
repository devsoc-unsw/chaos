CREATE TYPE offer_status AS ENUM ('Draft', 'Sent', 'Accepted', 'Declined');

CREATE TABLE offers (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    application_id BIGINT NOT NULL,
    email_template_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    expiry TIMESTAMPTZ NOT NULL,
    status offer_status NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_offers_campaigns
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_offers_applications
        FOREIGN KEY(application_id)
            REFERENCES applications(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_offers_email_templates
        FOREIGN KEY(email_template_id)
            REFERENCES email_templates(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_offers_roles
        FOREIGN KEY(role_id)
            REFERENCES campaign_roles(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);