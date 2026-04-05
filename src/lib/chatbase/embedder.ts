export const VECTOR_DIM = 1024;

interface VoyageEmbeddingResponse {
  data: { embedding: number[] }[];
}

interface OpenAIEmbeddingResponse {
  data: { embedding: number[] }[];
}

async function embedWithVoyage(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: texts,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Voyage AI embedding failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as VoyageEmbeddingResponse;
  return data.data.map((item) => item.embedding);
}

async function embedWithOpenAI(texts: string[]): Promise<number[][]> {
  // OPENAI_EMBEDDING_BASE_URL accepts either:
  //   - A full endpoint URL (Azure style, e.g. https://{resource}.openai.azure.com/openai/deployments/{name}/embeddings?api-version=...)
  //   - A base URL (standard OpenAI style, e.g. https://api.openai.com/v1) — /embeddings is appended automatically
  const embeddingUrl = process.env.OPENAI_EMBEDDING_BASE_URL;
  const fallbackBase = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const endpoint = embeddingUrl
    ? (embeddingUrl.includes('/embeddings') ? embeddingUrl : `${embeddingUrl}/embeddings`)
    : `${fallbackBase}/embeddings`;

  const apiKey =
    process.env.OPENAI_EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY;

  // Azure OpenAI uses the `api-key` header; standard OpenAI uses Bearer auth.
  const isAzure = endpoint.includes('openai.azure.com') ||
    endpoint.includes('cognitiveservices.azure.com');
  const authHeaders: Record<string, string> = isAzure
    ? { 'api-key': apiKey ?? '' }
    : { Authorization: `Bearer ${apiKey}` };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: VECTOR_DIM,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI embedding failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;
  return data.data.map((item) => item.embedding);
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (process.env.VOYAGE_API_KEY) {
    try {
      return await embedWithVoyage(texts);
    } catch (err) {
      console.warn('Voyage AI embedding failed, falling back to OpenAI:', err);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return await embedWithOpenAI(texts);
  }

  throw new Error(
    'No embedding provider available. Set VOYAGE_API_KEY or OPENAI_API_KEY.'
  );
}
