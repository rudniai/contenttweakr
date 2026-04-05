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
  // OPENAI_EMBEDDING_BASE_URL lets you point at an Azure deployment endpoint
  // (e.g. https://{resource}.cognitiveservices.azure.com/openai/deployments/{name})
  // independently of the chat-completions OPENAI_BASE_URL.
  const baseUrl =
    process.env.OPENAI_EMBEDDING_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    'https://api.openai.com/v1';
  const apiKey =
    process.env.OPENAI_EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY;

  // Azure OpenAI uses the `api-key` header; standard OpenAI uses Bearer auth.
  const isAzure = baseUrl.includes('cognitiveservices.azure.com') ||
    baseUrl.includes('openai.azure.com');
  const authHeaders = isAzure
    ? { 'api-key': apiKey ?? '' }
    : { Authorization: `Bearer ${apiKey}` };

  const response = await fetch(`${baseUrl}/embeddings`, {
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
