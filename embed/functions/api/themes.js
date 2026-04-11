import { THEMES, SIZE_SCALES, FONT_CATALOG, TEXT_ROLES } from '../_themes.js'

export async function onRequestGet() {
  return new Response(JSON.stringify({
    themes: THEMES,
    sizes: SIZE_SCALES,
    fontCatalog: FONT_CATALOG,
    textRoles: TEXT_ROLES
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
