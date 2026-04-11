import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, Sparkles, Search, X, Network, List, Columns2, BarChart3, Sun, Moon, HelpCircle } from 'lucide-react'
import LawSidePanel from './LawSidePanel'
import {
  LEVEL2_CONFIG, OBSERVANCE_CONFIG,
  buildHierarchyTree, countAllLaws, collectAllLaws,
  formatLabel, getShortTitle, getSortedChildren,
} from '../lib/lawHelpers'
import './NetworkGraphStyled.css'

const MAX_LAWS_SHOWN = 80

// ── Tree layout constants ────────────────────────────────────────────────────

const ROOT_Y = 100
const LEVEL2_Y = 280
const LEVEL3_Y = 460
const LEVEL4_Y = 640
const LAW_Y_OFFSET = 180
const LAW_ROW_HEIGHT = 44
const LAW_LIST_X_OFFSET = -20  // left of parent center

const LOVE_GOD_X = 600
const LOVE_NEIGHBOR_X = 1800

// ── Helpers ──────────────────────────────────────────────────────────────────

function positionLawList(laws, parentX, startY) {
  return laws.map((_, i) => ({
    x: parentX + LAW_LIST_X_OFFSET,
    y: startY + i * LAW_ROW_HEIGHT,
  }))
}

function positionChildren(count, centerX, y, spacing) {
  const totalWidth = (count - 1) * spacing
  const startX = centerX - totalWidth / 2
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * spacing,
    y,
  }))
}

// Simple hash for deterministic per-node phase
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

function drawStar(ctx, x, y, rgb, coreRadius, glowRadius, intensity = 1.0) {
  const [r, g, b] = rgb

  // Atmospheric halo — very wide, barely visible
  const haloRadius = glowRadius * 2
  const halo = ctx.createRadialGradient(x, y, 0, x, y, haloRadius)
  halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.012 * intensity})`)
  halo.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.006 * intensity})`)
  halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = halo
  ctx.fillRect(x - haloRadius, y - haloRadius, haloRadius * 2, haloRadius * 2)

  const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
  outerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`)
  outerGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.1 * intensity})`)
  outerGlow.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.02 * intensity})`)
  outerGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = outerGlow
  ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2)

  const coreGlow = ctx.createRadialGradient(x, y, 0, x, y, coreRadius)
  coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * intensity})`)
  coreGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.8 * intensity})`)
  coreGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = coreGlow
  ctx.fillRect(x - coreRadius, y - coreRadius, coreRadius * 2, coreRadius * 2)
}

// ── Component ────────────────────────────────────────────────────────────────

function NetworkGraphStyled({ laws, categoryMeta = {}, onSelectLaw, selectedLaw, onCloseLaw, onSwitchView, navState, onNavChange, lightMode, onToggleTheme, onRestartTour }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const lightModeRef = useRef(false)

  // Internal tree navigation state (used in standalone mode)
  const [_expandedL2, _setExpandedL2] = useState(null)
  const [_expandedL3, _setExpandedL3] = useState(null)
  const [_expandedL4, _setExpandedL4] = useState(null)
  const [activePath, setActivePath] = useState(new Set())
  const [breadcrumbs, setBreadcrumbs] = useState(['Torah Laws'])

  // Controlled vs uncontrolled
  const isControlled = !!navState
  const expandedL2 = isControlled ? navState.expandedL2 : _expandedL2
  const expandedL3 = isControlled ? navState.expandedL3 : _expandedL3
  const expandedL4 = isControlled ? navState.expandedL4 : _expandedL4

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef(null)

  // Canvas refs
  const nodesRef = useRef([])
  const edgesRef = useRef([])
  const handleNodeClickRef = useRef(null)
  const panRef = useRef({ x: 0, y: 0 })
  const targetPanRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const targetZoomRef = useRef(1)
  const sizeRef = useRef({ w: 800, h: 600 })
  const hoveredRef = useRef(null)
  const isPanningRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const initializedRef = useRef(false)
  const knownNodesRef = useRef(new Set()) // track known node IDs for entrance animation

  // Keep lightMode ref in sync for render loop
  lightModeRef.current = lightMode

  // Build hierarchy from data
  const hierarchy = useMemo(() => buildHierarchyTree(laws), [laws])

  // Compute law counts per Level 2 category
  const l2Counts = useMemo(() => {
    const counts = {}
    laws.forEach(law => {
      (law.categories || []).forEach(path => {
        const parts = path.split(' > ')
        if (parts.length >= 2) {
          const key = `${parts[0]}|${parts[1]}`
          if (!counts[key]) counts[key] = new Set()
          counts[key].add(law.id)
        }
      })
    })
    const result = {}
    Object.entries(counts).forEach(([key, ids]) => {
      result[key] = ids.size
    })
    return result
  }, [laws])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return laws.filter(law => {
      const text = [law.reference, law.law_summary, law.verse_text].join(' ').toLowerCase()
      return text.includes(q)
    }).slice(0, 15)
  }, [searchQuery, laws])

  // ── Focus / auto-pan ─────────────────────────────────────────────────────

  const focusOnArea = useCallback((minX, minY, maxX, maxY) => {
    const { w, h } = sizeRef.current
    const padding = 150
    const contentW = maxX - minX + padding * 2
    const contentH = maxY - minY + padding * 2
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const zoom = Math.min(w / contentW, h / contentH, 1.3)
    targetZoomRef.current = zoom
    targetPanRef.current = { x: w / 2 - cx * zoom, y: h / 2 - cy * zoom }
  }, [])

  const focusOnCommandments = useCallback(() => {
    focusOnArea(200, LEVEL2_Y - 80, 2400, LEVEL2_Y + 180)
  }, [focusOnArea])

  // ── Navigate to a specific law from search ────────────────────────────────

  const navigateToLaw = useCallback((law) => {
    const paths = law.categories || []
    if (paths.length === 0) {
      if (onSelectLaw) onSelectLaw(law)
      return
    }

    const parts = paths[0].split(' > ').map(s => s.trim())
    const rootKey = parts[0] || null
    const l2Key = parts[1] || null
    const l3Key = parts[2] || null
    const l4Key = parts[3] || null

    if (isControlled) {
      onNavChange({ expandedRoot: rootKey, expandedL2: l2Key, expandedL3: l3Key, expandedL4: l4Key })
    } else {
      _setExpandedL2(l2Key)
      _setExpandedL3(l3Key)
      _setExpandedL4(l4Key)
    }

    // Build active path — root through to the selected law
    const path = new Set()
    if (rootKey) path.add(rootKey)
    if (l2Key) path.add(`l2-${l2Key}`)
    if (l3Key) path.add(`l3-${l3Key}`)
    if (l4Key) path.add(`l4-${l4Key}`)
    path.add(`law-${law.id}`)
    setActivePath(path)

    // Build breadcrumbs
    const crumbs = ['Torah Laws']
    if (rootKey) crumbs.push(rootKey === 'love-god' ? 'LOVE YHWH' : 'LOVE YOUR NEIGHBOR')
    if (l2Key) {
      const config = LEVEL2_CONFIG[l2Key]
      crumbs.push(config ? config.label : formatLabel(l2Key))
    }
    if (l3Key) crumbs.push(formatLabel(l3Key))
    if (l4Key) crumbs.push(formatLabel(l4Key))
    setBreadcrumbs(crumbs)

    if (onSelectLaw) onSelectLaw(law)

    setSearchQuery('')
    setShowSearch(false)

    // Focus camera after tree rebuilds
    setTimeout(() => {
      const deepestLevel = l4Key ? LEVEL4_Y : l3Key ? LEVEL3_Y : LEVEL2_Y
      const lawY = deepestLevel + LAW_Y_OFFSET
      const rootCenterX = rootKey === 'love-god' ? LOVE_GOD_X : LOVE_NEIGHBOR_X
      focusOnArea(rootCenterX - 350, deepestLevel - 100, rootCenterX + 550, lawY + 300)
    }, 50)
  }, [onSelectLaw, focusOnArea, isControlled, onNavChange])

  // ── Build visual tree ─────────────────────────────────────────────────────

  const buildTree = useCallback(() => {
    const nodes = []
    const edges = []

    // Determine which Level 2 categories exist under each root
    const godL2s = []
    const neighborL2s = []

    if (hierarchy['love-god']) {
      getSortedChildren(hierarchy['love-god']._children, categoryMeta).forEach(([key, node]) => {
        godL2s.push({ root: 'love-god', key, ...node })
      })
    }
    if (hierarchy['love-neighbor']) {
      getSortedChildren(hierarchy['love-neighbor']._children, categoryMeta).forEach(([key, node]) => {
        neighborL2s.push({ root: 'love-neighbor', key, ...node })
      })
    }

    // Sort by commandment number (1-10 order)
    const sortByNumber = (a, b) => {
      const configA = LEVEL2_CONFIG[a.key]
      const configB = LEVEL2_CONFIG[b.key]
      const numA = configA?.short ? parseInt(configA.short) : Infinity
      const numB = configB?.short ? parseInt(configB.short) : Infinity
      return numA - numB
    }
    godL2s.sort(sortByNumber)
    neighborL2s.sort(sortByNumber)

    // ─ Great commands ─
    nodes.push({
      id: 'love-god', label: 'LOVE YHWH', subtitle: 'with all your heart',
      type: 'great-command', color: [220, 190, 130],
      coreRadius: 10, glowRadius: 60,
      x: LOVE_GOD_X, y: ROOT_Y,
    })
    nodes.push({
      id: 'love-neighbor', label: 'LOVE YOUR NEIGHBOR', subtitle: 'as yourself',
      type: 'great-command', color: [170, 195, 130],
      coreRadius: 10, glowRadius: 60,
      x: LOVE_NEIGHBOR_X, y: ROOT_Y,
    })
    edges.push({ source: 'love-god', target: 'love-neighbor', subtle: true })

    // ─ Level 2 categories ─
    const godSpacing = Math.max(180, 260 - godL2s.length * 5)
    const neighborSpacing = Math.max(180, 260 - neighborL2s.length * 5)
    const godPositions = positionChildren(godL2s.length, LOVE_GOD_X, LEVEL2_Y, godSpacing)
    const neighborPositions = positionChildren(neighborL2s.length, LOVE_NEIGHBOR_X, LEVEL2_Y, neighborSpacing)

    const l2PositionMap = {}

    const addL2Nodes = (l2List, positions, rootId) => {
      l2List.forEach((l2, i) => {
        const config = LEVEL2_CONFIG[l2.key] || { label: formatLabel(l2.key), color: [148, 163, 184] }
        const count = l2Counts[`${rootId}|${l2.key}`] || 0
        const isExpanded = expandedL2 === l2.key
        const nodeId = `l2-${l2.key}`
        const pos = positions[i]
        l2PositionMap[l2.key] = pos

        let label = config.short ? `${config.short} - ${config.label}` : config.label

        nodes.push({
          id: nodeId, label, sublabel: `${count} laws`,
          type: 'level2', l2Key: l2.key, rootId, color: config.color,
          coreRadius: isExpanded ? 7 : 5, glowRadius: isExpanded ? 40 : 30,
          x: pos.x, y: pos.y, data: l2,
        })
        edges.push({ source: rootId, target: nodeId })
      })
    }

    addL2Nodes(godL2s, godPositions, 'love-god')
    addL2Nodes(neighborL2s, neighborPositions, 'love-neighbor')

    // ── Helper: add law list nodes vertically under a parent ──
    const addLawListNodes = (parentNodeId, parentX, startY, lawsArray, color) => {
      const lawsToShow = lawsArray.slice(0, MAX_LAWS_SHOWN)
      const positions = positionLawList(lawsToShow, parentX, startY)

      // Single edge from parent to first law
      if (lawsToShow.length > 0) {
        edges.push({ source: parentNodeId, target: `law-${lawsToShow[0].id}` })
      }

      lawsToShow.forEach((law, i) => {
        const lawColor = law.has_forever_language ? [210, 160, 140]
          : law.duration_type === 'contextual_specific' ? [148, 140, 125]
          : color || [180, 195, 150]
        nodes.push({
          id: `law-${law.id}`,
          label: getShortTitle(law, 55),
          refLabel: law.reference,
          type: 'law', color: lawColor, coreRadius: 2, glowRadius: 10,
          x: positions[i].x, y: positions[i].y, data: law,
        })
        // Connect each law to the next for the vertical line
        if (i > 0) {
          edges.push({ source: `law-${lawsToShow[i - 1].id}`, target: `law-${law.id}`, lawEdge: true })
        }
      })

      if (lawsArray.length > MAX_LAWS_SHOWN) {
        const lastPos = positions[positions.length - 1]
        nodes.push({
          id: 'more',
          label: `+${lawsArray.length - MAX_LAWS_SHOWN} more`,
          type: 'more', color: [100, 116, 139], coreRadius: 2, glowRadius: 10,
          x: lastPos.x, y: lastPos.y + LAW_ROW_HEIGHT, data: null,
        })
      }

      // Return bounding box
      const lastY = startY + lawsToShow.length * LAW_ROW_HEIGHT
      return { startY, endY: lastY }
    }

    // ─ Expanded L2 → Level 3 subcategories or laws ─
    if (expandedL2) {
      const l2Pos = l2PositionMap[expandedL2]
      if (!l2Pos) { nodesRef.current = nodes; edgesRef.current = edges; return }

      const rootKey = godL2s.find(l => l.key === expandedL2) ? 'love-god' : 'love-neighbor'
      const l2Node = hierarchy[rootKey]?._children[expandedL2]
      if (!l2Node) { nodesRef.current = nodes; edgesRef.current = edges; return }

      const l3Sorted = getSortedChildren(l2Node._children, categoryMeta)
      const directLaws = l2Node._laws || []
      const parentConfig = LEVEL2_CONFIG[expandedL2] || { color: [148, 163, 184] }

      if (l3Sorted.length === 0 && directLaws.length > 0) {
        addLawListNodes(`l2-${expandedL2}`, l2Pos.x, LEVEL3_Y, directLaws, parentConfig.color)
      } else {
        const l3Spacing = Math.max(115, 185 - l3Sorted.length * 4)
        const l3Positions = positionChildren(l3Sorted.length, l2Pos.x, LEVEL3_Y, l3Spacing)
        const l3PositionMap = {}

        l3Sorted.forEach(([l3Key, l3Data], i) => {
          const l3LawCount = countAllLaws(l3Data)
          const isExpanded = expandedL3 === l3Key
          const nodeId = `l3-${l3Key}`
          const pos = l3Positions[i]
          l3PositionMap[l3Key] = pos

          nodes.push({
            id: nodeId, label: formatLabel(l3Key), sublabel: `${l3LawCount} laws`,
            type: 'level3', l3Key, color: parentConfig.color,
            coreRadius: isExpanded ? 6 : 4, glowRadius: isExpanded ? 32 : 24,
            x: pos.x, y: pos.y, data: l3Data,
          })
          edges.push({ source: `l2-${expandedL2}`, target: nodeId })
        })

        // ─ Expanded L3 → Level 4 or laws ─
        if (expandedL3 && l2Node._children[expandedL3]) {
          const l3Pos = l3PositionMap[expandedL3]
          if (l3Pos) {
            const l3Data = l2Node._children[expandedL3]
            const l4Sorted = getSortedChildren(l3Data._children, categoryMeta)

            if (l4Sorted.length === 0) {
              const allLaws = collectAllLaws(l3Data)
              addLawListNodes(`l3-${expandedL3}`, l3Pos.x, LEVEL4_Y, allLaws, parentConfig.color)
            } else {
              const l4Spacing = Math.max(105, 175 - l4Sorted.length * 4)
              const l4Positions = positionChildren(l4Sorted.length, l3Pos.x, LEVEL4_Y, l4Spacing)
              const l4PositionMap = {}

              l4Sorted.forEach(([l4Key, l4Data], i) => {
                const l4LawCount = countAllLaws(l4Data)
                const isExpanded = expandedL4 === l4Key
                const nodeId = `l4-${l4Key}`
                const pos = l4Positions[i]
                l4PositionMap[l4Key] = pos

                nodes.push({
                  id: nodeId, label: formatLabel(l4Key), sublabel: `${l4LawCount} laws`,
                  type: 'level4', l4Key, color: parentConfig.color,
                  coreRadius: isExpanded ? 5 : 3, glowRadius: isExpanded ? 28 : 20,
                  x: pos.x, y: pos.y, data: l4Data,
                })
                edges.push({ source: `l3-${expandedL3}`, target: nodeId })
              })

              if (expandedL4 && l3Data._children[expandedL4]) {
                const l4Pos = l4PositionMap[expandedL4]
                if (l4Pos) {
                  const l4Data = l3Data._children[expandedL4]
                  const allLaws = collectAllLaws(l4Data)
                  const lawY = LEVEL4_Y + LAW_Y_OFFSET
                  addLawListNodes(`l4-${expandedL4}`, l4Pos.x, lawY, allLaws, parentConfig.color)
                }
              }
            }
          }
        }
      }
    }

    // Assign phase, drift, and birthTime to each node
    const now = performance.now()
    const known = knownNodesRef.current
    nodes.forEach(n => {
      const h = hashStr(n.id)
      n.phase = (Math.abs(h) % 1000) / 1000 * Math.PI * 2
      n.drift = n.type === 'law' || n.type === 'more' ? 0 : n.type === 'great-command' ? 2 : 3
      if (known.has(n.id)) {
        n.birthTime = 0 // already known, no entrance anim
      } else {
        n.birthTime = now
        known.add(n.id)
      }
    })

    nodesRef.current = nodes
    edgesRef.current = edges
  }, [expandedL2, expandedL3, expandedL4, laws, hierarchy, l2Counts])

  // Rebuild tree when state changes
  useEffect(() => { buildTree() }, [buildTree])

  // ── Sync camera when navState changes externally (split view) ───────────
  const prevNavRef = useRef(null)
  useEffect(() => {
    if (!isControlled) return
    const prev = prevNavRef.current
    prevNavRef.current = navState

    // Skip initial mount
    if (!prev) return
    // Skip if nothing changed
    if (prev.expandedL2 === navState.expandedL2 &&
        prev.expandedL3 === navState.expandedL3 &&
        prev.expandedL4 === navState.expandedL4) return

    // Update breadcrumbs and active path to match new nav state
    const rootKey = navState.expandedRoot || (navState.expandedL2 ? (
      hierarchy['love-god']?._children?.[navState.expandedL2] ? 'love-god' : 'love-neighbor'
    ) : null)

    const crumbs = ['Torah Laws']
    const path = new Set()
    if (rootKey) {
      crumbs.push(rootKey === 'love-god' ? 'LOVE YHWH' : 'LOVE YOUR NEIGHBOR')
      path.add(rootKey)
    }
    if (navState.expandedL2) {
      const config = LEVEL2_CONFIG[navState.expandedL2]
      crumbs.push(config ? config.label : formatLabel(navState.expandedL2))
      path.add(`l2-${navState.expandedL2}`)
    }
    if (navState.expandedL3) {
      crumbs.push(formatLabel(navState.expandedL3))
      path.add(`l3-${navState.expandedL3}`)
    }
    if (navState.expandedL4) {
      crumbs.push(formatLabel(navState.expandedL4))
      path.add(`l4-${navState.expandedL4}`)
    }
    setBreadcrumbs(crumbs)
    setActivePath(path)

    // Focus camera on the newly expanded area after tree rebuilds
    setTimeout(() => {
      if (!navState.expandedL2) {
        focusOnCommandments()
        return
      }

      // Find root and position for the L2 node
      const l2Root = rootKey || 'love-god'
      const centerX = l2Root === 'love-god' ? LOVE_GOD_X : LOVE_NEIGHBOR_X
      const l2Data = hierarchy[l2Root]?._children?.[navState.expandedL2]

      if (navState.expandedL4 && navState.expandedL3 && l2Data) {
        const l3Data = l2Data._children?.[navState.expandedL3]
        const l4Data = l3Data?._children?.[navState.expandedL4]
        const lawCount = l4Data ? Math.min(countAllLaws(l4Data), MAX_LAWS_SHOWN) : 0
        const listHeight = lawCount * LAW_ROW_HEIGHT
        const lawY = LEVEL4_Y + LAW_Y_OFFSET
        focusOnArea(centerX - 350, LEVEL4_Y - 80, centerX + 550, lawY + listHeight + 40)
      } else if (navState.expandedL3 && l2Data) {
        const l3Data = l2Data._children?.[navState.expandedL3]
        const childCount = l3Data ? getSortedChildren(l3Data._children, categoryMeta).length : 0
        if (childCount > 0) {
          const halfWidth = Math.max(childCount * 55 + 100, 400)
          focusOnArea(centerX - halfWidth, LEVEL3_Y - 80, centerX + halfWidth, LEVEL4_Y + 80)
        } else {
          const lawCount = l3Data ? Math.min(countAllLaws(l3Data), MAX_LAWS_SHOWN) : 0
          const listHeight = lawCount * LAW_ROW_HEIGHT
          focusOnArea(centerX - 80, LEVEL3_Y - 80, centerX + 550, LEVEL4_Y + listHeight + 40)
        }
      } else if (l2Data) {
        const childCount = getSortedChildren(l2Data._children, categoryMeta).length
        if (childCount > 0) {
          const halfWidth = Math.max(childCount * 70 + 100, 400)
          focusOnArea(centerX - halfWidth, LEVEL2_Y - 80, centerX + halfWidth, LEVEL3_Y + 80)
        } else {
          const lawCount = Math.min(l2Data?._laws?.length || 0, MAX_LAWS_SHOWN)
          const listHeight = lawCount * LAW_ROW_HEIGHT
          focusOnArea(centerX - 80, LEVEL2_Y - 80, centerX + 550, LEVEL3_Y + listHeight + 40)
        }
      }
    }, 50)
  }, [isControlled, navState, hierarchy, focusOnArea, focusOnCommandments])

  // Initial focus — zoom to 10 Commandments level
  useEffect(() => {
    if (laws.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      // Calculate initial camera position to frame L2 commandments
      const { w, h } = sizeRef.current
      // Frame both commandment groups with balanced padding
      const minX = 200, maxX = 2400
      const minY = LEVEL2_Y - 80, maxY = LEVEL2_Y + 180
      const padding = 100
      const contentW = maxX - minX + padding * 2
      const contentH = maxY - minY + padding * 2
      const cx = (minX + maxX) / 2  // Center at 1300
      const cy = (minY + maxY) / 2  // Center at LEVEL2_Y + 50
      const zoom = Math.min(w / contentW, h / contentH, 1.2)
      const panX = w / 2 - cx * zoom
      const panY = h / 2 - cy * zoom
      // Set both current and target to avoid lerp from 0,0
      panRef.current = { x: panX, y: panY }
      targetPanRef.current = { x: panX, y: panY }
      zoomRef.current = zoom
      targetZoomRef.current = zoom
    }
  }, [laws])

  // Focus on commandments when returning to base view (uncontrolled mode)
  useEffect(() => {
    if (!isControlled && laws.length > 0 && !expandedL2 && !expandedL3 && !expandedL4 && initializedRef.current) {
      // Use a timeout to avoid conflicts with other navigation
      setTimeout(() => focusOnCommandments(), 50)
    }
  }, [isControlled, laws.length, expandedL2, expandedL3, expandedL4, focusOnCommandments])

  // Track previous controlled state to detect mode transitions
  const prevControlledRef = useRef(isControlled)
  useEffect(() => {
    // Detect transition to controlled mode (entering split view)
    if (isControlled && !prevControlledRef.current && laws.length > 0 && initializedRef.current) {
      setTimeout(() => focusOnCommandments(), 50)
    }
    prevControlledRef.current = isControlled
  }, [isControlled, laws.length, focusOnCommandments])

  // ── Render loop ──────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const now = performance.now()
    const timeSec = now / 1000

    // Smoother camera lerp
    const lerp = 0.08
    panRef.current.x += (targetPanRef.current.x - panRef.current.x) * lerp
    panRef.current.y += (targetPanRef.current.y - panRef.current.y) * lerp
    zoomRef.current += (targetZoomRef.current - zoomRef.current) * lerp

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(panRef.current.x, panRef.current.y)
    ctx.scale(zoomRef.current, zoomRef.current)

    const nodes = nodesRef.current
    const edges = edgesRef.current
    const pathSet = activePath

    // Helper: get node position with organic drift applied
    const getNodePos = (node) => {
      if (!node) return { x: 0, y: 0 }
      const drift = node.drift || 0
      if (drift === 0) return { x: node.x, y: node.y }
      const phase = node.phase || 0
      return {
        x: node.x + drift * Math.sin(timeSec * 0.3 + phase),
        y: node.y + drift * Math.cos(timeSec * 0.4 + phase * 1.3),
      }
    }

    // Helper: entrance animation scale (0→1 over 400ms, ease-out cubic)
    const getEntranceScale = (node) => {
      if (!node.birthTime) return 1
      const age = now - node.birthTime
      if (age >= 400) return 1
      const t = Math.min(age / 400, 1)
      return 1 - (1 - t) * (1 - t) * (1 - t) // ease-out cubic
    }

    // ── Draw edges with bezier curves ──
    edges.forEach(edge => {
      if (edge.lawEdge) return
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) return

      const sp = getNodePos(source)
      const tp = getNodePos(target)
      const entranceAlpha = Math.min(getEntranceScale(source), getEntranceScale(target))

      const isOnPath = target.type === 'law'
        ? pathSet.has(edge.source)
        : pathSet.has(edge.source) && pathSet.has(edge.target)
      const [r, g, b] = source.color

      // Build curved path
      ctx.beginPath()
      ctx.moveTo(sp.x, sp.y)
      if (edge.subtle) {
        // Root-to-root bridge arc
        const cpY = Math.min(sp.y, tp.y) - 40
        const cpX = (sp.x + tp.x) / 2
        ctx.quadraticCurveTo(cpX, cpY, tp.x, tp.y)
      } else if (target.type === 'law') {
        // Category→first law: gentle S-curve descent
        const dy = tp.y - sp.y
        const cp1x = sp.x, cp1y = sp.y + dy * 0.35
        const cp2x = tp.x, cp2y = tp.y - dy * 0.35
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tp.x, tp.y)
      } else {
        // Category→category: quadratic arc
        const midY = (sp.y + tp.y) / 2
        const dx = tp.x - sp.x
        const cpX = (sp.x + tp.x) / 2 + dx * 0.08
        ctx.quadraticCurveTo(cpX, midY, tp.x, tp.y)
      }

      if (isOnPath) {
        // Edge glow — wide, soft underlay
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 * entranceAlpha})`
        ctx.lineWidth = 8
        ctx.shadowBlur = 0
        ctx.stroke()
        // Bright edge on top
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.8 * entranceAlpha})`
        ctx.lineWidth = 3
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`
        ctx.shadowBlur = 16
        ctx.stroke()
        ctx.shadowBlur = 0
      } else if (edge.subtle) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 * entranceAlpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      } else {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.18 * entranceAlpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // ── Draw vertical guide line through law lists (with subtle curve) ──
    const lawNodes = nodes.filter(n => n.type === 'law')
    if (lawNodes.length > 0) {
      const groups = {}
      lawNodes.forEach(n => {
        const key = Math.round(n.x)
        if (!groups[key]) groups[key] = []
        groups[key].push(n)
      })
      Object.values(groups).forEach(group => {
        if (group.length < 2) return
        group.sort((a, b) => a.y - b.y)
        const first = group[0]
        const last = group[group.length - 1]
        const [r, g, b] = first.color
        // Slight inward arc
        const midY = (first.y + last.y) / 2
        const arcX = first.x - 5 - 6
        ctx.beginPath()
        ctx.moveTo(first.x - 5, first.y)
        ctx.quadraticCurveTo(arcX, midY, last.x - 5, last.y)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.1)`
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }

    // ── Draw non-law nodes as stars (with breathing + entrance anim) ──
    ctx.globalCompositeOperation = 'lighter'
    nodes.forEach(node => {
      if (node.type === 'law') return
      const pos = getNodePos(node)
      const scale = getEntranceScale(node)
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id

      // Subtle brightness pulsing
      const breathe = 0.05 * Math.sin(timeSec * 0.8 + (node.phase || 0) * 2)
      const baseIntensity = (isOnPath ? 1.0 : 0.85) + breathe
      const intensity = baseIntensity * (isHovered ? 1.3 : 1.0) * scale
      const glow = node.glowRadius * (isHovered ? 1.25 : 1.0) * scale
      const core = node.coreRadius * scale

      drawStar(ctx, pos.x, pos.y, node.color, core, glow, intensity)
    })
    ctx.globalCompositeOperation = 'source-over'

    // ── Draw non-law labels (centered below star) ──
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    nodes.forEach(node => {
      if (node.type === 'law') return
      const pos = getNodePos(node)
      const scale = getEntranceScale(node)
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id
      const [r, g, b] = node.color

      const labelAlpha = (isHovered ? 0.95
        : isOnPath ? 0.9
        : node.type === 'great-command' ? 0.75
        : node.type === 'level2' ? 0.65
        : node.type === 'level3' || node.type === 'level4' ? 0.6
        : 0.5) * scale

      const fontSize = node.type === 'great-command' ? 18
        : node.type === 'level2' ? 14
        : node.type === 'level3' || node.type === 'level4' ? 12
        : 11

      ctx.font = `${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = lightModeRef.current
        ? `rgba(0, 0, 0, ${labelAlpha})`
        : `rgba(${r}, ${g}, ${b}, ${labelAlpha})`
      const labelY = pos.y + node.coreRadius * scale + 12
      ctx.fillText(node.label, pos.x, labelY)

      if (node.sublabel) {
        ctx.font = `${fontSize - 2}px 'Inter', 'Segoe UI', system-ui, sans-serif`
        ctx.fillStyle = lightModeRef.current
          ? `rgba(0, 0, 0, ${labelAlpha * 0.65})`
          : `rgba(${r}, ${g}, ${b}, ${labelAlpha * 0.65})`
        ctx.fillText(node.sublabel, pos.x, labelY + fontSize + 3)
      }
    })

    // ── Draw law rows: small dot + reference + title per row ──
    ctx.textBaseline = 'middle'
    nodes.forEach(node => {
      if (node.type !== 'law') return
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id
      const [r, g, b] = node.color
      const scale = getEntranceScale(node)

      const alpha = (isHovered ? 0.95 : isOnPath ? 0.9 : 0.7) * scale
      const bgAlpha = isHovered ? 0.08 : 0

      if (bgAlpha > 0) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bgAlpha})`
        ctx.fillRect(node.x - 8, node.y - LAW_ROW_HEIGHT / 2, 500, LAW_ROW_HEIGHT)
      }

      ctx.beginPath()
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fill()

      ctx.textAlign = 'left'
      ctx.font = `600 20px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = lightModeRef.current
        ? `rgba(0, 0, 0, ${alpha})`
        : `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillText(node.refLabel || '', node.x + 14, node.y)

      const refWidth = node.refLabel ? ctx.measureText(node.refLabel).width + 14 : 0
      ctx.font = `18px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = lightModeRef.current
        ? `rgba(0, 0, 0, ${alpha * 0.8})`
        : `rgba(235, 225, 205, ${alpha * 0.8})`
      ctx.fillText(node.label, node.x + 14 + refWidth, node.y)

      const obsClass = node.data?.observance_class
      const obsConfig = obsClass ? OBSERVANCE_CONFIG[obsClass] : null
      if (obsConfig) {
        const titleWidth = ctx.measureText(node.label).width
        ctx.font = `14px 'Inter', 'Segoe UI', system-ui, sans-serif`
        ctx.fillStyle = lightModeRef.current && obsConfig.lightColor ? obsConfig.lightColor : obsConfig.color
        ctx.globalAlpha = alpha * 0.7
        ctx.fillText(obsConfig.symbol, node.x + 14 + refWidth + titleWidth + 12, node.y)
        ctx.globalAlpha = 1.0
      }
    })

    ctx.restore()
    animFrameRef.current = requestAnimationFrame(render)
  }, [activePath])

  // ── Hit testing ──────────────────────────────────────────────────────────

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panRef.current.x) / zoomRef.current,
    y: (sy - panRef.current.y) / zoomRef.current,
  }), [])

  const nodeAt = useCallback((wx, wy) => {
    const nodes = nodesRef.current
    const timeSec = performance.now() / 1000
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      if (n.type === 'law') {
        if (wx >= n.x - 10 && wx <= n.x + 500 &&
            wy >= n.y - LAW_ROW_HEIGHT / 2 && wy <= n.y + LAW_ROW_HEIGHT / 2) {
          return n
        }
      } else {
        // Account for drift offset in hit testing
        const drift = n.drift || 0
        const phase = n.phase || 0
        const nx = n.x + drift * Math.sin(timeSec * 0.3 + phase)
        const ny = n.y + drift * Math.cos(timeSec * 0.4 + phase * 1.3)
        const dx = wx - nx, dy = wy - ny
        const hitRadius = Math.max(n.glowRadius * 0.5, 20)
        if (dx * dx + dy * dy < hitRadius * hitRadius) return n
      }
    }
    return null
  }, [])

  // ── Path building ────────────────────────────────────────────────────────

  const buildActivePath = useCallback((rootId, l2Key, l3Key, l4Key, lawId) => {
    const path = new Set()
    if (rootId) path.add(rootId)
    if (l2Key) path.add(`l2-${l2Key}`)
    if (l3Key) path.add(`l3-${l3Key}`)
    if (l4Key) path.add(`l4-${l4Key}`)
    if (lawId) path.add(`law-${lawId}`)
    return path
  }, [])

  // ── Click handler ────────────────────────────────────────────────────────

  // Helpers for setting nav state (controlled vs internal)
  const setNav = useCallback((l2, l3, l4) => {
    if (isControlled) {
      // Determine root from l2 key
      let root = navState.expandedRoot
      if (l2) {
        const godChildren = hierarchy['love-god']?._children || {}
        root = godChildren[l2] ? 'love-god' : 'love-neighbor'
      } else if (!l2 && !l3 && !l4) {
        root = navState.expandedRoot // keep root when collapsing
      }
      onNavChange({ expandedRoot: root, expandedL2: l2, expandedL3: l3, expandedL4: l4 })
    } else {
      _setExpandedL2(l2); _setExpandedL3(l3); _setExpandedL4(l4)
    }
  }, [isControlled, navState, onNavChange, hierarchy])

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'great-command') {
      setNav(null, null, null)
      setActivePath(new Set([node.id]))
      setBreadcrumbs(['Torah Laws'])

      const centerX = node.id === 'love-god' ? LOVE_GOD_X : LOVE_NEIGHBOR_X
      const l2Count = node.id === 'love-god'
        ? Object.keys(hierarchy['love-god']?._children || {}).length
        : Object.keys(hierarchy['love-neighbor']?._children || {}).length
      const spread = l2Count * 90
      focusOnArea(centerX - spread - 50, ROOT_Y - 60, centerX + spread + 50, LEVEL2_Y + 100)

    } else if (node.type === 'level2') {
      const l2Key = node.l2Key
      if (expandedL2 === l2Key) {
        setNav(null, null, null)
        setActivePath(new Set())
        setBreadcrumbs(['Torah Laws'])
        focusOnCommandments()
      } else {
        setNav(l2Key, null, null)
        const rootId = node.rootId
        const config = LEVEL2_CONFIG[l2Key] || { label: formatLabel(l2Key) }
        setActivePath(buildActivePath(rootId, l2Key))
        setBreadcrumbs(['Torah Laws', rootId === 'love-god' ? 'LOVE YHWH' : 'LOVE NEIGHBOR', config.label])

        const l2Data = hierarchy[rootId]?._children[l2Key]
        const childCount = l2Data ? getSortedChildren(l2Data._children, categoryMeta).length : 0
        if (childCount > 0) {
          const halfWidth = Math.max(childCount * 70 + 100, 400)
          focusOnArea(node.x - halfWidth, LEVEL2_Y - 80, node.x + halfWidth, LEVEL3_Y + 80)
        } else {
          const lawCount = Math.min(l2Data?._laws?.length || 0, MAX_LAWS_SHOWN)
          const listHeight = lawCount * LAW_ROW_HEIGHT
          focusOnArea(node.x - 80, LEVEL2_Y - 80, node.x + 550, LEVEL3_Y + listHeight + 40)
        }
      }

    } else if (node.type === 'level3') {
      const l3Key = node.l3Key
      if (expandedL3 === l3Key) {
        setNav(expandedL2, null, null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2))
        setBreadcrumbs(prev => prev.slice(0, 3))
      } else {
        setNav(expandedL2, l3Key, null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2, l3Key))
        setBreadcrumbs(prev => [...prev.slice(0, 3), formatLabel(l3Key)])

        const l3Data = node.data
        const childCount = l3Data ? getSortedChildren(l3Data._children, categoryMeta).length : 0
        if (childCount > 0) {
          const halfWidth = Math.max(childCount * 55 + 100, 400)
          focusOnArea(node.x - halfWidth, LEVEL3_Y - 80, node.x + halfWidth, LEVEL4_Y + 80)
        } else {
          const lawCount = Math.min(countAllLaws(l3Data), MAX_LAWS_SHOWN)
          const listHeight = lawCount * LAW_ROW_HEIGHT
          focusOnArea(node.x - 80, LEVEL3_Y - 80, node.x + 550, LEVEL4_Y + listHeight + 40)
        }
      }

    } else if (node.type === 'level4') {
      const l4Key = node.l4Key
      if (expandedL4 === l4Key) {
        setNav(expandedL2, expandedL3, null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2, expandedL3))
        setBreadcrumbs(prev => prev.slice(0, 4))
      } else {
        setNav(expandedL2, expandedL3, l4Key)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2, expandedL3, l4Key))
        setBreadcrumbs(prev => [...prev.slice(0, 4), formatLabel(l4Key)])

        const lawCount = Math.min(countAllLaws(node.data), MAX_LAWS_SHOWN)
        const listHeight = lawCount * LAW_ROW_HEIGHT
        const lawY = LEVEL4_Y + LAW_Y_OFFSET
        focusOnArea(node.x - 80, LEVEL4_Y - 80, node.x + 550, lawY + listHeight + 40)
      }

    } else if (node.type === 'law') {
      if (onSelectLaw) onSelectLaw(node.data)
      const rootKey = Object.keys(hierarchy).find(r =>
        hierarchy[r]._children[expandedL2])
      setActivePath(buildActivePath(rootKey, expandedL2, expandedL3, expandedL4, node.data.id))
    }
  }, [expandedL2, expandedL3, expandedL4, hierarchy, laws, onSelectLaw, focusOnArea, focusOnCommandments, buildActivePath, setNav])

  // Keep ref in sync so canvas event handlers always call the latest version
  handleNodeClickRef.current = handleNodeClick

  // ── Canvas setup & events ────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = parent.clientWidth + 'px'
      canvas.style.height = parent.clientHeight + 'px'
      sizeRef.current = { w: parent.clientWidth, h: parent.clientHeight }
    }
    resize()
    window.addEventListener('resize', resize)

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    let mouseDownPos = null

    const onMouseDown = (e) => {
      const pos = getPos(e)
      mouseDownPos = pos
      isPanningRef.current = true
      lastMouseRef.current = pos
    }
    const onMouseMove = (e) => {
      const pos = getPos(e)
      if (isPanningRef.current && mouseDownPos) {
        const dx = pos.x - lastMouseRef.current.x
        const dy = pos.y - lastMouseRef.current.y
        panRef.current.x += dx
        panRef.current.y += dy
        targetPanRef.current.x += dx
        targetPanRef.current.y += dy
        canvas.style.cursor = 'grabbing'
      } else {
        const world = screenToWorld(pos.x, pos.y)
        const node = nodeAt(world.x, world.y)
        hoveredRef.current = node ? node.id : null
        canvas.style.cursor = node ? 'pointer' : 'default'
      }
      lastMouseRef.current = pos
    }
    const onMouseUp = (e) => {
      const pos = getPos(e)
      const dist = mouseDownPos
        ? Math.sqrt((pos.x - mouseDownPos.x) ** 2 + (pos.y - mouseDownPos.y) ** 2)
        : 999
      if (dist < 5) {
        const world = screenToWorld(pos.x, pos.y)
        const node = nodeAt(world.x, world.y)
        if (node) handleNodeClickRef.current(node)
      }
      isPanningRef.current = false
      mouseDownPos = null
      canvas.style.cursor = 'default'
    }
    const onWheel = (e) => {
      e.preventDefault()
      const pos = getPos(e)
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const oldZoom = zoomRef.current
      const newZoom = Math.max(0.15, Math.min(3, oldZoom * zoomFactor))
      const wx = (pos.x - panRef.current.x) / oldZoom
      const wy = (pos.y - panRef.current.y) / oldZoom
      const newPanX = pos.x - wx * newZoom
      const newPanY = pos.y - wy * newZoom
      targetZoomRef.current = newZoom
      targetPanRef.current = { x: newPanX, y: newPanY }
      zoomRef.current = newZoom
      panRef.current = { x: newPanX, y: newPanY }
    }
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
        mouseDownPos = pos
        isPanningRef.current = true
        lastMouseRef.current = pos
      }
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
        if (isPanningRef.current) {
          const dx = pos.x - lastMouseRef.current.x
          const dy = pos.y - lastMouseRef.current.y
          panRef.current.x += dx
          panRef.current.y += dy
          targetPanRef.current.x += dx
          targetPanRef.current.y += dy
        }
        lastMouseRef.current = pos
      }
    }
    const onTouchEnd = () => {
      if (mouseDownPos) {
        const pos = lastMouseRef.current
        const dist = Math.sqrt(
          (pos.x - mouseDownPos.x) ** 2 + (pos.y - mouseDownPos.y) ** 2
        )
        if (dist < 10) {
          const world = screenToWorld(pos.x, pos.y)
          const node = nodeAt(world.x, world.y)
          if (node) handleNodeClickRef.current(node)
        }
      }
      isPanningRef.current = false
      mouseDownPos = null
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start/stop render loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [render])

  // ── Breadcrumb nav ───────────────────────────────────────────────────────

  const navigateTo = useCallback((level) => {
    if (level === 0) {
      setNav(null, null, null)
      setActivePath(new Set())
      setBreadcrumbs(['Torah Laws'])
      focusOnCommandments()
    } else if (level === 1) {
      setNav(null, null, null)
      setActivePath(new Set())
      setBreadcrumbs(prev => prev.slice(0, 2))
      focusOnCommandments()
    } else if (level === 2) {
      setNav(expandedL2, null, null)
      const rootKey = Object.keys(hierarchy).find(r => hierarchy[r]._children[expandedL2])
      setActivePath(buildActivePath(rootKey, expandedL2))
      setBreadcrumbs(prev => prev.slice(0, 3))
    } else if (level === 3) {
      setNav(expandedL2, expandedL3, null)
      const rootKey = Object.keys(hierarchy).find(r => hierarchy[r]._children[expandedL2])
      setActivePath(buildActivePath(rootKey, expandedL2, expandedL3))
      setBreadcrumbs(prev => prev.slice(0, 4))
    }
  }, [expandedL2, expandedL3, hierarchy, focusOnCommandments, buildActivePath, setNav])

  const handleBack = () => {
    if (expandedL4) navigateTo(3)
    else if (expandedL3) navigateTo(2)
    else if (expandedL2) navigateTo(0)
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className={`network-container${lightMode ? ' light' : ''}`}>
      <div className="network-header">
        <div className="header-left">
          {(expandedL2 || expandedL3 || expandedL4) && (
            <button onClick={handleBack} className="nav-btn" title="Back">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
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

        {/* Search */}
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
                  if (e.key === 'Escape') {
                    setSearchQuery('')
                    setShowSearch(false)
                  }
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

        <div className="network-header-switches" data-tour="view-switchers">
          {onSwitchView && (
            <>
              <button className="nav-btn active" title="Network view (active)">
                <Network className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('list')} title="List view">
                <List className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('split')} title="Split view">
                <Columns2 className="w-4 h-4" />
              </button>
              <button className="nav-btn" onClick={() => onSwitchView('stats')} title="Dashboard">
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
          <button
            className="nav-btn"
            onClick={onRestartTour}
            title="Restart Tour"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      <div className="network-canvas-wrap">
        <canvas ref={canvasRef} className="network-canvas" data-tour="network-canvas" />
      </div>

      <div className="network-hint">
        {!expandedL2 && 'TAP CATEGORY TO EXPAND \u00b7 DRAG TO PAN \u00b7 SCROLL TO ZOOM'}
        {expandedL2 && !expandedL3 && 'TAP SUBCATEGORY TO EXPAND \u00b7 TAP LAW FOR DETAILS'}
        {expandedL3 && 'TAP TO DRILL DEEPER \u00b7 DRAG TO PAN'}
      </div>

      {/* Observance Legend */}
      {/* Observance Legend - persistent when side panel closed */}
      {!selectedLaw && (
        <div className="observance-legend-container">
          <div className="observance-legend">
            {Object.entries(OBSERVANCE_CONFIG).map(([key, cfg]) => (
              <div key={key} className="observance-legend-item">
                <span className="observance-legend-symbol" style={{ color: lightMode && cfg.lightColor ? cfg.lightColor : cfg.color }}>{cfg.symbol}</span>
                <span className="observance-legend-label">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      <LawSidePanel selectedLaw={selectedLaw} onCloseLaw={onCloseLaw} />
    </div>
  )
}

export default NetworkGraphStyled
