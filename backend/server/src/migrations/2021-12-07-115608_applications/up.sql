CREATE TYPE application_status AS ENUM ('Pending', 'Rejected', 'Success');

CREATE TABLE applications (
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id),
	role_id INTEGER NOT NULL REFERENCES roles (id),
	status application_status NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT diesel_manage_updated_at('applications');
