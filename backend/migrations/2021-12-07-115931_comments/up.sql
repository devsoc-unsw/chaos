CREATE TABLE comments (
	id SERIAL PRIMARY KEY,
	application_id INTEGER NOT NULL REFERENCES applications (id),
	commenter_user_id INTEGER NOT NULL REFERENCES users (id),
	description TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('comments');
