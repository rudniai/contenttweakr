import { getServiceClient, type Document } from './db';
import { chunkText } from './chunker';
import { embed } from './embedder';

/**
 * Strip HTML from a raw HTML string:
 * 1. Remove <script> and <style> blocks entirely (including content).
 * 2. Strip all remaining tags.
 * 3. Collapse excess whitespace.
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchUrlText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL ${url}: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return extractTextFromHtml(html);
}

export async function ingestDocument(documentId: string): Promise<void> {
  const supabase = getServiceClient();

  // 1. Set status to 'processing'
  await supabase
    .from('cb_documents')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', documentId);

  try {
    // 2. Fetch document
    const { data: docData, error: docError } = await supabase
      .from('cb_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      throw new Error(
        `Document not found: ${docError?.message ?? 'no data returned'}`
      );
    }

    const doc = docData as Document;

    // 3. Extract text
    let rawText: string;
    if (doc.source_type === 'url') {
      if (!doc.source_url) {
        throw new Error('Document source_type is url but source_url is null.');
      }
      rawText = await fetchUrlText(doc.source_url);
    } else {
      // 'file' — text should already be in raw_text
      if (!doc.raw_text) {
        throw new Error('Document source_type is file but raw_text is null.');
      }
      rawText = doc.raw_text;
    }

    if (!rawText.trim()) {
      throw new Error('Extracted text is empty — nothing to ingest.');
    }

    // 4. Chunk the text
    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      throw new Error('Chunking produced no chunks.');
    }

    // 5. Generate embeddings (batch all chunks at once)
    const embeddings = await embed(chunks);

    // 6. Insert chunks into cb_chunks
    const rows = chunks.map((content, i) => ({
      document_id: documentId,
      content,
      embedding: embeddings[i],
      chunk_index: i,
    }));

    // Insert in batches of 100 to avoid payload size limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('cb_chunks')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // 7. Update document to 'ready'
    await supabase
      .from('cb_documents')
      .update({
        status: 'ready',
        chunk_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ingestDocument(${documentId}) failed:`, message);

    // 8. On error: mark document as errored
    await supabase
      .from('cb_documents')
      .update({
        status: 'error',
        error_msg: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    throw err;
  }
}
