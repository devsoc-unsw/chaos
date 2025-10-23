-- Add migration script here
ALTER TABLE campaigns ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;