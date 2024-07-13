-- Add migration script here
ALTER TABLE campaign_roles
    ALTER COLUMN min_available SET NOT NULL,
    ALTER COLUMN max_available SET NOT NULL,
    ALTER COLUMN finalised SET NOT NULL;
