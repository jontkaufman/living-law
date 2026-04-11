# Torah Laws Embed Generator

Interactive web app for generating customizable Torah Laws embeds. Runs entirely on Cloudflare Pages with Functions.

## Features

- **Live Preview** - See changes in real-time
- **Theme Selection** - 5 beautiful themes (Scrolls, Classic, Modern, Hebrew, YH)
- **Typography Control** - Customize fonts, weights, sizes, and italics per text role
- **Data Options**:
  - **Baked In** - All data embedded (~2 MB, works offline)
  - **Live** - Fetches from Supabase at runtime (~60 KB)
- **Dark/Light Mode** - Initial mode selection

## Deployment to Cloudflare Pages

### Option 1: Wrangler CLI (Direct Deploy)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from this directory
cd torah-law-web/embed
wrangler pages deploy . --project-name=torah-embed-generator
```

Access at: `https://torah-embed-generator.pages.dev`

### Option 2: Git Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Torah embed generator"
   git push
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Pages → Create a project → Connect to Git
   - Select your repository
   - Build settings:
     - **Build command**: (leave empty)
     - **Build output directory**: `torah-law-web/embed`
     - **Root directory**: `torah-law-web/embed`

3. **Auto-deploy**
   - Every push automatically deploys
   - Preview deployments for PRs

### Option 3: Custom Domain

After deployment, add a custom domain:
1. Pages → Your project → Custom domains
2. Add domain (e.g., `torah-embed.yourdomain.com`)
3. Update DNS as instructed

## Optional: Enable KV Storage

For persistent session storage (recommended for production):

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "TORAH_EMBED_KV"
   ```

2. **Update wrangler.toml**
   - Uncomment the `[[kv_namespaces]]` section
   - Add the namespace ID from step 1

3. **Redeploy**
   ```bash
   wrangler pages deploy . --project-name=torah-embed-generator
   ```

Without KV, generated files are returned directly to the browser (still works, just no server-side caching).

## Architecture

```
embed/
├── setup.html          # Frontend UI
├── template.html       # Output template
├── themes.cjs          # Theme definitions (Node.js)
├── setup.cjs           # Local dev server (Node.js)
├── functions/          # Cloudflare Functions
│   ├── _shared.js      # Shared utilities
│   ├── _themes.js      # Theme definitions (ES modules)
│   └── api/
│       ├── themes.js   # GET /api/themes
│       ├── preview.js  # POST /api/preview
│       ├── generate.js # POST /api/generate
│       └── download.js # GET /api/download?session=...
└── wrangler.toml       # Cloudflare config
```

## API Endpoints

### GET /api/themes
Returns theme catalog, font list, and text roles.

**Response:**
```json
{
  "themes": [...],
  "sizes": { "XS": 0.8, "S": 0.9, "M": 1.0, "L": 1.1, "XL": 1.25 },
  "fontCatalog": [...],
  "textRoles": [...]
}
```

### POST /api/preview
Generates preview HTML with live data.

**Request:**
```json
{
  "themeId": "scrolls",
  "sizeKey": "M",
  "lightMode": false,
  "typography": { ... }
}
```

**Response:** HTML document (text/html)

### POST /api/generate
Generates final embed file.

**Request:**
```json
{
  "themeId": "scrolls",
  "sizeKey": "M",
  "lightMode": false,
  "dataSource": "baked", // or "live"
  "typography": { ... }
}
```

**Response:**
```json
{
  "ok": true,
  "size": 2048576,
  "sessionId": "uuid" // if KV enabled
  // OR
  "html": "<!DOCTYPE html>..." // if no KV
}
```

### GET /api/download?session=uuid
Downloads generated file (when KV enabled).

**Response:** HTML file (Content-Disposition: attachment)

## Local Development

Use the Node.js server for local testing:

```bash
# GUI mode (opens browser)
node setup.cjs

# CLI mode (terminal prompts)
node setup.cjs --cli
```

For testing CF Functions locally, use Wrangler:

```bash
wrangler pages dev . --kv TORAH_EMBED_KV
```

## Tech Stack

- **Frontend**: Vanilla JS (zero dependencies)
- **Backend**: Cloudflare Pages Functions (serverless)
- **Storage**: Cloudflare Workers KV (optional)
- **Data**: Supabase PostgreSQL
- **Fonts**: Google Fonts API
- **Obfuscation**: XOR cipher for API keys

## Environment Variables

None required! Supabase public API key is obfuscated client-side.

## Customization

### Adding New Themes

Edit `functions/_themes.js`:

```js
export const THEMES = [
  // ... existing themes
  {
    id: 'my-theme',
    name: 'My Custom Theme',
    description: 'description here',
    typographyDefaults: { ... },
    dark: { ... },
    light: { ... }
  }
]
```

### Adding Fonts

Add to `FONT_CATALOG` in `functions/_themes.js`:

```js
{
  id: 'my-font',
  name: 'My Font',
  family: "'My Font', serif",
  googleFamily: 'My+Font',
  category: 'serif',
  weights: [400, 700],
  hasItalic: true
}
```

## Troubleshooting

**Template not loading in preview:**
- Ensure `template.html` is in the root of the embed directory
- Check browser console for fetch errors
- Verify Cloudflare Pages is serving static files correctly

**Download not working:**
- If no KV: Check browser console for blob URL creation
- If KV enabled: Verify namespace is bound in wrangler.toml

**Supabase fetch fails:**
- Check network tab for CORS errors
- Verify Supabase URL and key in `functions/_shared.js`
- Ensure RPC function `get_frontend_laws` exists

## License

Same as parent project.
