// Goal: Handle hybrid semantic + keyword search requests
// Steps: Expand query → Semantic search + Keyword search → Combine & rank results

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendBadRequest } from '../utils/response.js';
import { searchSimilar } from '../services/vector-db.js';
import { rewriteQuery, extractKeyTerms } from '../services/query-expansion.js';
import { ItemType } from '@prisma/client';

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.3),
});

/**
 * Parse natural language query to extract item type filters
 * Returns the type filter and the cleaned query without type keywords
 */
function extractTypeFilter(query: string): { type: ItemType | null; cleanedQuery: string } {
  const lowerQuery = query.toLowerCase();
  let cleanedQuery = query;
  let detectedType: ItemType | null = null;
  
  // Check for image-related keywords (check first to avoid conflicts)
  if (lowerQuery.includes('image') || lowerQuery.includes('photo') || 
      lowerQuery.includes('picture') || lowerQuery.includes('screenshot') ||
      lowerQuery.includes('uploaded image') || lowerQuery.includes('images i') ||
      lowerQuery.includes('images with') || lowerQuery.includes('image with') ||
      lowerQuery.includes('photo with') || lowerQuery.includes('picture with')) {
    detectedType = ItemType.IMAGE;
    cleanedQuery = cleanedQuery
      .replace(/\b(images?|photos?|pictures?|screenshots?|uploaded\s+image|image\s+with|images\s+with|photo\s+with|picture\s+with)\b/gi, '')
      .trim();
  }
  // Check for link-related keywords
  else if (lowerQuery.includes('link') || lowerQuery.includes('url') || 
      lowerQuery.includes('article') || lowerQuery.includes('website') ||
      lowerQuery.includes('page') || lowerQuery.includes('http')) {
    detectedType = ItemType.ARTICLE;
    cleanedQuery = cleanedQuery
      .replace(/\b(links?|urls?|articles?|websites?|pages?|http)\b/gi, '')
      .trim();
  }
  // Check for note-related keywords
  else if (lowerQuery.includes('note') || lowerQuery.includes('text') ||
      lowerQuery.includes('memo') || lowerQuery.includes('thought')) {
    detectedType = ItemType.NOTE;
    cleanedQuery = cleanedQuery
      .replace(/\b(notes?|texts?|memos?|thoughts?)\b/gi, '')
      .trim();
  }
  // Check for file-related keywords
  else if (lowerQuery.includes('file') || lowerQuery.includes('document') ||
      lowerQuery.includes('pdf') || lowerQuery.includes('uploaded file')) {
    detectedType = ItemType.FILE;
    cleanedQuery = cleanedQuery
      .replace(/\b(files?|documents?|pdfs?|uploaded\s+file)\b/gi, '')
      .trim();
  }
  // Check for todo-related keywords
  else if (lowerQuery.includes('todo') || lowerQuery.includes('task') ||
      lowerQuery.includes('reminder') || lowerQuery.includes('checklist')) {
    detectedType = ItemType.TODO;
    cleanedQuery = cleanedQuery
      .replace(/\b(todos?|tasks?|reminders?|checklists?)\b/gi, '')
      .trim();
  }
  
  // Remove common stop words and prepositions
  cleanedQuery = cleanedQuery
    .replace(/\b(about|with|containing|that|which|related\s+to|regarding|concerning|having|showing|displaying)\b/gi, '')
    .replace(/\b(with\s+text|that\s+have|that\s+contain|which\s+have|which\s+contain)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { type: detectedType, cleanedQuery };
}

/**
 * Perform keyword search
 */
async function performKeywordSearch(
  searchQuery: string,
  userId: string,
  typeFilter: ItemType | null,
  limit: number
): Promise<Array<{ item: any; score: number }>> {
  const keywordWhere: any = { userId };

      if (typeFilter) {
        keywordWhere.type = typeFilter;
      }

  if (searchQuery) {
    const searchWords = extractKeyTerms(searchQuery);
    
        if (searchWords.length > 0) {
          keywordWhere.AND = searchWords.map(word => {
            const orConditions: any[] = [
              { title: { contains: word, mode: 'insensitive' } },
              { summary: { contains: word, mode: 'insensitive' } },
            ];
            
            const contentOr: any[] = [
              { text: { contains: word, mode: 'insensitive' } },
              { ocrText: { contains: word, mode: 'insensitive' } },
            ];
            
            orConditions.push({ content: { OR: contentOr } });
            return { OR: orConditions };
          });
        }
      }

  const items = await prisma.item.findMany({
        where: keywordWhere,
        include: {
          content: true,
          media: true,
          embedding: true,
        },
    take: limit * 2, // Get more for ranking
  });

  // Calculate keyword match scores
  const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  return items.map(item => {
    let score = 0.5; // Base score for keyword match
    
    const searchableText = [
      item.title || '',
      item.summary || '',
      item.content?.text || '',
      item.content?.ocrText || '',
    ].join(' ').toLowerCase();

    // Count matches in title (higher weight)
    const titleMatches = searchTerms.filter(term => 
      item.title?.toLowerCase().includes(term)
    ).length;
    score += titleMatches * 0.2;

    // Count matches in summary
    const summaryMatches = searchTerms.filter(term => 
      item.summary?.toLowerCase().includes(term)
    ).length;
    score += summaryMatches * 0.15;

    // Count matches in content
    const contentMatches = searchTerms.filter(term => 
      searchableText.includes(term)
    ).length;
    score += contentMatches * 0.1;

    // Exact phrase match bonus
    if (searchableText.includes(searchQuery.toLowerCase())) {
      score += 0.2;
    }

    return { item, score: Math.min(score, 0.95) }; // Cap at 0.95
  }).sort((a, b) => b.score - a.score);
}

/**
 * Perform semantic search
 */
async function performSemanticSearch(
  query: string,
  userId: string,
  typeFilter: ItemType | null,
  limit: number,
  minScore: number
): Promise<Array<{ itemId: string; score: number }>> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return [];
      }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'not-needed-for-localai',
      baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    });

    const isLocalAI = process.env.OPENAI_API_BASE?.includes('localhost:8080') || 
                      process.env.OPENAI_API_BASE?.includes('127.0.0.1:8080');
    const modelName = isLocalAI ? 'nomic-embed-text' : 'text-embedding-3-small';

    // Rewrite query for better semantic understanding
    const rewrittenQuery = rewriteQuery(query);
    logger.info(`Semantic search: "${query}" → "${rewrittenQuery}"`);

    const embeddingResponse = await openai.embeddings.create({
      model: modelName,
      input: rewrittenQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Get semantic results
    let similarItems = await searchSimilar(queryEmbedding, limit * 3, minScore);
    
    // Filter by user and type if needed
    if (similarItems.length > 0) {
      const itemIds = similarItems.map(r => r.itemId);
      const itemsWhere: any = {
        id: { in: itemIds },
        userId,
      };

      if (typeFilter) {
        itemsWhere.type = typeFilter;
      }

      const items = await prisma.item.findMany({
        where: itemsWhere,
        select: { id: true },
      });

      const validIds = new Set(items.map(i => i.id));
      similarItems = similarItems.filter(r => validIds.has(r.itemId));
    }

    return similarItems;
  } catch (error: any) {
    logger.warn(`Semantic search failed: ${error.message}`);
    return [];
  }
}

/**
 * Combine and rank results from semantic and keyword search
 */
async function combineResults(
  semanticResults: Array<{ itemId: string; score: number }>,
  keywordResults: Array<{ item: any; score: number }>,
  limit: number
): Promise<Array<{ item: any; score: number; source: 'semantic' | 'keyword' | 'hybrid' }>> {
  const resultMap = new Map<string, { item?: any; semanticScore?: number; keywordScore?: number }>();

  // Add semantic results (just IDs and scores for now)
  semanticResults.forEach(({ itemId, score }) => {
    resultMap.set(itemId, { semanticScore: score });
  });

  // Add keyword results and combine scores
  keywordResults.forEach(({ item, score }) => {
    const existing = resultMap.get(item.id);
    if (existing) {
      existing.item = item;
      existing.keywordScore = score;
    } else {
      resultMap.set(item.id, { item, keywordScore: score });
    }
  });

  // Fetch full items for semantic-only results
  const semanticOnlyIds = Array.from(resultMap.entries())
    .filter(([_, data]) => !data.item)
    .map(([id]) => id);

  if (semanticOnlyIds.length > 0) {
    const fullItems = await prisma.item.findMany({
      where: { id: { in: semanticOnlyIds } },
        include: {
          content: true,
          media: true,
          embedding: true,
        },
      });

    fullItems.forEach(item => {
      const existing = resultMap.get(item.id);
      if (existing) {
        existing.item = item;
      }
    });
  }

  // Convert to array and calculate hybrid scores
  const combined = Array.from(resultMap.entries())
    .map(([itemId, { item, semanticScore, keywordScore }]) => {
      if (!item) {
        return null; // Skip if item not found
      }

      let finalScore = 0;
      let source: 'semantic' | 'keyword' | 'hybrid' = 'keyword';

      if (semanticScore !== undefined && keywordScore !== undefined) {
        // Hybrid: combine both scores (semantic weighted more)
        finalScore = (semanticScore * 0.7) + (keywordScore * 0.3);
        source = 'hybrid';
      } else if (semanticScore !== undefined) {
        finalScore = semanticScore;
        source = 'semantic';
      } else {
        finalScore = keywordScore || 0;
        source = 'keyword';
      }

      return { item, score: finalScore, source };
    })
    .filter((r): r is { item: any; score: number; source: 'semantic' | 'keyword' | 'hybrid' } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return combined;
}

export const semanticSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationResult = searchSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { query, limit, minScore } = validationResult.data;
    logger.info(`🔍 Hybrid search query: "${query}"`);

    const userId = req.session.userId;
    if (!userId) {
      sendBadRequest(res, 'Authentication required');
      return;
            } 

    // Extract type filter and clean query
    const { type: typeFilter, cleanedQuery } = extractTypeFilter(query);
    const searchQuery = cleanedQuery || query;

    if (typeFilter) {
      logger.info(`📌 Type filter: ${typeFilter}, search text: "${searchQuery}"`);
            }

    // Perform both searches in parallel for better performance
    const [semanticResults, keywordResults] = await Promise.all([
      performSemanticSearch(query, userId, typeFilter, limit, minScore),
      performKeywordSearch(searchQuery, userId, typeFilter, limit),
    ]);

    logger.info(`📊 Semantic: ${semanticResults.length} results, Keyword: ${keywordResults.length} results`);

    // If no results from either method, try type-only search
    if (semanticResults.length === 0 && keywordResults.length === 0 && typeFilter) {
      logger.info(`🔎 No results, trying type-only search for: ${typeFilter}`);
      
      const typeItems = await prisma.item.findMany({
        where: {
          userId,
          type: typeFilter,
        },
        include: {
          content: true,
          media: true,
          embedding: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      if (typeItems.length > 0) {
        sendSuccess(res, {
          results: typeItems.map(item => ({ ...item, relevanceScore: 0.5 })),
          total: typeItems.length,
          query,
          typeFilter,
        });
        return;
      }
    }
    
    // Combine and rank results
    const combined = await combineResults(semanticResults, keywordResults, limit);

    // Filter out incomplete items and format results
    const results = combined
      .filter(r => r.item && (r.item.title || r.item.summary || r.item.content))
      .map(({ item, score, source }) => ({
        ...item,
        relevanceScore: score,
        searchSource: source,
      }));

    logger.info(`✅ Returning ${results.length} results (${results.filter(r => r.searchSource === 'hybrid').length} hybrid, ${results.filter(r => r.searchSource === 'semantic').length} semantic, ${results.filter(r => r.searchSource === 'keyword').length} keyword)`);

    sendSuccess(res, {
      results,
      total: results.length,
      query,
      typeFilter: typeFilter || undefined,
    });

  } catch (error) {
    logger.error('Error in hybrid search:', error);
    next(error);
  }
};
