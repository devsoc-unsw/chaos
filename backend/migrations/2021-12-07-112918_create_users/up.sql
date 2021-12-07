CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	email TEXT NOT NULL,
	google_token TEXT NOT NULL,
	zid TEXT NOT NULL,
	display_name TEXT NOT NULL,
	degree_name TEXT NOT NULL,
	degree_starting_year INTEGER NOT NULL,
	superuser BOOLEAN NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('users');
