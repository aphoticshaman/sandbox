# 🚀 VEILPATH PRODUCTION DEPLOYMENT

## ✅ COMPLETED
1. ✅ Real Claude API integration (src/services/anthropic.js)
2. ✅ Supabase auth + database (src/services/supabase.js)
3. ✅ Auth screens (AuthScreen + AuthGate)
4. ✅ Database schema with RLS (supabase/schema.sql)
5. ✅ Black card bug fixed
6. ✅ Button rendering fixed
7. ✅ Async bugs fixed

## 🔥 NEXT STEPS (IN ORDER)

### Step 1: Run Database Schema in Supabase
```bash
# Copy the contents of supabase/schema.sql
# Paste into Supabase SQL Editor
# Click "Run"
# You should see success message
```

### Step 2: Set Up Environment Variables
Create a `.env` file in the root with:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

Get these from:
- Supabase: https://app.supabase.com/project/_/settings/api
- Anthropic: https://console.anthropic.com/settings/keys

### Step 3: Pull Changes to Your Local
```bash
git fetch origin claude/verify-github-access-01GfTgGcZJJoCE1sxJTfqgF9
git checkout dev
git merge claude/verify-github-access-01GfTgGcZJJoCE1sxJTfqgF9
```

### Step 4: Test Locally
```bash
npm install  # Install @supabase/supabase-js
npm run web  # Test on web
```

### Step 5: Wire Auth into Navigation
Currently AuthScreen exists but isn't wired into the app navigator.
Need to update `src/navigation/AppNavigator.js`:
- Add AuthScreen before OnboardingScreen
- Wrap MainApp with AuthGate
- Check session on app launch

### Step 6: Deploy to Vercel
```bash
git push origin dev  # Push to your dev branch
# Vercel auto-deploys from dev branch
# Test on preview URL
```

### Step 7: Promote to Production
```bash
git checkout main
git merge dev
git push origin main
# Vercel auto-promotes to veilpath.app
```

## 🔐 SECURITY NOTES

**SUPABASE = SINGLE SOURCE OF TRUTH**
- All user data goes to Supabase (NOT Neon/Vercel DB)
- Passwords: bcrypt hashed + salted (automatic)
- Database: encrypted at rest (AES-256, automatic)
- API calls: HTTPS/TLS only (enforced)
- RLS: row-level security prevents data leaks

**WHAT'S STORED:**
- ✅ User profiles (email, level, XP, zodiac)
- ✅ Readings (cards, interpretations, timestamps)
- ✅ Journal entries (content, mood, tags)
- ✅ Action items (from card readings)
- ✅ Achievements (unlocked titles, badges)
- ✅ Statistics (card frequencies, streaks)

**WHAT'S NOT STORED:**
- ❌ Plain text passwords (NEVER)
- ❌ API keys (NEVER in database)
- ❌ Credit card data (use Stripe if needed)

## 📊 DATA FLOW

```
User Signs In
    ↓
Supabase Auth (JWT token)
    ↓
User does reading
    ↓
Claude API generates interpretation (pulls user history from Supabase)
    ↓
Reading saved to Supabase
    ↓
User journals about reading
    ↓
Journal saved to Supabase
    ↓
LLM references journals in next reading
```

## 🐛 KNOWN ISSUES TO FIX NEXT

1. **Auth not wired into navigation** - AuthScreen exists but app doesn't require login yet
2. **MBTI battery needs cleanup** - Remove offensive questions, add to database
3. **LLM needs expanded context** - Pull journals, MBTI, stats for better readings
4. **Edge Functions for API keys** - Move Anthropic calls server-side (security)

## 💰 REVENUE BLOCKERS

Before you can charge users:
1. ✅ Auth working (have it, not wired in)
2. ❌ Subscription logic (need Stripe or similar)
3. ❌ Paywall on readings (limit free readings per month)
4. ❌ Premium features (deeper analysis, longer history)
5. ❌ Email verification (prevent abuse)

## 📱 CURRENT STATUS

**What Works:**
- Landing page with VEILPATH branding
- Card rendering (with fallback for unmapped cards)
- Cosmic particles (performance optimized)
- Claude API integration (READY but needs auth + env vars)
- Database schema (READY to run in Supabase)

**What Doesn't Work Yet:**
- Can't sign in/up (AuthScreen not in navigation)
- Can't generate real readings (no Anthropic API key in env)
- Can't save readings (Supabase not configured)
- Infinite loading on HomeScreen (needs auth check)

## 🎯 PRIORITY

**DO THIS FIRST:**
1. Run supabase/schema.sql in Supabase SQL Editor
2. Add .env with keys
3. Wire AuthScreen into navigation
4. Test sign up → reading → journal flow
5. Deploy to dev

**THEN:**
1. Expand LLM context (journals, MBTI, stats)
2. Add subscription logic
3. Add premium features
4. Test on real users
5. Make money 💰
