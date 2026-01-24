# Smart Realtor Match – Mobile Question Flow

## Purpose
This document defines the mobile-first, single-question-per-screen flow used to match users with the right realtors or brokers based on project type, budget, personality, language, and communication preferences.

**Goals:**
- Protect users from spam
- Match based on fit, not just location
- Allow users to connect with up to 5 realtors
- Give users full control over messaging and privacy

## User Flow Structure
- One question per screen
- Simple tap-based answers
- Optional text only when necessary
- Designed for fast completion on mobile

## Question Set

### 1. What are you looking to do?
(Single choice)
- Buy
- Sell
- Rent
- Lease
- Invest
- Just exploring

### 2. What type of property is this?
(Single choice)

**Residential:**
- Single-family home
- Condo / apartment
- Townhouse
- Multi-family

**Commercial:**
- Office
- Retail
- Industrial
- Land

**Other:**
- Vacation / second home
- Investment property

### 3. Where is the property located?
(Text input with autocomplete)
- City, State or ZIP code

### 4. What's your timeline?
(Single choice)
- ASAP (within 30 days)
- 1-3 months
- 3-6 months
- 6-12 months
- Just exploring

### 5. What price range fits your project?
(Single choice - dynamic based on buy/sell/rent)

**For Buy/Sell:**
- Under $200K
- $200K - $500K
- $500K - $1M
- $1M - $2M
- $2M+

**For Rent/Lease:**
- Under $1,500/mo
- $1,500 - $3,000/mo
- $3,000 - $5,000/mo
- $5,000+/mo

### 6. What's the main goal for this property?
(Single choice)
- Primary residence
- Investment / rental income
- Vacation home
- Business use
- Relocation

### 7. What personality do you want in your realtor?
(Multi-select, max 3)
- Aggressive negotiator
- Patient & understanding
- Data-driven / analytical
- Creative problem solver
- Luxury specialist
- First-time buyer friendly
- Investor-focused

### 8. What language should your realtor speak?
(Multi-select)
- English
- Spanish
- Portuguese
- Mandarin
- Other (specify)

### 9. How do you prefer to communicate?
(Multi-select)
- Text / SMS
- Phone call
- Email
- Video call
- In-person only

### 10. How many realtors should we connect you with?
(Single choice)
- 1 (focused)
- 2-3 (compare options)
- Up to 5 (maximum choice)

### 11. Do you want to share your contact info?
(Single choice)
- Yes, share my info with matched realtors
- No, I'll reach out first

### 12. Anything important we should tell the realtors?
(Optional text input)
- Free text field for additional notes

## Final Confirmation Screen
- Summary of selections
- Edit option for each answer
- Submit button

## Post-Submission Flow
1. If user is logged in → Submit and show matches
2. If user is guest → Ask for:
   - Name
   - Phone
   - Email
   - Address (optional)
3. After submission → Prompt to create password for account
   - "Create a password to save your preferences and track responses"
   - Option to skip (continue as guest)

## Key Principles
- Mobile-first design
- One question per screen
- Progress indicator at top
- Back button to edit previous answers
- Skip option for optional questions
- Clean, minimal UI
