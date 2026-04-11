// src/lib/tourStyles.js
export const getTourStyles = (lightMode) => ({
  options: {
    arrowColor: lightMode ? '#ffffff' : '#0a0908',
    backgroundColor: lightMode ? '#ffffff' : '#0a0908',
    overlayColor: lightMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(10, 9, 8, 0.75)',
    primaryColor: lightMode ? '#a68a20' : '#d2b478',
    textColor: lightMode ? '#0a0908' : '#f5f5f0',
    width: 380,
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: 8,
    border: lightMode ? '1px solid rgba(166, 138, 32, 0.3)' : '1px solid rgba(210, 180, 120, 0.3)',
  },
  spotlight: {
    borderRadius: 4,
    border: lightMode ? '2px solid rgba(166, 138, 32, 0.3)' : '2px solid rgba(210, 180, 120, 0.3)',
  },
  buttonNext: {
    backgroundColor: lightMode ? '#a68a20' : '#d2b478',
    color: lightMode ? '#ffffff' : '#0a0908',
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  buttonBack: {
    color: lightMode ? '#a68a20' : '#d2b478',
    marginRight: 8,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonSkip: {
    color: '#a0a0a0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
})
