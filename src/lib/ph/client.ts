// ── Product Hunt API client ──────────────────────────────────────────────────
// Uses the Product Hunt GraphQL API v2.
// Requires PRODUCT_HUNT_API_KEY env var (Developer Token).
// Falls back gracefully if no API key is configured.

const PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';

export interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string; // ISO date
  website: string;
  slug: string;
}

interface PHGraphQLResponse {
  data?: {
    posts?: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          tagline: string;
          description: string;
          url: string;
          votesCount: number;
          commentsCount: number;
          createdAt: string;
          website: string;
          slug: string;
        };
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

const POSTS_QUERY = `
  query GetPosts($first: Int!, $postedAfter: DateTime) {
    posts(first: $first, postedAfter: $postedAfter, order: VOTES) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          commentsCount
          createdAt
          website
          slug
        }
      }
    }
  }
`;

/**
 * Check if the Product Hunt API key is configured.
 */
export function isPHConfigured(): boolean {
  return !!process.env.PRODUCT_HUNT_API_KEY;
}

/**
 * Fetch top posts from Product Hunt.
 * Returns empty array if no API key is configured.
 */
export async function fetchPHPosts(limit = 50, hoursBack = 72): Promise<PHPost[]> {
  const apiKey = process.env.PRODUCT_HUNT_API_KEY;
  if (!apiKey) {
    console.log('PH: No PRODUCT_HUNT_API_KEY configured, skipping');
    return [];
  }

  const postedAfter = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();

  try {
    const response = await fetch(PH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: POSTS_QUERY,
        variables: { first: limit, postedAfter },
      }),
    });

    if (!response.ok) {
      console.error(`PH API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const json: PHGraphQLResponse = await response.json();

    if (json.errors) {
      console.error('PH GraphQL errors:', json.errors.map((e) => e.message).join(', '));
      return [];
    }

    if (!json.data?.posts?.edges) {
      return [];
    }

    return json.data.posts.edges.map((edge) => edge.node);
  } catch (err) {
    console.error('PH fetch error:', err);
    return [];
  }
}
