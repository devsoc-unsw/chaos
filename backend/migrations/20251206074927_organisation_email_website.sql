-- Add migration script here
ALTER TABLE organisations
ADD COLUMN contact_email TEXT NOT NULL,
ADD COLUMN website_url TEXT;