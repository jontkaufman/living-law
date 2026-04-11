-- Migration: Populate preview field with transformed law_summary data
-- Description: Apply getShortTitle transformation logic to create concise previews
-- Date: 2026-04-11

-- Transform law_summary to preview by:
-- 1. Stripping common prefixes (The law that, Law that, Command to, Do not, etc.)
-- 2. Capitalizing first letter
-- 3. Truncating to 100 characters with ellipsis

-- Use CTE to compute the transformation once and reuse it
WITH transformed AS (
  SELECT
    pa.law_id,
    -- Step 1: Strip common prefixes
    regexp_replace(
      l.law_summary,
      '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+',
      '',
      'i'
    ) AS stripped_text
  FROM perpetuity_analysis pa
  JOIN laws l ON pa.law_id = l.id
  WHERE l.law_summary IS NOT NULL
),
capitalized AS (
  SELECT
    law_id,
    stripped_text,
    -- Step 2: Capitalize first letter
    regexp_replace(
      stripped_text,
      '^(.)',
      upper(substring(stripped_text, 1, 1)),
      ''
    ) AS preview_text
  FROM transformed
)
UPDATE perpetuity_analysis pa
SET preview = CASE
  WHEN LENGTH(c.preview_text) > 100 THEN
    -- Step 3: Truncate with ellipsis if too long
    substring(c.preview_text, 1, 100) || '...'
  ELSE
    c.preview_text
END
FROM capitalized c
WHERE pa.law_id = c.law_id;

-- Verification queries (run these to confirm migration success):
--
-- SELECT law_id,
--        substring(law_summary, 1, 80) as summary_start,
--        preview
-- FROM perpetuity_analysis pa
-- JOIN laws l ON pa.law_id = l.id
-- WHERE pa.law_id IN (714, 1139, 51, 353, 1155)
-- ORDER BY pa.law_id;
--
-- SELECT
--   COUNT(*) FILTER (WHERE preview IS NOT NULL) as with_preview,
--   COUNT(*) FILTER (WHERE preview IS NULL) as without_preview
-- FROM perpetuity_analysis;
