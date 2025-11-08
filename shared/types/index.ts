// Goal: Export shared TypeScript types for use across packages
// Types are generated from Prisma schema and extended as needed

export type { User, Item, Content, Media, Embedding } from '@prisma/client';
export { ItemType, ItemStatus, MediaType } from '@prisma/client';

// API Request/Response types
export interface CaptureTextRequest {
  text: string;
  userId: string;
}

export interface CaptureLinkRequest {
  url: string;
  userId: string;
}

export interface CaptureFileRequest {
  file: File;
  userId: string;
}

export interface CaptureResponse {
  itemId: string;
  status: ItemStatus;
  message: string;
}

export interface SearchRequest {
  query: string;
  userId: string;
  filters?: {
    type?: ItemType[];
    dateFrom?: Date;
    dateTo?: Date;
  };
  limit?: number;
}

export interface SearchResult {
  item: Item;
  relevanceScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

