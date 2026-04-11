-- Report: Laws Affected by "Do not" Prefix Fix
-- This query identifies all laws that will be affected by the migration fix

-- ============================================================================
-- Laws Starting with "Do not" - These are affected by the fix
-- ============================================================================

SELECT
  l.id,
  l.reference,
  l.law_summary as original_summary,
  -- Show what the preview SHOULD be after the fix
  CASE
    WHEN LENGTH(
      regexp_replace(
        regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'),
        '^(.)',
        upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'), 1, 1)),
        ''
      )
    ) > 100 THEN
      substring(
        regexp_replace(
          regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'),
          '^(.)',
          upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'), 1, 1)),
          ''
        ),
        1,
        100
      ) || '...'
    ELSE
      regexp_replace(
        regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'),
        '^(.)',
        upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must|Do not)\s+', '', 'i'), 1, 1)),
        ''
      )
  END as corrected_preview,
  -- Show current preview (before fix)
  pa.preview as current_preview_before_fix,
  -- Indicate if this is a new fix (current preview still has "Do not")
  CASE
    WHEN pa.preview LIKE 'Do not%' OR pa.preview IS NULL THEN 'WILL BE FIXED'
    ELSE 'Already correct (unusual)'
  END as fix_status
FROM laws l
LEFT JOIN perpetuity_analysis pa ON l.id = pa.law_id
WHERE l.law_summary LIKE 'Do not%'
ORDER BY l.id;

-- ============================================================================
-- Summary Statistics
-- ============================================================================

SELECT
  'Total laws starting with "Do not"' as metric,
  COUNT(*) as count
FROM laws
WHERE law_summary LIKE 'Do not%'

UNION ALL

SELECT
  'With existing preview entries',
  COUNT(*)
FROM laws l
JOIN perpetuity_analysis pa ON l.id = pa.law_id
WHERE l.law_summary LIKE 'Do not%'
  AND pa.preview IS NOT NULL

UNION ALL

SELECT
  'That still have "Do not" in preview (need fix)',
  COUNT(*)
FROM laws l
JOIN perpetuity_analysis pa ON l.id = pa.law_id
WHERE l.law_summary LIKE 'Do not%'
  AND pa.preview LIKE 'Do not%';

-- ============================================================================
-- Sample of Transformations
-- ============================================================================

-- Show first 10 examples of how summaries will be transformed
SELECT
  l.id,
  l.law_summary as before,
  regexp_replace(
    regexp_replace(l.law_summary, '^Do not\s+', '', 'i'),
    '^(.)',
    upper(substring(regexp_replace(l.law_summary, '^Do not\s+', '', 'i'), 1, 1)),
    ''
  ) as after
FROM laws l
WHERE l.law_summary LIKE 'Do not%'
ORDER BY l.id
LIMIT 10;
