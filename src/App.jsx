import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, BookOpen, BarChart3, Moon, Sun, Network } from 'lucide-react'
import LawList from './components/LawList'
import LawDetail from './components/LawDetail'
import FilterPanel from './components/FilterPanel'
import StatsOverview from './components/StatsOverview'
import NetworkGraphStyled from './components/NetworkGraphStyled'

function App() {
  const [laws, setLaws] = useState([])
  const [selectedLaw, setSelectedLaw] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    regulatedParty: ['all', 'all Israel'], // Default filter
    durationType: [],
    currentApplicability: [],
    book: [],
    hasAnalysis: null,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [view, setView] = useState('network') // network, list, stats

  // Load laws data
  useEffect(() => {
    fetch('/laws-data.json')
      .then(res => res.json())
      .then(data => setLaws(data))
      .catch(err => console.error('Error loading laws:', err))
  }, [])

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Filter and search laws
  const filteredLaws = useMemo(() => {
    return laws.filter(law => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          law.reference,
          law.verse_text,
          law.law_summary,
          law.category,
          law.command_type,
        ].join(' ').toLowerCase()
        if (!searchableText.includes(query)) return false
      }
      if (filters.regulatedParty.length > 0) {
        if (!law.regulated_party || !filters.regulatedParty.includes(law.regulated_party)) return false
      }
      if (filters.durationType.length > 0) {
        if (!law.duration_type || !filters.durationType.includes(law.duration_type)) return false
      }
      if (filters.currentApplicability.length > 0) {
        if (!law.current_applicability || !filters.currentApplicability.includes(law.current_applicability)) return false
      }
      if (filters.book.length > 0) {
        if (!filters.book.includes(law.book)) return false
      }
      if (filters.hasAnalysis !== null) {
        const hasAnalysis = law.duration_type !== null
        if (hasAnalysis !== filters.hasAnalysis) return false
      }
      return true
    })
  }, [laws, searchQuery, filters])

  // ── Network view: full-screen, no chrome ──
  if (view === 'network') {
    return (
      <div className="network-fullscreen">
        <NetworkGraphStyled
          laws={filteredLaws}
          onSelectLaw={setSelectedLaw}
          selectedLaw={selectedLaw}
          onCloseLaw={() => setSelectedLaw(null)}
          onSwitchView={setView}
        />
      </div>
    )
  }

  // ── List / Stats views: traditional layout with header ──
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-torah-600 dark:text-torah-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Torah Law Explorer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interactive Study Platform · {filteredLaws.length} laws
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('network')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'network'
                      ? 'bg-white dark:bg-gray-800 text-torah-600 dark:text-torah-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Network className="w-4 h-4 inline mr-1" />
                  Network
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'list'
                      ? 'bg-white dark:bg-gray-800 text-torah-600 dark:text-torah-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  List
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'stats'
                      ? 'bg-white dark:bg-gray-800 text-torah-600 dark:text-torah-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Stats
                </button>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="btn btn-secondary"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search laws, verses, references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-torah-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Filters
            </button>
          </div>

          {(filters.regulatedParty.length > 0 || filters.durationType.length > 0 || filters.currentApplicability.length > 0 || filters.book.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.regulatedParty.map(party => (
                <span key={party} className="badge badge-ongoing">{party}</span>
              ))}
              {filters.durationType.map(type => (
                <span key={type} className="badge badge-eternal">{type.replace('_', ' ')}</span>
              ))}
              {filters.book.map(book => (
                <span key={book} className="badge badge-contextual">{book}</span>
              ))}
            </div>
          )}
        </div>

        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            laws={laws}
            onClose={() => setShowFilters(false)}
          />
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedLaw ? (
          <LawDetail law={selectedLaw} onClose={() => setSelectedLaw(null)} />
        ) : view === 'stats' ? (
          <StatsOverview laws={filteredLaws} />
        ) : (
          <LawList laws={filteredLaws} onSelectLaw={setSelectedLaw} />
        )}
      </main>
    </div>
  )
}

export default App
