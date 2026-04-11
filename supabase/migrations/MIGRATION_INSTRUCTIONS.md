# Migration Instructions

## Running the Preview Field Migration

The migration file `20260411000001_migrate_law_summary_to_preview.sql` has been updated to fix critical issues:

### Issues Fixed

1. **Added "Do not" prefix** - Now matches JavaScript `getShortTitle()` function
2. **Optimized SQL** - Uses CTE to compute transformation once instead of 7 repeated regexp operations

### How to Run the Migration

#### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard: https://msgvoboqmegpuioqgscp.supabase.co
2. Navigate to: SQL Editor (left sidebar)
3. Copy the contents of `20260411000001_migrate_law_summary_to_preview.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

#### Option 2: Using Supabase CLI (if installed)

```bash
supabase db reset
```

Or to run just this migration:

```bash
supabase db push
```

#### Option 3: Using psql directly

If you have database credentials:

```bash
psql "postgresql://postgres:[password]@[host]:[port]/postgres" -f supabase/migrations/20260411000001_migrate_law_summary_to_preview.sql
```

### Verification

After running the migration, verify the changes with these queries:

```sql
-- Check specific laws that should be affected by "Do not" prefix
SELECT
  l.id,
  l.law_summary,
  pa.preview
FROM perpetuity_analysis pa
JOIN laws l ON pa.law_id = l.id
WHERE l.law_summary LIKE 'Do not%'
ORDER BY l.id
LIMIT 10;

-- Check summary of preview population
SELECT
  COUNT(*) FILTER (WHERE preview IS NOT NULL) as with_preview,
  COUNT(*) FILTER (WHERE preview IS NULL) as without_preview,
  COUNT(*) as total
FROM perpetuity_analysis;

-- Check examples of all prefix types
SELECT
  l.law_summary,
  pa.preview
FROM perpetuity_analysis pa
JOIN laws l ON pa.law_id = l.id
WHERE l.law_summary ~ '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)'
ORDER BY l.law_summary
LIMIT 20;
```

### Expected Results

Laws starting with "Do not" should have previews with:
- "Do not" prefix removed
- First letter capitalized
- Truncated to 100 characters with "..." if needed

Example:
- Before: "Do not murder innocent people"
- After: "Murder innocent people"
