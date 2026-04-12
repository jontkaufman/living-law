# Onboarding Tour - Manual Testing Guide

## Quick Start

### 1. Open Browser
```
http://localhost:5173
```

### 2. Load Test Script
1. Open Developer Console (F12)
2. Copy the contents of `browser-test-script.js`
3. Paste into console
4. Press Enter

### 3. Run Automated Tests
```javascript
runAllTests()
```

This will check:
- ✅ Tour elements (data-tour attributes)
- ✅ LocalStorage functionality
- ✅ Z-index values
- ✅ Joyride integration
- ✅ Theme compatibility

---

## Manual Test Checklist

After running automated tests, perform these manual checks:

### TEST 1: First-Time Visitor Flow

**Setup:**
```javascript
resetTour()  // Then refresh page
```

**Check:**
- [ ] Tour starts automatically on page load
- [ ] Welcome modal appears centered
- [ ] Modal text is readable
- [ ] "Next" button is visible and clickable

**Expected:** Tour launches immediately with step 1/5

---

### TEST 2: Tour Navigation

**Actions:** Click through entire tour using buttons

**Check:**
- [ ] Step 1: "Previous" button is hidden ✓
- [ ] Step 2: "Previous" button appears ✓
- [ ] "Previous" navigates back correctly
- [ ] "Next" advances through all steps
- [ ] Step counter updates (1/5 → 2/5 → 3/5 → 4/5 → 5/5)
- [ ] Step 5: "Next" changes to "Done"

**Expected:** Smooth navigation with accurate step counter

---

### TEST 3: Tour Content & Spotlights

**Actions:** Progress through each step, observe spotlights

**Check:**
- [ ] Step 1 (center): Welcome message displays
- [ ] Step 2 (canvas): Network canvas highlighted with spotlight
- [ ] Step 3 (side panel): Side panel highlighted
  - **Note:** May need to click a law to open panel first
- [ ] Step 4 (references): References section highlighted in panel
- [ ] Step 5 (view switchers): View switcher buttons highlighted (top right)

**Expected:** Each step targets the correct element with visible spotlight

---

### TEST 4: Skip Tour

**Setup:**
```javascript
resetTour()  // Then refresh
```

**Actions:**
1. Let tour start
2. Click "Skip Tour" button

**Check:**
- [ ] Tour closes immediately
- [ ] localStorage is set
  ```javascript
  checkTourStatus()  // Should show "Completed: YES"
  ```
- [ ] Refresh page - tour doesn't auto-start

**Expected:** Skip immediately ends tour and prevents restart

---

### TEST 5: Help Button

**Setup:** Complete or skip tour first

**Actions:**
1. Look for "?" button in top-right header
2. Click the help button

**Check:**
- [ ] Help button visible in Network view
- [ ] Help button visible in List view
- [ ] Help button visible in Stats view
- [ ] Help button visible when side panel is open
- [ ] Clicking help button restarts tour (tour appears at step 1)

**Expected:** Help button always accessible and restarts tour

---

### TEST 6: Tour Completion

**Setup:**
```javascript
resetTour()  // Then refresh
```

**Actions:**
1. Complete entire tour (click through all 5 steps)
2. Click "Done" on final step

**Check:**
- [ ] Tour closes
- [ ] localStorage is set correctly
  ```javascript
  checkTourStatus()  // Should show "Completed: YES"
  ```
- [ ] Refresh page - tour doesn't auto-start
- [ ] Help button still works to manually restart

**Expected:** Tour completion persists across page reloads

---

### TEST 7: Light/Dark Mode

**Actions:**
1. Start tour in default (dark) mode
2. Toggle to light mode during tour
3. Toggle back to dark mode

**Check:**
- [ ] Tour tooltip readable in dark mode
- [ ] Tour tooltip readable in light mode
- [ ] Tooltip colors adapt when switching themes
- [ ] Spotlight overlay adapts to theme
- [ ] Button colors appropriate for each theme

**Expected:** Tour remains readable in both themes

---

### TEST 8: Z-Index Verification

**Actions:**
1. Open side panel (click a law)
2. Check view switchers visibility
3. Switch to List view
4. Check observance legend visibility

**Check:**
- [ ] View switchers (Network/List/Stats) remain visible when side panel open
- [ ] View switchers don't get hidden behind panel
- [ ] In List view: Observance legend visible when panel open
- [ ] Help button accessible when panel open
- [ ] Tour tooltip appears above all other elements during tour

**Expected:** All controls remain accessible with side panel open

---

## Quick Reference: Console Commands

### Tour Control
```javascript
resetTour()        // Clear completion state, reload to start tour
completeTour()     // Mark tour as completed
checkTourStatus()  // View current tour state
```

### Testing
```javascript
runAllTests()      // Run full automated test suite
testTourElements() // Test data-tour attributes only
testZIndex()       // Test z-index values only
```

### Debugging
```javascript
// Check if tour should start
localStorage.getItem('torahLawsTourCompleted')
// Returns: null (tour will start) or "true" (tour won't start)

// Force tour to start
localStorage.removeItem('torahLawsTourCompleted')
location.reload()

// Check for tour elements
document.querySelector('[data-tour="network-canvas"]')
document.querySelector('[data-tour="view-switchers"]')
document.querySelectorAll('[data-tour]')  // All tour targets
```

---

## Pass/Fail Criteria

### ✅ PASS
All manual tests must pass:
- Tour starts automatically for first-time visitors
- All 5 steps display correctly with proper spotlights
- Navigation buttons work correctly
- Skip and Done buttons end tour and set localStorage
- Help button restarts tour from any view
- Tour readable in both light and dark modes
- Z-index issues resolved (controls visible over side panel)

### ❌ FAIL
Any of these issues:
- Tour doesn't start automatically
- Steps target wrong elements
- Navigation buttons don't work
- localStorage not set after completion
- Help button missing or non-functional
- Tour unreadable in one or both themes
- Controls hidden when side panel open

---

## Reporting Issues

If you find issues, document:

1. **Issue description:** What went wrong?
2. **Steps to reproduce:** Exact sequence to trigger bug
3. **Expected behavior:** What should happen?
4. **Actual behavior:** What actually happened?
5. **Browser/OS:** Chrome 100, Firefox 90, etc.
6. **Console errors:** Any JavaScript errors?

### Example Issue Report
```
Issue: Tour doesn't start on first visit

Steps to reproduce:
1. localStorage.removeItem('torahLawsTourCompleted')
2. location.reload()

Expected: Tour should start at step 1/5
Actual: Page loads, no tour appears

Browser: Chrome 120 on Linux
Console errors: None
```

---

## Testing Complete?

After all manual tests pass:
1. ✅ Mark Task 9 as complete
2. ✅ Document test results in TESTING-RESULTS-2026-04-11.md
3. ✅ Report completion with summary

**All tests passed?** You're done! 🎉
