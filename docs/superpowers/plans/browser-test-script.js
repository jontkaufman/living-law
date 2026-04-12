/**
 * ONBOARDING TOUR - AUTOMATED BROWSER TEST SCRIPT
 *
 * INSTRUCTIONS:
 * 1. Open http://localhost:5173 in browser
 * 2. Open Developer Console (F12)
 * 3. Paste this entire script
 * 4. Run the test functions as documented below
 *
 * This script provides automated checks for tour functionality.
 * Some tests still require manual verification (marked with [MANUAL]).
 */

// ══════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ══════════════════════════════════════════════════════════════════

const TourTests = {
  results: [],

  log(test, status, message) {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.results.push(result);
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
    return status === 'PASS';
  },

  getSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${this.results.length}`);
    console.log('═'.repeat(60) + '\n');

    return { passed, failed, warnings, total: this.results.length };
  },

  reset() {
    this.results = [];
    console.log('🔄 Test results reset\n');
  }
};

// ══════════════════════════════════════════════════════════════════
// SECTION 1: TOUR ELEMENT CHECKS
// ══════════════════════════════════════════════════════════════════

function testTourElements() {
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 1: TOUR ELEMENT CHECKS');
  console.log('═'.repeat(60) + '\n');

  // Check for data-tour attributes
  const canvas = document.querySelector('[data-tour="network-canvas"]');
  TourTests.log(
    'Network Canvas',
    canvas ? 'PASS' : 'FAIL',
    canvas ? 'data-tour="network-canvas" found' : 'data-tour="network-canvas" NOT FOUND'
  );

  const sidePanel = document.querySelector('[data-tour="side-panel"]');
  TourTests.log(
    'Side Panel',
    sidePanel ? 'PASS' : 'FAIL',
    sidePanel ? 'data-tour="side-panel" found' : 'data-tour="side-panel" NOT FOUND'
  );

  const references = document.querySelector('[data-tour="panel-references"]');
  TourTests.log(
    'Panel References',
    references ? 'WARN' : 'FAIL',
    references ? 'data-tour="panel-references" found' :
      'data-tour="panel-references" NOT FOUND (may need to open side panel first)'
  );

  const viewSwitchers = document.querySelector('[data-tour="view-switchers"]');
  TourTests.log(
    'View Switchers',
    viewSwitchers ? 'PASS' : 'FAIL',
    viewSwitchers ? 'data-tour="view-switchers" found' : 'data-tour="view-switchers" NOT FOUND'
  );

  // Check for help button
  const helpButtons = document.querySelectorAll('button[title="Restart Tour"]');
  TourTests.log(
    'Help Button',
    helpButtons.length > 0 ? 'PASS' : 'FAIL',
    `Found ${helpButtons.length} help button(s)`
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTION 2: LOCALSTORAGE TESTS
// ══════════════════════════════════════════════════════════════════

function testLocalStorage() {
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 2: LOCALSTORAGE TESTS');
  console.log('═'.repeat(60) + '\n');

  // Check localStorage functionality
  try {
    const key = 'torahLawsTourCompleted';
    const currentValue = localStorage.getItem(key);

    TourTests.log(
      'LocalStorage Access',
      'PASS',
      'localStorage is accessible'
    );

    TourTests.log(
      'Tour Completion State',
      'PASS',
      `Current value: ${currentValue === null ? 'null (tour not completed)' : currentValue}`
    );

    // Test read/write
    localStorage.setItem('__test__', 'test');
    const testRead = localStorage.getItem('__test__');
    localStorage.removeItem('__test__');

    TourTests.log(
      'LocalStorage Read/Write',
      testRead === 'test' ? 'PASS' : 'FAIL',
      testRead === 'test' ? 'Read/write working correctly' : 'Read/write FAILED'
    );

  } catch (error) {
    TourTests.log(
      'LocalStorage Access',
      'FAIL',
      `Error: ${error.message}`
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 3: Z-INDEX VERIFICATION
// ══════════════════════════════════════════════════════════════════

function testZIndex() {
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 3: Z-INDEX VERIFICATION');
  console.log('═'.repeat(60) + '\n');

  // Check header z-index
  const header = document.querySelector('.network-header') || document.querySelector('.list-header');
  if (header) {
    const zIndex = window.getComputedStyle(header).zIndex;
    TourTests.log(
      'Header Z-Index',
      zIndex === '1003' ? 'PASS' : 'FAIL',
      `Header z-index is ${zIndex} (expected 1003)`
    );
  } else {
    TourTests.log('Header Z-Index', 'WARN', 'Header element not found');
  }

  // Check side panel z-index
  const sidePanel = document.querySelector('.side-panel');
  if (sidePanel) {
    const zIndex = window.getComputedStyle(sidePanel).zIndex;
    TourTests.log(
      'Side Panel Z-Index',
      zIndex === '999' ? 'PASS' : 'FAIL',
      `Side panel z-index is ${zIndex} (expected 999)`
    );
  } else {
    TourTests.log('Side Panel Z-Index', 'WARN', 'Side panel not found (may not be open)');
  }

  // Check observance legend (in list view)
  const legend = document.querySelector('.observance-legend-container');
  if (legend) {
    const zIndex = window.getComputedStyle(legend).zIndex;
    TourTests.log(
      'Observance Legend Z-Index',
      zIndex === '1003' ? 'PASS' : 'FAIL',
      `Observance legend z-index is ${zIndex} (expected 1003)`
    );
  } else {
    TourTests.log('Observance Legend Z-Index', 'WARN', 'Legend not found (switch to List view to test)');
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 4: JOYRIDE INTEGRATION
// ══════════════════════════════════════════════════════════════════

function testJoyrideIntegration() {
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 4: JOYRIDE INTEGRATION');
  console.log('═'.repeat(60) + '\n');

  // Check for Joyride elements in DOM
  const joyrideTooltip = document.querySelector('.tour-tooltip') ||
                         document.querySelector('[class*="joyride"]') ||
                         document.querySelector('[data-test-id*="joyride"]');

  TourTests.log(
    'Joyride Active',
    joyrideTooltip ? 'PASS' : 'WARN',
    joyrideTooltip ? 'Tour tooltip found in DOM' :
      'No tour tooltip found (tour may not be running - clear localStorage to start)'
  );

  if (joyrideTooltip) {
    // Check for buttons
    const nextBtn = document.querySelector('.tour-btn-primary');
    const skipBtn = document.querySelector('.tour-btn-skip');
    const backBtn = document.querySelector('.tour-btn-back');

    TourTests.log(
      'Tour Buttons',
      (nextBtn || skipBtn) ? 'PASS' : 'FAIL',
      `Found: ${nextBtn ? 'Next' : ''} ${skipBtn ? 'Skip' : ''} ${backBtn ? 'Back' : ''}`
    );

    // Check for progress counter
    const progress = document.querySelector('.tour-progress');
    TourTests.log(
      'Tour Progress Counter',
      progress ? 'PASS' : 'FAIL',
      progress ? `Progress text: "${progress.textContent}"` : 'Progress counter not found'
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// SECTION 5: THEME COMPATIBILITY
// ══════════════════════════════════════════════════════════════════

function testTheme() {
  console.log('\n' + '═'.repeat(60));
  console.log('SECTION 5: THEME COMPATIBILITY');
  console.log('═'.repeat(60) + '\n');

  // Detect current theme
  const container = document.querySelector('.network-container') ||
                   document.querySelector('.accordion-container');

  if (container) {
    const isLight = container.classList.contains('light');
    TourTests.log(
      'Theme Detection',
      'PASS',
      `Current theme: ${isLight ? 'Light' : 'Dark'}`
    );

    // Check theme toggle button
    const themeToggle = document.querySelector('button[title*="theme" i], button[title*="mode" i]');
    TourTests.log(
      'Theme Toggle Button',
      themeToggle ? 'PASS' : 'WARN',
      themeToggle ? 'Theme toggle button found' : 'Theme toggle button not found'
    );
  } else {
    TourTests.log('Theme Detection', 'WARN', 'Could not detect container');
  }
}

// ══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

function resetTour() {
  console.log('\n🔄 Resetting tour...\n');
  localStorage.removeItem('torahLawsTourCompleted');
  console.log('✅ Tour state cleared. Reload page to start tour.\n');
}

function completeTour() {
  console.log('\n✅ Marking tour as completed...\n');
  localStorage.setItem('torahLawsTourCompleted', 'true');
  console.log('✅ Tour marked complete. Reload page to verify.\n');
}

function checkTourStatus() {
  const completed = localStorage.getItem('torahLawsTourCompleted');
  console.log('\n📊 Tour Status:');
  console.log('═'.repeat(40));
  console.log(`Completed: ${completed === 'true' ? 'YES' : 'NO'}`);
  console.log(`LocalStorage value: ${completed === null ? 'null' : completed}`);
  console.log('═'.repeat(40) + '\n');
}

// ══════════════════════════════════════════════════════════════════
// MASTER TEST RUNNER
// ══════════════════════════════════════════════════════════════════

function runAllTests() {
  console.clear();
  console.log('\n' + '█'.repeat(60));
  console.log('     ONBOARDING TOUR - AUTOMATED TEST SUITE');
  console.log('█'.repeat(60) + '\n');

  TourTests.reset();

  testTourElements();
  testLocalStorage();
  testZIndex();
  testJoyrideIntegration();
  testTheme();

  const summary = TourTests.getSummary();

  console.log('\n' + '█'.repeat(60));
  console.log('     TEST SUITE COMPLETE');
  console.log('█'.repeat(60) + '\n');

  if (summary.failed === 0 && summary.warnings === 0) {
    console.log('🎉 ALL TESTS PASSED! Tour implementation looks good.');
  } else if (summary.failed > 0) {
    console.log('⚠️  SOME TESTS FAILED. Please review failures above.');
  } else {
    console.log('⚠️  TESTS PASSED WITH WARNINGS. Review warnings above.');
  }

  console.log('\n📝 Manual tests still required:');
  console.log('  - Tour navigation (Previous/Next/Skip buttons)');
  console.log('  - Tour content readability');
  console.log('  - Theme switching during tour');
  console.log('  - Help button functionality');
  console.log('  - Mobile responsiveness\n');
}

// ══════════════════════════════════════════════════════════════════
// EXPORT TEST FUNCTIONS
// ══════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log('TOUR TEST SCRIPT LOADED');
console.log('═'.repeat(60));
console.log('\nAvailable commands:');
console.log('  runAllTests()        - Run complete automated test suite');
console.log('  testTourElements()   - Test data-tour attributes');
console.log('  testLocalStorage()   - Test localStorage functionality');
console.log('  testZIndex()         - Test z-index values');
console.log('  testJoyrideIntegration() - Test Joyride components');
console.log('  testTheme()          - Test theme compatibility');
console.log('\nHelper commands:');
console.log('  resetTour()          - Clear tour completion state');
console.log('  completeTour()       - Mark tour as completed');
console.log('  checkTourStatus()    - Check current tour status');
console.log('  TourTests.getSummary() - View test summary');
console.log('═'.repeat(60) + '\n');
console.log('▶️  Run runAllTests() to begin\n');
