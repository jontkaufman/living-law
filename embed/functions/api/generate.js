import { THEMES, SIZE_SCALES, TEXT_ROLES, FONT_CATALOG } from '../_themes.js'
import { buildOutput, buildLiveDataScript, fetchBakedData } from '../_shared.js'

export async function onRequestPost({ request, env }) {
  try {
    const opts = await request.json()
    const theme = THEMES.find(t => t.id === opts.themeId)
    if (!theme) {
      return new Response(JSON.stringify({ ok: false, error: 'Unknown theme' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch template HTML from root
    let templateHtml
    try {
      const templateUrl = new URL('/template.html', request.url)
      const templateResponse = await fetch(templateUrl.toString())
      if (templateResponse.ok) {
        templateHtml = await templateResponse.text()
      } else {
        throw new Error('Template not found')
      }
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'Failed to load template: ' + err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build data script
    let dataScript
    if (opts.dataSource === 'baked') {
      const data = await fetchBakedData()
      dataScript = `<script>\nconst TORAH_LAWS_DATA = ${JSON.stringify(data)};\n<\/script>`
    } else {
      dataScript = buildLiveDataScript()
    }

    const html = buildOutput(
      theme,
      opts.sizeKey,
      opts.lightMode,
      dataScript,
      opts.typography,
      templateHtml,
      SIZE_SCALES,
      TEXT_ROLES,
      FONT_CATALOG
    )

    // Store in KV for download
    if (env.TORAH_EMBED_KV) {
      const sessionId = crypto.randomUUID()
      await env.TORAH_EMBED_KV.put(`session:${sessionId}`, html, { expirationTtl: 3600 })

      return new Response(JSON.stringify({
        ok: true,
        size: new Blob([html]).size,
        sessionId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } else {
      // No KV, return HTML directly
      return new Response(JSON.stringify({
        ok: true,
        size: new Blob([html]).size,
        html // Include HTML for direct download
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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
