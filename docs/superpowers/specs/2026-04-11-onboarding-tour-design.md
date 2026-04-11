# First-Time User Onboarding Tour Design

**Date:** 2026-04-11
**Status:** Approved
**Implementation:** React Joyride library

## Overview

Add a guided tour for first-time visitors to Torah Laws web app. The tour introduces users to navigation, features, and views through tooltips with spotlight effects. Users can skip, go back, or complete the full tour. A help button allows replaying the tour anytime.

**Scope:** Network and List views only (not embed version)

## Problem Statement

New users landing on the Torah Laws visualization don't understand:
- What the site is or how it's organized
- How to navigate the network graph
- How to interact with the side panel
- What different views are available

This leads to confusion and potentially users leaving without exploring the content.

## Goals

1. Explain the site's purpose and structure within seconds of landing
2. Guide users through core interactions (navigate nodes, open side panel, read verses)
3. Introduce all available views
4. Allow users to skip or revisit the tour at any time
5. Fix UI bugs where controls become hidden when side panel opens

## Architecture

### Tour State Management

- **First-time detection:** Check localStorage key `torahLawsTourCompleted`
- **Auto-start:** If key absent, start tour automatically on page load
- **Manual restart:** Help button clears key and restarts tour
- **Tour run state:** Managed in App.jsx as boolean state
- **Persistence:** localStorage writes on tour completion or skip

### Component Integration

```
App.jsx
  ├─ Joyride component (wraps all views)
  │   └─ Custom TourTooltip component
  ├─ tourSteps.js (step configuration)
  └─ tourStyles.js (Joyride styling)
```

- Tour configuration lives in `src/lib/tourSteps.js`
- App.jsx owns tour state and passes to Joyride
- Joyride renders at App level, targets elements across views
- Steps use data attributes or CSS selectors for targeting

### View Handling

- Tour runs only on network and list views
- Primarily focuses on network view (most complex interaction)
- If user switches views mid-tour, tour adapts or pauses gracefully
- Stats/split views mentioned in final step but not toured

## Tour Flow

### Step Progression

5 total steps with full navigation control (Previous, Next, Skip, Done):

1. **Welcome Modal** (center screen)
2. **Navigate Network** (target: canvas area)
3. **Open Side Panel** (target: law node or panel)
4. **Use Side Panel** (target: reference links)
5. **View Switchers** (target: top-right buttons)

### Step 1: Welcome Modal

**Position:** Center screen, no target element
**Spotlight:** Full screen overlay

**Content:**
```
Title: Welcome to the Torah Laws

Explore the laws in the Torah and how they relate to us today.
You'll find these organized under the two greatest commands -
Love YHWH and Love Your Neighbor - the 10 commandments all fall
under these two and the rest of the laws are categorized under
those. This interactive map reveals how they all connect and
allows you to navigate and explore God's ways. Navigate categories,
read original verses, and discover the structure behind biblical law.

[Skip Tour] [Next (1/5)]
```

### Step 2: Navigate the Network

**Target:** `.network-canvas` or `data-tour="network-canvas"`
**Position:** Center-left
**Spotlight:** Highlights canvas area

**Content:**
```
Click on any glowing node to explore that category. The network
expands to show subcategories and individual laws.

Click a law (the small circles) to view its details.

[Previous] [Skip Tour] [Next (2/5)]
```

### Step 3: Open Side Panel

**Target:** `data-tour="side-panel"` or first visible law node
**Position:** Right side
**Spotlight:** Highlights side panel

**Content:**
```
When you click a law, the side panel opens with the full text,
references, and related information.

[Previous] [Skip Tour] [Next (3/5)]
```

**Action:** May auto-open a sample law's side panel for demonstration

### Step 4: Using the Side Panel

**Target:** `data-tour="panel-references"` (reference links in panel)
**Position:** Within or adjacent to panel
**Spotlight:** Highlights reference section

**Content:**
```
Click any reference (like "Exodus 20:8-11") to read the original
verse in context.

[Previous] [Skip Tour] [Next (4/5)]
```

### Step 5: View Switchers

**Target:** `data-tour="view-switchers"` (Network/List/Split/Stats buttons)
**Position:** Below the buttons
**Spotlight:** Highlights button row

**Content:**
```
Switch between different views:
• Network - Visual map of connections
• List - Browse by categories
• Split - Both views side-by-side
• Dashboard - Statistics and insights

[Previous] [Skip Tour] [Done (5/5)]
```

**Action:** Tour completes, localStorage updated

## Visual Design

### Styling Approach (Joyride customization)

**Overlay:**
- Semi-transparent dark backdrop: `rgba(10, 9, 8, 0.75)`
- Dims non-highlighted areas during tour

**Spotlight:**
- Cut-out effect around target element
- Subtle glow/border: `rgba(210, 180, 120, 0.3)`
- Brings focus to interactive elements

**Tooltip Styling:**
- Background: `#0a0908` (dark, matches app)
- Border: `1px solid rgba(210, 180, 120, 0.3)` (amber/gold accent)
- Text: Cream/white (`#f5f5f0`) for readability
- Buttons: Amber/gold theme matching existing UI
- Arrow/pointer: Connects tooltip to target element

**Welcome Modal:**
- Larger centered box (no arrow)
- Full overlay background
- Prominent title
- Clear call-to-action buttons

**Button Styling:**
- **Next/Done:** Primary amber button (matches app's CTA style)
- **Previous:** Secondary style (outline or muted)
- **Skip:** Tertiary/text link style

### Responsive Behavior

- Joyride handles positioning automatically
- Tooltips reposition on small screens
- Welcome modal scales down but remains readable
- Tour skips or adapts steps if target elements not visible on mobile

## UI Bug Fixes

These fixes are critical for tour functionality and general UX improvement.

### 1. View Switchers Visibility (Network & List Views)

**Problem:** View switcher buttons (Network/List/Split/Stats/Theme) become hidden when side panel opens.

**Solution:**
- Adjust z-index hierarchy
- View switchers: `z-index: 1003` (stay on top)
- Side panel: `z-index: 999` (slides under header controls)
- Side panel should not overlap header area

**Files affected:**
- `NetworkGraphStyled.css` (header button z-index)
- `LawList.css` (header button z-index)
- Side panel CSS (reduce z-index)

### 2. Observance Legend Visibility (List View)

**Problem:** Observance button and legend become hidden when side panel opens in list view.

**Solution:**
- Similar z-index adjustment
- Observance controls: `z-index: 1003`
- Ensure legend stays accessible during Step 4 of tour

**Files affected:**
- `LawList.css` (observance button/legend z-index)

### 3. Help Button Addition

**Location:** Top-right controls row (with view switchers)

**Appearance:**
- Icon: `HelpCircle` from lucide-react (matches existing icon set)
- Same size and style as Network/List/Split buttons
- Tooltip on hover: "Restart Tour"

**Behavior:**
- onClick: `localStorage.removeItem('torahLawsTourCompleted')` + `setRunTour(true)`
- Restarts tour from Step 1
- Available in all views

**Files affected:**
- `NetworkGraphStyled.jsx` (add button to header)
- `LawList.jsx` (add button to header)
- `StatsOverview.jsx` (add button to header, but tour doesn't run here)

## Implementation Details

### Package Installation

```bash
npm install react-joyride
```

**Bundle size impact:** ~15kb gzipped

### File Structure

```
src/
├── lib/
│   ├── tourSteps.js          # Tour step configuration array
│   └── tourStyles.js          # Joyride custom styles object
├── components/
│   ├── TourTooltip.jsx        # Custom tooltip component for Joyride
│   ├── NetworkGraphStyled.jsx # Add help button + data-tour attributes
│   ├── LawList.jsx            # Add help button + data-tour attributes
│   └── StatsOverview.jsx      # Add help button (no tour)
└── App.jsx                    # Tour state management & Joyride integration
```

### App.jsx Integration

**State:**
```javascript
const [runTour, setRunTour] = useState(() => {
  return !localStorage.getItem('torahLawsTourCompleted')
})
```

**Joyride Component:**
```javascript
import Joyride from 'react-joyride'
import { tourSteps } from './lib/tourSteps'
import { tourStyles } from './lib/tourStyles'
import TourTooltip from './components/TourTooltip'

<Joyride
  steps={tourSteps}
  run={runTour}
  continuous={true}
  showProgress={true}
  showSkipButton={true}
  disableScrolling={true}
  spotlightClicks={false}
  styles={tourStyles}
  callback={handleJoyrideCallback}
  tooltipComponent={TourTooltip}
  floaterProps={{
    disableAnimation: false,
    placement: 'auto'
  }}
/>
```

**Callback Handler:**
```javascript
const handleJoyrideCallback = (data) => {
  const { status, type, index } = data

  // Tour finished or skipped
  if (status === 'finished' || status === 'skipped') {
    localStorage.setItem('torahLawsTourCompleted', 'true')
    setRunTour(false)
  }

  // Optional: Step-specific actions
  // Example: Auto-open side panel for step 3
  if (type === 'step:after' && index === 2) {
    // Trigger side panel open
  }
}
```

### tourSteps.js Configuration

```javascript
export const tourSteps = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Welcome to the Torah Laws',
    content: 'Explore the laws in the Torah and how they relate to us today...',
    locale: { skip: 'Skip Tour', next: 'Next' },
  },
  {
    target: '[data-tour="network-canvas"]',
    placement: 'center',
    title: 'Navigate the Network',
    content: 'Click on any glowing node to explore that category...',
  },
  {
    target: '[data-tour="side-panel"]',
    placement: 'left',
    title: 'Open Side Panel',
    content: 'When you click a law, the side panel opens...',
  },
  {
    target: '[data-tour="panel-references"]',
    placement: 'left',
    title: 'Using the Side Panel',
    content: 'Click any reference (like "Exodus 20:8-11")...',
  },
  {
    target: '[data-tour="view-switchers"]',
    placement: 'bottom',
    title: 'View Switchers',
    content: 'Switch between different views:\n• Network...',
    locale: { last: 'Done' },
  },
]
```

### tourStyles.js

```javascript
export const tourStyles = {
  options: {
    arrowColor: '#0a0908',
    backgroundColor: '#0a0908',
    overlayColor: 'rgba(10, 9, 8, 0.75)',
    primaryColor: '#d2b478', // Amber/gold
    textColor: '#f5f5f0',
    width: 380,
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: 8,
    border: '1px solid rgba(210, 180, 120, 0.3)',
  },
  spotlight: {
    borderRadius: 4,
    border: '2px solid rgba(210, 180, 120, 0.3)',
  },
  buttonNext: {
    backgroundColor: '#d2b478',
    color: '#0a0908',
    borderRadius: 4,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#d2b478',
    marginRight: 8,
  },
  buttonSkip: {
    color: '#a0a0a0',
  },
}
```

### TourTooltip.jsx

Custom tooltip component to fully control appearance and layout:

```javascript
import { X } from 'lucide-react'

function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}) {
  return (
    <div {...tooltipProps} className="tour-tooltip">
      {step.title && <h3 className="tour-title">{step.title}</h3>}
      <div className="tour-content">{step.content}</div>

      <div className="tour-footer">
        <div className="tour-buttons">
          {index > 0 && (
            <button {...backProps} className="tour-btn tour-btn-back">
              Previous
            </button>
          )}
          {!isLastStep && (
            <button {...skipProps} className="tour-btn tour-btn-skip">
              Skip Tour
            </button>
          )}
          <button {...primaryProps} className="tour-btn tour-btn-primary">
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
        <div className="tour-progress">
          {index + 1}/{step.total || 5}
        </div>
      </div>
    </div>
  )
}

export default TourTooltip
```

### Target Elements (data attributes)

Add to relevant components:

**NetworkGraphStyled.jsx:**
```javascript
<canvas ref={canvasRef} data-tour="network-canvas" />
```

**LawSidePanel.jsx:**
```javascript
<div className="side-panel" data-tour="side-panel">
  {/* ... */}
  <div data-tour="panel-references">
    {/* Reference links */}
  </div>
</div>
```

**Header (Network/List/Stats views):**
```javascript
<div className="view-controls" data-tour="view-switchers">
  <button onClick={() => onSwitchView('network')}>
    <Network />
  </button>
  {/* ... */}
  <button onClick={handleHelpClick} title="Restart Tour">
    <HelpCircle />
  </button>
</div>
```

### Z-Index Hierarchy

```
Tour overlay:       1000
Tour spotlight:     1001
Tour tooltip:       1002
Header controls:    1003  ← view switchers, help button
Side panel:         999   ← slides under controls
```

## Light/Dark Mode Compatibility

Tour styling adapts to current theme:

```javascript
const tourStyles = {
  options: {
    backgroundColor: lightMode ? '#ffffff' : '#0a0908',
    textColor: lightMode ? '#0a0908' : '#f5f5f0',
    primaryColor: lightMode ? '#a68a20' : '#d2b478',
    overlayColor: lightMode
      ? 'rgba(255, 255, 255, 0.75)'
      : 'rgba(10, 9, 8, 0.75)',
  },
  // ...
}
```

Pass `lightMode` prop to Joyride and adjust styles conditionally.

## Error Handling

**Target element not found:**
- Joyride skips step gracefully
- Console warning for debugging
- Tour continues to next available step

**localStorage unavailable:**
- Tour runs every time (degraded but functional)
- Catch errors on read/write operations
- Fall back to session-only state

**View navigation mid-tour:**
- If user switches to stats/split view, pause tour
- Resume when returning to network/list
- Option: Show notification "Tour paused, return to continue"

**User closes side panel during panel steps:**
- Tour continues, tooltip repositions
- Option: Auto-reopen panel for relevant steps

## Testing Strategy

**Manual testing:**
```javascript
// Clear tour completion
localStorage.removeItem('torahLawsTourCompleted')

// Trigger via console (for testing)
window.startTour = () => setRunTour(true)
```

**Test cases:**
1. First-time visit (no localStorage key) → tour auto-starts
2. Previous/Next navigation works on all steps
3. Skip button exits tour and sets localStorage
4. Done button completes tour and sets localStorage
5. Help button clears localStorage and restarts tour
6. View switchers remain visible during tour
7. Observance legend remains visible during tour (list view)
8. Tour adapts to light/dark mode
9. Tooltips position correctly on all screen sizes
10. Side panel interactions work during tour steps

**Browser testing:**
- Chrome, Firefox, Safari, Edge
- Desktop and mobile viewports
- localStorage enabled/disabled scenarios

## Success Metrics

**Immediate (qualitative):**
- Users understand site purpose within 10 seconds
- Users can navigate to a law and open side panel
- Users know how to switch views

**Future (quantitative, if analytics added):**
- Tour completion rate >60%
- Tour skip rate <40%
- Reduced bounce rate for first-time visitors
- Increased average session duration

## Future Enhancements (Out of Scope)

- Multi-language support for tour content
- Contextual hints that appear on specific user actions
- Video tour option
- Progressive hints (different tips for returning users)
- Analytics tracking for tour engagement

## Risks & Mitigations

**Risk:** Tour feels intrusive or annoying
**Mitigation:** Prominent skip button, respects localStorage, one-time only

**Risk:** Tour blocks critical functionality
**Mitigation:** `spotlightClicks={false}` prevents accidental clicks, overlay is semi-transparent

**Risk:** Outdated tour after UI changes
**Mitigation:** Use flexible selectors, validate targets on each step

**Risk:** Accessibility issues
**Mitigation:** Joyride has built-in keyboard navigation and ARIA support

## Open Questions

None - design is approved and ready for implementation.

## Sign-off

- [x] Architecture approved
- [x] Tour content approved
- [x] Visual design approved
- [x] Implementation approach approved
- [x] Ready for implementation plan
