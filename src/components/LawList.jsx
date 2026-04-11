import { useState, useMemo, useRef } from 'react'
import { ChevronRight, ChevronDown, Search, X, Network, BarChart3, Columns2, Mail, Sparkles, Sun, Moon } from 'lucide-react'
import LawSidePanel from './LawSidePanel'
import {
  LEVEL2_CONFIG, OBSERVANCE_CONFIG, FEEDBACK_API,
  buildHierarchyTree, countAllLaws, collectAllLaws,
  formatLabel, getShortTitle,
} from '../lib/lawHelpers'
import './LawList.css'

function LawList({ laws, onSelectLaw, selectedLaw, onCloseLaw, onSwitchView, hideSidePanel, navState, onNavChange, lightMode, onToggleTheme }) {
  // Internal accordion state — used when not controlled by parent (standalone mode)
  const [_expandedRoot, _setExpandedRoot] = useState(null)
  const [_expandedL2, _setExpandedL2] = useState(null)
  const [_expandedL3, _setExpandedL3] = useState(null)
  const [_expandedL4, _setExpandedL4] = useState(null)

  // Controlled vs uncontrolled: use navState props when in split view
  const isControlled = !!navState
  const expandedRoot = isControlled ? navState.expandedRoot : _expandedRoot
  const expandedL2 = isControlled ? navState.expandedL2 : _expandedL2
  const expandedL3 = isControlled ? navState.expandedL3 : _expandedL3
  const expandedL4 = isControlled ? navState.expandedL4 : _expandedL4

  const setExpandedRoot = isControlled
    ? (v) => onNavChange({ ...navState, expandedRoot: v, expandedL2: null, expandedL3: null, expandedL4: null })
    : _setExpandedRoot
  const setExpandedL2 = isControlled
    ? (v) => onNavChange({ ...navState, expandedL2: v, expandedL3: null, expandedL4: null })
    : _setExpandedL2
  const setExpandedL3 = isControlled
    ? (v) => onNavChange({ ...navState, expandedL3: v, expandedL4: null })
    : _setExpandedL3
  const setExpandedL4 = isControlled
    ? (v) => onNavChange({ ...navState, expandedL4: v })
    : _setExpandedL4

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef(null)

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  const hierarchy = useMemo(() => buildHierarchyTree(laws), [laws])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return laws.filter(law => {
      const text = [law.reference, law.law_summary, law.verse_text].join(' ').toLowerCase()
      return text.includes(q)
    }).slice(0, 15)
  }, [searchQuery, laws])

  // Navigate to a law from search
  const navigateToLaw = (law) => {
    const paths = law.categories || []
    if (paths.length > 0) {
      const parts = paths[0].split(' > ').map(s => s.trim())
      if (isControlled) {
        onNavChange({
          expandedRoot: parts[0] || null,
          expandedL2: parts[1] || null,
          expandedL3: parts[2] || null,
          expandedL4: parts[3] || null,
        })
      } else {
        if (parts[0]) _setExpandedRoot(parts[0])
        if (parts[1]) _setExpandedL2(parts[1])
        if (parts[2]) _setExpandedL3(parts[2])
        if (parts[3]) _setExpandedL4(parts[3])
      }
    }
    onSelectLaw(law)
    setSearchQuery('')
    setShowSearch(false)
  }

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = ['Torah Laws']
    if (expandedRoot) {
      crumbs.push(expandedRoot === 'love-god' ? 'LOVE YHWH' : 'LOVE YOUR NEIGHBOR')
    }
    if (expandedL2) {
      const config = LEVEL2_CONFIG[expandedL2]
      crumbs.push(config ? config.label : formatLabel(expandedL2))
    }
    if (expandedL3) crumbs.push(formatLabel(expandedL3))
    if (expandedL4) crumbs.push(formatLabel(expandedL4))
    return crumbs
  }, [expandedRoot, expandedL2, expandedL3, expandedL4])

  const navigateTo = (level) => {
    if (isControlled) {
      const ns = { ...navState }
      if (level <= 0) { ns.expandedRoot = null; ns.expandedL2 = null; ns.expandedL3 = null; ns.expandedL4 = null }
      else if (level <= 1) { ns.expandedL2 = null; ns.expandedL3 = null; ns.expandedL4 = null }
      else if (level <= 2) { ns.expandedL3 = null; ns.expandedL4 = null }
      else if (level <= 3) { ns.expandedL4 = null }
      onNavChange(ns)
    } else {
      if (level <= 0) { _setExpandedRoot(null); _setExpandedL2(null); _setExpandedL3(null); _setExpandedL4(null) }
      else if (level <= 1) { _setExpandedL2(null); _setExpandedL3(null); _setExpandedL4(null) }
      else if (level <= 2) { _setExpandedL3(null); _setExpandedL4(null) }
      else if (level <= 3) { _setExpandedL4(null) }
    }
  }

  // Root categories
  const roots = useMemo(() => {
    const result = []
    if (hierarchy['love-god']) {
      result.push({
        key: 'love-god',
        label: 'LOVE YHWH',
        subtitle: 'with all your heart',
        node: hierarchy['love-god'],
        color: [220, 190, 130],
      })
    }
    if (hierarchy['love-neighbor']) {
      result.push({
        key: 'love-neighbor',
        label: 'LOVE YOUR NEIGHBOR',
        subtitle: 'as yourself',
        node: hierarchy['love-neighbor'],
        color: [170, 195, 130],
      })
    }
    return result
  }, [hierarchy])

  const toggleRoot = (key) => {
    const newRoot = expandedRoot === key ? null : key
    if (isControlled) {
      onNavChange({ expandedRoot: newRoot, expandedL2: null, expandedL3: null, expandedL4: null })
    } else {
      _setExpandedRoot(newRoot); _setExpandedL2(null); _setExpandedL3(null); _setExpandedL4(null)
    }
  }

  const toggleL2 = (key) => {
    const newL2 = expandedL2 === key ? null : key
    if (isControlled) {
      onNavChange({ ...navState, expandedL2: newL2, expandedL3: null, expandedL4: null })
    } else {
      _setExpandedL2(newL2); _setExpandedL3(null); _setExpandedL4(null)
    }
  }

  const toggleL3 = (key) => {
    const newL3 = expandedL3 === key ? null : key
    if (isControlled) {
      onNavChange({ ...navState, expandedL3: newL3, expandedL4: null })
    } else {
      _setExpandedL3(newL3); _setExpandedL4(null)
    }
  }

  const toggleL4 = (key) => {
    const newL4 = expandedL4 === key ? null : key
    if (isControlled) {
      onNavChange({ ...navState, expandedL4: newL4 })
    } else {
      _setExpandedL4(newL4)
    }
  }

  // Render a list of laws
  const renderLaws = (lawsArray, color) => {
    return lawsArray.map(law => {
      const obsConfig = law.observance_class ? OBSERVANCE_CONFIG[law.observance_class] : null
      const [r, g, b] = color
      return (
        <button
          key={law.id}
          className={`accordion-law ${selectedLaw?.id === law.id ? 'selected' : ''}`}
          onClick={() => onSelectLaw(law)}
        >
          <span className="accordion-law-ref" style={{ color: `rgb(${r}, ${g}, ${b})` }}>
            {law.reference}
          </span>
          <span className="accordion-law-summary">
            {getShortTitle(law, 80)}
          </span>
          {obsConfig && (
            <span className="accordion-law-obs" style={{ color: obsConfig.color }}>
              {obsConfig.symbol}
            </span>
          )}
        </button>
      )
    })
  }

  // Render L4 categories + their laws
  const renderL4 = (l3Data, parentColor) => {
    const l4Keys = Object.keys(l3Data._children)
    if (l4Keys.length === 0) {
      const allLaws = collectAllLaws(l3Data)
      return <div className="accordion-laws">{renderLaws(allLaws, parentColor)}</div>
    }

    return l4Keys.map(l4Key => {
      const l4Data = l3Data._children[l4Key]
      const lawCount = countAllLaws(l4Data)
      const isOpen = expandedL4 === l4Key
      const [r, g, b] = parentColor

      return (
        <div key={l4Key} className="accordion-l4">
          <button
            className={`accordion-row accordion-row-l4 ${isOpen ? 'open' : ''}`}
            onClick={() => toggleL4(l4Key)}
            style={{ '--cat-r': r, '--cat-g': g, '--cat-b': b }}
          >
            <span className="accordion-chevron">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            <span className="accordion-row-label">{formatLabel(l4Key)}</span>
            <span className="accordion-row-count">{lawCount} {lawCount === 1 ? 'law' : 'laws'}</span>
          </button>
          {isOpen && (
            <div className="accordion-laws">
              {renderLaws(collectAllLaws(l4Data), parentColor)}
            </div>
          )}
        </div>
      )
    })
  }

  // Render L3 categories
  const renderL3 = (l2Data, parentColor) => {
    const l3Keys = Object.keys(l2Data._children)
    if (l3Keys.length === 0) {
      const allLaws = collectAllLaws(l2Data)
      return <div className="accordion-laws">{renderLaws(allLaws, parentColor)}</div>
    }

    return l3Keys.map(l3Key => {
      const l3Data = l2Data._children[l3Key]
      const lawCount = countAllLaws(l3Data)
      const isOpen = expandedL3 === l3Key
      const [r, g, b] = parentColor

      return (
        <div key={l3Key} className="accordion-l3">
          <button
            className={`accordion-row accordion-row-l3 ${isOpen ? 'open' : ''}`}
            onClick={() => toggleL3(l3Key)}
            style={{ '--cat-r': r, '--cat-g': g, '--cat-b': b }}
          >
            <span className="accordion-chevron">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            <span className="accordion-row-label">{formatLabel(l3Key)}</span>
            <span className="accordion-row-count">{lawCount} {lawCount === 1 ? 'law' : 'laws'}</span>
          </button>
          {isOpen && (
            <div className="accordion-l3-content">
              {renderL4(l3Data, parentColor)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className={`accordion-container ${lightMode ? 'light' : ''}`}>
      {/* Header */}
      <div className="accordion-header">
        <div className="accordion-header-left">
          <div className="breadcrumbs">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="breadcrumb">
                {i > 0 && <span className="sep">//</span>}
                <button
                  className={`breadcrumb-btn ${i === breadcrumbs.length - 1 ? 'active' : ''}`}
                  onClick={() => navigateTo(i)}
                  disabled={i === breadcrumbs.length - 1}
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Search — center */}
        <div className="accordion-header-center">
          <div className="header-search">
            {showSearch ? (
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search laws..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setSearchQuery(''); setShowSearch(false) }
                  }}
                  className="search-input"
                  autoFocus
                />
                <button
                  className="search-close"
                  onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                >
                  <X className="w-3 h-3" />
                </button>

                {searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map(law => (
                      <button
                        key={law.id}
                        className="search-result"
                        onClick={() => navigateToLaw(law)}
                      >
                        <span className="search-result-ref">{law.reference}</span>
                        <span className="search-result-title">{getShortTitle(law, 60)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="search-dropdown">
                    <div className="search-no-results">No laws found</div>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-btn" onClick={() => setShowSearch(true)} title="Search laws">
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="accordion-header-right">
          {onSwitchView && (
            <>
              <button className="nav-btn" onClick={() => onSwitchView('split')} title="Split view">
                <Columns2 className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('network')} title="Network view">
                <Network className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('stats')} title="Stats view">
                <BarChart3 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            className="nav-btn"
            onClick={onToggleTheme}
            title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion body */}
      <div className={`accordion-body ${selectedLaw && !hideSidePanel ? 'panel-open' : ''}`}>
        {roots.map(root => {
          const rootCount = countAllLaws(root.node)
          const isRootOpen = expandedRoot === root.key
          const [r, g, b] = root.color
          const l2Keys = Object.keys(root.node._children)

          return (
            <div key={root.key} className="accordion-root">
              <button
                className={`accordion-row accordion-row-root ${isRootOpen ? 'open' : ''}`}
                onClick={() => toggleRoot(root.key)}
                style={{ '--cat-r': r, '--cat-g': g, '--cat-b': b }}
              >
                <span className="accordion-chevron">
                  {isRootOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </span>
                <span className="accordion-root-label">{root.label}</span>
                <span className="accordion-root-subtitle">{root.subtitle}</span>
                <span className="accordion-row-count">{rootCount} laws</span>
              </button>

              {isRootOpen && (
                <div className="accordion-root-content">
                  {l2Keys.map(l2Key => {
                    const l2Data = root.node._children[l2Key]
                    const l2Count = countAllLaws(l2Data)
                    const config = LEVEL2_CONFIG[l2Key] || { label: formatLabel(l2Key), short: '', color: [148, 163, 184] }
                    const isL2Open = expandedL2 === l2Key
                    const [lr, lg, lb] = config.color

                    return (
                      <div key={l2Key} className="accordion-l2">
                        <button
                          className={`accordion-row accordion-row-l2 ${isL2Open ? 'open' : ''}`}
                          onClick={() => toggleL2(l2Key)}
                          style={{ '--cat-r': lr, '--cat-g': lg, '--cat-b': lb }}
                        >
                          <span className="accordion-chevron">
                            {isL2Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          <span className="accordion-row-label">
                            {config.label}
                            {config.short && <span className="accordion-l2-num"> {config.short}</span>}
                          </span>
                          <span className="accordion-row-count">{l2Count} {l2Count === 1 ? 'law' : 'laws'}</span>
                        </button>

                        {isL2Open && (
                          <div className="accordion-l2-content">
                            {renderL3(l2Data, config.color)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Feedback button */}
      <button
        className="feedback-btn"
        title="Send feedback or suggestions"
        onClick={() => { setShowFeedback(true); setFeedbackSent(false) }}
      >
        <Mail className="w-4 h-4" />
        <span>Feedback</span>
      </button>

      {/* Feedback Dialog */}
      {showFeedback && (
        <div className="feedback-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowFeedback(false) }}>
          <div className="feedback-dialog">
            <div className="feedback-dialog-header">
              <h3 className="feedback-dialog-title">
                <Mail className="w-4 h-4" />
                Send Feedback
              </h3>
              <button className="feedback-dialog-close" onClick={() => setShowFeedback(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSent ? (
              <div className="feedback-dialog-body">
                <div className="feedback-sent">
                  <Sparkles className="w-6 h-6" />
                  <p>Thank you for your feedback!</p>
                  <p className="feedback-sent-sub">Your message has been sent.</p>
                  <button className="feedback-submit-btn" onClick={() => setShowFeedback(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="feedback-dialog-body">
                <label className="feedback-label">
                  Name
                  <input type="text" className="feedback-field" placeholder="Your name"
                    value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} />
                </label>
                <label className="feedback-label">
                  Email <span className="feedback-optional">(optional)</span>
                  <input type="email" className="feedback-field" placeholder="your@email.com"
                    value={feedbackEmail} onChange={(e) => setFeedbackEmail(e.target.value)} />
                </label>
                <label className="feedback-label">
                  Message
                  <textarea className="feedback-field feedback-textarea" rows={5}
                    placeholder="Share your feedback, report an issue, or suggest a correction..."
                    value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} />
                </label>
                {feedbackError && <div className="feedback-error">{feedbackError}</div>}
                <button
                  className="feedback-submit-btn"
                  disabled={!feedbackMessage.trim() || feedbackSending}
                  onClick={async () => {
                    setFeedbackSending(true); setFeedbackError('')
                    try {
                      const res = await fetch(FEEDBACK_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: feedbackName, email: feedbackEmail, message: feedbackMessage }),
                      })
                      if (!res.ok) throw new Error('Failed')
                      setFeedbackSent(true); setFeedbackName(''); setFeedbackEmail(''); setFeedbackMessage('')
                    } catch { setFeedbackError('Failed to send. Please try again.') }
                    finally { setFeedbackSending(false) }
                  }}
                >
                  {feedbackSending ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side panel — hidden in split view (network panel handles it) */}
      {!hideSidePanel && <LawSidePanel selectedLaw={selectedLaw} onCloseLaw={onCloseLaw} />}
    </div>
  )
}

export default LawList
