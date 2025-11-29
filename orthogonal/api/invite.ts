/**
 * Party Invite API
 * Sends invite emails via Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  runtime: 'edge',
};

interface InviteRequest {
  to: string;
  inviterName: string;
  inviteCode: string;
  inviteLink: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: InviteRequest = await req.json();
    const { to, inviterName, inviteCode, inviteLink } = body;

    const { data, error } = await resend.emails.send({
      from: 'Orthogonal <play@orthogonal.game>',
      to: [to],
      subject: `${inviterName} invited you to play Orthogonal`,
      html: generateInviteEmail(inviterName, inviteCode, inviteLink),
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function generateInviteEmail(inviterName: string, inviteCode: string, inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">⬡</div>
              <div style="font-size: 14px; font-weight: 600; letter-spacing: 4px; color: rgba(255, 255, 255, 0.6);">ORTHOGONAL</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 500; color: white; text-align: center;">
                You've been invited to play
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: rgba(255, 255, 255, 0.7); text-align: center; line-height: 1.5;">
                <strong style="color: #667eea;">${escapeHtml(inviterName)}</strong> wants to solve puzzles with you in Orthogonal.
              </p>
            </td>
          </tr>

          <!-- Invite Code -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255, 255, 255, 0.4); margin-bottom: 8px;">Party Code</div>
                <div style="font-size: 32px; font-weight: 600; letter-spacing: 4px; color: white; font-family: monospace;">${escapeHtml(inviteCode)}</div>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(inviteLink)}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                      Join Party
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.3);">
                This invite expires in 5 minutes.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.3);">
                <a href="https://orthogonal.game" style="color: rgba(255, 255, 255, 0.5);">orthogonal.game</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
