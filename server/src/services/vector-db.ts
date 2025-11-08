// Goal: Vector database service for semantic search
// MVP: In-memory vector store (simple, no external dependencies)
// Production: Can swap to Qdrant, Pinecone, or Weaviate

interface VectorRecord {
  id: string;
  itemId: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

class InMemoryVectorStore {
  private vectors: Map<string, VectorRecord> = new Map();

  async upsert(record: VectorRecord): Promise<void> {
    this.vectors.set(record.id, record);
    console.log(`[VectorDB] Stored embedding for item ${record.itemId}`);
  }

  async search(queryVector: number[], limit = 10): Promise<Array<{ id: string; itemId: string; score: number }>> {
    const results: Array<{ id: string; itemId: string; score: number }> = [];

    if (this.vectors.size === 0) {
      console.log('[VectorDB] No embeddings stored yet');
      return results;
    }

    for (const [id, record] of this.vectors.entries()) {
      try {
        const similarity = this.cosineSimilarity(queryVector, record.vector);
        results.push({ id, itemId: record.itemId, score: similarity });
      } catch (error) {
        console.error(`[VectorDB] Error calculating similarity for ${id}:`, error);
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.score - a.score);

    console.log(`[VectorDB] Search found ${results.length} candidates, returning top ${limit}`);
    return results.slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.vectors.delete(id);
  }

  async getById(id: string): Promise<VectorRecord | null> {
    return this.vectors.get(id) || null;
  }

  async count(): Promise<number> {
    return this.vectors.size;
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

// Singleton instance
const vectorStore = new InMemoryVectorStore();

/**
 * Store embedding in vector database
 */
export async function storeEmbedding(
  itemId: string,
  embedding: number[],
  metadata?: Record<string, unknown>
): Promise<string> {
  const vectorId = `vec-${itemId}`;
  
  await vectorStore.upsert({
    id: vectorId,
    itemId,
    vector: embedding,
    metadata,
  });

  return vectorId;
}

/**
 * Search for similar items using vector similarity
 */
export async function searchSimilar(
  queryEmbedding: number[],
  limit = 10,
  minScore = 0.3 // Lower threshold to get more results
): Promise<Array<{ itemId: string; score: number }>> {
  const results = await vectorStore.search(queryEmbedding, limit * 3); // Get more candidates
  
  if (results.length === 0) {
    return [];
  }
  
  // Filter by minimum similarity score and sort
  const filtered = results
    .filter(r => r.score >= minScore)
    .map(r => ({ itemId: r.itemId, score: r.score }))
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  // If we have some results but all below threshold, return top ones anyway
  if (filtered.length === 0 && results.length > 0) {
    console.log(`[VectorDB] No results above ${minScore}, returning top ${limit} anyway`);
    return results.slice(0, limit).map(r => ({ itemId: r.itemId, score: r.score }));
  }
  
  return filtered.slice(0, limit); // Return top N results
}

/**
 * Delete embedding for an item
 */
export async function deleteEmbedding(itemId: string): Promise<void> {
  const vectorId = `vec-${itemId}`;
  await vectorStore.delete(vectorId);
}

/**
 * Get statistics about vector database
 */
export async function getVectorStats(): Promise<{ count: number }> {
  const count = await vectorStore.count();
  return { count };
}

// For testing/debugging
export { vectorStore };

