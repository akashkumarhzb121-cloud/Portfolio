import { KnowledgeChunk, type IKnowledgeChunk } from '../../models/knowledgeChunk.model.js';

export interface SearchResult {
  chunkId: string;
  source: string;
  sourceType: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches the KnowledgeChunk collection using Atlas $vectorSearch when available,
 * with graceful in-memory cosine similarity and keyword-matching fallbacks.
 */
export async function searchKnowledge(
  query: string,
  queryVector?: number[],
  limit: number = 5,
  sourceTypeFilter?: string
): Promise<SearchResult[]> {
  const matchFilter: Record<string, unknown> = {};
  if (sourceTypeFilter) {
    matchFilter.sourceType = sourceTypeFilter;
  }

  // 1. Try Atlas Vector Search aggregation pipeline if query vector is provided
  if (queryVector && queryVector.length > 0) {
    try {
      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector,
            numCandidates: Math.max(limit * 10, 50),
            limit,
            ...(sourceTypeFilter ? { filter: { sourceType: { $eq: sourceTypeFilter } } } : {})
          }
        },
        {
          $project: {
            chunkId: 1,
            source: 1,
            sourceType: 1,
            title: 1,
            content: 1,
            metadata: 1,
            tags: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const results = await KnowledgeChunk.aggregate(pipeline).exec();
      if (results && results.length > 0) {
        return results.map((doc: any) => ({
          chunkId: doc.chunkId,
          source: doc.source,
          sourceType: doc.sourceType,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata || {},
          tags: doc.tags || [],
          score: doc.score ?? 1.0
        }));
      }
    } catch {
      // Atlas $vectorSearch index not provisioned or unsupported environment
      // Fall through to resilient fallback below
    }
  }

  // 2. Resilient In-Memory Fallback: Fetch candidate documents
  const candidates = await KnowledgeChunk.find(matchFilter).lean().exec();
  if (!candidates || candidates.length === 0) {
    return [];
  }

  // If queryVector is available, compute cosine similarity
  if (queryVector && queryVector.length > 0) {
    const scored = candidates
      .map((chunk: any) => {
        const sim = chunk.embedding && chunk.embedding.length === queryVector.length
          ? cosineSimilarity(queryVector, chunk.embedding)
          : 0;
        return {
          chunkId: chunk.chunkId,
          source: chunk.source,
          sourceType: chunk.sourceType,
          title: chunk.title,
          content: chunk.content,
          metadata: chunk.metadata || {},
          tags: chunk.tags || [],
          score: sim
        };
      })
      .filter((item) => item.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (scored.length > 0) {
      return scored;
    }
  }

  // 3. Keyword / Semantic Text Matching Fallback
  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

  const scoredByText = candidates.map((chunk: any) => {
    let textScore = 0;
    const lowerTitle = (chunk.title || '').toLowerCase();
    const lowerContent = (chunk.content || '').toLowerCase();
    const tags = Array.isArray(chunk.tags) ? chunk.tags.map((t: string) => t.toLowerCase()) : [];

    // Exact query match bonus
    if (lowerTitle.includes(lowerQuery)) textScore += 5;
    if (lowerContent.includes(lowerQuery)) textScore += 3;

    // Token scoring
    for (const token of queryTokens) {
      if (tags.some((tag: string) => tag.includes(token))) textScore += 3;
      if (lowerTitle.includes(token)) textScore += 2;
      if (lowerContent.includes(token)) textScore += 1;
    }

    return {
      chunkId: chunk.chunkId,
      source: chunk.source,
      sourceType: chunk.sourceType,
      title: chunk.title,
      content: chunk.content,
      metadata: chunk.metadata || {},
      tags: chunk.tags || [],
      score: textScore
    };
  });

  return scoredByText
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
