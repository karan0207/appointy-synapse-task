// Goal: Handle file upload requests
// Steps: Validate file → Upload to storage → Store in DB → Queue job

import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { sendCreated, sendBadRequest } from '../utils/response.js';
import { SUCCESS_MESSAGES } from '@synapse/shared';
import { ItemType, ItemStatus } from '@prisma/client';
import { uploadFile, getFileCategory } from '../services/storage.js';

export const captureFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      sendBadRequest(res, 'No file uploaded');
      return;
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (size > MAX_SIZE) {
      sendBadRequest(res, 'File size exceeds 10MB limit');
      return;
    }

    const userId = req.session.userId;
    
    if (!userId) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    logger.info(`File upload: ${originalname} (${mimetype}, ${size} bytes)`);

    // Upload file to storage
    const uploadResult = await uploadFile(buffer, originalname, mimetype);

    // Determine item type based on MIME type
    const isImage = mimetype.startsWith('image/');
    const itemType = isImage ? ItemType.IMAGE : ItemType.FILE;

    // Create item in database
    const item = await prisma.item.create({
      data: {
        userId,
        type: itemType,
        status: ItemStatus.PENDING,
        title: originalname,
        content: {
          create: {
            text: `Uploaded file: ${originalname}`,
          },
        },
        media: {
          create: {
            s3Url: uploadResult.url,
            mediaType: getFileCategory(mimetype),
          },
        },
      },
      include: {
        content: true,
        media: true,
      },
    });

    logger.info(`File item created: ${item.id} - ${originalname}`);

    // Queue background job for processing
    try {
      const { queueItemProcessing } = await import('../config/queue.js');
      await queueItemProcessing(item.id, 'file');
      logger.info(`Job queued for file: ${item.id}`);
    } catch (queueError) {
      logger.error('Failed to queue job:', queueError);
    }

    sendCreated(
      res,
      {
        itemId: item.id,
        status: item.status,
        fileUrl: uploadResult.url,
      },
      SUCCESS_MESSAGES.ITEM_CREATED
    );
  } catch (error) {
    logger.error('Error capturing file:', error);
    next(error);
  }
};

