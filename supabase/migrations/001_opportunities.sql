-- ============================================
-- FSA ContentTweakr - Opportunities & Responses
-- ============================================

-- 1. Opportunities table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subreddit text not null,
  title text not null,
  url text not null,
  context text,
  confidence integer not null default 0,
  upvotes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now(),
  scanned_at timestamptz not null default now(),

  -- Prevent duplicate opportunities per user
  unique (user_id, url)
);

-- 2. Generated responses table
create table if not exists public.generated_responses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response_text text not null,
  created_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_opportunities_user_id on public.opportunities(user_id);
create index if not exists idx_opportunities_scanned_at on public.opportunities(scanned_at desc);
create index if not exists idx_generated_responses_opportunity_id on public.generated_responses(opportunity_id);
create index if not exists idx_generated_responses_user_id on public.generated_responses(user_id);

-- 4. Enable RLS
alter table public.opportunities enable row level security;
alter table public.generated_responses enable row level security;

-- 5. RLS Policies - users can only access their own data

-- Opportunities: SELECT
create policy "Users can view their own opportunities"
  on public.opportunities for select
  using (auth.uid() = user_id);

-- Opportunities: INSERT
create policy "Users can insert their own opportunities"
  on public.opportunities for insert
  with check (auth.uid() = user_id);

-- Opportunities: DELETE
create policy "Users can delete their own opportunities"
  on public.opportunities for delete
  using (auth.uid() = user_id);

-- Generated Responses: SELECT
create policy "Users can view their own responses"
  on public.generated_responses for select
  using (auth.uid() = user_id);

-- Generated Responses: INSERT
create policy "Users can insert their own responses"
  on public.generated_responses for insert
  with check (auth.uid() = user_id);

-- Generated Responses: DELETE
create policy "Users can delete their own responses"
  on public.generated_responses for delete
  using (auth.uid() = user_id);
