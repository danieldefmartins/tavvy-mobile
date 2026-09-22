-- RV & Camping browse: precomputed category group so the catalog can use a
-- plain indexed equality instead of ~70 leading-wildcard ILIKE clauses that
-- exceeded the statement timeout on the "All" tab (Postgres 57014; the
-- 202609212045 trigram indexes reduced but did not remove it). Mirrors the
-- alias and provider-leaf rules in lib/rvCategories.ts (web + mobile).
-- Additive: a stored generated column keeps itself current on every insert
-- and update, so no backfill job or trigger is needed. Applied 2026-09-22.
CREATE OR REPLACE FUNCTION public.rv_group_for(cat text, sub text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN lower(cat) IN ('rv_park','rv_parks','rv_resort','rv_resorts') OR lower(sub) IN ('rv_park','rv_parks','rv_resort','rv_resorts')
      OR sub ILIKE '%> RV Park' OR sub ILIKE '%> RV Park]' OR sub ILIKE '%> RV Resort' OR sub ILIKE '%> RV Resort]' THEN 'rv-parks'
    WHEN lower(cat) IN ('campground','campgrounds','established_campground','campsite','campsites') OR lower(sub) IN ('campground','campgrounds','established_campground','campsite','campsites')
      OR sub ILIKE '%> Campground' OR sub ILIKE '%> Campground]' OR sub ILIKE '%> Campsite' OR sub ILIKE '%> Campsite]' THEN 'campgrounds'
    WHEN lower(cat) IN ('national_park','national_parks') OR lower(sub) IN ('national_park','national_parks')
      OR sub ILIKE '%> National Park' OR sub ILIKE '%> National Park]' THEN 'national-parks'
    WHEN lower(cat) IN ('glamping','glamping_site','glamping_sites') OR lower(sub) IN ('glamping','glamping_site','glamping_sites')
      OR sub ILIKE '%> Glamping' OR sub ILIKE '%> Glamping]' THEN 'glamping'
    WHEN lower(cat) IN ('beach','beaches') OR lower(sub) IN ('beach','beaches')
      OR sub ILIKE '%> Beach' OR sub ILIKE '%> Beach]' THEN 'beaches'
    WHEN lower(cat) IN ('boondocking','dispersed_camping') OR lower(sub) IN ('boondocking','dispersed_camping')
      OR sub ILIKE '%> Boondocking' OR sub ILIKE '%> Boondocking]' OR sub ILIKE '%> Dispersed Camping' OR sub ILIKE '%> Dispersed Camping]' THEN 'boondocking'
    WHEN lower(cat) IN ('overnight_parking','overnight_parking_spot') OR lower(sub) IN ('overnight_parking','overnight_parking_spot')
      OR sub ILIKE '%> Overnight Parking' OR sub ILIKE '%> Overnight Parking]' THEN 'overnight-parking'
    WHEN lower(cat) IN ('dump_station','dump_stations','rv_dump_station') OR lower(sub) IN ('dump_station','dump_stations','rv_dump_station')
      OR sub ILIKE '%> Dump Station' OR sub ILIKE '%> Dump Station]' OR sub ILIKE '%> RV Dump Station' OR sub ILIKE '%> RV Dump Station]' THEN 'dump-stations'
    WHEN lower(cat) = 'rv_camping' THEN 'rv-camping'
    ELSE NULL END
$$;

ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS rv_group text GENERATED ALWAYS AS (public.rv_group_for(tavvy_category, tavvy_subcategory)) STORED;

CREATE INDEX IF NOT EXISTS idx_places_rv_group_name
  ON public.places (rv_group, status, name, id)
  WHERE rv_group IS NOT NULL;
