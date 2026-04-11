// Shared utilities for Cloudflare Pages Functions
// This file is used by all API endpoints

export const SUPABASE_URL = 'https://msgvoboqmegpuioqgscp.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZ3ZvYm9xbWVncHVpb3Fnc2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzYyMTcsImV4cCI6MjA5MTM1MjIxN30.X0RJ-2kKxPxN1iZIumyr3w4QIMMvG9tJNISKleUvnHo'

export function xorObfuscate(str, salt) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const buf = encoder.encode(str)
  const saltBuf = encoder.encode(salt)
  const out = new Uint8Array(buf.length)
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ saltBuf[i % saltBuf.length]
  }
  // Convert to base64
  return btoa(String.fromCharCode(...out))
}

export async function fetchBakedData() {
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_frontend_laws`
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: '{}'
  })
  if (!response.ok) throw new Error(`Supabase fetch failed: ${response.status}`)
  return response.json()
}

export function buildLiveDataScript() {
  const salt = crypto.randomUUID().replace(/-/g, '')
  const obfUrl = xorObfuscate(SUPABASE_URL, salt)
  const obfKey = xorObfuscate(SUPABASE_ANON_KEY, salt)
  return `<script>
const _s="${salt}",_u="${obfUrl}",_k="${obfKey}";
function _d(e,s){const b=Uint8Array.from(atob(e),c=>c.charCodeAt(0)),k=new TextEncoder().encode(s),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b[i]^k[i%k.length];return new TextDecoder().decode(o)}
const TORAH_LAWS_LOADER=async()=>{const u=_d(_u,_s),k=_d(_k,_s),r=await fetch(u+'/rest/v1/rpc/get_frontend_laws',{method:'POST',headers:{'Content-Type':'application/json',apikey:k,Authorization:'Bearer '+k},body:'{}'});if(!r.ok)throw new Error('Failed');return r.json()};
<\/script>`
}

export function buildFontImportUrl(typography, FONT_CATALOG) {
  const fontMap = {}
  for (const [, cfg] of Object.entries(typography)) {
    const font = FONT_CATALOG.find(f => f.id === cfg.fontId)
    if (!font) continue
    if (!fontMap[font.googleFamily]) {
      fontMap[font.googleFamily] = { font, weights: new Set(), needsItalic: false }
    }
    fontMap[font.googleFamily].weights.add(cfg.weight)
    if (cfg.italic && font.hasItalic) fontMap[font.googleFamily].needsItalic = true
  }

  const families = Object.entries(fontMap).map(([googleFamily, { font, weights, needsItalic }]) => {
    const sortedWeights = [...weights].sort((a, b) => a - b)
    if (needsItalic && font.hasItalic) {
      const specs = []
      for (const w of sortedWeights) {
        specs.push(`0,${w}`)
        specs.push(`1,${w}`)
      }
      return `family=${googleFamily}:ital,wght@${specs.join(';')}`
    }
    return `family=${googleFamily}:wght@${sortedWeights.join(';')}`
  })

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

export function buildTypographyCSS(typography, TEXT_ROLES, FONT_CATALOG) {
  const lines = []
  for (const role of TEXT_ROLES) {
    const cfg = typography[role.id]
    if (!cfg) continue
    const font = FONT_CATALOG.find(f => f.id === cfg.fontId)
    if (!font) continue

    const props = []
    props.push(`font-family: ${font.family}`)
    props.push(`font-weight: ${cfg.weight}`)
    if (cfg.italic) props.push('font-style: italic')
    else props.push('font-style: normal')

    const selector = role.selectors.join(',\n')
    lines.push(`${selector} { ${props.join('; ')}; }`)
  }
  return lines.join('\n')
}

export function buildSizeAdjustVars(typography, TEXT_ROLES) {
  const vars = []
  for (const role of TEXT_ROLES) {
    const cfg = typography[role.id]
    if (!cfg || !role.baseSize) continue
    const multiplier = cfg.size / role.baseSize
    if (Math.abs(multiplier - 1.0) > 0.001) {
      vars.push(`  --typo-${role.id}-adjust: ${parseFloat(multiplier.toFixed(4))};`)
    }
  }
  return vars.join('\n')
}

export function buildOutput(theme, sizeKey, initialMode, dataScript, typography, templateHtml, SIZE_SCALES, TEXT_ROLES, FONT_CATALOG) {
  const typo = typography || theme.typographyDefaults
  const sizeScale = SIZE_SCALES[sizeKey]
  const modeVars = initialMode ? theme.light : theme.dark
  const cssVarsStr = Object.entries(modeVars).map(([k, v]) => `  ${k}: ${v};`).join('\n')

  // Derive heading/body font from title and law roles
  const titleFont = FONT_CATALOG.find(f => f.id === typo.title.fontId)
  const lawFont = FONT_CATALOG.find(f => f.id === typo.law.fontId)
  const headingFont = titleFont ? titleFont.family : "'Cormorant Garamond', serif"
  const bodyFont = lawFont ? lawFont.family : "'JetBrains Mono', monospace"

  const sizeAdjustVars = buildSizeAdjustVars(typo, TEXT_ROLES)

  let html = templateHtml
  html = html.replace('{{FONT_IMPORTS}}', `<link rel="stylesheet" href="${buildFontImportUrl(typo, FONT_CATALOG)}">`)
  const allVars = sizeAdjustVars ? cssVarsStr + '\n' + sizeAdjustVars : cssVarsStr
  html = html.replace('{{THEME_VARS}}', allVars)
  html = html.replace('{{HEADING_FONT}}', headingFont)
  html = html.replace('{{BODY_FONT}}', bodyFont)
  html = html.replace('{{SIZE_SCALE}}', `${sizeScale}em`)
  html = html.replace('{{INITIAL_MODE}}', String(initialMode))
  html = html.replace('{{DATA_SCRIPT}}', dataScript)
  html = html.replace('{{{DARK_VARS_JSON}}}', JSON.stringify(theme.dark))
  html = html.replace('{{{LIGHT_VARS_JSON}}}', JSON.stringify(theme.light))
  html = html.replace('{{TYPOGRAPHY_CSS}}', buildTypographyCSS(typo, TEXT_ROLES, FONT_CATALOG))
  return html
}
