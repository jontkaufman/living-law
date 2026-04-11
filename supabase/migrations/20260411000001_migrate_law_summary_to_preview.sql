-- Migration: Populate preview field with transformed law_summary data
-- Description: Apply getShortTitle transformation logic to create concise previews
-- Date: 2026-04-11

-- Transform law_summary to preview by:
-- 1. Stripping common prefixes (The law that, Law that, Command to, etc.)
-- 2. Capitalizing first letter
-- 3. Truncating to 100 characters with ellipsis

UPDATE perpetuity_analysis pa
SET preview = CASE
  WHEN l.law_summary IS NOT NULL THEN
    CASE
      WHEN LENGTH(
        regexp_replace(
          regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'),
          '^(.)',
          upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'), 1, 1)),
          ''
        )
      ) > 100 THEN
        substring(
          regexp_replace(
            regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'),
            '^(.)',
            upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'), 1, 1)),
            ''
          ),
          1,
          100
        ) || '...'
      ELSE
        regexp_replace(
          regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'),
          '^(.)',
          upper(substring(regexp_replace(l.law_summary, '^(The law that|Law that|Command to|Requirement to|Prohibition against|You shall|You must)\s+', '', 'i'), 1, 1)),
          ''
        )
    END
  ELSE NULL
END
FROM laws l
WHERE pa.law_id = l.id
  AND l.law_summary IS NOT NULL;

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
