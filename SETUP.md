# ContentTweakr Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://wsgmbrznogebieiomoow.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_L2w6RNEFYXNykghrXnrj7w_NP_h6VsS
   OPENAI_API_KEY=your-actual-openai-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

## Supabase Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own usage
CREATE POLICY "Users can insert own usage"
  ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own usage
CREATE POLICY "Users can update own usage"
  ON usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
  ON usage_tracking(user_id, date);
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- ✅ Landing page with pricing
- ✅ Email/password authentication via Supabase
- ✅ Dashboard with content input
- ✅ Multi-platform content repurposing (Twitter, LinkedIn, Instagram, Email, Reddit)
- ✅ OpenAI-powered AI content generation
- ✅ Usage tracking (5 free repurposes/day)
- ✅ Copy-to-clipboard functionality

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Support

For issues or questions, open an issue on GitHub.
