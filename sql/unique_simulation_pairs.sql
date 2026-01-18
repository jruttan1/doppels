-- Enforce that each pair of users can only have ONE simulation between them
-- This prevents duplicate conversations in either direction

-- First, create a function to generate a consistent pair key (smaller UUID first)
CREATE OR REPLACE FUNCTION simulation_pair_key(p1 uuid, p2 uuid) 
RETURNS text AS $$
BEGIN
  IF p1 < p2 THEN
    RETURN p1::text || '_' || p2::text;
  ELSE
    RETURN p2::text || '_' || p1::text;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a generated column for the pair key
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS pair_key text 
GENERATED ALWAYS AS (simulation_pair_key(participant1, participant2)) STORED;

-- Create unique index on the pair key
-- This ensures only ONE simulation per pair of users regardless of direction
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulations_unique_pair 
ON simulations (pair_key);

-- Alternative: If you want to keep the best simulation for each pair,
-- you can add a partial unique index instead:
-- CREATE UNIQUE INDEX idx_simulations_unique_pair 
-- ON simulations (pair_key) 
-- WHERE score IS NOT NULL;

-- To check existing duplicates before adding constraint:
-- SELECT pair_key, COUNT(*) 
-- FROM simulations 
-- GROUP BY pair_key 
-- HAVING COUNT(*) > 1;

-- To remove duplicates (keep the one with highest score):
-- DELETE FROM simulations a
-- USING simulations b
-- WHERE a.pair_key = b.pair_key 
-- AND a.id < b.id
-- AND (a.score IS NULL OR a.score < COALESCE(b.score, 0));
