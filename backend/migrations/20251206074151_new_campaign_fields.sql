-- Add migration script here
ALTER TABLE campaigns
ADD COLUMN interview_period_starts_at TIMESTAMPTZ,
ADD COLUMN interview_period_ends_at TIMESTAMPTZ,
ADD COLUMN interview_format TEXT,
ADD COLUMN outcomes_released_at TIMESTAMPTZ,
ADD COLUMN application_requirements TEXT;
