CREATE TYPE organisation_role AS ENUM ('User', 'Admin');

ALTER TABLE organisation_admins RENAME TO organisation_members;
ALTER TABLE organisation_members ADD COLUMN role organisation_role DEFAULT 'User' NOT NULL;