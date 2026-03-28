CREATE TABLE email_queue (
     id SERIAL PRIMARY KEY,
     recepient_name TEXT,
     recepient_email_address TEXT NOT NULL,
     subject TEXT NOT NULL,
     body TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);