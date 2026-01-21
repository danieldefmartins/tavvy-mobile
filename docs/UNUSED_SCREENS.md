# Unused Screens Documentation

This document catalogs screens that exist in the codebase but are **not currently connected** to the main navigation in `App.tsx`. These screens may be:
- Future features in development
- Deprecated screens pending removal
- Alternative implementations
- Screens that should be connected but were missed

## Summary

| Screen | Status | Recommendation |
|--------|--------|----------------|
| ActionMenuScreen | Deprecated | Remove - functionality moved to AppsScreen |
| AppsHomeScreen | Deprecated | Remove - replaced by AppsScreen |
| CommunityGuidelinesScreen | Future Feature | Keep - legal/compliance content |
| ExperiencePathDetailScreen | Future Feature | Keep - Experience Paths feature |
| ExperiencePathsScreen | Future Feature | Keep - Experience Paths feature |
| ExploreScreen | Deprecated | Remove - replaced by UniverseDiscoveryScreen |
| GetQuotesScreen | Future Feature | Keep - Pros quote request flow |
| HappeningNowDetailScreen | Future Feature | Keep - Events/Happening Now feature |
| HappeningNowScreen | Future Feature | Keep - Events/Happening Now feature |
| HelpSupportScreen | Should Connect | **Connect to AppsScreen** |
| ProsBidScreen | Future Feature | Keep - Pros bidding system |
| ProsCategoryLandingScreen | Future Feature | Keep - Pros category pages |
| ProsCategoryScreen | Future Feature | Keep - Pros category selection |
| ProsClaimBusinessScreen | Future Feature | Keep - Pro business claiming |
| ProsLeadDetailScreen | **Referenced** | **Connect to navigation** |
| ProsManageProfileScreen | Future Feature | Keep - Pro profile management |
| ProsPaywallScreen | Future Feature | Keep - Pros subscription paywall |
| ProsRequestStep5Screen_UPDATED | Deprecated | Remove - duplicate of ProsRequestStep5Screen |
| QuickFindsResultsScreen | Future Feature | Keep - Quick Finds feature |
| QuickFindsScreen | Future Feature | Keep - Quick Finds feature |
| SettingsScreen | **Referenced** | **Connect to navigation** |
| SignalReviewScreen | Future Feature | Keep - Signal review flow |

---

## Detailed Analysis

### 1. ActionMenuScreen
**File:** `screens/ActionMenuScreen.tsx`
**Status:** Deprecated
**Purpose:** Modal action menu for quick actions
**Recommendation:** Remove - functionality has been moved to AppsScreen with the new app grid layout

---

### 2. AppsHomeScreen
**File:** `screens/AppsHomeScreen.tsx`
**Status:** Deprecated
**Purpose:** Original apps/menu home screen
**Recommendation:** Remove - replaced by the current AppsScreen implementation

---

### 3. CommunityGuidelinesScreen
**File:** `screens/CommunityGuidelinesScreen.tsx`
**Status:** Future Feature
**Purpose:** Display community guidelines and terms of service
**Recommendation:** Keep for future - needed for App Store compliance and user trust

---

### 4. ExperiencePathDetailScreen
**File:** `screens/ExperiencePathDetailScreen.tsx`
**Status:** Future Feature
**Purpose:** Detail view for curated experience paths (e.g., "Date Night", "Family Day")
**Recommendation:** Keep - part of the Experience Paths feature planned for future release

---

### 5. ExperiencePathsScreen
**File:** `screens/ExperiencePathsScreen.tsx`
**Status:** Future Feature
**Purpose:** Browse and discover curated experience paths
**Recommendation:** Keep - part of the Experience Paths feature planned for future release

---

### 6. ExploreScreen
**File:** `screens/ExploreScreen.tsx`
**Status:** Deprecated
**Purpose:** Original explore/discovery screen with filters
**Recommendation:** Remove - replaced by UniverseDiscoveryScreen

---

### 7. GetQuotesScreen
**File:** `screens/GetQuotesScreen.tsx`
**Status:** Future Feature
**Purpose:** Request quotes from multiple pros at once
**Recommendation:** Keep - enhances the Pros feature for users seeking services

---

### 8. HappeningNowDetailScreen
**File:** `screens/HappeningNowDetailScreen.tsx`
**Status:** Future Feature
**Purpose:** Detail view for events and happenings
**Recommendation:** Keep - part of the Happening Now/Events feature

---

### 9. HappeningNowScreen
**File:** `screens/HappeningNowScreen.tsx`
**Status:** Future Feature
**Purpose:** Browse current events and happenings in the area
**Recommendation:** Keep - part of the Happening Now/Events feature

---

### 10. HelpSupportScreen
**File:** `screens/HelpSupportScreen.tsx`
**Status:** Should Connect
**Purpose:** Help and support page with FAQs and contact options
**Recommendation:** **Connect to AppsScreen** - users need access to help/support

---

### 11. ProsBidScreen
**File:** `screens/ProsBidScreen.tsx`
**Status:** Future Feature
**Purpose:** Allow pros to bid on user projects
**Recommendation:** Keep - part of the Pros marketplace feature

---

### 12. ProsCategoryLandingScreen
**File:** `screens/ProsCategoryLandingScreen.tsx`
**Status:** Future Feature
**Purpose:** Landing page for specific pro categories (e.g., Plumbers, Electricians)
**Recommendation:** Keep - enhances Pros browsing experience

---

### 13. ProsCategoryScreen
**File:** `screens/ProsCategoryScreen.tsx`
**Status:** Future Feature
**Purpose:** Category selection for finding pros
**Recommendation:** Keep - part of Pros category navigation

---

### 14. ProsClaimBusinessScreen
**File:** `screens/ProsClaimBusinessScreen.tsx`
**Status:** Future Feature
**Purpose:** Allow professionals to claim their business listing
**Recommendation:** Keep - important for Pros onboarding

---

### 15. ProsLeadDetailScreen ⚠️
**File:** `screens/ProsLeadDetailScreen.tsx`
**Status:** **Referenced but not connected**
**Purpose:** Detail view for pro leads/inquiries
**Referenced in:** `ProsDashboardScreen.tsx`, `ProsLeadsScreen.tsx`
**Recommendation:** **Connect to ProsStack navigation** - currently referenced but navigation will fail

---

### 16. ProsManageProfileScreen
**File:** `screens/ProsManageProfileScreen.tsx`
**Status:** Future Feature
**Purpose:** Allow pros to manage their profile and services
**Recommendation:** Keep - essential for Pros feature

---

### 17. ProsPaywallScreen
**File:** `screens/ProsPaywallScreen.tsx`
**Status:** Future Feature
**Purpose:** Subscription paywall for Pros premium features
**Recommendation:** Keep - monetization feature for Pros

---

### 18. ProsRequestStep5Screen_UPDATED
**File:** `screens/ProsRequestStep5Screen_UPDATED.tsx`
**Status:** Deprecated
**Purpose:** Updated version of step 5 in pros request flow
**Recommendation:** Remove - duplicate/old version; current ProsRequestStep5Screen is in use

---

### 19. QuickFindsResultsScreen
**File:** `screens/QuickFindsResultsScreen.tsx`
**Status:** Future Feature
**Purpose:** Display results for quick find searches
**Recommendation:** Keep - part of Quick Finds feature

---

### 20. QuickFindsScreen
**File:** `screens/QuickFindsScreen.tsx`
**Status:** Future Feature
**Purpose:** Quick category-based search (e.g., "Coffee", "Gas", "ATM")
**Recommendation:** Keep - useful utility feature

---

### 21. SettingsScreen ⚠️
**File:** `screens/SettingsScreen.tsx`
**Status:** **Referenced but not connected**
**Purpose:** User settings including language, theme, notifications
**Referenced in:** `MenuScreen.tsx`, `ProsDashboardScreen.tsx`
**Recommendation:** **Connect to AppsStack navigation** - currently referenced but navigation will fail

---

### 22. SignalReviewScreen
**File:** `screens/SignalReviewScreen.tsx`
**Status:** Future Feature
**Purpose:** Alternative review flow using signal-based input
**Recommendation:** Keep - may be used for future review UX improvements

---

## Action Items

### Immediate (v1.0.1)
1. ✅ Connect `SettingsScreen` to AppsStack navigation
2. ✅ Connect `ProsLeadDetailScreen` to ProsStack navigation
3. ✅ Connect `HelpSupportScreen` to AppsStack navigation

### Future Cleanup
1. Remove deprecated screens: `ActionMenuScreen`, `AppsHomeScreen`, `ExploreScreen`, `ProsRequestStep5Screen_UPDATED`
2. Consider consolidating duplicate functionality

### Future Features
The following screens are ready for future feature releases:
- **Experience Paths:** `ExperiencePathsScreen`, `ExperiencePathDetailScreen`
- **Happening Now:** `HappeningNowScreen`, `HappeningNowDetailScreen`
- **Quick Finds:** `QuickFindsScreen`, `QuickFindsResultsScreen`
- **Pros Enhancements:** `ProsBidScreen`, `ProsCategoryScreen`, `ProsCategoryLandingScreen`, `ProsClaimBusinessScreen`, `ProsManageProfileScreen`, `ProsPaywallScreen`, `GetQuotesScreen`
- **Legal/Compliance:** `CommunityGuidelinesScreen`
- **Review UX:** `SignalReviewScreen`

---

*Document generated: January 21, 2026*
*Last updated: v1.0.1 code review*
