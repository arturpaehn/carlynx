-- Check the structure of individual_payments table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'individual_payments'
ORDER BY ordinal_position;

-- Check all constraints on individual_payments table
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'individual_payments';

-- Check check constraints specifically
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'individual_payments%';

-- Check enum types and their values (if payment_status is an enum)
SELECT 
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'payment_status'
ORDER BY e.enumsortorder;
