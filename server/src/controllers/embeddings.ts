// Goal: Handle embedding storage requests from worker
// Steps: Validate → Store in vector DB → Update Postgres

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendCreated, sendBadRequest } from '../utils/response.js';
import { storeEmbedding } from '../services/vector-db.js';

const storeEmbeddingSchema = z.object({
  itemId: z.string(),
  embedding: z.array(z.number()),
});

export const storeItemEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const validationResult = storeEmbeddingSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { itemId, embedding } = validationResult.data;

    logger.info(`Storing embedding for item ${itemId} (${embedding.length} dimensions)`);

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      sendBadRequest(res, 'Item not found');
      return;
    }

    // Store in vector database
    const vectorId = await storeEmbedding(itemId, embedding, {
      type: item.type,
      createdAt: item.createdAt,
    });

    // Update or create embedding record in Postgres
    await prisma.embedding.upsert({
      where: { itemId },
      update: { vectorId },
      create: {
        itemId,
        vectorId,
      },
    });

    logger.info(`✓ Embedding stored: ${vectorId}`);

    sendCreated(res, {
      itemId,
      vectorId,
      dimensions: embedding.length,
    }, 'Embedding stored successfully');

  } catch (error) {
    logger.error('Error storing embedding:', error);
    next(error);
  }
};

