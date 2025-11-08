UPDATE campaigns SET published = FALSE WHERE published IS NULL;
ALTER TABLE campaigns ALTER COLUMN published SET NOT NULL;


-- ALTER TABLE campaigns ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;