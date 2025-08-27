-- Fix for increment_listing_views function - add search_path security
-- This fixes the "Function Search Path Mutable" lint warning
-- Only adds SET search_path, keeps everything else exactly the same

CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id_input uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
begin
  update public.listings
  set views = views + 1
  where id = listing_id_input;
end;
$function$;

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.increment_listing_views(uuid) IS 
'Increments views count for a listing. Fixed with search_path security to prevent injection attacks.';
