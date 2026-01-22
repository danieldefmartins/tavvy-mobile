-- =============================================
-- STORY NOTIFICATIONS & ANALYTICS TABLES
-- =============================================
-- Migration for push notifications and analytics tracking

-- =============================================
-- PUSH NOTIFICATION TABLES
-- =============================================

-- User push tokens for sending notifications
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  new_stories BOOLEAN DEFAULT true,
  story_expiring BOOLEAN DEFAULT true,
  place_trending BOOLEAN DEFAULT true,
  new_followers BOOLEAN DEFAULT true,
  story_milestones BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User place follows (for story notifications)
CREATE TABLE IF NOT EXISTS user_place_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  notify_stories BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Story view events for detailed analytics
CREATE TABLE IF NOT EXISTS story_view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES place_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  watch_duration_ms INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  tapped_forward BOOLEAN DEFAULT false,
  tapped_back BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  visited_profile BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story share events
CREATE TABLE IF NOT EXISTS story_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES place_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovery events for tracking user interactions
CREATE TABLE IF NOT EXISTS discovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'quick_find_tap', 
    'happening_now_tap', 
    'story_ring_tap', 
    'trending_tap', 
    'search_query'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HIGHLIGHT ITEMS TABLE (if not exists)
-- =============================================

CREATE TABLE IF NOT EXISTS place_story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES place_story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES place_stories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Push tokens indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = true;

-- Place follows indexes
CREATE INDEX IF NOT EXISTS idx_place_follows_user ON user_place_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_place_follows_place ON user_place_follows(place_id);
CREATE INDEX IF NOT EXISTS idx_place_follows_notify ON user_place_follows(notify_stories) WHERE notify_stories = true;

-- Story view events indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_view_events(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user ON story_view_events(user_id);
CREATE INDEX IF NOT EXISTS idx_story_views_created ON story_view_events(created_at);

-- Discovery events indexes
CREATE INDEX IF NOT EXISTS idx_discovery_type ON discovery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_discovery_user ON discovery_events(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_created ON discovery_events(created_at);

-- Highlight items indexes
CREATE INDEX IF NOT EXISTS idx_highlight_items_highlight ON place_story_highlight_items(highlight_id);
CREATE INDEX IF NOT EXISTS idx_highlight_items_story ON place_story_highlight_items(story_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to increment story views
CREATE OR REPLACE FUNCTION increment_story_views(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE place_stories 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get users to notify for a new story
CREATE OR REPLACE FUNCTION get_story_notification_recipients(p_place_id TEXT)
RETURNS TABLE(user_id UUID, push_token TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    upf.user_id,
    upt.push_token
  FROM user_place_follows upf
  JOIN user_push_tokens upt ON upt.user_id = upf.user_id
  JOIN user_notification_preferences unp ON unp.user_id = upf.user_id
  WHERE upf.place_id = p_place_id
    AND upf.notify_stories = true
    AND upt.is_active = true
    AND unp.new_stories = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_place_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Push tokens policies
CREATE POLICY "Users can manage their own push tokens"
  ON user_push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Place follows policies
CREATE POLICY "Users can manage their own follows"
  ON user_place_follows FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view follow counts"
  ON user_place_follows FOR SELECT
  USING (true);

-- Story view events policies
CREATE POLICY "Anyone can insert view events"
  ON story_view_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own events"
  ON story_view_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Story share events policies
CREATE POLICY "Anyone can insert share events"
  ON story_share_events FOR INSERT
  WITH CHECK (true);

-- Discovery events policies
CREATE POLICY "Anyone can insert discovery events"
  ON discovery_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own discovery events"
  ON discovery_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Highlight items policies
CREATE POLICY "Anyone can view highlight items"
  ON place_story_highlight_items FOR SELECT
  USING (true);

CREATE POLICY "Place owners can manage highlight items"
  ON place_story_highlight_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM place_story_highlights h
      WHERE h.id = highlight_id
      -- Add owner check here based on your business logic
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger for push tokens
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();

-- Update timestamp trigger for notification preferences
CREATE TRIGGER notification_prefs_updated
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();
