# Migration Fix Summary

## Date: 2026-04-11

## Critical Issues Fixed

### 1. Missing "Do not" Prefix

**Problem:** The SQL migration omitted "Do not" from the prefix list, while the JavaScript `getShortTitle()` function should include it. This creates data inconsistency where laws starting with "Do not" would not have the prefix properly stripped.

**Impact:** Laws like "Do not murder" or "Do not steal" would keep their prefix in the preview field instead of being transformed to "Murder" or "Steal".

**Fix Applied:**
- Added "Do not" to the regex pattern in the migration file
- Added "Do not" to the JavaScript function in `src/lib/lawHelpers.js`

**Updated Pattern:**
```sql
'^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+'
```

### 2. Repeated Regex Computation

**Problem:** The original migration repeated the same `regexp_replace` operation 7 times throughout the SQL query, which is:
- Inefficient (same computation done multiple times)
- Error-prone (inconsistencies if one instance is changed)
- Hard to maintain
- Poor performance on large datasets

**Fix Applied:** Refactored the SQL to use CTEs (Common Table Expressions) that compute the transformation once and reuse it:

```sql
WITH transformed AS (
  -- Step 1: Strip prefixes (done once)
  SELECT law_id, regexp_replace(...) AS stripped_text
  FROM ...
),
capitalized AS (
  -- Step 2: Capitalize (done once, reuses stripped_text)
  SELECT law_id, regexp_replace(...) AS preview_text
  FROM transformed
)
UPDATE perpetuity_analysis pa
SET preview = CASE
  WHEN LENGTH(c.preview_text) > 100 THEN
    substring(c.preview_text, 1, 100) || '...'
  ELSE
    c.preview_text
END
FROM capitalized c
WHERE pa.law_id = c.law_id;
```

## Files Modified

1. `/home/jonathan/torah/Torah Laws/torah-law-web/supabase/migrations/20260411000001_migrate_law_summary_to_preview.sql`
   - Added "Do not" to prefix pattern
   - Refactored to use CTEs for better performance

2. `/home/jonathan/torah/Torah Laws/torah-law-web/src/lib/lawHelpers.js`
   - Added "Do not" to `getShortTitle()` function prefix pattern

## Files Created

1. `/home/jonathan/torah/Torah Laws/torah-law-web/supabase/migrations/MIGRATION_INSTRUCTIONS.md`
   - Detailed instructions for running the migration
   - Multiple execution options (Dashboard, CLI, psql)
   - Verification queries

2. `/home/jonathan/torah/Torah Laws/torah-law-web/supabase/migrations/verify_preview_migration.sql`
   - Comprehensive verification script
   - Checks for "Do not" prefix handling
   - Validates all prefix types
   - Detects any migration failures
   - Verifies truncation logic

## Next Steps

1. **Run the Migration**
   - Follow instructions in `MIGRATION_INSTRUCTIONS.md`
   - Execute via Supabase Dashboard SQL Editor

2. **Verify Results**
   - Run `verify_preview_migration.sql` to check results
   - Pay special attention to "Do not" laws

3. **Commit Changes**
   - Commit the fixed migration file
   - Commit the updated JavaScript helper
   - Commit documentation files

## Expected Impact

Laws affected by the "Do not" fix:
- Any law in the database starting with "Do not"
- These will now have correct previews with the prefix removed and first letter capitalized

Performance improvement:
- Migration now computes transformations once instead of 7 times
- Estimated ~85% reduction in regex operations
- More maintainable code structure

## Testing Recommendations

After running the migration, verify:
1. Laws starting with "Do not" have correct previews
2. All other prefix types still work correctly
3. Capitalization is applied properly
4. Truncation with ellipsis works for long laws
5. No null previews for laws with summaries
