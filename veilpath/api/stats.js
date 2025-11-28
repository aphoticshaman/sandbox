/**
 * /api/stats - Public stats for social proof (no auth required)
 * Returns real-time user counts for landing page and activity contexts
 */

import { sql } from './lib/db';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Users active in last 15 minutes = "online"
    const onlineResult = await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_active > NOW() - INTERVAL '15 minutes'
    `;

    // Total users ever (for social proof)
    const totalResult = await sql`
      SELECT COUNT(*) as count FROM users
    `;

    // Users active today (for engagement metric)
    const todayResult = await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE DATE(last_active) = CURRENT_DATE
    `;

    // Users active in last 5 minutes (for "currently active" contexts like journaling)
    const recentResult = await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_active > NOW() - INTERVAL '5 minutes'
    `;

    const onlineCount = parseInt(onlineResult[0]?.count || 0);
    const totalUsers = parseInt(totalResult[0]?.count || 0);
    const activeToday = parseInt(todayResult[0]?.count || 0);
    const recentlyActive = parseInt(recentResult[0]?.count || 0);

    // Cache for 30 seconds (efficient, not spamming DB)
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    return res.status(200).json({
      online: onlineCount,
      total: totalUsers,
      activeToday: activeToday,
      recentlyActive: recentlyActive,  // For "others doing X right now" displays
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[/api/stats] Error:', error);

    // Return zeros on error, don't break the landing page
    return res.status(200).json({
      online: 0,
      total: 0,
      activeToday: 0,
      recentlyActive: 0,
      timestamp: new Date().toISOString(),
      error: true
    });
  }
}
