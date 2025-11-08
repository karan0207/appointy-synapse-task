// Goal: Handle item retrieval requests
// Returns paginated list of items with relations

import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess } from '../utils/response.js';

export const getItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      sendSuccess(res, { items: [], total: 0 });
      return;
    }

    // Get all items with relations
    const items = await prisma.item.findMany({
      where: {
        userId,
      },
      include: {
        content: true,
        media: true,
        embedding: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info(`Retrieved ${items.length} items`);

    sendSuccess(res, {
      items,
      total: items.length,
    });

  } catch (error) {
    logger.error('Error retrieving items:', error);
    next(error);
  }
};

