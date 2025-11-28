/**
 * POST /api/webhooks/revenuecat
 * Handle RevenueCat subscription events
 */

import crypto from 'crypto';
import { sql } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const signature = req.headers['x-revenuecat-signature'];
    if (process.env.REVENUECAT_WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSig) {
        console.warn('Invalid RevenueCat webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event.event?.type;
    const appUserId = event.event?.app_user_id;


    if (!appUserId) {
      return res.status(400).json({ error: 'Missing app_user_id' });
    }

    // Find user by device ID (Neon returns array directly)
    const userResult = await sql`
      SELECT id FROM users WHERE device_id = ${appUserId}
    `;

    if (userResult.length === 0) {
      console.warn(`User not found for device_id: ${appUserId}`);
      return res.status(200).json({ received: true, warning: 'User not found' });
    }

    const userId = userResult[0].id;

    // Handle event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        // Activate premium
        await sql`
          UPDATE subscriptions
          SET tier = 'premium',
              status = 'active',
              revenuecat_id = ${event.event?.transaction_id || null},
              expires_at = ${event.event?.expiration_at_ms ? new Date(event.event.expiration_at_ms) : null},
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        // Downgrade to free
        await sql`
          UPDATE subscriptions
          SET status = ${eventType === 'CANCELLATION' ? 'cancelled' : 'expired'},
              cancelled_at = NOW(),
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
        break;

      case 'BILLING_ISSUE':
        console.warn(`Billing issue for user ${userId}`);
        break;

      default:
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
