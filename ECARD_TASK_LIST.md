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

---

## 🟡 NEW BLOCK TYPES (Priority 2)

### 4. YouTube Video Block
- [ ] Create YouTube block type in config
- [ ] Video URL input field
- [ ] Thumbnail preview in editor
- [ ] Embedded player on web card
- [ ] Support for YouTube Shorts

### 5. Gallery Block
- [ ] Create Gallery block type
- [ ] Multi-image upload (up to 10 images)
- [ ] Grid layout preview
- [ ] Lightbox view on web card
- [ ] Image captions (optional)

### 6. Testimonials Block
- [ ] Create Testimonials block type
- [ ] Add testimonial: Name, text, rating (stars), photo (optional)
- [ ] Carousel display on web card
- [ ] Up to 10 testimonials

### 7. Form Block
- [ ] Create Form block type
- [ ] Customizable fields: Name, Email, Phone, Message
- [ ] Form submissions sent to card owner's email
- [ ] Thank you message customization
- [ ] Spam protection (honeypot)

---

## 🟢 PRO CREDENTIALS BLOCK (Priority 3)

### 8. Credentials Block (Pro Section)
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

### 9. Save to Tavvy Wallet
- [ ] **"Save to Wallet" button on web card**
- [ ] Connect to existing Tavvy Wallet system
- [ ] Customers can save favorite pros
- [ ] Organize by category (Plumber, Realtor, etc.)
- [ ] Re-contact later functionality
- [ ] Deep link to Tavvy app

### 10. Review Request Button
- [ ] **"Leave a Tavvy Review" button**
- [ ] One-tap to open review form
- [ ] Pre-filled with pro's info
- [ ] Ties into Tavvy review system
- [ ] Growth + trust builder

### 11. Smart Follow-Up (Later Phase)
- [ ] "Remind me in 6 months" option
- [ ] "Contact again" button
- [ ] Push notification integration
- [ ] Great for service pros

---

## 🟣 TEMPLATES (Priority 5)

### 12. Add More Templates
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

### 13. Template Categories
- [ ] Free Templates (6)
- [ ] Pro Templates (6+)
- [ ] Template preview in gallery
- [ ] Color scheme customization per template

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

## 📊 ANALYTICS (Future)

### 17. Card Analytics
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
