-- Step 1: Check what triggers exist on simulations table
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'simulations'::regclass;

-- Step 2: If there's a trigger causing the issue, drop it
-- The simulations table shouldn't have triggers that reference 'name' field
-- since simulations doesn't have a name column

-- Drop any triggers on simulations table (they shouldn't be there)
DROP TRIGGER IF EXISTS sync_simulations_to_users ON simulations;
DROP TRIGGER IF EXISTS on_simulations_insert ON simulations;
DROP TRIGGER IF EXISTS simulations_trigger ON simulations;

-- If you need to keep a trigger, recreate it without the 'name' reference:
-- Example (if you need to sync something):
-- CREATE OR REPLACE FUNCTION handle_simulation_insert()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Do something without referencing new.name
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER on_simulations_insert
--   AFTER INSERT ON simulations
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_simulation_insert();
