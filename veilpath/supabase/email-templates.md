# VeilPath Email Templates for Supabase

Configure these in **Supabase Dashboard → Authentication → Email Templates**

## SMTP Settings (Supabase Dashboard → Project Settings → Auth → SMTP Settings)

Set these values:
- **Sender email:** `no-reply@veilpath.app`
- **Sender name:** `VeilPath`

---

## 1. Confirm Signup

**Subject:** `Welcome to VeilPath - Verify Your Email`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VeilPath</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0514; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0514;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%); border-radius: 16px; border: 1px solid #4a148c;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <!-- Logo/Header -->
              <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: 3px;">
                VEILPATH
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #e1bee7; letter-spacing: 2px;">
                LIFT THE VEIL ON YOUR INNER JOURNEY
              </p>

              <!-- Welcome Message -->
              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                Welcome, Seeker
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #b39ddb; line-height: 1.6;">
                You're one step away from beginning your cosmic journey. Your path to self-discovery and mindful reflection awaits.
              </p>

              <!-- CTA Button -->
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 8px 0 24px 0;">
                VERIFY YOUR EMAIL
              </a>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9575cd;">
                This link expires in 24 hours.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0;">

              <!-- Features Preview -->
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #e1bee7;">
                What awaits you:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 24px;">🎴</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b39ddb;">Daily Tarot</p>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 24px;">📓</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b39ddb;">Reflection Journal</p>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 24px;">🧘</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b39ddb;">Mindfulness</p>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 24px;">🔮</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b39ddb;">AI Oracle</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #7e57c2;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #5e35b1;">
                © 2025 VeilPath. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link (Passwordless Login)

**Subject:** `Your VeilPath Sign-In Link`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0514; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0514;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%); border-radius: 16px; border: 1px solid #4a148c;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: 3px;">
                VEILPATH
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #e1bee7; letter-spacing: 2px;">
                SECURE SIGN-IN
              </p>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                Welcome Back, Seeker
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #b39ddb; line-height: 1.6;">
                Click below to securely sign in to your VeilPath account. No password needed.
              </p>

              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 8px 0 24px 0;">
                SIGN IN TO VEILPATH
              </a>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9575cd;">
                This link expires in 1 hour for your security.
              </p>

              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #7e57c2;">
                If you didn't request this link, you can safely ignore this email.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #5e35b1;">
                © 2025 VeilPath. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password

**Subject:** `Reset Your VeilPath Password`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0514; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0514;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%); border-radius: 16px; border: 1px solid #4a148c;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: 3px;">
                VEILPATH
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #e1bee7; letter-spacing: 2px;">
                PASSWORD RESET
              </p>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #b39ddb; line-height: 1.6;">
                We received a request to reset your password. Click below to create a new one.
              </p>

              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 8px 0 24px 0;">
                RESET PASSWORD
              </a>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9575cd;">
                This link expires in 1 hour for your security.
              </p>

              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #7e57c2;">
                If you didn't request a password reset, please secure your account immediately.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #5e35b1;">
                © 2025 VeilPath. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** `Confirm Your New VeilPath Email`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0514; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0514;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%); border-radius: 16px; border: 1px solid #4a148c;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: 3px;">
                VEILPATH
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #e1bee7; letter-spacing: 2px;">
                EMAIL UPDATE
              </p>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                Confirm Your New Email
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #b39ddb; line-height: 1.6;">
                You requested to change your email address. Click below to confirm this change.
              </p>

              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 8px 0 24px 0;">
                CONFIRM NEW EMAIL
              </a>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9575cd;">
                This link expires in 24 hours.
              </p>

              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #7e57c2;">
                If you didn't request this change, please secure your account immediately.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #5e35b1;">
                © 2025 VeilPath. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Invite User (if using team features)

**Subject:** `You've Been Invited to VeilPath`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0514; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0514;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%); border-radius: 16px; border: 1px solid #4a148c;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: 3px;">
                VEILPATH
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #e1bee7; letter-spacing: 2px;">
                YOU'RE INVITED
              </p>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                Begin Your Journey
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #b39ddb; line-height: 1.6;">
                You've been invited to join VeilPath - a cosmic journey of self-discovery through tarot, journaling, and mindfulness.
              </p>

              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #1a0a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin: 8px 0 24px 0;">
                ACCEPT INVITATION
              </a>

              <hr style="border: none; border-top: 1px solid #4a148c; margin: 30px 0 20px 0;">
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #5e35b1;">
                © 2025 VeilPath. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Setup Instructions

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template type, copy the **Subject** line and **HTML** content
3. Go to **Project Settings** → **Auth** → **SMTP Settings**
4. Enable custom SMTP and configure with your email provider (Resend, SendGrid, etc.)
5. Set sender email to `no-reply@veilpath.app`
6. Set sender name to `VeilPath`

### Recommended: Use Resend for SMTP

Resend.com offers free tier with 3,000 emails/month:
1. Sign up at resend.com
2. Verify your domain (veilpath.app)
3. Get SMTP credentials
4. Add to Supabase SMTP settings
