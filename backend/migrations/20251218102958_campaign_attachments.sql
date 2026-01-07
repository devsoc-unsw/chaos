CREATE TABLE campaign_attachments (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    CONSTRAINT FK_campaign_attachments_campaigns
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_campaign_attachments_campaign on campaign_attachments(campaign_id);
