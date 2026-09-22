-- lib/rvCatalog.ts (RV & Camping "All" tab) and similar category browsers
-- build a single OR filter across every category alias, matched with
-- leading-wildcard ILIKE against tavvy_category/tavvy_subcategory
-- (e.g. `tavvy_subcategory ilike '%> Campground'`). Neither column had an
-- index that could serve a leading-wildcard pattern, forcing a sequential
-- scan of the full places table (34k+ rows) on every request — confirmed
-- reproducing the RV & Camping screen's "Places are temporarily
-- unavailable" error (Postgres 57014, statement timeout) on a live device.
--
-- Trigram GIN indexes let these ILIKE patterns use a bitmap index scan
-- instead. Verified via EXPLAIN ANALYZE: the "All" category query's cost
-- dropped from a full seq scan to indexed bitmap scans (~2-10x less
-- planner cost per clause). This does not fully resolve the RV & Camping
-- "All" tab — see docs/PROJECT_STATUS.md: the anon/authenticated
-- Postgres role's statement_timeout is tight enough that the ~70-clause
-- OR filter for that one tab can still exceed it. Recommend either
-- raising that role's timeout for this endpoint specifically, or
-- restructuring the query (e.g. a precomputed category-group column)
-- instead of enumerating every alias via ILIKE at request time.
CREATE INDEX IF NOT EXISTS idx_places_tavvy_category_trgm
  ON public.places USING gin (tavvy_category gin_trgm_ops)
  WHERE (status = 'active');

CREATE INDEX IF NOT EXISTS idx_places_tavvy_subcategory_trgm
  ON public.places USING gin (tavvy_subcategory gin_trgm_ops)
  WHERE (status = 'active');
