import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import LawList from './components/LawList'
import StatsOverview from './components/StatsOverview'
import NetworkGraphStyled from './components/NetworkGraphStyled'

function App() {
  const [laws, setLaws] = useState([])
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

  // Load laws data from Supabase
  useEffect(() => {
    supabase.rpc('get_frontend_laws')
      .then(({ data, error }) => {
        if (error) throw error
        setLaws(data || [])
      })
      .catch(err => console.error('Error loading laws:', err))
  }, [])

  // ── Network view: full-screen ──
  if (view === 'network') {
    return (
      <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
        <NetworkGraphStyled
          laws={laws}
          onSelectLaw={setSelectedLaw}
          selectedLaw={selectedLaw}
          onCloseLaw={() => setSelectedLaw(null)}
          onSwitchView={setView}
          lightMode={lightMode}
          onToggleTheme={toggleTheme}
        />
      </div>
    )
  }

  // ── List view: full-screen accordion ──
  if (view === 'list') {
    return (
      <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
        <LawList
          laws={laws}
          onSelectLaw={setSelectedLaw}
          selectedLaw={selectedLaw}
          onCloseLaw={() => setSelectedLaw(null)}
          onSwitchView={setView}
          lightMode={lightMode}
          onToggleTheme={toggleTheme}
        />
      </div>
    )
  }

  // ── Split view: accordion left 40%, network right 60% ──
  if (view === 'split') {
    return (
      <div className={`split-fullscreen${lightMode ? ' light' : ''}`}>
        <div className="split-left">
          <LawList
            laws={laws}
            onSelectLaw={setSelectedLaw}
            selectedLaw={selectedLaw}
            onCloseLaw={() => setSelectedLaw(null)}
            onSwitchView={setView}
            hideSidePanel
            navState={navState}
            onNavChange={setNavState}
            lightMode={lightMode}
            onToggleTheme={toggleTheme}
          />
        </div>
        <div className="split-right">
          <NetworkGraphStyled
            laws={laws}
            onSelectLaw={setSelectedLaw}
            selectedLaw={selectedLaw}
            onCloseLaw={() => setSelectedLaw(null)}
            onSwitchView={setView}
            navState={navState}
            onNavChange={setNavState}
            lightMode={lightMode}
            onToggleTheme={toggleTheme}
          />
        </div>
      </div>
    )
  }

  // ── Stats view: full-screen dark themed ──
  return (
    <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
      <StatsOverview laws={laws} onSwitchView={setView} lightMode={lightMode} onToggleTheme={toggleTheme} />
    </div>
  )
}

export default App
