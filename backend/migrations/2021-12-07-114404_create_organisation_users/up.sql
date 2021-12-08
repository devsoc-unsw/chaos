CREATE TYPE admin_level AS ENUM ('ReadOnly', 'Director', 'Admin');

CREATE TABLE organisation_users (
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id),
	organisation_id INTEGER NOT NULL REFERENCES organisations (id),
	admin_level admin_level NOT NULL,
	superuser BOOLEAN NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('organisation_users');
