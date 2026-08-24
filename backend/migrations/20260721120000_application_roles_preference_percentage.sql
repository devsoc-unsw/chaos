ALTER TABLE application_roles RENAME COLUMN preference TO preference_percentage;

CREATE OR REPLACE FUNCTION check_application_roles_percentage_sum()
RETURNS TRIGGER AS $$
DECLARE
    total INTEGER;
BEGIN
    IF NEW.submitted IS TRUE AND OLD.submitted IS NOT TRUE THEN
        SELECT COALESCE(SUM(preference_percentage), 0) INTO total
        FROM application_roles
        WHERE application_id = NEW.id;

        IF total <> 100 THEN
            RAISE EXCEPTION 'application % role preference_percentage must sum to 100, got %', NEW.id, total;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_application_roles_percentage_sum
AFTER UPDATE OF submitted ON applications
FOR EACH ROW
EXECUTE FUNCTION check_application_roles_percentage_sum();
