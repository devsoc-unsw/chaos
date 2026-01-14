-- Add migration script here
ALTER TABLE campaigns
ADD COLUMN max_roles_per_application integer;
