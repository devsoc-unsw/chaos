CREATE TABLE interviewer_availabilities (
    id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT CK_interviewer_availabilities_time CHECK (ends_at > starts_at),
    CONSTRAINT FK_interviewer_availabilities_campaign
        FOREIGN KEY(campaign_id)
            REFERENCES campaigns(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_interviewer_availabilities_user
        FOREIGN KEY(user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE INDEX IDX_interviewer_availabilities_campaign_user
    ON interviewer_availabilities(campaign_id, user_id, starts_at);

