CREATE TABLE roles (
	id SERIAL PRIMARY KEY,
	campaign_id INTEGER NOT NULL REFERENCES campaigns (id),
	name TEXT NOT NULL,
	description TEXT,
	min_available INTEGER NOT NULL,
	max_available INTEGER NOT NULL,
	finalised BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('roles');
