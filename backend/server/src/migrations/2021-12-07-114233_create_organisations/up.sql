CREATE TABLE organisations (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	logo TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('organisations');
