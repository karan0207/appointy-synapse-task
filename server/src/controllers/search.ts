// Goal: Handle semantic search requests
// Steps: Convert query to embedding → Search vector DB → Fetch items from DB

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendBadRequest } from '../utils/response.js';
import { searchSimilar } from '../services/vector-db.js';
import { ItemType } from '@prisma/client';

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.3), // Lower threshold to get more results
});

/**
 * Parse natural language query to extract item type filters
 */
function extractTypeFilter(query: string): ItemType | null {
  const lowerQuery = query.toLowerCase();
  
  // Check for image-related keywords
  if (lowerQuery.includes('image') || lowerQuery.includes('photo') || 
      lowerQuery.includes('picture') || lowerQuery.includes('screenshot') ||
      lowerQuery.includes('uploaded image') || lowerQuery.includes('images i')) {
    return ItemType.IMAGE;
  }
  
  // Check for link-related keywords
  if (lowerQuery.includes('link') || lowerQuery.includes('url') || 
      lowerQuery.includes('article') || lowerQuery.includes('website') ||
      lowerQuery.includes('page') || lowerQuery.includes('http')) {
    return ItemType.ARTICLE;
  }
  
  // Check for note-related keywords
  if (lowerQuery.includes('note') || lowerQuery.includes('text') ||
      lowerQuery.includes('memo') || lowerQuery.includes('thought')) {
    return ItemType.NOTE;
  }
  
  // Check for file-related keywords
  if (lowerQuery.includes('file') || lowerQuery.includes('document') ||
      lowerQuery.includes('pdf') || lowerQuery.includes('uploaded file')) {
    return ItemType.FILE;
  }
  
  // Check for todo-related keywords
  if (lowerQuery.includes('todo') || lowerQuery.includes('task') ||
      lowerQuery.includes('reminder') || lowerQuery.includes('checklist')) {
    return ItemType.TODO;
  }
  
  return null;
}

export const semanticSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validationResult = searchSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { query, limit, minScore } = validationResult.data;

    logger.info(`Search query: "${query}"`);

    // Get current user ID from session
    const userId = req.session.userId;
    if (!userId) {
      sendBadRequest(res, 'Authentication required');
      return;
    }

    // Extract type filter from natural language query
    const typeFilter = extractTypeFilter(query);
    if (typeFilter) {
      logger.info(`Detected type filter: ${typeFilter}`);
    }

    // Try semantic search if embeddings are available, otherwise use keyword search
    let similarItems: Array<{ itemId: string; score: number }> = [];
    
    // Check if OpenAI/LocalAI is configured and try semantic search
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        // Generate embedding for query
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || 'not-needed-for-localai',
          baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        });

        // Use LocalAI-compatible model name if using LocalAI
        const isLocalAI = process.env.OPENAI_API_BASE?.includes('localhost:8080') || 
                          process.env.OPENAI_API_BASE?.includes('127.0.0.1:8080');
        const modelName = isLocalAI ? 'nomic-embed-text' : 'text-embedding-3-small';

        const embeddingResponse = await openai.embeddings.create({
          model: modelName,
          input: query,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Search vector database
        similarItems = await searchSimilar(queryEmbedding, limit, minScore);
        logger.info(`Semantic search found ${similarItems.length} results`);
      } catch (error: any) {
        // If embeddings fail, fall through to keyword search
        logger.warn(`Semantic search failed, using keyword fallback: ${error.message}`);
        similarItems = [];
      }
    }

    // If no vector results, fallback to keyword search
    if (similarItems.length === 0) {
      logger.info(`No vector results, trying keyword fallback for: "${query}"`);
      
      // Fallback: Simple keyword search in user's items
      // Clean query for keyword search (remove type keywords)
      const cleanQuery = query
        .replace(/\b(images?|photos?|pictures?|screenshots?)\b/gi, '')
        .replace(/\b(links?|urls?|articles?|websites?|pages?)\b/gi, '')
        .replace(/\b(notes?|texts?|memos?)\b/gi, '')
        .replace(/\b(files?|documents?|pdfs?)\b/gi, '')
        .replace(/\b(todos?|tasks?|reminders?|checklists?)\b/gi, '')
        .trim();

      const keywordWhere: any = {
        userId,
      };

      // Add type filter if detected
      if (typeFilter) {
        keywordWhere.type = typeFilter;
      }

      // If type filter is detected but no search text, return ALL items of that type
      if (typeFilter && !cleanQuery) {
        // User wants all items of this type (e.g., "images", "links", "files")
        // Don't add OR clause - just filter by type
        logger.info(`Returning all items of type: ${typeFilter}`);
      } else if (cleanQuery) {
        // There's search text - search in content
        keywordWhere.OR = [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { summary: { contains: cleanQuery, mode: 'insensitive' } },
          { content: { 
            OR: [
              { text: { contains: cleanQuery, mode: 'insensitive' } },
              { ocrText: { contains: cleanQuery, mode: 'insensitive' } }, // OCR text search
            ]
          } },
        ];
      } else if (!typeFilter) {
        // No type filter and no clean query - search in all fields with original query
        keywordWhere.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { 
            OR: [
              { text: { contains: query, mode: 'insensitive' } },
              { ocrText: { contains: query, mode: 'insensitive' } },
            ]
          } },
        ];
      }

      const keywordItems = await prisma.item.findMany({
        where: keywordWhere,
        include: {
          content: true,
          media: true,
          embedding: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      if (keywordItems.length > 0) {
        logger.info(`Found ${keywordItems.length} keyword results`);
        sendSuccess(res, {
          results: keywordItems.map(item => ({ ...item, relevanceScore: 0.6 })), // Lower score for keyword matches
          total: keywordItems.length,
          query,
        });
        return;
      }

      // No results at all
      sendSuccess(res, {
        results: [],
        total: 0,
        query,
      });
      return;
    }

    // If we have semantic results, fetch them
    // But if type filter is set and no results, we'll handle it in fallback below
    let items: any[] = [];
    
    if (similarItems.length > 0) {
      const itemIds = similarItems.map(r => r.itemId);
      
      const itemsWhere: any = {
        id: { in: itemIds },
        userId, // Only search user's own items
      };

      // Apply type filter if detected
      if (typeFilter) {
        itemsWhere.type = typeFilter;
        logger.info(`Filtering semantic results by type: ${typeFilter}`);
      }

      items = await prisma.item.findMany({
        where: itemsWhere,
        include: {
          content: true,
          media: true,
          embedding: true,
        },
      });
    }

    // Create a map for O(1) lookup
    const itemMap = new Map(items.map(item => [item.id, item]));

    // Combine items with similarity scores, maintaining order
    let results = similarItems
      .map(({ itemId, score }) => {
        const item = itemMap.get(itemId);
        return item ? { ...item, relevanceScore: score } : null;
      })
      .filter(Boolean);

    // If type filter was applied but no semantic results, try direct type search
    // This handles cases like "images" where user wants all items of a type
    if (typeFilter && results.length === 0) {
      logger.info(`No semantic results with type filter, trying direct type search`);
      
      // Extract search text from query (remove type keywords)
      const searchText = query
        .replace(/\b(images?|photos?|pictures?|screenshots?)\b/gi, '')
        .replace(/\b(links?|urls?|articles?|websites?|pages?)\b/gi, '')
        .replace(/\b(notes?|texts?|memos?)\b/gi, '')
        .replace(/\b(files?|documents?|pdfs?)\b/gi, '')
        .replace(/\b(todos?|tasks?|reminders?|checklists?)\b/gi, '')
        .trim();
      
      const typeSearchWhere: any = {
        userId,
        type: typeFilter,
      };
      
      // If there's search text, search in content including OCR
      // If no search text, return ALL items of this type
      if (searchText) {
        typeSearchWhere.OR = [
          { title: { contains: searchText, mode: 'insensitive' } },
          { summary: { contains: searchText, mode: 'insensitive' } },
          { content: { 
            OR: [
              { text: { contains: searchText, mode: 'insensitive' } },
              { ocrText: { contains: searchText, mode: 'insensitive' } }, // Important: search OCR text
            ]
          } },
        ];
        logger.info(`Searching for ${typeFilter} items with content: "${searchText}"`);
      } else {
        logger.info(`Returning all ${typeFilter} items (no content filter)`);
      }
      
      const typeItems = await prisma.item.findMany({
        where: typeSearchWhere,
        include: {
          content: true,
          media: true,
          embedding: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      results = typeItems.map(item => ({ ...item, relevanceScore: 0.7 }));
      logger.info(`Found ${results.length} items by type search`);
    }

    logger.info(`Found ${results.length} results for query: "${query}"${typeFilter ? ` (filtered by type: ${typeFilter})` : ''}`);

    sendSuccess(res, {
      results,
      total: results.length,
      query,
      typeFilter: typeFilter || undefined,
    });

  } catch (error) {
    logger.error('Error in semantic search:', error);
    next(error);
  }
};

