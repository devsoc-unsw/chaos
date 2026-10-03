ALTER TABLE application_roles
    DROP CONSTRAINT application_roles_pkey,
    DROP id,
    ADD PRIMARY KEY (application_id, campaign_role_id);

DROP INDEX idx_application_roles_application;

ALTER TABLE application_roles
    ADD role_status application_status NOT NULL DEFAULT 'Pending';
