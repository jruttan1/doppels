-- Add columns for normalized resume and LinkedIn data
-- These store the structured JSON from Gemini's initial parsing

ALTER TABLE users
ADD COLUMN IF NOT EXISTS resume_normalized jsonb,
ADD COLUMN IF NOT EXISTS linkedin_normalized jsonb;

-- Add comment explaining the columns
COMMENT ON COLUMN users.resume_normalized IS 'Structured JSON from resume PDF extraction: { name, email, experience[], projects[], education[], skills[], etc. }';
COMMENT ON COLUMN users.linkedin_normalized IS 'Structured JSON from LinkedIn PDF extraction: { name, headline, about, experience[], skills[], etc. }';

-- Create index for faster queries on normalized data (optional, for searching skills etc)
CREATE INDEX IF NOT EXISTS idx_users_resume_skills ON users USING gin ((resume_normalized->'skills'));
CREATE INDEX IF NOT EXISTS idx_users_linkedin_skills ON users USING gin ((linkedin_normalized->'skills'));
