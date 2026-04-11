import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import LawList from './components/LawList'
import StatsOverview from './components/StatsOverview'
import NetworkGraphStyled from './components/NetworkGraphStyled'

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

  // ── Network view: full-screen ──
  if (view === 'network') {
    return (
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
          categoryMeta={categoryMeta}
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
          />
        </div>
      </div>
    )
  }

  // ── Stats view: full-screen dark themed ──
  return (
    <div className={`network-fullscreen${lightMode ? ' light' : ''}`}>
      <StatsOverview
        laws={laws}
        categoryMeta={categoryMeta}
        onSwitchView={setView}
        lightMode={lightMode}
        onToggleTheme={toggleTheme}
      />
    </div>
  )
}

export default App
