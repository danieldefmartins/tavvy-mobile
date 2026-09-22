-- App Store Server Notifications V2 audit log. Every notification Apple
-- delivers to the apple-server-notifications Edge Function is stored here
-- before it is applied, so redeliveries are idempotent (notification_uuid)
-- and renewal / refund / billing history can be reconciled later.
-- Purely additive. Service-role only: no client may read or write it.

CREATE TABLE IF NOT EXISTS public.apple_server_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_uuid TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL,
  subtype TEXT,
  environment TEXT,
  original_transaction_id TEXT,
  transaction_id TEXT,
  product_id TEXT,
  user_id UUID,                      -- resolved Tavvy owner, if any (no FK: the user may be deleted later)
  signed_date TIMESTAMPTZ,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  outcome TEXT,                      -- active | expired | conflict | unknown_owner | no_pros_profile | recorded | unknown_product | error
  error TEXT
);

CREATE INDEX IF NOT EXISTS apple_server_notifications_txn_idx
  ON public.apple_server_notifications (original_transaction_id, received_at DESC);
CREATE INDEX IF NOT EXISTS apple_server_notifications_unresolved_idx
  ON public.apple_server_notifications (received_at DESC)
  WHERE outcome IN ('unknown_owner', 'error');

ALTER TABLE public.apple_server_notifications ENABLE ROW LEVEL SECURITY;
-- No policies: unreadable/unwritable by anon or authenticated roles.
