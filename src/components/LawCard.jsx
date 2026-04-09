import { ChevronRight, Sparkles, Clock, CheckCircle, XCircle } from 'lucide-react'

function LawCard({ law, onClick }) {
  const getDurationBadge = (type) => {
    const badges = {
      'explicit_perpetual': { label: 'Eternal', className: 'badge-eternal', icon: Sparkles },
      'implicit_ongoing': { label: 'Ongoing', className: 'badge-ongoing', icon: CheckCircle },
      'contextual_specific': { label: 'Contextual', className: 'badge-contextual', icon: XCircle },
      'conditional_stated': { label: 'Conditional', className: 'badge-conditional', icon: Clock },
      'ambiguous': { label: 'Ambiguous', className: 'badge badge-gray-100', icon: null },
    }
    return badges[type] || { label: type, className: 'badge', icon: null }
  }

  const getApplicabilityBadge = (app) => {
    const badges = {
      'currently_applicable': { label: 'Currently Applicable', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'prerequisite_pending': { label: 'Prerequisite Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'contextual_completed': { label: 'Contextual', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      'awaiting_condition': { label: 'Awaiting Condition', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'unclear': { label: 'Unclear', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    }
    return badges[app] || { label: app, className: 'badge' }
  }

  const durationBadge = law.duration_type ? getDurationBadge(law.duration_type) : null
  const applicabilityBadge = law.current_applicability ? getApplicabilityBadge(law.current_applicability) : null
  const DurationIcon = durationBadge?.icon

  return (
    <div
      onClick={onClick}
      className="law-card p-4 cursor-pointer hover:border-torah-400 dark:hover:border-torah-600 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-torah-700 dark:text-torah-400">
              {law.reference}
            </span>
            {law.has_forever_language && (
              <Sparkles className="w-4 h-4 text-eternal-600 dark:text-eternal-400" />
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {durationBadge && (
              <span className={`badge ${durationBadge.className} flex items-center gap-1`}>
                {DurationIcon && <DurationIcon className="w-3 h-3" />}
                {durationBadge.label}
              </span>
            )}
            {applicabilityBadge && (
              <span className={`badge ${applicabilityBadge.className}`}>
                {applicabilityBadge.label}
              </span>
            )}
            {law.regulated_party && (
              <span className="badge badge-ongoing">
                {law.regulated_party}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-torah-600 dark:group-hover:text-torah-400 transition-colors" />
      </div>

      {/* Law summary */}
      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2 line-clamp-2">
        {law.law_summary || 'No summary available'}
      </p>

      {/* Verse text preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {law.verse_text}
      </p>

      {/* Bottom metadata */}
      {law.classification_reasoning && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            <span className="font-medium">Reasoning:</span> {law.classification_reasoning}
          </p>
        </div>
      )}
    </div>
  )
}

export default LawCard
