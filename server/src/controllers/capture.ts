// Goal: Handle capture requests (text, link, file)
// Steps: Validate → Store in DB → Queue job → Return response

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendCreated, sendBadRequest } from '../utils/response.js';
import { VALIDATION_LIMITS, SUCCESS_MESSAGES } from '@synapse/shared';
import { ItemType, ItemStatus } from '@prisma/client';

// Validation schemas
const captureTextSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(VALIDATION_LIMITS.MAX_TEXT_LENGTH, 'Text is too long'),
  userId: z.string().optional(),
});

const captureLinkSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(VALIDATION_LIMITS.MAX_URL_LENGTH, 'URL is too long'),
  userId: z.string().optional(),
});

export const captureText = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    // Validate input
    const validationResult = captureTextSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { text } = validationResult.data;

    // Create item in database
    const item = await prisma.item.create({
      data: {
        userId,
        type: ItemType.NOTE,
        status: ItemStatus.PENDING,
        title: text.substring(0, 100), // Use first 100 chars as title
        content: {
          create: {
            text,
          },
        },
      },
      include: {
        content: true,
      },
    });

    logger.info(`Item created: ${item.id}`);

    // Queue background job for processing
    try {
      const { queueItemProcessing } = await import('../config/queue.js');
      await queueItemProcessing(item.id, 'text');
      logger.info(`Job queued for item: ${item.id}`);
    } catch (queueError) {
      logger.error('Failed to queue job:', queueError);
      // Continue anyway - item is saved, can be processed later
    }

    sendCreated(res, {
      itemId: item.id,
      status: item.status,
    }, SUCCESS_MESSAGES.ITEM_CREATED);

  } catch (error) {
    logger.error('Error capturing text:', error);
    next(error);
  }
};

