-- Delete the boat listing from DEV database
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kjntriyhqpfxqciaxbpj/sql

DELETE FROM external_listings 
WHERE source = 'dream_machines_texas';

-- Check it's deleted
SELECT COUNT(*) FROM external_listings WHERE source = 'dream_machines_texas';
