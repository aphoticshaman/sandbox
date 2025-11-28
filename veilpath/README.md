# VeilPath - Your Journey to Mental Wellness

> **Evidence-based mental wellness through reflective journaling, therapeutic techniques, and archetypal wisdom**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](package.json)
[![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)]()

---

## 🎯 Vision & Mission

**VeilPath is a premium mental wellness app that bridges evidence-based therapy with reflective practices.** We combine CBT, DBT, and Mindfulness techniques with archetypal reflection (tarot) to create a uniquely powerful tool for self-discovery and therapeutic growth.

**Target Market**: Adults 25-45, college-educated, $50k-$150k+ income, actively engaged in therapy or wellness practices.

**Positioning**: *"The journaling app your therapist would recommend"* - professional, evidence-based, therapeutic.

---

## 📊 Market Strategy

### Target Segments (Prioritized by LTV)

| Segment | Monthly Spend | LTV/Year | CAC Target | Focus % |
|---------|--------------|----------|------------|---------|
| **Therapy Augmenters** 💰 | $15-30 | $240-360 | $50-100 | 40% |
| **Wellness Seekers** 🧘 | $10-20 | $120-240 | $20-40 | 30% |
| **Spiritual Explorers** 🔮 | $8-15 | $50-180 | $15-25 | 20% |
| **Self-Optimizers** 📈 | $12-25 | $150-300 | $30-50 | 10% |

### Why VeilPath? (vs. LunatIQ)

✅ Professional enough for therapy market (highest LTV)\
✅ Spiritual enough for wellness market\
✅ Clear value proposition ("path" to better mental health)\
✅ Gender-neutral (broader appeal)\
✅ Domain available (veilpath.app)\
✅ SEO-friendly ("mind" + wellness terms)\
✅ Ages well (won't feel dated)\
✅ Premium feel (justifies $15-30/month)

---

## ✨ Feature Set

### Core Features (100% Complete)

| Feature | Status | Target Segment |
|---------|--------|----------------|
| **Tarot Reading System** | ✅ Complete | All segments |
| 78-card deck, Single/3-Card/Celtic Cross spreads | ✅ | Spiritual Explorers primary |
| AI interpretations (Claude) | ✅ | Wellness + Therapy Augmenters |
| Reading history & favorites | ✅ | All |
| **Therapeutic Journaling** | ✅ Complete | All segments |
| Mood tracking (before/after) | ✅ | Wellness + Therapy |
| 625+ therapeutic prompts | ✅ | Therapy Augmenters primary |
| CBT distortion identification | ✅ | Therapy Augmenters |
| DBT skills tagging | ✅ | Therapy Augmenters |
| Privacy controls | ✅ | All |
| **Mindfulness & Meditation** | ✅ Complete | Wellness Seekers primary |
| 28 guided practices | ✅ | Wellness Seekers |
| Breathing exercises | ✅ | All |
| Session tracking | ✅ | Self-Optimizers |
| **CBT Tools** | ✅ Complete | Therapy Augmenters primary |
| 18 cognitive distortions | ✅ | Therapy Augmenters |
| Thought Records (6-step) | ✅ | Therapy Augmenters |
| **DBT Tools** | ✅ Complete | Therapy Augmenters primary |
| Crisis tools (TIPP, ACCEPTS) | ✅ | Therapy Augmenters |
| Wise Mind teaching | ✅ | Therapy Augmenters |
| **Gamification** | ✅ Complete | All segments |
| XP & leveling (50 levels) | ✅ | Self-Optimizers primary |
| 30+ achievements | ✅ | All |
| Skill trees (CBT, DBT, Mindfulness) | ✅ | Therapy + Wellness |
| **Analytics & Insights** | ✅ Complete | Self-Optimizers primary |
| Statistics dashboard | ✅ | Self-Optimizers |
| Mood trends | ✅ | Wellness + Therapy |
| Progress tracking | ✅ | All |
| **Data Management** | ✅ Complete | Privacy-conscious users |
| Privacy-first (local storage) | ✅ | All |
| Data export (JSON + Markdown) | ✅ | Self-Optimizers |

### Roadmap (Post-Launch)

**Q1 2026 - Retention & Engagement**
- [ ] Push notifications (daily reminders)
- [ ] Habit tracking integration
- [ ] Weekly summary emails
- [ ] Custom reminder times

**Q2 2026 - Therapy Integration**
- [ ] Therapist sharing (PDF export)
- [ ] Homework templates
- [ ] Progress reports
- [ ] Session prep mode

**Q3 2026 - Social & Community**
- [ ] Anonymous community (optional)
- [ ] Shared prompts
- [ ] Group challenges
- [ ] Privacy-first design

**Q4 2026 - Premium Features**
- [ ] Advanced analytics
- [ ] Custom tarot decks
- [ ] Voice journaling
- [ ] AI therapy assistant

---

## 💰 Monetization

### Pricing: Freemium → Premium

**Free Tier** (Acquisition)
- 3 readings/week
- 10 journal entries/month
- 5 mindfulness sessions/month
- Basic statistics

**Premium Tier** ($14.99/month or $99/year)
- ✅ Unlimited everything
- ✅ Full CBT/DBT tools
- ✅ Complete skill trees
- ✅ Data export
- ✅ AI interpretations

**Lifetime** ($299)
- Everything forever
- Future features included

### Revenue Projections (Year 1)

| Metric | Conservative | Moderate | Optimistic |
|--------|-------------|----------|------------|
| Total Users | 10,000 | 25,000 | 50,000 |
| Premium Conv. | 5% | 10% | 15% |
| **Annual Revenue** | **$60k** | **$350k** | **$1.2M** |

---

## 🛠️ Tech Stack

### Core Framework
- **React Native (Expo)** - Cross-platform iOS/Android/Web
- **Zustand** - State management
- **AsyncStorage** - Local-first storage
- **Anthropic Claude** - AI interpretations

### Analytics & Monitoring

#### Firebase (Primary) ⭐ **RECOMMENDED**
**Why Firebase?**
- ✅ FREE (up to 10GB/month)
- ✅ Analytics + Crashlytics + Performance in one
- ✅ Easy React Native integration
- ✅ Real-time dashboards

**Setup**:
```bash
expo install @react-native-firebase/app @react-native-firebase/analytics
```

**When to Add Mixpanel**: Only after $10k/month revenue if you need advanced cohort/funnel analysis. Firebase is sufficient for first 6-12 months.

### Web Hosting

#### Vercel (FREE) ⭐ **TOP PICK**
**For**: Marketing site (veilpath.app)

**Why Vercel?**
- ✅ FREE SSL & global CDN
- ✅ Perfect for Next.js/React
- ✅ Auto-deploy on git push
- ✅ Custom domain setup (5 minutes)

**Alternatives**: Netlify, Cloudflare Pages (also free)

---

## 🚀 Go-To-Market Strategy

### Phase 1: Soft Launch (Weeks 1-4)
**Goal**: 100 beta testers, validate pricing\
**Channels**: Friends, Reddit, Indie Hackers\
**Budget**: $0

### Phase 2: Public Launch (Weeks 5-8)
**Goal**: 1,000 downloads, 100 premium conversions\
**Channels**: Product Hunt, ASO, press\
**Budget**: $0 (organic)

### Phase 3: Paid Acquisition (Months 3-6)
**Goal**: 10,000 users, 1,000 premium\
**Channels** (by priority):
1. **Therapist Partnerships** (CAC: $0-50) - Highest LTV
2. **Reddit Ads** (CAC: $20-40) - r/CBT, r/DBT
3. **Instagram Influencers** (CAC: $15-30) - Micro-influencers
4. **Google Search** (CAC: $30-60) - "CBT journal app"

**Budget**: $2-5k/month\
**Target**: LTV:CAC > 3:1

### Phase 4: Scale (Months 7-12)
**Goal**: 50,000 users, $500k ARR\
**Channels**: SEO, YouTube, podcasts

---

## 🏆 Competitive Advantages

### vs. Stoic (Journaling)
✅ Deeper therapeutic tools (CBT + DBT)\
✅ Unique tarot angle\
✅ Better analytics

### vs. Sanvello (CBT/Mood)
✅ Better UX (not clinical/boring)\
✅ More engaging (gamification)\
✅ Unique reflection method

### vs. Labyrinthos (Tarot)
✅ Evidence-based approach\
✅ Therapy tools integrated\
✅ Broader market appeal

**Market Gap We Fill**: Tarot + Therapy (no one else does this)

---

## 📈 Success Metrics

### Key KPIs

| Metric | Target |
|--------|--------|
| Onboarding Completion | >70% |
| D1 Retention | >40% |
| DAU/MAU | >20% |
| Free → Paid Conversion | >10% |
| Monthly Churn | <5% |
| LTV | >$150 |
| LTV:CAC | >3:1 |
| NPS | >50 |
| App Store Rating | >4.5 |

---

## 🎯 Next Steps

### This Week
- [x] Complete VeilPath rebrand
- [x] Update documentation
- [ ] Run QA checklist
- [ ] Fix critical bugs

### Next 2 Weeks
- [ ] Design app icon & splash
- [ ] Create screenshots
- [ ] Privacy Policy & Terms
- [ ] Landing page (Vercel)
- [ ] Set up Firebase
- [ ] TestFlight submit

### Next Month
- [ ] Beta test (50-100 users)
- [ ] Push notifications
- [ ] Freemium paywall
- [ ] Stripe integration
- [ ] App Store submit

---

## 📚 Documentation

- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) - 12-sprint plan
- [App Store Submission](docs/APP_STORE_SUBMISSION_GUIDE.md) - Complete guide
- [QA Checklist](docs/QA_TESTING_CHECKLIST.md) - 300+ test cases
- [Performance Guide](docs/PERFORMANCE_OPTIMIZATION_GUIDE.md) - Optimization tips
- [Living TODO](docs/LIVING_TODO.md) - Current status

---

## 🙏 Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Anthropic Claude](https://www.anthropic.com/)
- [React Navigation](https://reactnavigation.org/)

---

## 📞 Contact

- **Website**: https://veilpath.app
- **Support**: support@veilpath.app
- **Twitter**: @veilpathapp
- **Instagram**: @veilpathapp

---

## 📄 License

UNLICENSED - Proprietary © 2025 VeilPath, Inc.

---

**Made with ❤️ for mental wellness**
# Force Vercel rebuild
# Force production redeploy Sun Nov 23 10:37:07 UTC 2025
# Trigger deploy with correct branch tracking Sun Nov 23 10:47:07 UTC 2025
