import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import { X, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react'

// Register layout
cytoscape.use(cola)

function NetworkGraph({ laws, onSelectLaw }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [selectedFilters, setSelectedFilters] = useState({
    showEternal: true,
    showOngoing: true,
    showContextual: true,
    showConditional: true,
  })
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })

  useEffect(() => {
    if (!containerRef.current || laws.length === 0) return

    // Build nodes from laws
    const nodes = laws.map(law => {
      // Determine node properties
      let shape = 'ellipse'
      let bgColor = '#0ea5e9' // Default blue

      // Shape based on duration type
      if (law.has_forever_language) {
        shape = 'star'
        bgColor = '#d946ef' // Eternal purple
      } else if (law.duration_type === 'contextual_specific') {
        shape = 'round-rectangle'
        bgColor = '#6b7280' // Contextual gray
      } else if (law.duration_type === 'conditional_stated') {
        shape = 'diamond'
        bgColor = '#f59e0b' // Conditional amber
      } else if (law.current_applicability === 'prerequisite_pending') {
        shape = 'hexagon'
        bgColor = '#3b82f6' // Prerequisite blue
      }

      // Size based on importance (has analysis, has forever language, etc.)
      let size = 20
      if (law.has_forever_language) size = 40
      else if (law.duration_type === 'explicit_perpetual') size = 35
      else if (law.current_applicability === 'currently_applicable') size = 25

      return {
        data: {
          id: `law-${law.id}`,
          label: law.reference,
          law: law,
          type: law.duration_type || 'unknown',
          book: law.book,
          party: law.regulated_party,
        },
        style: {
          'background-color': bgColor,
          shape: shape,
          width: size,
          height: size,
          'font-size': '8px',
          color: '#fff',
          'text-outline-color': '#000',
          'text-outline-width': 1,
        }
      }
    })

    // Build edges based on relationships
    const edges = []

    // Connect laws in same chapter
    const lawsByChapter = {}
    laws.forEach(law => {
      const key = `${law.book}-${law.chapter}`
      if (!lawsByChapter[key]) lawsByChapter[key] = []
      lawsByChapter[key].push(law)
    })

    // Create edges within chapters (but not too many)
    Object.values(lawsByChapter).forEach(chapterLaws => {
      for (let i = 0; i < chapterLaws.length - 1; i++) {
        // Only connect consecutive laws in same chapter
        if (Math.abs(chapterLaws[i].verse - chapterLaws[i + 1].verse) <= 2) {
          edges.push({
            data: {
              id: `edge-${chapterLaws[i].id}-${chapterLaws[i + 1].id}`,
              source: `law-${chapterLaws[i].id}`,
              target: `law-${chapterLaws[i + 1].id}`,
              type: 'chapter'
            },
            style: {
              'line-color': '#e5e7eb',
              width: 1,
              opacity: 0.3,
            }
          })
        }
      }
    })

    // Connect laws with same regulated party (stronger connection)
    const lawsByParty = {}
    laws.forEach(law => {
      if (law.regulated_party && ['all', 'all Israel'].includes(law.regulated_party)) {
        const key = law.regulated_party
        if (!lawsByParty[key]) lawsByParty[key] = []
        lawsByParty[key].push(law)
      }
    })

    // Connect eternal laws to each other (purple connections)
    const eternalLaws = laws.filter(l => l.has_forever_language || l.duration_type === 'explicit_perpetual')
    for (let i = 0; i < Math.min(eternalLaws.length - 1, 50); i++) {
      if (i < eternalLaws.length - 1) {
        edges.push({
          data: {
            id: `eternal-${eternalLaws[i].id}-${eternalLaws[i + 1].id}`,
            source: `law-${eternalLaws[i].id}`,
            target: `law-${eternalLaws[i + 1].id}`,
            type: 'eternal'
          },
          style: {
            'line-color': '#d946ef',
            width: 2,
            opacity: 0.6,
            'line-style': 'dashed',
          }
        })
      }
    }

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '8px',
            'color': '#fff',
            'text-outline-color': '#000',
            'text-outline-width': 1,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#fbbf24',
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'none',
          }
        }
      ],
      layout: {
        name: 'cola',
        animate: true,
        refresh: 1,
        maxSimulationTime: 4000,
        ungrabifyWhileSimulating: false,
        fit: true,
        padding: 30,
        nodeSpacing: 20,
        edgeLength: 80,
        randomize: false,
      },
      minZoom: 0.1,
      maxZoom: 4,
      wheelSensitivity: 0.2,
    })

    // Handle node click
    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const law = node.data('law')
      if (law && onSelectLaw) {
        onSelectLaw(law)
      }
    })

    // Handle hover
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      node.style('border-width', 3)
      node.style('border-color', '#fbbf24')
    })

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      if (!node.selected()) {
        node.style('border-width', 0)
      }
    })

    cyRef.current = cy

    // Update stats
    setStats({
      nodes: nodes.length,
      edges: edges.length,
    })

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
    }
  }, [laws, onSelectLaw])

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2)
      cyRef.current.center()
    }
  }

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8)
      cyRef.current.center()
    }
  }

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50)
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Graph container */}
      <div
        ref={containerRef}
        className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ minHeight: '600px' }}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          title="Fit to Screen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-eternal-600 flex items-center justify-center text-white">★</div>
            <span className="text-gray-700 dark:text-gray-300">Eternal ("forever" language)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-torah-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Ongoing statute</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Contextual/Specific</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 transform rotate-45"></div>
            <span className="text-gray-700 dark:text-gray-300">Conditional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
            <span className="text-gray-700 dark:text-gray-300">Prerequisite pending</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div>Nodes: {stats.nodes}</div>
            <div>Connections: {stats.edges}</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
          Click any node to view law details
        </div>
      </div>
    </div>
  )
}

export default NetworkGraph
