import { useState, useEffect, useCallback } from 'react'
import { Sparkles, X, Clock, BookOpen, Info, MessageSquare, Search, Mail, Send } from 'lucide-react'
import {
  OBSERVANCE_CONFIG, BOOK_NAMES, FEEDBACK_API,
  extractKeywords,
} from '../lib/lawHelpers'

function LawSidePanel({ selectedLaw, onCloseLaw }) {
  const [sideTab, setSideTab] = useState('study')
  const [fetchedVerse, setFetchedVerse] = useState(null)
  const [verseCache, setVerseCache] = useState({})
  const [keywordResults, setKeywordResults] = useState(null)

  // Feedback dialog state
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackContext, setFeedbackContext] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  // Fetch a verse from bible-api.com
  const fetchVerse = useCallback((ref) => {
    const cleanRef = ref.replace(/\s*\(.*?\)\s*/g, '').trim()
    if (!cleanRef) return

    if (verseCache[cleanRef]) {
      setFetchedVerse({ reference: cleanRef, text: verseCache[cleanRef], loading: false, error: null })
      return
    }

    setFetchedVerse({ reference: cleanRef, text: null, loading: true, error: null })

    const apiRef = cleanRef.replace(/\s+/g, '+')
    fetch(`https://bible-api.com/${encodeURIComponent(apiRef)}`)
      .then(res => {
        if (!res.ok) throw new Error('Verse not found')
        return res.json()
      })
      .then(data => {
        const text = data.text?.trim()
        if (!text) throw new Error('No text returned')
        setVerseCache(prev => ({ ...prev, [cleanRef]: text }))
        setFetchedVerse({ reference: data.reference || cleanRef, text, loading: false, error: null })
      })
      .catch(() => {
        setFetchedVerse({ reference: cleanRef, text: null, loading: false, error: 'Could not load verse' })
      })
  }, [verseCache])

  // Search Bible by keyword via bolls.life
  const searchKeyword = useCallback((keyword) => {
    setKeywordResults({ keyword, results: [], loading: true, error: null })
    fetch(`https://bolls.life/search/WEB/${encodeURIComponent(keyword)}/`)
      .then(res => {
        if (!res.ok) throw new Error('Search failed')
        return res.json()
      })
      .then(data => {
        const results = (data || []).slice(0, 20).map(v => ({
          reference: `${BOOK_NAMES[v.book] || `Book ${v.book}`} ${v.chapter}:${v.verse}`,
          text: (v.text || '').replace(/<\/?mark>/g, ''),
          highlighted: v.text || '',
        }))
        setKeywordResults({ keyword, results, loading: false, error: null })
      })
      .catch(() => {
        setKeywordResults({ keyword, results: [], loading: false, error: 'Search failed' })
      })
  }, [])

  // Reset panel state when law changes
  useEffect(() => {
    setFetchedVerse(null)
    setKeywordResults(null)
    setSideTab('study')
  }, [selectedLaw])

  return (
    <>
      <div className={`side-panel ${selectedLaw ? 'open' : ''}`} data-tour="side-panel">
        {selectedLaw && (
          <>
            <div className="side-panel-header">
              <div className="side-panel-title-area">
                <h2 className="side-panel-title">{selectedLaw.reference}</h2>
                {selectedLaw.has_forever_language && (
                  <Sparkles className="w-5 h-5 side-panel-eternal-icon" />
                )}
              </div>
              <button onClick={onCloseLaw} className="side-panel-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="side-panel-tabs">
              <button
                className={`side-panel-tab ${sideTab === 'study' ? 'active' : ''}`}
                onClick={() => setSideTab('study')}
              >
                <BookOpen className="w-4 h-4" />
                Study
              </button>
              <button
                className={`side-panel-tab ${sideTab === 'details' ? 'active' : ''}`}
                onClick={() => setSideTab('details')}
              >
                <Info className="w-4 h-4" />
                Details
              </button>
            </div>

            <div className="side-panel-body">

              {/* Study Tab */}
              {sideTab === 'study' && (
                <>
                  <section className="side-panel-section">
                    <h3 className="side-panel-label">Verse Text</h3>
                    <blockquote className="side-panel-verse">{selectedLaw.verse_text}</blockquote>
                  </section>

                  <section className="side-panel-section">
                    <h3 className="side-panel-label">Law Summary</h3>
                    <p className="side-panel-text">{selectedLaw.law_summary}</p>
                  </section>

                  {(selectedLaw.has_forever_language || selectedLaw.has_generational_language) && (
                    <section className="side-panel-section side-panel-eternal">
                      <h3 className="side-panel-label">
                        <Sparkles className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Eternal Language
                      </h3>
                      {selectedLaw.has_forever_language && selectedLaw.forever_phrase && (
                        <p className="side-panel-text side-panel-phrase">"{selectedLaw.forever_phrase}"</p>
                      )}
                      {selectedLaw.has_generational_language && selectedLaw.generational_phrase && (
                        <p className="side-panel-text side-panel-phrase">"{selectedLaw.generational_phrase}"</p>
                      )}
                    </section>
                  )}

                  {selectedLaw.cross_references?.length > 0 && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">
                        <BookOpen className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Cross References
                      </h3>
                      <div className="side-panel-refs" data-tour="panel-references">
                        {selectedLaw.cross_references.map((ref, i) => (
                          <button key={i} className="verse-ref-btn" onClick={() => fetchVerse(ref)}>
                            {ref}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedLaw.other_torah_refs && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">
                        <BookOpen className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Related Verses
                      </h3>
                      <div className="side-panel-refs" data-tour="panel-references">
                        {(Array.isArray(selectedLaw.other_torah_refs)
                          ? selectedLaw.other_torah_refs
                          : selectedLaw.other_torah_refs.split(/,\s*(?=[A-Z0-9])/)
                        ).map((ref, i) => {
                          const clean = (ref || '').trim()
                          if (!clean) return null
                          return (
                            <button key={i} className="verse-ref-btn" onClick={() => fetchVerse(clean)}>
                              {clean}
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* Fetched verse display */}
                  {fetchedVerse && (
                    <section className="side-panel-section side-panel-fetched-verse">
                      <div className="fetched-verse-header">
                        <h3 className="side-panel-label">
                          <BookOpen className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                          {fetchedVerse.reference}
                        </h3>
                        <button className="fetched-verse-close" onClick={() => setFetchedVerse(null)}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {fetchedVerse.loading && (
                        <p className="side-panel-text fetched-verse-loading">Loading verse...</p>
                      )}
                      {fetchedVerse.error && (
                        <p className="side-panel-text fetched-verse-error">{fetchedVerse.error}</p>
                      )}
                      {fetchedVerse.text && (
                        <>
                          <blockquote className="side-panel-verse">{fetchedVerse.text}</blockquote>
                          <div className="keyword-tags">
                            {extractKeywords(fetchedVerse.text).map((kw, i) => (
                              <button key={i} className="keyword-tag" onClick={() => searchKeyword(kw)}>
                                {kw}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  )}

                  {/* Keywords from verse text */}
                  {!fetchedVerse && selectedLaw.verse_text && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">
                        <Search className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Search by Keyword
                      </h3>
                      <div className="keyword-tags">
                        {extractKeywords(selectedLaw.verse_text).map((kw, i) => (
                          <button key={i} className="keyword-tag" onClick={() => searchKeyword(kw)}>
                            {kw}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Keyword search results */}
                  {keywordResults && (
                    <section className="side-panel-section side-panel-keyword-results">
                      <div className="fetched-verse-header">
                        <h3 className="side-panel-label">
                          <Search className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                          "{keywordResults.keyword}" in Scripture
                        </h3>
                        <button className="fetched-verse-close" onClick={() => setKeywordResults(null)}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {keywordResults.loading && (
                        <p className="side-panel-text fetched-verse-loading">Searching...</p>
                      )}
                      {keywordResults.error && (
                        <p className="side-panel-text fetched-verse-error">{keywordResults.error}</p>
                      )}
                      {keywordResults.results.length > 0 && (
                        <div className="keyword-results-list">
                          {keywordResults.results.map((r, i) => (
                            <div key={i} className="keyword-result-item">
                              <button
                                className="keyword-result-ref"
                                onClick={() => fetchVerse(r.reference)}
                              >
                                {r.reference}
                              </button>
                              <p
                                className="keyword-result-text"
                                dangerouslySetInnerHTML={{ __html: r.highlighted }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {!keywordResults.loading && keywordResults.results.length === 0 && !keywordResults.error && (
                        <p className="side-panel-text fetched-verse-loading">No results found</p>
                      )}
                    </section>
                  )}
                </>
              )}

              {/* Details Tab */}
              {sideTab === 'details' && (
                <>
                  <section className="side-panel-section side-panel-grid">
                    <h3 className="side-panel-label">Classification</h3>
                    <div className="side-panel-field">
                      <span className="side-panel-field-label">Duration</span>
                      <span className="side-panel-field-value">{selectedLaw.duration_type?.replace(/_/g, ' ') || 'Not analyzed'}</span>
                    </div>
                    <div className="side-panel-field">
                      <span className="side-panel-field-label">Applicability</span>
                      <span className="side-panel-field-value">{selectedLaw.current_applicability?.replace(/_/g, ' ') || 'Not analyzed'}</span>
                    </div>
                    <div className="side-panel-field">
                      <span className="side-panel-field-label">Regulated Party</span>
                      <span className="side-panel-field-value">{selectedLaw.regulated_party || 'Not specified'}</span>
                    </div>
                    {selectedLaw.observance_class && (
                      <div className="side-panel-field">
                        <span className="side-panel-field-label">Observance</span>
                        <span className="side-panel-field-value side-panel-observance">
                          <span style={{ color: OBSERVANCE_CONFIG[selectedLaw.observance_class]?.color }}>
                            {OBSERVANCE_CONFIG[selectedLaw.observance_class]?.symbol}
                          </span>
                          {' '}{OBSERVANCE_CONFIG[selectedLaw.observance_class]?.label || selectedLaw.observance_class.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {selectedLaw.categories?.length > 0 && (
                      <div className="side-panel-field">
                        <span className="side-panel-field-label">Category</span>
                        <span className="side-panel-field-value">
                          {selectedLaw.categories.map(c => c.split(' > ').slice(1).join(' > ')).join('; ')}
                        </span>
                      </div>
                    )}
                  </section>

                  {(selectedLaw.requires_temple || selectedLaw.requires_priesthood || selectedLaw.requires_land_israel) && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">
                        <Clock className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Prerequisites
                      </h3>
                      {selectedLaw.requires_temple && selectedLaw.requires_temple !== 'no' && (
                        <p className="side-panel-prereq">Temple: {selectedLaw.requires_temple}</p>
                      )}
                      {selectedLaw.requires_priesthood && selectedLaw.requires_priesthood !== 'no' && (
                        <p className="side-panel-prereq">Priesthood: {selectedLaw.requires_priesthood}</p>
                      )}
                      {selectedLaw.requires_land_israel && selectedLaw.requires_land_israel !== 'no' && (
                        <p className="side-panel-prereq">Land of Israel: {selectedLaw.requires_land_israel}</p>
                      )}
                    </section>
                  )}

                  {selectedLaw.classification_reasoning && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">Reasoning</h3>
                      <p className="side-panel-text">{selectedLaw.classification_reasoning}</p>
                    </section>
                  )}

                  {selectedLaw.notes && (
                    <section className="side-panel-section">
                      <h3 className="side-panel-label">
                        <MessageSquare className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '5px' }} />
                        Notes
                      </h3>
                      <p className="side-panel-text">{selectedLaw.notes}</p>
                    </section>
                  )}

                  <button
                    className="side-panel-report-btn"
                    onClick={() => {
                      setFeedbackContext(`${selectedLaw.reference} — ${selectedLaw.law_summary}`)
                      setFeedbackSent(false)
                      setShowFeedback(true)
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    Report Issue or Suggest Correction
                  </button>
                </>
              )}
            </div>

            {/* Observance Legend - sticky to bottom */}
            <div className="side-panel-observance-legend">
              <div className="observance-legend-items">
                {Object.entries(OBSERVANCE_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="observance-legend-item-inline">
                    <span className="observance-legend-symbol" style={{ color: cfg.color }}>{cfg.symbol}</span>
                    <span className="observance-legend-label-small">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feedback Dialog */}
      {showFeedback && (
        <div className="feedback-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowFeedback(false) }}>
          <div className="feedback-dialog">
            <div className="feedback-dialog-header">
              <h3 className="feedback-dialog-title">
                <Mail className="w-4 h-4" />
                {feedbackContext ? 'Report Issue' : 'Send Feedback'}
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
                {feedbackContext && (
                  <div className="feedback-context">
                    <span className="feedback-context-label">Regarding:</span>
                    <span className="feedback-context-value">{feedbackContext}</span>
                  </div>
                )}

                <label className="feedback-label">
                  Name
                  <input
                    type="text"
                    className="feedback-field"
                    placeholder="Your name"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                  />
                </label>

                <label className="feedback-label">
                  Email <span className="feedback-optional">(optional)</span>
                  <input
                    type="email"
                    className="feedback-field"
                    placeholder="your@email.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                  />
                </label>

                <label className="feedback-label">
                  Message
                  <textarea
                    className="feedback-field feedback-textarea"
                    placeholder="Share your feedback, report an issue, or suggest a correction..."
                    rows={5}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                  />
                </label>

                {feedbackError && (
                  <div className="feedback-error">{feedbackError}</div>
                )}

                <button
                  className="feedback-submit-btn"
                  disabled={!feedbackMessage.trim() || feedbackSending}
                  onClick={async () => {
                    setFeedbackSending(true)
                    setFeedbackError('')
                    try {
                      const res = await fetch(FEEDBACK_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: feedbackName,
                          email: feedbackEmail,
                          message: feedbackMessage,
                          context: feedbackContext,
                        }),
                      })
                      if (!res.ok) throw new Error('Failed to send')
                      setFeedbackSent(true)
                      setFeedbackName('')
                      setFeedbackEmail('')
                      setFeedbackMessage('')
                    } catch {
                      setFeedbackError('Failed to send. Please try again.')
                    } finally {
                      setFeedbackSending(false)
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                  {feedbackSending ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default LawSidePanel
