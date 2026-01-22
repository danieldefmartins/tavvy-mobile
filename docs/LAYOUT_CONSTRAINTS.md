# Layout Constraints Documentation

## Bottom Sheet Height Constraint (LOCKED)

**Status**: PERMANENT - Do not modify without explicit approval

### Problem
The bottom sheet in browse/search screens was allowed to slide up and overlap the search bar and filter bars, causing visual and interaction issues.

### Required Behavior
1. Search bar and filter bars are **FIXED UI elements** at the top
2. Scrolling content (bottom sheet/results) must be constrained **BELOW** them
3. The foreground screen must **STOP immediately below** the filter bars
4. Must respect full height of search bar + filters
5. Must leave visible space for action buttons (e.g., "Search this area")
6. Results scroll **WITHIN** the constrained area, **NEVER** behind the fixed header

### Implementation

Located in `screens/HomeScreen.tsx`:

```typescript
// BOTTOM SHEET LAYOUT CONSTRAINTS (LOCKED)
const FIXED_HEADER_HEIGHT = Platform.OS === 'ios' ? 220 : 180;
const BOTTOM_SHEET_MAX_HEIGHT = height - FIXED_HEADER_HEIGHT;
const BOTTOM_SHEET_MAX_SNAP = Math.min(BOTTOM_SHEET_MAX_HEIGHT, height * 0.72);
```

### Fixed Header Components (iOS)
| Component | Position | Height |
|-----------|----------|--------|
| Safe Area Top | 0 | ~60px |
| Search Bar | top: 60 | 44px |
| Category Chips | top: 116 | ~36px |
| Search This Area Button | top: 170 | ~40px |
| **Total Header Area** | - | **~220px** |

### Snap Points Configuration
- Main Bottom Sheet: `[40, '40%', BOTTOM_SHEET_MAX_SNAP]`
- Category Results Sheet: `['15%', '45%', BOTTOM_SHEET_MAX_SNAP]`

### Affected Screens
- `HomeScreen.tsx` - Main browse screen with map view

### Testing Checklist
- [ ] Bottom sheet at max expansion does not overlap search bar
- [ ] Bottom sheet at max expansion does not overlap category chips
- [ ] "Search this area" button remains visible when bottom sheet is expanded
- [ ] Map pins remain clickable above the bottom sheet
- [ ] Content scrolls within the bottom sheet, not behind the header

### Change History
| Date | Change | Author |
|------|--------|--------|
| 2026-01-21 | Initial constraint implementation | Manus |

---
**WARNING**: This constraint is locked. Any changes require explicit approval and must maintain the separation between fixed header elements and scrollable content.
