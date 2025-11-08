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
    // Remove image-related words and common phrases
    cleanedQuery = cleanedQuery
      .replace(/\b(images?|photos?|pictures?|screenshots?|uploaded\s+image|image\s+with|images\s+with|photo\s+with|picture\s+with)\b/gi, '')
      .trim();
  }
  // Check for link-related keywords
  else if (lowerQuery.includes('link') || lowerQuery.includes('url') || 
      lowerQuery.includes('article') || lowerQuery.includes('website') ||
      lowerQuery.includes('page') || lowerQuery.includes('http')) {
    detectedType = ItemType.ARTICLE;
    // Remove link-related words
    cleanedQuery = cleanedQuery
      .replace(/\b(links?|urls?|articles?|websites?|pages?|http)\b/gi, '')
      .trim();
  }
  // Check for note-related keywords
  else if (lowerQuery.includes('note') || lowerQuery.includes('text') ||
      lowerQuery.includes('memo') || lowerQuery.includes('thought')) {
    detectedType = ItemType.NOTE;
    // Remove note-related words
    cleanedQuery = cleanedQuery
      .replace(/\b(notes?|texts?|memos?|thoughts?)\b/gi, '')
      .trim();
  }
  // Check for file-related keywords
  else if (lowerQuery.includes('file') || lowerQuery.includes('document') ||
      lowerQuery.includes('pdf') || lowerQuery.includes('uploaded file')) {
    detectedType = ItemType.FILE;
    // Remove file-related words
    cleanedQuery = cleanedQuery
      .replace(/\b(files?|documents?|pdfs?|uploaded\s+file)\b/gi, '')
      .trim();
  }
  // Check for todo-related keywords
  else if (lowerQuery.includes('todo') || lowerQuery.includes('task') ||
      lowerQuery.includes('reminder') || lowerQuery.includes('checklist')) {
    detectedType = ItemType.TODO;
    // Remove todo-related words
    cleanedQuery = cleanedQuery
      .replace(/\b(todos?|tasks?|reminders?|checklists?)\b/gi, '')
      .trim();
  }
  
  // Remove common stop words and prepositions that don't help with search
  // Also remove phrases like "with text", "containing", "that have", etc.
  cleanedQuery = cleanedQuery
    .replace(/\b(about|with|containing|that|which|related\s+to|regarding|concerning|having|showing|displaying)\b/gi, '')
    .replace(/\b(with\s+text|that\s+have|that\s+contain|which\s+have|which\s+contain)\b/gi, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return { type: detectedType, cleanedQuery };
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

    // Extract type filter and clean query from natural language
    const { type: typeFilter, cleanedQuery } = extractTypeFilter(query);
    if (typeFilter) {
      logger.info(`Detected type filter: ${typeFilter}, cleaned query: "${cleanedQuery}"`);
    }

    // Try semantic search if embeddings are available, otherwise use keyword search
    let similarItems: Array<{ itemId: string; score: number }> = [];
    
    // Check if OpenAI/LocalAI is configured and try semantic search
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        // Generate embedding for the FULL query (not cleaned) for better semantic understanding
        // This allows the model to understand context like "link about best beaches"
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || 'not-needed-for-localai',
          baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        });

        // Use LocalAI-compatible model name if using LocalAI
        const isLocalAI = process.env.OPENAI_API_BASE?.includes('localhost:8080') || 
                          process.env.OPENAI_API_BASE?.includes('127.0.0.1:8080');
        const modelName = isLocalAI ? 'nomic-embed-text' : 'text-embedding-3-small';

        // Use full query for semantic search to preserve context
        const embeddingResponse = await openai.embeddings.create({
          model: modelName,
          input: query, // Use full query, not cleaned
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Search vector database - get more results to filter by type
        similarItems = await searchSimilar(queryEmbedding, limit * 2, minScore);
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
      
      // Use the cleaned query from extractTypeFilter
      const searchQuery = cleanedQuery || query;

      const keywordWhere: any = {
        userId,
      };

      // Add type filter if detected
      if (typeFilter) {
        keywordWhere.type = typeFilter;
      }

      // If type filter is detected but no search text, return ALL items of that type
      if (typeFilter && !searchQuery) {
        // User wants all items of this type (e.g., "images", "links", "files")
        // Don't add OR clause - just filter by type
        logger.info(`Returning all items of type: ${typeFilter}`);
      } else if (searchQuery) {
        // There's search text - search in content
        // Split into words and search for each word (better matching)
        const searchWords = searchQuery.split(/\s+/).filter(w => w.length > 0);
        
        if (searchWords.length > 0) {
          // Search for all words (AND logic - all words must be present)
          // For images, prioritize OCR text; for notes, prioritize text content
          keywordWhere.AND = searchWords.map(word => {
            // Build OR conditions for each word
            const orConditions: any[] = [
              { title: { contains: word, mode: 'insensitive' } },
              { summary: { contains: word, mode: 'insensitive' } },
            ];
            
            // Add content search - always include both text and OCR for all types
            const contentOr: any[] = [
              { text: { contains: word, mode: 'insensitive' } },
            ];
            
            // Always include OCR text search (important for images)
            contentOr.push({ ocrText: { contains: word, mode: 'insensitive' } });
            
            orConditions.push({ content: { OR: contentOr } });
            
            return { OR: orConditions };
          });
        }
      } else if (!typeFilter) {
        // No type filter and no clean query - search in all fields with original query
        const searchWords = query.split(/\s+/).filter(w => w.length > 0);
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
    // OR when semantic search filtered out all results but we still have content to search
    if (typeFilter && results.length === 0) {
      logger.info(`No semantic results with type filter, trying direct type search with cleaned query`);
      
      // Use the cleaned query from extractTypeFilter
      const searchText = cleanedQuery;
      
      const typeSearchWhere: any = {
        userId,
        type: typeFilter,
      };
      
      // If there's search text, search in content including OCR
      // If no search text, return ALL items of this type
      if (searchText) {
        // Split into words and search for each word (better matching)
        const searchWords = searchText.split(/\s+/).filter(w => w.length > 0);
        
        if (searchWords.length > 0) {
          // Search for all words (AND logic - all words must be present)
          // For images, prioritize OCR text; for notes, prioritize text content
          typeSearchWhere.AND = searchWords.map(word => {
            const orConditions: any[] = [
              { title: { contains: word, mode: 'insensitive' } },
              { summary: { contains: word, mode: 'insensitive' } },
            ];
            
            // Build content search conditions
            const contentOr: any[] = [];
            
            // For images, OCR text is most important
            if (typeFilter === ItemType.IMAGE) {
              contentOr.push({ ocrText: { contains: word, mode: 'insensitive' } });
              contentOr.push({ text: { contains: word, mode: 'insensitive' } });
            } 
            // For notes, text content is most important
            else if (typeFilter === ItemType.NOTE) {
              contentOr.push({ text: { contains: word, mode: 'insensitive' } });
              contentOr.push({ ocrText: { contains: word, mode: 'insensitive' } });
            }
            // For other types, search both
            else {
              contentOr.push({ text: { contains: word, mode: 'insensitive' } });
              contentOr.push({ ocrText: { contains: word, mode: 'insensitive' } });
            }
            
            orConditions.push({ content: { OR: contentOr } });
            
            return { OR: orConditions };
          });
        }
        logger.info(`Searching for ${typeFilter} items with content: "${searchText}" (${searchWords.length} words)`);
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
    
    // If we have semantic results but type filter was applied, make sure we filter them
    // This handles cases where semantic search returned results but we need to filter by type
    if (typeFilter && results.length > 0 && similarItems.length > 0) {
      // Results are already filtered by type in the itemsWhere query above
      // But let's also re-rank by ensuring content relevance
      logger.info(`Filtered ${results.length} semantic results by type: ${typeFilter}`);
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

