import { useMemo } from 'react'
import { Network, List, Columns2, BookOpen, Sparkles, Users, Clock, Sun, Moon } from 'lucide-react'
import { OBSERVANCE_CONFIG, LEVEL2_CONFIG, buildHierarchyTree, countAllLaws } from '../lib/lawHelpers'
import './StatsOverview.css'

function StatsOverview({ laws, onSwitchView, lightMode, onToggleTheme }) {
  const totalLaws = laws.length

  const stats = useMemo(() => {
    const byBook = {}
    const byDuration = {}
    const byApplicability = {}
    const byParty = {}
    const byCommandType = {}
    const byObservance = {}
    let foreverCount = 0
    let generationalCount = 0
    let templeCount = 0
    let priestCount = 0
    let landCount = 0

    laws.forEach(law => {
      // Book
      if (law.book) byBook[law.book] = (byBook[law.book] || 0) + 1
      // Duration
      if (law.duration_type) byDuration[law.duration_type] = (byDuration[law.duration_type] || 0) + 1
      // Applicability
      if (law.current_applicability) byApplicability[law.current_applicability] = (byApplicability[law.current_applicability] || 0) + 1
      // Regulated party
      if (law.regulated_party) byParty[law.regulated_party] = (byParty[law.regulated_party] || 0) + 1
      // Command type
      if (law.command_type) byCommandType[law.command_type] = (byCommandType[law.command_type] || 0) + 1
      // Observance
      if (law.observance_class) byObservance[law.observance_class] = (byObservance[law.observance_class] || 0) + 1
      // Special flags
      if (law.has_forever_language) foreverCount++
      if (law.has_generational_language) generationalCount++
      if (law.requires_temple && law.requires_temple !== 'no') templeCount++
      if (law.requires_priesthood && law.requires_priesthood !== 'no') priestCount++
      if (law.requires_land_israel && law.requires_land_israel !== 'no') landCount++
    })

    return { byBook, byDuration, byApplicability, byParty, byCommandType, byObservance, foreverCount, generationalCount, templeCount, priestCount, landCount }
  }, [laws])

  // Category tree stats
  const catStats = useMemo(() => {
    const tree = buildHierarchyTree(laws)
    const loveGod = tree['love-god'] ? countAllLaws(tree['love-god']) : 0
    const loveNeighbor = tree['love-neighbor'] ? countAllLaws(tree['love-neighbor']) : 0

    // L2 breakdown
    const l2Counts = []
    ;['love-god', 'love-neighbor'].forEach(root => {
      if (!tree[root]) return
      Object.entries(tree[root]._children).forEach(([key, node]) => {
        const config = LEVEL2_CONFIG[key]
        l2Counts.push({
          key,
          label: config ? `${config.label} ${config.short}` : key,
          count: countAllLaws(node),
          color: config?.color || [160, 160, 160],
        })
      })
    })
    l2Counts.sort((a, b) => b.count - a.count)

    return { loveGod, loveNeighbor, l2Counts }
  }, [laws])

  const fmtKey = (k) => k.replace(/_/g, ' ')
  const pct = (n) => totalLaws > 0 ? ((n / totalLaws) * 100).toFixed(1) : '0'

  const BarChart = ({ data, colorFn, labelFn }) => {
    const sorted = Object.entries(data).sort(([, a], [, b]) => b - a)
    const max = sorted.length > 0 ? sorted[0][1] : 1
    return (
      <div className="stats-bars">
        {sorted.map(([key, count]) => (
          <div key={key} className="stats-bar-row">
            <div className="stats-bar-label">{labelFn ? labelFn(key) : fmtKey(key)}</div>
            <div className="stats-bar-track">
              <div
                className="stats-bar-fill"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: colorFn ? colorFn(key) : 'rgba(210, 180, 120, 0.5)',
                }}
              />
            </div>
            <div className="stats-bar-value">{count} <span className="stats-bar-pct">({pct(count)}%)</span></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`stats-container${lightMode ? ' light' : ''}`}>
      {/* Header */}
      <div className="stats-header">
        <div className="stats-header-left">
          <h1 className="stats-title">Statistics</h1>
          <span className="stats-subtitle">{totalLaws} laws</span>
        </div>
        <div className="stats-header-right">
          {onSwitchView && (
            <>
              <button className="nav-btn" onClick={() => onSwitchView('list')} title="List view">
                <List className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('split')} title="Split view">
                <Columns2 className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('network')} title="Network view">
                <Network className="w-4 h-4" />
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

      <div className="stats-body">
        {/* Key metrics row */}
        <div className="stats-metrics">
          <div className="stats-metric">
            <div className="stats-metric-value">{totalLaws}</div>
            <div className="stats-metric-label">Total Laws</div>
          </div>
          <div className="stats-metric stats-metric-gold">
            <div className="stats-metric-value">{stats.foreverCount}</div>
            <div className="stats-metric-label">Forever Language</div>
          </div>
          <div className="stats-metric stats-metric-rose">
            <div className="stats-metric-value">{stats.generationalCount}</div>
            <div className="stats-metric-label">Generational Language</div>
          </div>
          <div className="stats-metric">
            <div className="stats-metric-value">{catStats.loveGod}</div>
            <div className="stats-metric-label">Love YHWH</div>
          </div>
          <div className="stats-metric">
            <div className="stats-metric-value">{catStats.loveNeighbor}</div>
            <div className="stats-metric-label">Love Neighbor</div>
          </div>
        </div>

        {/* Prerequisites row */}
        <div className="stats-prereq-row">
          <div className="stats-prereq">
            <span className="stats-prereq-val">{stats.templeCount}</span>
            <span className="stats-prereq-label">Require Temple</span>
          </div>
          <div className="stats-prereq">
            <span className="stats-prereq-val">{stats.priestCount}</span>
            <span className="stats-prereq-label">Require Priesthood</span>
          </div>
          <div className="stats-prereq">
            <span className="stats-prereq-val">{stats.landCount}</span>
            <span className="stats-prereq-label">Require Land of Israel</span>
          </div>
        </div>

        {/* Charts grid */}
        <div className="stats-grid">
          <div className="stats-card">
            <h3 className="stats-card-title"><BookOpen className="w-4 h-4" /> By Book</h3>
            <BarChart data={stats.byBook} />
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title"><Clock className="w-4 h-4" /> By Duration</h3>
            <BarChart
              data={stats.byDuration}
              colorFn={(k) =>
                k === 'explicit_perpetual' ? 'rgba(230, 200, 140, 0.6)' :
                k === 'implicit_ongoing' ? 'rgba(180, 195, 150, 0.6)' :
                'rgba(148, 140, 125, 0.5)'
              }
            />
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title"><Users className="w-4 h-4" /> By Applicability</h3>
            <BarChart data={stats.byApplicability} />
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title"><Users className="w-4 h-4" /> By Regulated Party</h3>
            <BarChart data={stats.byParty} />
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title"><Sparkles className="w-4 h-4" /> By Observance</h3>
            <BarChart
              data={stats.byObservance}
              colorFn={(k) => OBSERVANCE_CONFIG[k]?.color || 'rgba(160, 160, 160, 0.5)'}
              labelFn={(k) => {
                const cfg = OBSERVANCE_CONFIG[k]
                return cfg ? `${cfg.symbol} ${cfg.label}` : fmtKey(k)
              }}
            />
          </div>

          <div className="stats-card">
            <h3 className="stats-card-title"><BookOpen className="w-4 h-4" /> By Command Type</h3>
            <BarChart data={stats.byCommandType} />
          </div>

          <div className="stats-card stats-card-wide">
            <h3 className="stats-card-title"><Sparkles className="w-4 h-4" /> Ten Commandments Categories</h3>
            <div className="stats-bars">
              {catStats.l2Counts.map(item => {
                const max = catStats.l2Counts[0]?.count || 1
                const [r, g, b] = item.color
                return (
                  <div key={item.key} className="stats-bar-row">
                    <div className="stats-bar-label">{item.label}</div>
                    <div className="stats-bar-track">
                      <div
                        className="stats-bar-fill"
                        style={{
                          width: `${(item.count / max) * 100}%`,
                          background: `rgba(${r}, ${g}, ${b}, 0.6)`,
                        }}
                      />
                    </div>
                    <div className="stats-bar-value">{item.count} <span className="stats-bar-pct">({pct(item.count)}%)</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsOverview
