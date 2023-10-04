ALTER TABLE IF EXISTS questions
    ADD COLUMN role_id INTEGER DEFAULT NULL;

-- Make questions currently assigned to one role, uncommon
UPDATE questions SET role_id=role_ids[1] WHERE array_length(role_ids, 1) = 1;

-- No need to change questions currently assigned to multiple roles, as role_id is NULL by default, thus making them common

ALTER TABLE IF EXISTS questions
    DROP COLUMN role_ids;
