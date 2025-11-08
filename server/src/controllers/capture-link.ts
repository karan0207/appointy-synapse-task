// Goal: Handle link capture requests
// Steps: Validate URL → Store in DB → Queue job → Return response

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendCreated, sendBadRequest } from '../utils/response.js';
import { VALIDATION_LIMITS, SUCCESS_MESSAGES } from '@synapse/shared';
import { ItemType, ItemStatus } from '@prisma/client';

const captureLinkSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(VALIDATION_LIMITS.MAX_URL_LENGTH, 'URL is too long'),
  userId: z.string().optional(),
});

export const captureLink = async (
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
    const validationResult = captureLinkSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      sendBadRequest(res, errorMessage);
      return;
    }

    const { url } = validationResult.data;

    // Extract domain for initial title
    const domain = new URL(url).hostname.replace('www.', '');

    // Create item in database
    const item = await prisma.item.create({
      data: {
        userId,
        type: ItemType.ARTICLE,
        status: ItemStatus.PENDING,
        sourceUrl: url,
        title: `Link from ${domain}`,
        content: {
          create: {
            html: `<a href="${url}" target="_blank">${url}</a>`,
          },
        },
      },
      include: {
        content: true,
      },
    });

    logger.info(`Link item created: ${item.id} - ${url}`);

    // Queue background job for processing
    try {
      const { queueItemProcessing } = await import('../config/queue.js');
      await queueItemProcessing(item.id, 'link');
      logger.info(`Job queued for link: ${item.id}`);
    } catch (queueError) {
      logger.error('Failed to queue job:', queueError);
    }

    sendCreated(res, {
      itemId: item.id,
      status: item.status,
    }, SUCCESS_MESSAGES.ITEM_CREATED);

  } catch (error) {
    logger.error('Error capturing link:', error);
    next(error);
  }
};

