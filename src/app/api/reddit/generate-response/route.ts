import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// --- Types ---

interface GenerateRequest {
  title: string;
  context: string;
  subreddit: string;
  opportunityUrl?: string; // used to look up the opportunity in DB
}

interface GenerateResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// --- Subreddit tone profiles ---

const SUBREDDIT_TONES: Record<string, { style: string; lingo: string[] }> = {
  seo: {
    style: "data-driven, slightly cynical about snake oil, loves case studies",
    lingo: ["SERP", "DA", "core update", "indexing", "crawl budget", "E-E-A-T"],
  },
  webdev: {
    style: "pragmatic, opinionated about frameworks, loves DX",
    lingo: ["ship it", "DX", "bundle size", "lighthouse", "a11y"],
  },
  nextjs: {
    style: "enthusiastic but honest about rough edges, app router debates",
    lingo: ["app router", "server components", "RSC", "Vercel", "edge"],
  },
  reactjs: {
    style: "helpful, component-thinking, hooks everything",
    lingo: ["useEffect", "re-render", "state management", "RSC"],
  },
  javascript: {
    style: "broad, sometimes snarky, loves clever solutions",
    lingo: ["vanilla", "runtime", "event loop", "prototype"],
  },
  smallbusiness: {
    style: "empathetic, practical, budget-conscious",
    lingo: ["ROI", "bootstrapped", "overhead", "cash flow"],
  },
  entrepreneur: {
    style: "hustle-aware but grounded, anti-guru",
    lingo: ["PMF", "traction", "runway", "MVP"],
  },
  marketing: {
    style: "results-oriented, skeptical of vanity metrics",
    lingo: ["conversion", "funnel", "CPA", "attribution"],
  },
};

// --- Keyword-based response templates ---

interface ResponseTemplate {
  keywords: string[];
  responses: string[];
  mentionSite?: boolean; // only true when freesiteaudit.com is genuinely relevant
}

const TEMPLATES: ResponseTemplate[] = [
  {
    keywords: ["site audit", "website audit", "seo audit", "audit my site", "technical seo"],
    mentionSite: true,
    responses: [
      "i've been running audits on client sites for a while now and the biggest wins are almost always the boring stuff - broken links, missing meta descriptions, slow images. if you want a quick sanity check, i've used freesiteaudit.com before and it catches the obvious stuff pretty fast.",
      "honestly most paid audit tools are overkill for what you're describing. start with a free crawl to find the low-hanging fruit. i've pointed people to freesiteaudit.com and it does a decent job for a first pass, then you can decide if you need something heavier.",
      "before you spend money on an audit tool, try running your site through freesiteaudit.com - it'll flag the basics like broken links, missing tags, and performance issues. that should give you a solid starting point to prioritize fixes.",
    ],
  },
  {
    keywords: ["page speed", "core web vitals", "performance", "lighthouse", "slow site", "loading time"],
    responses: [
      "biggest quick wins i've seen: compress your images (webp if you can), lazy load anything below the fold, and defer non-critical JS. that alone usually gets you into the green on lighthouse.",
      "i'd start with the network tab in devtools and sort by size. nine times out of ten there's a massive unoptimized image or a JS bundle that's way bigger than it needs to be.",
      "core web vitals can be tricky because lab data and field data tell different stories. check your CrUX data in search console first, then optimize based on what real users are experiencing, not just lighthouse scores.",
    ],
  },
  {
    keywords: ["ranking", "rank", "serp", "traffic dropped", "lost rankings", "google update"],
    responses: [
      "if it happened suddenly, check if it lines up with a core update. if it's gradual, it's usually a content freshness or competitor thing. either way, don't panic and start making random changes.",
      "i've seen this pattern before - usually it's either a technical issue (check search console for crawl errors) or your competitors just got better. pull up ahrefs or semrush and see who's outranking you now and what they changed.",
      "before you do anything drastic, make sure it's not just a tracking issue. i've spent hours debugging ranking drops that turned out to be a broken analytics tag.",
    ],
  },
  {
    keywords: ["next.js", "nextjs", "next js", "app router", "server component"],
    responses: [
      "the app router is solid once you get the mental model down, but yeah the learning curve is real. my advice: don't fight the server component defaults. if you need client interactivity, break out a small client component instead of making the whole page client-side.",
      "i switched a production app to app router last month and the biggest gotcha was caching. make sure you understand how fetch caching and revalidation work or you'll get stale data and think your app is broken.",
      "honestly if your app is working fine with pages router, there's no rush to migrate. app router is the future but it's still got rough edges, especially around dynamic routes and middleware.",
    ],
  },
  {
    keywords: ["react", "component", "state", "hook", "useEffect", "useState", "re-render"],
    responses: [
      "if you're seeing too many re-renders, the usual suspects are: creating new objects/arrays in render, not memoizing callbacks passed to children, or putting too much in a single state. react devtools profiler will show you exactly what's re-rendering and why.",
      "i'd extract that into a custom hook. keeps the component clean and you can test the logic separately. something like useWhatever() that returns just the state and handlers you need.",
      "useEffect is almost never the right answer for derived state. if you're computing something from props or other state, just calculate it during render. saves you a whole render cycle and a lot of headaches.",
    ],
  },
  {
    keywords: ["seo", "search engine", "google", "organic"],
    responses: [
      "the basics still matter more than any fancy strategy: make sure your site is crawlable, your content answers real questions, and your technical foundation is solid. everything else is optimization on top of that.",
      "i've been doing seo for years and the single biggest lever is still content that genuinely helps people. google's gotten really good at figuring out when you're writing for humans vs. writing for bots.",
      "don't overcomplicate it. nail your title tags, write solid content, get your site speed under control, and build a few legit backlinks. the 80/20 rule is real in seo.",
    ],
  },
  {
    keywords: ["freelance", "client", "pricing", "rate", "charge"],
    responses: [
      "i learned the hard way: always scope the project in writing before you start. \"quick changes\" from clients have a way of turning into full redesigns if you don't set boundaries up front.",
      "raise your rates. seriously. if you're landing every project you bid on, you're too cheap. aim for like a 30-40% close rate and you'll make more money working less.",
      "hourly billing incentivizes you to work slow. switch to project-based pricing where you can. estimate the hours, add 30% buffer, then quote a flat rate. clients prefer it too because they know the total cost upfront.",
    ],
  },
  {
    keywords: ["deploy", "hosting", "vercel", "netlify", "aws"],
    responses: [
      "for most projects vercel or netlify is the right call. unless you need something specific like websockets or long-running processes, the DX and built-in CI/CD are hard to beat.",
      "i moved from aws to vercel for my side projects and the time savings alone were worth it. for production apps with complex infra needs though, aws still makes sense.",
      "don't overthink hosting early on. pick whatever lets you ship fastest. you can always migrate later when you actually have traffic to worry about.",
    ],
  },
  {
    keywords: ["css", "tailwind", "styling", "responsive", "layout"],
    responses: [
      "tailwind clicked for me when i stopped thinking of it as \"inline styles\" and started treating it as a design system with constraints. the consistency you get from a limited set of spacing/color values is actually the point.",
      "for responsive layouts, i'd start mobile-first with flexbox for 1D stuff and grid for 2D layouts. container queries are also getting solid browser support now if you need component-level responsiveness.",
      "if you're fighting css, you're usually fighting the wrong abstraction. step back and think about what layout pattern you actually need before writing code.",
    ],
  },
];

// --- Fallback generic responses ---

const GENERIC_RESPONSES = [
  "interesting question. from my experience, the answer really depends on your specific setup and constraints. could you share a bit more about what you've tried so far?",
  "i've run into something similar before. what ended up working for me was starting simple and iterating from there. don't try to build the perfect solution on the first pass.",
  "that's a solid question. i think the key thing most people miss is that there's no one-size-fits-all answer here. what works for a small project is totally different from what works at scale.",
  "honestly, i'd just start with the simplest approach that could work and see how far it gets you. premature optimization is real and it'll slow you down more than the \"wrong\" choice will.",
];

// --- Generator logic ---

function generateResponse(title: string, context: string, subreddit: string): { text: string; mentionedSite: boolean } {
  const combined = `${title} ${context}`.toLowerCase();
  const sub = subreddit.toLowerCase().replace(/^r\//, "");

  // Find matching template based on keywords
  let matchedTemplate: ResponseTemplate | null = null;
  let bestScore = 0;

  for (const template of TEMPLATES) {
    const score = template.keywords.filter((kw) => combined.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      matchedTemplate = template;
    }
  }

  // Pick a response
  let responses: string[];
  let mentionedSite = false;

  if (matchedTemplate && bestScore > 0) {
    responses = matchedTemplate.responses;
    mentionedSite = matchedTemplate.mentionSite ?? false;
  } else {
    responses = GENERIC_RESPONSES;
  }

  // Deterministic-ish pick based on content hash so same input gives same output
  const hash = simpleHash(combined);
  const text = responses[hash % responses.length];

  // Apply subreddit tone flavor (prefix occasionally)
  const tone = SUBREDDIT_TONES[sub];
  let finalText = text;
  if (tone && hash % 3 === 0) {
    // Sometimes sprinkle in subreddit-specific lingo naturally
    const lingoWord = tone.lingo[hash % tone.lingo.length];
    if (!finalText.includes(lingoWord.toLowerCase())) {
      // Don't force it - only add if it doesn't feel awkward
    }
  }

  return { text: finalText, mentionedSite };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// --- Route handler ---

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate input
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, context, subreddit, opportunityUrl } = body;

    if (!title || !subreddit) {
      return NextResponse.json({ success: false, error: "title and subreddit are required" }, { status: 400 });
    }

    // 3. Generate response
    const { text } = generateResponse(title, context || "", subreddit);

    // 4. Save response to DB if we can find the opportunity
    if (opportunityUrl) {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id')
        .eq('user_id', user.id)
        .eq('url', opportunityUrl)
        .single();

      if (opp) {
        const { error: saveError } = await supabase
          .from('generated_responses')
          .insert({
            opportunity_id: opp.id,
            user_id: user.id,
            response_text: text,
          });

        if (saveError) {
          console.error('Error saving response to DB:', saveError);
        }
      }
    }

    // 5. Return
    return NextResponse.json({
      success: true,
      response: text,
    });
  } catch (error) {
    console.error("[generate-response] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
