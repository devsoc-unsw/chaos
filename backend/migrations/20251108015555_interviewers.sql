CREATE TABLE role_interviewers (
    role_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    list_tier TEXT NOT NULL CHECK (list_tier IN ('first', 'second')),
    CONSTRAINT FK_role_interviewers_role
        FOREIGN KEY(role_id)
            REFERENCES campaign_roles(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT FK_role_interviewers_user
        FOREIGN KEY(user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    CONSTRAINT UQ_role_interviewers_role_user UNIQUE(role_id, user_id)
);