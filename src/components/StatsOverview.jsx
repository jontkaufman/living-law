import { BarChart3, BookOpen, Users, Sparkles, Clock, AlertCircle } from 'lucide-react'

function StatsOverview({ laws }) {
  // Calculate statistics
  const totalLaws = laws.length
  const analyzedLaws = laws.filter(l => l.duration_type).length
  const unanalyzedLaws = totalLaws - analyzedLaws

  // By book
  const byBook = laws.reduce((acc, law) => {
    acc[law.book] = (acc[law.book] || 0) + 1
    return acc
  }, {})

  // By duration type
  const byDuration = laws.reduce((acc, law) => {
    if (law.duration_type) {
      acc[law.duration_type] = (acc[law.duration_type] || 0) + 1
    }
    return acc
  }, {})

  // By applicability
  const byApplicability = laws.reduce((acc, law) => {
    if (law.current_applicability) {
      acc[law.current_applicability] = (acc[law.current_applicability] || 0) + 1
    }
    return acc
  }, {})

  // By regulated party
  const byParty = laws.reduce((acc, law) => {
    if (law.regulated_party) {
      acc[law.regulated_party] = (acc[law.regulated_party] || 0) + 1
    }
    return acc
  }, {})

  // Special counts
  const eternalCount = laws.filter(l => l.duration_type === 'explicit_perpetual').length
  const foreverLanguageCount = laws.filter(l => l.has_forever_language).length
  const generationalLanguageCount = laws.filter(l => l.has_generational_language).length
  const currentlyApplicableCount = laws.filter(l => l.current_applicability === 'currently_applicable').length
  const prerequisitePendingCount = laws.filter(l => l.current_applicability === 'prerequisite_pending').length

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'torah' }) => (
    <div className="law-card p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
      )}
    </div>
  )

  const BreakdownSection = ({ title, data, icon: Icon }) => (
    <div className="law-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-torah-600 dark:text-torah-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([key, count]) => {
            const percentage = ((count / totalLaws) * 100).toFixed(1)
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium ml-2">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-torah-600 dark:bg-torah-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Statistics Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive breakdown of {totalLaws} Torah laws
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          title="Total Laws"
          value={totalLaws}
          subtitle={`${analyzedLaws} analyzed, ${unanalyzedLaws} pending`}
        />
        <StatCard
          icon={Sparkles}
          title="Eternal Laws"
          value={eternalCount}
          subtitle={`${foreverLanguageCount} with "forever" language`}
          color="eternal"
        />
        <StatCard
          icon={Users}
          title="Currently Applicable"
          value={currentlyApplicableCount}
          subtitle={`${prerequisitePendingCount} awaiting prerequisites`}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          title="Forever Language"
          value={foreverLanguageCount}
          subtitle={`${generationalLanguageCount} generational phrases`}
          color="eternal"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownSection
          title="By Book"
          data={byBook}
          icon={BookOpen}
        />
        <BreakdownSection
          title="By Duration Type"
          data={byDuration}
          icon={Clock}
        />
        <BreakdownSection
          title="By Current Applicability"
          data={byApplicability}
          icon={BarChart3}
        />
        <BreakdownSection
          title="By Regulated Party"
          data={byParty}
          icon={Users}
        />
      </div>
    </div>
  )
}

export default StatsOverview
