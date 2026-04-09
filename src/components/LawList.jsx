import { useState, useMemo } from 'react'
import { FileText, ChevronUp, ChevronDown } from 'lucide-react'

function LawList({ laws, onSelectLaw }) {
  const [sortKey, setSortKey] = useState('reference')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const copy = [...laws]
    copy.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      va = String(va).toLowerCase()
      vb = String(vb).toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [laws, sortKey, sortDir])

  if (laws.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No laws found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />
  }

  const columns = [
    { key: 'reference', label: 'Reference', width: '120px' },
    { key: 'law_summary', label: 'Summary', width: '' },
    { key: 'duration_type', label: 'Duration', width: '130px' },
    { key: 'current_applicability', label: 'Applicability', width: '150px' },
    { key: 'primary_category', label: 'Category', width: '140px' },
    { key: 'regulated_party', label: 'Party', width: '100px' },
  ]

  const fmtCell = (val) => {
    if (val == null) return '—'
    return String(val).replace(/_/g, ' ')
  }

  const durationBadge = (val) => {
    if (!val) return '—'
    const cls = val === 'explicit_perpetual' ? 'badge-eternal'
      : val === 'implicit_ongoing' ? 'badge-ongoing'
      : 'badge-contextual'
    return <span className={`badge ${cls}`}>{val.replace(/_/g, ' ')}</span>
  }

  return (
    <div>
      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Showing {laws.length} {laws.length === 1 ? 'law' : 'laws'}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 select-none whitespace-nowrap"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map(law => (
              <tr
                key={law.id}
                onClick={() => onSelectLaw(law)}
                className="cursor-pointer hover:bg-torah-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <td className="px-3 py-2 font-medium text-torah-700 dark:text-torah-400 whitespace-nowrap">
                  {law.reference}
                </td>
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200 max-w-md truncate">
                  {law.law_summary}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {durationBadge(law.duration_type)}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap capitalize">
                  {fmtCell(law.current_applicability)}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap capitalize">
                  {fmtCell(law.primary_category)}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap capitalize">
                  {fmtCell(law.regulated_party)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LawList
