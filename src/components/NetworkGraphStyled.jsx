import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, Sparkles, X, Clock, BookOpen, Info, MessageSquare, Search, Mail, Send, List, BarChart3 } from 'lucide-react'
import './NetworkGraphStyled.css'

const FEEDBACK_API = '/api/feedback'

// ── Level 2 category display config ──────────────────────────────────────────

const LEVEL2_CONFIG = {
  // LOVE GOD children (Ten Commandments 1-4) — warm gold/amber spectrum
  'know-fear-cling':    { label: 'KNOW, FEAR & CLING', short: '(1)', color: [220, 190, 130] },
  'no-idolatry':        { label: 'NO IDOLATRY', short: '(2)', color: [200, 170, 120] },
  'gods-name':          { label: "GOD'S NAME", short: '(3)', color: [210, 180, 125] },
  'sacred-times':       { label: 'SACRED TIMES', short: '(4)', color: [230, 195, 140] },
  // LOVE NEIGHBOR children (Ten Commandments 5-10) — warm sage/earth spectrum
  'honor-parents':      { label: 'HONOR PARENTS', short: '(5)', color: [170, 195, 130] },
  'no-murder':          { label: 'DO NOT MURDER', short: '(6)', color: [155, 185, 125] },
  'no-adultery':        { label: 'NO ADULTERY', short: '(7)', color: [185, 170, 130] },
  'no-steal':           { label: 'DO NOT STEAL', short: '(8)', color: [195, 180, 120] },
  'no-false-witness':   { label: 'NO FALSE WITNESS', short: '(9)', color: [190, 175, 125] },
  'no-covet':           { label: 'DO NOT COVET', short: '(10)', color: [180, 165, 120] },
}

const SUBCATEGORY_THRESHOLD = 20
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

// ── Bible book number → name (bolls.life uses numeric book IDs) ──────────────

const BOOK_NAMES = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
  28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
  33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
  38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
  43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians',
  47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians', 50: 'Philippians',
  51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians',
  54: '1 Timothy', 55: '2 Timothy', 56: 'Titus', 57: 'Philemon',
  58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter', 62: '1 John',
  63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation',
  67: '1 Esdras', 68: 'Tobit', 69: 'Judith', 70: 'Wisdom of Solomon',
  71: 'Sirach', 72: "Jeremy's Letter", 73: 'Baruch', 74: '1 Maccabees',
  75: '2 Maccabees', 76: '3 Maccabees', 77: '2 Esdras', 78: 'Susanna',
  79: 'Bel and the Dragon', 80: '4 Maccabees',
  81: 'Greek Additions to Esther', 82: "3 Holy Children's Song",
  83: 'Prayer of Manasses',
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'its', 'that', 'this', 'was',
  'are', 'be', 'has', 'had', 'have', 'he', 'she', 'his', 'her', 'him',
  'you', 'your', 'they', 'them', 'their', 'we', 'our', 'who', 'whom',
  'which', 'what', 'will', 'shall', 'may', 'not', 'no', 'nor', 'if',
  'as', 'so', 'do', 'did', 'does', 'been', 'being', 'were', 'am', 'i',
  'me', 'my', 'all', 'each', 'every', 'any', 'one', 'two', 'into',
  'out', 'up', 'also', 'than', 'then', 'said', 'says', 'say', 'when',
  'there', 'here', 'more', 'must', 'about', 'over', 'such', 'after',
  'before', 'these', 'those', 'own', 'how', 'because', 'would', 'could',
  'should', 'make', 'can', 'upon', 'let', 'us', 'come', 'came', 'give',
  'gave', 'take', 'took', 'went', 'go', 'among', 'through', 'under',
])

function extractKeywords(text, maxCount = 12) {
  if (!text) return []
  const words = text
    .replace(/["""''.,;:!?()[\]{}<>—–\-\/\\]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  // Deduplicate, keep order
  const seen = new Set()
  const unique = []
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); unique.push(w) }
  }
  return unique.slice(0, maxCount)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getShortTitle(law, maxLen = 50) {
  let title = law.law_summary || law.reference
  title = title.replace(/^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+/i, '')
  title = title.charAt(0).toUpperCase() + title.slice(1)
  if (title.length > maxLen) title = title.substring(0, maxLen) + '...'
  return title
}

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

function drawStar(ctx, x, y, rgb, coreRadius, glowRadius, intensity = 1.0) {
  const [r, g, b] = rgb
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

function formatLabel(key) {
  return key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Build hierarchy tree from category paths ─────────────────────────────────

function buildHierarchyTree(laws) {
  // tree[root][level2][level3][level4] = { laws: [], children: {} }
  const tree = {}

  laws.forEach(law => {
    const paths = law.categories || []
    paths.forEach(path => {
      const parts = path.split(' > ').map(s => s.trim())
      let node = tree
      parts.forEach((part, depth) => {
        if (!node[part]) node[part] = { _laws: [], _children: {} }
        if (depth === parts.length - 1) {
          node[part]._laws.push(law)
        }
        node = node[part]._children
      })
    })
  })

  return tree
}

// ── Component ────────────────────────────────────────────────────────────────

function NetworkGraphStyled({ laws, onSelectLaw, selectedLaw, onCloseLaw, onSwitchView }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  // Tree navigation state
  const [expandedL2, setExpandedL2] = useState(null)     // e.g. "SACRED_TIMES"
  const [expandedL3, setExpandedL3] = useState(null)     // e.g. "Weekly Sabbath"
  const [expandedL4, setExpandedL4] = useState(null)     // e.g. "Rest and Work Prohibition"
  const [activePath, setActivePath] = useState(new Set())
  const [breadcrumbs, setBreadcrumbs] = useState(['Torah Laws'])

  // Side panel tab state
  const [sideTab, setSideTab] = useState('study')  // 'study' | 'details'

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef(null)

  // Verse lookup state
  const [fetchedVerse, setFetchedVerse] = useState(null)  // { reference, text, loading, error }
  const [verseCache, setVerseCache] = useState({})         // cache by reference string
  const [keywordResults, setKeywordResults] = useState(null) // { keyword, results[], loading, error }

  // Feedback dialog state
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackContext, setFeedbackContext] = useState('')  // law reference if from side panel
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  // Fetch a verse from bible-api.com
  const fetchVerse = useCallback((ref) => {
    // Clean the reference: strip parenthetical notes, trim
    const cleanRef = ref.replace(/\s*\(.*?\)\s*/g, '').trim()
    if (!cleanRef) return

    // Check cache
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

  const focusOnFullTree = useCallback(() => {
    focusOnArea(0, ROOT_Y - 60, 2400, LEVEL2_Y + 100)
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

    setExpandedL2(l2Key)
    setExpandedL3(l3Key)
    setExpandedL4(l4Key)

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
  }, [onSelectLaw, focusOnArea])

  // ── Build visual tree ─────────────────────────────────────────────────────

  const buildTree = useCallback(() => {
    const nodes = []
    const edges = []

    // Determine which Level 2 categories exist under each root
    const godL2s = []
    const neighborL2s = []

    if (hierarchy['love-god']) {
      Object.keys(hierarchy['love-god']._children).forEach(key => {
        godL2s.push({ root: 'love-god', key, ...hierarchy['love-god']._children[key] })
      })
    }
    if (hierarchy['love-neighbor']) {
      Object.keys(hierarchy['love-neighbor']._children).forEach(key => {
        neighborL2s.push({ root: 'love-neighbor', key, ...hierarchy['love-neighbor']._children[key] })
      })
    }

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
    const godSpacing = Math.max(140, 210 - godL2s.length * 5)
    const neighborSpacing = Math.max(140, 210 - neighborL2s.length * 5)
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

        let label = config.label
        if (config.short) label += ` ${config.short}`

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

      const l3Keys = Object.keys(l2Node._children)
      const directLaws = l2Node._laws || []
      const parentConfig = LEVEL2_CONFIG[expandedL2] || { color: [148, 163, 184] }

      if (l3Keys.length === 0 && directLaws.length > 0) {
        addLawListNodes(`l2-${expandedL2}`, l2Pos.x, LEVEL3_Y, directLaws, parentConfig.color)
      } else {
        const l3Spacing = Math.max(115, 185 - l3Keys.length * 4)
        const l3Positions = positionChildren(l3Keys.length, l2Pos.x, LEVEL3_Y, l3Spacing)
        const l3PositionMap = {}

        l3Keys.forEach((l3Key, i) => {
          const l3Data = l2Node._children[l3Key]
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
            const l4Keys = Object.keys(l3Data._children)

            if (l4Keys.length === 0) {
              const allLaws = collectAllLaws(l3Data)
              addLawListNodes(`l3-${expandedL3}`, l3Pos.x, LEVEL4_Y, allLaws, parentConfig.color)
            } else {
              const l4Spacing = Math.max(105, 175 - l4Keys.length * 4)
              const l4Positions = positionChildren(l4Keys.length, l3Pos.x, LEVEL4_Y, l4Spacing)
              const l4PositionMap = {}

              l4Keys.forEach((l4Key, i) => {
                const l4Data = l3Data._children[l4Key]
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

    nodesRef.current = nodes
    edgesRef.current = edges
  }, [expandedL2, expandedL3, expandedL4, laws, hierarchy, l2Counts])

  // Rebuild tree when state changes
  useEffect(() => { buildTree() }, [buildTree])

  // Initial focus
  useEffect(() => {
    if (laws.length > 0 && !initializedRef.current) {
      initializedRef.current = true
      const { w, h } = sizeRef.current
      const zoom = Math.min(w / 2800, h / 550, 1.0)
      const cx = 1200
      const cy = 220
      panRef.current = { x: w / 2 - cx * zoom, y: h / 2 - cy * zoom }
      targetPanRef.current = { ...panRef.current }
      zoomRef.current = zoom
      targetZoomRef.current = zoom
    }
  }, [laws])

  // ── Render loop ──────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const lerp = 0.1
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

    // Draw edges (skip law-to-law vertical connectors, draw a single line instead)
    edges.forEach(edge => {
      if (edge.lawEdge) return // skip law-to-law connectors
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) return
      // For edges to law nodes, glow if the parent category is on the path
      // (the parent→first-law edge should glow when ANY law in that list is selected)
      const isOnPath = target.type === 'law'
        ? pathSet.has(edge.source)
        : pathSet.has(edge.source) && pathSet.has(edge.target)
      const [r, g, b] = source.color

      ctx.beginPath()
      if (target.type === 'law') {
        // Draw a single vertical line from parent down to the law list
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
      } else {
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
      }

      if (isOnPath) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`
        ctx.lineWidth = 3
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`
        ctx.shadowBlur = 16
      } else if (edge.subtle) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.06)`
        ctx.lineWidth = 0.5
        ctx.shadowBlur = 0
      } else {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.18)`
        ctx.lineWidth = 1
        ctx.shadowBlur = 0
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // Draw a vertical guide line through law lists
    const lawNodes = nodes.filter(n => n.type === 'law')
    if (lawNodes.length > 0) {
      // Group law nodes by x position (same list)
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
        ctx.beginPath()
        ctx.moveTo(first.x - 5, first.y)
        ctx.lineTo(last.x - 5, last.y)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.1)`
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }

    // Draw non-law nodes as stars
    ctx.globalCompositeOperation = 'lighter'
    nodes.forEach(node => {
      if (node.type === 'law') return // draw separately
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id
      const baseIntensity = isOnPath ? 1.0 : 0.85
      const intensity = baseIntensity * (isHovered ? 1.3 : 1.0)
      const glow = node.glowRadius * (isHovered ? 1.25 : 1.0)
      drawStar(ctx, node.x, node.y, node.color, node.coreRadius, glow, intensity)
    })
    ctx.globalCompositeOperation = 'source-over'

    // Draw non-law labels (centered below star)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    nodes.forEach(node => {
      if (node.type === 'law') return // draw separately
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id
      const [r, g, b] = node.color

      const labelAlpha = isHovered ? 0.95
        : isOnPath ? 0.9
        : node.type === 'great-command' ? 0.75
        : node.type === 'level2' ? 0.65
        : node.type === 'level3' || node.type === 'level4' ? 0.6
        : 0.5

      const fontSize = node.type === 'great-command' ? 18
        : node.type === 'level2' ? 14
        : node.type === 'level3' || node.type === 'level4' ? 12
        : 11

      ctx.font = `${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${labelAlpha})`
      const labelY = node.y + node.coreRadius + 12
      ctx.fillText(node.label, node.x, labelY)

      if (node.sublabel) {
        ctx.font = `${fontSize - 2}px 'Inter', 'Segoe UI', system-ui, sans-serif`
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${labelAlpha * 0.65})`
        ctx.fillText(node.sublabel, node.x, labelY + fontSize + 3)
      }
    })

    // Draw law rows: small dot + reference + title per row
    ctx.textBaseline = 'middle'
    nodes.forEach(node => {
      if (node.type !== 'law') return
      const isOnPath = pathSet.has(node.id)
      const isHovered = hoveredRef.current === node.id
      const [r, g, b] = node.color

      const alpha = isHovered ? 0.95 : isOnPath ? 0.9 : 0.7
      const bgAlpha = isHovered ? 0.08 : 0

      // Hover highlight background
      if (bgAlpha > 0) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bgAlpha})`
        ctx.fillRect(node.x - 8, node.y - LAW_ROW_HEIGHT / 2, 500, LAW_ROW_HEIGHT)
      }

      // Small dot
      ctx.beginPath()
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fill()

      // Reference (bold-ish)
      ctx.textAlign = 'left'
      ctx.font = `600 20px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.fillText(node.refLabel || '', node.x + 14, node.y)

      // Title
      const refWidth = node.refLabel ? ctx.measureText(node.refLabel).width + 14 : 0
      ctx.font = `18px 'Inter', 'Segoe UI', system-ui, sans-serif`
      ctx.fillStyle = `rgba(235, 225, 205, ${alpha * 0.8})`
      ctx.fillText(node.label, node.x + 14 + refWidth, node.y)
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
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      if (n.type === 'law') {
        // Rectangular hit area for law rows
        if (wx >= n.x - 10 && wx <= n.x + 500 &&
            wy >= n.y - LAW_ROW_HEIGHT / 2 && wy <= n.y + LAW_ROW_HEIGHT / 2) {
          return n
        }
      } else {
        const dx = wx - n.x, dy = wy - n.y
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

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'great-command') {
      setExpandedL2(null)
      setExpandedL3(null)
      setExpandedL4(null)
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
        // Collapse
        setExpandedL2(null)
        setExpandedL3(null)
        setExpandedL4(null)
        setActivePath(new Set())
        setBreadcrumbs(['Torah Laws'])
        focusOnFullTree()
      } else {
        setExpandedL2(l2Key)
        setExpandedL3(null)
        setExpandedL4(null)
        const rootId = node.rootId
        const config = LEVEL2_CONFIG[l2Key] || { label: formatLabel(l2Key) }
        setActivePath(buildActivePath(rootId, l2Key))
        setBreadcrumbs(['Torah Laws', rootId === 'love-god' ? 'LOVE YHWH' : 'LOVE NEIGHBOR', config.label])

        // Focus — if subcategories exist use horizontal spread, otherwise vertical law list
        const l2Data = hierarchy[rootId]?._children[l2Key]
        const childCount = l2Data ? Object.keys(l2Data._children).length : 0
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
        setExpandedL3(null)
        setExpandedL4(null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2))
        setBreadcrumbs(prev => prev.slice(0, 3))
      } else {
        setExpandedL3(l3Key)
        setExpandedL4(null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2, l3Key))
        setBreadcrumbs(prev => [...prev.slice(0, 3), formatLabel(l3Key)])

        const l3Data = node.data
        const childCount = l3Data ? Object.keys(l3Data._children).length : 0
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
        setExpandedL4(null)
        const rootKey = Object.keys(hierarchy).find(r =>
          hierarchy[r]._children[expandedL2])
        setActivePath(buildActivePath(rootKey, expandedL2, expandedL3))
        setBreadcrumbs(prev => prev.slice(0, 4))
      } else {
        setExpandedL4(l4Key)
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
  }, [expandedL2, expandedL3, expandedL4, hierarchy, laws, onSelectLaw, focusOnArea, focusOnFullTree, buildActivePath])

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
      setExpandedL2(null); setExpandedL3(null); setExpandedL4(null)
      setActivePath(new Set())
      setBreadcrumbs(['Torah Laws'])
      focusOnFullTree()
    } else if (level === 1) {
      setExpandedL2(null); setExpandedL3(null); setExpandedL4(null)
      setActivePath(new Set())
      setBreadcrumbs(prev => prev.slice(0, 2))
      focusOnFullTree()
    } else if (level === 2) {
      setExpandedL3(null); setExpandedL4(null)
      const rootKey = Object.keys(hierarchy).find(r => hierarchy[r]._children[expandedL2])
      setActivePath(buildActivePath(rootKey, expandedL2))
      setBreadcrumbs(prev => prev.slice(0, 3))
    } else if (level === 3) {
      setExpandedL4(null)
      const rootKey = Object.keys(hierarchy).find(r => hierarchy[r]._children[expandedL2])
      setActivePath(buildActivePath(rootKey, expandedL2, expandedL3))
      setBreadcrumbs(prev => prev.slice(0, 4))
    }
  }, [expandedL2, expandedL3, hierarchy, focusOnFullTree, buildActivePath])

  const handleBack = () => {
    if (expandedL4) navigateTo(3)
    else if (expandedL3) navigateTo(2)
    else if (expandedL2) navigateTo(0)
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="network-container">
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
      </div>

      <div className="network-canvas-wrap">
        <canvas ref={canvasRef} className="network-canvas" />
      </div>

      <div className="network-hint">
        {!expandedL2 && 'TAP CATEGORY TO EXPAND \u00b7 DRAG TO PAN \u00b7 SCROLL TO ZOOM'}
        {expandedL2 && !expandedL3 && 'TAP SUBCATEGORY TO EXPAND \u00b7 TAP LAW FOR DETAILS'}
        {expandedL3 && 'TAP TO DRILL DEEPER \u00b7 DRAG TO PAN'}
      </div>

      {/* Report / Feedback button — bottom left */}
      <button
        className="feedback-btn"
        title="Send feedback or suggestions"
        onClick={() => { setFeedbackContext(''); setShowFeedback(true); setFeedbackSent(false) }}
      >
        <Mail className="w-4 h-4" />
        <span>Feedback</span>
      </button>

      {onSwitchView && (
        <div className="network-view-switches">
          <button className="legend-view-btn" onClick={() => onSwitchView('list')}>
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button className="legend-view-btn" onClick={() => onSwitchView('stats')}>
            <BarChart3 className="w-3.5 h-3.5" /> Stats
          </button>
        </div>
      )}

      {/* Side Panel */}
      <div className={`side-panel ${selectedLaw ? 'open' : ''}`}>
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

              {/* ── Study Tab ── */}
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
                      <div className="side-panel-refs">
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
                      <div className="side-panel-refs">
                        {selectedLaw.other_torah_refs.split(/,\s*(?=[A-Z0-9])/).map((ref, i) => {
                          const clean = ref.trim()
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

              {/* ── Details Tab ── */}
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
    </div>
  )
}

// ── Tree utility functions ─────────────────────────────────────────────────

function countAllLaws(node) {
  if (!node) return 0
  let count = (node._laws || []).length
  Object.values(node._children || {}).forEach(child => {
    count += countAllLaws(child)
  })
  return count
}

function collectAllLaws(node) {
  if (!node) return []
  const laws = [...(node._laws || [])]
  Object.values(node._children || {}).forEach(child => {
    laws.push(...collectAllLaws(child))
  })
  // Deduplicate by law id
  const seen = new Set()
  return laws.filter(law => {
    if (seen.has(law.id)) return false
    seen.add(law.id)
    return true
  })
}

export default NetworkGraphStyled
