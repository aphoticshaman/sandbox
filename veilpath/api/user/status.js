/**
 * GET /api/user/status
 * Get user tier and usage limits
 */

import { authenticateRequest, checkUsageLimits } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error, code: auth.error });
    }

    const usage = await checkUsageLimits(auth.user.id, auth.user.tier);

    res.status(200).json({
      user: auth.user,
      usage
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      code: 'STATUS_ERROR'
    });
  }
}
