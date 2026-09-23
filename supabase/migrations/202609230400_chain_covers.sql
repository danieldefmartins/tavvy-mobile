-- Cover photos for national chains (chains are regular places; this only fills missing covers).
CREATE TABLE IF NOT EXISTS public.chain_covers (
  slug text PRIMARY KEY,
  name_pattern text NOT NULL,          -- case-insensitive regex tested against the start of the place name
  cover_image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chain_covers ENABLE ROW LEVEL SECURITY;
CREATE POLICY chain_covers_read ON public.chain_covers FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.chain_covers (slug, name_pattern, cover_image_url)
SELECT slug, pattern, 'https://tavvy.com/chain-covers/' || slug || '.jpg' FROM (VALUES
  ('applebees', 'applebee'),
  ('buffalo-wild-wings', 'buffalo wild wings'),
  ('burger-king', 'burger king'),
  ('carls-jr', 'carl''?s jr'),
  ('cheesecake-factory', 'cheesecake factory'),
  ('chick-fil-a', 'chick[- ]?fil[- ]?a'),
  ('chipotle', 'chipotle'),
  ('dunkin', 'dunkin'),
  ('five-guys', 'five guys'),
  ('ihop', 'ihop'),
  ('dominos', 'domino''?s'),
  ('in-n-out', 'in[- ]n[- ]out'),
  ('jersey-mikes', 'jersey mike''?s?'),
  ('kfc', 'kfc|kentucky fried chicken'),
  ('little-caesars', 'little caesars'),
  ('mcdonalds', 'mcdonald''?s'),
  ('olive-garden', 'olive garden'),
  ('panera', 'panera'),
  ('pizza-hut', 'pizza hut'),
  ('starbucks', 'starbucks'),
  ('subway', 'subway(?! ?(station|stop|entrance|line|platform))'),
  ('taco-bell', 'taco bell'),
  ('texas-roadhouse', 'texas roadhouse'),
  ('wendys', 'wendy''?s')
) AS v(slug, pattern)
ON CONFLICT (slug) DO UPDATE SET name_pattern = EXCLUDED.name_pattern, cover_image_url = EXCLUDED.cover_image_url;

CREATE OR REPLACE FUNCTION public.chain_cover_for(p_name text) RETURNS text
LANGUAGE sql STABLE SET search_path TO 'public', 'pg_temp' AS $$
  SELECT c.cover_image_url FROM public.chain_covers c
  WHERE p_name ~* ('^\W*(the )?(' || c.name_pattern || ')\M') LIMIT 1;
$$;

-- New or renamed places without a cover pick up the chain cover automatically.
CREATE OR REPLACE FUNCTION public.set_chain_cover() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp' AS $$
BEGIN
  IF NEW.cover_image_url IS NULL OR NEW.cover_image_url = '' THEN
    NEW.cover_image_url := public.chain_cover_for(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_chain_cover ON public.places;
CREATE TRIGGER trg_set_chain_cover BEFORE INSERT OR UPDATE OF name, cover_image_url ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.set_chain_cover();

-- Backfill existing chain places that have no cover (prefiltered so it stays fast).
UPDATE public.places p SET cover_image_url = public.chain_cover_for(p.name)
WHERE (p.cover_image_url IS NULL OR p.cover_image_url = '')
  AND p.name ~* '^\W*(the )?(applebee|buffalo wild wings|burger king|carl''?s jr|cheesecake factory|chick[- ]?fil[- ]?a|chipotle|dunkin|five guys|ihop|domino''?s|in[- ]n[- ]out|jersey mike|kfc|kentucky fried chicken|little caesars|mcdonald''?s|olive garden|panera|pizza hut|starbucks|subway|taco bell|texas roadhouse|wendy''?s)';
