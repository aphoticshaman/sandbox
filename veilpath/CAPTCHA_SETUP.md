# Cloudflare Turnstile CAPTCHA Setup Guide

This guide will walk you through setting up Cloudflare Turnstile CAPTCHA for VeilPath to protect against bot attacks.

---

## 🎯 What You'll Get

- **Bot protection** on login and signup
- **No image puzzles** - invisible CAPTCHA for good users  
- **Free tier** - 1 million requests/month
- **Privacy-first** - Cloudflare doesn't sell data

---

## Step 1: Get Cloudflare Turnstile Keys

### 1.1 Create Cloudflare Account (if you don't have one)
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with your email
3. Verify your email

### 1.2 Create a Turnstile Site
1. Log into Cloudflare: https://dash.cloudflare.com/
2. In the left sidebar, click **"Turnstile"**
3. Click **"Add Site"**
4. Fill out the form:
   - **Site name**: `VeilPath Production` (or whatever you want)
   - **Domain**: `veilpath.app` (or your domain)
     - You can also use `localhost` for testing
   - **Widget mode**: Select **"Managed"** (recommended)
     - This shows CAPTCHA only when needed, invisible for good users
   - Click **"Create"**

### 1.3 Get Your Keys
After creating the site, you'll see:

1. **Site Key** (starts with `0x...`)
   - This goes in your `.env` file as `EXPO_PUBLIC_TURNSTILE_SITE_KEY`
   - This is PUBLIC - safe to expose in your client app

2. **Secret Key** (longer string)
   - This goes in **Supabase Edge Function environment variables**
   - This is PRIVATE - NEVER commit to git or expose client-side

**Copy both keys** - you'll need them in the next steps.

---

## Step 2: Add Keys to Your Local `.env`

Edit `/veilpath/.env`:

```bash
# Cloudflare Turnstile CAPTCHA
EXPO_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxx  # Your SITE key from Cloudflare
```

Replace `0x4AAAAAAAxxxxxxxxx` with your actual site key.

---

## Step 3: Deploy Edge Function to Supabase

### 3.1 Open Supabase Dashboard
1. Go to https://app.supabase.com/projects
2. Click your **VeilPath** project
3. In left sidebar, click **"Edge Functions"**

### 3.2 Create the Edge Function
1. Click **"Create a new function"**
2. **Function name**: `verify-turnstile`
3. For the code, use this file: `/veilpath/supabase/functions/verify-turnstile/index.ts`

**Copy the entire contents** of that file into the Supabase editor.

### 3.3 Set Environment Variables
1. In the Edge Functions page, click **"Manage secrets"** (or settings icon)
2. Add this secret:
   - **Name**: `TURNSTILE_SECRET_KEY`
   - **Value**: Your SECRET key from Cloudflare (the long one you copied earlier)
3. Click **"Save"**

Also make sure these exist (they should already be there):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - From Settings → API → service_role key

### 3.4 Deploy the Function
1. Click **"Deploy"**
2. Wait for deployment to complete (should take ~30 seconds)
3. You'll see a green checkmark when it's live

---

## Step 4: Add Keys to Vercel (Production)

### 4.1 Go to Vercel Environment Variables
1. Go to https://vercel.com/aphoticshaman/veilpath/settings/environment-variables
2. Click **"Add Variable"**

### 4.2 Add the Site Key
- **Name**: `EXPO_PUBLIC_TURNSTILE_SITE_KEY`
- **Value**: Your site key from Cloudflare (`0x4AAA...`)
- **Environment**: Check **"Production"**, **"Preview"**, and **"Development"**
- Click **"Save"**

### 4.3 Redeploy
1. Go to **Deployments** tab
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## Step 5: Test It

### 5.1 Local Testing
1. Restart your dev server: `npm start`
2. Go to the login page
3. You should see a small Cloudflare checkbox appear
4. Try to login - it should validate via the Edge Function

**Check browser console** for logs:
- `[Auth] Validating CAPTCHA with Edge Function...`
- `[Auth] Sign in successful with CAPTCHA`

### 5.2 Production Testing
1. Go to https://veilpath.app
2. Try to sign up or login
3. CAPTCHA should appear
4. Should work smoothly for real users

---

## 🔒 Security Notes

### What This Protects Against:
✅ **Bot attacks** - Automated credential stuffing, brute force
✅ **Spam signups** - Mass fake account creation
✅ **API abuse** - Automated scripts hammering your auth endpoints

### What This Doesn't Protect Against:
❌ **DDoS attacks** - Use Cloudflare's DDoS protection for that
❌ **Social engineering** - Human attackers tricking users
❌ **SQL injection** - Already protected by Supabase's parameterized queries

---

## Troubleshooting

### "CAPTCHA verification failed" Error

**Check:**
1. Is the Edge Function deployed? (Supabase → Edge Functions → verify-turnstile should show "Active")
2. Is `TURNSTILE_SECRET_KEY` set in Supabase Edge Function secrets?
3. Is the secret key correct? (Copy it again from Cloudflare)
4. Check Edge Function logs (Supabase → Edge Functions → verify-turnstile → Logs)

### CAPTCHA Widget Doesn't Appear

**Check:**
1. Is `EXPO_PUBLIC_TURNSTILE_SITE_KEY` in your `.env` file?
2. Did you restart the dev server after adding the key?
3. Is the site key correct? (Should start with `0x4AAA...`)

### Domain Mismatch Error

**Fix:**
1. Go to Cloudflare → Turnstile → Your Site → Settings
2. Add your domain to the allowed list:
   - For local dev: `localhost`
   - For production: `veilpath.app`

---

**Last Updated**: 2025-11-24
**CAPTCHA is now REQUIRED** for security - no automatic fallback
