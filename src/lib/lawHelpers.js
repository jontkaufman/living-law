// ── Shared constants and helpers for Torah Law views ──────────────────────────

export const FEEDBACK_API = '/api/feedback'

// ── Level 2 category display config ──────────────────────────────────────────

export const LEVEL2_CONFIG = {
  // LOVE GOD children (Ten Commandments 1-4) — warm gold/amber spectrum
  'know-fear-cling':    { label: 'No Other Gods', short: '1', color: [220, 190, 130] },
  'no-idolatry':        { label: 'No Idols', short: '2', color: [200, 170, 120] },
  'gods-name':          { label: "Do not take Yahweh's name in vain", short: '3', color: [210, 180, 125] },
  'sacred-times':       { label: 'Honor the Sabbath', short: '4', color: [230, 195, 140] },
  // LOVE NEIGHBOR children (Ten Commandments 5-10) — warm sage/earth spectrum
  'honor-parents':      { label: 'Honor your parents', short: '5', color: [170, 195, 130] },
  'no-murder':          { label: 'You shall not murder', short: '6', color: [155, 185, 125] },
  'no-adultery':        { label: 'You shall not commit adultery', short: '7', color: [185, 170, 130] },
  'no-steal':           { label: 'You shall not steal', short: '8', color: [195, 180, 120] },
  'no-false-witness':   { label: 'You shall not bear false witness', short: '9', color: [190, 175, 125] },
  'no-covet':           { label: 'You shall not covet', short: '10', color: [180, 165, 120] },
}

// ── Observance classification config ────────────────────────────────────────

export const OBSERVANCE_CONFIG = {
  already_observing:       { label: 'Christians Already Do',       symbol: '\u2714', color: '#6bcf7f', lightColor: '#2d8f45' },
  should_observe:          { label: 'Should Observe',              symbol: '\u2605', color: '#e0c060', lightColor: '#a68a20' },
  situational:             { label: 'Situational',                 symbol: '\u25C7', color: '#8ca0b4', lightColor: '#4a6070' },
  observe_in_principle:    { label: 'Observe in Principle',        symbol: '\u25CB', color: '#c8a878', lightColor: '#856b38' },
  cannot_currently_observe:{ label: 'Cannot Currently Observe',    symbol: '\u29B8', color: '#c08888', lightColor: '#a05050' },
  aware_in_principle:      { label: 'Aware in Principle',          symbol: '\u25B3', color: '#9a9a9a', lightColor: '#4a4a4a' },
  voluntary:               { label: 'Voluntary',                   symbol: '\u2661', color: '#b090d0', lightColor: '#7050a0' },
}

// ── Bible book number → name (bolls.life uses numeric book IDs) ──────────────

export const BOOK_NAMES = {
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

export const STOP_WORDS = new Set([
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

// ── Pure helper functions ───────────────────────────────────────────────────

export function extractKeywords(text, maxCount = 12) {
  if (!text) return []
  const words = text
    .replace(/["""''.,;:!?()[\]{}<>—–\-\/\\]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  const seen = new Set()
  const unique = []
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); unique.push(w) }
  }
  return unique.slice(0, maxCount)
}

export function getShortTitle(law, maxLen = 50) {
  // Use preview field if available, otherwise fall back to law_summary
  let title = law.preview || law.law_summary || law.reference
  // Preview is already cleaned, so no need for regex stripping
  if (!law.preview) {
    title = title.replace(/^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+/i, '')
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }
  if (title.length > maxLen) title = title.substring(0, maxLen) + '...'
  return title
}

export function formatLabel(key) {
  return key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Build hierarchy tree from category paths ─────────────────────────────────

export function buildHierarchyTree(laws) {
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

export function countAllLaws(node) {
  if (!node) return 0
  let count = (node._laws || []).length
  Object.values(node._children || {}).forEach(child => {
    count += countAllLaws(child)
  })
  return count
}

export function collectAllLaws(node) {
  if (!node) return []
  const laws = [...(node._laws || [])]
  Object.values(node._children || {}).forEach(child => {
    laws.push(...collectAllLaws(child))
  })
  const seen = new Set()
  return laws.filter(law => {
    if (seen.has(law.id)) return false
    seen.add(law.id)
    return true
  })
}

// ── Sort category children by sort_order ────────────────────────────────────

export function getSortedChildren(childrenObj, categoryMeta) {
  if (!childrenObj) return []
  const entries = Object.entries(childrenObj)
  return entries.sort((a, b) => {
    const [keyA] = a
    const [keyB] = b
    const orderA = categoryMeta[keyA]?.sort_order ?? 999
    const orderB = categoryMeta[keyB]?.sort_order ?? 999
    return orderA - orderB
  })
}
