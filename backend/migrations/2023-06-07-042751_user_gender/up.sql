CREATE TYPE user_gender AS ENUM ('Female', 'Male', 'Unspecified');

ALTER TABLE users
    ADD COLUMN gender user_gender DEFAULT 'Unspecified' NOT NULL;
