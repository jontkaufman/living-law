-- Add preview column to perpetuity_analysis table
-- This separates short preview text (for list views) from detailed summary (for detail panels)

ALTER TABLE perpetuity_analysis
ADD COLUMN preview TEXT;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'perpetuity_analysis'
  AND column_name = 'preview';
