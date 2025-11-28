# 🔐 AUTH PLAN (SIMPLE - PRE-REVENUE)

## ✅ LAUNCH AUTH (NOW)

**Required:**
- ✅ Email + Password (already built in AuthScreen.js)
- ✅ Email verification (enforce before first use)
- ✅ Password reset via email

**Optional:**
- ✅ Email-based 2FA (opt-in, settings toggle)
- ❌ TOTP/Authenticator (wait for revenue)

---

## 🚀 IMPLEMENTATION (15 MIN)

### Step 1: Enable Email Verification in Supabase
```
1. Go to: https://app.supabase.com/project/_/auth/settings
2. Find "Email Confirmations"
3. Toggle ON: "Enable email confirmations"
4. Save
```

### Step 2: Update AuthScreen (Already Done ✅)
Your AuthScreen.js already handles:
- Sign up
- Sign in
- Email verification message
- Password reset

**No code changes needed.**

### Step 3: Email 2FA (Optional, In Settings)
```javascript
// src/screens/SettingsScreen.js
const enable2FA = async () => {
  const { error } = await supabase.auth.mfa.enroll({
    factorType: 'email',
  });

  if (error) {
    Alert.alert('Error', error.message);
  } else {
    Alert.alert('2FA Enabled', 'You will now receive a code via email when signing in.');
  }
};

// Add toggle in settings UI
<Switch
  value={has2FA}
  onValueChange={enable2FA}
  label="Enable Email 2FA (optional)"
/>
```

---

## 🔒 SECURITY CHECKLIST

- ✅ Passwords hashed with bcrypt (Supabase does this)
- ✅ Email verification required
- ✅ Password reset via email
- ✅ HTTPS/TLS only (Supabase enforces)
- ✅ RLS prevents data leaks
- ⚠️ Email 2FA optional (good enough for now)
- ❌ TOTP (wait for revenue)
- ❌ SMS 2FA (too expensive, never)

---

## 💰 COST

**Current plan:**
- Supabase Free Tier: $0/mo
- Email auth: FREE (1000 emails/day included)
- Email 2FA: FREE (included in Supabase)

**At scale (10K users):**
- Supabase Pro: $25/mo
- Email auth: FREE (100K MAU included)
- Email 2FA: FREE (included)

**TOTAL: $25/mo** even at 10K users 🎉

---

## 📋 DEPLOYMENT STEPS

### 1. Run Supabase Schema
```bash
# Open Supabase SQL Editor
# Paste supabase/schema.sql
# Click "Run"
```

### 2. Enable Email Verification
```
Supabase Dashboard → Auth → Settings
Enable "Email Confirmations"
```

### 3. Add Env Vars to Vercel
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key-here
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 4. Test Auth Flow
```bash
1. Sign up with real email
2. Check email for verification link
3. Click link to verify
4. Sign in with email + password
5. Do a reading
6. Check Supabase dashboard - user should be in profiles table
```

### 5. Deploy
```bash
git push origin dev
# Test on Vercel preview
# If good, merge to main
```

---

## 🎯 POST-REVENUE AUTH UPGRADES

**When you hit $5K MRR, add:**
- TOTP/Authenticator app 2FA (more secure)
- Passkey support (WebAuthn)
- Social login (Google, Apple)
- SMS 2FA for premium users (optional)

**But for now?** Email + password + optional email 2FA is PLENTY.

---

## ⚠️ MUST DO BEFORE LAUNCH

- [ ] Run supabase/schema.sql
- [ ] Enable email verification in Supabase
- [ ] Test sign up → verify email → sign in flow
- [ ] Add "Verify your email" banner if not verified
- [ ] Test password reset flow
- [ ] Block app access until email verified

**That's it. Simple. Ship it.**
