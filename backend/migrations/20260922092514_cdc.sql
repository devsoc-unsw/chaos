ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE organisations REPLICA IDENTITY FULL;
ALTER TABLE organisation_members REPLICA IDENTITY FULL;
ALTER TABLE campaigns REPLICA IDENTITY FULL;
ALTER TABLE campaign_roles REPLICA IDENTITY FULL;
ALTER TABLE applications REPLICA IDENTITY FULL;
ALTER TABLE questions REPLICA IDENTITY FULL;
ALTER TABLE campaign_rating_categories REPLICA IDENTITY FULL;
ALTER TABLE application_ratings REPLICA IDENTITY FULL;
ALTER TABLE application_rating_category_ratings REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE answers REPLICA IDENTITY FULL;
ALTER TABLE offers REPLICA IDENTITY FULL;
ALTER TABLE email_templates REPLICA IDENTITY FULL;


-- Publication for the Postgres -> SpiceDB ETL pipeline. Covers exactly the
-- tables the SpiceDBDestination consumes; nothing else pays WAL overhead.
CREATE PUBLICATION spicedb_sync FOR TABLE
    users,
    organisations,
    organisation_members,
    campaigns,
    campaign_roles,
    applications,
    questions,
    campaign_rating_categories,
    application_ratings,
    application_rating_category_ratings,
    comments,
    answers,
    offers,
    email_templates;