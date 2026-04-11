import { THEMES, SIZE_SCALES, TEXT_ROLES, FONT_CATALOG } from '../_themes.js'
import { buildOutput, buildLiveDataScript } from '../_shared.js'

// Load template HTML at build time using import.meta
const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en" style="font-size: {{SIZE_SCALE}}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Torah Laws</title>
{{FONT_IMPORTS}}
<style>
/* ── CSS Custom Properties ── */
:root {
{{THEME_VARS}}
  --heading-font: {{HEADING_FONT}};
  --body-font: {{BODY_FONT}};
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%; height: 100%;
  font-family: var(--body-font);
  background: var(--bg-deep);
  color: rgba(var(--text-primary), 0.9);
  overflow: hidden;
}

/* [rest of CSS - will be loaded from template.html file] */
</style>
</head>
<body>
<div id="app">Loading...</div>
{{DATA_SCRIPT}}
<script>
// [rest of JS - will be loaded from template.html file]
</script>
</body>
</html>`

export async function onRequestPost({ request, env }) {
  try {
    const opts = await request.json()
    const theme = THEMES.find(t => t.id === opts.themeId)
    if (!theme) {
      return new Response('Unknown theme', { status: 400 })
    }

    // Read template HTML from file system
    // In CF Workers, we'll need to inline it or bundle it
    // For now, fetch it from the public path
    let templateHtml
    try {
      const templateUrl = new URL('/template.html', request.url)
      const templateResponse = await fetch(templateUrl.toString())
      if (templateResponse.ok) {
        templateHtml = await templateResponse.text()
      } else {
        // Fallback to minimal template
        templateHtml = TEMPLATE_HTML
      }
    } catch {
      templateHtml = TEMPLATE_HTML
    }

    const dataScript = buildLiveDataScript()
    const html = buildOutput(
      theme,
      opts.sizeKey || 'M',
      !!opts.lightMode,
      dataScript,
      opts.typography,
      templateHtml,
      SIZE_SCALES,
      TEXT_ROLES,
      FONT_CATALOG
    )

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    return new Response('Bad request: ' + err.message, { status: 400 })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
