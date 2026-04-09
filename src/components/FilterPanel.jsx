import { X } from 'lucide-react'

function FilterPanel({ filters, setFilters, laws, onClose }) {
  // Extract unique values from laws
  const uniqueBooks = [...new Set(laws.map(l => l.book).filter(Boolean))]
  const uniqueParties = [...new Set(laws.map(l => l.regulated_party).filter(Boolean))]
  const uniqueDurations = [...new Set(laws.map(l => l.duration_type).filter(Boolean))]
  const uniqueApplicability = [...new Set(laws.map(l => l.current_applicability).filter(Boolean))]

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
  }

  const clearAllFilters = () => {
    setFilters({
      regulatedParty: [],
      durationType: [],
      currentApplicability: [],
      book: [],
      hasAnalysis: null,
    })
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllFilters}
              className="text-sm text-torah-600 dark:text-torah-400 hover:text-torah-700 dark:hover:text-torah-300"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Book Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Book</h4>
            <div className="space-y-2">
              {uniqueBooks.sort().map(book => (
                <label key={book} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.book.includes(book)}
                    onChange={() => toggleFilter('book', book)}
                    className="rounded border-gray-300 dark:border-gray-600 text-torah-600 focus:ring-torah-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">{book}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Regulated Party Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Regulated Party
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uniqueParties.sort().map(party => (
                <label key={party} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.regulatedParty.includes(party)}
                    onChange={() => toggleFilter('regulatedParty', party)}
                    className="rounded border-gray-300 dark:border-gray-600 text-torah-600 focus:ring-torah-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">{party}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration Type
            </h4>
            <div className="space-y-2">
              {uniqueDurations.sort().map(duration => (
                <label key={duration} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.durationType.includes(duration)}
                    onChange={() => toggleFilter('durationType', duration)}
                    className="rounded border-gray-300 dark:border-gray-600 text-torah-600 focus:ring-torah-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    {duration.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Applicability Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Applicability
            </h4>
            <div className="space-y-2">
              {uniqueApplicability.sort().map(app => (
                <label key={app} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.currentApplicability.includes(app)}
                    onChange={() => toggleFilter('currentApplicability', app)}
                    className="rounded border-gray-300 dark:border-gray-600 text-torah-600 focus:ring-torah-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    {app.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
