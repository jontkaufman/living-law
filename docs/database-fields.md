# Database Fields - Laws

## Preview vs Summary

The `perpetuity_analysis` table contains two related text fields:

### preview (TEXT)
- **Purpose**: Short, concise description for list views and tooltips
- **Length**: Typically 50-100 characters
- **Style**: Direct, actionable statement
- **Examples**:
  - "No graven images or likenesses"
  - "Do not bring idols into your home"
  - "Honor your parents"
- **Usage**:
  - List view law items (via getShortTitle helper)
  - Network graph tooltips
  - Search result snippets

### law_summary (TEXT)
- **Purpose**: Detailed explanation for side panel and full law display
- **Length**: 1-3 sentences
- **Style**: Explanatory, contextual, theological framing
- **Examples**:
  - "God's people are instructed to not bring idols in their home - these are disgusting to him and us"
  - "Guard yourself against idolatry - make no physical representation of God since He revealed Himself without visible form at Horeb"
- **Usage**:
  - Side panel detail view
  - Full law display
  - AI analysis context

## Migration

Existing `law_summary` data was automatically processed to populate `preview` using the following transformations:
1. Strip common prefixes (The law that, Command to, etc.)
2. Capitalize first letter
3. Truncate to 100 characters if needed

Going forward, preview and summary should be curated separately for optimal clarity in each context.
