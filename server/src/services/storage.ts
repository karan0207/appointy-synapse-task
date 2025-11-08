// Goal: Handle file uploads to S3 or local storage
// For MVP: Store files locally, with S3 support ready

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const USE_S3 = process.env.S3_BUCKET_NAME && process.env.S3_ACCESS_KEY_ID;

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Upload file to storage (local or S3)
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<UploadResult> {
  if (USE_S3) {
    return uploadToS3(buffer, originalName, mimetype);
  } else {
    return uploadLocal(buffer, originalName, mimetype);
  }
}

/**
 * Upload to local filesystem (MVP fallback)
 */
async function uploadLocal(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<UploadResult> {
  await ensureUploadDir();

  const ext = path.extname(originalName);
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filepath, buffer);

  console.log(`[Storage] ✓ File saved locally: ${filename}`);

  return {
    url: `/uploads/${filename}`,
    filename,
    size: buffer.length,
    mimetype,
  };
}

/**
 * Upload to S3 (if configured)
 */
async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<UploadResult> {
  // TODO: Implement S3 upload when keys are configured
  // For now, fall back to local storage
  console.log('[Storage] S3 configured but not implemented, using local storage');
  return uploadLocal(buffer, originalName, mimetype);

  /*
  // S3 implementation (when ready):
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.S3_ENDPOINT,
  });

  const ext = path.extname(originalName);
  const filename = `${randomUUID()}${ext}`;
  const key = `uploads/${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = process.env.S3_ENDPOINT
    ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${key}`
    : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  return { url, filename, size: buffer.length, mimetype };
  */
}

/**
 * Get file extension and MIME type category
 */
export function getFileCategory(mimetype: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
  if (mimetype.startsWith('image/')) return 'IMAGE';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

