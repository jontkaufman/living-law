import { X, Sparkles, Clock, BookOpen, Users, AlertCircle, Info, MessageSquare } from 'lucide-react'

function LawDetail({ law, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen px-4 py-8">
        <div
          className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {law.reference}
                </h2>
                {law.has_forever_language && (
                  <Sparkles className="w-6 h-6 text-eternal-600 dark:text-eternal-400" />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {law.book} {law.chapter}:{law.verse}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Verse Text */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Verse Text
              </h3>
              <blockquote className="text-lg text-gray-900 dark:text-gray-100 border-l-4 border-torah-500 pl-4 italic">
                {law.verse_text}
              </blockquote>
            </section>

            {/* Law Summary */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Law Summary
              </h3>
              <p className="text-gray-900 dark:text-gray-100">
                {law.law_summary}
              </p>
            </section>

            {/* Classification */}
            <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Classification
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration Type</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {law.duration_type?.replace('_', ' ') || 'Not analyzed'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Applicability</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {law.current_applicability?.replace('_', ' ') || 'Not analyzed'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Regulated Party</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {law.regulated_party || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Context Type</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {law.context_type?.replace('_', ' ') || 'Not analyzed'}
                  </p>
                </div>
              </div>
            </section>

            {/* Perpetuity Markers */}
            {(law.has_forever_language || law.has_generational_language) && (
              <section className="bg-eternal-50 dark:bg-eternal-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-eternal-700 dark:text-eternal-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Eternal Language
                </h3>
                {law.has_forever_language && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Forever Phrase</p>
                    <p className="font-medium text-eternal-900 dark:text-eternal-100">
                      "{law.forever_phrase}"
                    </p>
                  </div>
                )}
                {law.has_generational_language && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Generational Phrase</p>
                    <p className="font-medium text-eternal-900 dark:text-eternal-100">
                      "{law.generational_phrase}"
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Prerequisites */}
            {(law.requires_temple || law.requires_priesthood || law.requires_land_israel || law.requires_specific_role) && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prerequisites
                </h3>
                <div className="space-y-2">
                  {law.requires_temple && law.requires_temple !== 'no' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        Requires Temple: <span className="font-medium">{law.requires_temple}</span>
                      </span>
                    </div>
                  )}
                  {law.requires_priesthood && law.requires_priesthood !== 'no' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        Requires Priesthood: <span className="font-medium">{law.requires_priesthood}</span>
                      </span>
                    </div>
                  )}
                  {law.requires_land_israel && law.requires_land_israel !== 'no' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        Requires Land of Israel: <span className="font-medium">{law.requires_land_israel}</span>
                      </span>
                    </div>
                  )}
                  {law.requires_specific_role && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        Specific Role: <span className="font-medium">{law.requires_specific_role}</span>
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Analysis Details */}
            {law.classification_reasoning && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Classification Reasoning
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {law.classification_reasoning}
                </p>
              </section>
            )}

            {law.textual_evidence && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Textual Evidence
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {law.textual_evidence}
                </p>
              </section>
            )}

            {/* Cross References */}
            {law.other_torah_refs && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Related Verses
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {law.other_torah_refs}
                </p>
              </section>
            )}

            {/* Interpretive Questions */}
            {law.interpretive_questions && (
              <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Open Questions
                </h3>
                <p className="text-blue-900 dark:text-blue-100 text-sm">
                  {law.interpretive_questions}
                </p>
              </section>
            )}

            {/* Review Metadata */}
            {law.reviewed_by && (
              <section className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p>
                  Reviewed by: <span className="font-medium">{law.reviewed_by}</span>
                  {law.review_date && <> on {law.review_date}</>}
                  {law.confidence_level && <> · Confidence: {law.confidence_level}/5</>}
                </p>
              </section>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LawDetail
