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
// The topInset prop tells the bottom sheet where to STOP at the top
// This prevents the sheet from overlapping the fixed header elements
const BOTTOM_SHEET_TOP_INSET = Platform.OS === 'ios' ? 220 : 180;
```

**Key Insight**: The `@gorhom/bottom-sheet` library's snap points are measured from the **BOTTOM** of the screen, not the top. Using `topInset` is the correct way to prevent overlap with fixed header elements.

### Fixed Header Components (iOS)
| Component | Position | Height | Ends At |
|-----------|----------|--------|---------|
| Search Bar | top: 60px | 44px | 104px |
| Category Chips | top: 116px | ~36px | ~152px |
| Search This Area Button | top: 170px | ~40px | ~210px |
| **Total + Padding** | - | - | **220px** |

### Bottom Sheet Configuration
Both bottom sheets use:
```typescript
<BottomSheet
  snapPoints={['15%', '45%', '70%']}
  topInset={BOTTOM_SHEET_TOP_INSET}
  // ... other props
>
```

- `topInset={220}` ensures the sheet cannot expand above 220px from the top
- Snap points are percentages of the available space (below topInset)
- Maximum expansion is 70% which respects the topInset constraint

### Affected Screens
- `HomeScreen.tsx` - Main browse screen with map view (2 bottom sheets)

### Testing Checklist
- [ ] Bottom sheet at max expansion does not overlap search bar
- [ ] Bottom sheet at max expansion does not overlap category chips
- [ ] "Search this area" button remains visible when bottom sheet is expanded
- [ ] Map pins remain clickable above the bottom sheet
- [ ] Content scrolls within the bottom sheet, not behind the header
- [ ] Works correctly on both iOS and Android

### Change History
| Date | Change | Author |
|------|--------|--------|
| 2026-01-21 | Initial constraint implementation (BOTTOM_SHEET_MAX_SNAP) | Manus |
| 2026-01-21 | Fixed: Use topInset prop instead of snap point calculation | Manus |

---
**WARNING**: This constraint is locked. Any changes require explicit approval and must maintain the separation between fixed header elements and scrollable content.
