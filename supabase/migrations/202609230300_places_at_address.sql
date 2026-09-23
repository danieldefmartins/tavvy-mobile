-- Add-a-place duplicate check: active places at (or within ~170 m of) an address.
CREATE OR REPLACE FUNCTION public.places_at_address(
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL,
  p_street text DEFAULT '', p_city text DEFAULT '')
RETURNS TABLE(id uuid, name text, tavvy_category text, street text, city text, region text, postcode text,
  phone text, website text, cover_image_url text, latitude double precision, longitude double precision, distance_m double precision)
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH q AS (
    SELECT lower(trim(coalesce(p_street, ''))) AS street,
           lower(trim(coalesce(p_city, ''))) AS city,
           substring(lower(trim(coalesce(p_street, ''))) from '^\d+[a-z]?') AS house
  )
  SELECT p.id, p.name::text, p.tavvy_category::text, p.street::text, p.city::text, p.region::text, p.postcode::text,
    p.phone::text, p.website::text, p.cover_image_url::text, p.latitude, p.longitude,
    CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN 6371000.0 * 2 * asin(sqrt(least(1.0, greatest(0.0,
        power(sin(radians(p.latitude - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(p.latitude)) * power(sin(radians(p.longitude - p_lng) / 2), 2)))))
    END AS distance_m
  FROM public.places p, q
  WHERE p.status = 'active'
    AND (
      (p_lat IS NOT NULL AND p_lng IS NOT NULL AND p.latitude BETWEEN p_lat - 0.0015 AND p_lat + 0.0015
        AND p.longitude BETWEEN p_lng - 0.0025 AND p_lng + 0.0025)
      OR (q.house IS NOT NULL AND q.city <> '' AND lower(p.city) = q.city AND lower(p.street) LIKE q.house || ' %')
    )
  ORDER BY distance_m ASC NULLS LAST, p.name
  LIMIT 8;
$function$;
GRANT EXECUTE ON FUNCTION public.places_at_address(double precision, double precision, text, text) TO anon, authenticated;
