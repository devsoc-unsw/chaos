CREATE TABLE ratings (
	id SERIAL PRIMARY KEY,
	application_id INTEGER NOT NULL REFERENCES applications (id),
	rater_user_id INTEGER NOT NULL REFERENCES users (id),
	rating INTEGER NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('ratings');
