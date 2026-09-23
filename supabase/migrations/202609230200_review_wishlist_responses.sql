-- "What do you want to review next?" survey shown on the Tools screen (mobile + web).
CREATE TABLE IF NOT EXISTS public.review_wishlist_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  missing_places text NULL CHECK (char_length(missing_places) <= 1000),
  product_categories text[] NOT NULL DEFAULT '{}',
  other_text text NULL CHECK (char_length(other_text) <= 500),
  locale text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_wishlist_responses ENABLE ROW LEVEL SECURITY;
-- Anyone can answer (signed in or not); a signed-in answer must carry the caller's own id.
CREATE POLICY review_wishlist_insert ON public.review_wishlist_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
-- Nobody reads through the API except the service role (dashboard / agents).
GRANT INSERT ON public.review_wishlist_responses TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_review_wishlist_created ON public.review_wishlist_responses (created_at DESC);
