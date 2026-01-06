-- Add migration script here
CREATE TABLE question_template (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    template_name TEXT NOT NULL,
    CONSTRAINT FK_question_template_campaigns
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_question_template_campaigns ON question_template(campaign_id);