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

