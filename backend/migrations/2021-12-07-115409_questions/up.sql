CREATE TABLE questions (
	id SERIAL PRIMARY KEY,
	role_id INTEGER NOT NULL REFERENCES roles (id),
	title TEXT NOT NULL,
	description TEXT,
	max_bytes INTEGER NOT NULL,
	required BOOLEAN NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('questions');
