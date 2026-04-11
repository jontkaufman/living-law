-- Verification script for preview field migration
-- Run this after executing the migration to verify results

-- ============================================================================
-- 1. Check for laws starting with "Do not" (the main fix)
-- ============================================================================
SELECT
  'Laws with "Do not" prefix' as check_name,
  COUNT(*) as count,
  array_agg(l.id ORDER BY l.id) FILTER (WHERE ROW_NUMBER() OVER (ORDER BY l.id) <= 5) as sample_ids
FROM laws l
WHERE l.law_summary LIKE 'Do not%';

-- ============================================================================
-- 2. Verify preview transformations for "Do not" laws
-- ============================================================================
SELECT
  l.id,
  l.law_summary,
  pa.preview,
  CASE
    WHEN pa.preview LIKE 'Do not%' THEN 'FAILED: Prefix not removed'
    WHEN substring(pa.preview, 1, 1) != upper(substring(pa.preview, 1, 1)) THEN 'FAILED: Not capitalized'
    WHEN pa.preview IS NULL THEN 'FAILED: Preview is null'
    ELSE 'OK'
  END as status
FROM perpetuity_analysis pa
JOIN laws l ON pa.law_id = l.id
WHERE l.law_summary LIKE 'Do not%'
ORDER BY l.id
LIMIT 10;

-- ============================================================================
-- 3. Check overall preview population statistics
-- ============================================================================
SELECT
  COUNT(*) FILTER (WHERE preview IS NOT NULL) as with_preview,
  COUNT(*) FILTER (WHERE preview IS NULL) as without_preview,
  COUNT(*) as total_rows,
  ROUND(100.0 * COUNT(*) FILTER (WHERE preview IS NOT NULL) / COUNT(*), 2) as percentage_populated
FROM perpetuity_analysis;

-- ============================================================================
-- 4. Sample all prefix types to verify they're handled correctly
-- ============================================================================
WITH prefix_samples AS (
  SELECT
    l.law_summary,
    pa.preview,
    CASE
      WHEN l.law_summary ~* '^The law that' THEN 'The law that'
      WHEN l.law_summary ~* '^Law that' THEN 'Law that'
      WHEN l.law_summary ~* '^Command to' THEN 'Command to'
      WHEN l.law_summary ~* '^Requirement to' THEN 'Requirement to'
      WHEN l.law_summary ~* '^Prohibition against' THEN 'Prohibition against'
      WHEN l.law_summary ~* '^You shall' THEN 'You shall'
      WHEN l.law_summary ~* '^You must' THEN 'You must'
      WHEN l.law_summary ~* '^Do not' THEN 'Do not'
      ELSE 'Other'
    END as prefix_type,
    ROW_NUMBER() OVER (PARTITION BY
      CASE
        WHEN l.law_summary ~* '^The law that' THEN 'The law that'
        WHEN l.law_summary ~* '^Law that' THEN 'Law that'
        WHEN l.law_summary ~* '^Command to' THEN 'Command to'
        WHEN l.law_summary ~* '^Requirement to' THEN 'Requirement to'
        WHEN l.law_summary ~* '^Prohibition against' THEN 'Prohibition against'
        WHEN l.law_summary ~* '^You shall' THEN 'You shall'
        WHEN l.law_summary ~* '^You must' THEN 'You must'
        WHEN l.law_summary ~* '^Do not' THEN 'Do not'
        ELSE 'Other'
      END
      ORDER BY l.id
    ) as rn
  FROM perpetuity_analysis pa
  JOIN laws l ON pa.law_id = l.id
  WHERE l.law_summary IS NOT NULL
)
SELECT
  prefix_type,
  substring(law_summary, 1, 50) as summary_sample,
  preview
FROM prefix_samples
WHERE rn = 1
ORDER BY prefix_type;

-- ============================================================================
-- 5. Check for any failures (preview still has prefix)
-- ============================================================================
SELECT
  'Potential migration failures' as check_name,
  COUNT(*) as count
FROM perpetuity_analysis pa
JOIN laws l ON pa.law_id = l.id
WHERE l.law_summary IS NOT NULL
  AND l.law_summary ~* '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)'
  AND pa.preview ~* '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)';

-- ============================================================================
-- 6. Check for truncation (laws longer than 100 chars)
-- ============================================================================
SELECT
  l.id,
  LENGTH(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i')) as stripped_length,
  LENGTH(pa.preview) as preview_length,
  CASE
    WHEN LENGTH(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i')) > 100
      THEN 'Should have ellipsis'
    ELSE 'Should be full text'
  END as expected,
  CASE
    WHEN pa.preview LIKE '%...' THEN 'Has ellipsis'
    ELSE 'No ellipsis'
  END as actual,
  pa.preview
FROM perpetuity_analysis pa
JOIN laws l ON pa.law_id = l.id
WHERE l.law_summary IS NOT NULL
  AND (
    LENGTH(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i')) > 95
  )
ORDER BY stripped_length DESC
LIMIT 10;
