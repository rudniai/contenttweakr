# Reddit Intel

**Reddit Marketing Intelligence** - Find genuine opportunities and generate human-like responses with AI.

---

## ✨ What It Does

Reddit Intel helps you market on Reddit the right way:

1. **🔍 Smart Opportunity Detection**
   - Scans 16 subreddits for relevant posts
   - Filters by keywords + question patterns
   - Scores relevance (0-100)
   - Shows post context, upvotes, comments

2. **🤖 Opus-Powered Response Generation**
   - Template-based smart responses (ready for Opus integration)
   - Natural Reddit tone (casual, lowercase, contractions)
   - NO em-dashes (AI tell)
   - Only mentions freesiteaudit.com when genuinely relevant
   - Platform-specific tone (r/SEO vs r/webdev)

3. **📊 Beautiful SaaS UI**
   - Modern dark theme (Linear/Vercel aesthetic)
   - Admin-only access (no public signup)
   - On-demand scanning
   - Copy-to-clipboard responses
   - Mobile responsive

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/rudniai/contenttweakr.git
   cd contenttweakr
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Login page (Opus-designed)
│   ├── dashboard/
│   │   ├── reddit-finder/
│   │   │   └── page.tsx                  # Main Reddit finder UI
│   │   └── page.tsx                      # Dashboard redirect
│   └── api/
│       └── reddit/
│           ├── opportunities/route.ts    # Scan Reddit API
│           └── generate-response/route.ts # AI response generator
├── lib/
│   └── supabase/                         # Supabase client utilities
└── components/ui/                        # Shared UI components
```

---

## 🎯 How To Use

### 1. Login
- Admin-only access
- No signup page
- Supabase auth

### 2. Find Opportunities
- Select time range (12h, 24h, 48h, 72h)
- Click "🔍 Find Opportunities"
- Scans 16 subreddits:
  - webdev, SEO, smallbusiness, Entrepreneur, SaaS
  - web_design, bigseo, marketing, startups
  - indiehackers, indiedev, coderforhire
  - webdevtutorials, reactjs, nextjs

### 3. Generate Responses
- Click on an opportunity
- Review AI-generated response
- Copy to clipboard
- Post manually on Reddit

---

## 🔧 Features In Detail

### Opportunity Detection

**Triggers:**
- Keywords: "website audit", "seo check", "site speed", "free tools", etc.
- Question patterns: "how do i check...", "what tool should i use...", etc.

**Scoring:**
- High-value keywords: +25 points each
- Question patterns: +20 points
- General keywords: +5 points each
- Minimum threshold: 20 points

### Response Generation

**Current:** Template-based with 9 categories:
- Site audit (mentions FreeSiteAudit)
- Page speed/performance
- Rankings/SEO
- Next.js
- React
- General SEO
- Freelancing
- Deployment/hosting
- CSS/styling

**Future:** Real Claude Opus integration via OpenClaw API

**Tone Rules:**
- Use "i", contractions, lowercase
- NO em-dashes (—)
- 2-4 sentences max
- Subreddit-specific flavor
- Genuinely helpful first

---

## 🎨 Design

### Colors
- Background: Slate-950 (dark)
- Accent: Blue-500/600
- Text: Slate-200 (primary), Slate-400 (secondary)

### Typography
- Font: Inter (Google Fonts)
- Headings: Semibold, tight tracking
- Body: Regular, relaxed leading

### Components
- Cards: White bg, subtle shadows, rounded corners
- Buttons: Blue gradient, hover states
- Inputs: Slate-900 bg, blue focus ring
- Badges: Colored pills for categories/scores

---

## 🔐 Security

- **Auth:** Supabase email/password
- **Admin-only:** No public signup
- **Row-level security:** Supabase RLS enabled
- **API protection:** Auth checks on all routes

---

## 📊 Monitored Subreddits

| Subreddit | Focus |
|---|---|
| r/webdev | Web development |
| r/SEO | Search engine optimization |
| r/smallbusiness | Small business owners |
| r/Entrepreneur | Startup founders |
| r/SaaS | SaaS builders |
| r/indiehackers | Indie makers |
| r/indiedev | Indie developers |
| r/reactjs | React developers |
| r/nextjs | Next.js developers |
| + 7 more | See source for full list |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Manual

```bash
npm run build
npm start
```

---

## 🔮 Future Enhancements

- [ ] Real Claude Opus API integration
- [ ] Save opportunities to database
- [ ] Track which posts you've replied to
- [ ] Sentiment analysis (skip toxic threads)
- [ ] Auto-detect if question already answered
- [ ] Hacker News support
- [ ] Product Hunt support
- [ ] Scheduled scanning (cron)
- [ ] Webhook notifications
- [ ] Analytics dashboard

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth/DB:** Supabase
- **Deployment:** Vercel
- **AI:** Claude Opus (via templates, ready for real integration)

---

## 📝 License

Private project for Harsh (@rudniai)

---

## 🙏 Credits

- **Design:** Claude Opus 4
- **Development:** Rudni AI
- **Human:** Harsh

---

Built with ❤️ for genuine Reddit marketing
