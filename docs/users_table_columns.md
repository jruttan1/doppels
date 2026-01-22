# Users Table - Complete Column List

Based on code analysis, here are all columns being used:

## Core Identity
- `id` (uuid, PK) - Linked to Supabase Auth
- `name` (text) - Display name
- `email` (text) - User email
- `location` (text) - User location

## Profile Data
- `tagline` (text) - One sentence description (like LinkedIn headline)
- `persona` (jsonb) - Complete persona JSON with identity, skills, raw_assets, etc.

## PDF/Text Extraction
- `resume_text` (text) - Raw text extracted from resume PDF via Gemini
- `resume_normalized` (jsonb) - Structured JSON from resume: { name, email, experience[], projects[], education[], skills[], etc. }
- `linkedin_text` (text) - Raw text extracted from LinkedIn PDF via Gemini
- `linkedin_normalized` (jsonb) - Structured JSON from LinkedIn: { name, headline, about, experience[], skills[], etc. }

## URLs
- `github_url` (text) - GitHub profile URL
- `linkedin_url` (text) - LinkedIn profile URL
- `google_calendar_url` (text) - Google Calendar URL

## User Input Data
- `networking_goals` (text[] or jsonb) - Array of networking goals
- `voice_signature` (text) - User's voice snippet/typing style
- `skills` (text[] or jsonb) - Array of skills possessed
- `skills_desired` (text[] or jsonb) - Array of skills desired (for hiring/cofounder)
- `location_desired` (text[] or jsonb) - Array of desired locations

## Processing Status
- `ingestion_status` (text) - Status: 'pending', 'complete', or 'failed'
- `x_summary` (jsonb) - Processed X/Twitter analysis data

## SQL to create missing columns:

```sql
-- Add any missing columns (adjust types as needed)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS resume_text text,
  ADD COLUMN IF NOT EXISTS resume_normalized jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_text text,
  ADD COLUMN IF NOT EXISTS linkedin_normalized jsonb,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS google_calendar_url text,
  ADD COLUMN IF NOT EXISTS networking_goals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_signature text,
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skills_desired jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_desired jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ingestion_status text DEFAULT 'pending',
```
