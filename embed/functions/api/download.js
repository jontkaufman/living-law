export async function onRequestGet({ request, env, url }) {
  try {
    const sessionId = url.searchParams.get('session')

    if (!sessionId) {
      return new Response('Missing session ID', { status: 400 })
    }

    if (!env.TORAH_EMBED_KV) {
      return new Response('KV storage not configured', { status: 500 })
    }

    const html = await env.TORAH_EMBED_KV.get(`session:${sessionId}`)

    if (!html) {
      return new Response('Session expired or not found', { status: 404 })
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="torah-laws.html"',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    return new Response('Error: ' + err.message, { status: 500 })
  }
}
