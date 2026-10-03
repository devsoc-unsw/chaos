CREATE TABLE comment_last_read (
    comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    last_read TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (comment_id, user_id)
);
