// Goal: AI integration for summaries and classification
// Supports OpenAI and LocalAI (OpenAI-compatible)

import OpenAI from 'openai';
import { ItemType } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'not-needed-for-localai',
  baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
});

export interface TextAnalysis {
  summary: string;
  type: ItemType;
  confidence: number;
}

/**
 * Generate a concise summary of the text using OpenAI
 */
export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries. Summarize the following text in 1-2 sentences, capturing the key points.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() || text.substring(0, 100) + '...';
  } catch (error) {
    console.error('[OpenAI] Error generating summary:', error);
    // Fallback to simple truncation
    return text.substring(0, 100) + '...';
  }
}

/**
 * Classify the text into an item type using OpenAI
 */
export async function classifyText(text: string): Promise<{ type: ItemType; confidence: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a classifier that categorizes text into one of these types: NOTE, ARTICLE, PRODUCT, TODO, IMAGE, FILE.

NOTE: Personal notes, thoughts, ideas, or reminders
ARTICLE: Long-form content, blog posts, news articles
PRODUCT: Product descriptions, shopping items, recommendations
TODO: Tasks, action items, checklists
IMAGE: Descriptions of images or visual content
FILE: References to documents or files

Respond with ONLY the type name (e.g., "NOTE" or "ARTICLE").`,
        },
        {
          role: 'user',
          content: text.substring(0, 500), // Limit to first 500 chars for classification
        },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const classification = response.choices[0]?.message?.content?.trim().toUpperCase() || 'NOTE';
    
    // Validate classification
    const validTypes: ItemType[] = ['NOTE', 'ARTICLE', 'PRODUCT', 'TODO', 'IMAGE', 'FILE'];
    const type = validTypes.includes(classification as ItemType) 
      ? (classification as ItemType)
      : ItemType.NOTE;

    return {
      type,
      confidence: 0.8, // Could calculate from OpenAI response metadata
    };
  } catch (error) {
    console.error('[OpenAI] Error classifying text:', error);
    return {
      type: ItemType.NOTE,
      confidence: 0.5,
    };
  }
}

/**
 * Analyze text - generate summary and classify type
 */
export async function analyzeText(text: string): Promise<TextAnalysis> {
  const [summary, classification] = await Promise.all([
    generateSummary(text),
    classifyText(text),
  ]);

  return {
    summary,
    type: classification.type,
    confidence: classification.confidence,
  };
}

/**
 * Describe what's in an image using vision models
 * Supports both OpenAI (gpt-4o) and LocalAI (llava-vision)
 * Falls back to OpenAI if LocalAI is unavailable (when OPENAI_API_KEY is provided)
 */
export async function describeImage(imageUrl: string): Promise<string> {
  try {
    // Check if we're using LocalAI
    const isLocalAI = process.env.OPENAI_API_BASE?.includes('localhost:8080') ||
                      process.env.OPENAI_API_BASE?.includes('127.0.0.1:8080');
    
    // Check if OpenAI API key is available for fallback
    const hasOpenAIKey = process.env.OPENAI_API_KEY && 
                         process.env.OPENAI_API_KEY !== 'not-needed-for-localai' &&
                         process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    let response;

    // Try LocalAI first if configured
    if (isLocalAI) {
      console.log('[OpenAI] Attempting LocalAI vision model (llava-vision)');

      try {
        response = await openai.chat.completions.create({
          model: 'llava-vision',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe what you see in this image in detail, including objects, people, animals, text, colors, and any notable features. Be specific and concise (2-3 sentences).',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        });
        
        const description = response.choices[0]?.message?.content?.trim() || '';
        console.log(`[OpenAI] ✓ Image described with LocalAI: ${description.substring(0, 100)}...`);
        return description;
      } catch (localaiError: any) {
        // If LocalAI fails, try OpenAI fallback if available
        if (hasOpenAIKey && !isLocalAI) {
          // We're already using OpenAI base URL, so this shouldn't happen
          throw localaiError;
        }
        
        // Check if it's a model not found error
        const isModelNotFound = localaiError?.message?.includes('not found') ||
                                localaiError?.message?.includes('llava-vision') ||
                                localaiError?.message?.includes('no backends found') ||
                                localaiError?.message?.includes('could not load model');
        
        if (isModelNotFound && hasOpenAIKey) {
          console.warn('[OpenAI] ⚠️  LocalAI vision model not available, falling back to OpenAI');
          // Fall through to OpenAI fallback
        } else if (isModelNotFound) {
          console.warn('[OpenAI] ⚠️  LocalAI vision model not loaded');
          console.warn('[OpenAI] 💡 Options:');
          console.warn('[OpenAI]    - Run setup script: ./setup-localai-models.ps1 (or .sh)');
          console.warn('[OpenAI]    - Or set OPENAI_API_KEY for OpenAI fallback');
          return '';
        } else {
          // Other error, try OpenAI fallback if available
          if (hasOpenAIKey) {
            console.warn('[OpenAI] ⚠️  LocalAI vision failed, falling back to OpenAI');
            // Fall through to OpenAI fallback
          } else {
            throw localaiError;
          }
        }
      }
    }

    // Use OpenAI (either as primary or fallback)
    if (hasOpenAIKey) {
      console.log('[OpenAI] Using OpenAI vision model (gpt-4o)');

      // Create OpenAI client with original API endpoint
      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      });

      response = await openaiClient.chat.completions.create({
        model: 'gpt-4o', // or 'gpt-4-vision-preview' for older models
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that describes images in detail. Describe what you see in the image, including objects, people, animals, text, colors, and any notable features. Be specific and concise (2-3 sentences).',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe what you see in this image in detail.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const description = response.choices[0]?.message?.content?.trim() || '';
      console.log(`[OpenAI] ✓ Image described with OpenAI: ${description.substring(0, 100)}...`);
      return description;
    } else {
      console.warn('[OpenAI] ⚠️  No vision model available');
      console.warn('[OpenAI] 💡 Set OPENAI_API_KEY to use OpenAI vision, or configure LocalAI');
      return '';
    }
  } catch (error: any) {
    console.error('[OpenAI] Error describing image:', error);
    
    // Provide helpful error messages
    if (error?.message?.includes('gpt-4o') || error?.message?.includes('vision')) {
      console.warn('[OpenAI] 💡 OpenAI vision requires:');
      console.warn('[OpenAI]    - Valid OPENAI_API_KEY');
      console.warn('[OpenAI]    - API access to gpt-4o model');
    }
    
    return '';
  }
}

/**
 * Generate embeddings for semantic search (using OpenAI/LocalAI)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use LocalAI-compatible model name if using LocalAI
    const isLocalAI = process.env.OPENAI_API_BASE?.includes('localhost:8080') || 
                      process.env.OPENAI_API_BASE?.includes('127.0.0.1:8080');
    const modelName = isLocalAI ? 'nomic-embed-text' : 'text-embedding-3-small';
    
    const response = await openai.embeddings.create({
      model: modelName,
      input: text.substring(0, 8000), // Limit input length
    });

    return response.data[0].embedding;
  } catch (error: any) {
    // If LocalAI returns "no backends found", it means no models are loaded
    if (error?.error?.message?.includes('no backends found') || 
        error?.message?.includes('no backends found')) {
      console.warn('[OpenAI] ⚠️  LocalAI has no models loaded. Embeddings will be skipped.');
      console.warn('[OpenAI] 💡 To enable embeddings, download a model:');
      console.warn('[OpenAI]    docker exec -it synapse-localai bash');
      console.warn('[OpenAI]    curl -L https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf -o /models/nomic-embed-text.gguf');
      throw new Error('LocalAI: No models loaded. Please download an embedding model.');
    }
    console.error('[OpenAI] Error generating embedding:', error);
    throw error;
  }
}

