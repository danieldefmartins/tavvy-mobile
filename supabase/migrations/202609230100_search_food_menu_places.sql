-- Restaurants mode for the Food Menu tool: places that have a published food menu,
-- searchable by dish/place name and location, with the same guards as search_food_menus.
CREATE OR REPLACE FUNCTION public.search_food_menu_places(
  search_text text DEFAULT '', location_text text DEFAULT '',
  center_lat double precision DEFAULT NULL, center_lon double precision DEFAULT NULL,
  radius_km double precision DEFAULT 25, page_offset integer DEFAULT 0)
RETURNS TABLE(place_id uuid, place_name text, slug text, city text, state text,
  cover_image_url text, dish_count bigint, sample_dishes text[], distance_km double precision)
LANGUAGE plpgsql STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF search_text IS NULL OR location_text IS NULL OR radius_km IS NULL OR page_offset IS NULL OR
     (center_lat IS NOT NULL AND center_lat::text IN ('NaN', 'Infinity', '-Infinity')) OR
     (center_lon IS NOT NULL AND center_lon::text IN ('NaN', 'Infinity', '-Infinity')) OR
     radius_km::text IN ('NaN', 'Infinity', '-Infinity') OR
     (center_lat IS NULL) <> (center_lon IS NULL) OR
     center_lat NOT BETWEEN -90 AND 90 OR center_lon NOT BETWEEN -180 AND 180 OR
     radius_km NOT BETWEEN 1 AND 200 OR page_offset NOT BETWEEN 0 AND 10000 THEN
    RAISE EXCEPTION 'Invalid search bounds';
  END IF;
  RETURN QUERY
  WITH dishes AS (
    SELECT m.place_id, i.name::text AS item_name, i.image_url::text AS item_image,
      i.food_search_document AS document, i.sort_order
    FROM public.menu_items i
    JOIN public.menu_categories c ON c.id = i.category_id
    JOIN public.menus m ON m.id = c.menu_id
    WHERE i.is_available IS TRUE
      AND (i.place_id IS NULL OR i.place_id = m.place_id)
      AND coalesce(to_jsonb(m)->>'is_published', 'true') <> 'false'
      AND m.is_active IS TRUE
  ), matched AS (
    SELECT d.place_id, count(*) AS dish_count,
      (array_agg(d.item_name ORDER BY d.sort_order NULLS LAST, d.item_name))[1:3] AS sample_dishes,
      (array_agg(d.item_image ORDER BY d.sort_order NULLS LAST, d.item_name) FILTER (WHERE d.item_image IS NOT NULL))[1] AS dish_image
    FROM dishes d
    WHERE trim(search_text) = '' OR d.document @@ plainto_tsquery('simple', left(search_text, 120))
    GROUP BY d.place_id
  ), scoped AS (
    SELECT p.id AS place_id, p.name::text AS place_name, (to_jsonb(p)->>'slug') AS slug,
      (to_jsonb(p)->>'city') AS city,
      coalesce(nullif(to_jsonb(p)->>'region', ''), to_jsonb(p)->>'state') AS state,
      coalesce(nullif(to_jsonb(p)->>'cover_image_url', ''), mt.dish_image) AS cover_image_url,
      mt.dish_count, mt.sample_dishes,
      CASE WHEN center_lat IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        THEN 6371.0 * 2 * asin(sqrt(least(1.0, greatest(0.0,
          power(sin(radians(p.latitude - center_lat) / 2), 2) +
          cos(radians(center_lat)) * cos(radians(p.latitude)) *
          power(sin(radians(p.longitude - center_lon) / 2), 2))))) END AS distance_km
    FROM matched mt
    JOIN public.places p ON p.id = mt.place_id
    WHERE p.status = 'active'
      AND lower(concat_ws(' ', to_jsonb(p)->>'tavvy_category', to_jsonb(p)->>'category', to_jsonb(p)->>'categories', to_jsonb(p)->>'primary_category'))
        ~ '\m(restaurant|restaurants|food|cafe|cafes|café|coffee|bakery|bakeries|bar|bars|pub|pubs|dining|pizza|deli)\M'
      AND (trim(location_text) = '' OR EXISTS (
        SELECT 1 FROM (VALUES
          (concat_ws(', ', to_jsonb(p)->>'city', to_jsonb(p)->>'region', to_jsonb(p)->>'postal_code', to_jsonb(p)->>'postcode', to_jsonb(p)->>'zip')),
          (concat_ws(', ', to_jsonb(p)->>'city', to_jsonb(p)->>'state', to_jsonb(p)->>'postal_code', to_jsonb(p)->>'postcode', to_jsonb(p)->>'zip'))
        ) AS location_labels(label)
        WHERE position(lower(trim(location_text)) in lower(location_labels.label)) > 0))
  )
  SELECT s.place_id, s.place_name, s.slug, s.city, s.state, s.cover_image_url, s.dish_count, s.sample_dishes, s.distance_km
  FROM scoped s
  WHERE center_lat IS NULL OR s.distance_km <= radius_km
  ORDER BY s.distance_km ASC NULLS LAST, s.place_name, s.place_id
  LIMIT 30 OFFSET page_offset;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.search_food_menu_places(text, text, double precision, double precision, double precision, integer) TO anon, authenticated;
