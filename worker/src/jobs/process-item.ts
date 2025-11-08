// Goal: Process items - fetch content, generate summary, create embeddings
// Steps: Fetch item → Process based on type → Update status

import { Job } from 'bullmq';
import { ItemStatus } from '@prisma/client';
import type { ProcessItemJobData } from '../queue/index.js';
import prisma from '../config/prisma.js';

export async function processItemJob(job: Job<ProcessItemJobData>): Promise<void> {
  const { itemId, type } = job.data;

  console.log(`[Worker] Processing item ${itemId} (type: ${type})`);

  try {
    // Update status to PROCESSING
    await prisma.item.update({
      where: { id: itemId },
      data: { status: ItemStatus.PROCESSING },
    });

    // Fetch item with content
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        content: true,
        media: true,
      },
    });

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    console.log(`[Worker] Found item: ${item.title?.substring(0, 50)}...`);

    // Process based on type
    if (type === 'text' && item.content?.text) {
      await processTextItem(itemId, item.content.text);
    } else if (type === 'link' && item.sourceUrl) {
      await processLinkItem(itemId, item.sourceUrl);
    } else if (type === 'file') {
      await processFileItem(itemId, item);
    }

    // Generate and store embedding
    try {
      await generateAndStoreEmbedding(itemId, item);
    } catch (embeddingError: any) {
      // If it's a "no models" error, just warn and continue
      if (embeddingError?.message?.includes('No models loaded') || 
          embeddingError?.message?.includes('no backends found')) {
        console.warn(`[Worker] ⚠️  Embedding skipped: ${embeddingError.message}`);
        console.warn(`[Worker] 💡 Item will still be saved, but search won't work until models are loaded.`);
      } else {
        console.error(`[Worker] Failed to generate embedding:`, embeddingError);
      }
      // Don't fail the whole job if embedding fails
    }

    // Mark as processed
    await prisma.item.update({
      where: { id: itemId },
      data: { status: ItemStatus.PROCESSED },
    });

    console.log(`[Worker] ✓ Item ${itemId} processed successfully`);
  } catch (error) {
    console.error(`[Worker] ✗ Error processing item ${itemId}:`, error);
    
    // Mark as failed
    await prisma.item.update({
      where: { id: itemId },
      data: { status: ItemStatus.FAILED },
    });

    throw error; // Re-throw for BullMQ to handle retries
  }
}

async function processTextItem(itemId: string, text: string): Promise<void> {
  console.log(`[Worker] Processing text item (${text.length} chars)`);

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('[Worker] ⚠️  OpenAI API key not configured - using simple summary');
    
    // Fallback to simple truncation
    const summary = text.length > 100 
      ? text.substring(0, 100) + '...'
      : text;

    await prisma.item.update({
      where: { id: itemId },
      data: { summary },
    });

    console.log(`[Worker] Simple summary generated: ${summary.substring(0, 50)}...`);
    return;
  }

  // Use OpenAI for analysis
  try {
    const { analyzeText } = await import('../services/openai.js');
    const analysis = await analyzeText(text);

    await prisma.item.update({
      where: { id: itemId },
      data: {
        summary: analysis.summary,
        type: analysis.type,
      },
    });

    console.log(`[Worker] ✨ AI Summary: ${analysis.summary.substring(0, 50)}...`);
    console.log(`[Worker] 🏷️  Classified as: ${analysis.type} (confidence: ${analysis.confidence})`);
  } catch (error) {
    console.error('[Worker] Error using OpenAI, falling back to simple summary:', error);
    
    const summary = text.length > 100 
      ? text.substring(0, 100) + '...'
      : text;

    await prisma.item.update({
      where: { id: itemId },
      data: { summary },
    });
  }
}

async function generateAndStoreEmbedding(itemId: string, item: any): Promise<void> {
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('[Worker] ⚠️  Skipping embeddings (OpenAI not configured)');
    return;
  }

  try {
    console.log(`[Worker] Generating embedding for item ${itemId}`);

    // Build comprehensive text for embedding with better structure
    const textParts: string[] = [];
    
    // Add type context for better semantic understanding
    if (item.type) {
      textParts.push(`Type: ${item.type}`);
    }
    
    // Title is most important - give it prominence
    if (item.title) {
      textParts.push(`Title: ${item.title}`);
    }
    
    // Summary provides high-level context
    if (item.summary) {
      textParts.push(`Summary: ${item.summary}`);
    }
    
    // Source URL for articles/links provides domain context
    if (item.sourceUrl) {
      try {
        const domain = new URL(item.sourceUrl).hostname.replace('www.', '');
        textParts.push(`Source: ${domain}`);
      } catch {
        // Invalid URL, skip
      }
    }
    
    // Main content - prioritize based on type
    if (item.content?.text) {
      // For notes, text is primary content
      if (item.type === 'NOTE') {
        textParts.push(`Content: ${item.content.text}`);
      } else {
        textParts.push(`Text: ${item.content.text}`);
      }
    }
    
    // OCR text from images is very valuable for search
    if (item.content?.ocrText) {
      textParts.push(`Image Text: ${item.content.ocrText}`);
    }
    
    // Vision description is crucial for images without text
    // Check if the text content is actually a vision description (starts with description-like text)
    if (item.content?.text && item.type === 'IMAGE' && 
        !item.content.text.startsWith('Image file:') && 
        !item.content.text.startsWith('http')) {
      // Likely a vision description
      textParts.push(`Image Description: ${item.content.text}`);
    }
    
    // Include HTML content if available (for articles)
    if (item.content?.html && item.type === 'ARTICLE') {
      // Extract text from HTML (simple version)
      const htmlText = item.content.html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (htmlText && htmlText.length > 20) {
        textParts.push(`Article Content: ${htmlText.substring(0, 2000)}`);
      }
    }

    // Combine with better formatting for semantic understanding
    const textToEmbed = textParts
      .filter(part => part && part.trim().length > 0)
      .join('\n\n')
      .substring(0, 8000); // Limit length for embedding models

    if (!textToEmbed.trim()) {
      console.log('[Worker] No text to embed, skipping');
      return;
    }

    console.log(`[Worker] Embedding text (${textToEmbed.length} chars): ${textToEmbed.substring(0, 200)}...`);

    // Generate embedding using OpenAI service
    const { generateEmbedding } = await import('../services/openai.js');
    const embedding = await generateEmbedding(textToEmbed);

    // Store in vector database (via API call to server)
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, embedding }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store embedding: ${response.statusText}`);
    }

    console.log(`[Worker] ✓ Embedding stored for item ${itemId}`);
  } catch (error) {
    console.error(`[Worker] Error generating embedding:`, error);
    throw error;
  }
}

async function processLinkItem(itemId: string, url: string): Promise<void> {
  console.log(`[Worker] Processing link item: ${url}`);

  try {
    const { fetchLinkMetadata, extractContentText } = await import('../services/metadata.js');
    
    // Fetch metadata
    const metadata = await fetchLinkMetadata(url);

    // Generate summary from description or content
    let summary = metadata.description || '';
    
    if (!summary && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      // Try to generate summary from page content
      try {
        const response = await fetch(url);
        const html = await response.text();
        const content = extractContentText(html);
        
        if (content) {
          const { generateSummary } = await import('../services/openai.js');
          summary = await generateSummary(content);
        }
      } catch (error) {
        console.log('[Worker] Could not extract content for summary:', error);
      }
    }

    // Update item with metadata
    await prisma.item.update({
      where: { id: itemId },
      data: {
        title: metadata.title,
        summary: summary || metadata.description || metadata.title,
        content: {
          update: {
            html: `<a href="${url}" target="_blank">${metadata.title}</a>`,
          },
        },
      },
    });

    // Store image if available
    if (metadata.image) {
      try {
        await prisma.media.create({
          data: {
            itemId,
            s3Url: metadata.image,
            mediaType: 'IMAGE',
          },
        });
        console.log(`[Worker] 🖼️  Stored preview image`);
      } catch (error) {
        console.log('[Worker] Could not store image:', error);
      }
    }

    console.log(`[Worker] ✓ Link processed: ${metadata.title}`);
    if (metadata.siteName) {
      console.log(`[Worker] 🌐 Site: ${metadata.siteName}`);
    }
  } catch (error) {
    console.error('[Worker] Error processing link:', error);
    
    // Fallback to URL as title
    await prisma.item.update({
      where: { id: itemId },
      data: {
        title: url,
        summary: `Link: ${url}`,
      },
    });
  }
}

async function processFileItem(itemId: string, item: any): Promise<void> {
  console.log(`[Worker] Processing file item: ${itemId}`);
  
  try {
    // Check if it's an image that needs OCR
    const isImage = item.type === 'IMAGE' || item.media?.some((m: any) => m.mediaType === 'IMAGE');
    
    if (isImage && item.media && item.media.length > 0) {
      let imageUrl = item.media[0].s3Url;
      console.log(`[Worker] Extracting text from image: ${imageUrl}`);
      
      // Handle local file paths - convert to full URL if needed
      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = `http://localhost:3001${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        // If it's a relative path, assume it's local
        imageUrl = `http://localhost:3001/uploads/${imageUrl.split('/').pop()}`;
      }
      
      try {
        // Try to use Tesseract.js for OCR if available
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        
        // Download image from storage
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Run OCR and vision description in parallel for better performance
        const [ocrResult, imageDescription] = await Promise.allSettled([
          worker.recognize(Buffer.from(imageBuffer)),
          (async () => {
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
              try {
                const { describeImage } = await import('../services/openai.js');
                return await describeImage(imageUrl);
              } catch (error) {
                console.log('[Worker] Could not describe image with vision model:', error);
                return '';
              }
            }
            return '';
          })(),
        ]);
        
        await worker.terminate();
        
        const text = ocrResult.status === 'fulfilled' ? ocrResult.value.data.text : '';
        const visionDescription = imageDescription.status === 'fulfilled' && typeof imageDescription.value === 'string' 
          ? imageDescription.value 
          : '';

        // Combine OCR text and vision description for better search
        const combinedDescription = visionDescription 
          ? (text ? `${text}\n\n${visionDescription}` : visionDescription)
          : text;

        if (text && text.trim()) {
          console.log(`[Worker] ✓ OCR extracted ${text.length} characters`);
          
          // Update content with OCR text
          await prisma.content.upsert({
            where: { itemId },
            update: { 
              ocrText: text.trim(),
              // Store vision description in text field if available
              text: visionDescription || `Image file: ${item.title}`,
            },
            create: {
              itemId,
              ocrText: text.trim(),
              text: visionDescription || `Image file: ${item.title}`,
            },
          });
          
          // Generate summary from combined text if OpenAI is available
          if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
            try {
              const { generateSummary } = await import('../services/openai.js');
              const summaryText = combinedDescription || text.trim();
              const summary = await generateSummary(summaryText.substring(0, 2000));
              
              await prisma.item.update({
                where: { id: itemId },
                data: { summary },
              });
              
              console.log(`[Worker] ✓ Generated summary from OCR and vision`);
            } catch (error) {
              console.log('[Worker] Could not generate summary:', error);
            }
          }
        } else {
          console.log('[Worker] No text found in image');
          
          // If no OCR text but we have a vision description, use that
          if (visionDescription) {
            try {
              await prisma.content.upsert({
                where: { itemId },
                update: { text: visionDescription },
                create: {
                  itemId,
                  text: visionDescription,
                },
              });
              
              await prisma.item.update({
                where: { id: itemId },
                data: { summary: visionDescription },
              });
              
              console.log(`[Worker] ✓ Stored image description from vision model`);
            } catch (error) {
              console.log('[Worker] Could not store image description:', error);
            }
          }
        }
        
        // Note: Vision description is already stored in content.text or summary above
        // It will be picked up by generateAndStoreEmbedding automatically
      } catch (error: any) {
        // If Tesseract fails, log and continue (item will still be saved)
        console.warn(`[Worker] OCR failed (this is okay): ${error.message}`);
        console.warn(`[Worker] Image will still be saved, just without OCR text`);
      }
    } else {
      console.log(`[Worker] File is not an image, skipping OCR`);
    }
    
    console.log(`[Worker] ✓ File processed: ${item.title}`);
  } catch (error) {
    console.error(`[Worker] Error processing file:`, error);
    // Don't throw - allow item to be saved even if processing fails
  }
}

