# Tavvy eCard - Comprehensive Feature Task List

**Created:** January 23, 2026  
**Status:** In Progress

---

## 🔴 CRITICAL FIXES (Priority 1)

### 1. Crown Reviews Badge
- [ ] **Restore crown badge for Tavvy reviews** - Most important feature
- [ ] Crown should appear on cards with Tavvy reviews
- [ ] Tap crown to see reviews
- [ ] Gold crown styling with animation

### 2. Bio Character Limit
- [ ] **Increase bio limit to 300 characters** (currently limited)
- [ ] Update mobile app validation
- [ ] Update database schema if needed
- [ ] Update web card display

### 3. Web Card Not Showing (New System)
- [ ] **Fix web card to display new block-based cards**
- [ ] Update `[username].tsx` to render blocks
- [ ] Ensure template styling is applied
- [ ] Test with real card data

### 4. Address Fields with Autocomplete
- [ ] **Add address fields to profile**
  - [ ] Address (line 1)
  - [ ] Address 2 (optional)
  - [ ] City
  - [ ] State (2-letter abbreviation, UPPERCASE)
  - [ ] Zip Code
  - [ ] Country
- [ ] **Google Places Autocomplete integration**
- [ ] **Standard formatting:**
  - [ ] First letter of each word UPPERCASE, rest lowercase
  - [ ] State always 2-letter abbreviation, both UPPERCASE
  - [ ] Display format: `433 Plaza Real Suite 275` / `Boca Raton, FL 33432`
- [ ] Update database schema for address fields
- [ ] Display address on web card

### 5. Featured Socials Row (Customizable)
- [ ] **Social icons row under bio is customizable**
- [ ] User can choose which icons appear (up to 6)
- [ ] **Exclusive display:** If a platform is in the icon row, it won't appear in links list below
- [ ] Drag to reorder featured socials
- [ ] Add/remove from featured row

### 6. Profile Photo Size Customization
- [ ] **Allow users to increase profile photo size**
- [ ] Size options: Small (100px), Medium (140px), Large (180px), Extra Large (220px)
- [ ] Important for realtors and other pros who want prominent photos
- [ ] Size selector in profile/appearance settings
- [ ] Update mobile app preview to reflect size
- [ ] Update web card to use custom size
- [ ] Store preference in database (profile_photo_size column)

---

## 🟡 NEW BLOCK TYPES (Priority 2)

### 7. YouTube Video Block
- [ ] Create YouTube block type in config
- [ ] Video URL input field
- [ ] Thumbnail preview in editor
- [ ] Embedded player on web card
- [ ] Support for YouTube Shorts

### 8. Gallery Block
- [ ] Create Gallery block type
- [ ] Multi-image upload (up to 10 images)
- [ ] Grid layout preview
- [ ] Lightbox view on web card
- [ ] Image captions (optional)

### 9. Testimonials Block
- [ ] Create Testimonials block type
- [ ] Add testimonial: Name, text, rating (stars), photo (optional)
- [ ] Carousel display on web card
- [ ] Up to 10 testimonials

### 10. Form Block
- [ ] Create Form block type
- [ ] Customizable fields: Name, Email, Phone, Message
- [ ] Form submissions sent to card owner's email
- [ ] Thank you message customization
- [ ] Spam protection (honeypot)

---

## 🟢 PRO CREDENTIALS BLOCK (Priority 3)

### 11. Credentials Block (Pro Section)
- [ ] Create Credentials block type
- [ ] Fields:
  - [ ] Schedule/Book action button (link to booking URL)
  - [ ] Licenses (list with license numbers)
  - [ ] Certifications (list with dates)
  - [ ] Years in business
  - [ ] Insurance toggle (Yes/No with optional details)
  - [ ] Service Area (text or map integration)
- [ ] Professional badge styling
- [ ] Verification indicators (future)

---

## 🔵 TAVVY-EXCLUSIVE FEATURES (Priority 4)

### 12. Save to Tavvy Wallet
- [ ] **"Save to Wallet" button on web card**
- [ ] Connect to existing Tavvy Wallet system
- [ ] Customers can save favorite pros
- [ ] Organize by category (Plumber, Realtor, etc.)
- [ ] Re-contact later functionality
- [ ] Deep link to Tavvy app

### 13. Review Request Button
- [ ] **"Leave a Tavvy Review" button**
- [ ] One-tap to open review form
- [ ] Pre-filled with pro's info
- [ ] Ties into Tavvy review system
- [ ] Growth + trust builder

### 14. Smart Follow-Up (Later Phase)
- [ ] "Remind me in 6 months" option
- [ ] "Contact again" button
- [ ] Push notification integration
- [ ] Great for service pros

---

## 🟣 TEMPLATES (Priority 5)

### 15. Add More Templates
Based on reference images provided:

- [ ] **Kids/Fun Template** - Colorful, playful, cartoon-style
  - Light blue background with confetti/doodles
  - Rounded colorful buttons (yellow, pink, blue)
  - Fun icons and emojis
  
- [ ] **Creator/Influencer Template** - Neon, vibrant, social-focused
  - Pink/purple gradient with stars
  - Rainbow profile ring
  - Follower count badge
  - Large social icons (TikTok, Instagram, YouTube)
  - "Book Me" and "Shop" buttons
  
- [ ] **Minimal White Template** - Clean, professional
  - White/light gray background
  - Subtle shadows
  - Teal accent color
  - Contact info in list format
  - Small social icons
  
- [ ] **Modern Professional Template** - Card on dark background
  - Dark blurred background
  - White card overlay
  - Teal buttons
  - "Save Contact" and "View Portfolio" CTAs
  
- [ ] **Luxury Gold Template** - Premium, elegant
  - Dark navy/black background
  - Gold ornate borders and flourishes
  - Gold text and icons
  - Serif typography
  - Premium feel

### 16. Template Categories
- [ ] Free Templates (6)
- [ ] Pro Templates (6+)
- [ ] Template preview in gallery
- [ ] Color scheme customization per template

---

## 🗄️ DATABASE SCHEMA UPDATES

**Run these SQL commands in Supabase SQL Editor:**

```sql
-- Add template columns to digital_cards (if not already added)
ALTER TABLE digital_cards ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'classic-blue';
ALTER TABLE digital_cards ADD COLUMN IF NOT EXISTS color_scheme_id VARCHAR(50) DEFAULT 'blue';
ALTER TABLE digital_cards ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create card_blocks table for block-based cards
CREATE TABLE IF NOT EXISTS card_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES digital_cards(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_card_blocks_card_id ON card_blocks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_blocks_sort_order ON card_blocks(card_id, sort_order);

-- Enable RLS
ALTER TABLE card_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_blocks
CREATE POLICY "Users can view their own card blocks" ON card_blocks
  FOR SELECT USING (
    card_id IN (SELECT id FROM digital_cards WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own card blocks" ON card_blocks
  FOR INSERT WITH CHECK (
    card_id IN (SELECT id FROM digital_cards WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own card blocks" ON card_blocks
  FOR UPDATE USING (
    card_id IN (SELECT id FROM digital_cards WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own card blocks" ON card_blocks
  FOR DELETE USING (
    card_id IN (SELECT id FROM digital_cards WHERE user_id = auth.uid())
  );

-- Public can view blocks for published cards
CREATE POLICY "Public can view blocks for published cards" ON card_blocks
  FOR SELECT USING (
    card_id IN (SELECT id FROM digital_cards WHERE is_published = true)
  );

-- Create subscriptions table for premium features
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());
```

---

## 💳 STRIPE INTEGRATION (Priority 6)

### 14. Stripe Setup Requirements
**What I need from you:**
- [ ] Stripe Account (create at stripe.com if not done)
- [ ] Stripe Publishable Key (pk_live_xxx or pk_test_xxx)
- [ ] Stripe Secret Key (sk_live_xxx or sk_test_xxx)
- [ ] Webhook endpoint secret (whsec_xxx)

**What I will implement:**
- [ ] Stripe SDK integration in mobile app
- [ ] Payment flow for premium subscription
- [ ] Webhook handler for subscription events
- [ ] Premium status check before saving with premium blocks
- [ ] Subscription management (cancel, upgrade)
- [ ] 7-day free trial support

### 15. Pricing Structure
- [ ] Monthly: $4.99/month
- [ ] Yearly: $29.99/year ($2.49/month, 50% savings)
- [ ] 7-day free trial for both plans

---

## 🌐 WEB CARD UPDATES (Priority 7)

### 16. Update Web Card Rendering
- [ ] Render all block types dynamically
- [ ] Apply template styling
- [ ] YouTube embed player
- [ ] Gallery lightbox
- [ ] Testimonials carousel
- [ ] Form submission handling
- [ ] Credentials display
- [ ] Save to Wallet button
- [ ] Review Request button
- [ ] Crown badge for reviewed pros

---

## 📱 QR CODE FEATURE (Priority 7)

### 17. QR Code Generation & Sharing
- [ ] **Generate QR code for each card**
- [ ] QR code links to tavvy.com/username
- [ ] Display QR code in mobile app dashboard
- [ ] Display QR code on web card page
- [ ] **Download options:**
  - [ ] Download as PNG (high resolution)
  - [ ] Download as SVG (scalable)
  - [ ] Download as PDF (print-ready)
- [ ] **Customization:**
  - [ ] QR code with Tavvy logo in center
  - [ ] Match card color scheme
  - [ ] Optional: custom background
- [ ] **Share options:**
  - [ ] Share QR code image directly
  - [ ] Copy QR code to clipboard
  - [ ] Print-friendly version
- [ ] **Use cases:**
  - [ ] Print on business cards
  - [ ] Add to email signatures
  - [ ] Display at events/booths
  - [ ] Add to marketing materials

---

## 📊 ANALYTICS (Future)

### 18. Card Analytics
- [ ] Total views
- [ ] Link clicks (per link)
- [ ] Save to Wallet count
- [ ] Review requests sent
- [ ] Geographic data (optional)

---

## ✅ COMPLETED TASKS

- [x] Block-based eCard system created
- [x] Linktree-style onboarding flow
- [x] Template gallery
- [x] Color scheme picker
- [x] Dashboard with Links/Appearance/Analytics tabs
- [x] Premium upsell modal
- [x] Direct URL format (tavvy.com/username)
- [x] Reserved usernames list
- [x] Confetti celebration screen
- [x] eCard in second position on Apps screen

---

## 📝 NOTES

- Crown badge is the most important feature - ties into Tavvy's core review system
- Save to Wallet creates repeat usage and user retention
- Form block enables lead generation for pros
- Credentials block builds trust for service professionals
- Templates should cover different use cases: personal, business, creator, luxury

---

## 🚀 IMPLEMENTATION ORDER

1. Fix critical issues (Crown, Bio, Web Card)
2. Add new block types (YouTube, Gallery, Testimonials, Form)
3. Add Credentials block
4. Add Tavvy-exclusive features (Wallet, Review Request)
5. Add more templates
6. Update web card rendering
7. Stripe integration
8. Testing and polish
