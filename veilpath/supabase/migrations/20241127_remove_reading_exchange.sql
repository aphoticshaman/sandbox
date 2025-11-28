-- ═══════════════════════════════════════════════════════════════════════════════
-- Remove Reading Exchange System & Rename Ryan's Corner to Dev Corner
-- User decided: "kill it with fire. we do the readings. not organize them for others."
-- Also: "delete any and all references to ryan and call it 'dev corner'"
-- ═══════════════════════════════════════════════════════════════════════════════

-- Remove reading exchange channel from VIP lounge
DELETE FROM forum_channels WHERE id = 'reading_exchange';

-- Remove reading exchange perk
DELETE FROM vip_perks WHERE name = 'Reading Exchange';

-- Rename Ryan's Corner to Dev Corner
UPDATE forum_channels
SET id = 'dev_corner',
    name = 'Dev Corner',
    description = 'Direct access to the developer - Q&A, feedback, sneak peeks'
WHERE id = 'ryans_corner';

-- Remove Ryan's Corner perk and replace with Dev Corner
DELETE FROM vip_perks WHERE name = 'Ryan''s Corner Access';
INSERT INTO vip_perks (name, description, icon, perk_type, min_subscription_months, shard_value, cosmetic_ids)
VALUES ('Dev Corner Access', 'Direct line to the developer - your voice matters', '👨‍💻', 'exclusive_feature', 0, 0, '[]')
ON CONFLICT DO NOTHING;

-- Drop RLS policies first
DROP POLICY IF EXISTS "Reading requests visible to subscribers" ON reading_requests;
DROP POLICY IF EXISTS "Subscribers can create reading requests" ON reading_requests;
DROP POLICY IF EXISTS "Users can update own requests or claimed readings" ON reading_requests;

-- Drop indexes
DROP INDEX IF EXISTS idx_reading_requests_status;
DROP INDEX IF EXISTS idx_reading_requests_reader;

-- Drop the table
DROP TABLE IF EXISTS reading_requests;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Reading Exchange system removed!';
  RAISE NOTICE 'Ryan''s Corner renamed to Dev Corner';
  RAISE NOTICE 'VIP Lounge now has 3 channels: Welcome, Dev Corner, Monthly Rewards';
END $$;
