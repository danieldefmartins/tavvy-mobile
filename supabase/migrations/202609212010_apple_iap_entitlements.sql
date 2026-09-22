-- Tracks which billing rail activated a subscription, so Apple-verified
-- IAP purchases and Stripe purchases can share the same entitlement
-- tables (user_subscriptions, pro_providers) without one overwriting the
-- other's identifiers. Purely additive.

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe', 'apple', 'google')),
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_apple_original_txn_idx
  ON public.user_subscriptions (apple_original_transaction_id)
  WHERE apple_original_transaction_id IS NOT NULL;

ALTER TABLE public.pro_providers
  ADD COLUMN IF NOT EXISTS subscription_source TEXT NOT NULL DEFAULT 'stripe' CHECK (subscription_source IN ('stripe', 'apple', 'google')),
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS pro_providers_apple_original_txn_idx
  ON public.pro_providers (apple_original_transaction_id)
  WHERE apple_original_transaction_id IS NOT NULL;
