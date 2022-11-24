ALTER TABLE applications
ADD COLUMN private_status application_status;

UPDATE applications
SET private_status = status;

ALTER TABLE applications
ALTER COLUMN status
SET NOT NULL;
