-- Add UNIQUE constraint to prevent duplicate simulations between the same participants
-- This prevents race conditions where two concurrent requests create the same simulation

-- First, create a function to get the canonical pair (always smaller ID first)
-- This ensures (A,B) and (B,A) are treated as the same pair
CREATE OR REPLACE FUNCTION simulation_participant_pair(p1 uuid, p2 uuid)
RETURNS text AS $$
BEGIN
  IF p1 < p2 THEN
    RETURN p1::text || '-' || p2::text;
  ELSE
    RETURN p2::text || '-' || p1::text;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a generated column for the canonical pair
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS participant_pair text
GENERATED ALWAYS AS (simulation_participant_pair(participant1, participant2)) STORED;

-- Add unique constraint on the pair
-- Using DO block to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_simulation_pair'
  ) THEN
    ALTER TABLE simulations ADD CONSTRAINT unique_simulation_pair UNIQUE (participant_pair);
  END IF;
END $$;

-- Add indexes for faster participant lookups
CREATE INDEX IF NOT EXISTS idx_simulations_participant1 ON simulations (participant1);
CREATE INDEX IF NOT EXISTS idx_simulations_participant2 ON simulations (participant2);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations (status);

-- Add comment
COMMENT ON COLUMN simulations.participant_pair IS 'Canonical participant pair for uniqueness constraint. Format: smaller_uuid-larger_uuid';
