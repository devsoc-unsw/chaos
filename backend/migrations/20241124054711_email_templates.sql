CREATE TABLE email_templates (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    template_subject TEXT NOT NULL,
    template_body TEXT NOT NULL,
    CONSTRAINT FK_email_templates_organisations
        FOREIGN KEY(organisation_id)
            REFERENCES organisations(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    UNIQUE (organisation_id, name)
);