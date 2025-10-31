-- Fix published column to be NOT NULL
-- First, set any NULL values to FALSE
UPDATE campaigns SET published = FALSE WHERE published IS NULL;
-- Then add the NOT NULL constraint
ALTER TABLE campaigns ALTER COLUMN published SET NOT NULL;
