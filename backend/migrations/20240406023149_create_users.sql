CREATE TYPE user_role AS ENUM ('User', 'SuperUser');

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    zid TEXT,
    name TEXT NOT NULL,
    degree_name TEXT,
    degree_starting_year INTEGER,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IDX_users_email_lower on users ((lower(email)));
