/**
 * DAILY ROTATION CRON
 * Runs at 12:00 UTC daily via Vercel Cron
 *
 * Handles:
 * - Shop item rotation
 * - Daily quest refresh
 * - Event triggers
 * - Scheduled cosmetic releases
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  // Vercel Cron: runs at 12:00 UTC daily
  // Add to vercel.json: { "crons": [{ "path": "/api/cron/daily-rotation", "schedule": "0 12 * * *" }] }
};

interface ShopItem {
  id: string;
  cosmetic_id: string;
  price_coins: number;
  featured: boolean;
}

interface Cosmetic {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  base_price: number;
}

interface Quest {
  id: string;
  title: string;
  quest_type: string;
}

interface Event {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  config: Record<string, unknown>;
}

// Rarity weights for shop rotation
const RARITY_WEIGHTS = {
  common: 40,
  uncommon: 30,
  rare: 20,
  epic: 8,
  legendary: 2,
};

// Price multipliers by rarity
const PRICE_MULTIPLIERS = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  epic: 4,
  legendary: 8,
};

export default async function handler(request: Request) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development
    if (process.env.NODE_ENV === 'production') {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    shopRotation: { success: false, itemsRotated: 0 },
    questRefresh: { success: false, usersUpdated: 0 },
    eventCheck: { success: false, eventsTriggered: [] as string[] },
    cosmeticRelease: { success: false, cosmeticsReleased: 0 },
  };

  try {
    // 1. Rotate shop items
    results.shopRotation = await rotateShopItems(supabase);

    // 2. Refresh daily quests for all users
    results.questRefresh = await refreshDailyQuests(supabase);

    // 3. Check for event triggers
    results.eventCheck = await checkEventTriggers(supabase);

    // 4. Release scheduled cosmetics
    results.cosmeticRelease = await releaseScheduledCosmetics(supabase);

    // Log success
    console.log('[DailyRotation] Completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[DailyRotation] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        partialResults: results,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Rotate shop items - select new featured items
 */
async function rotateShopItems(supabase: SupabaseClient) {
  // 1. Clear yesterday's featured items
  await supabase
    .from('shop_items')
    .update({ featured: false })
    .eq('featured', true);

  // 2. Get available cosmetics for rotation
  const { data: cosmetics, error: cosmeticError } = await supabase
    .from('cosmetics')
    .select('id, name, rarity, base_price')
    .eq('unlock_method', 'purchase')
    .lte('release_date', new Date().toISOString().split('T')[0]);

  if (cosmeticError || !cosmetics) {
    throw new Error(`Failed to fetch cosmetics: ${cosmeticError?.message}`);
  }

  // 3. Select 6 items using weighted random selection
  const selected = weightedRandomSelect(cosmetics as Cosmetic[], 6, RARITY_WEIGHTS);

  // 4. Upsert shop items
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const cosmetic of selected) {
    const price = Math.round(cosmetic.base_price * (PRICE_MULTIPLIERS[cosmetic.rarity] || 1));

    await supabase.from('shop_items').upsert(
      {
        cosmetic_id: cosmetic.id,
        price_coins: price,
        featured: true,
        available_from: new Date().toISOString(),
        available_until: tomorrow.toISOString(),
        rotation_pool: 'standard',
      },
      { onConflict: 'cosmetic_id' }
    );
  }

  return { success: true, itemsRotated: selected.length };
}

/**
 * Refresh daily quests for all users
 */
async function refreshDailyQuests(supabase: SupabaseClient) {
  // 1. Get all active users (logged in within last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .gte('last_active', weekAgo.toISOString());

  if (userError) {
    throw new Error(`Failed to fetch users: ${userError.message}`);
  }

  if (!users || users.length === 0) {
    return { success: true, usersUpdated: 0 };
  }

  // 2. Get daily quest pool
  const { data: questPool, error: questError } = await supabase
    .from('quests')
    .select('*')
    .eq('quest_type', 'daily')
    .eq('active', true);

  if (questError || !questPool || questPool.length === 0) {
    console.warn('[DailyRotation] No daily quests in pool');
    return { success: true, usersUpdated: 0 };
  }

  // 3. Assign 3 random quests per user
  const today = new Date().toISOString().split('T')[0];
  let usersUpdated = 0;

  for (const user of users) {
    const assigned = randomSelect(questPool as Quest[], 3);

    for (const quest of assigned) {
      await supabase.from('daily_quest_assignments').upsert(
        {
          user_id: user.id,
          quest_id: quest.id,
          assigned_date: today,
          completed: false,
          progress: {},
        },
        { onConflict: 'user_id,quest_id,assigned_date', ignoreDuplicates: true }
      );
    }

    usersUpdated++;
  }

  return { success: true, usersUpdated };
}

/**
 * Check for events that should start or end today
 */
async function checkEventTriggers(supabase: SupabaseClient) {
  const today = new Date().toISOString();
  const eventsTriggered: string[] = [];

  // 1. Find events starting today
  const { data: startingEvents } = await supabase
    .from('events')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .eq('active', false);

  if (startingEvents) {
    for (const event of startingEvents as Event[]) {
      // Activate event
      await supabase
        .from('events')
        .update({ active: true })
        .eq('id', event.id);

      // Enable event cosmetics in shop
      if (event.config.cosmetics) {
        for (const cosmeticId of event.config.cosmetics as string[]) {
          await supabase.from('shop_items').insert({
            cosmetic_id: cosmeticId,
            price_coins: 0, // Event items might be special priced
            featured: true,
            available_from: event.start_date,
            available_until: event.end_date,
            rotation_pool: 'event',
          });
        }
      }

      eventsTriggered.push(`started:${event.id}`);
      console.log(`[DailyRotation] Event started: ${event.name}`);
    }
  }

  // 2. Find events ending today
  const { data: endingEvents } = await supabase
    .from('events')
    .select('*')
    .lt('end_date', today)
    .eq('active', true);

  if (endingEvents) {
    for (const event of endingEvents as Event[]) {
      // Deactivate event
      await supabase
        .from('events')
        .update({ active: false })
        .eq('id', event.id);

      // Remove event items from shop
      await supabase
        .from('shop_items')
        .delete()
        .eq('rotation_pool', 'event');

      eventsTriggered.push(`ended:${event.id}`);
      console.log(`[DailyRotation] Event ended: ${event.name}`);
    }
  }

  return { success: true, eventsTriggered };
}

/**
 * Release cosmetics scheduled for today
 */
async function releaseScheduledCosmetics(supabase: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0];

  // Find approved assets scheduled for release today
  const { data: toRelease, error } = await supabase
    .from('asset_queue')
    .select('*')
    .eq('status', 'approved')
    .eq('scheduled_release', today);

  if (error || !toRelease) {
    return { success: true, cosmeticsReleased: 0 };
  }

  let released = 0;

  for (const asset of toRelease) {
    // Insert into cosmetics table
    await supabase.from('cosmetics').insert({
      id: `cosmetic_${asset.id}`,
      name: asset.name,
      type: asset.asset_type,
      rarity: asset.metadata?.rarity || 'common',
      asset_path: asset.generated_path,
      release_date: today,
      unlock_method: 'purchase',
      base_price: calculateBasePrice(asset.metadata?.rarity || 'common'),
      metadata: asset.metadata,
    });

    // Update asset queue status
    await supabase
      .from('asset_queue')
      .update({ status: 'released' })
      .eq('id', asset.id);

    released++;
    console.log(`[DailyRotation] Released cosmetic: ${asset.name}`);
  }

  return { success: true, cosmeticsReleased: released };
}

// Helper functions

function weightedRandomSelect<T extends { rarity: string }>(
  items: T[],
  count: number,
  weights: Record<string, number>
): T[] {
  const weighted: T[] = [];

  for (const item of items) {
    const weight = weights[item.rarity] || 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(item);
    }
  }

  const selected: T[] = [];
  const usedIndices = new Set<number>();

  while (selected.length < count && selected.length < items.length) {
    const index = Math.floor(Math.random() * weighted.length);
    const item = weighted[index];
    const originalIndex = items.indexOf(item);

    if (!usedIndices.has(originalIndex)) {
      usedIndices.add(originalIndex);
      selected.push(item);
    }
  }

  return selected;
}

function randomSelect<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function calculateBasePrice(rarity: string): number {
  const basePrices: Record<string, number> = {
    common: 100,
    uncommon: 250,
    rare: 500,
    epic: 1000,
    legendary: 2500,
  };
  return basePrices[rarity] || 100;
}
