import { useState, useEffect, useMemo, useCallback } from 'react'
import { Joyride } from 'react-joyride'
import { supabase } from './lib/supabase'
import LawList from './components/LawList'
import StatsOverview from './components/StatsOverview'
import NetworkGraphStyled from './components/NetworkGraphStyled'
import { tourSteps } from './lib/tourSteps'
import { getTourStyles } from './lib/tourStyles'
import TourTooltip from './components/TourTooltip'
import HelpModal from './components/HelpModal'

function App() {
  const [laws, setLaws] = useState([])
  const [categoryMeta, setCategoryMeta] = useState({})
  const [selectedLaw, setSelectedLaw] = useState(null)
  const [view, setView] = useState('network') // network, list, split, stats
  const [lightMode, setLightMode] = useState(false)
  const toggleTheme = () => setLightMode(v => !v)

  // Shared navigation state for split view sync
  const [navState, setNavState] = useState({
    expandedRoot: null,
    expandedL2: null,
    expandedL3: null,
    expandedL4: null,
  })

  // Tour state management
  const [runTour, setRunTour] = useState(() => {
    try {
      return !localStorage.getItem('torahLawsTourCompleted')
    } catch {
      return false // If localStorage unavailable, don't auto-start
    }
  })

  // Help modal state
  const [showHelp, setShowHelp] = useState(false)

  // Load laws and category metadata from Supabase
  useEffect(() => {
    Promise.all([
      supabase.rpc('get_frontend_laws'),
      supabase.rpc('get_category_metadata')
    ])
      .then(([lawsRes, metaRes]) => {
        if (lawsRes.error) throw lawsRes.error
        if (metaRes.error) throw metaRes.error
        setLaws(lawsRes.data || [])
        setCategoryMeta(metaRes.data || {})
      })
      .catch(err => console.error('Error loading data:', err))
  }, [])

  const handleJoyrideCallback = useCallback((data) => {
    const { status } = data

    // Tour finished or skipped
    if (status === 'finished' || status === 'skipped') {
      try {
        localStorage.setItem('torahLawsTourCompleted', 'true')
      } catch {
        // Ignore localStorage errors
      }
      setRunTour(false)
    }
  }, [])

  const handleShowHelp = useCallback(() => {
    setShowHelp(true)
  }, [])

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableScrolling={true}
        spotlightClicks={false}
        styles={getTourStyles(lightMode)}
        callback={handleJoyrideCallback}
        tooltipComponent={(props) => (
          <div data-theme={lightMode ? 'light' : 'dark'}>
            <TourTooltip {...props} />
          </div>
        )}
        floaterProps={{
          disableAnimation: false,
          placement: 'auto'
        }}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        lightMode={lightMode}
      />

      {/* ── Network view: full-screen ── */}
      {view === 'network' && (
        <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
          <NetworkGraphStyled
            laws={laws}
            categoryMeta={categoryMeta}
            onSelectLaw={setSelectedLaw}
            selectedLaw={selectedLaw}
            onCloseLaw={() => setSelectedLaw(null)}
            onSwitchView={setView}
            lightMode={lightMode}
            onToggleTheme={toggleTheme}
            onShowHelp={handleShowHelp}
          />
        </div>
      )}

      {/* ── List view: full-screen accordion ── */}
      {view === 'list' && (
        <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
          <LawList
            laws={laws}
            categoryMeta={categoryMeta}
            onSelectLaw={setSelectedLaw}
            selectedLaw={selectedLaw}
            onCloseLaw={() => setSelectedLaw(null)}
            onSwitchView={setView}
            lightMode={lightMode}
            onToggleTheme={toggleTheme}
            onShowHelp={handleShowHelp}
          />
        </div>
      )}

      {/* ── Split view: accordion left 40%, network right 60% ── */}
      {view === 'split' && (
        <div className={`split-fullscreen${lightMode ? ' light' : ''}`}>
          <div className="split-left">
            <LawList
              laws={laws}
              categoryMeta={categoryMeta}
              onSelectLaw={setSelectedLaw}
              selectedLaw={selectedLaw}
              onCloseLaw={() => setSelectedLaw(null)}
              onSwitchView={setView}
              hideSidePanel
              navState={navState}
              onNavChange={setNavState}
              lightMode={lightMode}
              onToggleTheme={toggleTheme}
              onShowHelp={handleShowHelp}
            />
          </div>
          <div className="split-right">
            <NetworkGraphStyled
              laws={laws}
              categoryMeta={categoryMeta}
              onSelectLaw={setSelectedLaw}
              selectedLaw={selectedLaw}
              onCloseLaw={() => setSelectedLaw(null)}
              onSwitchView={setView}
              navState={navState}
              onNavChange={setNavState}
              lightMode={lightMode}
              onToggleTheme={toggleTheme}
              onShowHelp={handleShowHelp}
            />
          </div>
        </div>
      )}

      {/* ── Stats view: full-screen dark themed ── */}
      {view === 'stats' && (
        <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
          <StatsOverview
            laws={laws}
            categoryMeta={categoryMeta}
            onSwitchView={setView}
            lightMode={lightMode}
            onToggleTheme={toggleTheme}
            onShowHelp={handleShowHelp}
          />
        </div>
      )}
    </>
  )
}

export default App
