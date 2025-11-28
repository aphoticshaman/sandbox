/**
 * POST /api/auth/register
 * Register device and get JWT token
 */

import { generateToken, getOrCreateUser } from '../../lib/auth';
import { checkBotId } from 'botid/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Bot detection - prevent automated account creation
    const botCheck = await checkBotId({
      advancedOptions: {
        headers: req.headers, // Required for Pages-style API routes
      },
    });

    if (botCheck.isBot && !botCheck.isVerifiedBot) {
      console.warn('[Auth] Bot registration blocked');
      return res.status(403).json({
        error: 'Registration blocked',
        code: 'BOT_DETECTED',
      });
    }

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        error: 'Device ID required',
        code: 'MISSING_DEVICE_ID'
      });
    }

    const userId = await getOrCreateUser(deviceId);
    const token = generateToken(userId);

    res.status(200).json({
      token,
      userId,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
}
