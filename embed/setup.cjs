#!/usr/bin/env node
// ── Torah Laws — Embed Generator ─────────────────────────────────────────────
// Zero npm dependencies. Uses Node.js built-in modules only.
// Default: opens browser GUI. Use --cli for terminal mode.

const readline = require('readline')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync } = require('child_process')
const { THEMES, SIZE_SCALES, FONT_CATALOG, TEXT_ROLES } = require('./themes.cjs')

const SUPABASE_URL = 'https://msgvoboqmegpuioqgscp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZ3ZvYm9xbWVncHVpb3Fnc2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzYyMTcsImV4cCI6MjA5MTM1MjIxN30.X0RJ-2kKxPxN1iZIumyr3w4QIMMvG9tJNISKleUvnHo'

// ── Shared helpers ───────────────────────────────────────────────────────────

function xorObfuscate(str, salt) {
  const buf = Buffer.from(str, 'utf8')
  const saltBuf = Buffer.from(salt, 'utf8')
  const out = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ saltBuf[i % saltBuf.length]
  return out.toString('base64')
}

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const req = https.request({
      hostname: urlObj.hostname, port: 443,
      path: urlObj.pathname + urlObj.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data)
        else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Typography helpers ───────────────────────────────────────────────────────

function buildFontImportUrl(typography) {
  // Collect unique fonts and all weights/italics needed
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

  // Build Google Fonts CSS2 URL
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

function buildTypographyCSS(typography) {
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

function buildSizeAdjustVars(typography) {
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

function buildOutput(theme, sizeKey, initialMode, dataScript, typography) {
  const typo = typography || theme.typographyDefaults
  const sizeScale = SIZE_SCALES[sizeKey]
  const modeVars = initialMode ? theme.light : theme.dark
  const cssVarsStr = Object.entries(modeVars).map(([k, v]) => `  ${k}: ${v};`).join('\n')

  // Derive heading/body font from title and law roles
  const titleFont = FONT_CATALOG.find(f => f.id === typo.title.fontId)
  const lawFont = FONT_CATALOG.find(f => f.id === typo.law.fontId)
  const headingFont = titleFont ? titleFont.family : "'Cormorant Garamond', serif"
  const bodyFont = lawFont ? lawFont.family : "'JetBrains Mono', monospace"

  const sizeAdjustVars = buildSizeAdjustVars(typo)

  const templatePath = path.join(__dirname, 'template.html')
  let html = fs.readFileSync(templatePath, 'utf8')

  html = html.replace('{{FONT_IMPORTS}}', `<link rel="stylesheet" href="${buildFontImportUrl(typo)}">`)
  const allVars = sizeAdjustVars ? cssVarsStr + '\n' + sizeAdjustVars : cssVarsStr
  html = html.replace('{{THEME_VARS}}', allVars)
  html = html.replace('{{HEADING_FONT}}', headingFont)
  html = html.replace('{{BODY_FONT}}', bodyFont)
  html = html.replace('{{SIZE_SCALE}}', `${sizeScale}em`)
  html = html.replace('{{INITIAL_MODE}}', String(initialMode))
  html = html.replace('{{DATA_SCRIPT}}', dataScript)
  html = html.replace('{{{DARK_VARS_JSON}}}', JSON.stringify(theme.dark))
  html = html.replace('{{{LIGHT_VARS_JSON}}}', JSON.stringify(theme.light))
  html = html.replace('{{TYPOGRAPHY_CSS}}', buildTypographyCSS(typo))
  return html
}

async function fetchBakedData() {
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/get_frontend_laws`
  const response = await httpsPost(rpcUrl, '{}', {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  })
  return JSON.parse(response)
}

function buildLiveDataScript() {
  const salt = crypto.randomBytes(16).toString('hex')
  const obfUrl = xorObfuscate(SUPABASE_URL, salt)
  const obfKey = xorObfuscate(SUPABASE_ANON_KEY, salt)
  return `<script>
const _s="${salt}",_u="${obfUrl}",_k="${obfKey}";
function _d(e,s){const b=Uint8Array.from(atob(e),c=>c.charCodeAt(0)),k=new TextEncoder().encode(s),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b[i]^k[i%k.length];return new TextDecoder().decode(o)}
const TORAH_LAWS_LOADER=async()=>{const u=_d(_u,_s),k=_d(_k,_s),r=await fetch(u+'/rest/v1/rpc/get_frontend_laws',{method:'POST',headers:{'Content-Type':'application/json',apikey:k,Authorization:'Bearer '+k},body:'{}'});if(!r.ok)throw new Error('Failed');return r.json()};
<\/script>`
}

// ══════════════════════════════════════════════════════════════════════════════
// GUI MODE — local HTTP server + browser
// ══════════════════════════════════════════════════════════════════════════════

function startGUI() {
  const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css' }

  function readBody(req) {
    return new Promise(resolve => {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => resolve(body))
    })
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost`)

    // Serve themes, font catalog, and text roles as JSON
    if (url.pathname === '/api/themes') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ themes: THEMES, sizes: SIZE_SCALES, fontCatalog: FONT_CATALOG, textRoles: TEXT_ROLES }))
      return
    }

    // Generate endpoint
    if (url.pathname === '/api/generate' && req.method === 'POST') {
      const body = await readBody(req)
      try {
        const opts = JSON.parse(body)
        const theme = THEMES.find(t => t.id === opts.themeId)
        if (!theme) throw new Error('Unknown theme')

        let dataScript
        if (opts.dataSource === 'baked') {
          const data = await fetchBakedData()
          dataScript = `<script>\nconst TORAH_LAWS_DATA = ${JSON.stringify(data)};\n<\/script>`
        } else {
          dataScript = buildLiveDataScript()
        }

        const html = buildOutput(theme, opts.sizeKey, opts.lightMode, dataScript, opts.typography)
        const outPath = path.join(__dirname, 'torah-laws.html')
        fs.writeFileSync(outPath, html, 'utf8')
        const stats = fs.statSync(outPath)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, size: stats.size, path: outPath }))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: err.message }))
      }
      return
    }

    // Preview endpoint — POST, accepts { themeId, sizeKey, lightMode, typography }
    if (url.pathname === '/api/preview' && req.method === 'POST') {
      const body = await readBody(req)
      try {
        const opts = JSON.parse(body)
        const theme = THEMES.find(t => t.id === opts.themeId)
        if (!theme) { res.writeHead(400); res.end('Unknown theme'); return }
        const dataScript = buildLiveDataScript()
        const html = buildOutput(theme, opts.sizeKey || 'M', !!opts.lightMode, dataScript, opts.typography)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } catch (err) {
        res.writeHead(400); res.end('Bad request: ' + err.message)
      }
      return
    }

    // Download generated file
    if (url.pathname === '/api/download') {
      const filePath = path.join(__dirname, 'torah-laws.html')
      if (!fs.existsSync(filePath)) {
        res.writeHead(404); res.end('Not found'); return
      }
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="torah-laws.html"',
      })
      fs.createReadStream(filePath).pipe(res)
      return
    }

    // Serve static files
    let filePath = url.pathname === '/' ? '/setup.html' : url.pathname
    filePath = path.join(__dirname, filePath)
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  })

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port
    const url = `http://127.0.0.1:${port}`
    console.log(`\n\u{1F54E}  Torah Laws \u2014 Embed Generator`)
    console.log(`  Open in browser: ${url}`)
    console.log(`  Press Ctrl+C to stop\n`)

    // Open browser
    try {
      const plat = process.platform
      if (plat === 'linux') execSync(`xdg-open "${url}"`, { stdio: 'ignore' })
      else if (plat === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' })
      else if (plat === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' })
    } catch { /* browser open failed — user can navigate manually */ }
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// CLI MODE — terminal prompts (node setup.cjs --cli)
// ══════════════════════════════════════════════════════════════════════════════

async function runCLI() {
  const isTTY = process.stdin.isTTY
  let rl, preBufferedLines, lineIndex

  if (isTTY) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  } else {
    preBufferedLines = await new Promise(resolve => {
      let data = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', chunk => data += chunk)
      process.stdin.on('end', () => resolve(data.trim().split('\n')))
    })
    lineIndex = 0
  }

  function ask(question, choices) {
    return new Promise(resolve => {
      console.log(`\n${question}`)
      choices.forEach((c, i) => console.log(`  ${i + 1}. ${c.label}`))
      const handle = (answer) => {
        const idx = parseInt(answer) - 1
        if (idx >= 0 && idx < choices.length) resolve(choices[idx].value)
        else { console.log('  Invalid choice, using default.'); resolve(choices[0].value) }
      }
      if (isTTY) { rl.question('  > ', handle) }
      else { const a = preBufferedLines[lineIndex++] || ''; console.log(`  > ${a}`); handle(a) }
    })
  }

  console.log('\n\u{1F54E}  Torah Laws \u2014 Embed Generator\n')

  const theme = await ask('Choose a theme:', THEMES.map(t => ({ label: `${t.name} \u2014 ${t.description}`, value: t })))
  const sizeKey = await ask('Font size:', [
    { label: 'XS  (compact)', value: 'XS' }, { label: 'S   (small)', value: 'S' },
    { label: 'M   (default)', value: 'M' }, { label: 'L   (comfortable)', value: 'L' },
    { label: 'XL  (accessible)', value: 'XL' },
  ])
  const initialMode = await ask('Initial mode:', [{ label: 'Dark', value: false }, { label: 'Light', value: true }])
  const dataSource = await ask('Data source:', [
    { label: 'Baked in \u2014 embedded in file (works offline, ~2MB)', value: 'baked' },
    { label: 'Live \u2014 fetches from database at runtime (needs internet)', value: 'live' },
  ])
  if (rl) rl.close()

  let dataScript
  if (dataSource === 'baked') {
    console.log('\nFetching laws from Supabase...')
    const data = await fetchBakedData()
    console.log(`  Fetched ${data.length} laws.`)
    dataScript = `<script>\nconst TORAH_LAWS_DATA = ${JSON.stringify(data)};\n<\/script>`
  } else {
    dataScript = buildLiveDataScript()
  }

  const html = buildOutput(theme, sizeKey, initialMode, dataScript, theme.typographyDefaults)
  const outPath = path.join(__dirname, 'torah-laws.html')
  fs.writeFileSync(outPath, html, 'utf8')
  const stats = fs.statSync(outPath)
  const size = stats.size > 512 * 1024 ? (stats.size / 1024 / 1024).toFixed(1) + ' MB' : (stats.size / 1024).toFixed(0) + ' KB'

  console.log(`\n\u2713 Generated: torah-laws.html (${size})`)
  console.log(`  Theme: ${theme.name} | Size: ${sizeKey} | Mode: ${initialMode ? 'Light' : 'Dark'} | Data: ${dataSource}`)
  console.log('')
}

// ── Entry point ──────────────────────────────────────────────────────────────

if (process.argv.includes('--cli')) {
  runCLI().catch(err => { console.error('Error:', err.message); process.exit(1) })
} else {
  startGUI()
}
