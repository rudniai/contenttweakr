/**
 * Approximate token count using character count (1 token ≈ 4 chars).
 */
function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks of approximately maxChunkSize tokens with overlap.
 * Uses paragraph-aware splitting: tries double newlines first, then single
 * newlines, then spaces.
 */
export function chunkText(
  text: string,
  maxChunkSize = 512,
  overlap = 64
): string[] {
  const maxChars = maxChunkSize * 4;
  const overlapChars = overlap * 4;

  // Split into natural segments (paragraphs preferred)
  const paragraphs = text
    .split(/\n\n+/)
    .flatMap((para) => {
      // If paragraph is still too large, split on single newlines
      if (para.length > maxChars) {
        return para.split(/\n/).flatMap((line) => {
          // If line is still too large, split on spaces
          if (line.length > maxChars) {
            const words = line.split(' ');
            const parts: string[] = [];
            let current = '';
            for (const word of words) {
              if ((current + ' ' + word).length > maxChars && current) {
                parts.push(current.trim());
                current = word;
              } else {
                current = current ? current + ' ' + word : word;
              }
            }
            if (current.trim()) parts.push(current.trim());
            return parts;
          }
          return [line];
        });
      }
      return [para];
    })
    .filter((s) => s.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const segment of paragraphs) {
    const candidate = currentChunk
      ? currentChunk + '\n\n' + segment
      : segment;

    if (approxTokens(candidate) <= maxChunkSize) {
      currentChunk = candidate;
    } else {
      // Flush current chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // Start new chunk with overlap from the end of the previous chunk
      if (overlapChars > 0 && currentChunk.length > 0) {
        const overlapText = currentChunk.slice(-overlapChars);
        currentChunk = overlapText + '\n\n' + segment;
      } else {
        currentChunk = segment;
      }
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.trim().length > 0);
}
