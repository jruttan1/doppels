-- Check the actual structure of the simulations table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'simulations'
ORDER BY ordinal_position;

-- Check for any constraints that might reference 'name'
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'simulations'::regclass;
