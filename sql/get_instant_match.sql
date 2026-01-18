-- Function to get an instant match for a user
-- Returns a random eligible user with their persona data

CREATE OR REPLACE FUNCTION get_instant_match(my_id UUID)
RETURNS TABLE (
  other_id UUID,
  other_data JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS other_id,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'identity', u.persona->'identity',
      'networking_goals', u.persona->'networking_goals',
      'skills_possessed', u.persona->'skills_possessed',
      'skills_desired', u.persona->'skills_desired',
      'raw_assets', u.persona->'raw_assets',
      'tagline', u.tagline,
      'location', u.location
    ) AS other_data
  FROM users u
  WHERE 
    u.id != my_id
    AND u.persona IS NOT NULL
    AND u.persona != '{}'::jsonb
    AND u.ingestion_status = 'complete'
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;
