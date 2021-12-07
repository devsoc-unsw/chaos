CREATE TABLE answers (
	id SERIAL PRIMARY KEY,
	application_id INTEGER NOT NULL REFERENCES applications (id),
	question_id INTEGER NOT NULL REFERENCES questions (id),
	description TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('answers');
