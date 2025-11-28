# Lunatiq Backend

Proxy server for Claude API with JWT authentication, rate limiting, and RevenueCat subscription management.

## Quick Start

### Option 1: Railway (Recommended - $5-20/mo)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Deploy from GitHub:**
   ```bash
   # Push this backend to your repo first
   cd backend
   git add .
   git commit -m "Add backend server"
   git push
   ```

3. **In Railway Dashboard:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo, set root directory to `/backend`
   - Add PostgreSQL: Click "New" → "Database" → "PostgreSQL"
   - Railway auto-sets `DATABASE_URL`

4. **Set Environment Variables** in Railway:
   ```
   JWT_SECRET=<generate-32-char-secret>
   ANTHROPIC_API_KEY=sk-ant-api03-...
   REVENUECAT_WEBHOOK_SECRET=<from-revenuecat-dashboard>
   ```

5. **Initialize Database:**
   - Go to PostgreSQL service → "Data" tab → "Query"
   - Paste contents of `db/schema.sql` and run

6. **Get your URL:** Railway gives you `https://your-app.up.railway.app`

### Option 2: Docker (Local/Laptop)

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **For external access** (if running on laptop):
   - Set up port forwarding on router (port 3000)
   - Use DuckDNS or similar for dynamic DNS
   - Consider Cloudflare Tunnel for easier setup

## API Endpoints

### Public
- `GET /health` - Health check
- `POST /auth/register` - Register device, get JWT
- `POST /webhooks/revenuecat` - Subscription webhooks

### Protected (require JWT)
- `GET /user/status` - Get user tier and usage
- `POST /api/interpret` - Card interpretation (FREE: 2/day)
- `POST /api/synthesize` - Reading synthesis (PREMIUM only)
- `POST /api/oracle` - Oracle chat (PREMIUM only)
- `POST /api/insights` - AI insights with Sonnet (PREMIUM only)
- `POST /api/analyze-intention` - Intention analysis

## Authentication Flow

1. App sends device ID to `/auth/register`
2. Server returns JWT token
3. App includes token in all requests: `Authorization: Bearer <token>`
4. Token valid for 30 days

## Rate Limits

| Tier    | Requests/min | Daily Readings | Oracle Messages |
|---------|-------------|----------------|-----------------|
| Free    | 10          | 2              | 5               |
| Premium | 100         | 100            | 500             |

## RevenueCat Setup

1. In RevenueCat Dashboard → Project Settings → Webhooks
2. Add webhook URL: `https://your-domain/webhooks/revenuecat`
3. Copy webhook secret to `REVENUECAT_WEBHOOK_SECRET`
4. Enable events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION

## Cost Estimation (Railway)

- **Base:** $5/mo (Hobby plan)
- **PostgreSQL:** ~$5/mo for small DB
- **Compute:** Usage-based, ~$0.000463/min
- **Typical total:** $10-20/mo for <1000 users

## Updating the App

Update `src/services/cloudAPIService.js` to point to your backend:

```javascript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://your-app.up.railway.app';
```

## Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
