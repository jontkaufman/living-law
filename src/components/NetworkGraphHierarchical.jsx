import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { ChevronLeft, Home, Sparkles, BookOpen } from 'lucide-react'

// Note: Using built-in 'cose' layout (no extension needed)
// Hierarchical structure: Two Great Commands → Ten Commandments → Laws
const HIERARCHY = {
  root: {
    id: 'root',
    label: 'Torah Laws',
    hidden: true,
  },
  twoGreatCommands: [
    {
      id: 'love-god',
      label: 'Love YHWH',
      subtitle: 'with all your heart, soul, and strength',
      color: '#0ea5e9',
      commandments: [1, 2, 3, 4], // First 4 commandments
    },
    {
      id: 'love-neighbor',
      label: 'Love Your Neighbor',
      subtitle: 'as yourself',
      color: '#10b981',
      commandments: [5, 6, 7, 8, 9, 10], // Last 6 commandments
    },
  ],
  tenCommandments: [
    { id: 1, label: 'No Other Gods', parent: 'love-god', keywords: ['idol', 'other gods', 'worship'] },
    { id: 2, label: 'No Graven Images', parent: 'love-god', keywords: ['image', 'idol', 'likeness'] },
    { id: 3, label: "YHWH's Name", parent: 'love-god', keywords: ['name', 'vain', 'swear', 'oath'] },
    { id: 4, label: 'Remember Sabbath', parent: 'love-god', keywords: ['sabbath', 'seventh day', 'rest', 'feast', 'appointed'] },
    { id: 5, label: 'Honor Parents', parent: 'love-neighbor', keywords: ['father', 'mother', 'parent', 'honor'] },
    { id: 6, label: 'Do Not Murder', parent: 'love-neighbor', keywords: ['kill', 'murder', 'blood', 'life', 'death'] },
    { id: 7, label: 'Do Not Commit Adultery', parent: 'love-neighbor', keywords: ['adultery', 'sexual', 'marriage', 'wife', 'virgin'] },
    { id: 8, label: 'Do Not Steal', parent: 'love-neighbor', keywords: ['steal', 'theft', 'property', 'kidnap'] },
    { id: 9, label: 'Do Not Bear False Witness', parent: 'love-neighbor', keywords: ['witness', 'testimony', 'false', 'lie', 'judge'] },
    { id: 10, label: 'Do Not Covet', parent: 'love-neighbor', keywords: ['covet', 'desire', 'neighbor'] },
  ],
}

// Match laws to commandments based on keywords and context
function matchLawToCommandment(law) {
  const searchText = `${law.law_summary} ${law.verse_text} ${law.category}`.toLowerCase()

  // Try to match to a commandment
  for (const cmd of HIERARCHY.tenCommandments) {
    if (cmd.keywords.some(keyword => searchText.includes(keyword))) {
      return cmd.id
    }
  }

  // Default fallback - classify by regulated party or category
  if (law.regulated_party === 'priests' || law.regulated_party === 'Levites') {
    return 4 // Sabbath/worship
  }

  return null // Unclassified
}

function NetworkGraphHierarchical({ laws, onSelectLaw }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [currentLevel, setCurrentLevel] = useState('root') // root, great-command, commandment
  const [selectedGreatCommand, setSelectedGreatCommand] = useState(null)
  const [selectedCommandment, setSelectedCommandment] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState(['Torah Laws'])
  const [lawCounts, setLawCounts] = useState({})

  // Calculate law counts for each commandment
  useEffect(() => {
    const counts = {}
    HIERARCHY.tenCommandments.forEach(cmd => {
      counts[cmd.id] = laws.filter(law => matchLawToCommandment(law) === cmd.id).length
    })
    setLawCounts(counts)
  }, [laws])

  useEffect(() => {
    if (!containerRef.current || laws.length === 0) return

    // Cleanup previous instance
    if (cyRef.current) {
      cyRef.current.destroy()
      cyRef.current = null
    }

    let elements = []

    // Level 1: Two Great Commands (initial view)
    if (currentLevel === 'root') {
      elements = HIERARCHY.twoGreatCommands.map(cmd => ({
        data: {
          id: cmd.id,
          label: cmd.label,
          subtitle: cmd.subtitle,
          type: 'great-command',
        },
        style: {
          'background-color': cmd.color,
          width: 140,
          height: 140,
          'font-size': '15px',
          'font-weight': 'bold',
          color: '#fff',
          'text-outline-color': cmd.color,
          'text-outline-width': 3,
        },
      }))

      // Add connection between them
      elements.push({
        data: {
          id: 'connection',
          source: 'love-god',
          target: 'love-neighbor',
        },
        style: {
          'line-color': '#d1d5db',
          width: 3,
          'curve-style': 'bezier',
        }
      })
    }

    // Level 2: Ten Commandments (when great command selected)
    else if (currentLevel === 'great-command' && selectedGreatCommand) {
      const greatCmd = HIERARCHY.twoGreatCommands.find(c => c.id === selectedGreatCommand)

      // Center node (the great command)
      elements.push({
        data: {
          id: greatCmd.id,
          label: greatCmd.label,
          type: 'great-command-selected',
        },
        style: {
          'background-color': greatCmd.color,
          width: 120,
          height: 120,
          'font-size': '13px',
          'font-weight': 'bold',
          color: '#fff',
          'text-outline-color': greatCmd.color,
          'text-outline-width': 2,
        },
      })

      // Commandment nodes - let force layout position them
      const commandments = HIERARCHY.tenCommandments.filter(cmd =>
        greatCmd.commandments.includes(cmd.id)
      )

      commandments.forEach((cmd) => {
        const count = lawCounts[cmd.id] || 0

        elements.push({
          data: {
            id: `cmd-${cmd.id}`,
            label: `${cmd.label}\n(${count} laws)`,
            commandmentId: cmd.id,
            type: 'commandment',
            count: count,
          },
          style: {
            'background-color': greatCmd.color,
            'border-color': '#fff',
            'border-width': 3,
            width: 90,
            height: 90,
            'font-size': '10px',
            color: '#fff',
            'text-outline-color': greatCmd.color,
            'text-outline-width': 1,
            opacity: count > 0 ? 1 : 0.3,
          },
        })

        // Edge from center
        elements.push({
          data: {
            source: greatCmd.id,
            target: `cmd-${cmd.id}`,
          },
          style: {
            'line-color': greatCmd.color,
            width: 2,
            opacity: 0.5,
          }
        })
      })
    }

    // Level 3: Individual Laws (when commandment selected)
    else if (currentLevel === 'commandment' && selectedCommandment) {
      const cmd = HIERARCHY.tenCommandments.find(c => c.id === selectedCommandment)
      const greatCmd = HIERARCHY.twoGreatCommands.find(c => c.id === cmd.parent)

      // Get matching laws
      const matchingLaws = laws.filter(law => matchLawToCommandment(law) === selectedCommandment)
      const lawsToShow = matchingLaws.slice(0, 30) // Limit to 30 laws

      // Helper function to create short title from law
      const getShortTitle = (law) => {
        // Use law_summary but truncate smartly
        let title = law.law_summary || law.reference

        // Remove "The law that" and similar prefixes
        title = title.replace(/^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+/i, '')

        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1)

        // Truncate at first comma or period, or at 40 chars
        const punctIndex = Math.min(
          title.indexOf(',') !== -1 ? title.indexOf(',') : 999,
          title.indexOf('.') !== -1 ? title.indexOf('.') : 999,
          40
        )

        if (punctIndex < title.length) {
          title = title.substring(0, punctIndex) + '...'
        }

        return title
      }

      // Center node (the commandment)
      elements.push({
        data: {
          id: `cmd-${cmd.id}`,
          label: `${cmd.label}\n(${matchingLaws.length} laws)`,
          type: 'commandment-selected',
        },
        style: {
          'background-color': greatCmd.color,
          width: 120,
          height: 120,
          'font-size': '12px',
          'font-weight': 'bold',
          color: '#fff',
          'text-outline-color': greatCmd.color,
          'text-outline-width': 2,
        },
      })

      // Law nodes - let force layout position them
      lawsToShow.forEach((law) => {
        let shape = 'ellipse'
        let size = 30
        let color = greatCmd.color

        if (law.has_forever_language) {
          shape = 'star'
          size = 45
          color = '#d946ef'
        } else if (law.duration_type === 'contextual_specific') {
          shape = 'round-rectangle'
          size = 25
          color = '#6b7280'
        }

        elements.push({
          data: {
            id: `law-${law.id}`,
            label: getShortTitle(law),
            law: law,
            type: 'law',
          },
          style: {
            'background-color': color,
            width: size,
            height: size,
            shape: shape,
            'font-size': '9px',
            color: '#fff',
            'text-outline-color': '#000',
            'text-outline-width': 1,
          },
        })

        // Edge to center
        elements.push({
          data: {
            source: `cmd-${cmd.id}`,
            target: `law-${law.id}`,
          },
          style: {
            'line-color': color,
            width: 1,
            opacity: 0.3,
          }
        })
      })

      if (matchingLaws.length > 30) {
        // Add "more" indicator
        elements.push({
          data: {
            id: 'more',
            label: `+${matchingLaws.length - 30} more...`,
            type: 'more',
          },
          style: {
            'background-color': '#9ca3af',
            width: 60,
            height: 60,
            'font-size': '9px',
            color: '#fff',
          },
          position: { x: 400, y: 500 }
        })
      }
    }

    // Determine layout based on level (using built-in 'cose' force-directed layout)
    let layoutConfig = {
      name: 'cose',
      animate: true,
      animationDuration: 500,
      animationEasing: 'ease-out',
      fit: true,
      padding: 50,
      nodeRepulsion: currentLevel === 'root' ? 8000 : currentLevel === 'great-command' ? 6000 : 4000,
      nodeOverlap: 20,
      idealEdgeLength: currentLevel === 'root' ? 200 : currentLevel === 'great-command' ? 150 : 100,
      edgeElasticity: 100,
      nestingFactor: 1.2,
      gravity: 1,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
      randomize: false,
    }

    // Safety check - ensure we have elements before initializing
    if (elements.length === 0) {
      console.warn('No elements to display')
      return
    }

    // Initialize Cytoscape
    let cy
    try {
      cy = cytoscape({
        container: containerRef.current,
        elements: elements,
        layout: layoutConfig,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24',
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'unbundled-bezier',
            'control-point-distances': [20, -20],
            'control-point-weights': [0.25, 0.75],
          }
        }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false, // Allow dragging nodes
      autounselectify: false,
      minZoom: 0.3,
      maxZoom: 3,
    })
    } catch (error) {
      console.error('Failed to initialize Cytoscape:', error)
      return
    }

    if (!cy) return

    // Handle clicks
    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const type = node.data('type')

      if (type === 'great-command') {
        // Navigate to commandments
        const cmdId = node.data('id')
        const cmd = HIERARCHY.twoGreatCommands.find(c => c.id === cmdId)
        setSelectedGreatCommand(cmdId)
        setCurrentLevel('great-command')
        setBreadcrumbs(['Torah Laws', cmd.label])
      } else if (type === 'commandment') {
        // Navigate to laws
        const cmdId = node.data('commandmentId')
        const cmd = HIERARCHY.tenCommandments.find(c => c.id === cmdId)
        setSelectedCommandment(cmdId)
        setCurrentLevel('commandment')
        setBreadcrumbs(prev => [...prev, cmd.label])
      } else if (type === 'law') {
        // Show law details
        const law = node.data('law')
        if (onSelectLaw) {
          onSelectLaw(law)
        }
      }
    })

    // Smooth hover effects
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      if (node.data('type') !== 'more') {
        node.animate({
          style: { width: '*=1.2', height: '*=1.2' },
          duration: 200,
        })
      }
    })

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      if (node.data('type') !== 'more') {
        node.animate({
          style: { width: '/=1.2', height: '/=1.2' },
          duration: 200,
        })
      }
    })

    cyRef.current = cy

    // Cleanup on unmount
    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying Cytoscape:', e)
        }
        cyRef.current = null
      }
    }
  }, [currentLevel, selectedGreatCommand, selectedCommandment, laws, lawCounts, onSelectLaw])

  const handleBack = () => {
    if (currentLevel === 'commandment') {
      setCurrentLevel('great-command')
      setSelectedCommandment(null)
      setBreadcrumbs(prev => prev.slice(0, -1))
    } else if (currentLevel === 'great-command') {
      setCurrentLevel('root')
      setSelectedGreatCommand(null)
      setBreadcrumbs(['Torah Laws'])
    }
  }

  const handleHome = () => {
    setCurrentLevel('root')
    setSelectedGreatCommand(null)
    setSelectedCommandment(null)
    setBreadcrumbs(['Torah Laws'])
  }

  return (
    <div className="relative w-full h-full">
      {/* Breadcrumb navigation */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {currentLevel !== 'root' && (
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleHome}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Home"
        >
          <Home className="w-5 h-5" />
          </button>
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-400">/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'font-semibold text-torah-600 dark:text-torah-400' : 'text-gray-600 dark:text-gray-400'}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {currentLevel === 'root' && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <BookOpen className="w-4 h-4 inline mr-1" />
            Click a command to explore Torah laws
          </p>
        </div>
      )}

      {/* Graph container */}
      <div
        ref={containerRef}
        className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ minHeight: '600px' }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Legend
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-eternal-600 flex items-center justify-center text-white text-xs">★</div>
            <span className="text-gray-700 dark:text-gray-300">Eternal law</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-torah-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Ongoing law</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gray-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Contextual</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {currentLevel === 'root' && 'Click to drill down'}
          {currentLevel === 'great-command' && 'Numbers show law counts'}
          {currentLevel === 'commandment' && 'Click laws for details'}
        </div>
      </div>
    </div>
  )
}

export default NetworkGraphHierarchical
