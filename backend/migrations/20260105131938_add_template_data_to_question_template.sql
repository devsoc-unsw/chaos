-- Add JSONB columns to store template header and content rows
ALTER TABLE question_template
ADD COLUMN header_row JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN content_row JSONB NOT NULL DEFAULT '[]'::jsonb;

