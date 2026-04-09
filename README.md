# Torah Law Explorer

An interactive web platform for exploring and studying Torah laws with perpetuity analysis from a Hebrew Roots perspective.

## Features

- **Interactive Law Browser** - Search and filter 2,066+ Torah laws
- **Perpetuity Analysis** - View classification of laws as eternal, ongoing, or contextual
- **Progressive Disclosure** - Simple overview with detailed analysis on demand
- **Dark Mode** - Easy on the eyes for extended study sessions
- **Statistics Dashboard** - Visual breakdown of law distribution
- **Smart Filtering** - Default filter shows laws applicable to "all Israel"
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Data**: JSON export from SQLite database
- **Deployment**: Cloudflare Pages (static hosting)

## Development

### Start Development Server

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

### Update Data

To refresh law data from the database:

```bash
cd ..
python3 << 'EOF'
import sqlite3, json
conn = sqlite3.connect('torah_laws.db')
conn.row_factory = sqlite3.Row
laws = conn.execute('''
    SELECT t.*, p.*
    FROM torah_laws t
    LEFT JOIN law_perpetuity_analysis p ON t.id = p.law_id
    WHERE t.contains_law = 1
    ORDER BY t.id
''').fetchall()
with open('torah-law-web/public/laws-data.json', 'w') as f:
    json.dump([dict(row) for row in laws], f, indent=2)
print(f'Exported {len(laws)} laws')
EOF
```

## Deployment to Cloudflare Pages

### Quick Deploy

```bash
# Build
npm run build

# Install Wrangler (if not installed)
npm install -g wrangler

# Deploy
wrangler pages deploy dist --project-name=torah-law-explorer
```

### Git Integration (Recommended)

1. Push to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
5. Deploy automatically on every push

## Project Structure

```
src/
├── components/
│   ├── LawCard.jsx        # Individual law card
│   ├── LawList.jsx        # List view
│   ├── LawDetail.jsx      # Detail modal
│   ├── FilterPanel.jsx    # Filters
│   └── StatsOverview.jsx  # Statistics
├── App.jsx                # Main app
└── index.css              # Tailwind config
```

## Future Enhancements

- User authentication for notes
- Network graph visualization
- Torah portion integration
- Hebrew text display
- PDF export
- PWA/offline support
